// ============================================================
// dialog-keys-2.js —— 快捷键面板（第二部分）
// 提取自 dialog-panels.js（Dialog.keys）
// ============================================================
'use strict';
// 此文件延续 Dialog.keys，需在 dialog-keys-1.js 之后加载
Dialog.keys.get_item = function(_t975) {
    if (this.groups.length === 2)
        this.init();
    let _t977 = _t975.split('_')
      , _t978 = Dialog.keys.groups[parseInt(_t977[0])];
    if (!_t978)
        return;
    let _t979 = _t978.items[parseInt(_t977[1])];
    return _t979;
};
Dialog.keys.default_keys = {
    'KeyW': "0_2",
    'KeyA': "0_0",
    'KeyR': "0_6",
    'KeyD': "0_1",
    'KeyS': "0_3",
    'KeyQ': '0_4'
};
Dialog.keys.init_key = function() {
    if (this.load_storage)
        return;
    if (Util.isMobile)
        return;
    this.load_storage = true;
    this.setting = storageUtil.getItem("keys");
    window.addEventListener('keydown', this.keypress);
    this.id2keys = {};
    if (!this.setting)
        return;
    for (let _t981 in this.setting) {
        this.id2keys[this.setting[_t981]] = _t981;
    }
};
Dialog.keys.keypress = function(_t982) {
    if (_t982.target !== document.body)
        return;
    let _t984 = Dialog.keys.setting;
    if (!_t984)
        return;
    let _t985 = Dialog.keys.get_key_code(_t982);
    if (_t984[_t985]) {
        let _t986 = Dialog.keys.get_item(_t984[_t985]);
        _t986 && (SCRIPT.run(_t986.cmd),
        _t982.preventDefault());
    }
};
Dialog.keys.item_clicked = function() {
    let _t988 = Dialog.keys.select_item;
    if (_t988)
        _t988.removeClass('selected');
    Dialog.keys.select_item = $(this).addClass("selected");
};
Dialog.keys.init = function() {
    if (this.groups.length > 2)
        return;
    let _t990 = this.id2keys || {}
      , _t991 = null
      , _n131 = 0;
    for (let _t992 of this.groups) {
        for (let _n132 = 0; _n132 < _t992.items.length; _n132++) {
            _t991 = _n131 + '_' + _n132;
            _t992.items[_n132].id = _t991;
            _t992.items[_n132].key = _t990[_t991];
        }
        _n131++;
    }
    let _o7 = {
        'name': "动作栏",
        'items': []
    };
    for (let _n133 = 0; _n133 < 12; _n133++) {
        _t991 = '2_' + _n133;
        _o7.items.push({
            'name': '栏位' + (_n133 + 1),
            'id': _t991,
            'cmd': '#action\x20' + _n133,
            'key': _t990[_t991]
        });
    }
    this.groups.push(_o7);
    _o7 = {
        'name': "技能栏",
        'items': []
    };
    for (let _n134 = 0; _n134 < 12; _n134++) {
        _t991 = '3_' + _n134;
        _o7.items.push({
            'name': '栏位' + (_n134 + 1),
            'id': _t991,
            'cmd': "#pfm " + _n134,
            'key': _t990[_t991]
        });
    }
    this.groups.push(_o7);
    this.element && this.create_html();
};
Dialog.keys.create_html = function() {
    let _a89 = []
      , _n135 = 0
      , _n136 = 0;
    for (let _t994 of this.groups) {
        _a89.push("<h3>", _t994.name, "</h3>"),
        _n136 = 0;
        for (let _t995 of _t994.items) {
            _a89.push("<div class=\"skey-item\" sid=\"", _t995.id, '\x22>'),
            _a89.push("<div class=\"skey-name\">", _t995.name, "</div>"),
            _a89.push("<div class=\"skey-key\">", _t995.key, "</div>"),
            _a89.push("</div>"),
            _n136++;
        }
        _n135++;
    }
    this.element.html(_a89.join(''));
};