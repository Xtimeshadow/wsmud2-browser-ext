// ============================================================
// ui-components.js —— UI 自定义组件（美化版）
// ------------------------------------------------------------
// 从 ui.js 拆分出来的 UI 组件构建器：
//   UI.ext_row / UI.ext_section / UI.ext_desc / UI.ext_switch
//   UI.ext_select / UI.ext_input / UI.ext_textarea / UI.ext_buttons
//   旧组件：UI.html_lninput / UI.html_input / UI.html_switch
// 依赖：window.UI 对象，用于动态添加方法
// ============================================================
'use strict';

// ========== 新自定义组件（美化版） ==========
UI.ext_row = function (label, control) {
    return `<div class="ext-setting-item">
        <span class="ext-label">${label}</span>
        <span class="ext-control">${control}</span>
    </div>`;
};
UI.ext_section = function (title) {
    return `<div class="ext-setting-section">${title}</div>`;
};
UI.ext_desc = function (text) {
    return `<div class="ext-setting-item ext-desc">${text}</div>`;
};
UI.ext_switch = function (prop, label, pfor) {
    return `<div class="ext-setting-item" for="${pfor}">
        <span class="ext-label">${label}</span>
        <span class="ext-control">
            <span class="switch2" id="${prop}">
                <span class="switch-button"></span>
                <span class="switch-text">关</span>
            </span>
        </span>
    </div>`;
};
UI.ext_select = function (prop, label, options, width) {
    var opts = '';
    for (var k in options) {
        opts += '<option value="' + k + '">' + options[k] + '</option>';
    }
    var w = width || 'auto';
    return `<div class="ext-setting-item">
        <span class="ext-label">${label}</span>
        <span class="ext-control">
            <select id="${prop}" class="ext-select" style="width:${w}">${opts}</select>
        </span>
    </div>`;
};
UI.ext_input = function (prop, label, placeholder, width) {
    var w = width || '180px';
    return `<div class="ext-setting-item">
        <span class="ext-label">${label}</span>
        <span class="ext-control">
            <input id="${prop}" class="ext-input" type="text" placeholder="${placeholder || ''}" style="width:${w}">
        </span>
    </div>`;
};
UI.ext_textarea = function (prop, label, width) {
    var w = width || '95%';
    return `<div class="ext-setting-item">
        <span class="ext-label" style="align-self:flex-start;padding-top:4px;">${label}</span>
        <span class="ext-control" style="width:calc(100% - 140px);">
            <textarea id="${prop}" class="ext-textarea" style="width:${w};"></textarea>
        </span>
    </div>`;
};
UI.ext_buttons = function (buttons) {
    var html = '<div class="ext-setting-item"><div class="ext-button-row">';
    for (var i = 0; i < buttons.length; i++) {
        html += '<span class="ext-btn' + (buttons[i].danger ? ' ext-btn-danger' : '') + '" ' +
            (buttons[i].id ? 'id="' + buttons[i].id + '"' : '') +
            '>' + buttons[i].text + '</span>';
    }
    return html + '</div></div>';
};

// ========== 旧组件（保留兼容） ==========
UI.html_lninput = function (prop, title) {
    return `
      <div class="setting-item" >
        <span><label for="${prop}">${title}</label><input id="${prop}" name="${prop}" type="text" style="width:80px" value>
        </span>        </div> `;
};
UI.html_input = function (prop, title, width = '50%') {
    return `
         <div class="setting-item" >
        <span><label for="${prop}"> ${title}</label> </span>
      </div>
      <textarea class="settingbox hide zdy-box" id="${prop}" name="${prop}" style="display: inline-block; width: ${width};">  </textarea>
    `;
};
UI.html_switch = function (prop, title, pfor) {
    return `<div class="setting-item setting-item2 " for="${pfor}" style='display: inline-block;'>
        <span class="title"> ${title}</span>
        <span class="switch2" id="${prop}" >
        <span class="switch-button"></span>
        <span class="switch-text">关</span>
        </span>
        </div>
        `;
};