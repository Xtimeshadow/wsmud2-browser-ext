// ============================================================
// dialog-channel.js —— 聊天频道面板
// 提取自 dialog-panels.js（原第 1681-1787 行）
// ============================================================
'use strict';
Dialog.channel = {
    'footer': [['全部', ''], ['世界', "chat"], ['队伍', 'tm'], ['门派', "fam"], ['全区', 'es'], ['帮派', 'pty'], ['系统', "sys"]],
    'isScroll': true,
    'last_click': 0,
    'show': function() {
        if (Date.now() - this.last_click > 500) {
            this.last_click = Date.now();
            return;
        }
        if (Dialog.channel.isShow)
            return;
        Dialog.select("channel");
        Dialog.icon("comment");
        Dialog.title('');
        Dialog.footer('');
        for (var _n90 = 0; _n90 < Dialog.channel.footer.length; _n90++) {
            var _J65 = $("<span class='footer-item channel-item' for='" + Dialog.channel.footer[_n90][1] + '\x27>' + Dialog.channel.footer[_n90][0] + "</span>").appendTo(Dialog.footerElement);
            if (_n90 === 0)
                _J65.addClass('select');
        }
        Dialog.contentElement.html('').append(Process.ChannelElement.addClass("channel-dialog"));
        Dialog.channel.isShow = true;
        Dialog.channel.scrollBottom();
    },
    'hide': function() {
        Dialog.channel.footerChanged('');
        Process.ChannelElement.removeClass("channel-dialog").insertBefore(".content-message");
        this.scrollBottom();
        this.isShow = false;
    },
    'close': function() {
        this.hide();
    },
    'scrollBottom': function() {
        Process.channel.scroll2end();
    },
    'footerChanged': function(_t633) {
        if (Dialog.channel.select_item == _t633)
            return;
        Dialog.channel.select_item = _t633;
        Process.channel.clear();
        for (var _n91 = 0; _n91 < this.datas.length; _n91++) {
            var _t635 = this.datas[_n91];
            (!_t633 || _t635[0] == _t633) && Process.channel.push(_t635[1]);
        }
        Process.channel.scroll2end();
    },
    'datas': [],
    'createElement': function(_t636, _t637) {
        var _t639 = "hic"
          , _t640 = '';
        switch (_t636.ch) {
        case 'tm':
            _t639 = "hig";
            _t640 = '队伍';
            break;
        case 'fam':
            _t639 = "hiy";
            _t640 = _t636.fam || '门派';
            break;
        case 'rumor':
            _t639 = "him";
            _t640 = '谣言';
            _t636.name = '某人';
            break;
        case 'sys':
            _t639 = 'hir';
            _t640 = '系统';
            _t636.name = '';
            break;
        case 'es':
            _t639 = 'hio';
            _t640 = _t636.server;
            _t636.uid = null;
            break;
        case "pty":
            _t639 = "hiz";
            _t640 = '帮派';
            break;
        default:
            _t640 = ['闲聊', '闲聊', '闲聊', "<hiy>宗师</hiy>", "<HIZ>武圣</HIZ>", "<hio>武帝</hio>", "<ord>武神</ord>"][_t636.lv];
            _t636.lv6 && (_t640 = ["<ord>武神</ord>", "<ord>剑神</ord>", "<ord>刀皇</ord>", "<ord>兵主</ord>", "<ord>战神</ord>"][_t636.lv6]);
            break;
        }
        var _a49 = ['<', _t639, '>【'];
        _a49.push(_t640);
        _a49.push('】');
        if (_t636.name) {
            _a49.push('<span');
            if (_t636.uid)
                _a49.push(" cmd='look3 " + _t636.uid + '\x27');
            _a49.push('>');
            _a49.push(_t636.name);
            _a49.push("</span>：");
        }
        _a49.push(_t636.content);
        var _t641 = _a49.join('');
        this.datas.length > 800 && (this.datas.length = 0,
        this.datas.splice(0, 200));
        if (_t636.ch == "rumor")
            _t636.ch = 'sys';
        this.datas.push([_t636.ch, _t641]);
        if (this.select_item && this.select_item != _t636.ch)
            return '';
        return _t641;
    }
};