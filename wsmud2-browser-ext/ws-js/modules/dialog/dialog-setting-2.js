// ============================================================
// dialog-setting-2.js —— 游戏设置面板（第二部分）
// 提取自 dialog-panels.js（Dialog.setting）
// ============================================================
'use strict';
// 此文件延续 Dialog.setting，需在 dialog-setting-1.js 之后加载
Dialog.setting.close_help = function() {
    if (this.frame) {
        this.frame.remove();
        this.selectitem.removeClass('help-detl');
        this.frame = null;
    }
};
Dialog.setting.hide = function() {
    if (this.child && this.child.hide() === false)
        return false;
    this.close();
};
Dialog.setting.close = function() {
    this.child?.close();
    this.selectitem?.remove();
    this.isShow = false;
    this.selectitem = null;
    this.child = null;
};
Dialog.setting.save_custom = function() {
    var _J70;
    if ($(".dialog-custom>.setting-item[for='auto_pfm']>.switch").is(".on")) {
        _J70 = $('#auto_pfm').val();
        if (!_J70)
            return ReceiveMessage("<hir>你没有设置自动出招的绝招。</hir>");
        if (_J70.length > 300)
            return ReceiveMessage("<hir>你设置的出招过长。</hir>");
        Setting.save("auto_pfm", _J70);
    }
    if ($(".dialog-custom>.setting-item[for='auto_pfm2']>.switch").is(".on")) {
        _J70 = $('#auto_pfm2').val();
        if (!_J70)
            return ReceiveMessage("<hir>你没有设置自动反击的绝招。</hir>");
        if (_J70.length > 300)
            return ReceiveMessage("<hir>你设置的出招过长。</hir>");
        Setting.save("auto_pfm2", _J70);
    }
    if ($(".dialog-custom>.setting-item[for='auto_work']>.switch").is('.on')) {
        _J70 = $('#auto_work').val();
        if (_J70 && _J70.length > 400)
            return ReceiveMessage("<hir>你设置的过长。</hir>");
        Setting.save("auto_work", _J70 || 1);
    }
    ReceiveMessage("<hic>设置已保存。</hic>");
};
Dialog.setting.get_pfms = function(_t663) {
    if (!Combat.Skills)
        return ReceiveMessage("<hir>你没有可用的绝招设置。</hir>");
    var _a50 = [];
    for (var _n96 = 0; _n96 < Combat.Skills.length; _n96++) {
        if (_a50.length > 0)
            _a50.push(',');
        _a50.push(Combat.Skills[_n96].id);
    }
    $('#' + _t663).val(_a50.join(''));
    ReceiveMessage("已预设置为你默认的绝招(未保存)，你可以修改为适合你的出招顺序后点击保存");
};
Dialog.setting.switchClick = function(_t665) {
    var _J71 = $(this)
      , _t667 = _J71.parent().attr('for')
      , _n97 = 0;
    if (_J71.is(".on")) {
        _J71.removeClass('on');
        _J71.find(".switch-text").html('关');
    } else {
        _J71.addClass('on');
        _J71.find(".switch-text").html('开');
        _n97 = 1;
    }
    switch (_t667) {
    case 'auto_pfm':
    case 'auto_pfm2':
        if (_n97) {
            $('#' + _t667).show();
            Dialog.setting.get_pfms(_t667);
            Setting[_t667] = 0;
        } else {
            $('#' + _t667).hide();
            Setting.save(_t667, 0);
        }
        break;
    case 'auto_work':
        if (_n97) {
            $('#' + _t667).show();
        } else {
            $('#' + _t667).hide();
            Setting.save(_t667, 0);
        }
        break;
    default:
        Setting.save(_t667, _n97);
        break;
    }
    _t665.cancelable = true;
    return false;
};
Dialog.setting.COLORS = {
    'rgb(255,\x20255,\x20255)': "#fff",
    'rgb(189,\x20195,\x20199)': "#bdc3c7",
    'rgb(0,\x20128,\x200)': '#008000'
};
Dialog.setting.colorClick = function() {
    var _J72 = $(this);
    if (_J72.is(".select"))
        return;
    var _t669 = _J72.parent();
    _t669.children().removeClass("select");
    _J72.addClass("select");
    var _t670 = _t669.closest(".setting-item").attr("for");
    if (!_t670)
        return;
    var _t671 = '';
    switch (_t670) {
    case "combat_size":
    case "dialog_size":
    case "menu_size":
        _t671 = _J72.attr("value");
        break;
    case "fontsize":
        _t671 = _J72[0].style.fontSize;
        break;
    case "fontcolor":
        _t671 = Dialog.setting.COLORS[_J72[0].style.backgroundColor] ?? '';
        break;
    case "backcolor":
        _t671 = _J72[0].style.backgroundColor;
        break;
    case "font":
        _t671 = _J72[0].style.fontFamily;
        if (!_t671)
            _t671 = "none";
        break;
    }
    Setting.save(_t670, _t671);
};