// ============================================================
// dialog-setting-1.js —— 游戏设置面板（第一部分）
// 提取自 dialog-panels.js（Dialog.setting）
// ============================================================
'use strict';
Dialog.setting = {
    'footer': [['显示', 'setting'], ["<yel>高级</yel>", "custom"], ['快捷键', "keys"], ['扩展', "extend"]],
    'selectitem': null,
    'init': function() {
        if (this.settingElement)
            return;
        if (Util.isMobile)
            this.footer.splice(2, 1);
        this.settingElement = $(".dialog-setting");
        this.extendElement = $(".dialog-extend");
        this.keysElement = $(".dialog-skeys");
        this.customElement = $(".dialog-custom");
        var _J66 = $(".setting>.setting-item");
        for (var _n92 = 0; _n92 < _J66.length; _n92++) {
            var _J67 = $(_J66[_n92])
              , _t643 = _J67.attr('for');
            if (!_t643)
                continue;
            var _t644 = Setting[_t643];
            switch (_t643) {
            case "fontsize":
                this.select_color(_J67.find(".color-item"), _t644, "fontSize");
                break;
            case "font":
                this.select_color(_J67.find(".color-item"), _t644, "fontFamily");
                break;
            case 'fontcolor':
                this.select_color(_J67.find(".color-item"), _t644, "backgroundColor");
                break;
            case "backcolor":
                this.select_color(_J67.find(".color-item"), _t644, "backgroundColor");
                break;
            case "combat_size":
            case "menu_size":
            case "dialog_size":
                this.select_value(_J67.find(".color-item"), _t644);
                break;
            case 'auto_pfm':
            case "auto_pfm2":
                if (_t644) {
                    _J67.find('.switch\x20').addClass('on');
                    _J67.find(".switch-text").html('开');
                    $('#' + _t643).show().val(_t644);
                }
                break;
            case "auto_work":
                if (_t644) {
                    _J67.find(".switch ").addClass('on');
                    _J67.find(".switch-text").html('开');
                    $('#' + _t643).show().val(_t644 !== 1 ? _t644 : '');
                }
                break;
            default:
                if (_t644 === 1) {
                    _J67.find('.switch\x20').addClass('on');
                    _J67.find(".switch-text").html('开');
                }
                break;
            }
        }
    },
    'show': function() {
        this.init();
        if (this.isShow)
            return;
        this.footerChanged("setting");
        Dialog.icon("cog");
        Dialog.title('设置');
        Dialog.footerElement.empty();
        for (var _n93 = 0; _n93 < this.footer.length; _n93++) {
            var _J68 = $("<span class='footer-item' for='" + this.footer[_n93][1] + '\x27>' + this.footer[_n93][0] + "</span>").appendTo(Dialog.footerElement);
            if (_n93 === 0)
                _J68.addClass('select');
        }
        this.isShow = true;
    },
    'select_color': function(_t646, _t647, _t648) {
        for (var _n94 = 0; _n94 < _t646.length; _n94++) {
            _t646[_n94].style[_t648] == _t647 ? $(_t646[_n94]).addClass("select") : $(_t646[_n94]).removeClass("select");
        }
    },
    'select_value': function(_t650, _t651) {
        for (var _n95 = 0; _n95 < _t650.length; _n95++) {
            $(_t650[_n95]).attr("value") == _t651 ? $(_t650[_n95]).addClass("select") : $(_t650[_n95]).removeClass("select");
        }
    },
    'footerChanged': function(_t653) {
        let _t655 = this[_t653 + 'Element'];
        if (!_t655 || _t655 === this.selectitem)
            return this.child?.command(_t653);
        this.selectitem && this.selectitem.remove();
        this.selectitem = _t655;
        if (this.child)
            this.child.hide();
        this.child = null;
        if (_t653 === 'setting') {
            this.selectitem.on('click', ".switch", this.switchClick);
            this.selectitem.on("click", ".color-item", this.colorClick);
        }
        else
            if (_t653 === 'custom') {
            this.selectitem.on("click", ".switch", this.switchClick);
            this.selectitem.on("click", ".setting-ok", this.save_custom);
        } else {
            this.child = Dialog[_t653];
            this.child.show(this.selectitem);
        }
        this.selectitem.appendTo(Dialog.contentElement);
    },
    'helpClick': function() {
        var _J69 = $(this)
          , _t657 = _J69.attr("action");
        switch (_t657) {
        case 'tologin':
            break;
        case "torole":
            GameClient.Close();
            HideAndShow("#role_panel", function() {
                Process.player = null;
                Process.clear();
            });
            break;
        case "toserver":
            Process.player = null;
            GameClient.Close();
            break;
        default:
            break;
        }
    },
};