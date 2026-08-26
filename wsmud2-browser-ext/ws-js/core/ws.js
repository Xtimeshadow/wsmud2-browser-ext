// ============================================================
// ws.js —— 游戏客户端核心（原版游戏脚本改造而来，最大文件之一）
// ------------------------------------------------------------
// 这个文件接管了游戏"客户端"的大部分工作：
//   MAP          地图：房间绘制、方向出口、换房间缓存
//   Process      消息分发总表：服务器每条消息按 type 找到对应函数处理
//   Combat       战斗面板：血条蓝条、招式 CD 动画、伤害显示
//   MessageQueue 聊天消息滚动队列（自动翻页、回到底部）
//   WSClient     WebSocket 连接封装；ConnectServer/CloseServer 连接与断开
//   SendCommand  发送游戏指令（断线时缓存并自动重连）
//   ReceiveData/ReceiveMessage 收消息总入口（JSON 走 ReceiveData，文本走 ReceiveMessage）
//   API/storageUtil/Util/Warn/ToolAction/Touch 各种小工具
//
// 主要消息类型（type）：room 房间、exits 出口、items 物品、map 地图、
//   dialog 对话框、sc 状态、combat 战斗、die 死亡、login 登录、
//   perform 出招、msg 消息、status 状态条 等 30 多种。
//
// 想改：地图绘制、聊天显示、状态条、死亡提示等 → 在本文件搜索对应函数。
// ============================================================
'use strict';

// ws.js — wsmud2.com 游戏客户端核心脚本（WebSocket 通信、界面渲染、战斗逻辑等）。

$(function () {
    $(".login-content").on("click", ".panel_item", LoginCommand);
    $('.container').on('click', ContainerCommand);
    // 聊天点击
    $('.channel').on('click', ContainerCommand);

    $(".role-list").on("click", ".role-item", function () {
        $(this).parent().find(".select").removeClass("select");
        $(this).addClass('select');
    });

    $(".channel-box").on("click", 'span', ChannelChanged);
    $(".combat-commands").on("click", ".pfm-item", Combat.Perform).on('wheel', Combat.Scroll);
    $(".room-commands").on("wheel", Combat.Scroll);
    $(".sender-box").on('keyup', OnSendBoxKeyDown);
    $(".room_items").on('click', ".room-item", Process.selectItem);
    $(".bottom-bar").on('click', ".tool-item,.state-bar,.item-command", MenuClick);
    $(".map-panel").on("click", open_map);
    $(".sender-btn").on("click", SendChatMessage);
    $(".room_exits").on("pointerdown", Process.before_click_exits).on("pointerup", Process.click_exits);

    $(".room-title>.map-icon").on("click", () => MAP.LoadMap());
    $(".validnum-box>.validnum-btn").on("click", SendValidateCode);

    Process.init();
    CheckLogin();
    // 清除输入框默认空格（游戏页面 HTML 遗留问题）
    $(".sender-box").val('');
});

var API = window.API || {};

function ShowServers() {
    if (!SERVERS) {
        ShowLoader('正在获取服务器列表');
        API.UserAPI.GetServer(function(_t55) {
            if (!_t55 || typeof _t55 === "string") {
                ShowInputError('#login_pwd', '获取服务器列表出错');
                return;
            }
            SERVERS = _t55;
            DisplayServer(_t55);
            ShowServers();
        });
        return;
    }
    const _t56 = SERVERS;
    if (!_t56 || !_t56.length) {
        HideAndShow("#login_panel");
        ShowInputError("#login_pwd", '获取服务器列表出错');
    }
    else {
        const _t57 = GetUserCookie('s')
            , _t58 = _t57 ? SERVERS[_t57] : _t56.length === 1 ? SERVERS[0] : null;
        if (_t58) {
            ShowLoader("正在连接服务器");
            return ConnectServer(_t58);
        }
        HideAndShow("#slist_panel");
    }
}

function DisplayServer() {
    if (!SERVERS)
        return;
    const _t59 = location.hostname.startsWith("127.0.0.1") || location.hostname.startsWith("localhost")
        , _t60 = location.search.startsWith('?test');
    if (_t59) {
        SERVERS.push({
            'id': 100,
            'name': '本地测试1',
            'ip': "127.0.0.1",
            'port': 31200
        });
        SERVERS.push({
            'id': 101,
            'name': "本地测试2",
            'ip': "127.0.0.1",
            'port': 31201
        });
    }
    const _a2 = []
        , _t61 = "武神传说2";
    for (let _n5 = 0; _n5 < SERVERS.length; _n5++) {
        if (!_t60 && !_t59 && SERVERS[_n5].istest)
            continue;
        _a2.push("<li class='role-item");
        if (_n5 === 0)
            _a2.push(" select");
        _a2.push("' index='" + _n5 + '\x27>');
        _a2.push(_t61);
        _a2.push("&nbsp;&nbsp;");
        _a2.push(SERVERS[_n5].name);
        SERVERS[_n5].isdef && _a2.push("<span style='color:red;font-size:0.5rem;line-height:2rem;height:2rem;'>&nbsp;（推荐）</span>");
        _a2.push("</li>");
    }
    $(".server-list").html(_a2.join('')).on("click", 'li', function() {
        const _J20 = $(this);
        if (_J20.is(".select"))
            return;
        _J20.parent().find('.select').removeClass('select');
        _J20.addClass("select");
    });
}
function GetUserCookie(name) {
    let _t63, _t64 = new RegExp("(^| )" + name + ("=([^;]*)(;|$)"));
    _t63 = document.cookie.match(_t64);
    if (_t63)
        return unescape(_t63[2]);
    else
        return null;
}
const Warn = {
  'Elemes': [],
  'Show': function(_t172) {
      var _a12 = ["<div class='warn-dialog'>"];
      _a12.push("<div class='warn-content'>");
      _a12.push(_t172.content);
      _a12.push("</div>");
      _a12.push("<div class='item-commands'>");
      for (var _n18 = 0; _n18 < _t172.cmds.length; _n18++) {
          var _t173 = _t172.cmds[_n18];
          _a12.push("<span cmd='");
          _a12.push(_t173.cmd);
          _a12.push('\x27>');
          _a12.push(_t173.name);
          _a12.push("</span>");
      }
      _a12.push("</div>");
      var _J39 = $(_a12.join('')).appendTo(".bottom-bar");
      this.Elemes.push(_J39);
      this.Settop();
      var _t174 = this.Close.bind(this, _J39);
      _t172.time && window.setTimeout(_t174, _t172.time);
      _J39.on('click', 'span', _t174);
  },
  'Close': function(_t175) {
      if (this.Elemes.indexOf(_t175) > -1) {
          _t175.remove();
          this.Elemes.Remove(_t175);
          this.Settop();
      }
  },
  'Settop': function() {
      var _J40 = $(".bottom-bar").height() + 8;
      for (var _n19 = 0; _n19 < Warn.Elemes.length; _n19++) {
          var _t176 = Warn.Elemes[_n19];
          _t176.css('bottom', _J40);
          _J40 += _t176.height() + 14;
      }
  }
};

let isShowChat;

function ContainerCommand(event) {
    let _J21 = $(event.target)
        , _t65 = _J21.attr('cmd');
    if (!_t65)
        _t65 = _J21.parent().attr("cmd");
    if (_t65) {
        let _t66 = _t65[0];
        if (_t66 === '_') {
            const _t67 = _t65.split('\x20');
            switch (_t67[0]) {
            case "_confirm":
                Confirm.Process(_t67);
                break;
            case "_setting":
                Setting.save(_t67[1], _t67[2]);
                break;
            case "_trade":
                Dialog.trade.confirm(_t67[1]);
                break;
            case "_close":
                Warn.Close(_J21);
                break;
            case "_hide":
                Storage.ban_user(_t67[1]);
                break;
            case "_closed":
                Dialog.hide();
            case "_party":
                Dialog.party.command(_t67[1]);
                break;
            }
        } else if (_t66 === '#') {
            SCRIPT.run(_t65);
        } else {
            SendCommand(_t65);
            if (!_J21.closest(".dialog-fb").length && _J21.closest(".dialog-content").length > 0)
                _J21.closest(".item-commands").remove();
        }
        return false;
    } else if (isShowChat && !_J21.closest(".chat-panel").length) {
        $(".chat-panel").addClass("hide");
        isShowChat = false;
    }
    Confirm.Close();
}

let LastCommand;

function SendCommand(cmd) {
    if (IsConnecting)
        return;
    if (!GameClient || !GameClient.Connected()) {
        LastCommand = cmd;
        ReceiveMessage("<red>连接中断，正在重新连线...</red>");
        ConnectServer(SelectedServer);
        return;
    }
    Dialog.extend.record(cmd);
    GameClient.Send(cmd);
}
function ChannelChanged() {
    const _J22 = $(this)
        , _t68 = _J22.attr('channel');
    if (_t68 === 'emote')
        return ShowEmotePanel();
    if (_J22.is(".selected"))
        return;
    const _t69 = _J22.parent();
    _t69.children().removeClass('selected');
    _J22.addClass('selected');
    _t69.attr("channel", _t68);
    $(".sender-box").focus();
    return false;
}
function ShowEmotePanel() {
    const _J23 = $(".channel-emotes");
    if (_J23.is(".hide")) {
        _J23.removeClass("hide");
        if (!Process.emtoes) {
            SendCommand('emote');
            Process.emtoes = [];
            $(".sender-box").blur();
            _J23.on("click", 'span', function() {
                const _J24 = $(this).html();
                $(".sender-box").val('*' + _J24).focus();
                $(".channel-emotes").addClass("hide");
            });
        }
    } else {
        $(".channel-emotes").addClass('hide');
    }
}
function MenuClick(event) {
    let _J25 = $(this).attr('command');
    if (!_J25) {
        _J25 = $(this).attr("cmd");
        if (_J25)
            SendCommand(_J25);
        return false;
    }
    return HandlerMenuCommand(_J25);
}
const ToolAction = {
    'tools': null,
    'hideTool': null,
    'ToolState': 0,
    'ToolOpacity': 0,
    'ToolSpeed': 0,
    'InitTools': function() {
        if (!this.tools) {
            this.tools = $(".right-bar>.tool-item");
            this.hideTool = $(".br-tool");
            this.bottom_tools = $(".bottom-bar>.tool-item");
        }
    },
    'ShowTools': function() {
        this.InitTools();
        if (this.ToolState === 1)
            return;
        if (this.ToolState === 0) {
            for (var _n6 = 0; _n6 < this.tools.length; _n6++) {
                this.tools[_n6].style.display = '';
                this.tools[_n6].style.opacity = 0;
            }
            this.ToolSpeed = 200;
            this.ToolOpacity = 0;
            $(this.hideTool).removeClass("hide-tool");
        } else {
            this.ToolOpacity = 100;
            this.ToolSpeed = 100;
            $(this.hideTool).addClass("hide-tool");
        }
        window.setTimeout(this.ShowToolsAnimate.bind(this, this.ToolState), 100);
        this.ToolState = 1;
    },
    'ShowToolsAnimate': function(_t71) {
        var _t72, _t73;
        if (_t71 === 0) {
            this.ToolOpacity = this.ToolOpacity + this.ToolSpeed;
            _t72 = this.ToolOpacity;
            for (_t73 = this.tools.length - 1; _t73 >= 0; _t73--) {
                if (_t72 < 0)
                    this.tools[_t73].style.opacity = 0;
                else {
                    if (_t72 > 100)
                        this.tools[_t73].style.opacity = 1;
                    else
                        this.tools[_t73].style.opacity = _t72 / 100;
                }
                _t72 -= 20;
                if (_t72 < 0)
                    break;
            }
            this.ToolOpacity -= 30;
            _t72 < 100 ? window.setTimeout(this.ShowToolsAnimate.bind(this, _t71), 100) : this.ToolState = 2;
        } else {
            this.ToolOpacity = this.ToolOpacity - this.ToolSpeed;
            _t72 = this.ToolOpacity;
            for (_t73 = 0; _t73 < this.tools.length; _t73++) {
                if (_t72 < 0)
                    this.tools[_t73].style.opacity = 0;
                else {
                    if (_t72 > 100)
                        this.tools[_t73].style.opacity = 1;
                    else
                        this.tools[_t73].style.opacity = _t72 / 100;
                }
                _t72 += 20;
                if (_t72 >= 100)
                    break;
            }
            this.ToolOpacity -= 20;
            if (_t72 >= 0)
                window.setTimeout(this.ShowToolsAnimate.bind(this, _t71), 100);
            else {
                this.ToolState = 0;
                for (_t73 = 0; _t73 < this.tools.length; _t73++) {
                    this.tools[_t73].style.display = "none";
                }
            }
        }
    },
    'showFlag': function(_t74, _t75) {
        this.InitTools();
        if (_t75 < 0)
            _t75 = 0;
        else {
            if (_t75 > 99)
                _t75 = 99;
        }
        let _t76 = this.tools.filter('[command=\x27' + _t74 + '\x27]');
        if (!_t76.length)
            _t76 = this.bottom_tools.filter("[command='" + _t74 + '\x27]');
        _t75 ? _t76.find('.tag').removeClass("hide") : _t76.find('.tag').addClass("hide");
    }
};

function HandlerMenuCommand(command) {
    switch (command) {
    case "showtool":
        ToolAction.ShowTools();
        break;
    case "showchat":
        return ShowChat();
    case "showcombat":
        return Combat.Show();
    case 'stopstate':
        if (Dialog.extend.is_record)
            return Dialog.extend.stop_record();
        SendCommand("state stop");
        break;
    case "stateinfo":
        SendCommand('state\x20info');
        break;
    default:
        Dialog.show(command);
        break;
    }
    return false;
}

isShowChat = false;

function ShowChat() {
    var _J26 = $(".chat-panel").toggleClass("hide");
    if (!_J26.is(".hide")) {
        isShowChat = true;
        _J26.find("input").val('').focus();
        return false;
    } else {
        isShowChat = false;
        return false;
    }
}

function CloseServer() {
    GameClient && GameClient.Connected() && GameClient.Destroy();
    GameClient = null;
}

let IsConnecting = false;
const SessionKey = 'u'
const SessionToken = 'p';

function ConnectServer(server, showLoader) {
    if (IsConnecting)
        return;
    SelectedServer = server;
    console.log("重新连接", GameClient === null ? "未连接" : "已连接");
    CloseServer();
    GameClient = new WSClient(server.ip,server.port);
    IsConnecting = true;
    GameClient.OnError = function(_t77, _t78) {
        IsConnecting = false;
        if (_t77) {
            if (_t77.isTrusted)
                _t77 = "服务器没有响应，请稍后重试";
            ShowLoader("<strong>连接失败：</strong>" + _t77 + '');
        }
    }

    GameClient.OnConnect = function() {
        IsConnecting = false;
        if (!showLoader && !Process.player) {
            ShowLoader("正在获取角色列表...");
            SendCommand(GetUserCookie(SessionKey) + '\x20' + GetUserCookie(SessionToken));
        } else if (showLoader) {
            SendCommand(GetUserCookie(SessionKey) + '\x20' + GetUserCookie(SessionToken) + '\x20' + showLoader + '\x20' + server.ID);
        } else {
            SendCommand(GetUserCookie(SessionKey) + '\x20' + GetUserCookie(SessionToken) + '\x20' + Process.player);
        }
    }

    GameClient.OnClose = function(_t81) {
        IsConnecting = false;
        if (this.ChangeServer) {
            this.ChangeServer = false;
            return;
        }
        if (this.Connected())
            return;
        if (Process.player) {
            Process.clear();
            ReceiveMessage("<red>你的连接中断了...</red>");
        } else {
            setTimeout( () => {
                HideAndShow($("#slist_panel"));
            }
            , 3000);
        }
    }

    GameClient.OnData = ReceiveData;
    GameClient.OnMessage = ReceiveMessage;
    GameClient.Connect();
}
function ShowInputError(selector, message) {
    $(selector).focus().parent().find(".input-error").remove();
    $("<div class='input-error'>" + message + '</div>').insertAfter(selector);
}
function ShowLoader(text, withBackdrop) {
    var _J27 = $(".login-content").children();
    for (var _n7 = 0; _n7 < _J27.length; _n7++) {
        $(_J27[_n7]).css("display") != "none" && !$(_J27[_n7]).is(".signinfo") && $(_J27[_n7]).hide();
    }
    var _J28 = $('#loader').css("opacity", 1).show();
    _J28.find("#loader_msg").html(text);
}
const MessageQueue = {
    'size': 3,
    'max': 666,
    'container': null,
    'pages': null,
    'count': 0,
    'allow_scroll': true,
    'create': function(_t83, _n8=3, _n9=666) {
        let _t84 = Object.create(this);
        _t84.container = _t83;
        _t84.pages = [];
        _t84.size = _n8;
        _t84.max = _n9;
        Util.isMobile ? _t83.on("touchend", this.stopDrag.bind(_t84)) : _t83.on("wheel", this.stopDrag.bind(_t84));
        _t84.scroll_button = $("<div class=\"scroll-flag\" style=\"display:none;\"><span class=\"glyphicon glyphicon-chevron-down\"></span></div>");
        _t84.scroll_button.appendTo(_t83);
        _t84.scroll_button.on("pointerup", _t84.start_move.bind(_t84));
        return _t84;
    },
    'stopDrag': function(_t85) {
        let _t86 = this.is_end();
        if (_t86 === this.allow_scroll)
            return;
        this.allow_scroll = _t86;
        _t86 && this.scroll_button.hide();
    },
    'start_move': function() {
        this.allow_scroll = true;
        this.scroll_button.hide();
        this.scroll2end();
    },
    'push': function(_t87) {
        let _t88 = this.pages;
        !_t88.length && _t88.push($("<pre></pre>").appendTo(this.container));
        if (this.count > this.max) {
            if (_t88.length >= this.size)
                _t88.splice(0, 1)[0].remove();
            this.count = 0;
            _t88.push($("<pre></pre>").appendTo(this.container));
        }
        let _t89 = _t88[_t88.length - 1];
        _t89.append(_t87 + '\x0a');
        this.count++;
    },
    'clear': function() {
        for (let _t90 of this.pages) {
            _t90.remove();
        }
        this.pages.length = 0;
        this.count = 0;
    },
    'is_end': function() {
        const _t91 = this.container[0]
          , _t92 = _t91.scrollHeight
          , _t93 = _t91.clientHeight
          , _t94 = _t91.scrollTop;
        return _t94 + _t93 >= _t92 - 50;
    },
    'scroll2end': function() {
        const _t95 = this.container[0]
          , _t96 = _t95.scrollHeight
          , _t97 = _t95.clientHeight;
        if (_t96 < _t97)
            return;
        if (!this.allow_scroll) {
            let _t98 = this.container[0].getBoundingClientRect();
            return this.scroll_button.show().css("top", _t98.bottom - this.scroll_button.height() - screenTop);
        }
        _t95.scrollTop = _t95.scrollHeight;
    }
};
function ReceiveMessage(event) {
    // 【2026-08-11 容错】文本消息处理异常隔离，不中断挂机
    try {
        if (Dialog.extend.message_filter(event))
            return;
        Process.message.push(event);
        Process.message.scroll2end();
        Dialog.extend.trigger(event);
    } catch (e) {
        try { ExtLog.error('[WS] ReceiveMessage 异常（已隔离）:', e && e.message); } catch (e2) { }
    }
}
function ReceiveData(data) {
    // 【2026-08-11 容错】单个处理器异常不再中断整条消息链（原代码异常会跳过 Dialog.extend.process）
    try {
        if (Dialog.extend.data_filter(data))
            return;
        var _fn6 = Process[data.type];
        _fn6 && _fn6(data);
        Dialog.extend.process(data);
    } catch (e) {
        try { ExtLog.error('[WS] ReceiveData 异常（已隔离）:', e && e.message); } catch (e2) { }
    }
}
function OnSendBoxKeyDown(event) {
    event.keyCode === 13 && SendChatMessage();
}
function SendChatMessage() {
    var _J29 = $(".sender-box").val();
    if (!_J29)
        return;
    if (_J29.length > 100)
        return ReceiveMessage("<hir>你输入的内容太多了。</hir>");
    var _J30 = $(".channel-box").attr("channel");
    $(".sender-box").val('').focus();
    SendCommand(_J30 + '\x20' + _J29 + '');
}
function RefreshInput(selector) {
    switch (selector) {
    case "name":
        $("#reg_name").val(create_name($("#gender_0").is(":checked") ? 0 : 1));
        break;
    case 'id':
        $('#reg_id').val(create_id());
        break;
    case "prop":
        var _t99 = create_prop();
        $("#reg_str").val(_t99.str);
        $("#reg_con").val(_t99.con);
        $("#reg_dex").val(_t99.dex);
        $('#reg_int').val(_t99.int);
        break;
    }
}

function CreateHeadPanel(parent) {
    var _a16 = ["<div class=\"title\">"];
    _a16.push(parent.name);
    _a16.push("</div><div><span>气血： </span><div class=\"progress\">");
    _a16.push("<div class=\"progress-bar\" style=\"width:");
    _a16.push(parent.hp * 100 / parent.max_hp);
    _a16.push("%; background-color: #800000;\"></div><span class=\"progress-text\">");
    _a16.push(parent.hp);
    _a16.push('\x20/\x20');
    _a16.push(parent.max_hp);
    _a16.push("</span></div></div><div><span>内力： </span><div class=\"progress\"><div style=\"width:");
    _a16.push(parent.mp * 100 / parent.max_mp);
    _a16.push("%; background-color: #000080;\"></div><span class=\"progress-text\">");
    _a16.push(parent.mp);
    _a16.push(" / ");
    _a16.push(parent.max_mp);
    _a16.push("</span></div></div><div></div>");
    return _a16.join('');
}

function HideAndShow(hideSel, showSel) {
    var _t1484, _J92 = $(".login-content").children();
    for (var _n171 = 0; _n171 < _J92.length; _n171++) {
        if ($(_J92[_n171]).css('display') != "none") {
            _t1484 = $(_J92[_n171]);
            break;
        }
    }
    if (!_t1484)
        _t1484 = $("#login_panel");
    _t1484.animate({
        'opacity': 0
    }, "fast", function() {
        _t1484.hide();
        if (hideSel == ".container")
            $(".login-content").hide();
        else
            $(".login-content").show();
        hideSel && (hideSel = $(hideSel),
        hideSel.show(),
        hideSel.css("opacity", '0'),
        hideSel.animate({
            'opacity': 1
        }, "slow", showSel));
    });
}
function initIos() {
    window.isios = true;
    $("<style type='text/css'>body{-webkit-user-select:none;-webkit-user-drag:none;}</style>").appendTo("head");
    $(".download_cmd").remove();
}
function showNews(newsList) {
    HideAndShow($("#new_panel "));
    $("#news_frame").attr("src", "/news/" + newsList + ".html");
}