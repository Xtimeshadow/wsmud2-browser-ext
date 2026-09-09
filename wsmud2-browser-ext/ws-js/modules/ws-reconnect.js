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

// 【2026-09-07 附加清理】随软重登一并清理游戏各区域的累积 DOM/缓存，减少长期挂机的内存增长：
//   ① 聊天频道：清 DOM 渲染（MessageQueue.clear）＋ 清按频道缓存数组（Dialog.channel.datas）
//      —— 只清 DOM 不够：切频道时 footerChanged 会从 datas 重放，消息会"重新出现"
//   ② 主消息流：同上清 DOM（战斗/物品/系统文本，事件驱动挂机不受影响）
//   ③ 地图缓存（MAP.Buffer 纯 JS 内存，下次进图自动重新拉取）
//   注意：.room_items 房间物品列表不清 —— 自动拾取点选依赖它，且游戏每次进房会重建，不会累积
function _extCleanupSession() {
    try {
        // ① 聊天频道：清按频道缓存 + 清当前渲染 DOM
        if (typeof Dialog !== 'undefined' && Dialog.channel && Array.isArray(Dialog.channel.datas)) {
            Dialog.channel.datas.length = 0;
        }
        // ② 主消息流：优先用游戏自带清理（多分页 pre 一次清干净），失败再手动清文本兜底
        var msgCleared = false;
        if (typeof Process !== 'undefined' && Process.channel && typeof Process.channel.clear === 'function') {
            Process.channel.clear();
            msgCleared = true;
        }
        if (!msgCleared) {
            var chBox = document.querySelector('.channel');
            if (chBox) {
                var chPres = chBox.querySelectorAll('pre');
                for (var i = 0; i < chPres.length; i++) chPres[i].textContent = '';
            }
        }
        // ③ 主消息流 content-message：同上
        var cmCleared = false;
        if (typeof Process !== 'undefined' && Process.message && typeof Process.message.clear === 'function') {
            Process.message.clear();
            cmCleared = true;
        }
        if (!cmCleared) {
            var cmBox = document.querySelector('.content-message');
            if (cmBox) {
                var cmPres = cmBox.querySelectorAll('pre');
                for (var j = 0; j < cmPres.length; j++) cmPres[j].textContent = '';
            }
        }
        // ④ 地图缓存：释放 MAP.Buffer 纯 JS 内存，下次进图自动重新拉取
        if (typeof MAP !== 'undefined' && MAP && MAP.Buffer) {
            for (var k in MAP.Buffer) {
                if (MAP.Buffer.hasOwnProperty(k)) delete MAP.Buffer[k];
            }
        }
    } catch (e) { }
}

// 【2026-09-07 软重登】不刷新页面，1 秒内完成重登：
//   ① 清空各区域累积 DOM/缓存（左右日志 + 聊天频道 + 主消息流 + 地图缓存）
//   ② 断开 WebSocket → 游戏侧自动重建连接并续连当前角色（免重新登录）
//   ③ 启动重连调度兜底（退避重试，失败则按 auto_recover 自动刷新重登）
//   相比 location.reload()：不再丢失挂机任务状态/计时器/自命令流程
unsafeWindow.__extManualRelogin = function () {
    try {
        // 1) 清理各区域累积 DOM/缓存，减少节点
        try { if (typeof messageClear === 'function') messageClear(); } catch (e) { }
        try { if (typeof messageClearRight === 'function') messageClearRight(); } catch (e) { }
        try { _extCleanupSession(); } catch (e) { }
        // 2) 断开当前连接，游戏侧收到断线后会自动重建并续连当前角色
        try { if (typeof unsafeWindow.__extCloseWs === 'function') unsafeWindow.__extCloseWs(); } catch (e) { }
        // 3) 等 onclose 处理完（约 400ms）再启动重连调度：退避重试 + 失败自动刷新兜底
        _reloginTry = 0;
        setTimeout(function () {
            try { _scheduleRelogin(); } catch (e) { }
        }, 400);
    } catch (e) { }
};

// 跨窗口在线心跳
var _hbKey = 'ext_live_roles';
var _hbTimer = null;

function _heartbeatWrite() {
    try {
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