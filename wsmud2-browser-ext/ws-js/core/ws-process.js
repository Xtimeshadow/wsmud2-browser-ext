// ============================================================
// ws-process.js —— 消息分发总表（从 ws.js 拆分）
// ------------------------------------------------------------
//   Process 消息分发总表：服务器每条消息按 type 找到对应函数处理
// ============================================================
'use strict';

const Process = {
    'itemsElement': null,
    'contentScroll': true,
    'message': null,
    'channel': null,
    'clear': function() {
        Dialog.pack.items = null;
        Dialog.skills.items = null;
        this.state(null);
    },
    'init': function() {
        Process.itemsElement = $(".room_items");
        this.message = MessageQueue.create($(".content-message"));
        this.ChannelElement = $(".channel");
        this.ChannelElement.on('click', Dialog.channel.show.bind(Dialog.channel));
        this.channel = MessageQueue.create(this.ChannelElement, 4, 200);
    },
    'startMoveMessage': function(_t100) {
        window.addEventListener("mousemove", Process.moveMessage);
        window.addEventListener("mouseup", Process.endMoveMessage);
        Process.mouseY = _t100.clientY;
    },
    'moveMessage': function(_t101) {
        let _t102 = Process.mouseY - _t101.clientY
          , _t103 = MessageContent[0]
          , _t104 = MessageContent.height()
          , _t105 = _t103.style.marginBottom;
        if (_t105)
            _t105 = parseInt(_t105.replace('px', ''));
        else
            _t105 = 0;
        _t105 = _t105 + _t102;
        if (_t105 < 0)
            _t105 = 0;
        else {
            if (_t105 > _t104 * 0.7)
                return;
        }
        _t103.style.marginBottom = _t105 + 'px';
        Process.mouseY = _t101.clientY;
        _t101.preventDefault();
    },
    'endMoveMessage': function() {
        window.removeEventListener("mousemove", Process.moveMessage);
        window.removeEventListener('mouseup', Process.endMoveMessage);
    },
    'regist': function(_t106) {
        if (_t106.result) {
            HideAndShow("#addrole_panel");
            $("#addrole_panel .input-error").html(_t106.result);
        }
    },
    'emote': function(_t107) {
        Process.emotes = _t107.items || 0;
        var _a3 = [];
        for (var _n10 = 0; _n10 < Process.emotes.length; _n10++) {
            _a3.push("<span>");
            _a3.push(Process.emotes[_n10]);
            _a3.push('</span>');
        }
        $(".channel-emotes").html(_a3.join(''));
    },
    'deleterole': function(_t108) {
        if (_t108.result) {
            var _J31 = $("#role_panel>ul>.content>.role-list>.role-item[roleid='" + _t108.id + '\x27]');
            _J31.remove();
            var _J32 = $("#role_panel>ul>.content>.role-list>.role-item");
            if (_J31.is(".select") && _J32.length)
                $(_J32[0]).addClass('select');
            else
                !_J32.length && LoginMethods.AddRole();
        } else
            Confirm.Show({
                'content': "<span class='input-error'>" + (_t108.message || "删除失败") + '</span>'
            });
    },
    'cross': function(_t109) {
        var _t110 = null;
        for (var _n11 = 0; _n11 < SERVERS.length; _n11++) {
            SERVERS[_n11].ID == _t109.sid && (_t110 = SERVERS[_n11]);
        }
        if (!_t110)
            return;
        GameClient.ChangeServer = true;
        GameClient.Close();
        Dialog.pack.items = null;
        if (_t109.cross_type == "duizhan") {
            Dialog.skills.items = null;
            Dialog.skills.isShow = false;
        }
        console.log("重新连接到", _t110.Name);
        if (!_t109.pid)
            Process.die({
                'relive': true
            });
        ConnectServer(_t110, _t109.pid);
    },
    'roles': function(_t111) {
        var _t112 = _t111.roles;
        if (!_t112.length)
            LoginMethods.AddRole();
        else {
            HideAndShow("#role_panel");
            var _a4 = [];
            for (var _n12 = 0; _n12 < _t112.length; _n12++) {
                _a4.push("<li class='role-item");
                if (_n12 === 0)
                    _a4.push(" select");
                _a4.push("' roleid='" + _t112[_n12].id + '\x27>');
                _a4.push(_t112[_n12].title);
                _a4.push("&nbsp;&nbsp;");
                _a4.push(_t112[_n12].name);
                _a4.push("</li>");
            }
            $(".role-list").html(_a4.join(''));
        }
    },
    'loginerror': function(_t113) {
        $('.container').hide();
        $(".login-content").show();
        ShowLoader("<strong>登陆失败：</strong>" + _t113.msg + '');
    },
    'login': function(_t114) {
        !Process.player && HideAndShow(".container");
        Process.player = _t114.id;
        Process.level = _t114.level;
        Setting.load(_t114.setting);
        if (LastCommand) {
            SendCommand(LastCommand);
            LastCommand = null;
        }
    },
    'levelup': function(_t115) {
        Process.level = _t115.level;
    },
    'selectItem': function(_t116) {
        if ($(_t116.target).is(".status-item")) {
            var _t117 = _t116.target.getAttribute('sid');
            let _J33 = $(_t116.target).closest(".room-item").attr('itemid');
            if (!_t117)
                return;
            if (_J33 === Process.player)
                return SendCommand("status " + _t117);
            return SendCommand("status " + _t117 + '\x20' + _J33);
        }
        var _J34 = $(this).attr("itemid");
        console.log(_J34);
        if (_J34) {
            if (_J34 === Process.player) {
                var _J35 = $(this).find(".item-name").html()
                  , _a5 = [{
                    'cmd': "look " + _J34,
                    'name': '查看'
                }, {
                    'cmd': "dazuo",
                    'name': '打坐'
                }, {
                    'cmd': 'liaoshang',
                    'name': '疗伤'
                }];
                if (Dialog.team.items && Dialog.team.items.length) {
                    _a5.push({
                        'cmd': 'team\x20out',
                        'name': '退出队伍'
                    });
                    if (Dialog.team.isCap) {
                        _a5.push({
                            'cmd': 'team\x20dismiss',
                            'name': "解散队伍"
                        });
                        _a5.push({
                            'cmd': "team set",
                            'name': "更改分配方式"
                        });
                    }
                }
                Process.item({
                    'id': _J34,
                    'name': _J35,
                    'me': 1,
                    'desc': _J35,
                    'commands': _a5
                });
                return;
            }
            SendCommand("select " + _J34);
        }
    },
    'countwidth': function(_t118, _t119) {
        var _t120 = _t118 * 100 / _t119;
        if (_t120 < 0)
            _t120 = 0;
        if (_t120 > 100)
            _t120 = 100;
        return _t120;
    },
    'itemremove': function(_t121) {
        var _t122 = Combat.STATUS[_t121.id];
        if (_t122) {
            for (var _t123 in _t122.items) {
                clearInterval(_t122.items[_t123].handler);
            }
            var _t124 = _t122.elem.parent();
            if (_t124.next().is(".item-commands"))
                _t124.next().remove();
            _t124.remove();
            delete Combat.STATUS[_t121.id];
        }
        Process.cur_room.items.RemoveAt(_t125 => _t125.id === _t121.id);
    },
    'itemadd': function(_t126) {
        if (Setting.off_plist && _t126.p && _t126.id != Process.player)
            return;
        var _t127 = _t126, _t128;
        Setting.item_firstme && _t127.id == Process.player ? _t128 = $(Process.create_roomitem(_t127)).prependTo(Process.itemsElement) : _t128 = $(Process.create_roomitem(_t127)).appendTo(Process.itemsElement);
        if (Combat.STATUS[_t126.id])
            Process.itemremove(_t126);
        Combat.AppendStatusItem(_t127.id, _t128.find(".item-status-bar"), _t127.status);
        Process.cur_room.items.push(_t127);
    },
    'items': function(_t129) {
        Process.itemsElement.empty();
        Combat.STATUS = {};
        for (var _n13 = 0; _n13 < _t129.items.length; _n13++) {
            var _t130 = _t129.items[_n13];
            if (!_t130)
                continue;
            _t130.player = _t130.p;
            if (_t130.m) {
                _t130.type = '师父';
                _t130.master = 1;
            }
            if (_t130.f) {
                _t130.type = '随从';
                _t130.follower = 1;
            }
            if (_t130.l) {
                _t130.type = '商人';
                _t130.trader = 1;
            }
            if (Setting.off_plist && _t130.p && _t130.id != Process.player)
                continue;
            var _t131;
            Setting.item_firstme && _t130.id == Process.player ? _t131 = $(Process.create_roomitem(_t130)).prependTo(Process.itemsElement) : _t131 = $(Process.create_roomitem(_t130)).appendTo(Process.itemsElement);
            Combat.AppendStatusItem(_t130.id, _t131.find(".item-status-bar"), _t130.status);
        }
        if (!Process.cur_room)
            Process.cur_room = {};
        Process.cur_room.items = _t129.items;
    },
    'get_hpnum': function(_t132, _t133) {
        var _t134 = _t132 / _t133;
        if (_t134 > 0.8)
            return "<hiy>" + _t132 + "</hiy>";
        if (_t134 > 0.5)
            return "<yel>" + _t132 + "</yel>";
        if (_t134 > 0.2)
            return "<red>" + _t132 + "</red>";
        return "<hir>" + _t132 + "</hir>";
    },
    'create_roomitem': function(_t135) {
        var _a6 = [];
        _a6.push("<div class='room-item' itemid='" + _t135.id + '\x27>');
        if (_t135.max_hp) {
            _a6.push("<div class=\"item-status\"");
            if (!Combat.IsShow || Setting.off_hp) {
                _a6.push(" style=\"display:none;\"");
            }
            _a6.push('>');
            _a6.push("<div class=\"progress hp\"><div class=\"progress-bar\" max=\"" + _t135.max_hp + ("\"  style=\"width:") + Process.countwidth(_t135.hp, _t135.max_hp) + ("%\"></div></div>"));
            _a6.push("<div class=\"progress mp\"><div class=\"progress-bar\" max=\"" + _t135.max_mp + ("\"   style=\"width:") + Process.countwidth(_t135.mp, _t135.max_mp) + ("%\"></div></div>"));
            _a6.push("</div>");
        }
        _a6.push("<span class='item-status-bar'>");
        _a6.push("</span>");
        _a6.push("<span class='item-name'>");
        _a6.push(_t135.name);
        if (Setting.show_hpnum && _t135.max_hp) {
            _a6.push("<span class=\"progress-num\">[" + this.get_hpnum(_t135.hp, _t135.max_hp) + ("<nor>/</nor><hiy>") + _t135.max_hp + ("</hiy>]</span>"));
        }
        _a6.push('</span>');
        _a6.push("</div>");
        return _a6.join('');
    },
    'room': function(_t136) {
        $(".room_items").html('');
        $('.room-name').html(_t136.name);
        $(".room_desc").html(_t136.desc);
        Process.room_name = _t136.name;
        if (!Setting.keep_msg)
            Process.message.clear();
        else
            Setting.keep_msg && ReceiveMessage("你来到了" + _t136.name + '。');
        if (Process.room_path == _t136.path)
            return;
        Setting.show_roomitem && Process.searchItems(_t136);
        Combat.ShowRoomCommands(_t136);
        Process.room_path = _t136.path;
        Process.cur_room = _t136;
        MAP.SetRoom(_t136);
    },
    'roomHiddenItemsReg': /<\w{3}\scmd=['"](.+?)['"]>(.+?)<\/\w{3}>/g,
    'searchItems': function(_t137) {
        var _t138 = null
          , _t139 = _t137.desc;
        while ((_t138 = this.roomHiddenItemsReg.exec(_t139)) !== null) {
            _t137.commands.push({
                'cmd': _t138[1],
                'name': _t138[2]
            });
        }
    },
    'exits': function(_t140) {
        var _t141 = _t140 ? _t140.items : Process.room_exits;
        if (!_t141)
            return;
        Process.room_exits = _t141;
        if (Setting.exits_dir === 1) {
            var _a7 = ["这里明显的出口有："]
              , _a8 = [];
            for (var _n14 = 0; _n14 < MAP.DIRS.length; _n14++) {
                _t141[MAP.DIRS[_n14]] && _a8.push(MAP.DIRS[_n14]);
            }
            for (_n14 = 0; _n14 < _a8.length; _n14++) {
                _n14 > 0 && _a7.push(_n14 === _a8.length - 1 ? " 和 " : '、');
                _a7.push("<span class='exits-item' dir='" + _a8[_n14] + '\x27>' + _a8[_n14] + '</span>');
            }
            _a8.length ? $(".room_exits").html(_a7.join('')) : $(".room_exits").html("<HIK>这里没有明显的出口。<HIK>");
        } else
            $(".room_exits").html(MAP.CreateExitsMap(_t141, $(".container").width(), Process.room_name));
    },
    'before_click_exits': function(_t142) {
        var _J36 = $(_t142.target);
        if (!_J36.attr("dir"))
            return;
        if (_J36.is("rect"))
            _J36.attr('fill', "gray");
        else {
            if (_J36.is("text"))
                _J36.prev().attr('fill', "gray");
        }
    },
    'click_exits': function(_t143) {
        var _J37 = $(_t143.target)
          , _t144 = _J37.attr("dir");
        if (!_t144)
            return;
        if (_J37.is("rect"))
            _J37.attr("fill", "#232323");
        else {
            if (_J37.is('text'))
                _J37.prev().attr("fill", "#232323");
        }
        SendCommand("go " + _t144);
    },
    'query_rmitem': function(_t145) {
        for (let _t146 of this.cur_room.items) {
            if (_t146.id === _t145)
                return _t146;
        }
    },
    'item': function(_t147) {
        ReceiveMessage(_t147.desc);
        _t147.commands = _t147.commands ?? [];
        let _t148 = Process.query_rmitem(_t147.id);
        if (_t148)
            _t147 = Object.assign(_t147, _t148);
        SCRIPT.LAST_OBJ = _t147;
        Dialog.extend.append(_t147.commands, 'item', _t147);
        var _a9 = ["<div class='item-commands'>"];
        for (var _n15 = 0; _n15 < _t147.commands.length; _n15++) {
            _a9.push("<span cmd='" + _t147.commands[_n15].cmd + '\x27>');
            _a9.push(_t147.commands[_n15].name);
            _a9.push('</span>');
        }
        _a9.push("</div>");
        if (Setting.show_command && Combat.STATUS[_t147.id]) {
            Process.itemsElement.find(".item-commands").remove();
            var _t149 = Combat.STATUS[_t147.id].elem.parent();
            $(_a9.join('')).insertAfter(_t149);
            Process.message.scroll2end();
            return;
        }
        ReceiveMessage(_a9.join(''));
    },
    'actions': function(_t150) {
        Combat.ShowActions(_t150);
    },
    'cmds': function(_t151) {
        if (!_t151.items)
            return;
        var _a10 = ["<div class='item-commands'>"];
        if (!_t151.items.length)
            _t151.items = [_t151.items];
        for (var _n16 = 0; _n16 < _t151.items.length; _n16++) {
            _a10.push("<span cmd='" + _t151.items[_n16].cmd + '\x27>');
            _a10.push(_t151.items[_n16].name);
            _a10.push("</span>");
        }
        _a10.push("</div>");
        ReceiveMessage(_a10.join(''));
    },
    'map': function(_t152) {
        MAP.SetMapBuffer(_t152.map, _t152.path);
        MAP.ShowMap(_t152.map, _t152.path);
    },
    'updatemap': function(_t153) {
        MAP.UpdateMap(_t153.map, _t153);
    },
    'dialog': function(_t154) {
        if (_t154.dialog === 'pm')
            Dialog.pm.onData(_t154);
        else
            Dialog.show(_t154.dialog, _t154);
    },
    'sc': function(_t155) {
        Combat.StatusChanged(_t155);
    },
    'perform': function(_t156) {
        Combat.ShowPFM(_t156);
    },
    'disobj': function(_t157) {
        Combat.DisObj(_t157);
    },
    'changepfm': function(_t158) {
        Combat.ChangeDistime(_t158);
    },
    'clearDistime': function(_t159) {
        Combat.ClearDistime(_t159);
    },
    'pay': function(_t160) {
        if (_t160.pay === 3) {
            ReceiveMessage("<yel>请打开微信扫描二维码支付：</yel>\n");
            let _J38 = $("<div style=\"width:100%;text-align:center;\"><img style=\"border:solid 2px #808088\" src=\"" + _t160.url + '\x22/></div>');
            _J38.children(0).on("load", function() {
                ReceiveMessage('');
            });
            MessagePage.append(_J38);
        } else
            window.location.href = _t160.url;
    },
    'dispfm': function(_t161) {
        Combat.On_Perform(_t161);
    },
    'status': function(_t162) {
        Combat.StatusItemChanged(_t162);
    },
    'combat': function(_t163) {
        if (_t163.start) {
            if (Setting.auto_showcombat === 1 && !Combat.IsShow) {
                Combat.Show();
            }
            if (Setting.auto_hideroom === 1 && !Setting.hide_roomdesc) {
                $('.room_desc').hide();
            }
        }
        if (_t163.end && Setting.auto_hideroom === 1 && !Setting.hide_roomdesc) {
            $(".room_desc").show();
        }
    },
    'state': function(_t164) {
        if (_t164 && _t164.state) {
            var _a11 = ["<span class='title'>" + _t164.state + "</span>"];
            if (_t164.commands)
                for (var _n17 = 0; _n17 < _t164.commands.length; _n17++) {
                    _a11.push("<span class='item-command' cmd='" + _t164.commands[_n17].cmd + '\x27>');
                    _a11.push(_t164.commands[_n17].name);
                    _a11.push('</span>');
                }
            $('.state-bar').html(_a11.join('')).css('visibility', "visible");
            if (_t164.no_stop)
                $(".state-tool").hide();
            else
                $(".state-tool").show();
            Process.states = _t164.desc;
            if (Process.timer)
                clearInterval(Process.timer);
            if (Process.states && Process.states.length) {
            if (typeof Process.states == "string") {
                Process.states = [Process.states];
            }
            Process.timer = setInterval(Process.updatestate, _t164.interval || 5000);
        }
        } else {
            $('.state-bar').empty().css("visibility", "hidden");
            $(".state-tool").hide();
            clearInterval(Process.timer);
        }
    },
    'updatestate': function() {
        if (Process.states && GameClient) {
            var _t165 = Process.states.length;
            ReceiveMessage(Process.states[parseInt(Math.random() * _t165)]);
        }
    },
    'die': function(_t166) {
        if (_t166.relive)
            return Process.state({});
        Process.state({
            'state': "<hiw>你已经死亡：</hiw>",
            'no_stop': true,
            'desc': ["<blk>一股阴冷的气息包围着你。</blk>", "<blu>朦胧中你好像听到有人在喊：过来吧，过来吧！</blu>"],
            'commands': _t166.commands,
            'interval': 12000
        });
    },
    'warn': function(_t167) {
        Warn.Show(_t167);
    },
    'msg': function(_t168) {
        var _t169 = Dialog.channel.createElement(_t168, !Setting.no_spmsg);
        if (!_t169)
            return;
        if (!Setting.no_spmsg) {
            Process.channel.push(_t169);
            Process.channel.scroll2end();
        } else {
            ReceiveMessage(_t169);
        }
    },
    'addAction': function(_t170) {
        Combat.AddObj(_t170.id, _t170.name, _t170.distime);
    },
    'removeAction': function(_t171) {
        Combat.DisObj({
            'id': _t171.id,
            'remove': true
        });
    }
};