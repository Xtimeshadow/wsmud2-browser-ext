// ============================================================
// dialog-shop.js —— 商城面板
// 提取自 dialog-panels.js（原第 2777-2951 行）
// ============================================================
'use strict';
Dialog.shop = {
    'selected_item': 0,
    'close': function() {
        this.element.remove();
        this.isShow = false;
    },
    'onData': function(_t803) {
        if (_t803.money) {
            let _t805 = _t803.money ?? [0, 0];
            this.money = _t805[0];
            this.cash_money = _t805[1];
            if (_t805.length > 2) {
                this.footers = ['黄金', '元宝', '活动'];
                this.act_money = _t805[2];
                this.act_name = _t803.mtype ?? "<hic>积分</hic>";
            }
            this.create_footer();
        }
        if (_t803.remove) {
            let _t806 = this.get_item(_t803.remove);
            if (_t806)
                _t806.removed = true;
            return this.show_items();
        }
        if (_t803.item) {
            let[_t807,_t808] = _t803.item
              , _t809 = this.get_item(_t807);
            if (_t809) {
                _t809.count = _t808;
                this.show_items();
            }
            return;
        }
        if (!_t803.idx)
            return;
        this.idx = _t803.idx;
        this.list0 = this.format_items(_t803.selllist[0], 0);
        this.list1 = this.format_items(_t803.selllist[1], 1);
        if (_t803.selllist.length > 2)
            this.list2 = this.format_items(_t803.selllist[2], 2);
        this.show_items();
    },
    'footerChanged': function(_t810) {
        this.selected_item = parseInt(_t810);
        this.show_items();
        this.create_footer();
    },
    'footers': ['黄金', '元宝'],
    'create_footer': function() {
        if (!this.isShow)
            return;
        var _a70 = [];
        for (var _n115 = 0; _n115 < this.footers.length; _n115++) {
            _a70.push("<span class='footer-item" + (_n115 === this.selected_item ? '\x20select' : '') + "' for='" + _n115 + '\x27\x27>' + this.footers[_n115] + "</span>");
        }
        if (this.selected_item === 0)
            _a70.push("<div class=\"obj-money\">", this.money > 0 ? '你身上有' + moneyToStr(this.money) : '你身上没有银两', '</div>');
        else {
            if (this.selected_item === 1)
                _a70.push("<div class=\"obj-money\">", this.cash_money > 0 ? "你身上有" + this.cash_money + ("<hij>元宝</hij>") : "你身上没有元宝", "<span cmd=\"transmoney\">账号转入</span></div>");
            else
                this.selected_item === 2 && _a70.push("<div class=\"obj-money\">", "你身上有", this.act_money > 0 ? this.act_money : 0, this.act_name);
        }
        Dialog.footer(_a70.join(''));
    },
    'format_items': function(_t813, _t814) {
        let _a71 = [];
        for (let _t816 of _t813) {
            if (!_t816)
                continue;
            let _o6 = {
                'id': _t816[0],
                'name': _t816[1],
                'desc': _t816[2],
                'value': _t816[3],
                'grade': _t816[4],
                'discount': _t816[5]
            };
            if (_t816[6]) {
                _o6.limit = _t816[6];
                _o6.count = _t816[7];
            }
            if (_o6.discount < 1) {
                if (_t814 === 0)
                    _o6.price0 = "<del>" + _o6.value + "两黄金</del>";
                else {
                    if (_t814 === 1)
                        _o6.price0 = "<del>" + _o6.value + "元宝</del>";
                    else {
                        if (_t814 === 2)
                            _o6.price0 = "<del>" + _o6.value + this.act_name + "</del>";
                    }
                }
                _o6.value = _o6.value * _o6.discount;
            }
            if (_t814 === 0) {
                if (_o6.value >= 1)
                    _o6.price = "<hiy>" + _o6.value + '两黄金</hiy>';
                else
                    _o6.price = "<wht>" + _o6.value * 100 + "两白银</wht>";
            } else {
                if (_t814 === 1)
                    _o6.price = "<hij>" + _o6.value + "元宝</hij>";
                else
                    _t814 === 2 && (_o6.price = _o6.value + this.act_name);
            }
            _a71.push(_o6);
        }
        return _a71;
    },
    'show_items': function() {
        if (!this.isShow)
            return;
        this.create_items([this.list0, this.list1, this.list2][this.selected_item]);
    },
    'get_item': function(_t818) {
        if (this.list0) {
            for (let _t820 of this.list0)
                if (_t820.id === _t818)
                    return _t820;
        }
        if (this.list1) {
            for (let _t821 of this.list1)
                if (_t821.id === _t818)
                    return _t821;
        }
        if (this.list2) {
            for (let _t822 of this.list2)
                if (_t822.id === _t818)
                    return _t822;
        }
    },
    'show': function(_t823) {
        if (!this.element)
            this.element = $("<div class='dialog-shop-content'><div class='dialog-shop'></div></div>");
        Dialog.title("商品列表");
        Dialog.icon("shopping-cart");
        this.isShow = true;
        this.element.appendTo(Dialog.contentElement);
        if (!this.idx)
            SendCommand("shop");
        else
            SendCommand('shop\x20' + this.idx);
    },
    'create_items': function(_t825) {
        let _a72 = [];
        for (let _n116 = 0; _n116 < _t825.length; _n116++) {
            let _t827 = _t825[_n116];
            if (_t827.removed) {
                _t825.splice(_n116, 1);
                _n116--;
                continue;
            }
            _a72.push("<div class='shop-item");
            _a72.push('\x20grade', _t827.grade);
            _a72.push("'><div class='flex-1'><div class='shop-item-title'>");
            _a72.push("<div class=\"shop-item-name\">", _t827.name, "</div>");
            if (_t827.limit > 0)
                _a72.push('(', _t827.count, '/', _t827.limit, ')');
            _a72.push("</div>");
            _a72.push("<pre class='shop-desc'>");
            _a72.push(_t827.desc);
            _a72.push("</pre></div>");
            _a72.push("<div class='shop-btn' ");
            _a72.push("cmd=\"_confirm shop ", _t827.id);
            _t827.limit > 0 && _a72.push('\x20', _t827.limit - _t827.count);
            _a72.push('\x22>');
            _t827.price0 && _a72.push('&nbsp;', _t827.price0, "&nbsp;");
            _a72.push(_t827.price);
            _a72.push("</div>");
            _a72.push('</div>');
        }
        this.element.find(".dialog-shop").html(_a72.join(''));
    }
};