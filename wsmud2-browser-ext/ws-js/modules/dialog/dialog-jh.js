// ============================================================
// dialog-jh.js —— 江湖总面板
// 提取自 dialog-panels.js（原第 2674-2776 行）
// ============================================================
'use strict';
Dialog.jh = {
    'close': function() {
        this.element.remove();
        this.isShow = false;
    },
    'onData': function(_t784) {
        if (_t784.close)
            return Dialog.isShow && Dialog.hide();
        if (_t784.desc)
            return this.selected_item.onDetail(_t784);
        if (_t784.unlock !== undefined || _t784.unlock2 !== undefined)
            return this.update_lock(_t784);
        if (_t784.refresh !== undefined && this.isLoad) {
            let _t786 = Dialog["jh_" + _t784.t]
              , _t787 = _t786.items[_t784.refresh];
            if (_t787 && _t787.desc) {
                _t787.desc = null;
                let _t788 = _t786.items.indexOf(_t787);
                _t786.selected_index == _t788 && _t786.onClickItem(_t788);
            }
            return;
        }
        if (!_t784.fbs)
            return;
        Dialog.jh_fam.items = _t784.families.map(function(_t789) {
            return {
                'name': _t789,
                'unlock': false
            };
        });
        Dialog.jh_fb.items = _t784.fbs.map(function(_t790) {
            return {
                'name': _t790
            };
        });
        Dialog.jh_ar.items = _t784.areas.map(function(_t791) {
            return {
                'name': _t791,
                'unlock': false
            };
        });
        this.selected_item.show(this.listElement, this.descElement);
    },
    'show': function() {
        if (this.isShow)
            return;
        if (!this.element)
            this.element = $("<div class='dialog-fb'><div class='fb-left'></div><div class='fb-right'></div></div>");
        this.listElement = this.element.find(".fb-left").on("click", ".fb-item,.fam-item", this.item_click);
        this.descElement = this.element.find(".fb-right");
        Dialog.title('江湖');
        Dialog.icon('home');
        this.element.appendTo(Dialog.contentElement);
        this.isShow = true;
        if (this.isLoad) {
            SendCommand('jh\x20fb\x20lock');
        } else {
            SendCommand('jh');
            this.isLoad = true;
            this.selected_item = this.footers[0];
        }
        this.create_footer();
    },
    'selected_item': null,
    'footers': [Dialog.jh_fam, Dialog.jh_fb, Dialog.jh_ar],
    'create_footer': function() {
        var _a69 = [];
        for (var _n114 = 0; _n114 < this.footers.length; _n114++) {
            let _t794 = this.footers[_n114];
            _a69.push("<span class='footer-item" + (_t794 == this.selected_item ? " select" : '') + "' for='" + _n114 + '\x27>' + this.footers[_n114].name + "</span>");
        }
        _a69.push("<div class=\"item-commands\"></div>");
        Dialog.footerElement.html(_a69.join(''));
    },
    'item_click': function() {
        var _J75 = $(this);
        if (_J75.is(".selected"))
            return;
        let _t796 = _J75.attr('index');
        if (_t796 !== undefined)
            Dialog.jh.selected_item.onClickItem(_t796);
    },
    'update_lock': function(_t797) {
        if (_t797.unlock >= 0 && Dialog.jh_fb.items) {
            Dialog.jh_fb.update_unlock(_t797.unlock);
            if (this.selected_item === Dialog.jh_fb)
                Dialog.jh_fb.show(this.listElement, this.descElement);
        }
        if (_t797.unlock2 >= 0 && Dialog.jh_ar.items) {
            Dialog.jh_ar.update_unlock(_t797.unlock2);
            if (this.selected_item === Dialog.jh_ar)
                Dialog.jh_ar.show(this.listElement, this.descElement);
        }
    },
    'footerChanged': function(_t799) {
        let _t801 = this.footers[_t799];
        if (_t801 == this.selected_item)
            return;
        this.selected_item = _t801;
        Dialog.footerElement.find(".item-commands").empty();
        _t801.show(this.listElement, this.descElement);
    }
};