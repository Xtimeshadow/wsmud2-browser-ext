// ============================================================
// dialog-extend-3.js —— 自定义扩展/触发器面板（第三部分）
// 提取自 dialog-panels.js（Dialog.extend）
// ============================================================
'use strict';
// 此文件延续 Dialog.extend，需在 dialog-extend-2.js 之后加载
Dialog.extend.hide = function() {
    this.is_record && this.stop_record();
    if (this.list_elem.is(".hide")) {
        this.list_elem.removeClass("hide");
        this.edit_elem.addClass('hide');
    }
    this.footer_buttons && this.footer_buttons.remove();
};
Dialog.extend.close = function() {};
Dialog.extend.default_extend = [{
    'name': "<red>全部击杀</red>",
    'type': 'button',
    'for': "action",
    'content': "kill @npc"
}, {
    'name': "<gre>全部拾取</gre>",
    'type': "button",
    'for': 'action',
    'content': "get all from @item(尸体)"
}, {
    'name': "<gre>返回武庙</gre>",
    'type': "button",
    'for': "map",
    'paras': "name(扬州)",
    'content': "jh fam 0 start;go north;go north;go west"
}, {
    'name': '练习到指定等级',
    'type': "button",
    'for': 'skill',
    'content': "lianxi @id @input"
}, {
    'name': '学习到指定等级',
    'type': "button",
    'for': 'mskill',
    'content': "xue @input @id from @master"
}];
Dialog.extend.init_extend = function() {
    if (!this.setting)
        this.setting = storageUtil.getItem("extends") ?? this.default_extend;
    this.init_extend_group();
};
Dialog.extend.init_extend_group = function() {
    this.groups = {};
    for (let _t1058 of this.setting) {
        this.init_extend_item(_t1058);
    }
};
Dialog.extend.save_extend = function() {
    storageUtil.setItem("extends", this.setting);
    this.init_extend_group();
    Combat.refActions();
};
Dialog.extend.init_extend_item = function(_t1060) {
    let _t1062 = this.groups[_t1060.for];
    if (!_t1062)
        _t1062 = this.groups[_t1060.for] = [];
    let _t1063 = _t1060.content;
    if (_t1060.on === true) {
        _t1060.on = {};
        _t1060.on[Process.player] = 1;
    }
    if (!_t1063 || !_t1060.on || !_t1060.on[Process.player])
        return;
    if (_t1063[0] !== '#')
        _t1063 = '#' + _t1063;
    _t1062.push({
        'name': _t1060.name,
        'extend': true,
        'check': this.regex[_t1060.for] ? this.match(_t1060.paras) : this.condtion(_t1060.paras),
        'cmd': _t1063
    });
};
Dialog.extend.match = function(_t1064) {
    try {
        if (!_t1064)
            return null;
        return this.express.match.bind(this, new RegExp(_t1064));
    } catch (_t1066) {
        console.error(_t1066);
        return null;
    }
};
Dialog.extend.exp_reg = /(\w+)\((>=|<=|!=|>|<)?(.+?)\)/g;
Dialog.extend.condtion = function(_t1067) {
    if (!_t1067)
        return null;
    let _t1069 = null
      , _a95 = [];
    while (_t1069 = this.exp_reg.exec(_t1067)) {
        let _t1070 = _t1069[1]
          , _t1071 = _t1069[2]
          , _t1072 = _t1069[3];
        if (!_t1070 || !_t1072)
            return null;
        if (_t1071) {
            let _t1073 = this.express[_t1071];
            if (!_t1073)
                return null;
            _a95.push(_t1073.bind(this, _t1070, _t1072));
        } else {
            if (_t1072[0] === '/' && _t1072[_t1072.length - 1] === '/')
                _a95.push(this.express.match_prop.bind(this, _t1070, new RegExp(_t1072.substring(1, _t1072.length - 1))));
            else
                _a95.push(this.express.def.bind(this, _t1070, _t1072));
        }
    }
    return _a95.length > 0 ? _a95 : null;
};
Dialog.extend.express = {
    '>=': function(_t1074, _t1075, _t1076) {
        return _t1076[_t1074] >= parseInt(_t1075);
    },
    '>': function(_t1077, _t1078, _t1079) {
        return _t1079[_t1077] > parseInt(_t1078);
    },
    '<': function(_t1080, _t1081, _t1082) {
        return _t1082[_t1080] < parseInt(_t1081);
    },
    '<=': function(_t1083, _t1084, _t1085) {
        return _t1085[_t1083] <= parseInt(_t1084);
    },
    '=': function(_t1086, _t1087, _t1088) {
        return _t1088[_t1086] = parseInt(_t1087);
    },
    '!=': function(_t1089, _t1090, _t1091) {
        return _t1091[_t1089] != parseInt(_t1090);
    },
    'match': function(_t1092, _t1093) {
        let _t1095 = _t1092.exec(_t1093);
        if (!_t1095)
            return false;
        return SCRIPT.lAST_MATCHES = _t1095,
        true;
    },
    'match_prop': function(_t1096, _t1097, _t1098) {
        let _t1099 = _t1098[_t1096];
        if (!_t1099 || !_t1097)
            return false;
        return _t1097.test(_t1099);
    },
    'def': function(_t1100, _t1101, _t1102) {
        let _t1104 = _t1102[_t1100];
        if (typeof _t1104 === "number")
            return _t1104 === parseInt(_t1101);
        else {
            if (typeof _t1104 === "boolean")
                return _t1104 && _t1104.toString() === _t1101;
        }
        return _t1104 && _t1104.indexOf(_t1101) > -1;
    }
};