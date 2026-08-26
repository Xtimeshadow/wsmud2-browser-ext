// ============================================================
// dialog-relation.js —— 关系面板（夫妻/师徒/家人）
// 提取自 dialog-panels.js（原第 3214-3305 行）
// ============================================================
'use strict';
Dialog.relation = {
    'createElement': function() {
        return $("<div class=\"dialog-relation\"></div>");
    },
    'inner_show': function() {
        SendCommand("relation");
        this.isShow = true;
        Dialog.title('关系');
        Dialog.icon("heart");
    },
    'onData': function(_t883) {
        if (!this.element)
            this.element = this.createElement();
        var _a78 = [];
        _a78.push("<div class='relation-item'>");
        _a78.push("<div class='relation-desc'>");
        if (_t883.husband) {
            _a78.push("你的丈夫：");
            _a78.push(_t883.husband);
        }
        else
            if (_t883.wife) {
                _a78.push("你的妻子：");
                _a78.push(_t883.wife);
            } else {
                _a78.push("你目前没有结婚。");
            }
        _a78.push("</div>");
        if (_t883.wife || _t883.husband) {
            _a78.push("<div class='relation-cmd' cmd='_confirm greet wife'><him>❀送花❀</him></div>");
            _a78.push("<div class='relation-cmd' cmd='rel marry'>解除关系</div>");
        }
        _a78.push('</div>');
        _a78.push("<div class='relation-item'>");
        _a78.push("<div class='relation-desc'>");
        if (_t883.shifu) {
            _a78.push('你的师父：');
            _a78.push(_t883.shifu);
        }
        else
            if (_t883.tudi) {
                _a78.push("你的徒弟：");
                _a78.push(_t883.tudi);
            } else {
                _a78.push("你目前没有拜师，也没有收徒。");
            }
        _a78.push("</div>");
        if (_t883.shifu) {
            _a78.push("<div class='relation-cmd' cmd='greet master'><hig>请安</hig></div>");
            _a78.push("<div class='relation-cmd' cmd='rel st'>出师</div>");
            _a78.push("</div>");
        }
        else
            _t883.tid && _a78.push("<div class='relation-cmd' cmd='rel st'>解除关系</div>");
        _a78.push('</div>');
        if (_t883.st !== undefined) {
            _a78.push("<div class='relation-item'><div class='relation-desc'>");
            _a78.push("当师徒组队完成副本后将获得额外奖励，本周已完成" + _t883.st + "/10。", "</div>");
            _a78.push("<div class='relation-cmd' cmd='team add ", _t883.tid ?? _t883.shifu, "'>邀请组队</div>");
            _a78.push("</div>");
        }
        if (_t883.reward) {
            _a78.push("<div class='relation-item'>");
            _a78.push(_t883.reward);
            _a78.push('</div>');
        }
        _a78.push("</div>");
        if (_t883.fls)
            for (let _t885 of _t883.fls) {
                if (!_t885)
                    continue;
                _a78.push("<div class='relation-item'>");
                _a78.push("<div class='relation-desc'>你的家人：", _t885[0]);
                if (_t885[2]) {
                    _a78.push('，已', _t885[2], format_time_span(_t885[3]));
                    _a78.push("</div>");
                    _a78.push("<div class='relation-cmd' cmd='rel ", _t885[1], " stop'>停止</div>");
                } else {
                    _a78.push("空闲中</div>");
                    _a78.push("<div class='relation-cmd' cmd='rel ", _t885[1], " caiyao'><hic>采药</hic></div>");
                    _a78.push("<div class='relation-cmd' cmd='rel ", _t885[1], " diaoyu'><hic>钓鱼</hic></div>");
                    _a78.push("<div class='relation-cmd' cmd='rel ", _t885[1], " wk'><hic>挖矿</hic></div>");
                }
                _a78.push('</div>');
            }
        this.element.html(_a78.join(''));
    },
    'inner_close': function() {
        this.element.remove();
        this.isShow = false;
    }
};