// ============================================================
// wg-misc-health.js —— 健康自检 / 无人值守推送
// ------------------------------------------------------------
// 从 wg-misc.js 拆分出的独立模块。
// 包含：挂机健康自检（DOM 节点/消息队列/存储占用）、
//       无人值守推送（长时间无消息 → 推送告警）。
// 这些是全局函数，不挂载到 WG 对象上。
// ============================================================
'use strict';


// 【2026-08-13 挂机健康自检】每 5 分钟兜底检查页面卡顿隐患（不干预游戏本身，只处理扩展可控项）
// ① 消息队列积压 > 500 条 → 强制渲染（防内存堆积）② 日志超长 → 主动裁剪（追加路径也会触发，这里兜底）
// ③ 页面 DOM 节点超 25000 → 首次提示建议刷新（不自动删游戏节点，避免误伤）
// ④ 配置存储超 5MB 的 85% → 首次提示用「扫描孤儿键」清理
var _HEALTH_INTERVAL = 300000;   // 5 分钟
var _DOM_WARN = 25000;           // DOM 节点告警阈值
var _DOM_RECOVER = 15000;        // 低于此值才允许再次告警
var _Q_WARN = 500;               // 消息队列积压告警阈值
function extHealthCheck() {
    try {
        // ① 消息队列积压 → 强制 flush
        var qTotal = 0;
        if (typeof _msgQ === 'object' && _msgQ) {
            for (var a in _msgQ) qTotal += (_msgQ[a] ? _msgQ[a].length : 0);
            if (qTotal > _Q_WARN) { try { _flushMsgQ(); } catch (e) { } }
        }
        // ② 日志超长 → 主动裁剪（_trimLogIfNeeded 本身有阈值判断）
        try { if (typeof _trimLogIfNeeded === 'function') _trimLogIfNeeded(); } catch (e) { }
        // ③ DOM 节点总量超限 → 首次提示
        try {
            var domCount = document.querySelectorAll('*').length;
            if (domCount > _DOM_WARN) {
                if (!_hcWarnedDom) {
                    _hcWarnedDom = true;
                    messageAppend("<hiy>⚠️ 页面节点已达 " + domCount + " 个，浏览器可能开始变卡。建议刷新游戏页面，或点日志区「清除日志」减少占用</hiy>");
                    try { ExtLog.warn('[健康] DOM 节点 ' + domCount + ' 超限，建议刷新页面'); } catch (e) { }
                }
            } else if (domCount < _DOM_RECOVER) {
                _hcWarnedDom = false;   // 恢复后可再次告警
            }
        } catch (e) { }
        // ④ 存储占用超限 → 首次提示
        try {
            if (typeof GM_storageReport === 'function') {
                var rep = GM_storageReport();
                var MB = 5 * 1024 * 1024;
                if (rep.totalBytes > MB * 0.85) {
                    if (!_hcWarnedStorage) {
                        _hcWarnedStorage = true;
                        messageAppend("<hiy>⚠️ 配置存储占用 " + (rep.totalBytes / 1024 / 1024).toFixed(2) + "MB，接近 5MB 上限。建议设置→系统→「扫描孤儿键」清理残留</hiy>");
                        try { ExtLog.warn('[健康] 存储占用 ' + (rep.totalBytes / 1024 / 1024).toFixed(2) + 'MB 超限'); } catch (e) { }
                    }
                } else {
                    _hcWarnedStorage = false;
                }
            }
        } catch (e) { }
    } catch (e) { }
}
// 启动健康自检（幂等）
function extHealthStart() {
    if (_healthTimer) return;
    _healthTimer = setInterval(extHealthCheck, _HEALTH_INTERVAL);
}
// 停止健康自检（关开关时调用）
function extHealthStop() {
    if (_healthTimer) { clearInterval(_healthTimer); _healthTimer = null; }
}

// 【2026-08-13 无人值守推送】定时检查：长时间收不到任何游戏消息 → 推送"疑似卡死/断线"
// 恢复后（重新有消息）推送"已恢复"。依赖 PushAlert（推送总开关未开则静默）。
function extIdleMonitor() {
    try {
        if (typeof pushSwitch === 'undefined' || (pushSwitch != '开' && pushSwitch !== true && pushSwitch !== 'true')) return;
        if (!_lastMsgTime) { _lastMsgTime = Date.now(); return; }   // 还没收到过消息（登录中）→ 忽略
        var idleMin = (Date.now() - _lastMsgTime) / 60000;
        if (idleMin >= _PUSH_IDLE_MINUTES) {
            if (!_idleWarned) {
                _idleWarned = true;
                try { if (typeof PushAlert === 'function') PushAlert('idle', '⚠️ 已 ' + Math.floor(idleMin) + ' 分钟未收到任何游戏消息，疑似卡死或断线'); } catch (e) { }
            }
        } else if (_idleWarned && idleMin <= _PUSH_IDLE_MINUTES / 2) {
            _idleWarned = false;
            try { if (typeof PushAlert === 'function') PushAlert('idle_recover', '✅ 游戏消息已恢复，挂机正常'); } catch (e) { }
        }
    } catch (e) { }
}
// 启动无消息监控（幂等，每分钟检查一次）
function extIdleStart() {
    if (_pushIdleTimer) return;
    _pushIdleTimer = setInterval(extIdleMonitor, 60000);
}