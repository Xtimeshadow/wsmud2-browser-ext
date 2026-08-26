// ============================================================
// dialog-team.js —— 队伍面板
// 提取自 dialog-panels.js（原第 3428-3502 行）
// ============================================================
'use strict';
Dialog.team = {
    'createElement': function() {
        return $("<div class=\"dialog-team\"></div>");
    },
    'inner_show': function() {
        SendCommand('team');
        this.isShow = true;
        Dialog.title('队伍');
        this.element.on("click", ".team-item", this.clickItem);
        Dialog.icon("list");
    },
    'items': [],
    'onData': function(_t906) {
        if (_t906.items) {
            this.items = _t906.items;
            if (_t906.items.length)
                this.isCap = _t906.items[0].id == Process.player;
            else
                this.isCap = 0;
        }
        _t906.dismiss && (this.items.length = 0,
        this.isCap = false);
        if (_t906.remove) {
            if (!this.items.length)
                return;
            for (var _n127 = 0; _n127 < this.items.length; _n127++) {
                if (this.items[_n127].id == _t906.remove) {
                    this.items.splice(_n127, 1);
                    break;
                }
            }
        }
        this.createItems();
    },
    'inner_close': function() {
        this.element.remove();
        this.isShow = false;
    },
    'createItems': function() {
        if (!this.element)
            return;
        var _a83 = [];
        for (var _n128 = 0; _n128 < this.items.length; _n128++) {
            var _t910 = this.items[_n128];
            _a83.push("<div class='team-item' index='" + _n128 + '\x27>');
            _a83.push("<span class='team-flag'>");
            _a83.push(_n128 > 0 ? '' : "<span class='glyphicon glyphicon-flag'></span>");
            _a83.push('</span>');
            _a83.push("<span class='team-title'>");
            _a83.push(_t910.name);
            _a83.push('</span>');
            _a83.push("</div>");
        }
        if (!_a83.length)
            _a83.push("<div class=\"empty\">你还没有加入任何队伍。</div>");
        this.element.html(_a83.join(''));
    },
    'clickItem': function() {
        var _J78 = $(this)
          , _t912 = Dialog.team.items[_J78.attr("index")];
        if (!_t912)
            return;
        var _a84 = ["<div class='item-commands'>"];
        _a84.push("<span cmd=\"look3 " + _t912.id + ("\">查看</span>"));
        var _t913 = Dialog.team.items[0].id == Process.player;
        if (_t913 && _t912.id != Process.player)
            _a84.push("<span cmd=\"team remove " + _t912.id + ("\">移出队伍</span>"));
        else
            _t912.id == Process.player && _a84.push("<span cmd=\"team out " + _t912.id + ("\">退出队伍</span>"));
        _t913 && _t912.id == Process.player && _a84.push("<span cmd=\"team set\">更改分配方式</span>");
        _a84.push("</div>");
        Dialog.team.element.find(".item-commands").remove();
        $(_a84.join('')).appendTo(_J78);
    }
};