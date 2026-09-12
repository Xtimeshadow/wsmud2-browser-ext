// ============================================================
// websocket-proxy.js —— 劫持 WebSocket
// ============================================================
'use strict';

var show_msg;
var CanUse = false;
if (WebSocket) {
    CanUse = true;
    show_msg = function(msg) {
        ws_on_message({ type: "text", data: msg });
    }

    // ---- 刷新式重登预存凭证恢复 ----
    var _rcCookie = null, _rcId = null;
    var _firstLoginCmd = null;
    try {
        var _rcC = localStorage.getItem('ext_rc_cookie');
        var _rcI = localStorage.getItem('ext_rc_id');
        var _rcT = localStorage.getItem('ext_rc_ts');
        var _rcTTL = 0; try { _rcTTL = (Date.now() - parseInt(_rcT, 10)); } catch(e) {}
        var _rcHit = _rcC && _rcI && _rcT && _rcTTL < 600000;
        console.info('[重登-启动] ext_rc_cookie=', !!_rcC, ' ext_rc_id=', !!_rcI, ' ext_rc_ts=', _rcT, ' age=', _rcTTL+'ms', ' → valid=', _rcHit);
        if (_rcHit) { _rcCookie = _rcC; _rcId = _rcI; }
    } catch(e) { console.warn('[重登-启动] 预存凭证恢复异常', e); }

    var _ws = WebSocket, ws, ws_on_message;
    unsafeWindow.WebSocket = function (uri) {
        var _inst = new _ws(uri);
        this._ws = _inst;
        ws = _inst;
    };
    unsafeWindow.WebSocket.prototype = {
        CONNECTING: _ws.CONNECTING, OPEN: _ws.OPEN, CLOSING: _ws.CLOSING, CLOSED: _ws.CLOSED,
        get url() { return (this._ws || ws).url; },
        get protocol() { return (this._ws || ws).protocol; },
        get readyState() { return (this._ws || ws).readyState; },
        get bufferedAmount() { return (this._ws || ws).bufferedAmount; },
        get extensions() { return (this._ws || ws).extensions; },
        get binaryType() { return (this._ws || ws).binaryType; },
        set binaryType(t) { (this._ws || ws).binaryType = t; },
        get onopen() { return (this._ws || ws).onopen; },
        set onopen(fn) {
            (this._ws || ws).onopen = (e) => {
                if (GameState) { GameState.connected = true; }
                if (WG) { WG.online = true; }
                try { _heartbeatStart(); } catch (eh) { }
                if (typeof fn === "function") fn(e);
            };
        },
        get onmessage() { return (this._ws || ws).onmessage; },
        set onmessage(fn) {
            ws_on_message = fn;
            (this._ws || ws).onmessage = WG.receive_message;
        },
        get onclose() { return (this._ws || ws).onclose; },
        set onclose(fn) {
            (this._ws || ws).onclose = (e) => {
                var wasConnected = GameState.connected;
                WG.online = false;
                GameState.connected = false;
                try { _heartbeatStop(); } catch (eh) { }
                try { if (typeof unsafeWindow.__extRecordKickRole === 'function') unsafeWindow.__extRecordKickRole(); } catch (eh2) { }
                auto_relogin = GM_getValue(roleid + "_auto_relogin", auto_relogin);
                if (typeof fn === "function") fn(e);
                if (auto_relogin == "开" || auto_relogin === true || auto_relogin === 'true') {
                    if (wasConnected) _reloginTry = 0;
                    _scheduleRelogin();
                }
            }
        },
        get onerror() { return (this._ws || ws).onerror; },
        set onerror(fn) { (this._ws || ws).onerror = fn; },

        send: function (text) {
            if (_rcCookie && _rcId && GameState && !GameState.connected) {
                try {
                    var _isLoginCmd = typeof text === 'string' && text.length > 3
                        && text.indexOf(' ') > 0 && text[0] !== '$' && text[0] !== '@';
                    if (_isLoginCmd) {
                        var _finalCmd;
                        var _cookieParts = _rcCookie.split(' ');
                        if (_cookieParts.length >= 3) {
                            _finalCmd = _rcCookie;
                        } else {
                            _finalCmd = _rcCookie + ' ' + _rcId;
                        }
                        console.info('[重登-send] 替换登录命令！原=', text, ' → 新=', _finalCmd);
                        GameState.cookie = _rcCookie;
                        GameState.id = _rcId;
                        text = _finalCmd;
                        _rcCookie = null; _rcId = null;
                    }
                } catch(e) {}
            }
            if (GameState.cookie == undefined) { GameState.cookie = text; }
            if (!_firstLoginCmd && typeof text === 'string' && text.length > 5
                && text.indexOf(' ') > 0 && text[0] !== '$' && text[0] !== '@' && text[0] !== 'w' && text[0] !== 'b' && text[0] !== 'l') {
                _firstLoginCmd = text;
            }
            if (text.indexOf(GameState.id) > -1 && !GameState.connected) {
                text = GameState.cookie + ' ' + GameState.id
            }
            if (cmd_echo) {
                const time = new Date().toLocaleTimeString();
                show_msg('<hic>' + time + '</hic> <hiy>' + text + '</hiy>');
            }
            if (text[0] == "$") { WG.SendCmd(text); return; }
            if (text[0] == "@") {
                if (unsafeWindow && unsafeWindow.ToRaid) {
                    ToRaid.perform(text);
                    return;
                } else {
                    messageAppend("插件未安装,请访问 https://greasyfork.org/zh-CN/scripts/375851-wsmud-raid 下载并安装");
                    window.open("https://greasyfork.org/zh-CN/scripts/375851-wsmud-raid", '_blank');
                }
            }
            switch (text) {
                case 'wk': WG.zdwk(); break;
                case 'backup': WG.make_config(); break;
                case 'load': WG.load_config(); break;
                default: (this._ws || ws).send(text); break;
            }
        },
        close: function () { (this._ws || ws).close(); }
    };

    var cmd_queue = [], cmd_busy = false, echo = false;
    var _send_cmd = function () {
        if (!ws || ws.readyState != 1) { cmd_busy = false; cmd_queue = [] }
        else if (cmd_queue.length > 0) {
            cmd_busy = true;
            var t = new Date().getTime();
            for (var i = 0; i < cmd_queue.length; i++) {
                if (!cmd_queue[i].timestamp || cmd_queue[i].timestamp >= t - 1300) { cmd_queue.splice(0, i); break }
            }
            for (i = 0; i < Math.min(cmd_queue.length, 5); i++) {
                if (!cmd_queue[i].timestamp) {
                    try { ws.send(cmd_queue[i].cmd); cmd_queue[i].timestamp = t } catch (e) { cmd_busy = false; cmd_queue = []; return }
                }
            }
            if (!cmd_queue[cmd_queue.length - 1].timestamp) { setTimeout(_send_cmd, 100) } else { cmd_busy = false }
        } else { cmd_busy = false }
    };
    var send_cmd = function (cmd, no_queue) {
        if (ws && ws.readyState == 1) {
            cmd = cmd instanceof Array ? cmd : cmd.split(';');
            if (no_queue) {
                for (var i = 0; i < cmd.length; i++) {
                    if (cmd_echo || Coding) { const time = new Date().toLocaleTimeString(); show_msg('<hic>' + time + '</hic> <hiy>' + cmd[i] + '</hiy>'); }
                    ws.send(cmd[i])
                }
            } else {
                for (i = 0; i < cmd.length; i++) { cmd_queue.push({ cmd: cmd[i], timestamp: 0 }) }
                if (!cmd_busy) { _send_cmd() }
            }
        }
    };
    unsafeWindow.__extCmdQueueIdle = function () { return cmd_queue.length === 0 && !cmd_busy; };
    unsafeWindow.__extCloseWs = function () { try { if (ws && ws.readyState === 1) ws.close(); } catch (e) { } };
    unsafeWindow.__extFirstLoginCmd = function () { return _firstLoginCmd; };
} else {
    console.log("插件不可运行，请访问: https://greasyfork.org/zh-CN/forum/discussion/41547/x");
}