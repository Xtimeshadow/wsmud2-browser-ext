// ============================================================
// dialog-common.js —— 对话框共享工具函数
// 提取自 dialog-panels.js（checkScroll, level_desc, wrap_name, moneyToStr, format_time_span）
// ============================================================
'use strict';
function checkScroll(container) {
    const _t534 = container.parent()
      , _t535 = _t534[0].getBoundingClientRect()
      , _t536 = container[0].getBoundingClientRect()
      , _t537 = _t536.top >= _t535.top && _t536.bottom <= _t535.bottom;
    if (!_t537) {
        _t534[0].scrollTop = _t534.scrollTop() + (_t536.bottom - _t535.bottom);
    }
}
const level_desc = ["wht", "hig", 'hic', 'hiy', 'him', 'hio', "ord"];
function wrap_name(name) {
    let _t589 = level_desc[name.grade];
    return '<' + _t589 + '>' + name.name + '</' + _t589 + '>';
}
function moneyToStr(value) {
    if (!value)
        return '';
    var _a48 = [];
    if (value >= 10000) {
        _a48.push(parseInt(value / 10000) + "两<hiy>黄金</hiy>");
        value = value % 10000;
    }
    if (value > 100) {
        _a48.push(parseInt(value / 100) + "两<wht>白银</wht>");
        value = value % 100;
    }
    if (value > 0)
        _a48.push(value + "个<yel>铜板</yel>");
    return _a48.join('');
}
function format_time_span(seconds) {
    let _t956 = Math.floor(seconds / 1000);
    if (_t956 < 0)
        _t956 = 0;
    if (_t956 > 3600) {
        let _t957 = Math.floor(_t956 / 3600) + '小时';
        _t956 = _t956 % 3600;
        _t957 += Math.floor(_t956 / 60) + '分';
        return _t957;
    }
    let _t958 = Math.floor(_t956 / 60) + '分';
    _t956 = _t956 % 60;
        return _t958 + _t956 + '秒';
}