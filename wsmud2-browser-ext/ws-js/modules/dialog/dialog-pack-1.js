// ============================================================
// dialog-pack-1.js —— 背包面板（第 1 部分）
// 提取自 dialog-panels.js（原第 630-870 行，属性：close ~ show_moeny/cleanup_cmds）
// ============================================================
'use strict';
Dialog.pack = Dialog.pack || {};
Dialog.pack.close = Dialog.skills.close;
Dialog.pack.hide = Dialog.skills.hide;
Dialog.pack.command_before = '';
Dialog.pack.updateitem = function(_t467) {
    var _a34;
    if (_t467.money !== undefined) {
        this.money = _t467.money;
        this.show_moeny();
    }
    if (_t467.eq_group !== undefined) {
        this.eq_group = _t467.eq_group;
        this.show_moeny();
    }
    else {
        if (_t467.eq !== undefined && this.items) {
            for (var _n73 = 0; _n73 < this.items.length; _n73++) {
                if (this.items[_n73].id == _t467.id) {
                    this.eqs[_t467.eq] = this.items[_n73];
                    this.items.splice(_n73, 1);
                    break;
                }
            }
            this.show_items();
        } else {
            if (_t467.uneq !== undefined && this.items) {
                var _t469 = this.eqs[_t467.uneq];
                _t469.can_eq = 1;
                _t469.count = 1;
                this.items.push(_t469);
                this.eqs[_t467.uneq] = null;
                this.show_items();
            } else {
                if (_t467.locked >= 0) {
                    let _t470 = this.get_item(_t467.id);
                    if (_t470) {
                        _t470.is_lock = _t467.locked;
                        let _t471 = this.packElement.find('[oindex=\x22' + _t467.id + '\x22]');
                        _t470.is_lock ? _t471.addClass("lock") : _t471.removeClass("lock");
                    }
                } else {
                    if (_t467.jldesc) {
                        _a34 = [];
                        _a34.push(_t467.jldesc);
                        _a34.push("<span class='item-commands'>");
                        _a34.push("<span cmd=\"" + this.command_before + "jinglian " + _t467.id + (" ok\">精炼</span>"));
                        _a34.push("<span cmd=\"" + this.command_before + 'jinglian\x20' + _t467.id + (" full\">精炼到满级</span>"));
                        _a34.push("</span>");
                        this.show_sub(_a34.join(''));
                    } else {
                        if (_t467.xqdesc) {
                            _a34 = [];
                            _a34.push(_t467.xqdesc);
                            _a34.push("<span class='item-commands'>");
                            for (_n73 = 0; _n73 < _t467.stones.length; _n73++) {
                                var _t472 = _t467.stones[_n73];
                                _a34.push("<span cmd=\"" + this.command_before + "xiangqian " + _t467.id + '\x20' + _t472.id + "\">镶嵌" + _t472.name + ("</span><br/>"));
                            }
                            _a34.push("</span>");
                            this.show_sub(_a34.join(''));
                        } else {
                            if (_t467.desc) {
                                _a34 = [];
                                _a34.push(_t467.desc);
                                _a34.push("<span class='item-commands'>");
                                var _t473 = _t467.from;
                                if (_t473 === 'eq')
                                    _a34.push("<span cmd=\"" + this.command_before + "uneq " + _t467.id + ("\">取消装备</span>"));
                                else {
                                    if (_t473 === "item") {
                                        var _t474 = this.get_item(_t467.id);
                                        SCRIPT.LAST_OBJ = _t474;
                                        _t474 && this.create_item_command(_t474, _a34, _t467.commands);
                                    } else {
                                        if (_t473 === "store")
                                            _a34.push("<span cmd=\"_confirm qu " + _t467.id + ("\">取出</span>"));
                                        else
                                            _t473 === 'sj' ? _a34.push("<span cmd=\"_confirm qu " + _t467.id + ("\">取出</span>")) : _a34.push("<span cmd=\"_confirm buy 1 " + _t467.id + " from " + Dialog.list.seller + ("\">购买</span>"));
                                    }
                                }
                                _a34.push('</span>');
                                this.show_sub(_a34.join(''));
                            } else {
                                if (_t467.remove && this.items) {
                                    var _t475 = this.items;
                                    for (_n73 = 0; _n73 < _t475.length; _n73++) {
                                        if (_t475[_n73].id == _t467.id) {
                                            if (_t467.remove >= _t475[_n73].count) {
                                                _t475.splice(_n73, 1);
                                                Combat.DisObj(_t467);
                                            } else {
                                                _t475[_n73].count -= _t467.remove;
                                            }
                                            break;
                                        }
                                    }
                                    if (this.isShow)
                                        this.show_items();
                                    else
                                        return false;
                                } else {
                                    if (_t467.name && this.items) {
                                        _t469 = this.get_item(_t467.id);
                                        _t469 ? (_t469.count = _t467.count,
                                        _t469.name = _t467.name) : this.items.push(_t467);
                                        if (this.isShow)
                                            this.show_items();
                                        else
                                            return false;
                                    } else {
                                        if (_t467.max_item_count) {
                                            this.max_count = _t467.max_item_count;
                                            ReceiveMessage((Dialog.pack2.isShow ? Dialog.pack2.target_name : '你') + '的背包容量扩充为' + this.max_count + '。');
                                            this.show_items();
                                        }
                                        else
                                            return false;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return true;
};