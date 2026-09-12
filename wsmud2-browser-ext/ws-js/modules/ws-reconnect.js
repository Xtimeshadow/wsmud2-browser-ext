// ============================================================
// ws-reconnect.js —— WebSocket 断线重连与跨窗口心跳
// ------------------------------------------------------------
// 从 websocket-proxy.js 拆分出来的重连/心跳逻辑：
//   指数退避重连（0.5s→2s→5s→10s→30s→60s，封顶 20 次）
//   自动恢复刷新（无人值守场景）
//   被顶号强制重登（抢回账号）
//   跨窗口在线心跳（多开多账号角色汇总）
// ============================================================
'use strict';

// 重连退避序列
var _reloginTry = 0;
var _reloginTimer = null;
var _reloginDelay = [500, 2000, 5000, 10000, 30000, 60000];


// ---- 刷新式重登：预存登录凭证，跳过 UI 直接续连 ----
// 刷新前把 cookie（完整登录命令）+ 角色 ID + 区服地址 存到 localStorage，
// 刷新后 websocket-proxy.js 自动恢复 → 替身 send() 直接用预存 cookie 替换游戏的 'u p' 登录命令，
// 跳过 AccountHelper 的账号切换/选区服/选角色全套 UI 操作。
var _RC_COOKIE = 'ext_rc_cookie';
var _RC_ID     = 'ext_rc_id';
var _RC_TS     = 'ext_rc_ts';
var _RC_SERVER = 'ext_rc_server';
var _RC_TTL    = 600000;

function _saveReloginContext() {
    try {
        var _hadCookie = false, _hadId = false, _cookieSrc = '', _idSrc = '';
        // --- cookie：多来源兜底 ---
        var _cookie = null;
        if (GameState && GameState.cookie) { _cookie = String(GameState.cookie); _cookieSrc = 'GameState.cookie'; }
        if (!_cookie && typeof unsafeWindow !== 'undefined' && unsafeWindow.__extFirstLoginCmd) {
            try {
                var _f = unsafeWindow.__extFirstLoginCmd();
                if (_f) { _cookie = String(_f); _cookieSrc = 'extFirstLoginCmd'; }
            } catch(e) {}
        }
        if (_cookie) { localStorage.setItem(_RC_COOKIE, _cookie); _hadCookie = true; }

        // --- id：多来源兜底 ---
        var rid = '';
        if (GameState && GameState.id) { rid = String(GameState.id); _idSrc = 'GameState.id'; }
        else if (typeof roleid !== 'undefined' && roleid) { rid = String(roleid); _idSrc = 'roleid'; }
        else { try { if (typeof Process !== 'undefined' && Process.player) { rid = String(Process.player); _idSrc = 'Process.player'; } } catch(e){} }
        if (rid) { localStorage.setItem(_RC_ID, rid); _hadId = true; }

        try {
            if (typeof SelectedServer !== 'undefined' && SelectedServer && SelectedServer.ip) {
                localStorage.setItem(_RC_SERVER, JSON.stringify({ ip: SelectedServer.ip, port: SelectedServer.port, ID: SelectedServer.ID }));
            }
        } catch(e) {}
        localStorage.setItem(_RC_TS, String(Date.now()));
        try { console.info('[重登-预存] cookie=', _hadCookie ? _cookieSrc+'('+_cookie.slice(0,20)+'...)' : 'NO', ' id=', _hadId ? _idSrc+'('+rid+')' : 'NO', ' → valid=', _hadCookie && _hadId); } catch(e) {}
    } catch (e) { console.warn('[重登-预存] 异常:', e.message); }
}

// 自动恢复刷新标记
var _recoverFlagKey = 'ext_auto_recover_flag';
var _recoverTimeKey = 'ext_last_recover_ts';
var _recoverCountKey = 'ext_recover_count';

function _autoRecoverReload() {
    try {
        if (typeof auto_recover === 'undefined' || (auto_recover !== '开' && auto_recover !== true && auto_recover !== 'true')) return;
        var now = Date.now();
        var last = parseInt(localStorage.getItem(_recoverTimeKey) || '0', 10);
        if (now - last < 10 * 60 * 1000) return;
        var count = parseInt(localStorage.getItem(_recoverCountKey) || '0', 10);
        if (count >= 5) return;
        localStorage.setItem(_recoverTimeKey, String(now));
        localStorage.setItem(_recoverCountKey, String(count + 1));
        localStorage.setItem(_recoverFlagKey, '1');
        _saveReloginContext();
        try { ExtLog.warn('[恢复] 重连失败达上限，自动刷新页面重新登录'); } catch (e) { }
        location.reload();
    } catch (e) { }
}

// 被顶号强制重登
var _kcTimeKey = 'ext_kick_recover_ts';
var _kickTargetKey = 'ext_kick_recover_role';

function _forceRelogin(targetRoleId) {
    try {
        if (typeof auto_recover === 'undefined' || (auto_recover !== '开' && auto_recover !== true && auto_recover !== 'true')) return;
        var now = Date.now();
        var rid = targetRoleId;
        if (!rid) {
            try { rid = sessionStorage.getItem('ext_this_window_role') || ''; } catch (e) { rid = ''; }
        }
        if (!rid) rid = localStorage.getItem(_kickTargetKey) || '';
        if (!rid) rid = (typeof roleid !== 'undefined' ? roleid : '') || '';
        if (!rid) return;
        localStorage.setItem(_kickTargetKey, String(rid));
        var kcTime = _kcTimeKey + '_' + rid;
        var lastKick = parseInt(localStorage.getItem(kcTime) || '0', 10);
        if (now - lastKick < 30000) return;
        localStorage.setItem(kcTime, String(now));
        localStorage.setItem(_recoverFlagKey, '1');
        _saveReloginContext();
        try { ExtLog.warn('[恢复] 检测到账号被其他设备登录(顶号)，自动刷新重新登录抢回 ' + rid); } catch (e) { }
        location.reload();
    } catch (e) { }
}
unsafeWindow.__extForceRelogin = function (targetRoleId) {
    try { _forceRelogin(targetRoleId); } catch (e) { }
};

// 记录被顶角色
unsafeWindow.__extRecordKickRole = function () {
    try {
        var rid = (typeof roleid !== 'undefined' && roleid) ? String(roleid) : '';
        if (!rid) {
            try { if (typeof Process !== 'undefined' && Process.player) rid = String(Process.player); } catch (e) { }
        }
        if (rid) localStorage.setItem(_kickTargetKey, String(rid));
    } catch (e) { }
};

// 【2026-09-12 软重登清理逻辑已移除】旧"软重登"（清 DOM + 断线续连）已改为刷新式重登，
// 整页重载会自动清空所有 JS/DOM/缓存，故不再需要 _extCleanupSession / messageClearRight 清理。

// 【2026-09-12 刷新式重登】直接刷新页面，刷新后 autoRecoverLogin 自动重登当前角色：
//   ① 记录当前角色 → ② 设自动恢复标记 → ③ location.reload()
unsafeWindow.__extManualRelogin = function () {
    try {
        var rid = (typeof roleid !== 'undefined' && roleid) ? String(roleid) : '';
        if (!rid) {
            try { if (typeof Process !== 'undefined' && Process.player) rid = String(Process.player); } catch (e) { }
        }
        if (rid) localStorage.setItem(_kickTargetKey, String(rid));
        localStorage.setItem(_recoverFlagKey, '1');
        _saveReloginContext();
        try { ExtLog.warn('[重登] 手动刷新重登，正在重新登录...'); } catch (e) { }
        location.reload();
    } catch (e) { }
};

// 遮罩自愈
function _overlaySelfHeal() {
    try {
        if (!GameState || !GameState.connected) return;
        var loader = document.getElementById('loader');
        if (!loader) return;
        if (loader.style.display === 'none' || loader.style.opacity === '0') return;
        var msgEl = document.getElementById('loader_msg');
        var msg = msgEl ? (msgEl.textContent || '') : '';
        if (/正在连接|连接服务|Connecting|connecting/.test(msg)) {
            loader.style.display = 'none';
            loader.style.opacity = '0';
            try { ExtLog.warn('[自愈] 检测到残留连接遮罩，已自动关闭'); } catch (e) { }
        }
    } catch (e) { }
}

// 登录面板残留自愈
function _loginScreenGuard() {
    try {
        if (!GameState || !GameState.connected) return;
        if (!Process || !Process.player) return;
        var $lc = $(".login-content");
        if (!$lc.length || !$lc.is(":visible")) return;
        $lc.stop(true).hide();
        $lc.children().stop(true).hide();
        $(".container").stop(true).show();
        try { ExtLog.warn('[自愈] 登录面板残留（非焦点动画被节流），已强制切换到游戏界面'); } catch (e) { }
    } catch (e) { }
}

// 跨窗口在线心跳
var _hbKey = 'ext_live_roles';
var _hbTimer = null;

function _heartbeatWrite() {
    try {
        _overlaySelfHeal();
        _loginScreenGuard();
        var map = {};
        try { map = JSON.parse(localStorage.getItem(_hbKey) || '{}') || {}; } catch (e) { map = {}; }
        var now = Date.now();
        for (var k in map) {
            if (map.hasOwnProperty(k) && now - (map[k].ts || 0) > 10000) delete map[k];
        }
        var rid = (typeof roleid !== 'undefined') ? String(roleid) : '';
        if (rid) {
            map[rid] = { ts: now, online: !!(GameState && GameState.connected), ws: ws ? ws.readyState : -1 };
            try { sessionStorage.setItem('ext_this_window_role', rid); } catch (e) { }
        }
        localStorage.setItem(_hbKey, JSON.stringify(map));
    } catch (e) { }
}
function _heartbeatStart() {
    if (_hbTimer) return;
    _heartbeatWrite();
    _hbTimer = setInterval(_heartbeatWrite, 2000);
}
function _heartbeatStop() {
    if (_hbTimer) { clearInterval(_hbTimer); _hbTimer = null; }
}
unsafeWindow.__extHeartbeatStart = _heartbeatStart;
unsafeWindow.__extHeartbeatStop = _heartbeatStop;

// 指数退避重连调度
function _scheduleRelogin() {
    clearTimeout(_reloginTimer);
    if (GameState.connected) { _reloginTry = 0; return; }
    if (_reloginTry >= 20) {
        _reloginTry = 0;
        try { if (typeof PushAlert === 'function') PushAlert('relogin_fail', '⚠️ 角色掉线且自动重连失败，正在尝试自动刷新重登'); } catch (e) { }
        _autoRecoverReload();
        return;
    }
    var idx = Math.min(_reloginTry, _reloginDelay.length - 1);
    _reloginTimer = setTimeout(function () {
        if (GameState.connected) { _reloginTry = 0; return; }
        try { SendCommand("score"); } catch (e) { }
        _reloginTry++;
        _scheduleRelogin();
    }, _reloginDelay[idx]);
}