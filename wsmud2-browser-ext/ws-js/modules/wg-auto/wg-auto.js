// ============================================================
// wg-auto.js —— 自动任务与状态监控（模块入口）
// ------------------------------------------------------------
// 子模块（需通过 content.js 依次加载）：
//   wg-auto-zml.js      自命令编辑与快捷操作栏
//   wg-auto-monitor.js  自定义监控与妖塔监控
//   wg-auto-config.js   配置管理（上传/下载/备份/恢复/清理）
//   wg-auto-settings.js 设置面板
// ============================================================
'use strict';

// 发呆检测：定时检查角色发呆状态，超过阈值时执行自定义命令
function idleCmdStart() {
    if (_idleCmdTimer) { clearInterval(_idleCmdTimer); _idleCmdTimer = null; }
    if (_idleCmdSwitch != '开' && _idleCmdSwitch !== true && _idleCmdSwitch !== 'true') return;
    _idleCmdTimer = setInterval(function () {
        try {
            if (typeof Role === 'undefined' || !Role.isIdle) return;
            if (!Role.isIdle()) { _idleCmdFired = false; return; }
            var idleSec = Role.getIdleTime();
            if (idleSec >= _idleCmdSeconds && !_idleCmdFired) {
                _idleCmdFired = true;
                if (_idleCmdContent && _idleCmdContent.trim()) {
                    if (typeof ToRaid !== 'undefined' && ToRaid.perform) {
                        ToRaid.perform(_idleCmdContent.trim(), "发呆触发");
                    } else if (typeof SendCommand === 'function') {
                        SendCommand(_idleCmdContent.trim());
                    }
                } else {
                    try { if (typeof PushAlert === 'function') PushAlert('idle_cmd', '⏰ 角色已发呆', 60 * 1000); } catch (e) { }
                }
            }
        } catch (e) { console.error("[idleCmd]", e); }
    }, 5000);
}