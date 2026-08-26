// ============================================================
// dialog-skills-3.js —— 自身技能面板（第 3 部分）
// 提取自 dialog-panels.js（原第 401-481 行，属性：item_click, _bindCalc）
// ============================================================
'use strict';
Dialog.skills = Dialog.skills || {};
Dialog.skills.item_click = function() {
    var _J55 = $(this)
      , _a30 = ["<div class='item-commands'>"]
      , _t444 = Dialog.skills.skills[_J55.attr("skid")];
    if (!_t444)
        return;
    _a30.push("<span cmd=\"checkskill " + _t444.id + ("\">查看详细</span>"));
    if (_t444.can_enables)
        for (var _n70 = 0; _n70 < _t444.can_enables.length; _n70++) {
            var _t445 = Dialog.skills.skills[_t444.can_enables[_n70]];
            if (!_t445)
                continue;
            if (_t445.enable_skill != _t444.id)
                _a30.push("<span cmd=\"enable " + _t445.id + '\x20' + _t444.id + "\">装备" + _t445.name + '</span>');
            else
                _a30.push("<span cmd=\"enable " + _t445.id + (" none\">取消装备") + _t445.name + "</span>");
        }
    if (_t444.enable_skill) {
        var _t446 = Dialog.skills.skills[_t444.enable_skill];
        if (_t446)
            _a30.push("<span cmd=\"enable " + _t444.id + (" none\">取消装备") + _t446.name + '</span>');
        else
            _t444.enable_skill = null;
    }
    _a30.push("<span cmd=\"_confirm fangqi " + _t444.id + ("\">遗忘</span>"));
    _a30.push("<span cmd=\"lianxi " + _t444.id + ("\">练习</span>"));
    var _qnGrade = _t444.grade || 0;
    var _qnLevel = _t444.level || 0;
    var _qnLimit = _t444.limit || 9999;
    var _qnTarget = Math.min(_qnLevel + 100, _qnLimit);
    var _qnX = [2,2,7,10,12,15,20][_qnGrade] || 2;
    var _qnY = [5,10,15,20,25,30,35][_qnGrade] || 5;
    var _qnInit = (_qnTarget - _qnLevel) * _qnX + _qnY * ((_qnTarget * (_qnTarget - 1) / 2) - (_qnLevel * (_qnLevel - 1) / 2));
    _a30.push('<div class="qianneng-calc" data-skid="' + _t444.id + '" data-grade="' + _qnGrade + '" data-x="' + _qnX + '" data-y="' + _qnY + '" data-limit="' + _qnLimit + '" style="display:block;width:auto;color:#c0c0c0">');
    _a30.push('<div style="display:flex;align-items:center;flex-wrap:wrap">');
    _a30.push('<div style="display:flex;align-items:center;margin:8px"><label style="margin-right:5px">起始等级：<input type="number" class="qn-start" value="' + _qnLevel + '" style="width:60px;padding:4px;border:1px solid;border-radius:3px;background-color:transparent;color:inherit"></label></div>');
    _a30.push('<div style="display:flex;align-items:center;margin:8px"><label style="margin-right:5px">目标等级：<input type="number" class="qn-target" value="' + _qnTarget + '" style="width:60px;padding:4px;border:1px solid;border-radius:3px;background-color:transparent;color:inherit"></label></div>');
    _a30.push('<div style="display:flex;align-items:center;margin:8px 5px 8px auto">需要潜能：<b class="qn-needed" style="font-weight:bold;min-width:4em;text-align:center">' + Math.round(_qnInit) + '</b></div>');
    _a30.push('<div class="item-commands" style="margin:8px 5px"><span class="qn-go" cmd="#lianxi ' + _t444.id + ' ' + _qnTarget + '" style="cursor:pointer;border:1px solid gray;padding:2px 8px;border-radius:4px;color:gray">练习到目标等级</span></div>');
    _a30.push('</div>');
    _a30.push('</div>');
    SCRIPT.LAST_OBJ = _t444;
    let _t447 = Dialog.extend.query('skill', _t444);
    _a30.push('<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px">');
    for (let _t448 of _t447) {
        _a30.push("<span style=\"display:inline-block;border:1px solid gray;color:gray;background-color:black;cursor:pointer;border-radius:4px;padding:0.25em 1em;margin:0.25em 0\" cmd=\"", _t448.cmd, '\x22>', _t448.name, '</span>');
    }
    _a30.push('</div>');
    Dialog.skills.element.find(".item-commands").remove();
    var _qnHtml = $(_a30.join(''));
    _qnHtml.insertAfter(_J55);
    checkScroll(_J55.next());
    Dialog.skills._bindCalc(_qnHtml.find('.qianneng-calc'));
};
Dialog.skills._bindCalc = function(calcElm) {
    if (!calcElm || !calcElm.length) return;
    calcElm.find('.qn-start, .qn-target').off('input.qn').on('input.qn', function() {
        var calc = $(this).closest('.qianneng-calc');
        var start = parseInt(calc.find('.qn-start').val()) || 0;
        var target = parseInt(calc.find('.qn-target').val()) || 0;
        var x = parseInt(calc.data('x')) || 2;
        var y = parseInt(calc.data('y')) || 5;
        var limit = parseInt(calc.data('limit')) || 9999;
        var skid = calc.data('skid');
        calc.find('.qn-start').css('color', (start < 0 || isNaN(start)) ? '#FF4500' : '#c0c0c0');
        calc.find('.qn-target').css('color', (target < 0 || isNaN(target) || target < start) ? '#FF4500' : '#c0c0c0');
        if (start < 0 || target < 0 || isNaN(start) || isNaN(target) || target < start) {
            calc.find('.qn-needed').text('-').css('color','#505050');
            calc.find('.qn-go').removeAttr('cmd');
            return;
        }
        calc.find('.qn-needed').css('color','#c0c0c0');
        var needed = (target - start) * x + y * ((target * (target - 1) / 2) - (start * (start - 1) / 2));
        calc.find('.qn-needed').text(Math.round(needed));
        calc.find('.qn-go').attr('cmd', '#lianxi ' + skid + ' ' + target);
        if (target > limit) calc.find('.qn-target').css('color', '#FFFF00');
    });
};