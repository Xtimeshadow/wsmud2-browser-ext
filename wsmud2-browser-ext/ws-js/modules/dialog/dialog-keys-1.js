// ============================================================
// dialog-keys-1.js —— 快捷键面板（第一部分）
// 提取自 dialog-panels.js（Dialog.keys）
// ============================================================
'use strict';
Dialog.keys = {
    'groups': [{
        'name': '移动',
        'items': [{
            'name': '左',
            'key': null,
            'cmd': "#go @dir(left)"
        }, {
            'name': '右',
            'key': null,
            'cmd': "#go @dir(right)"
        }, {
            'name': '上',
            'key': null,
            'cmd': "#go @dir(up)"
        }, {
            'name': '下',
            'key': null,
            'cmd': "#go @dir(down)"
        }, {
            'name': '左上',
            'key': null,
            'cmd': "#go @dir(leftup)"
        }, {
            'name': '左下',
            'key': null,
            'cmd': "#go @dir(leftdown)"
        }, {
            'name': '右上',
            'key': null,
            'cmd': "#go @dir(rightup)"
        }, {
            'name': '右下',
            'key': null,
            'cmd': "#go @dir(rightdown)"
        }]
    }, {
        'name': '菜单',
        'items': [{
            'name': '属性',
            'key': null,
            'cmd': "#menu score"
        }, {
            'name': '背包',
            'key': null,
            'cmd': "#menu pack"
        }, {
            'name': '技能',
            'key': null,
            'cmd': "#menu skills"
        }, {
            'name': '任务',
            'key': null,
            'cmd': "#menu tasks"
        }, {
            'name': '商城',
            'key': null,
            'cmd': "#menu shop"
        }, {
            'name': '社交',
            'key': null,
            'cmd': "#menu message"
        }, {
            'name': '排行',
            'key': null,
            'cmd': "#menu stats"
        }, {
            'name': '设置',
            'key': null,
            'cmd': "#menu setting"
        }, {
            'name': '动作',
            'key': null,
            'cmd': "#menu showcombat"
        }, {
            'name': '活动',
            'key': null,
            'cmd': "#menu events"
        }, {
            'name': '聊天',
            'key': null,
            'cmd': "#menu showchat"
        }, {
            'name': '停止',
            'key': null,
            'cmd': "#menu stopstate"
        }, {
            'name': '江湖',
            'key': null,
            'cmd': "#menu jh"
        }]
    }],
    'setting': null,
    'show': function(_t959) {
        this.element = _t959;
        this.init();
        _t959.on('click', ".skey-item", this.item_clicked);
        document.body.addEventListener("keydown", this.record_press);
    },
    'hide': function() {
        document.body.removeEventListener("keydown", this.record_press);
    },
    'close': function() {
        document.body.removeEventListener('keydown', this.record_press);
    },
    'record_press': function(_t963) {
        let _t965 = Dialog.keys.select_item;
        if (!_t965)
            return;
        let _t966 = Dialog.keys.get_item(_t965.attr("sid"));
        if (!_t966)
            return;
        if (_t963.keyCode === 8 || _t963.keyCode === 27) {
            Dialog.keys.save_setting(_t966, null);
            return _t965.find('.skey-key').html('');
        }
        let _t967 = Dialog.keys.get_key_code(_t963);
        Dialog.keys.save_setting(_t966, _t967);
        _t965.find(".skey-key").html(_t966.key);
        _t963.preventDefault();
        _t963.stopPropagation();
    },
    'get_key_code': function(_t968) {
        let _t970 = _t968.code;
        if (_t968.ctrlKey) {
            if (_t968.key === 'Control')
                return;
            _t970 = "Ctrl+" + _t970;
        }
        if (_t968.altKey) {
            if (_t968.key === 'Alt')
                return;
            _t970 = "Alt+" + _t970;
        }
        if (_t968.shiftKey) {
            if (_t968.key === "Shift")
                return;
            _t970 = "Shift+" + _t970;
        }
        return _t970;
    },
    'save_setting': function(_t971, _t972) {
        _t971.key = _t972;
        if (!this.setting)
            this.setting = {};
        if (!_t972) {
            _t972 = this.id2keys[_t971.id];
            if (_t972)
                delete this.setting[_t972];
            delete this.id2keys[_t971.id];
        } else {
            if (_t972) {
                if (this.setting[_t972]) {
                    if (this.setting[_t972] === _t971.id)
                        return;
                    let _t974 = this.get_item(this.setting[_t972]);
                    _t974 && (_t974.key = null,
                    this.element.find(".skey-item[sid=\"" + _t974.id + ("\"]>.skey-key")).html(''));
                }
                this.setting[_t972] = _t971.id;
            }
        }
        storageUtil.setItem("keys", this.setting);
    },
};