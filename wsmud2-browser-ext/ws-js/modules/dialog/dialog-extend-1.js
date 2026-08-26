// ============================================================
// dialog-extend-1.js —— 自定义扩展/触发器面板（第一部分）
// 提取自 dialog-panels.js（Dialog.extend）
// ============================================================
'use strict';
Dialog.extend = {
    'types': [{
        'name': "自定义快捷操作",
        'value': "button",
        'for': [{
            'name': '动作栏',
            'value': 'action'
        }, {
            'name': '地图',
            'value': "map"
        }, {
            'name': "背包道具",
            'value': "pack"
        }, {
            'name': '技能',
            'value': 'skill'
        }, {
            'name': "师父/随从技能",
            'value': "mskill"
        }, {
            'name': "房间物体",
            'value': 'item'
        }]
    },{
        name: '数据触发器',
        value: 'trigger',
        for: [{
            'name': '数据',
            'value': 'data'
        }]
    },{
        'name': '文本触发器',
        'value': 'filter',
        'for': [{
            'name': '文本',
            'value': 'message'
        }]
    }],
    'init': function(_t996) {
        _t996.on("click", "[ecmd]", this.onButtonClick);
        _t996.on("click", ".setting-item", this.onClickRow);
        _t996.on("click", ".switch", this.switchClick);
        _t996.on("change", "select", this.selectChanged);
        if (this.element)
            return;
        this.element = _t996;
        let _a90 = [];
        _a90.push("<div class=\"extend-list\">");
        this.append_settings(_a90);
        _a90.push("</div>");
        this.append_edit(_a90);
        _t996.html(_a90.join(''));
        this.edit_elem = this.element.find(".extend-add");
        this.list_elem = this.element.find(".extend-list");
    },
    'refresh_list': function() {
        let _a91 = [];
        this.append_settings(_a91);
        this.list_elem.html(_a91.join(''));
    },
    'append_settings': function(_t999) {
        let _t1001 = this.setting
          , _n137 = 0;
        for (let _t1002 of _t1001) {
            _t999.push(this.create_item(_t1002, _n137++));
        }
    },
    'action_types': {
        'button': '快捷操作',
        'trigger': "触发器",
        'filter': '过滤器'
    },
    'regex': {
        'message': true,
        'fmessage': true
    },
    'for_types': {
        'map': '地图',
        'action': "动作栏",
        'pack': '背包道具',
        'skill': '技能',
        'item': "房间物体",
        'mskill': "师父/随从技能",
        'message': '文本',
        'data': '事件',
        'fmessage': '文本',
        'fdata': '事件'
    },
    'create_item': function(_t1003, _t1004) {
        let _a92 = [];
        _a92.push("<div class=\"setting-item\" sid=\"", _t1004++, '\x22>');
        _a92.push("<div class=\"title\">");
        _a92.push(this.for_types[_t1003.for], this.action_types[_t1003.type], '【', _t1003.name, '】');
        _a92.push("</div>");
        let _b5 = false;
        if (_t1003.on && _t1003.on[Process.player])
            _b5 = true;
        _a92.push("<span class=\"switch ", _b5 ? 'on' : '', "\"><span class=\"switch-button\"></span><span class=\"switch-text\">开</span></span>");
        _a92.push("</div>");
        return _a92.join('');
    },
    'selectChanged': function() {
        let _J80 = $(this);
        if (_J80.attr("prop") !== 'type') {
            const _t1007 = _J80.val();
            _J80.parent().next().find(".extend-row-header").html(Dialog.extend.regex[_t1007] ? "正则表达式" : "可选参数");
            return;
        }
        let _t1008 = _J80.val()
          , _t1009 = null;
        for (let _t1010 of Dialog.extend.types) {
            if (_t1008 === _t1010.value) {
                _t1009 = _t1010.for;
                break;
            }
        }
        if (!_t1009)
            return;
        _J80 = _J80.parent().next().find("select");
        let _a93 = [];
        for (let _t1011 of _t1009) {
            _a93.push("<option value=\"", _t1011.value, '\x22>', _t1011.name, "</option>");
        }
        _J80.html(_a93.join(''));
    },
    'switchClick': function() {
        let _J81 = $(this)
          , _t1013 = _J81.find(".switch-text")
          , _t1014 = _t1013.text()
          , _t1015 = _t1014 !== "开始记录"
          , _b6 = false;
        if (_J81.is(".on")) {
            _J81.removeClass('on');
            if (_t1015)
                _t1013.html('关');
        } else {
            _J81.addClass('on');
            if (_t1015)
                _t1013.html('开');
            _b6 = true;
        }
        if (!_t1015) {
            if (_b6) {
            Dialog.close();
            Dialog.extend.start_record();
        } else {
            Dialog.extend.stop_record();
        }
        }
        else {
            let _t1016 = Dialog.extend.setting[_J81.parent().attr('sid')];
            if (_t1016) {
                if (!_t1016.on)
                    _t1016.on = {};
                if (_b6) {
                    _t1016.on[Process.player] = 1;
                } else {
                    delete _t1016.on[Process.player];
                }
                Dialog.extend.save_extend(_t1016);
            }
        }
        return false;
    },
    'start_record': function() {
        if (this.is_record)
            return;
        this.is_record = true,
        this.prev_time = 0,
        this.record_cmds = [],
        ReceiveMessage("<hic>开始记录你的操作命令。</hic>"),
        Process.state({
            'state': "正在记录你的操作命令"
        });
    },
    'excluded': {
        'score': true,
        'score2': true,
        'pack': true,
        'cha': true,
        'tasks': true,
        'message': true,
        'relation': true,
        'shop': true,
        'team': true,
        'jh': true
    },
};