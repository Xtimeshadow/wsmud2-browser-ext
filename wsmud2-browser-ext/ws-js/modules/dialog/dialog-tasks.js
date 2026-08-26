// ============================================================
// dialog-tasks.js —— 任务面板 + 排行榜常量
// 提取自 dialog-panels.js（原第 2054-2127 行）
// ============================================================
'use strict';
Dialog.tasks = {
    'close': function() {
        this.element.remove();
        this.isShow = false;
    },
    'update_item': function(_t673) {
        for (var _n98 = 0; _n98 < this.items.length; _n98++) {
            if (this.items[_n98].id == _t673.id) {
                if (_t673.state) {
                this.items[_n98].title = _t673.title;
                this.items[_n98].state = _t673.state;
                this.items[_n98].desc = _t673.desc;
            } else {
                this.items.splice(_n98, 1);
            }
                break;
            }
        }
        this.create_items();
    },
    'onData': function(_t675) {
        if (_t675.id)
            return this.update_item(_t675);
        Dialog.title('任务列表');
        Dialog.icon("exclamation-sign");
        this.items = _t675.items;
        this.create_items();
    },
    'show': function() {
        if (!this.element)
            this.element = $("<div class='dialog-tasks'></div>");
        SendCommand("tasks");
        if (this.isShow)
            return;
        this.element.appendTo(Dialog.contentElement);
        this.isShow = true;
    },
    'status_css': ['', "none", "finish", 'over'],
    'create_items': function() {
        var _a51 = []
          , _b3 = false;
        for (var _n99 = 0; _n99 < this.items.length; _n99++) {
            var _t679 = this.items[_n99];
            _a51.push("<div class='task-item flex-row ");
            _a51.push(this.status_css[_t679.state]);
            _a51.push("'><div class='flex-1'><h3>");
            _a51.push(_t679.title);
            _a51.push("</h3>");
            _a51.push("<pre class='task-desc'>");
            _a51.push(_t679.desc);
            _a51.push("</pre></div>");
            _a51.push("<span class='task-btn flex-0'");
            if (_t679.state === 1)
                _a51.push(">进行中");
            else {
                if (_t679.state === 2) {
                    _a51.push(" cmd=\"task ");
                    _a51.push(_t679.id);
                    _a51.push(" fin\"");
                    _b3 = true;
                    _a51.push(">可领取");
                }
                else
                    _t679.state === 3 && _a51.push(">已完成");
            }
            _a51.push('</span>');
            _a51.push("</div>");
        }
        this.element.html(_a51.join(''));
        Dialog.footer('');
    }
};
const STATS_SILDER1 = [['总榜', ''], ["武当派", "wudang"], ["少林派", "shaolin"], ["华山派", "huashan"], ['峨眉派', 'emei'], ["逍遥派", "xiaoyao"], ['丐帮', "gaibang"], ['杀手楼', "shashou"], ["无门无派", 'none']]
  , STATS_SILDER2 = [['武器', ''], ['衣服', 'cloth'], ['鞋', "shoes"], ['头部', 'head'], ['披风', "cape"], ['戒指', "ring"], ['项链', "necklace"], ['饰品', 'jewels'], ['护腕', 'wrist'], ['腰带', "waist"], ['暗器', "throwing"]];