// ============================================================
// dialog-stats-1.js —— 排行榜面板（第一部分）
// 提取自 dialog-panels.js（Dialog.stats）
// ============================================================
'use strict';
// STATS_SILDER1/2 在 dialog-tasks.js 中已声明, 此处不重复声明
Dialog.stats = {
    'footers': [{
        'cmd': "score",
        'name': "综合榜",
        'selected_silder': '',
        'silder': STATS_SILDER1
    }, {
        'cmd': "top",
        'name': '高手榜',
        'selected_silder': '',
        'silder': STATS_SILDER1
    }, {
        'cmd': "weapon",
        'name': "兵器谱",
        'selected_silder': '',
        'silder': STATS_SILDER2
    }, {
        'cmd': 'exp',
        'name': "经验榜",
        'selected_silder': '',
        'silder': STATS_SILDER1
    }, {
        'cmd': 'mp',
        'name': "内力榜",
        'selected_silder': '',
        'silder': STATS_SILDER1
    }, {
        'cmd': 'money',
        'name': "富豪榜",
        'selected_silder': '',
        'silder': STATS_SILDER1
    }],
    'selectedItem': 0,
    'close': function() {
        this.element.remove();
        this.isShow = false;
    },
    'onData': function(_t681) {
        if (_t681.close)
            return Dialog.hide();
        if (_t681.tops) {
            if (_t681.top) {
                this.show_desc("你目前在第" + _t681.top + "名，积分" + _t681.sc);
            } else {
                this.show_desc("你目前没有上榜，积分：" + _t681.sc);
            }
            return this.create_tops(_t681.tops, _t681);
        }
        if (_t681.weapons) {
            this.show_desc('');
            return this.create_weapons(_t681.weapons);
        }
        if (_t681.scores) {
            this.show_desc('你目前的评分：' + _t681.score);
            return this.create_scores(_t681.scores);
        }
        if (_t681.items) {
            this.create_other(_t681.items, _t681.st);
            let _t683 = new Date(_t681.time);
            _t681.fam = _t681.fam ?? '';
            this["last_" + _t681.st + _t681.fam] = {
                'items': _t681.items,
                'time': _t681.time + 60000,
                'score': _t681.score
            };
            if (_t681.score)
                this.show_desc("你目前的评分：" + _t681.score);
            else
                this.show_desc('上次更新：' + _t683.getHours() + ':' + _t683.getMinutes());
        }
    },
    'create_other': function(_t684, _t685) {
        var _a52 = [];
        for (var _n100 = 0; _n100 < 20; _n100++) {
            _a52.push("<div class='top-item");
            if (_n100 < 3)
                _a52.push(" top", _n100 + 1);
            _a52.push("' top='");
            _a52.push(_n100 + 1);
            _a52.push("'><span class='top-title'>");
            _a52.push(this.top_names[_n100]);
            _a52.push('、</span>');
            _a52.push("<span class='top-name'>");
            let _t687 = _t684[_n100] ?? ['无', 0];
            _a52.push(_t687[0]);
            _a52.push("</span>");
            _a52.push("<span class='top-sc'>");
            _a52.push(_t687[1]);
            _a52.push('</span>');
            _a52.push('</div>');
        }
        this.container.html(_a52.join(''));
    },
    'silderClick': function() {
        let _J73 = $(this)
          , _t689 = _J73.attr("stype")
          , _t690 = Dialog.stats.selectedItem;
        if (_t690.selected_silder === _t689)
            return;
        _t690.selected_silder = _t689;
        _J73.parent().find(".select").removeClass('select');
        _J73.addClass("select");
        Dialog.stats.load_stats();
    },
    'create_silder': function(_t691) {
        let _a53 = [];
        _t691 = _t691 || [];
        let _t693 = this.selectedItem;
        for (let _t694 of _t691) {
            _a53.push("<div class=\"stats-silder ", _t693.selected_silder === _t694[1] ? "select" : '', "\" stype=\"", _t694[1], '\x22>', _t694[0], "</div>");
        }
        this.left_silder.html(_a53.join(''));
    },
    'top_names': ['一\u3000', '二\u3000', '三\u3000', '四\u3000', '五\u3000', '六\u3000', '七\u3000', '八\u3000', '九\u3000', '十\u3000', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'],
    'create_scores': function(_t695, _t696) {
        var _a54 = [];
        for (var _n101 = 0; _n101 < 20; _n101++) {
            _a54.push("<div class='top-item scores");
            if (_n101 < 3)
                _a54.push(" top", _n101 + 1);
            _a54.push("' top='");
            _a54.push(_n101 + 1);
            _a54.push("'><span class='top-title'>");
            _a54.push(this.top_names[_n101]);
            _a54.push('、</span>');
            _a54.push("<span class='top-name'>");
            let _t698 = _t695[_n101] ?? ['无', ''];
            _a54.push(_t698[0]);
            _a54.push("</span>");
            _a54.push("<span class='top-sc'>");
            _a54.push(_t698[1]);
            _a54.push("</span>");
            _a54.push("</div>");
        }
        this.container.html(_a54.join(''));
    },
};