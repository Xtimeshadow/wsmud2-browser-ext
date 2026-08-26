// ============================================================
// dialog-pack-2.js —— 背包面板（第 2 部分）
// 提取自 dialog-panels.js（原第 758-1029 行，属性：get_item ~ createItems）
// ============================================================
'use strict';
Dialog.pack = Dialog.pack || {};
Dialog.pack.get_item = function(_t476, _t477) {
    _t477 = _t477 || this.items;
    if (!_t477)
        return;
    for (var _n74 = 0; _n74 < _t477.length; _n74++) {
        if (_t477[_n74] && _t477[_n74].id == _t476)
            return _t477[_n74];
    }
};
Dialog.pack.show_sub = function(_t479) {
    if (this.objelement)
        this.objelement.remove();
    var _t481 = this.packElement;
    Dialog.list.isShow && (_t481 = Dialog.list.rightElement);
    this.objelement = $("<pre class='obj-desc'>" + _t479 + "</pre>").appendTo(_t481.parent()).on("click", function() {
        this.objelement.remove();
        this.objelement = null;
        _t481.show();
    }
    .bind(this));
    _t481.hide();
};
Dialog.pack.onData = function(_t483) {
    if (_t483.items) {
        this.eqs = this.formatEqs(_t483.eqs || []);
        this.money = _t483.money;
        this.eq_group = _t483.eq_group;
        this.items = this.formatItems(_t483.items);
        this.max_count = _t483.max_item_count;
        if (this.isShow) {
        this.show_items();
        this.show_moeny();
    }
    }
    else {
        if (Dialog.pack2.isShow && !_t483.name)
            return Dialog.pack2.onData(_t483);
        if (this.updateitem(_t483))
            return;
    }
    if (!this.isShow) {
        if (Dialog.list.isShow)
            return Dialog.list.update_pack(_t483);
        if (Dialog.trade.isShow)
            return Dialog.trade.update_pack(_t483);
    }
};
Dialog.pack.formatPackItem = function(_t485) {
    return {
        'name': _t485[0],
        'id': _t485[1],
        'count': _t485[2],
        'grade': _t485[3],
        'unit': _t485[4],
        'value': _t485[5],
        'can_eq': _t485[6],
        'can_use': _t485[7],
        'can_study': _t485[8],
        'can_open': _t485[9],
        'can_combine': _t485[10],
        'is_lock': _t485[11],
        'otype': _t485[12]
    };
};
Dialog.pack.formatItems = function(_t486) {
    let _a35 = [];
    for (let _t488 of _t486) {
        _a35.push(this.formatPackItem(_t488));
    }
    return _a35;
};
Dialog.pack.formatEqs = function(_t489) {
    let _a36 = [];
    for (let _t491 of _t489) {
        if (!_t491)
            _a36.push(_t491);
        else
            _a36.push({
                'name': _t491[0],
                'id': _t491[1],
                'grade': _t491[2],
                'can_use': _t491[3],
                'is_lock': _t491[4]
            });
    }
    return _a36;
};
Dialog.pack.show_moeny = function() {
    if (!this.isShow)
        return;
    let _t493 = moneyToStr(this.money)
      , _a37 = [];
    for (let _n75 = 0; _n75 < 3; _n75++) {
        _a37.push("<span class=\"footer-item eq-group", _n75 === this.eq_group ? " select" : '', "\" for=\"", _n75 + 1, '\x22>', _n75 + 1, "</span>");
    }
    _a37.push("<div class='obj-money'>");
    if (this.packElement.is('.cleanup')) {
        _a37.push("<span for='cancle' class='footer-item'>取消</span>");
        _a37.push("<span for='store' class='footer-item'>自动存仓</span>");
        _a37.push("<span for='sell' class='footer-item'>清理杂物</span>");
        _a37.push("<span for='cleanup' class='footer-item'>确定</span></div>");
    } else {
        _a37.push('你', _t493 ? "身上有" + _t493 : "身上没有任何银两");
        _a37.push("<span for='cleanup' class='footer-item'>整理包裹</span></div>");
    }
    Dialog.footer(_a37.join(''));
};
Dialog.pack.cleanup_cmds = {
    'cleanup': true,
    'cancle': true,
    'store': true,
    'sell': true
};
Dialog.pack.footerChanged = function(_t494, _t495) {
    if (this.cleanup_cmds[_t494])
        return this.cleanup(_t494, _t495);
    let _n76 = parseInt(_t494) - 1;
    if (!(_n76 >= 0 && _n76 < 3))
        return;
    SendCommand("eqgroup " + _n76);
};
Dialog.pack.cleanup = function(_t497, _t498) {
    let _t500 = this;
    _t498.removeClass("select");
    if (_t500.packElement.is(".cleanup")) {
        if (_t497 === "cleanup")
            _t500.packElement.find(".obj-item>.selected").each(this.cleanup_item);
        else {
            if (_t497 === "store")
                SendCommand((this.command_before ?? '') + 'store\x20all');
            else
                _t497 === 'sell' && SendCommand((this.command_before ?? '') + "sell all");
        }
        _t500.packElement.removeClass("cleanup");
        this.show_moeny();
    } else {
        _t500.packElement.find(".item-commands").remove();
        _t500.packElement.addClass('cleanup');
        _t500.show_items();
        this.show_moeny();
    }
};
Dialog.pack.cleanup_item = function(_t501, _t502) {
    let _J57 = $(_t502)
      , _t504 = _J57.parent().attr("oindex")
      , _t505 = _J57.attr("cmd");
    SendCommand(_t505 + '\x20' + _t504);
};
Dialog.pack.show_items = function() {
    if (!this.packElement)
        return;
    this.createItems();
    this.create_eqs();
    Dialog.icon("briefcase");
    var _t507 = this.target_name || '你';
    Dialog.title(this.items && this.items.length ? _t507 + '身上共有' + this.items.length + '/' + this.max_count + "件物品" : _t507 + "身上没有任何东西");
};
Dialog.pack.init_element = function() {
    if (!this.element) {
        this.element = $("<div class=\"dialog-pack\"><div class=\"eq-list\"><div class=\"eq-item\"><span class=\"eq-type\">武器</span><span class=\"eq-name\"></span></div><div class=\"eq-item\"><span class=\"eq-type\">衣服</span><span class=\"eq-name\"></span>" + ("</div > <div class=\"eq-item\"><span class=\"eq-type\">鞋</span><span class=\"eq-name\"></span></div> <div class=\"eq-item\"><span class=\"eq-type\">头部</span><span class=\"eq-name\"></span></div> <div class=\"eq-item\">") + ("<span class=\"eq-type\">披风</span><span class=\"eq-name\"></span></div> <div class=\"eq-item\"><span class=\"eq-type\">戒指</span><span class=\"eq-name\"></span></div> <div class=\"eq-item\"><span class=\"eq-type\">项链</span><span class=\"eq-name\"></span>") + ("</div> <div class=\"eq-item\"><span class=\"eq-type\">饰品</span><span class=\"eq-name\"></span></div> <div class=\"eq-item\"><span class=\"eq-type\">护腕</span><span class=\"eq-name\"></span></div>") + ("<div class=\"eq-item\"><span class=\"eq-type\">腰带</span><span class=\"eq-name\"></span></div><div class=\"eq-item\"><span class=\"eq-type\">暗器</span><span class=\"eq-name\"></span></div></div><div class=\"obj-list\"></div></div>"));
    }
    this.packElement = this.element.find('.obj-list');
    this.eqElement = this.element.find(".eq-list");
};
Dialog.pack.show = function() {
    if (!Dialog.isShow)
        Dialog.show();
    if (this.objelement) {
        this.objelement.remove();
        this.objelement = null;
        if (this.packElement) this.packElement.show();
    }
    if (this.isShow)
        return SendCommand(this.items ? "pack none" : "pack");
    this.isShow = true;
    this.init_element();
    this.packElement.on('click', ".obj-item", Dialog.pack.item_click);
    this.eqElement.on('click', ".eq-item", Dialog.pack.eqitem_click);
    this.packElement.removeClass("cleanup");
    this.element.appendTo(Dialog.contentElement);
    if (!this.items)
        SendCommand("pack");
    else {
        SendCommand("pack none");
        this.show_items();
    }
};