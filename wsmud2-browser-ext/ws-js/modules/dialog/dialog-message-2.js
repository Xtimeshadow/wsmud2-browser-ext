// ============================================================
// dialog-message-2.js —— 消息面板（第二部分）
// 提取自 dialog-panels.js（Dialog.message）
// ============================================================
'use strict';
// 此文件延续 Dialog.message，需在 dialog-message-1.js 之后加载
Dialog.message.showMessages = function(_t851) {
    var _a75 = [];
    for (var _n121 = 0; _n121 < this.messages.length; _n121++) {
        var _t853 = this.messages[_n121];
        _a75.push("<div class='message-item' fromid=\"");
        _a75.push(_t853.id);
        _a75.push("\"><div class='message-title'>");
        _a75.push(_t853.name);
        _a75.push("<span class='message-time'>");
        _a75.push(this.getTimedesc(_t853.time));
        _a75.push('</span>');
        _a75.push("</div>");
        _a75.push("<div class='message-content'>");
        _a75.push(_t853.content);
        _a75.push('</div>');
        _a75.push('</div>');
    }
    if (!_a75.length)
        _a75.push("<div class=\"empty\">暂无新消息</div>");
    if (!this.listElement)
        this.listElement = this.element.find(".message-list");
    this.listElement.html(_a75.join(''));
};
Dialog.message.getTimedesc = function(_t854) {
    var _t856 = new Date()
      , _t857 = new Date(_t854)
      , _t858 = (_t856 - _t857) / 1000;
    if (_t858 < 60)
        return '刚刚';
    else {
        if (_t858 < 3600)
            return parseInt(_t858 / 60) + '分钟前';
        else {
            if (_t857.getFullYear() == _t856.getFullYear() && _t857.getMonth() == _t856.getMonth()) {
                var _t859 = _t857.getDate() - _t856.getDate()
                  , _t860 = '今天\x20' + this.add_zero(_t857.getHours()) + ':' + this.add_zero(_t857.getMinutes());
                if (_t859 === 0)
                    return _t860;
                else {
                    if (_t859 === 1)
                        return "昨天 " + _t860;
                    else {
                        if (_t859 === 2)
                            return "前天 " + _t860;
                    }
                }
            }
        }
    }
    var _t861 = _t857.getMonth() + 1 + '月' + _t857.getDate() + '日\x20' + this.add_zero(_t857.getHours()) + '：' + this.add_zero(_t857.getMinutes());
    if (_t856 - _t857 > 2332800000) _t861 += "<mem>即将过期</mem>";
    return _t861;
};
Dialog.message.add_zero = function(_t862) {
    if (_t862 < 10)
        return '0' + _t862;
    return _t862;
};
Dialog.message.showMessageDetail = function() {
    var _J76 = $(this).attr('fromid');
    if (!_J76)
        return;
    SendCommand('message\x20' + _J76);
    Dialog.message.element.addClass('detail');
};
Dialog.message.getMessageitem = function(_t864) {
    for (var _n122 = 0; _n122 < this.messages.length; _n122++) {
        if (this.messages[_n122].id == _t864)
            return this.messages[_n122];
    }
};
Dialog.message.createMessageDetail = function(_t866, _t867) {
    !this.detailElement && (this.detailElement = this.element.find(".detail-list"));
    var _t869 = this.getMessageitem(_t866);
    if (!_t869)
        return;
    var _a76 = [];
    this.detailID = _t866;
    let _b4 = false;
    for (var _n123 = 0; _n123 < _t867.length; _n123++) {
        var _t870 = _t867[_n123];
        _a76.push(this.createMessageDetailItem(_t866, _t869.name, _t870));
        _t870.attach && !_t870.rec && (_b4 = true);
    }
    this.detailElement.html(_a76.join(''));
    let _t871 = '';
    _t866 !== "notice" && (_t871 = "<span cmd=\"message delete " + _t866 + ("\">删除</span><span cmd=\"receive ") + _t866 + ("\">领取全部</span>"));
    Dialog.footerElement.find(".item-commands").html(_t871);
};
Dialog.message.createMessageDetailItem = function(_t872, _t873, _t874) {
    var _a77 = [];
    _a77.push("<div class='detail-item' rec='", _t874.attach && !_t874.rec ? 1 : 0, "' fid='", _t872, "' index='" + _t874.index + '\x27>');
    _a77.push("<span class='detail-name'>");
    _a77.push(_t873);
    _a77.push('</span>');
    _a77.push("<span class='detail-time'>");
    _a77.push(this.getTimedesc(_t874.time));
    _a77.push("</span>");
    _a77.push("<pre class='detail-content'>");
    _a77.push(_t874.content);
    _a77.push('</pre>');
    if (_t874.attach) {
        for (var _n124 = 0; _n124 < _t874.attach.length; _n124++) {
            _a77.push("<div class='detail-attach'>");
            _a77.push(_t874.attach[_n124].name);
            _a77.push("</div>");
        }
        _t874.rec ? _a77.push("<div class='detail-rec'>已领取</div>") : _a77.push("<div  class='detail-rec' cmd='receive " + _t872 + '\x20' + _t874.index + ("'><hig>领取</hig></div>"));
    }
    _a77.push("</div>");
    return _a77.join('');
};
Dialog.message.createElement = function() {
    return $("<div class=\"dialog-message\"><div class=\"message-list\"></div><div class=\"detail-list\"></div></div>");
};
Dialog.message.updateMessageState = function(_t877, _t878) {
    if (this.detailID != _t877)
        return;
    const _t880 = this.detailElement.find(".detail-item[index='" + _t878 + ("']>.detail-rec"));
    _t880.html('已领取').removeAttr("cmd");
};