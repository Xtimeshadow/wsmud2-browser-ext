// ============================================================
// dialog-jh-ar.js —— 江湖·禁地面板
// 提取自 dialog-panels.js（原第 2597-2673 行）
// ============================================================
'use strict';
Dialog.jh_ar = {
    'name': '禁地',
    'items': null,
    'type': 'ar',
    'selected_index': 0,
    'select': Dialog.jh_fam.select,
    'onClickItem': Dialog.jh_fam.onClickItem,
    'append_status': Dialog.jh_fb.append_status,
    'append_actions': Dialog.jh_fam.append_actions,
    'fb_models': ['普通', '普通', '组队'],
    'onDetail': function(_t769) {
        var _t771 = this.items[_t769.index];
        if (!_t771)
            return;
        _t771.type = '禁地';
        _t771.desc = _t769.desc;
        _t771.actions = _t769.actions;
        _t771.status = _t769.status;
        _t771.reward = _t769.reward;
        return this.showDetail(_t771);
    },
    'update_unlock': function(_t772) {
        for (let _n112 = 0; _n112 < this.items.length; _n112++) {
            this.items[_n112].unlock = (_t772 & Math.pow(2, _n112)) !== 0;
        }
    },
    'show': function(_t773, _t774) {
        var _a66 = ["<div class='fb-content'>"];
        let _t776 = Math.max(this.items.length, 10);
        for (var _n113 = 0; _n113 < _t776; _n113++) {
            var _t777 = this.items[_n113];
            _a66.push("<div class=\"fb-item");
            if (_t777) {
                if (!_t777.unlock)
                    _a66.push(" lock");
                _a66.push('\x22\x20index=\x22', _n113, '\x22>', _t777.name, '</div>');
                _t777.index = _n113;
            } else {
                _a66.push("\">&nbsp;</div>");
            }
        }
        _a66.join('</div>');
        this.listElement = _t773;
        this.descElement = _t774;
        this.listElement.html(_a66.join(''));
        this.onClickItem(this.selected_index);
    },
    'showDetail': function(_t778) {
        var _a67 = ["<pre>"];
        _a67.push(_t778.name);
        _t778.unlock ? _a67.push("\n<hig>已解锁</hig>\n") : _a67.push("\n<red>未解锁</red>\n");
        _a67.push(_t778.desc, '\x0a');
        this.append_status(_a67, _t778);
        this.append_actions(_a67, _t778);
        if (_t778.unlock) {
            _a67.push("<div class=\"item-commands\">");
            _a67.push("<span cmd=\"jh ar " + _t778.index + (" start\">进入地图</span>"));
            let _a68 = [];
            Dialog.extend.append(_a68, 'map', _t778);
            for (let _t780 of _a68) {
                _a67.push("<span cmd=\"", _t780.cmd, '\x22>', _t780.name, "</span>");
            }
            _a67.push("</div>");
        }
        _a67.push(_t778.reward);
        _a67.push("</pre>");
        this.descElement.html(_a67.join(''));
        this.select(_t778.index);
    },
    'append_footer': function() {
        let _t782 = this.items[this.selected_index];
        if (_t782.unlock)
            Dialog.footerElement.find(".item-commands").html("<span cmd=\"jh ar " + _t782.index + (" start\">进入地图</span>"));
        else
            Dialog.footerElement.find(".item-commands").empty();
    }
};