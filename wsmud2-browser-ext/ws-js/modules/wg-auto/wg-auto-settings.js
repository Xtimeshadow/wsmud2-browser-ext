// ============================================================
// wg-auto-settings.js —— 设置面板（入口模块）
// ------------------------------------------------------------
//   从 wg-auto.js 拆分而来
//   本文件仅保留 setting() 入口，实际实现在 ui/tabs 子模块
//   子模块：
//     wg-auto-settings-ui.js   —— _settingUI()  弹窗创建
//     wg-auto-settings-tabs.js  —— _settingBindings() / _settingDisplay()
// ============================================================
'use strict';

Object.assign(WG, {
    setting: function () {
        // 【2026-08-09 改造】独立弹窗：不再打开游戏自带设置对话框、不再塞进 .dialog-extend
        if ($("#ext-setting-mask").length) return;   // 已打开则不重复
        $("#ext-setting-mask").remove();
        // 调用子模块方法
        WG._settingUI();
        WG._settingBindings();
        WG._settingDisplay();
    }
});