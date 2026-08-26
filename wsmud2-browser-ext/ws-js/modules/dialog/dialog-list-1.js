// ============================================================
// dialog-list-1.js —— 商店/仓库买卖面板（第一部分）
// 提取自 dialog-panels.js（Dialog.list）
// ============================================================
'use strict';
Dialog.list = {
    'hide': function() {
        this.element.remove();
        this.isShow = false;
    },
    'close': function() {
        this.hide();
    },
    'updateitem': function(_t592) {
        if (_t592.store) {
            if (!this.stores || !this.isShow)
                return Dialog.pack.onData({
                    'remove': _t592.store,
                    'id': _t592.id
                });
            var _t594 = this.find_item(1, _t592.id)
              , _t595 = this.find_item(3, _t592.storeid);
            if (!_t594) {
                _t594 = Object.assign({}, _t595);
                _t594.id = _t592.id;
                _t594.count = -_t592.store;
                Dialog.pack.items.push(_t594);
            } else {
                _t594.count -= _t592.store;
            }
            if (!_t595) {
                _t595 = Object.assign({}, _t594);
                _t595.id = _t592.storeid;
                _t595.count = _t592.store;
                this.stores.push(_t595);
            } else {
                _t595.count += _t592.store;
            }
            this.store_count = _t592.sum ?? this.stores.length;
            if (_t595.count === 0)
                this.stores.Remove(_t595);
            if (_t594.count === 0)
                Dialog.pack.items.Remove(_t594);
        } else {
            if (_t592.sell) {
                _t594 = this.find_item(2, _t592.id);
                if (_t594) {
                    _t594.count -= _t592.sell;
                    return this.create_items(this.selllist, this.leftElement, 2, this.selllist.length);
                }
            }
        }
        if (this.isstore && this.isShow) {
            this.create_items(this.stores, this.leftElement, 3, Math.max(this.max_store_count, 100));
            Dialog.title("你的仓库中有" + this.store_count + '/' + this.max_store_count + '件物品');
        }
        this.update_pack();
        if (_t592.money !== undefined)
            this.show_footer(_t592.money);
    },
    'find_item': function(_t596, _t597) {
        var _t599 = Dialog.pack.items;
        if (_t596 === 2)
            _t599 = this.selllist;
        else {
            if (_t596 === 3)
                _t599 = this.stores;
        }
        for (var _n87 = 0; _n87 < _t599.length; _n87++) {
            if (_t599[_n87].id == _t597)
                return _t599[_n87];
        }
    },
    'formatItems': function(_t600) {
        let _a45 = [];
        for (let _t601 of _t600) {
            _a45.push({
                'name': _t601[0],
                'id': _t601[1],
                'count': _t601[2],
                'grade': _t601[3],
                'unit': _t601[4],
                'value': _t601[5]
            });
        }
        return _a45;
    },
    'onData': function(_t602) {
        if (_t602.id)
            return this.updateitem(_t602);
        var _t604 = _t602.gongji ?? _t602.jungong ?? _t602.yaoyuan ?? _t602.mvalue;
        if (_t602.selllist) {
            this.show();
            this.isstore = false;
            this.gongji = _t604;
            this.money_name = null;
            this.typeElement.hide();
            this.selllist = this.formatItems(_t602.selllist);
            if (_t602.gongji >= 0)
                this.money_name = "门派功绩";
            else {
                if (_t602.jungong >= 0)
                    this.money_name = '军功';
                else {
                    if (_t602.yaoyuan >= 0)
                        this.money_name = "<ord>妖元</ord>";
                    else
                        this.money_name = _t602.mtype;
                }
            }
            this.create_items(this.selllist, this.leftElement, 2, this.selllist.length);
            Dialog.titleElement.html(_t602.title);
            Dialog.icon("shopping-cart");
            if (_t602.seller)
                this.seller = _t602.seller;
            this.update_pack();
        } else
            if (_t602.stores) {
            this.show();
            this.typeElement.show();
            this.isstore = true;
            this.stores = Dialog.pack.formatItems(_t602.stores);
            if (_t602.sum > 0) {
                this.typeElement.show();
                this.store_count = _t602.sum;
            } else {
                this.typeElement.hide();
                this.store_count = _t602.stores.length;
            }
            this.create_items(this.stores, this.leftElement, 3, Math.max(_t602.max_store_count, 100));
            this.leftElement[0].scrollTop = 0;
            Dialog.titleElement.html('你的仓库中有' + this.store_count + '/' + _t602.max_store_count + "件物品");
            this.max_store_count = _t602.max_store_count;
            Dialog.icon('lock');
            this.update_pack();
        }
        if (_t604 >= 0) {
            this.gongji = _t604;
            this.show_footer(_t604);
        }
    },
    'show': function(_t605) {
        if (!Dialog.isShow || Dialog.curItem !== 'list')
            Dialog.show('list');
        if (this.rightElement) {
            this.rightElement.show();
            if (Dialog.pack.objelement)
                Dialog.pack.objelement.remove();
        }
        if (this.isShow)
            return;
        if (!this.element) {
            this.element = $("<div class=\"dialog-list\"><div class=\"otype-list\"><div class=\"otype-item select\" otype=\"0\">道具</div><div class=\"otype-item\"  otype=\"1\">秘籍</div><div class=\"otype-item\" otype=\"2\">宝石</div><div class=\"otype-item\" otype=\"3\">资源</div><div class=\"otype-item\" otype=\"4\">装备</div></div><div class=\"trade-list\"></div><div class=\"obj-list\"></div></div >");
            var _t607 = this.element.children();
            this.typeElement = $(_t607[0]);
            this.typeElement.hide();
            this.leftElement = $(_t607[1]);
            this.rightElement = $(_t607[2]);
        }
        this.element.on('click', ".obj-item", Dialog.list.item_click);
        this.element.on("click", ".otype-item", Dialog.list.otype_click);
        this.element.appendTo(Dialog.contentElement.empty());
        this.isShow = true;
    },
    'selected_type': 0,
    'otype_click': function() {
        let _J63 = $(this).attr("otype")
          , _n88 = parseInt(_J63)
          , _t609 = Dialog.list;
        if (!_t609.stores)
            return;
        if (_n88 === _t609.selected_type)
            return;
        let _t610 = _t609.typeElement.children();
        $(_t610[_t609.selected_type]).removeClass("select");
        _t609.selected_type = parseInt(_J63);
        $(_t610[_n88]).addClass("select");
        SendCommand("store " + _n88);
    },
};