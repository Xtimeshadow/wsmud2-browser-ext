// ============================================================
// wg-setting.js —— 页面外观/频道设置
// ------------------------------------------------------------
//   管理游戏界面颜色、频道开关、字体大小、全屏等外观设置。
//   通过 save() 保存到服务端，set_prop() 即时生效。
// ============================================================
var Setting = {
    'keep_msg': 0,
    'show_hpnum': 0,
    'show_hp': 0,
    'item_autoheight': 0,
    'item_firstme': 0,
    'hide_roomdesc': 0,
    'exits_dir': 0,
    'show_sa': 0,
    'show_command': 0,
    'fontsize': '0.875rem',
    'font': '',
    'no_spmsg': 0,
    'fontcolor': '#008000',
    'backcolor': 'black',
    'auto_showcombat': 0,
    'auto_sortitem': 0,
    'auto_hideroom': 0,
    'show_roomitem': 0,
    'fullscreen': 0,
    'channel_chat': 1,
    'channel_tm': 1,
    'channel_fam': 1,
    'channel_es': 1,
    'ban_pk': 0,
    'off_plist': 0,
    'combat_wrap': 0,
    'combat_size': "1em",
    'dialog_size': "1em",
    'menu_size': "1em",
    'action_wrap': 0,
    'off_hp': 0,
    'show_damage': 0,
    'no_master': 0,
    'no_team': 0,
    'no_load': true,
    'load': function(_t1239) {
        Dialog.keys.init_key();
        Dialog.extend.init_extend();
        if (!_t1239)
            return;
        for (var _t1241 in _t1239) {
            if (_t1241 === "fullscreen")
                continue;
            this.set_prop(_t1241, _t1239[_t1241]);
            this[_t1241] = _t1239[_t1241];
        }
    },
    'set_prop': function(_t1242, _t1243) {
        switch (_t1242) {
        case "fontsize":
            $(".container").css("font-size", _t1243);
            $(".dialog-confirm").css("font-size", _t1243);
            $(".channel").css("font-size", _t1243);
            break;
        case "font":
            if (_t1243 === "none")
                _t1243 = '';
            $(".container").css("font-family", _t1243);
            break;
        case "combat_size":
            $(".content-bottom").css('font-size', _t1243);
            break;
        case "dialog_size":
            $('.dialog').css("font-size", _t1243);
            break;
        case "show_sa":
            Combat.refActions();
            break;
        case 'menu_size':
            $(".bottom-bar").css('font-size', _t1243);
            break;
        case "fontcolor":
            $(document.body).css('color', _t1243);
            break;
        case 'backcolor':
            $(document.body).css("background-color", _t1243);
            break;
        case "hide_roomdesc":
            if (_t1243)
                $(".room_desc").hide();
            else
                $(".room_desc").show();
            break;
        case "exits_dir":
            Process.exits();
            break;
        case 'off_hp':
            _t1243 ? $(".item-status").hide() : $(".item-status").show();
            break;
        case "combat_wrap":
            _t1243 ? $(".combat-commands").addClass("combat-wrap") : $(".combat-commands").removeClass("combat-wrap");
            break;
        case "action_wrap":
            _t1243 ? $(".room-commands").addClass("combat-wrap") : $(".room-commands").removeClass("combat-wrap");
            break;
        case "item_autoheight":
            if (_t1243)
                $(".room_items").removeAttr("style");
            else
                $(".room_items").attr("style", "max-height: 8rem; overflow-y: auto;");
            break;
        case "item_firstme":
            if (_t1243 === 1) {
                var _J88 = $(".room_items>.room-item[itemid='" + Process.player + '\x27]');
                $(".room_items").prepend(_J88);
            }
            break;
        case 'show_hp':
            if (!Combat.IsShow) {
                if (_t1243 === 1)
                    $(".room-item>.item-status").show();
                else
                    $(".room-item>.item-status").hide();
            }
            break;
        case 'show_hpnum':
            Process.cur_room && Process.items(Process.cur_room);
            break;
        case "show_damage":
            $(".item-damage").remove();
            break;
        case 'fullscreen':
            _t1243 ? Setting.launchFullScreen() : Setting.exitFullscreen();
            break;
        case "show_command":
            Process.itemsElement.find(".item-commands").remove();
            break;
        case "no_spmsg":
            _t1243 ? Process.ChannelElement.hide() : Process.ChannelElement.show();
            break;
        }
    },
    'save': function(_t1245, _t1246) {
        this[_t1245] = _t1246;
        this.set_prop(_t1245, _t1246);
        SendCommand('setting\x20' + _t1245 + '\x20' + _t1246);
    },
    'launchFullScreen': function(_t1248) {
        _t1248 = _t1248 || document.documentElement;
        if (_t1248.requestFullscreen)
            _t1248.requestFullscreen();
        else {
            if (_t1248.mozRequestFullScreen)
                _t1248.mozRequestFullScreen();
            else {
                if (_t1248.webkitRequestFullscreen)
                    _t1248.webkitRequestFullscreen();
                else
                    _t1248.msRequestFullscreen && _t1248.msRequestFullscreen();
            }
        }
    },
    'exitFullscreen': function() {
        if (document.exitFullscreen)
            document.exitFullscreen();
        else {
            if (document.mozCancelFullScreen)
                document.mozCancelFullScreen();
            else
                document.webkitExitFullscreen && document.webkitExitFullscreen();
        }
    }
}