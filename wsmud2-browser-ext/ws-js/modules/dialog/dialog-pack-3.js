// ============================================================
// dialog-pack-3.js —— 背包面板（第 3 部分）
// 提取自 dialog-panels.js（原第 945-1095 行，属性：create_eqs ~ item_cleanup）
// ============================================================
'use strict';
Dialog.pack = Dialog.pack || {};
Dialog.pack.create_eqs = function() {
    var _t511 = this.eqElement.children();
    for (var _n77 = 0; _n77 < _t511.length; _n77++) {
        var _t512 = this.eqs[_n77];
        _t512 ? $(_t511[_n77]).attr('class', "eq-item grade" + _t512.grade).attr('oindex', _n77).find(".eq-name").html(_t512.name) : $(_t511[_n77]).attr('class', "eq-item empty").attr("oindex", '').find('.eq-name').html('');
    }
};
Dialog.pack.levels = {
    'wht': 0,
    'hig': 1,
    'hic': 2,
    'hiy': 3,
    'hiz': 4,
    'hio': 5,
    'ord': 6
};
Dialog.pack.sort_items = function(_t513) {
    if (!_t513 || !Setting.auto_sortitem)
        return _t513;
    var _a38 = [];
    for (var _n78 = 0; _n78 < _t513.length; _n78++) {
        var _t515 = _t513[_n78]
          , _b2 = false;
        for (var _n79 = 0; _n79 < _a38.length; _n79++) {
            if (_t515.grade < _a38[_n79].grade) {
                _a38.splice(_n79, 0, _t515);
                _b2 = true;
                break;
            }
        }
        !_b2 && _a38.push(_t515);
    }
    return _a38;
};
Dialog.pack.createItems = function() {
    if (!this.items)
        return;
    var _t517 = Dialog.pack.sort_items(this.items)
      , _a39 = [];
    let _t518 = this.packElement?.is(".cleanup");
    for (var _n80 = 0; _n80 < this.max_count; _n80++) {
        var _t519 = _t517[_n80];
        if (_t519) {
            _a39.push("<div class=\"obj-item ", _t519.is_lock ? "lock " : '', "grade", _t519.grade, '\x22\x20oindex=\x22');
            _a39.push(_t519.id);
            _a39.push('\x22>');
            _a39.push(_t519.name);
            if (this.show_type === 1) {
                _a39.push("<span class='obj-value'>");
                _a39.push('每');
                _a39.push(_t519.unit);
                _a39.push(moneyToStr(_t519.value));
                _a39.push('：');
                _a39.push(_t519.count);
                _a39.push(_t519.unit);
                _a39.push("</span>");
            }
            else
                if (_t519.count > 1) {
                _a39.push("<span class='obj-value'>");
                _a39.push(_t519.count);
                _a39.push(_t519.unit);
                _a39.push("</span>");
            }
            if (_t518) {
                _t519.grade > 0 && _a39.push("<span cmd='store' class='obj-oper", _t519.can_study ? '\x20selected' : '\x20', "'>存仓库</span>");
                _t519.can_combine && _t519.count >= _t519.can_combine && _a39.push("<span cmd='combine' class='obj-oper'>合成</span>");
                this.target_name && _a39.push("<span cmd='give ", Process.player, '\x20', _t519.count, "' class='obj-oper'>拿来</span>");
                if (_t519.can_eq && _t519.grade > 0) {
                    _a39.push("<span cmd='sell' class='obj-oper'>卖掉</span>");
                    _a39.push("<span cmd='fenjie' class='obj-oper'>分解</span>");
                }
                else {
                    if (_t519.value > 0)
                        _a39.push("<span cmd='sell' class='obj-oper'>卖掉</span>");
                    else
                        !_t519.grade && _a39.push("<span cmd='drop' class='obj-oper'>丢掉</span>");
                }
            }
        } else
            _a39.push("<div class=\"obj-item\" oindex=\"\">");
        _a39.push("</div>");
    }
    this.packElement.html(_a39.join(''));
};
Dialog.pack.create_item_command = function(_t520, _t521, _t522) {
    _t521.push("<span cmd=\"_confirm " + this.command_before + 'drop\x20' + _t520.count + '\x20' + _t520.id + ("\">丢掉</span>"));
    _t521.push("<span cmd=\"lockobj " + _t520.id + '\x22>', _t520.is_lock ? '解锁' : '锁定', '</span>');
    if (_t520.can_eq) {
        _t521.push("<span cmd=\"" + this.command_before + "eq " + _t520.id + ("\">装备</span>"));
        if (!this.command_before) {
            _t521.push("<span cmd=\"jinglian " + _t520.id + ("\">精炼</span>"));
            _t521.push("<span cmd=\"xiangqian " + _t520.id + ("\">镶嵌</span>"));
            _t521.push("<span cmd=\"shortcut " + _t520.id + ("\">设置快速装备</span>"));
        }
        _t521.push("<span cmd=\"" + this.command_before + "fenjie " + _t520.id + ("\">分解</span>"));
    }
    if (_t520.can_use) {
        _t521.push("<span cmd=\"" + this.command_before + "use " + _t520.id + ("\">使用</span>"));
        if (!_t520.can_eq && !this.command_before) _t521.push("<span cmd=\"shortcut " + _t520.id + ("\">设置快速使用</span>"));
    }
    _t520.can_open && _t521.push("<span cmd=\"" + this.command_before + "open " + _t520.id + ("\">打开</span>"));
    _t520.can_study && _t521.push("<span cmd=\"" + this.command_before + "study " + _t520.id + ("\">学习</span>"));
    _t520.can_combine && _t520.count >= _t520.can_combine && _t521.push("<span cmd=\"_confirm " + this.command_before + 'combine\x20' + _t520.id + '\x20' + _t520.can_combine + ("\">合成</span>"));
    this.command_before && _t521.push("<span cmd=\"_confirm " + this.command_before + "give " + Process.player + '\x20' + _t520.count + '\x20' + _t520.id + ("\">拿来</span>"));
    _t522 = _t522 || [];
    Dialog.extend.append(_t522, "pack", _t520);
    for (var _n81 = 0; _n81 < _t522.length; _n81++) {
        if (_t522[_n81].extend)
            _t521.push("<span cmd=\"", _t522[_n81].cmd, '\x22>', _t522[_n81].name, '</span>');
        else
            _t521.push("<span cmd=\"packitem ", _t522[_n81].cmd, '\x20', _t520.id, '\x22>', _t522[_n81].name, "</span>");
    }
};
Dialog.pack.item_click = function(_t524) {
    let _J58 = $(_t524.target)
      , _t526 = Dialog.pack.packElement.is(".cleanup");
    if (_t526 && _J58.is(".obj-oper"))
        return Dialog.pack.item_cleanup(_J58);
    _J58 = $(this);
    var _t527 = _J58.attr("oindex");
    if (!_t527)
        return;
    var _t528 = Dialog.pack.get_item(_t527);
    Dialog.pack.packElement.find(".item-commands").remove();
    if (!_t528)
        return;
    SCRIPT.LAST_OBJ = _t528;
    var _a40 = ["<span class='item-commands'>"];
    _a40.push("<span cmd=\"checkobj " + _t528.id + (" from item\">查看</span>"));
    Dialog.pack.create_item_command(_t528, _a40);
    _a40.push("</span>");
    _J58 = $(_a40.join('')).insertAfter(_J58);
    checkScroll(_J58);
};
Dialog.pack.eqitem_click = function() {
    var _t530 = Dialog.pack.eqs[$(this).attr("oindex")];
    if (!_t530)
        return;
    SendCommand('checkobj\x20' + _t530.id + " from eq");
};
Dialog.pack.item_cleanup = function(_t531) {
    if (_t531.is('.selected'))
        _t531.removeClass("selected");
    else {
        _t531.parent().find(".selected").removeClass("selected");
        _t531.addClass("selected");
    }
    return false;
};