// ============================================================
// dialog-stats-2.js —— 排行榜面板（第二部分）
// 提取自 dialog-panels.js（Dialog.stats）
// ============================================================
'use strict';
// 此文件延续 Dialog.stats，需在 dialog-stats-1.js 之后加载
if (!Dialog.stats) Dialog.stats = {};
Dialog.stats.fam_names = {
    'emei': '峨眉第',
    'wudang': '武当第',
    'huashan': "华山第",
    'xiaoyao': "逍遥第",
    'gaibang': "丐帮第",
    'shaolin': "少林第",
    'shashou': '杀手第',
    'none': '散修第'
};
Dialog.stats.create_tops = function(_t699, _t700) {
    var _a55 = [];
    for (var _n102 = 0; _n102 < _t699.length; _n102++) {
        _a55.push("<div class='top-item top ");
        if (_n102 < 3)
            _a55.push(" top", _n102 + 1);
        _a55.push("' top='");
        _a55.push(_n102 + 1);
        _a55.push("'><span class='top-title'>");
        _a55.push(_t700.fam ? this.fam_names[_t700.fam] : "天下第");
        _a55.push(this.top_names[_n102]);
        _a55.push("</span>");
        _a55.push("<span class='top-name'>");
        _a55.push(_t699[_n102][0]);
        _a55.push("</span>");
        _a55.push("<span class='top-sc'>");
        _a55.push(_t699[_n102][1]);
        _a55.push("</span>");
        _a55.push("</div>");
    }
    this.container.html(_a55.join(''));
    this.top = _t700.top;
};
Dialog.stats.create_weapons = function(_t702) {
    var _a56 = [];
    for (var _n103 = 0; _n103 < 10; _n103++) {
        _a56.push("<div class='top-item weapon top");
        _a56.push(_n103 + 1);
        _a56.push("' top='");
        _a56.push(_n103 + 1);
        _a56.push("'><span class='top-title'>");
        let _t704 = _t702[_n103] ?? ['无', ''];
        _a56.push(this.top_names[_n103]);
        _a56.push("、</span>");
        _a56.push("<span class='top-name'>");
        _a56.push(_t704[0]);
        _a56.push('</span>');
        _a56.push("<span class='top-sc'>");
        _a56.push(_t704[1]);
        _a56.push('</span>');
        _a56.push('</div>');
    }
    this.container.html(_a56.join(''));
};
Dialog.stats.show = function() {
    if (!this.selectedItem)
        this.selectedItem = this.footers[0];
    this.load_stats();
    if (!this.element) {
        this.element = $("<div class='stats-container'><div class='stats-container-left'></div></div>");
        this.container = $("<div class='dialog-stats'></div>").appendTo(this.element);
        this.left_silder = this.element.find(".stats-container-left");
        this.create_silder(this.selectedItem.silder);
    }
    if (this.isShow)
        return;
    this.create_footer();
    Dialog.icon("stats");
    Dialog.title(this.selectedItem.name);
    Dialog.contentElement.html(this.element);
    this.element.on("click", '.top-item', this.itemClick);
    this.left_silder.on("click", ".stats-silder ", this.silderClick);
    this.isShow = true;
};
Dialog.stats.load_stats = function() {
    let _t707 = this.selectedItem.cmd
      , _t708 = this.selectedItem.selected_silder
      , _t709 = this["last_" + _t707 + _t708];
    if (_t709 && _t709.time > Date.now()) {
        let _t710 = new Date(_t709.time)
          , _t711 = '';
        if (_t709.score)
            _t711 = '你目前的评分：' + _t709.score;
        else
            _t711 = "上次更新：" + _t710.getHours() + ':' + _t710.getMinutes();
        this.show_desc(_t711);
        return this.create_other(_t709.items, _t707);
    }
    let _t712 = 'stats\x20' + _t707;
    if (_t708)
        _t712 = _t712 + '\x20' + _t708;
    SendCommand(_t712);
};
Dialog.stats.create_footer = function() {
    var _a57 = [];
    for (var _n104 = 0; _n104 < this.footers.length; _n104++) {
        var _t714 = this.footers[_n104];
        _a57.push("<span class='footer-item" + (_t714 === this.selectedItem ? " select" : '') + '\x27\x20for=\x27' + _n104 + "''>" + _t714.name + "</span>");
    }
    _a57.push("<span class='stats-span'></span>");
    Dialog.footer(_a57.join(''));
};
Dialog.stats.show_desc = function(_t715) {
    Dialog.footerElement.find(".stats-span").html(_t715);
};
Dialog.stats.footerChanged = function(_t717) {
    var _t719 = this.footers[_t717];
    if (_t719 === this.selectedItem)
        return;
    this.selectedItem = _t719;
    Dialog.title(this.selectedItem.name);
    this.create_silder(this.selectedItem.silder);
    this.load_stats();
};
Dialog.stats.itemClick = function() {
    var _J74 = $(this)
      , _n105 = parseInt(_J74.attr("top"))
      , _t721 = Dialog.stats.selectedItem.cmd
      , _a58 = ["<div class='item-commands'>"]
      , _t722 = Dialog.stats.selectedItem.selected_silder;
    if (_t721 === "top") {
        _a58.push("<span cmd=\"stats " + _t721 + '\x20' + _t722 + '\x20' + _n105 + ("\">查看</span>"));
        if (!Dialog.stats.top || _n105 < Dialog.stats.top)
            _a58.push("<span cmd=\"biwu " + _t722 + '\x20' + _n105 + ("\">挑战</span>"));
        _a58.push("<span cmd=\"reward top " + _n105 + ("\">查看规则和奖励</span>"));
    } else {
        _a58.push("<span cmd=\"stats " + _t721 + '\x20' + _t722 + '\x20' + _n105 + ("\">查看</span>"));
        _a58.push("<span cmd=\"reward " + _t721 + '\x20' + _n105 + ("\">查看奖励</span>"));
    }
    _a58.push("</div>");
    Dialog.stats.element.find(".item-commands").remove();
    $(_a58.join('')).insertAfter(_J74);
};