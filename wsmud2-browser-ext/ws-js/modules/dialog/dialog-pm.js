// ============================================================
// dialog-pm.js —— 拍卖行面板
// 提取自 dialog-panels.js（原第 3594-3666 行）
// ============================================================
'use strict';
Dialog.pm = {
    'close': function() {
        this.element.remove();
        this.isShow = false;
    },
    'onData': function(_t936) {
        if (_t936.list) {
            this.show();
            this.create_items(_t936.list);
        }
        else
            _t936.item && this.update_item(_t936.item);
    },
    'show': function() {
        if (!Dialog.isShow || Dialog.curItem !== 'pm')
            Dialog.show('pm');
        if (!this.element)
            this.element = $("<div class='dialog-pms'></div>");
        if (this.isShow)
            return;
        Dialog.title("拍卖行");
        Dialog.icon("shopping-cart");
        Dialog.footer('');
        this.element.appendTo(Dialog.contentElement);
        this.element.on("click", ".pm-item", this.select_item);
        this.isShow = true;
    },
    'select_item': function() {
        let _J79 = $(this)
          , _t940 = Dialog.pm;
        if (_t940.selected_item)
            _t940.selected_item.removeClass("selected");
        _t940.selected_item = _J79;
        _t940.selected_item.addClass("selected");
    },
    'update_item': function(_t941) {
        let _t943 = this.element.find(".pm-item[oid=\"" + _t941[0] + '\x22]');
        if (_t943)
            _t943.replaceWith(this.create_item(_t941));
    },
    'create_items': function(_t944) {
        let _a87 = [];
        for (let _n130 = 0; _n130 < _t944.length; _n130++) {
            _a87.push(this.create_item(_t944[_n130]));
        }
        if (!_a87.length)
            _a87.push("<div class=\"empty\">暂无拍卖</div>");
        this.element.html(_a87.join(''));
        Dialog.footer("<span class=\"obj-money\">共有" + _t944.length + ("项道具正在拍卖</span>"));
    },
    'create_item': function(_t946) {
        let _a88 = [];
        const [_t948,_t949,_t950,_t951,_t952] = _t946;
        _a88.push("<div class='pm-item grade0 flex-row' oid='", _t948, '\x27>');
        _a88.push("<div class='pm-title' cmd='pm show ", _t948, '\x27>');
        _a88.push(_t949);
        _a88.push("</div>");
        _a88.push("<div class='pm-desc flex-1'>");
        _t952 ? _a88.push(_t952, "最后出价", moneyToStr(_t950)) : _a88.push("当前价格", moneyToStr(_t950));
        _a88.push('</div>');
        _a88.push("<div class='pm-mem'>");
        _a88.push('剩余：', format_time_span(_t951), '');
        _a88.push("</div>");
        _a88.push("<div class='pm-add' cmd='pm add ", _t948, '\x27>');
        _a88.push('出价');
        _a88.push("</div>");
        _a88.push("</div>");
        return _a88.join('');
    },
    'format_num': function(_t953) {
        return _t953 > 9 ? _t953.toString() : '0' + _t953.toString();
    }
};