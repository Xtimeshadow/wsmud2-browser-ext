// ============================================================
// dialog-pack2.js —— 他人背包面板
// 提取自 dialog-panels.js（原第 1105-1207 行）
// ============================================================
'use strict';
Dialog.pack2 = {
    'onData': function(_t539) {
        this.show();
        if (_t539.items) {
            this.eqs = this.formatEqs(_t539.eqs || []);
            this.money = _t539.money;
            this.id = _t539.id;
            this.command_before = "dc " + this.id + '\x20';
            this.items = this.formatItems(_t539.items);
            this.target_name = _t539.name;
            this.max_count = _t539.max_item_count;
            this.show_items();
            this.show_moeny();
        } else {
            this.updateitem(_t539);
        }
    },
    'cleanup_cmds': Dialog.pack.cleanup_cmds,
    'formatEqs': Dialog.pack.formatEqs,
    'formatItems': Dialog.pack.formatItems,
    'formatPackItem': Dialog.pack.formatPackItem,
    'createItems': Dialog.pack.createItems,
    'create_eqs': Dialog.pack.create_eqs,
    'init_element': Dialog.pack.init_element,
    'show_items': Dialog.pack.show_items,
    'updateitem': Dialog.pack.updateitem,
    'footerChanged': Dialog.pack.footerChanged,
    'cleanup': Dialog.pack.cleanup,
    'show_moeny': function() {
        if (!this.isShow)
            return;
        let _t542 = moneyToStr(this.money)
          , _a41 = [];
        _a41.push("<div class='obj-money'>");
        if (this.packElement.is('.cleanup')) {
            _a41.push("<span for='cancle' class='footer-item'>取消</span>");
            _a41.push("<span for='store' class='footer-item'>自动存仓</span>");
            _a41.push("<span for='sell' class='footer-item'>清理杂物</span>");
            _a41.push("<span for='cleanup' class='footer-item'>确定</span></div>");
        } else {
            _a41.push(this.target_name, _t542 ? "身上有" + _t542 : '身上没有任何银两');
            _a41.push("<span for='cleanup' class='footer-item'>整理</span></div>");
        }
        Dialog.footer(_a41.join(''));
    },
    'cleanup_item': function(_t543, _t544) {
        let _J59 = $(_t544)
          , _t546 = _J59.parent().attr("oindex")
          , _t547 = _J59.attr('cmd');
        SendCommand(Dialog.pack2.command_before + '\x20' + _t547 + '\x20' + _t546);
    },
    'show_sub': Dialog.pack.show_sub,
    'close': Dialog.skills.close,
    'hide': function() {
        this.element.remove();
        this.isShow = false;
    },
    'get_item': Dialog.pack.get_item,
    'create_item_command': Dialog.pack.create_item_command,
    'show': function() {
        if (!Dialog.isShow)
            Dialog.show('pack2');
        if (this.objelement) {
            this.objelement.remove();
            this.objelement = null;
            if (this.packElement) this.packElement.show();
        }
        if (this.isShow)
            return;
        this.isShow = true;
        this.init_element();
        this.packElement.on("click", ".obj-item", this.item_click);
        this.eqElement.on("click", ".eq-item", this.eqitem_click);
        this.element.appendTo(Dialog.contentElement);
    },
    'item_click': function(_t550) {
        let _J60 = $(_t550.target)
          , _t552 = Dialog.pack2.packElement.is('.cleanup');
        if (_t552 && _J60.is(".obj-oper"))
            return Dialog.pack.item_cleanup(_J60);
        _J60 = $(this);
        var _t553 = _J60.attr('oindex');
        if (!_t553)
            return;
        var _t554 = Dialog.pack2.get_item(_t553);
        Dialog.pack2.element.find(".item-commands").remove();
        if (!_t554)
            return;
        SCRIPT.LAST_OBJ = _t554;
        var _a42 = ["<span class='item-commands'>"];
        _a42.push("<span cmd=\"" + Dialog.pack2.command_before + " checkobj " + _t554.id + (" from item\">查看</span>"));
        Dialog.pack2.create_item_command(_t554, _a42);
        _a42.push("</span>");
        _J60 = $(_a42.join('')).insertAfter(_J60);
        checkScroll(_J60);
    },
    'eqitem_click': function() {
        var _t556 = Dialog.pack2.eqs[$(this).attr("oindex")];
        if (!_t556)
            return;
        SendCommand(Dialog.pack2.command_before + '\x20checkobj\x20' + _t556.id + " from eq");
    }
};