// ============================================================
// dialog-trade.js —— 交易面板
// 提取自 dialog-panels.js（原第 1208-1370 行）
// ============================================================
'use strict';
Dialog.trade = {
    'hide': function() {
        this.element.remove();
        this.isShow = false;
    },
    'close': function() {
        this.hide();
    },
    'onData': function(_t559) {
        !this.isShow && Dialog.show("trade");
        Dialog.title('和' + _t559.name + "交易中");
        var _t561 = Dialog.pack.items;
        this.trade_target = _t559.target;
        this.trade_list.length = 0;
        if (!Dialog.pack.items)
            SendCommand("pack");
        else
            this.update_pack();
        Dialog.pack.isShow = false;
        this.create_items(this.leftElement.empty(), this.trade_list, this.max_count);
    },
    'update_pack': function(_t562) {
        this.create_items(this.rightElement.empty(), Dialog.pack.items, Dialog.pack.max_count);
    },
    'max_count': 10,
    'trade_list': [],
    'show': function(_t564) {
        if (this.isShow)
            return;
        Dialog.init();
        Dialog.curItem = 'trade';
        if (!this.element) {
            this.element = $("<div class=\"dialog-list\"><div class=\"obj-list\"></div><div class=\"obj-list\"></div></div >");
            this.leftElement = $(this.element.children()[0]);
            this.rightElement = $(this.element.children()[1]);
            this.element[0].addEventListener('click', this._captureClick, true);
        }
        this.element.appendTo(Dialog.contentElement.empty());
        this.create_footer();
        this.isShow = true;
    },
    'create_footer': function() {
        var _a43 = ["<div class='item-commands'>"];
        _a43.push("<span cmd='_trade ok'>确定</span>");
        _a43.push("<span  cmd='_trade cancle'>取消</span>");
        _a43.push("</div>");
        Dialog.footer(_a43.join(''));
    },
    'confirm': function(_t567) {
        if (_t567 === 'ok' && this.trade_list.length)
            for (var _n82 = 0; _n82 < this.trade_list.length; _n82++) {
                SendCommand("give " + this.trade_target + '\x20' + this.trade_list[_n82].count + '\x20' + this.trade_list[_n82].id);
            }
        Dialog.hide();
    },
    'create_items': function(_t569, _t570, _t571) {
        var _a44 = [];
        _t570 = Dialog.pack.sort_items(_t570);
        for (var _n83 = 0; _n83 < _t571; _n83++) {
            var _t573 = _t570[_n83];
            _a44.push("<div class=\"obj-item");
            if (_t573) {
                _a44.push(_t573.is_lock ? " lock" : '', '\x20grade', _t573.grade);
                _a44.push('\x22');
                _a44.push(" oindex='" + _t573.id + '\x27>');
                _a44.push(_t573.name);
                if (_t573.count > 1) {
                    _a44.push("<span class='obj-value'>");
                    _a44.push(_t573.count);
                    _a44.push(_t573.unit);
                    _a44.push('</span>');
                }
            } else {
                _a44.push('\x22>');
            }
            _a44.push("</div>");
        }
        _t569.html(_a44.join(''));
    },
    '_captureClick': function(ev) {
        var item = $(ev.target).closest('.obj-item');
        if (!item.length)
            return;
        var parent = item.parent();
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (parent.is('.obj-list:first-child')) {
            Dialog.trade.left_click.call(item[0], ev);
        } else if (parent.is('.obj-list:last-child')) {
            Dialog.trade.right_click.call(item[0], ev);
        }
    },
    'left_click': function() {
        var _J61 = $(this)
          , _t575 = _J61.attr('oindex');
        if (!_t575)
            return;
        var _t576 = null;
        for (var _n84 = 0; _n84 < Dialog.trade.trade_list.length; _n84++) {
            if (Dialog.trade.trade_list[_n84].id == _t575) {
                _t576 = Dialog.trade.trade_list[_n84];
                break;
            }
        }
        if (!_t576)
            return;
        Dialog.trade.cancle_trade(_t576);
        return false;
    },
    'enable_item': function(_t577, _t578) {
        var _t580 = this.rightElement.find(".obj-item[oindex='" + _t577.id + '\x27]');
        if (!_t580.length)
            return;
        _t578 ? _t580.removeClass("disabled") : _t580.addClass("disabled");
    },
    'right_click': function() {
        var _J62 = $(this);
        if (_J62.is(".disabled"))
            return;
        var _t582 = _J62.attr("oindex");
        if (!_t582)
            return;
        var _t583 = Dialog.pack.get_item(_t582);
        if (!_t583)
            return;
        if (_t583.count > 1) {
            return Confirm.Show_trade_add(_t583);
        }
        Dialog.trade.add_trade(_t583);
        return false;
    },
    'add_trade': function(_t584) {
        for (var _n85 = 0; _n85 < this.trade_list.length; _n85++) {
            if (_t584.id == this.trade_list[_n85].id) {
                this.trade_list[_n85].count += _t584.count;
                return this.create_items();
            }
        }
        this.trade_list.push(_t584);
        this.create_items(this.leftElement.empty(), this.trade_list, this.max_count);
        this.enable_item(_t584, false);
    },
    'cancle_trade': function(_t586) {
        for (var _n86 = 0; _n86 < this.trade_list.length; _n86++) {
            if (_t586.id == this.trade_list[_n86].id) {
                this.trade_list.splice(_n86, 1);
                _n86--;
            }
        }
        this.create_items(this.leftElement.empty(), this.trade_list, this.max_count);
        this.enable_item(_t586, true);
    }
};