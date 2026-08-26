// ============================================================
// dialog-events.js —— 活动面板
// 提取自 dialog-panels.js（原第 3503-3593 行）
// ============================================================
'use strict';
Dialog.events = {
    'unRead': 0,
    'hide': function() {
        this.element.remove();
        this.isShow = false;
    },
    'onData': function(_t915) {
        if (_t915.close)
            return Dialog.hide();
        if (!_t915.items) {
            if (_t915.finish)
                this.unRead--;
            else
                this.unRead++;
            return this.showUnread();
        }
        this.items = _t915.items;
        this.create_items();
    },
    'showUnread': function() {
        ToolAction.showFlag('events', this.unRead);
    },
    'show': function() {
        if (!this.element)
            this.element = $("<div class='dialog-events'></div>");
        SendCommand("events");
        if (this.isShow)
            return;
        Dialog.title('活动');
        Dialog.icon("dashboard");
        this.unRead = 0;
        this.showUnread();
        Dialog.footer('');
        this.element.appendTo(Dialog.contentElement);
        this.isShow = true;
    },
    'create_items': function() {
        if (!this.element) {
            if (!this.isShow)
                return;
            this.element = $("<div class='dialog-events'></div>");
            this.element.appendTo(Dialog.contentElement);
        }
        let _a85 = [];
        for (let _n129 = 0; _n129 < this.items.length; _n129++) {
            const [_t920,_t921,_t922,_t923,_t924,_t925] = this.items[_n129];
            _a85.push("<div class='event-item flex-row ");
            _a85.push("grade", _t923);
            _a85.push("'><div class='flex-1'><h3>");
            _a85.push(_t921);
            _a85.push('</h3>');
            _a85.push("<pre class='event-desc'>");
            _a85.push(_t922);
            if (_t924 > 0)
                _a85.push("\n<mem>", this.format_time(_t924), "</mem>");
            _a85.push("</pre></div>");
            _a85.push("<span class='event-btn flex-0'");
            if (_t925)
                _a85.push(" cmd='events ", _t920, '\x27\x20>', _t925);
            else
                _a85.push(">进行中");
            _a85.push('</span>');
            _a85.push('</div>');
        }
        if (!_a85.length)
            _a85.push("<div class=\"empty\">暂无活动</div>");
        this.element.html(_a85.join(''));
        Dialog.footer("<span class=\"obj-money\">共有" + this.items.length + ("项活动正在进行</span>"));
    },
    'format_time': function(_t926) {
        let _t928 = new Date(_t926)
          , _t929 = new Date()
          , _t930 = _t928.getDate()
          , _t931 = _t928.getHours()
          , _t932 = _t928.getMinutes()
          , _a86 = ["持续到"];
        if (_t929.getFullYear() !== _t928.getFullYear())
            _a86.push(_t928.getFullYear(), '年');
        if (_t929.getMonth() !== _t928.getMonth())
            _a86.push(this.format_num(_t928.getMonth() + 1), '月', this.format_num(_t930), '日');
        else {
            if (_t930 !== _t929.getDate())
                _a86.push(this.format_num(_t930), '日');
        }
        _a86.push(this.format_num(_t931), ':', this.format_num(_t932));
        return _a86.join('');
    },
    'format_num': function(_t933) {
        return _t933 > 9 ? _t933.toString() : '0' + _t933.toString();
    }
};