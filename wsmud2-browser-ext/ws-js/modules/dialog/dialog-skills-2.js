// ============================================================
// dialog-skills-2.js —— 自身技能面板（第 2 部分）
// 提取自 dialog-panels.js（原第 239-400 行，属性：onData 后半 ~ skill_levels）
// ============================================================
'use strict';
Dialog.skills = Dialog.skills || {};
Dialog.skills.onData = function(_t419) {
    if (_t419.book) {
        if (!this.books)
            return;
        this.books.push({
            'name': _t419.book[0],
            'grade': _t419.book[1],
            'id': _t419.book[2]
        });
        if (this.isShow && this.selected_item == 2)
            return this.showBooks();
        return;
    }
    if (_t419.books) {
        this.books = this.format_books(_t419.books);
        if (this.isShow || !Dialog.master.isShow)
            return this.showBooks();
        else
            return Dialog.master.showBooks();
    }
    if (_t419.id && !_t419.desc) {
        if (_t419.from)
            return this.updateSkill.call(Dialog.master, _t419);
        return this.updateSkill(_t419);
    }
    if (_t419.item) {
        if (Dialog.master.isShow && Dialog.master.is_follower)
            return this.addSkill.call(Dialog.master, _t419.item);
        return this.addSkill(_t419.item);
    }
    if (!this.isShow) {
        if (Dialog.master.isShow)
            return Dialog.master.onData(_t419);
    }
    if (_t419.desc) {
        if (_t419.id)
            this.updateSkill(_t419);
        return this.showdesc(_t419);
    }
    if (_t419.remove && this.items) {
        if (_t419.from && _t419.from !== Process.player)
            return;
        this.items.Remove(this.skills[_t419.remove]);
        for (var _n64 = 0; _n64 < this.items.length; _n64++) {
            this.items[_n64].enable_skill == _t419.remove && (this.items[_n64].enable_skill = null);
        }
        delete this.skills[_t419.remove];
        if (this.skill_element && this.skill_element_id === _t419.remove) {
            this.hide();
        }
        return this.createSkillItems(this.items);
    }
    if (_t419.items) {
        this.title = _t419.title;
        Dialog.title(this.title + "，等级上限" + _t419.limit + '级');
        Dialog.icon("book");
        this.items = this.sort_items(_t419.items);
        this.skills = {};
        for (_n64 = 0; _n64 < this.items.length; _n64++) {
            var _t421 = this.items[_n64];
            this.skills[_t421.id] = _t421;
        }
        this.items.length > 10 && this.selected_item < 0 && this.footerChanged(0);
        this.createSkillItems(this.items);
    }
    if (_t419.sk_group >= 0) {
        this.sk_group = _t419.sk_group;
        this.limit = _t419.limit;
        this.create_footer();
    }
    if (_t419.limit >= 0) {
        this.limit = _t419.limit;
        Dialog.title(this.title + "，等级上限" + this.limit + '级');
    }
};
Dialog.skills.show = function() {
    if (this.isShow)
        return;
    this.isShow = true;
    if (!this.element) {
        this.element = $("<div class=\"dialog-skills\"></div>");
        Dialog.footerElement.on('click', ".sk-group", Dialog.skills.eq_group_click);
    }
    this.element.on("click", ".skill-item", Dialog.skills.item_click);
    this.element.appendTo(Dialog.contentElement);
    this.element.removeClass("hide-item");
    if (!this.items)
        SendCommand('cha');
    else {
        SendCommand("cha none");
        Dialog.icon("book");
        this.create_footer();
    }
};
Dialog.skills.isEnable = function(_t423, _t424) {
    if (!_t423.can_enables)
        return false;
    for (var _n65 = 0; _n65 < _t423.can_enables.length; _n65++) {
        var _t426 = _t424[_t423.can_enables[_n65]];
        if (_t426 && _t426.enable_skill == _t423.id)
            return true;
    }
    return false;
};
Dialog.skills.showBooks = function() {
    var _a26 = []
      , _t428 = this.sort_items(this.books);
    for (let _t429 of _t428) {
        _a26.push("<div class=\"book-item ");
        _a26.push('grade', _t429.grade, "\" >");
        _a26.push("<div class=\"book-name\">", _t429.name, '</div>');
        _a26.push("<div class=\"book-action border-right\" cmd=\"sbook ", _t429.id, '\x22>查看</div>');
        _a26.push("<div class=\"book-action\" cmd=\"study ", _t429.id, "\">学习</div>");
        _a26.push('</div>');
    }
    this.element.html(_a26.join(''));
    this.create_footer(true);
};
Dialog.skills.createSkillItem = function(_t430, _t431) {
    _t431 = _t431 || this.skills;
    var _a27 = [];
    _a27.push("<div class=\"skill-item ");
    _a27.push("grade" + _t430.grade);
    if (!this.master) {
        if (_t430.can_enables) {
            _a27.push(" skill");
            if (this.selected_item == 0)
                _a27.push(" hide");
        } else {
            _a27.push(" base");
            if (this.selected_item == 1)
                _a27.push('\x20hide');
        }
    }
    var _t433 = this.isEnable(_t430, _t431);
    _t433 && _a27.push(" enable");
    _a27.push('\x22\x20skid=\x22' + _t430.id + '\x22>');
    _a27.push("<span class=\"glyphicon glyphicon-ok enable-flag\"></span>");
    _a27.push(_t430.name);
    if (_t430.enable_skill && _t431) {
        var _t434 = _t431[_t430.enable_skill];
        if (_t434) {
        _a27.push("<span class=\"enable_skill\">已装备：");
        _a27.push(wrap_name(_t434));
        _a27.push('</span>');
    }
    }
    _a27.push("<span class=\"skill-level\">");
    _a27.push(_t430.level);
    _a27.push("级 / ");
    _a27.push(_t430.exp);
    _a27.push('%');
    _a27.push("&nbsp;");
    _a27.push(Dialog.skills.get_lvdesc(_t430.level));
    _a27.push("</span></div>");
    return _a27.join('');
};
Dialog.skills.sort_items = function(_t435) {
    if (!_t435 || !Setting.auto_sortitem)
        return _t435;
    var _a28 = [];
    for (var _n66 = 0; _n66 < _t435.length; _n66++) {
        var _t437 = _t435[_n66]
          , _b1 = false;
        for (var _n67 = 0; _n67 < _a28.length; _n67++) {
            if (_t437.grade > _a28[_n67].grade) {
                _a28.splice(_n67, 0, _t437);
                _b1 = true;
                break;
            }
        }
        !_b1 && _a28.push(_t437);
    }
    return _a28;
};
Dialog.skills.createSkillItems = function(_t438, _t439) {
    let _a29 = [];
    for (var _n68 = 0; _n68 < _t438.length; _n68++) {
        _a29.push(this.createSkillItem(_t438[_n68], _t439));
    }
    this.element.html(_a29.join(''));
};
Dialog.skills.level_color = ["wht", "hig", 'hic', "hij", "hiz", "hio", 'ord'];
Dialog.skills.get_lvdesc = function(_t441) {
    if (_t441 < 1000)
        return Dialog.skills.skill_levels[parseInt(_t441 / 50)];
    var _n69 = Math.trunc((_t441 - 1000) / 500);
    if (_n69 > 6)
        _n69 = 6;
    return Dialog.skills.skill_levels[_n69 + 20];
};
Dialog.skills.skill_levels = ["<BLU>初学乍练</BLU>", "<BLU>不知所以</BLU>", "<HIB>粗通皮毛</HIB>", "<HIB>渐有所悟</HIB>", "<YEL>半生不熟</YEL>", "<YEL>马马虎虎</YEL>", "<HIY>平淡无奇</HIY>", "<HIY>触类旁通</HIY>", "<HIG>心领神会</HIG>", "<HIG>挥洒自如</HIG>", "<HIC>驾轻就熟</HIC>", "<HIC>出类拔萃</HIC>", "<CYN>初入佳境</CYN>", "<CYN>神乎其技</CYN>", "<MAG>威不可当</MAG>", "<HIW>豁然贯通</HIW>", "<HIW>超群绝伦</HIW>", "<RED>登峰造极</RED>", "<WHT>登堂入室</WHT>", "<HIM>一代宗师</HIM>", "<WHT>超凡入圣</WHT>", "<HIO>出神入化</HIO>", "<HIO>独步天下</HIO>", "<HIR>空前绝后</HIR>", "<HIR>旷古绝伦</HIR>", "<HIW>深不可测</HIW>", "<HIW>返璞归真</HIW>"];