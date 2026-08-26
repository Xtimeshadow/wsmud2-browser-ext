// ============================================================
// dialog-message-1.js —— 消息面板（第一部分）
// 提取自 dialog-panels.js（Dialog.message）
// ============================================================
'use strict';
Dialog.message = {
    'close': function() {
        this.element.remove();
        this.isShow = false;
    },
    'hide': function() {
        if (this.detailID) {
            this.hide_detail();
            return false;
        }
    },
    'hide_detail': function() {
        this.element.removeClass("detail");
        this.detailID = null;
        Dialog.footerElement.find(".item-commands").empty();
    },
    'selected_item': 0,
    'messages': [],
    'isLoad': false,
    'unRead': 0,
    'onData': function(_t831) {
        if (_t831.receive)
            return this.updateMessageState(_t831.receive, _t831.index);
        if (_t831.items)
            return this.createMessageDetail(_t831.id, _t831.items);
        if (_t831.clear)
            return this.clear_message(_t831.clear);
        _t831.unRead !== undefined && (this.unRead = _t831.unRead);
        if (_t831.messages)
            for (var _n117 = 0; _n117 < _t831.messages.length; _n117++) {
                this.addMessage(_t831.messages[_n117]);
            }
        if (_t831.message) {
            if (!this.isShow)
                this.unRead++;
            if (this.messages)
                this.addMessage(_t831.message);
            _t831.message.id == "notice" && this.showNotice(_t831.message);
        }
        if (this.element)
            this.showMessages();
        if (this.isShow)
            _t831.message && this.element.is(".detail") & this.detailID == _t831.message.id && this.detailElement.prepend($(this.createMessageDetailItem(_t831.message.id, _t831.message.name, _t831.message)));
        else
            this.showUnread();
    },
    'showUnread': function() {
        if (this.unRead)
            ToolAction.showFlag("message", this.unRead);
        else
            ToolAction.showFlag("message", 0);
    },
    'addMessage': function(_t834) {
        for (let _n118 = 0; _n118 < this.messages.length; _n118++) {
            if (this.messages[_n118].id == _t834.id) {
                this.messages[_n118] = _t834;
                return;
            }
        }
        this.messages.push(_t834);
    },
    'clear_message': function(_t836) {
        for (let _n119 = 0; _n119 < this.messages.length; _n119++) {
            let _t838 = this.messages[_n119].id;
            if (_t836 === true && _t838 !== 'notice' || _t838 === _t836) {
                this.messages.splice(_n119, 1);
                _n119--;
            }
        }
        this.showMessages();
        if (!this.isShow)
            return;
        this.element.is(".detail") & (_t836 === true || this.detailID == _t836) && this.hide_detail();
    },
    'show': function(_t839) {
        this.unRead = 0;
        this.showUnread();
        if (this.isShow)
            return;
        this.isShow = true;
        Dialog.title('消息');
        Dialog.icon("envelope");
        this.create_footer();
        this.footerChanged(this.selected_item);
        if (this.isLoad)
            return;
        SendCommand("message");
        this.isLoad = true;
    },
    'inner_show': function() {
        Dialog.title('消息');
        Dialog.icon("envelope");
        this.element.on("click", ".message-item", this.showMessageDetail);
    },
    'inner_close': function() {
        this.element.remove();
        this.isShow = false;
    },
    'footers': ['消息', '队伍', '关系', '帮派'],
    'footerElements': ["message", "team", "relation", 'party'],
    'create_footer': function() {
        var _a73 = [];
        for (var _n120 = 0; _n120 < this.footers.length; _n120++) {
            _a73.push("<span class='footer-item" + (_n120 == this.selected_item ? " select" : '') + "' for='" + _n120 + '\x27\x27>' + this.footers[_n120] + "</span>");
        }
        _a73.push("<dic class=\"item-commands\"></div>");
        Dialog.footer(_a73.join(''));
    },
    'footerChanged': function(_t844) {
        this.selected_item = _t844;
        Dialog.footerElement.find(".item-commands").empty();
        this.showChild();
    },
    'showChild': function() {
        var _t847 = Dialog[this.footerElements[this.selected_item]];
        if (this.selectedChild)
            this.selectedChild.inner_close();
        if (!_t847.element)
            _t847.element = _t847.createElement();
        Dialog.contentElement.html(_t847.element);
        _t847.inner_show();
        this.selectedChild = _t847;
    },
    'showNotice': function(_t848) {
        var _a74 = ["\n<hiy>系统公告</hiy>\n"]
          , _t850 = new Date(_t848.time);
        _a74.push(_t850.getFullYear());
        _a74.push('年');
        _a74.push(_t850.getMonth() + 1);
        _a74.push('月');
        _a74.push(_t850.getDate());
        _a74.push('日\x20');
        _a74.push(_t850.getHours());
        _a74.push('时');
        _a74.push(_t850.getMinutes());
        _a74.push("分\n<hic>");
        _a74.push(_t848.content);
        _a74.push("\n</hic>");
        ReceiveMessage(_a74.join(''));
    },
};