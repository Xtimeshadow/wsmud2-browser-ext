// ============================================================
// Trigger.js —— 触发器系统·入口
// ------------------------------------------------------------
// 把"游戏事件 → 条件 → 自动执行"做成可视化配置：
//   用户选一个事件模板（如"血低于 30%"、"收到某频道聊天"），
//   填过滤条件，再写要执行的 Raid 流程源码，
//   之后每次事件发生且条件满足，就会自动执行那段流程。
//
// 对外接口（挂在全局）：
//   TriggerCenter  触发器管理（create/modify/remove/activate/getAll 等）
//   TriggerUI      触发器管理界面
//   TriggerConfig  触发器配置导入导出
//
// 内部机制：NotificationCenter（发布/订阅）+ MonitorCenter
//   （每个事件类型注册一个 WG.add_hook 监听，游戏事件来了广播通知）。
//
// 支持的事件类型：Buff 变化、聊天信息、人物刷新、物品拾取、
//   新提示、社交消息、活动事件、战斗/死亡状态、时辰（定时）、
//   技能释放/冷却结束、气血内力变化、伤害 等 16 类。
//
// 想改：某事件的默认过滤条件、模板简介文字、触发时的提示语 → 在本文件搜索。
//
// 子模块（按加载顺序）：
//   trigger-core.js    核心类（通知中心、监控中心、过滤器、触发器模板与中心）
//   trigger-events.js  游戏事件绑定（12 种 WSMUD 事件钩子）
//   trigger-ui.js      管理界面（Vue 弹窗、列表、编辑表单）
//   trigger-config.js  配置导入导出 + 初始化（__init__）
// ============================================================
(function () {
    'use strict';

    // 子模块已由 content.js 按顺序加载为独立脚本，
    // 所有内部变量（NotificationCenter、MonitorCenter、TriggerCenter、
    // TriggerTemplateCenter、UI、TriggerConfig 等）均在全局作用域中共享。
    // 本 IIFE 作为触发器系统的入口包装器，确保模块加载顺序正确。
    // 初始化逻辑由 trigger-config.js 中的 __init__() 完成。
})();