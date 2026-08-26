// ============================================================
// dialog-master.js —— 师父/随从技能面板
// 提取自 dialog-panels.js（原第 482-629 行）
// ============================================================
'use strict';
Dialog.master = {
    'isShow': false,
    'hide': function() {
        if (this.skill_element) {
            this.skill_element.remove();
            this.skill_element = null;
            this.element.removeClass("hide-item");
            Dialog.footer('');
            return false;
        }
        this.isShow = false;
    },
    'close': Dialog.skills.close,
    'createSkillItems': Dialog.skills.createSkillItems,
    'createSkillItem': Dialog.skills.createSkillItem,
    'updateSkill': Dialog.skills.updateSkill,
    'updateSkillItem': Dialog.skills.updateSkillItem,
    'showdesc': Dialog.skills.showdesc,
    'isEnable': Dialog.skills.isEnable,
    'onData': function(_t450) {
        if (_t450.desc)
            return this.showdesc(_t450);
        if (_t450.id)
            return this.updateSkill(_t450);
        if (_t450.books)
            return this.showBooks();
        if (_t450.remove && _t450.from === this.master) {
            this.items.Remove(this.skills[_t450.remove]);
            var _t452 = this.skills[_t450.remove];
            for (var _n71 = 0; _n71 < this.items.length; _n71++) {
                this.items[_n71].enable_skill == _t450.remove && (this.items[_n71].enable_skill = null);
            }
            delete this.skills[_t450.remove];
            return this.createSkillItems(this.items);
        }
        if (!_t450.master && !_t450.follower)
            return;
        Dialog.show("master");
        this.master = _t450.master || _t450.follower;
        this.is_follower = !!_t450.follower;
        var _o5 = {};
        for (_n71 = 0; _n71 < _t450.items.length; _n71++) {
            var _t453 = _t450.items[_n71];
            _o5[_t453.id] = _t453;
        }
        this.skills = _o5;
        this.items = _t450.items;
        Dialog.title(_t450.title);
        Dialog.icon('book');
        this.createSkillItems(_t450.items, _o5);
        if (_t450.limit) {
            if (this.is_follower) {
                let _a31 = ["<div class=\"footer-item select\" for=\"0\">", "技能</div>"];
                _a31.push("<div class=\"footer-item\" for=\"1\">书架</div>");
                _a31.push("<span class='obj-money'>", _t450.target, "目前的技能上限为<HIC>", _t450.limit, "</HIC>级</span>");
                Dialog.footer(_a31.join(''));
            } else
                Dialog.footer("<span class='obj-money'>你目前的技能上限为<HIC>" + _t450.limit + ("</HIC>级</span>"));
        }
    },
    'create_footer': function() {},
    'selectedItem': 0,
    'footerChanged': function(_t454) {
        _t454 = parseInt(_t454);
        if (_t454 === this.selectedItem)
            return;
        this.selectedItem = _t454;
        if (_t454 === 0) {
            this.element.removeClass("dialog-books");
            this.createSkillItems(this.items, this.skills);
        }
        else {
            if (!Dialog.skills.books)
                SendCommand("sbook");
            else
                this.showBooks();
            return this.element.addClass("dialog-books");
        }
    },
    'showBooks': function() {
        if (!this.isShow || !this.is_follower)
            return;
        var _a32 = []
          , _t457 = Dialog.skills.sort_items(Dialog.skills.books);
        for (let _t458 of _t457) {
            _a32.push("<div class=\"book-item ");
            _a32.push("grade", _t458.grade, "\" >");
            _a32.push("<div class=\"book-name\">", _t458.name, "</div>");
            _a32.push("<div class=\"book-action border-right\" cmd=\"sbook ", _t458.id, "\">查看</div>");
            _a32.push("<div class=\"book-action\" cmd=\"dc ", Dialog.master.master, " study ", _t458.id, "\">学习</div>");
            _a32.push("</div>");
        }
        this.element.html(_a32.join(''));
    },
    'show': function() {
        if (this.isShow)
            return;
        if (!this.element) {
            this.element = $("<div class=\"dialog-skills\"></div >");
        }
        this.element.on('click', ".skill-item", this.item_click);
        this.element.appendTo(Dialog.contentElement);
        this.element.removeClass('hide-item');
        this.isShow = true;
    },
    'item_click': function() {
        var _J56 = $(this)
          , _t461 = Dialog.master.skills[_J56.attr("skid")];
        if (!_t461)
            return;
        var _a33 = ["<div class='item-commands'>"];
        _a33.push("<span cmd=\"checkskill " + _t461.id + '\x20' + Dialog.master.master + ("\">查看详细</span>"));
        _a33.push("<span cmd=\"xue " + _J56.attr("skid") + " from " + Dialog.master.master + ("\">学习</span>"));
        _t461.master = 1;
        if (Dialog.master.is_follower) {
            var _t462 = "dc " + Dialog.master.master;
            _a33.push("<span cmd=\"_confirm " + _t462 + '\x20fangqi\x20' + _J56.attr("skid") + ("\">遗忘</span>"));
            _a33.push("<span cmd=\"" + _t462 + " lianxi " + _J56.attr('skid') + ("\">练习</span>"));
            if (_t461.can_enables)
                for (var _n72 = 0; _n72 < _t461.can_enables.length; _n72++) {
                    var _t463 = Dialog.master.skills[_t461.can_enables[_n72]];
                    if (!_t463)
                        continue;
                    if (_t463.enable_skill != _t461.id)
                        _a33.push("<span cmd=\"" + _t462 + " enable " + _t463.id + '\x20' + _t461.id + "\">装备" + _t463.name + "</span>");
                    else
                        _a33.push("<span cmd=\"" + _t462 + '\x20enable\x20' + _t463.id + (" none\">取消装备") + _t463.name + "</span>");
                }
            if (_t461.enable_skill) {
                var _t464 = Dialog.master.skills[_t461.enable_skill];
                if (_t464)
                    _a33.push("<span cmd=\"" + _t462 + " enable " + _t461.id + (" none\">取消装备") + _t464.name + "</span>");
                else
                    _t461.enable_skill = null;
            }
            _t461.master = 0;
        }
        SCRIPT.LAST_OBJ = _t461;
        let _t465 = Dialog.extend.query('mskill', _t461);
        for (let _t466 of _t465) {
            _a33.push("<span cmd=\"", _t466.cmd, '\x22>', _t466.name, '</span>');
        }
        _a33.push("</div>");
        Dialog.master.element.find(".item-commands").remove();
        $(_a33.join('')).insertAfter(_J56);
        checkScroll(_J56);
    }
};