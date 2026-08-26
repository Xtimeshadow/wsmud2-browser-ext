// ============================================================
// dialog-party.js —— 帮派面板
// 提取自 dialog-panels.js（原第 3306-3427 行）
// ============================================================
'use strict';
Dialog.party = {
    'createElement': function() {
        return $("<div class=\"dialog-party\"></div>");
    },
    'inner_show': function() {
        SendCommand("party load");
        this.isShow = true;
        Dialog.title('');
        this.element.on("click", ".party-role", this.show_commands);
        Dialog.icon('flag');
    },
    'levels': ['', "<hio>帮主<hio>", "<hiz>副帮主</hiz>", "<hiy>长老</hiy>", "<hic>堂主</hic>", '帮众'],
    'level_roles': [1, 20, 30, 40, 50, 60],
    'level': 5,
    'get_role': function(_t889) {
        if (!this.roles)
            return;
        for (var _n125 = 0; _n125 < this.roles.length; _n125++) {
            if (this.roles[_n125].id == _t889)
                return this.roles[_n125];
        }
    },
    'command': function(_t891) {
        if (_t891 === 'create') {
            let _a79 = ["<div class=\"dialog-party-add\">"];
            _a79.push("<div>创建帮派需要500两<hiy>黄金</hiy>，请输入帮派名称(2-5字中文)：</div>");
            _a79.push("<input type=\"text\" >");
            _a79.push("<div class='item-commands'><span cmd='_party cancle'>取消</span><span cmd='_party create2'>确定</span></div>");
            _a79.push("</div>");
            this.element.html(_a79.join(''));
        } else {
            if (_t891 === "cancle")
                this.empty('你还没有加入帮派');
            else {
                if (_t891 === "create2") {
                    let _J77 = $(".dialog-party-add>input").val();
                    if (!_J77 || _J77.length > 5 || _J77.length < 2)
                        return ReceiveMessage("帮派名字需要是2-5中文字符。");
                    SendCommand("party create2 " + _J77);
                }
            }
        }
    },
    'empty': function(_t893) {
        this.element.html("<wht>" + _t893 + ("</wht><div class='item-commands'><span cmd='_party create'>创建帮派</span><span cmd='party list'>加入帮派</span></div>"));
    },
    'show_list': function(_t895) {
        if (!_t895.list.length)
            return this.empty("现在没有已经创建的帮派");
        var _a80 = [];
        for (let _t897 of _t895.list) {
            _a80.push("<div class='party-item'>");
            _a80.push("<span class='party-item-name'>");
            _a80.push(_t897[0]);
            _a80.push("</span>");
            _a80.push("<span class='party-item-sc'>人数：");
            _a80.push(_t897[1]);
            _a80.push("</span>");
            _a80.push("<span class='party-item-cmd' cmd='party join ", _t897[0], "'>加入</span>");
            _a80.push("</div>");
        }
        this.element.html(_a80.join(''));
    },
    'onData': function(_t898) {
        if (_t898.list)
            return this.show_list(_t898);
        if (!_t898.name)
            return this.empty("你还没有加入帮派");
        Dialog.title("帮派【" + _t898.name + '】\x20<nor>' + _t898.roles.length + '/' + this.level_roles[_t898.level] + "</nor>");
        var _a81 = [];
        _t898.notice && (_a81.push("<div class='party-notice'>"),
        _a81.push(_t898.notice),
        _a81.push("</div>"));
        _a81.push("<div class='party-roles'>");
        for (var _n126 = 0; _n126 < _t898.roles.length; _n126++) {
            var _t901 = _t898.roles[_n126];
            _t901.id == Process.player && (this.level = _t901.level);
            _a81.push("<div class='party-role' roleid='" + _t901.id + '\x27>');
            _a81.push("<span class='role-level'>");
            _a81.push(this.levels[_t901.level]);
            _a81.push("</span>");
            _a81.push("<span class='role-name'>");
            _a81.push(_t901.name);
            _a81.push("</span>");
            _a81.push("<span class='role-sc'>");
            _a81.push(_t901.sc);
            _a81.push('</span>');
            _a81.push("</div>");
        }
        _a81.push("</div>");
        this.roles = _t898.roles;
        this.element.html(_a81.join(''));
    },
    'show_commands': function() {
        var _t903 = Dialog.party.get_role($(this).attr("roleid"));
        if (!_t903)
            return;
        var _a82 = ["<div class='item-commands'>"];
        if (_t903.id == Process.player) {
            _a82.push("<span cmd=\"party out\">退出帮派</span>");
            Dialog.party.level === 1 && _a82.push("<span cmd=\"party dissmiss\">解散</span>");
        }
        else {
            if (_t903.level > Dialog.party.level - 1 && _t903.level > 2)
                _a82.push("<span cmd=\"party uplevel " + _t903.id + "\">提升为" + Dialog.party.levels[_t903.level - 1] + "</span>");
            _t903.level > Dialog.party.level && _t903.level < 5 && _a82.push("<span cmd=\"party downlevel " + _t903.id + "\">降级为" + Dialog.party.levels[_t903.level + 1] + '</span>');
            Dialog.party.level === 1 && _t903.level === 2 && _a82.push("<span cmd=\"party trans " + _t903.id + ("\">让位</span>"));
            if (_t903.level > Dialog.party.level)
                _a82.push("<span cmd=\"party remove " + _t903.id + ("\">开除</span>"));
            _t903.online && _a82.push("<span cmd=\"team add " + _t903.id + ("\">邀请组队</span>"));
        }
        if (_a82.length === 1)
            return;
        _a82.push("</div>");
        Dialog.party.element.find(".item-commands").remove();
        $(_a82.join('')).insertAfter(this);
    },
    'inner_close': function() {
        this.element.remove();
        this.isShow = false;
    }
};