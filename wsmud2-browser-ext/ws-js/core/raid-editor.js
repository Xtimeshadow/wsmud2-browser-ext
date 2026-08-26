// ============================================================
// raid-editor.js —— 流程编辑器（语法高亮 + 自动补全）
// ------------------------------------------------------------
// createRaidEditor(textareaId, options) 创建完整的语法高亮编辑器，
// 包含行号、括号匹配、自动补全、智能缩进、自动闭合括号。
// 依赖 raid-autocomplete.js 和 raid-syntax.js。
// ============================================================
'use strict';

/**
 * Create a syntax-highlighted code editor with autocomplete and Tab indentation.
 * @param {string} textareaId - The ID of the textarea element
 * @param {object} [options] - Optional height/width overrides
 */
function createRaidEditor(textareaId, options) {
    var textarea = document.getElementById(textareaId);
    if (!textarea) return null;

    if (document.getElementById(textareaId + '-editor')) {
        return document.getElementById(textareaId + '-editor');
    }

    options = options || {};
    var height = options.height || '30rem';
    var width = options.width || 'calc(100% - 4em)';

    var container = document.createElement('div');
    container.id = textareaId + '-editor';
    container.style.cssText = 'position:relative;height:' + height + ';width:' + width + ';margin:0 2em;text-align:left;';

    var gutter = document.createElement('pre');
    gutter.className = 'raid-editor-lines';
    gutter.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:37px;margin:0;padding:6px 6px 6px 0;overflow:hidden;font-size:0.8em;font-family:JetBrains Mono,monospace;line-height:1.4;text-align:right;color:#666;background:#14141f;pointer-events:none;z-index:3;border-right:1px solid #3a3a4a;box-sizing:border-box;';

    var highlight = document.createElement('pre');
    highlight.className = 'raid-editor-highlight';
    highlight.style.cssText = 'position:absolute;top:0;left:37px;right:0;bottom:0;margin:0;padding:6px 8px;overflow:auto;font-size:0.8em;font-family:JetBrains Mono,monospace;line-height:1.4;white-space:pre-wrap;word-wrap:break-word;background:#1a1a2e;color:#ccc;pointer-events:none;z-index:1;border:1px solid #555;border-radius:4px;text-align:left;box-sizing:border-box;';

    textarea.style.cssText = 'display:block;position:absolute;left:37px;top:0;right:0;bottom:0;width:auto;height:auto;margin:0;padding:6px 8px;font-size:0.8em;font-family:JetBrains Mono,monospace;line-height:1.4;background:transparent;color:transparent;caret-color:#fff;z-index:2;border:1px solid #555;border-radius:4px;resize:none;outline:none;overflow:auto;text-align:left;box-sizing:border-box;';

    textarea.parentNode.insertBefore(container, textarea);
    container.appendChild(gutter);
    container.appendChild(highlight);
    container.appendChild(textarea);

    //---------------------------------------------------------------------------
    //  Autocomplete Dropdown
    //---------------------------------------------------------------------------

    var autocomplete = document.createElement('div');
    autocomplete.id = textareaId + '-autocomplete';
    autocomplete.style.cssText = 'position:absolute;z-index:10;display:none;background:#1a1a2e;border:1px solid #555;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.5);max-height:240px;overflow-y:auto;font-size:0.8em;font-family:JetBrains Mono,monospace;min-width:200px;';
    container.appendChild(autocomplete);

    var acItems = [];
    var acIndex = -1;
    var acPrefix = '';
    var acOpen = false;
    var acTriggerChar = '';
    var skipNextInput = false;

    function getCursorWord(textarea) {
        var pos = textarea.selectionStart;
        var val = textarea.value;
        var start = pos;
        while (start > 0 && /[\w@#\[\]\(:]/.test(val[start - 1])) {
            start--;
        }
        var word = val.substring(start, pos);
        return { word: word, start: start, end: pos };
    }

    function getCaretPixelPos(textarea) {
        var mirror = document.createElement('div');
        mirror.style.cssText = 'position:absolute;visibility:hidden;white-space:pre-wrap;word-wrap:break-word;overflow:hidden;font-size:0.8em;font-family:JetBrains Mono,monospace;line-height:1.4;padding:6px 8px;width:' + textarea.clientWidth + 'px;';
        mirror.textContent = textarea.value.substring(0, textarea.selectionStart);
        document.body.appendChild(mirror);
        var lines = mirror.textContent.split('\n');
        var lineCount = lines.length;
        var lastLine = lines[lines.length - 1];
        var lineHeight = 18;
        var charWidth = 7.5;
        var top = (lineCount - 1) * lineHeight - textarea.scrollTop;
        var left = lastLine.length * charWidth;
        document.body.removeChild(mirror);
        if (top < 0) top = 0;
        return { top: top, left: left };
    }

    function showAutocomplete() {
        if (acItems.length === 0) { hideAutocomplete(); return; }
        acIndex = 0;
        acOpen = true;
        renderAutocomplete();
        var pos = getCaretPixelPos(textarea);
        autocomplete.style.display = 'block';
        autocomplete.style.top = (pos.top + 22) + 'px';
        autocomplete.style.left = Math.min(pos.left + 46, container.clientWidth - 220) + 'px';
        var sel = autocomplete.querySelector('.raid-ac-selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function hideAutocomplete() {
        acOpen = false;
        acItems = [];
        acIndex = -1;
        acPrefix = '';
        acTriggerChar = '';
        autocomplete.style.display = 'none';
    }

    function smartEnter() {
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var val = textarea.value;

        if (start !== end) {
            var nv0 = val.substring(0, start) + '\n' + val.substring(end);
            textarea.value = nv0;
            textarea.setSelectionRange(start + 1, start + 1);
            syncHighlight();
            return;
        }

        var lineStart = val.lastIndexOf('\n', start - 1) + 1;
        var lineEnd = val.indexOf('\n', start);
        if (lineEnd === -1) lineEnd = val.length;
        var fullLine = val.substring(lineStart, lineEnd);
        var before = val.substring(lineStart, start);
        var indent = (before.match(/^[ \t]*/) || [''])[0];
        var content = fullLine.substring(indent.length);

        if (indent.length > 0 && content.trim() === '' && start === lineEnd) {
            var nvA = val.substring(0, lineStart) + val.substring(lineEnd);
            textarea.value = nvA;
            textarea.setSelectionRange(lineStart, lineStart);
            syncHighlight();
            return;
        }

        var isBlockHeader = /^\[(?:if|else if|else|while|for|foreach|repeat)\]/.test(fullLine.trim());
        var nextIndent = indent + (isBlockHeader ? '    ' : '');

        var nv = val.substring(0, start) + '\n' + nextIndent + val.substring(end);
        textarea.value = nv;
        textarea.setSelectionRange(start + 1 + nextIndent.length, start + 1 + nextIndent.length);
        syncHighlight();
    }

    function renderAutocomplete() {
        var html = '';
        for (var i = 0; i < acItems.length; i++) {
            var item = acItems[i];
            var cls = i === acIndex ? 'raid-ac-selected' : '';
            html += '<div class="raid-ac-item ' + cls + '" data-index="' + i + '">';
            html += '<span class="raid-ac-label">' + escapeHtml(item.label) + '</span>';
            if (item.detail) {
                html += '<span class="raid-ac-detail">' + escapeHtml(item.detail) + '</span>';
            }
            html += '</div>';
        }
        autocomplete.innerHTML = html;
    }

    function escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function applyAutocomplete() {
        if (!acOpen || acIndex < 0 || acIndex >= acItems.length) return;
        var item = acItems[acIndex];
        var val = textarea.value;
        var cursor = textarea.selectionStart;
        var start = cursor - acPrefix.length;
        if (acTriggerChar && val.substring(start - 1, start) === acTriggerChar) {
            start -= 1;
        }
        var newVal = val.substring(0, start) + item.insert + val.substring(cursor);
        var newPos = start + item.insert.length;

        var trimEnd = item.insert.replace(/\s+$/, '');
        var lastChar = trimEnd.charAt(trimEnd.length - 1);
        if (lastChar === ')' || lastChar === ']' || lastChar === '}') {
            var checkPos = start + trimEnd.length;
            while (newVal.charAt(checkPos) === ' ') checkPos++;
            if (newVal.charAt(checkPos) === lastChar) {
                newVal = newVal.substring(0, checkPos) + newVal.substring(checkPos + 1);
                newPos = checkPos;
            }
        }

        if (lastChar === ']' && newVal.charAt(newPos) && newVal.charAt(newPos) !== ' ') {
            newVal = newVal.substring(0, newPos) + ' ' + newVal.substring(newPos);
            newPos++;
        }

        textarea.value = newVal;
        textarea.setSelectionRange(newPos, newPos);
        hideAutocomplete();
        syncHighlight();
        skipNextInput = true;
        var evt = new Event('input', { bubbles: true });
        textarea.dispatchEvent(evt);
    }

    function selectNext() {
        if (!acOpen || acItems.length === 0) return;
        acIndex = (acIndex + 1) % acItems.length;
        renderAutocomplete();
        var sel = autocomplete.querySelector('.raid-ac-selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function selectPrev() {
        if (!acOpen || acItems.length === 0) return;
        acIndex = (acIndex - 1 + acItems.length) % acItems.length;
        renderAutocomplete();
        var sel = autocomplete.querySelector('.raid-ac-selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function triggerAutocomplete(cursorWord) {
        var word = cursorWord.word;
        acPrefix = word;
        acTriggerChar = '';

        if (word.indexOf('@') === 0) {
            acItems = RaidAutoComplete.cmds.filter(function (c) {
                return c.label.toLowerCase().indexOf(word.toLowerCase()) === 0;
            });
        } else if (word.indexOf('#') === 0) {
            acItems = RaidAutoComplete.dirs.filter(function (d) {
                return d.label.toLowerCase().indexOf(word.toLowerCase()) === 0;
            });
        } else if (word.indexOf('[') === 0) {
            acItems = RaidAutoComplete.ctrls.filter(function (c) {
                return c.label.toLowerCase().indexOf(word.toLowerCase()) === 0;
            });
        } else if (word.indexOf('(') === 0) {
            acItems = RaidAutoComplete.vars.filter(function (v) {
                return v.label.toLowerCase().indexOf(word.toLowerCase()) === 0;
            });
        } else {
            acItems = RaidAutoComplete.match(word || '');
        }

        if (acItems.length > 0) {
            showAutocomplete();
        } else {
            hideAutocomplete();
        }
    }

    //---------------------------------------------------------------------------
    //  Keyboard Event Handling
    //---------------------------------------------------------------------------

    textarea.addEventListener('keydown', function (e) {
        var key = e.key;

        if (key === 'Tab') {
            e.preventDefault();
            if (acOpen) {
                applyAutocomplete();
            }
            return;
        }

        if (key === 'Backspace' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            var bsStart = textarea.selectionStart;
            var bsEnd = textarea.selectionEnd;
            if (bsStart === bsEnd && bsStart > 0) {
                var openCh = textarea.value[bsStart - 1];
                var closeCh = openCh === '(' ? ')' : openCh === '[' ? ']' : openCh === '{' ? '}' : '';
                if (closeCh && textarea.value[bsStart] === closeCh) {
                    e.preventDefault();
                    var nv = textarea.value.substring(0, bsStart - 1) + textarea.value.substring(bsStart + 1);
                    textarea.value = nv;
                    textarea.setSelectionRange(bsStart - 1, bsStart - 1);
                    syncHighlight();
                    return;
                }
            }
        }

        var pairs = {
            '(': ')', '[': ']', '{': '}',
            '"': '"', "'": "'",
            '\u300C': '\u300D', '\u3010': '\u3011'
        };
        var close = pairs[key];
        if (close) {
            e.preventDefault();
            var start = textarea.selectionStart;
            var end = textarea.selectionEnd;
            var val = textarea.value;

            if ((key === '"' || key === "'") && start === end) {
                var charBefore = val[start - 1] || '';
                var charAfter = val[start] || '';
                if (charBefore.match(/\w/) && charAfter.match(/\w/)) {
                    textarea.value = val.substring(0, start) + key + val.substring(end);
                    textarea.setSelectionRange(start + 1, start + 1);
                    syncHighlight();
                    var evt = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(evt);
                    return;
                }
                if (val[start] === key) {
                    textarea.setSelectionRange(start + 1, start + 1);
                    return;
                }
            }

            if (start !== end) {
                var newVal = val.substring(0, start) + key + val.substring(start, end) + close + val.substring(end);
                textarea.value = newVal;
                textarea.setSelectionRange(end + 1, end + 1);
            } else {
                var newVal = val.substring(0, start) + key + close + val.substring(end);
                textarea.value = newVal;
                textarea.setSelectionRange(start + 1, start + 1);
            }
            syncHighlight();
            var evt = new Event('input', { bubbles: true });
            textarea.dispatchEvent(evt);
            return;
        }

        if ((key === ')' || key === ']' || key === '}') && !e.ctrlKey && !e.altKey && !e.metaKey) {
            var selStart = textarea.selectionStart;
            if (selStart === textarea.selectionEnd && textarea.value[selStart] === key) {
                e.preventDefault();
                textarea.setSelectionRange(selStart + 1, selStart + 1);
                return;
            }
        }

        if (key === 'Enter' && acOpen) { e.preventDefault(); applyAutocomplete(); return; }
        if (key === 'ArrowDown' && acOpen) { e.preventDefault(); selectNext(); return; }
        if (key === 'ArrowUp' && acOpen) { e.preventDefault(); selectPrev(); return; }
        if (key === 'Escape' && acOpen) { e.preventDefault(); hideAutocomplete(); return; }

        if (key === 'Enter' && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            smartEnter();
            return;
        }

        if (key === ' ' && e.ctrlKey) {
            e.preventDefault();
            triggerAutocomplete(getCursorWord(textarea));
            return;
        }

        setTimeout(syncHighlight, 0);
    });

    textarea.addEventListener('input', function () {
        if (skipNextInput) { skipNextInput = false; return; }
        var cw = getCursorWord(textarea);
        var word = cw.word;

        if (word === '@' || word === '#' || word === '[' || word === '(') {
            triggerAutocomplete(cw);
            return;
        }

        if (acOpen) {
            if (cw.start < textarea.selectionStart) {
                triggerAutocomplete(cw);
            } else {
                hideAutocomplete();
            }
            return;
        }

        if (word.length >= 2) {
            triggerAutocomplete(cw);
        }
    });

    textarea.addEventListener('blur', function () {
        setTimeout(hideAutocomplete, 200);
    });

    autocomplete.addEventListener('mousedown', function (e) {
        e.preventDefault();
        var target = e.target;
        while (target && target !== autocomplete) {
            if (target.classList.contains('raid-ac-item')) {
                var idx = parseInt(target.getAttribute('data-index'), 10);
                if (!isNaN(idx) && idx >= 0 && idx < acItems.length) {
                    acIndex = idx;
                    applyAutocomplete();
                }
                return;
            }
            target = target.parentNode;
        }
    });

    autocomplete.addEventListener('mouseover', function (e) {
        var target = e.target;
        while (target && target !== autocomplete) {
            if (target.classList.contains('raid-ac-item')) {
                var idx = parseInt(target.getAttribute('data-index'), 10);
                if (!isNaN(idx) && idx >= 0 && idx < acItems.length) {
                    acIndex = idx;
                    renderAutocomplete();
                }
                return;
            }
            target = target.parentNode;
        }
    });

    //---------------------------------------------------------------------------
    //  Sync functions
    //---------------------------------------------------------------------------

    function findMatchingBracket(code, cursor) {
        if (cursor > 0) {
            var ch = code[cursor - 1];
            if (ch === '(') return findMatch(code, cursor - 1, '(');
            if (ch === ')') return findMatch(code, cursor - 1, ')');
        }
        if (cursor < code.length) {
            var ch = code[cursor];
            if (ch === '(') return findMatch(code, cursor, '(');
            if (ch === ')') return findMatch(code, cursor, ')');
        }
        return null;
    }

    function findMatch(code, pos, bracket) {
        if (bracket === '(') {
            var depth = 1;
            for (var i = pos + 1; i < code.length; i++) {
                if (code[i] === '(') depth++;
                else if (code[i] === ')') {
                    depth--;
                    if (depth === 0) return { open: pos, close: i };
                }
            }
        } else {
            var depth = 1;
            for (var i = pos - 1; i >= 0; i--) {
                if (code[i] === ')') depth++;
                else if (code[i] === '(') {
                    depth--;
                    if (depth === 0) return { open: i, close: pos };
                }
            }
        }
        return null;
    }

    function addBracketHighlight(html, code, pair) {
        var result = '';
        var codeIdx = 0;
        var htmlIdx = 0;
        var doneOpen = false;
        var doneClose = false;

        while (htmlIdx < html.length) {
            var ch = html[htmlIdx];

            if (ch === '<') {
                var tagEnd = html.indexOf('>', htmlIdx);
                if (tagEnd === -1) { result += html.substring(htmlIdx); break; }
                result += html.substring(htmlIdx, tagEnd + 1);
                htmlIdx = tagEnd + 1;
                continue;
            }

            if (!doneOpen && codeIdx === pair.open) {
                result += '<span class="raid-bracket-match">';
                doneOpen = true;
            }
            if (!doneClose && codeIdx === pair.close) {
                result += '<span class="raid-bracket-match">';
                doneClose = true;
            }

            if (ch === '&') {
                var entityEnd = html.indexOf(';', htmlIdx);
                if (entityEnd === -1) { result += html.substring(htmlIdx); break; }
                result += html.substring(htmlIdx, entityEnd + 1);
                htmlIdx = entityEnd + 1;
                codeIdx++;
            } else {
                result += ch;
                htmlIdx++;
                codeIdx++;
            }

            if (doneOpen && codeIdx === pair.open + 1) {
                result += '</span>';
            }
            if (doneClose && codeIdx === pair.close + 1) {
                result += '</span>';
            }
        }

        if (htmlIdx < html.length) {
            result += html.substring(htmlIdx);
        }
        return result;
    }

    function syncHighlight() {
        var code = textarea.value;
        var cursor = textarea.selectionStart;
        var html = highlightRaidSyntax(code);

        var pair = findMatchingBracket(code, cursor);
        if (pair) {
            html = addBracketHighlight(html, code, pair);
        }

        highlight.innerHTML = html + '\n';
        renderLineNumbers();
    }

    function renderLineNumbers() {
        var lines = textarea.value.split('\n');
        if (lines.length === 0) { gutter.textContent = ''; gutter.scrollTop = 0; return; }

        var contentW = textarea.clientWidth - 14;
        if (contentW < 10) contentW = 10;

        var cs = getComputedStyle(textarea);
        var lhPx = parseFloat(cs.lineHeight);
        if (!lhPx || isNaN(lhPx) || lhPx === 0) {
            var fsPx = parseFloat(cs.fontSize) || 12.8;
            lhPx = fsPx * 1.4;
        }

        var mirror = document.createElement('div');
        mirror.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;margin:0;' +
            'padding:0;border:0;' +
            'font-size:' + cs.fontSize + ';font-family:' + cs.fontFamily +
            ';line-height:' + cs.lineHeight + ';' +
            'white-space:pre-wrap;word-wrap:break-word;' +
            'box-sizing:content-box;width:' + contentW + 'px;';
        document.body.appendChild(mirror);

        var prevH = 0;
        var kList = [];
        for (var i = 0; i < lines.length; i++) {
            mirror.textContent = (i > 0 ? '\n' : '') + (lines[i] || ' ');
            var h = mirror.getBoundingClientRect().height;
            var seg = h - prevH;
            var k = Math.max(1, Math.round((seg - 0.5) / lhPx));
            if (k < 1) k = 1;
            kList.push(k);
            prevH = h;
        }
        document.body.removeChild(mirror);

        var s = '';
        for (var i = 0; i < kList.length; i++) {
            s += (i + 1) + '\n';
            for (var j = 1; j < kList[i]; j++) { s += '\n'; }
        }
        gutter.textContent = s;
        gutter.scrollTop = textarea.scrollTop;
    }

    function syncScroll() {
        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
        gutter.scrollTop = textarea.scrollTop;
    }

    textarea.addEventListener('input', syncHighlight);
    textarea.addEventListener('scroll', syncScroll);
    textarea.addEventListener('focus', syncHighlight);
    textarea.addEventListener('keydown', function () {
        setTimeout(syncHighlight, 0);
    });
    textarea.addEventListener('keyup', function () {
        setTimeout(syncHighlight, 0);
    });
    textarea.addEventListener('click', function () {
        setTimeout(syncHighlight, 0);
    });

    syncHighlight();

    if (!document.getElementById('raid-ac-style')) {
        var acStyle = document.createElement('style');
        acStyle.id = 'raid-ac-style';
        acStyle.textContent = [
            '.raid-ac-item { padding: 4px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 12px; }',
            '.raid-ac-item:hover { background: rgba(255,255,255,0.08); }',
            '.raid-ac-item.raid-ac-selected { background: rgba(79,195,247,0.25); }',
            '.raid-ac-label { color: #4fc3f7; white-space: nowrap; }',
            '.raid-ac-detail { color: #9e9e9e; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
            '.raid-bracket-match { background: rgba(180,180,180,0.3); border-radius: 2px; }'
        ].join('\n');
        document.head.appendChild(acStyle);
    }

    return highlight;
}