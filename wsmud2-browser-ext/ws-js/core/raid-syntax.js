// ============================================================
// raid-syntax.js —— 流程脚本语法高亮
// ------------------------------------------------------------
// RaidScriptColors 色板 + highlightJavaScript/highlightRaidSyntax
// 供 raid-editor.js 使用。
// ============================================================
'use strict';

// 流程脚本语法着色色板（10 类 token）
const RaidScriptColors = {
    comment: '#9e9e9e',
    varColon: '#fff176',
    varNormal: '#4dd0e1',
    cmd: '#4fc3f7',
    dir: '#81c784',
    ctrl: '#ffb74d',
    str: '#ef9a9a',
    operator: '#ce93d8',
    number: '#a5d6a7',
    jsKeyword: '#f48fb1'
};

/**
 * JS 代码高亮（@js 行剩余部分用）
 * @param {string} code 已 HTML 转义的 JS 源码
 * @returns {string} 含高亮 span 的 HTML
 */
function highlightJavaScript(code) {
    return code.replace(
        /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:var|let|const|function|if|else|for|while|do|switch|case|break|continue|return|new|this|typeof|instanceof|try|catch|finally|throw|async|await|class|import|export|default|from|true|false|null|undefined|in|of|delete|void|with|yield)\b)/g,
        function (match, comment, strDouble, strSingle, strTemplate, number, keyword) {
            if (comment) return '<span style="color:' + RaidScriptColors.comment + '">' + comment + '</span>';
            if (strDouble) return '<span style="color:' + RaidScriptColors.str + '">' + strDouble + '</span>';
            if (strSingle) return '<span style="color:' + RaidScriptColors.str + '">' + strSingle + '</span>';
            if (strTemplate) return '<span style="color:' + RaidScriptColors.str + '">' + strTemplate + '</span>';
            if (number) return '<span style="color:' + RaidScriptColors.number + '">' + number + '</span>';
            if (keyword) return '<span style="color:' + RaidScriptColors.jsKeyword + '">' + keyword + '</span>';
            return match;
        }
    );
}

/**
 * 流程脚本源码 → 带色 span 的 HTML（逐行处理）
 * @param {string} code 原始源码
 * @returns {string} 含高亮 span 的 HTML
 */
function highlightRaidSyntax(code) {
    var escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped.split('\n').map(function (line) {
        var jsMatch = line.match(/^(\s*@js\s?)(.*)$/);
        if (jsMatch) {
            var prefix = jsMatch[1].replace(/@js/, '<span style="color:' + RaidScriptColors.cmd + '">@js</span>');
            return prefix + highlightJavaScript(jsMatch[2]);
        }
        return line.replace(
            /(\/\/[^\n]*)|(\(:\w+\))|(\(\$\w+\))|(@\w+)|(#\w+)|(\[[\w\u4e00-\u9fa5\s]+\])|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(==|!=|>=|<=|&&|\|\|)/g,
            function (match, comment, varColon, varDollar, cmd, dir, ctrl, strDouble, strSingle, number, operator) {
                if (comment) return '<span style="color:' + RaidScriptColors.comment + '">' + comment + '</span>';
                if (varColon) return '<span style="color:' + RaidScriptColors.varColon + '">' + varColon + '</span>';
                if (varDollar) return '<span style="color:' + RaidScriptColors.varNormal + '">' + varDollar + '</span>';
                if (cmd) return '<span style="color:' + RaidScriptColors.cmd + '">' + cmd + '</span>';
                if (dir) return '<span style="color:' + RaidScriptColors.dir + '">' + dir + '</span>';
                if (ctrl) return '<span style="color:' + RaidScriptColors.ctrl + '">' + ctrl + '</span>';
                if (strDouble) return '<span style="color:' + RaidScriptColors.str + '">' + strDouble + '</span>';
                if (strSingle) return '<span style="color:' + RaidScriptColors.str + '">' + strSingle + '</span>';
                if (number) return '<span style="color:' + RaidScriptColors.number + '">' + number + '</span>';
                if (operator) return '<span style="color:' + RaidScriptColors.operator + '">' + operator + '</span>';
                return match;
            }
        );
    }).join('\n');
}