// funny2-layout.js
// 武神传说 MUD 界面布局：三栏布局、快捷按钮、频道切换、角色信息面板等
// 入口文件，拆分后由子模块提供具体实现：
//   funny2-layout-core.js — 核心布局初始化（三栏布局、样式、频道标签、角色信息面板结构）
//   funny2-layout-ui.js   — UI 元素（辅助函数、快捷按钮、换组/扩展等）
"use strict";

window.__funny2_layout = window.__funny2_layout || {};

(function () {
    var layout = window.__funny2_layout;

    layout.init = function () {
        var F = window.__funny2;
        if (F.isMoblie) return;

        // 核心布局（由 funny2-layout-core.js 提供）
        this.initLayoutBody();
        this.initRightColumn();
        this.initLeftColumn();
        this.initLeftContent();

        // UI 元素（由 funny2-layout-ui.js 提供）
        this.initUI();
    };

    // 布局模块全部加载完成后，DOM ready 时自动初始化
    $(document).ready(function () {
        if (typeof window.__funny2_layout !== 'undefined') {
            window.__funny2_layout.init();
        }
    });
})();