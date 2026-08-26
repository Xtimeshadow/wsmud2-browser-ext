// ============================================================
// dialog-jh-fam.js —— 江湖·门派面板
// 提取自 dialog-panels.js（原第 2398-2491 行）
// ============================================================
'use strict';
Dialog.jh_fam = {
    'name': '门派',
    'items': null,
    'selected_index': 0,
    'type': "fam",
    'onDetail': function(_t723) {
        var _t725 = this.items[_t723.index];
        if (!_t725)
            return;
        _t725.type = '门派';
        _t725.desc = _t723.desc;
        _t725.sp = _t723.sp;
        _t725.actions = _t723.actions;
        _t725.skills = _t723.skills;
        return this.showDetail(_t725);
    },
    'showDetail': function(_t726) {
        var _a59 = ["<pre><hig>"];
        _a59.push(_t726.name);
        _a59.push("</hig>\n");
        _a59.push(_t726.desc);
        if (_t726.sp) {
            _a59.push("\n<hig>特点：");
            _a59.push(_t726.sp);
            _a59.push('</hig>\x0a');
        }
        this.append_actions(_a59, _t726);
        _a59.push("<div class=\"item-commands\"><span cmd=\"jh fam " + _t726.index + (" start\">进入地图</span>"));
        let _a60 = [];
        Dialog.extend.append(_a60, "map", _t726);
        for (let _t728 of _a60) {
            _a59.push("<span cmd=\"", _t728.cmd, '\x22>', _t728.name, "</span>");
        }
        _a59.push("</div>");
        if (_t726.skills)
            _a59.push(_t726.skills);
        _a59.push("</pre>");
        this.descElement.html(_a59.join(''));
        this.select(_t726.index);
    },
    'append_actions': function(_t729, _t730) {
        let _t732 = _t730.actions ?? [];
        _t729.push("<div class=\"fb-actions\">");
        for (let _t733 of _t732) {
            _t729.push("<div class=\"fb-action\">");
            _t729.push("<span class=\"action-desc\">", _t733[2] ?? '', "</span>");
            if (_t733[1])
                _t729.push("<span class=\"action-name\"  cmd=\"", _t733[0], '\x22>', _t733[1], "</span>");
            _t729.push('</div>');
        }
        _t729.push("</div>");
    },
    'show': function(_t734, _t735) {
        var _a61 = [];
        for (var _n106 = 0; _n106 < this.items.length; _n106++) {
            var _t737 = this.items[_n106];
            _a61.push("<div class=\"fam-item");
            _a61.push("\" index=\"", _n106, '\x22>', _t737.name, "</div>");
            _t737.index = _n106;
        }
        _t734.html(_a61.join(''));
        this.listElement = _t734;
        this.descElement = _t735;
        this.onClickItem(this.selected_index);
    },
    'select': function(_t738) {
        var _t740 = this.listElement.find("div[index='" + _t738 + '\x27]');
        if (_t740.length && !_t740.is('.selected')) {
            var _t741 = _t740[0].offsetTop
              , _t742 = this.listElement.height();
            if (_t741 > _t742 / 2) {
                _t741 = (_t742 - _t740.height()) / 2;
                this.listElement[0].scrollTop = _t741;
            }
            if (this.selectedItem)
                this.selectedItem.removeClass("selected");
            this.selectedItem = _t740;
            this.selectedItem.addClass("selected");
            this.selected_index = _t738;
        }
    },
    'onClickItem': function(_t743) {
        const _t745 = this.items[_t743];
        if (!_t745.desc)
            SendCommand("jh " + this.type + '\x20' + _t743);
        else
            this.showDetail(_t745);
        this.select(_t743);
    },
    'append_footer': function() {
        let _t747 = this.items[this.selected_index];
        Dialog.footerElement.find(".item-commands").html("<span cmd=\"jh fam " + _t747.index + (" start\">进入地图</span>"));
    }
};