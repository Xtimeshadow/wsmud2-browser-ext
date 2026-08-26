// ============================================================
// dialog-list-2.js —— 商店/仓库买卖面板（第二部分）
// 提取自 dialog-panels.js（Dialog.list）
// ============================================================
'use strict';
// 此文件延续 Dialog.list，需在 dialog-list-1.js 之后加载
Dialog.list.show_footer = function(_t611) {
    _t611 = this.money_name ? this.gongji : _t611;
    let _t613 = this.isstore ? "store" : 'sell';
    if (this.isstore) {
        var _t614 = this.money_name ? "你目前有" + _t611 + "<hiy>" + this.money_name + "</hiy>" : "你身上有" + moneyToStr(_t611);
        Dialog.footerElement.html("<div class='obj-money'>" + _t614 + ("<span cmd='") + _t613 + (" all'>存仓库</span></div>"));
    } else {
        _t614 = this.money_name ? '你目前有' + _t611 + "<hiy>" + this.money_name + "</hiy>" : '你身上有' + moneyToStr(_t611);
        Dialog.footerElement.html("<div class='obj-money'>" + _t614 + ("<span cmd='") + _t613 + (" all'>清理杂物</span></div>"));
    }
};
Dialog.list.update_pack = function() {
    var _t616 = Dialog.pack.items;
    if (!_t616)
        SendCommand("pack");
    else {
        this.create_items(_t616, this.rightElement, 1, Dialog.pack.max_count);
        this.show_footer(Dialog.pack.money);
    }
};
Dialog.list.create_items = function(_t617, _t618, _t619, _t620) {
    var _a46 = []
      , _t622 = _t617;
    (_t619 === 1 || _t619 === 3) && (_t622 = Dialog.pack.sort_items(_t617));
    for (var _n89 = 0; _n89 < _t620; _n89++) {
        var _t623 = _t622[_n89];
        _a46.push("<div class=\"obj-item");
        if (_t623) {
            _a46.push(_t623.is_lock ? " lock" : '', " grade", _t623.grade);
            _a46.push("\" obj=\"");
            _a46.push(_t623.id);
            _a46.push("\" otype=\"");
            _a46.push(_t619);
            _a46.push('\x22>');
            if (_t619 === 1) {
            _a46.push("<span class=\"grade", _t623.grade, '\x22>');
            _a46.push(_t623.name);
            _a46.push("</span>");
        } else {
            _a46.push(_t623.name);
        }
            _a46.push("<span class='obj-value'>");
            if (_t619 === 2) {
                _a46.push('每');
                _a46.push(_t623.unit);
                _a46.push(this.money_name ? _t623.value + '<hiy>' + this.money_name + "</hiy>" : moneyToStr(_t623.value));
                if (_t623.count == -1) {
                _a46.push("：大量现货");
            } else {
                _a46.push("：剩余");
                _a46.push(_t623.count);
                _a46.push(_t623.unit);
            }
            }
            else {
                if (_t619 === 1 && !this.isstore) {
                    if (_t623.value) {
                    _a46.push('每');
                    _a46.push(_t623.unit);
                    _a46.push(moneyToStr(_t623.value));
                    _a46.push('：');
                    _a46.push(_t623.count);
                    _a46.push(_t623.unit);
                } else {
                    _a46.push("不可出售");
                }
                }
                else
                    if (_t623.count > 1) {
                    _a46.push(_t623.count);
                    _a46.push(_t623.unit);
                }
            }
            _a46.push("</span>");
        } else
            _a46.push('\x22>');
        _a46.push("</div>");
    }
    _t618.html(_a46.join(''));
};
Dialog.list.item_click = function() {
    var _J64 = $(this)
      , _t625 = _J64.attr("obj")
      , _t626 = parseInt(_J64.attr("otype"))
      , _t627 = Dialog.list.find_item(_t626, _t625);
    if (!_t627)
        return;
    var _a47 = ["<div class='item-commands'>"];
    if (Dialog.list.isstore) {
        if (_t626 === 3) {
            _a47.push("<span cmd=\"checkobj " + _t625 + " from store" + ("\">查看</span>"));
            _a47.push("<span cmd=\"_confirm qu " + _t625 + ("\">取出</span>"));
        }
        else
            if (_t626 === 1) {
            _a47.push("<span cmd=\"checkobj " + _t625 + (" from item\">查看</span>"));
            _a47.push("<span cmd=\"_confirm store " + _t627.count + '\x20' + _t625 + ("\">存到仓库</span>"));
        }
    } else {
        if (_t626 === 2) {
            _a47.push("<span cmd=\"checkobj " + _t625 + '\x20from\x20' + Dialog.list.seller + ("\">查看</span>"));
            if (_t627.count)
                _a47.push("<span cmd=\"_confirm buy " + _t627.count + '\x20' + _t625 + " from " + Dialog.list.seller + ("\">购买</span>"));
        } else
            if (_t626 === 1) {
            _a47.push("<span cmd=\"checkobj " + _t625 + (" from item\">查看</span>"));
            _a47.push("<span cmd=\"_confirm sell " + _t627.count + '\x20' + _t625 + " to " + Dialog.list.seller + ("\">卖掉</span>"));
        }
    }
    _a47.push("</div>");
    Dialog.list.element.find(".item-commands").remove();
    _J64 = $(_a47.join('')).insertAfter(_J64);
    checkScroll(_J64);
};