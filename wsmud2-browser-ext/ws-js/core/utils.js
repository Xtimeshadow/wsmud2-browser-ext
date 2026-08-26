// ============================================================
// utils.js —— 通用小工具函数
// ------------------------------------------------------------
// 四个函数：
//   NotSound()        播放"完成提示音"
//   getJLGrade(eq)    根据装备名字里的 ★/☆ 算出精炼等级
//   openExtensionHtml()  打开扩展自带"综合工具网页版"
//   enableTabIndent()  给代码框加 Tab 缩进 + 黑底灰字样式
// 语法高亮/自动补全 → raid-syntax.js / raid-autocomplete.js
// 流程编辑器 → raid-editor.js
// ============================================================
'use strict';

/**
 * 播放完成提示音（complete.mp3）。
 * 第一次调用时通过 <script> 标签 src 反推扩展 ID，创建 <audio> 元素并复用。
 */
function NotSound() {
    let audioElement = document.getElementById('beep');
    if (!audioElement) {
        const scriptTag = document.querySelector(`script[src*="ws-js/core/utils.js"]`);
        if (!scriptTag) {
            console.error('Beep1 Error: Cannot find the extension script tag.');
            return;
        }
        const extensionId = new URL(scriptTag.src).hostname;
        audioElement = document.createElement('audio');
        audioElement.id = 'beep';
        audioElement.preload = 'auto';
        audioElement.src = `chrome-extension://${extensionId}/ws-data/complete.mp3`;
        document.body.appendChild(audioElement);
    }
    audioElement.currentTime = 0;
    audioElement.play();
}

/**
 * 根据装备字符串中的 ★ 和 ☆ 计算精炼等级。
 * ★ = 2 点，☆ = 1 点。
 * @param {string} eq 装备描述字符串
 * @returns {number} 精炼等级
 */
function getJLGrade(eq) {
    const starCount = (eq.match(/★/g) || []).length;
    const halfStarCount = (eq.match(/☆/g) || []).length;
    return starCount * 2 + halfStarCount;
}

/**
 * 通过 postMessage 请求 content script 在新标签页打开扩展内置 HTML 工具页面。
 */
function openExtensionHtml() {
    window.postMessage({ __EXT_BRIDGE__: true, action: 'openHtmlFile' }, '*');
}

/**
 * 给 textarea 加编程习惯的按键行为：
 *   - Tab：光标处插入 4 空格缩进；有选中时整块加缩进
 *   - Shift+Tab：反缩进
 * @param {HTMLElement} el textarea DOM 元素
 */
function enableTabIndent(el) {
    if (!el) return;
    if (el.__tabIndent) return;
    el.__tabIndent = true;
    // 用 inline !important 强制代码框为黑底灰字
    try {
        el.style.setProperty('color', '#c0c0c0', 'important');
        el.style.setProperty('background', '#000000', 'important');
        el.style.setProperty('font-family', "'JetBrains Mono', Consolas, monospace", 'important');
        el.style.setProperty('font-size', '14px', 'important');
        el.style.setProperty('line-height', '1.5', 'important');
        el.style.setProperty('text-align', 'left', 'important');
        el.style.setProperty('margin', '0', 'important');
        el.style.setProperty('padding', '4px', 'important');
        el.style.setProperty('border', '1px solid #666666', 'important');
        el.style.setProperty('caret-color', '#c0c0c0', 'important');
    } catch (e) { }
    var IND = '    ';
    el.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        var s = this.selectionStart, en = this.selectionEnd, v = this.value;
        if (e.shiftKey) {
            var ls = v.lastIndexOf('\n', s - 1) + 1;
            var le = v.indexOf('\n', en);
            if (le === -1) le = v.length;
            var lines = v.slice(ls, le).split('\n');
            for (var i = 0; i < lines.length; i++) {
                var m = lines[i].match(/^(\t| {1,4})/);
                if (m) lines[i] = lines[i].slice(m[0].length);
            }
            this.value = v.slice(0, ls) + lines.join('\n') + v.slice(le);
            this.selectionStart = s;
            this.selectionEnd = en;
        } else if (s === en) {
            this.value = v.slice(0, s) + IND + v.slice(en);
            this.selectionStart = this.selectionEnd = s + IND.length;
        } else {
            var sel = v.slice(s, en);
            var firstIsLineStart = s === 0 || v[s - 1] === '\n';
            var newSel = (firstIsLineStart ? IND : '') + sel.replace(/\n/g, '\n' + IND);
            this.value = v.slice(0, s) + newSel + v.slice(en);
            this.selectionStart = s;
            this.selectionEnd = s + newSel.length;
        }
        try { this.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) { }
    });
}