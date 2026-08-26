// ============================================================
// wg-auto-zml.js —— 自命令编辑与快捷操作栏（入口模块）
// ------------------------------------------------------------
//   从 wg-auto.js 拆分而来
//   本文件仅保留入口，实际实现在以下子模块：
//     wg-auto-zml-panel.js  —— 面板管理（_zmlOpenView / _zmlInitMain 等）
//     wg-auto-zml-edit.js   —— 自命令编辑（_zmlInitZmlEdit / zml_edit / zml_showp）
//     wg-auto-zml-monitor.js —— 自定义监控（_zmlInitZtjkEdit / zmlztjk）
// ============================================================
'use strict';
// 实际实现在子模块中，通过 Object.assign(WG, { ... }) 注入