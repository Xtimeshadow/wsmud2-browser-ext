// ============================================================
// dialog-skills-1.js —— 自身技能面板（第 1 部分）
// 提取自 dialog-panels.js（原第 35-239 行，属性：isShow ~ onData 前半）
// ============================================================
'use strict';
Dialog.skills = Dialog.skills || {};
Dialog.skills.isShow = false;
Dialog.skills.selectItem = ".dialog-skills";
Dialog.skills.hide = function() {
    if (this.skill_element) {
        this.skill_element.remove();
        this.skill_element = null;
        this.element.removeClass("hide-item");
        this.create_footer();
        this.skill_element_id = null;
        return false;
    }
};
Dialog.skills.close = function() {
    this.hide();
    this.element.remove();
    this.isShow = false;
    this.skill_element_id = null;
    this.element.removeClass('hide-item');
};
Dialog.skills.limit = 0;
Dialog.skills.selected_item = -1;
Dialog.skills.showdesc = function(_t397) {
    if (!this.isShow)
        return;
    this.element.find(".item-commands").remove();
    if (this.skill_element)
        this.skill_element.remove();
    this.skill_element = $("<pre></pre>").html(_t397.desc).appendTo(this.element);
    this.skill_element_id = _t397.id;
    this.element.addClass("hide-item");
    let _a23 = ["<div class=\"item-commands\">"];
    if (this.master) {
        _a23.push("<span cmd=\"xue ", _t397.id, " from ", this.master, "\">学习</span>");
        if (this.is_follower) {
            _a23.push("<span cmd=\"dc ", this.master, " lingwu ", _t397.id, "\">进阶</span>");
            _a23.push("<span cmd=\"dc ", this.master, " fangqi ", _t397.id, "\">遗忘</span>");
        }
    }
    else {
        if (_t397.is_custom)
            _a23.push("<span cmd=\"zc ", _t397.id, "\">推演</span>");
        _a23.push("<span cmd=\"lingwu ", _t397.id, "\">进阶</span>");
        _a23.push("<span cmd=\"lingwu2 ", _t397.id, "\">融合</span>");
        _a23.push("<span cmd=\"fangqi ", _t397.id, "\">遗忘</span>");
    }
    _a23.push("</div>");
    Dialog.footer(_a23.join(''));
};
Dialog.skills.footerChanged = function(_t399, _t400) {
    if (_t399 == this.selected_item && !_t400)
        return;
    this.selected_item = _t399;
    Dialog.skills.element.find(".item-commands").remove();
    if (_t399 == 2) {
        if (!this.books)
            SendCommand('sbook');
        else
            this.showBooks();
        return this.element.addClass("dialog-books");
    }
    if (this.element.is(".dialog-books")) {
        this.element.removeClass("dialog-books");
        this.create_footer();
        return this.createSkillItems(this.items);
    }
    if (_t399 == 0) {
        this.element.find(".base").removeClass("hide");
        this.element.find('.skill').addClass("hide");
    }
    else
        if (_t399 == 1) {
        this.element.find(".base").addClass("hide");
        this.element.find(".skill").removeClass("hide");
    }
};
Dialog.skills.footers = ['基础', '特殊', '书架'];
Dialog.skills.eq_group = 0;
Dialog.skills.create_footer = function(_t402) {
    var _t404 = this.footers
      , _a24 = [];
    for (var _n60 = 0; _n60 < _t404.length; _n60++) {
        _a24.push("<span class='footer-item" + (_n60 == this.selected_item ? " select" : '') + "' for='" + _n60 + "''>" + _t404[_n60] + "</span>");
    }
    if (!_t402)
        for (let _n61 = 0; _n61 < 3; _n61++) {
            _a24.push("<span class=\"sk-group", 2 - _n61 === this.sk_group ? " select" : '', "\" group=\"", 2 - _n61, '\x22>', 3 - _n61, '</span>');
        }
    Dialog.footer(_a24.join(''));
};
Dialog.skills.eq_group_click = function() {
    let _n62 = parseInt($(this).attr("group"));
    if (_n62 >= 0)
        SendCommand("skgroup " + _n62);
};
Dialog.skills.updateSkill = function(_t405) {
    if (!this.skills)
        return;
    var _t407 = this.skills[_t405.id];
    if (!_t407)
        return this.addSkill(_t407);
    if (_t405.name)
        _t407.name = _t405.name;
    if (_t405.grade >= 0 && _t405.grade !== _t407.grade) {
        _t407.grade = _t405.grade;
        if (_t407.can_enables)
            for (let _t408 of _t407.can_enables) {
                let _t409 = this.skills[_t408];
                _t409 && _t409.enable_skill === _t405.id && this.updateSkillItem(_t409);
            }
    }
    if (_t405.enable) {
        if (_t407.enable_skill) {
            var _t410 = _t407.enable_skill;
            _t407.enable_skill = null;
            this.skills[_t410][_t405.id] = false;
            this.updateSkillItem(this.skills[_t410]);
        }
        this.skills[_t405.enable][_t405.id] = true;
        _t407.enable_skill = _t405.enable;
        this.updateSkillItem(this.skills[_t405.enable]);
        this.updateSkillItem(this.skills[_t405.id]);
    } else {
        if (_t405.exp !== undefined || _t405.level !== undefined) {
            if (_t405.level >= 0)
                _t407.level = _t405.level;
            if (_t405.exp >= 0)
                _t407.exp = _t405.exp;
            if (_t405.can_enables)
                _t407.can_enables = _t405.can_enables;
            this.updateSkillItem(_t407);
        } else {
            if (_t405.enable === false) {
                if (_t407.enable_skill) {
                    _t410 = _t407.enable_skill;
                    this.skills[_t410][_t405.id] = false;
                    _t407.enable_skill = null;
                    this.updateSkillItem(this.skills[_t410]);
                    this.updateSkillItem(this.skills[_t405.id]);
                }
            }
        }
    }
};
Dialog.skills.updateSkillItem = function(_t411) {
    var _t413 = this.element.find(".skill-item[skid='" + _t411.id + '\x27]');
    if (_t413) {
        let _t414 = _t413.css("display") === 'none';
        _t413.replaceWith(this.createSkillItem(_t411));
        if (_t414)
            _t413.hide();
    }
};
Dialog.skills.addSkill = function(_t415) {
    if (!this.items || !_t415)
        return;
    if (this.skills[_t415.id])
        return this.updateSkill(_t415);
    this.items.push(_t415);
    this.skills[_t415.id] = _t415;
    this.items = this.sort_items(this.items);
    this.createSkillItems(this.items);
};
Dialog.skills.format_books = function(_t417) {
    let _a25 = [];
    for (let _n63 = 0; _n63 < _t417.length; _n63++) {
        _a25.push({
            'name': _t417[_n63][0],
            'grade': _t417[_n63][1],
            'id': _n63
        });
    }
    return _a25;
};