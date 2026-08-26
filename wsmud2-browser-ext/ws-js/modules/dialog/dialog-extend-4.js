// ============================================================
// dialog-extend-4.js —— 自定义扩展/触发器面板（第四部分）
// 提取自 dialog-panels.js（Dialog.extend + Dialog.friend + Dialog.pay）
// ============================================================
'use strict';
// 此文件延续 Dialog.extend，需在 dialog-extend-3.js 之后加载
Dialog.extend.query = function(_t1105, _t1106) {
    let _a96 = [];
    this.append(_a96, _t1105, _t1106);
    return _a96;
};
Dialog.extend.append = function(_t1108, _t1109, _t1110) {
    let _t1112 = this.groups[_t1109];
    if (!_t1112)
        return;
    for (let _t1113 of _t1112) {
        this.check_para(_t1113, _t1110) && _t1108.push(_t1113);
    }
};
Dialog.extend.message_filter = function(_t1114) {};
Dialog.extend.data_filter = function() {};
Dialog.extend.trigger = function(_t1115) {
    if (!this.groups)
        return;
    let _t1117 = this.groups.message;
    if (!_t1117)
        return;
    for (let _t1118 of _t1117) {
        if (!_t1118.check)
            continue;
        _t1118.check(_t1115) && SCRIPT.run(_t1118.cmd);
    }
};
Dialog.extend.process = function(_t1119) {
    if (!this.groups)
        return;
    let _t1121 = this.groups.data;
    if (!_t1121)
        return;
    for (let _t1122 of _t1121) {
        if (this.check_para(_t1122, _t1119)) {
            SCRIPT.LAST_DATA = _t1119;
            SCRIPT.run(_t1122.cmd);
        }
    }
};
Dialog.extend.check_para = function(_t1123, _t1124) {
    if (!_t1123.check)
        return true;
    for (let _fn9 of _t1123.check) {
        if (!_fn9(_t1124))
            return false;
    }
    return true;
};
Dialog.extend.onButtonClick = function() {
    let _J84 = $(this).attr('ecmd').split('_')
      , _t1127 = _J84[0];
    _J84[0] = $(this);
    let _t1128 = Dialog.extend["cmd_" + _t1127];
    _t1128 && _t1128.apply(Dialog.extend, _J84);
};
Dialog.extend.cmd_add = function() {
    this.edit_elem.removeClass('hide');
    this.list_elem.addClass('hide');
    this.edit_elem.attr("sid", '-1');
    let _t1130 = this.edit_elem.find("input, textarea");
    for (let _t1131 of _t1130) {
        $(_t1131).val('');
    }
};
Dialog.extend.cmd_up = function() {
    this.cmd_move(-1);
};
Dialog.extend.cmd_down = function() {
    this.cmd_move(1);
};
Dialog.extend.cmd_move = function(_t1133) {
    let _t1135 = this.selected_item;
    if (!_t1135)
        return;
    let _t1136 = this.setting.indexOf(_t1135)
      , _t1137 = this.setting.indexOf(_t1135) + _t1133;
    if (_t1137 < 0 || _t1137 >= this.setting.length)
        return;
    this.setting.splice(_t1136, 1);
    this.setting.splice(_t1137, 0, _t1135);
    this.refresh_list();
    this.save_extend();
};
Dialog.extend.cmd_edit = function() {
    let _t1139 = this.selected_item;
    if (!_t1139)
        return;
    this.edit_elem.removeClass("hide");
    this.list_elem.addClass("hide");
    this.edit_elem.attr("sid", this.setting.indexOf(_t1139));
    let _t1140 = this.edit_elem.find("input, textarea, select");
    for (let _t1141 of _t1140) {
        let _J85 = $(_t1141).val()
          , _t1142 = _t1139[_t1141.getAttribute("prop")];
        if (_t1142 !== _J85) {
            $(_t1141).val(_t1142).change();
        }
    }
};
Dialog.extend.cmd_save = function() {
    let _n138 = parseInt(this.edit_elem.attr("sid"))
      , _t1144 = this.edit_elem.find("input, textarea, select")
      , _o9 = {};
    for (let _t1145 of _t1144) {
        _o9[_t1145.getAttribute('prop')] = _t1145.value;
    }
    if (!_o9.name)
        return this.show_error("name");
    if (!_o9.type)
        return this.show_error("type");
    if (!_o9.content)
        return this.show_error("content");
    if (_o9.paras) {
        Dialog.extend.regex[_o9.for] ? _o9.check = this.match(_o9.paras) : _o9.check = this.condtion(_o9.paras);
        if (!_o9.check)
            return this.show_error("paras");
    }
    this.hide();
    $(this.create_item(_o9, this.setting.length)).appendTo(this.list_elem);
    if (_n138 < 0) {
        this.setting.push(_o9);
    } else {
        _o9.on = this.setting[_n138].on;
        this.setting[_n138] = _o9;
        this.refresh_list();
    }
    this.save_extend();
};
Dialog.extend.cmd_remove = function() {
    let _t1147 = this.selected_item;
    if (!_t1147)
        return;
    this.setting.Remove(_t1147),
    this.refresh_list(),
    this.save_extend();
};
Dialog.extend.show_error = function(_t1148) {
    let _t1150 = this.element.find("[prop=\"" + _t1148 + '\x22]').parent();
    _t1150.addClass("error-shake");
    setTimeout( () => {
        _t1150.removeClass("error-shake");
    }
    , 1500);
};
Dialog.extend.cmd_show = function(_t1152, _t1153) {
    let _t1155 = SCRIPT.helper[_t1153];
    if (!_t1155)
        return;
    let _a97 = [];
    for (let _n139 = 0; _n139 < _t1155.length; _n139++) {
        _a97.push('<li>', _t1155[_n139], "</li>");
    }
    let _t1156 = _t1152.parent();
    _t1156.html(_a97.join(''));
    _t1156.next().html('返回').attr("ecmd", "return");
};
Dialog.extend.cmd_return = function(_t1157) {
    _t1157.html('保存').attr("ecmd", "save").prev().html(this.helper);
};
// ============================================================
// Dialog.friend —— 好友面板
// 提取自 dialog-panels.js
// ============================================================
Dialog.friend = {
    'show': function() {
        if (!this.data)
            return SendCommand('friend');
    },
    'onData': function(_t1159) {}
};
// ============================================================
// Dialog.pay —— 支付面板
// 提取自 dialog-panels.js
// ============================================================
Dialog.pay = {
    'createElement': function() {},
    'show': function() {
        this.isShow = true;
        this.element = this.createElement();
        this.element.appendTo(Dialog.contentElement);
    },
    'close': function() {
        this.element.remove();
        this.isShow = false;
    }
};