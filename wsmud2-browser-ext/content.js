// ============================================================
// content.js —— 扩展的"总入口 / 搬运工"
// ------------------------------------------------------------
// 作用：
//   1. 游戏页面一打开，浏览器就会执行这个文件（见 manifest.json 的 content_scripts）
//   2. 它负责把 ws-js/ 下那 30 多个真正的功能脚本，按【固定顺序】一个个塞进游戏页面
//   3. 还负责"桥接"：扩展弹窗(popup)和游戏页面脚本之间互相传话
//
// 为什么要分两层？
//   扩展脚本分两种运行环境：
//   - content script（本文件）：运行在"隔离世界"，碰不到游戏页面里的变量
//   - 页面脚本（ws-js/*.js）：直接运行在游戏页面里，能改游戏
//   所以 content.js 用 <script> 标签把页面脚本"注入"进游戏页面，让它们直接操作游戏。
//
// 想加/减功能脚本？看下面的 baseScriptFiles 列表，改成你的文件名即可。
// ============================================================

(() => {
    // 【2026-08-17】最先写入版本号到 localStorage（content script 和页面脚本都能访问）
    localStorage.setItem('wsmud_version', chrome.runtime.getManifest().version);

    // 注入 JetBrains Mono 字体（游戏里显示数字/文字用的等宽字体）
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `@font-face {
        font-family: 'JetBrains Mono';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('${chrome.runtime.getURL('ws-data/JetBrainsMono-Regular.woff2')}') format('woff2');
    }`;
    (document.head || document.documentElement).appendChild(fontStyle);

    // 【2026-08-14 CDN 样式本地化】右键菜单 / layer / font-awesome 样式不再走第三方 CDN
    // （CDN 挂掉界面样式即丢失），改为加载扩展本地文件（ws-js/lib/skin/ + ws-js/lib/fonts/）。
    // 注：layer.css 同时会被 layer.js 自加载，重复引用无副作用。
    const localCssFiles = [
        'ws-js/lib/skin/jquery.contextMenu.min.css',
        'ws-js/lib/skin/layer.css',
        'ws-js/lib/skin/font-awesome.css'
    ];
    localCssFiles.forEach((cssPath) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL(cssPath);
        (document.head || document.documentElement).appendChild(link);
    });

    // ============================================================
    // 要加载的自定义脚本列表（按顺序执行，顺序非常重要！）
    // 原版大脚本 Main_pluginss.js 已按模块拆分为以下文件：
    //   基础库 → 数据/工具 → 战斗 → 自动 → 界面 → 功能
    // 后面的脚本可能会用到前面脚本定义的函数，所以不能乱排。
    // ============================================================
    const baseScriptFiles = [
        // --- 基础库：GM 函数模拟、工具函数、第三方库 ---
        "ws-js/core/GM_API.js",           // GM_* 系列函数（存读配置等）
        "ws-js/core/gm-storage.js",     // GM 存储分析工具
        "ws-js/core/logger.js",           // 统一日志工具（ExtLog，无依赖先加载）
        "ws-js/core/utils.js",            // 工具函数（提示音、星级计算、Tab缩进）
        "ws-js/core/raid-syntax.js",      // 流程脚本语法高亮
        "ws-js/core/raid-autocomplete.js", // 流程编辑器自动补全字典
        "ws-js/core/raid-editor.js",      // 流程编辑器（语法高亮+自动补全）
        "ws-js/lib/jQuery.js",            // jQuery 库
        "ws-js/lib/Vue.js",               // Vue 库（触发器界面等用）
        "ws-js/lib/layer.js",             // layer 弹窗库
        "ws-js/lib/jQuery_contextMenu.js",// jQuery 右键菜单库
        "ws-js/lib/store.js",             // 存储库
        // --- 原 Main_pluginss.js 拆分开始 ---
        "ws-js/modules/proto-ext.js",     // 给数组/字符串加小功能
        "ws-js/modules/chat-display.js",  // 聊天显示（彩虹名字等）
        "ws-js/modules/skill-timers.js",  // 技能CD/Buff倒计时
        "ws-js/modules/number-utils.js",  // 数字格式化（万/亿）
        "ws-js/modules/websocket-proxy.js", // 劫持 WebSocket（核心！）
        "ws-js/modules/ws-reconnect.js",  // 断线重连与心跳
        "ws-js/modules/config-vars.js",   // 全局配置项
        "ws-js/modules/config-paths.js",  // 地点路径与寻路数据
        "ws-js/modules/keyboard.js",      // 快捷键
        "ws-js/modules/message-display.js", // 游戏日志输出
        "ws-js/modules/sx-data.js",       // 门派首席信息数据
        "ws-js/modules/wg-core/wg-core-styles.js", // WG 核心样式
        "ws-js/modules/wg-core/wg-core.js",       // 插件主框架
        "ws-js/modules/wg-core/wg-core-login.js", // WG 登录初始化
        "ws-js/modules/wg-combat/wg-combat.js",     // 战斗核心（自动施法基础）
        "ws-js/modules/wg-combat/wg-combat-tidy.js", // 战斗-整理包裹辅助
        "ws-js/modules/wg-combat/wg-combat-auto.js", // 战斗-自动施法核心
        "ws-js/modules/wg-combat/wg-combat-extra.js",// 战斗-扩展功能（领BOSS/喜宴/定时任务）
        "ws-js/modules/wg-auto/wg-auto.js",       // 自动任务/监控（入口 + 发呆检测）
        "ws-js/modules/wg-auto/wg-auto-zml.js",   // 自命令编辑入口
        "ws-js/modules/wg-auto/wg-auto-zml-panel.js", // 自命令面板管理
        "ws-js/modules/wg-auto/wg-auto-zml-edit.js", // 自命令编辑功能
        "ws-js/modules/wg-auto/wg-auto-zml-monitor.js", // 自命令监控功能
        "ws-js/modules/wg-auto/wg-auto-monitor.js", // 自定义监控与妖塔监控
        "ws-js/modules/wg-auto/wg-auto-config.js",  // 配置管理入口
        "ws-js/modules/wg-auto/wg-auto-config-keys.js", // 配置管理-键检测
        "ws-js/modules/wg-auto/wg-auto-config-cloud.js", // 配置管理-云端
        "ws-js/modules/wg-auto/wg-auto-config-local.js", // 配置管理-本地
        "ws-js/modules/wg-auto/wg-auto-settings.js", // 设置面板入口
        "ws-js/modules/wg-auto/wg-auto-settings-ui.js", // 设置面板-UI
        "ws-js/modules/wg-auto/wg-auto-settings-tabs.js", // 设置面板-标签页
        "ws-js/modules/wg-misc/wg-misc.js",       // 杂项功能（中文数字转换、钩子系统）
        "ws-js/modules/wg-misc/wg-misc-buttons.js", // 自定义按钮
        "ws-js/modules/wg-misc/wg-misc-health.js",  // 健康自检/无人值守推送
        "ws-js/modules/wg-misc/wg-misc-msg.js",    // 消息接收处理
        "ws-js/modules/wg-core/wg-equip.js",      // 自动换装功能
        "ws-js/modules/eq-helper-ui.js",  // 换装套装管理界面
        "ws-js/modules/helpers.js",       // 自命令函数库 TaskHelper（核心）
        "ws-js/modules/task-helper-finders.js", // 查找物品/玩家/装备
        "ws-js/modules/task-helper-pfm.js",     // 自动施法/状态监控
        "ws-js/modules/ui.js",            // 界面生成（核心）
        "ws-js/modules/ui-components.js", // UI 自定义组件
        "ws-js/modules/ui-settings.js",   // 系统设置面板
        "ws-js/modules/ui-jinglian.js",   // 精炼滑块控件
        "ws-js/modules/state.js",         // 全局状态 GameState
        "ws-js/modules/global-init.js",   // 数据同步中枢（核心骨架）
        "ws-js/modules/gi-dialog-hooks.js", // GI dialog 钩子处理
        "ws-js/modules/gi-multi-hooks.js",  // GI 多类型消息钩子处理
        "ws-js/modules/gi-text-roles.js",   // GI text+roles 钩子处理
        "ws-js/modules/settings-store.js",// 配置云端存储
        "ws-js/modules/audio-push.js",    // 声音/推送
        "ws-js/modules/keep-alive.js",    // 后台保活（2026-08-10 新增，防挂机延迟）
        "ws-js/modules/main-ready.js",    // 页面就绪启动（右键菜单）
        "ws-js/modules/context-menu.js",  // 右键菜单功能
        // --- 原 Main_pluginss.js 拆分结束 ---
        "ws-js/features/raid-tools.js",   // Raid 工具层
        "ws-js/features/raid-compiler.js", // Raid 编译器+预编译
        "ws-js/features/raid-executor.js", // Raid 代码执行器
        "ws-js/features/raid-system.js",  // Raid 系统库+用户配置
        "ws-js/features/raid-role.js",    // Raid 角色+房间+状态
        "ws-js/features/raid-commands.js", // Raid 命令处理器
        "ws-js/features/raid-dungeons.js", // Raid 副本
        "ws-js/features/raid-server.js",  // Raid 云端
        "ws-js/features/raid-ui.js",      // Raid UI
        "ws-js/features/raid-th.js",      // Raid 桃花岛
        "ws-js/features/raid-shortcuts.js", // Raid 快捷功能
        "ws-js/features/Raid.js",         // Raid 脚本引擎入口
        "ws-js/core/wslogin-crypto.js",   // 一键登录-密码加密
        "ws-js/core/wslogin.js",          // 一键登录-核心
        "ws-js/core/wslogin-ui.js",       // 一键登录-弹窗UI
        "ws-js/core/wslogin-flow.js",     // 一键登录-登录流程
        "ws-js/features/trigger-core-utils.js", // 触发器核心工具
        "ws-js/features/trigger-core-filters.js", // 触发器过滤器
        "ws-js/features/trigger-core-templates.js", // 触发器模板
        "ws-js/features/trigger-core-triggers.js", // 触发器管理
        "ws-js/features/trigger-events-buff.js", // 触发器事件-Buff
        "ws-js/features/trigger-events-chat.js", // 触发器事件-聊天
        "ws-js/features/trigger-events-message.js", // 触发器事件-消息
        "ws-js/features/trigger-events-combat.js", // 触发器事件-战斗
        "ws-js/features/trigger-events-status.js", // 触发器事件-状态
        "ws-js/features/trigger-ui.js",    // 触发器管理界面
        "ws-js/features/trigger-ui-form.js", // 触发器表单
        "ws-js/features/trigger-config.js", // 触发器配置导入导出
        "ws-js/features/Trigger.js",      // 触发器系统入口
        "ws-js/core/login-core.js",       // 登录/选服逻辑
        "ws-js/core/login-methods.js",    // 登录面板方法集
        // --- 原 ws.js 拆分开始 ---
        "ws-js/modules/dialog/dialog-base.js",   // 对话框基座
        "ws-js/modules/dialog/dialog-base-utils.js", // 对话框面板子对象（score/map）
        "ws-js/modules/dialog/dialog-common.js", // 对话框共享工具函数
        "ws-js/modules/dialog/dialog-skills-1.js", // 技能面板（1/3）
        "ws-js/modules/dialog/dialog-skills-2.js", // 技能面板（2/3）
        "ws-js/modules/dialog/dialog-skills-3.js", // 技能面板（3/3）
        "ws-js/modules/dialog/dialog-master.js", // 师父/随从技能面板
        "ws-js/modules/dialog/dialog-pack-1.js", // 背包面板（1/3）
        "ws-js/modules/dialog/dialog-pack-2.js", // 背包面板（2/3）
        "ws-js/modules/dialog/dialog-pack-3.js", // 背包面板（3/3）
        "ws-js/modules/dialog/dialog-pack2.js", // 他人背包面板
        "ws-js/modules/dialog/dialog-trade.js", // 交易面板
        "ws-js/modules/dialog/dialog-list-1.js", // 商店/仓库买卖（1/2）
        "ws-js/modules/dialog/dialog-list-2.js", // 商店/仓库买卖（2/2）
        "ws-js/modules/dialog/dialog-channel.js", // 聊天频道面板
        "ws-js/modules/dialog/dialog-setting-1.js", // 设置面板（1/2）
        "ws-js/modules/dialog/dialog-setting-2.js", // 设置面板（2/2）
        "ws-js/modules/dialog/dialog-tasks.js", // 任务面板
        "ws-js/modules/dialog/dialog-stats-1.js", // 排行榜面板（1/2）
        "ws-js/modules/dialog/dialog-stats-2.js", // 排行榜面板（2/2）
        "ws-js/modules/dialog/dialog-jh-fam.js", // 江湖·门派面板
        "ws-js/modules/dialog/dialog-jh-fb.js", // 江湖·副本面板
        "ws-js/modules/dialog/dialog-jh-ar.js", // 江湖·禁地面板
        "ws-js/modules/dialog/dialog-jh.js", // 江湖面板
        "ws-js/modules/dialog/dialog-shop.js", // 商城面板
        "ws-js/modules/dialog/dialog-message-1.js", // 消息面板（1/2）
        "ws-js/modules/dialog/dialog-message-2.js", // 消息面板（2/2）
        "ws-js/modules/dialog/dialog-relation.js", // 关系面板
        "ws-js/modules/dialog/dialog-party.js", // 帮派面板
        "ws-js/modules/dialog/dialog-team.js", // 队伍面板
        "ws-js/modules/dialog/dialog-events.js", // 活动面板
        "ws-js/modules/dialog/dialog-pm.js", // 拍卖行面板
        "ws-js/modules/dialog/dialog-keys-1.js", // 快捷键面板（1/2）
        "ws-js/modules/dialog/dialog-keys-2.js", // 快捷键面板（2/2）
        "ws-js/modules/dialog/dialog-extend-1.js", // 扩展/触发器（1/4）
        "ws-js/modules/dialog/dialog-extend-2.js", // 扩展/触发器（2/4）
        "ws-js/modules/dialog/dialog-extend-3.js", // 扩展/触发器（3/4）
        "ws-js/modules/dialog/dialog-extend-4.js", // 扩展/触发器（4/4）
        "ws-js/modules/extension-manager.js", // 扩展脚本引擎
        "ws-js/modules/wg-core/wg-setting.js",    // 页面外观/频道设置
        "ws-js/modules/wg-core/wg-confirm.js",    // 通用确认框
        // --- 原 ws.js 拆分开始 ---
        "ws-js/core/ws-utils.js",    // ws 工具函数+存储封装
        "ws-js/core/ws-client.js",   // ws 触摸/原型扩展/WSClient
        "ws-js/core/ws-map.js",      // ws 地图绘制
        "ws-js/core/ws-combat.js",   // ws 战斗面板
        "ws-js/core/ws-process.js",  // ws 消息分发
        "ws-js/core/ws.js"           // 游戏客户端核心（最后加载）
    ];

    // funny2 模块在脚本序列中的插入位置（位于 ui-jinglian.js 之后、state.js 之前）
    // 也就是 baseScriptFiles 的第 56 个位置（下标从 0 数）
    // 包含：funny2-utils（工具函数）、funny2.js（核心）、funny2-settings（设置）、
    //       funny2-layout-core（核心布局）/ funny2-layout-ui（UI元素）/ funny2-layout（入口）、
    //       funny2-auto（自动售卖/使用）
    const FUNNY2_INSERT_INDEX = 56;

    let extensionEnabled = true;  // 插件总开关（popup 里可以关）
    let loadFunny2 = true;         // funny2 脚本开关
    let selectedTheme = "master";  // 界面主题：master 或 fork
    const scriptLoadErrors = [];  // 【2026-08-14】记录加载失败的脚本，全部加载完后在游戏日志区提示

    // ============================================================
    // 【2026-09-05 新版客户端适配】双模式
    // ------------------------------------------------------------
    // 旧模式（默认）：wsmud2.com / wsmud2.cn 首页 —— 扩展"替换客户端"，
    //   屏蔽游戏自带 dist/ws.js，注入扩展自己的整套客户端（含 ws.js / dialog / login 等）。
    // 新模式（newClientMode）：wsmud2.cn/new.html 这类加载 dist_new 客户端的新版页面 ——
    //   新客户端（ES Module 重写版）自己跑：渲染 UI、连接 WebSocket、维护 GameState。
    //   扩展只注入"增强模块"（自动战斗/Raid/触发器/funny2 等），并跳过扩展的
    //   "客户端核心"文件（ws-utils/ws-client/ws-map/ws-combat/ws-process/ws/
    //   login-core/login-methods/wslogin/dialog 面板/state/wg-setting/wg-confirm/
    //   extension-manager/raid-role），避免覆盖新客户端同名的全局。
    //   页面脚本用 window.__extNewClientMode 判断是否新模式（模块据此调整行为）。
    //   注意：newClientMode 必须在 DOMContentLoaded 之后判断 —— document_start 时
    //   <head> 还没解析，querySelector 找不到 dist_new 的 <script> 标签。
    // ============================================================
    function detectNewClientMode() {
        return !!document.querySelector('script[src*="dist_new"]');
    }

    // 新模式要跳过的"客户端核心"文件（保持注入顺序不变，仅做过滤）
    const NEW_CLIENT_EXCLUDES = new Set([
        // --- 扩展自己的整套客户端核心（新客户端已内置同款，再注入会冲突）---
        "ws-js/core/ws-utils.js",
        "ws-js/core/ws-client.js",
        "ws-js/core/ws-map.js",
        "ws-js/core/ws-combat.js",
        "ws-js/core/ws-process.js",
        "ws-js/core/ws.js",
        "ws-js/core/login-core.js",
        "ws-js/core/login-methods.js",
        "ws-js/core/wslogin.js",
        "ws-js/core/wslogin-crypto.js",
        "ws-js/core/wslogin-ui.js",
        "ws-js/core/wslogin-flow.js",
        // --- 对话框面板（新客户端自带 Dialog）---
        "ws-js/modules/dialog/dialog-base.js",
        "ws-js/modules/dialog/dialog-base-utils.js",
        "ws-js/modules/dialog/dialog-common.js",
        "ws-js/modules/dialog/dialog-skills-1.js",
        "ws-js/modules/dialog/dialog-skills-2.js",
        "ws-js/modules/dialog/dialog-skills-3.js",
        "ws-js/modules/dialog/dialog-master.js",
        "ws-js/modules/dialog/dialog-pack-1.js",
        "ws-js/modules/dialog/dialog-pack-2.js",
        "ws-js/modules/dialog/dialog-pack-3.js",
        "ws-js/modules/dialog/dialog-pack2.js",
        "ws-js/modules/dialog/dialog-trade.js",
        "ws-js/modules/dialog/dialog-list-1.js",
        "ws-js/modules/dialog/dialog-list-2.js",
        "ws-js/modules/dialog/dialog-channel.js",
        "ws-js/modules/dialog/dialog-setting-1.js",
        "ws-js/modules/dialog/dialog-setting-2.js",
        "ws-js/modules/dialog/dialog-tasks.js",
        "ws-js/modules/dialog/dialog-stats-1.js",
        "ws-js/modules/dialog/dialog-stats-2.js",
        "ws-js/modules/dialog/dialog-jh-fam.js",
        "ws-js/modules/dialog/dialog-jh-fb.js",
        "ws-js/modules/dialog/dialog-jh-ar.js",
        "ws-js/modules/dialog/dialog-jh.js",
        "ws-js/modules/dialog/dialog-shop.js",
        "ws-js/modules/dialog/dialog-message-1.js",
        "ws-js/modules/dialog/dialog-message-2.js",
        "ws-js/modules/dialog/dialog-relation.js",
        "ws-js/modules/dialog/dialog-party.js",
        "ws-js/modules/dialog/dialog-team.js",
        "ws-js/modules/dialog/dialog-events.js",
        "ws-js/modules/dialog/dialog-pm.js",
        "ws-js/modules/dialog/dialog-keys-1.js",
        "ws-js/modules/dialog/dialog-keys-2.js",
        "ws-js/modules/dialog/dialog-extend-1.js",
        "ws-js/modules/dialog/dialog-extend-2.js",
        "ws-js/modules/dialog/dialog-extend-3.js",
        "ws-js/modules/dialog/dialog-extend-4.js",
        // --- 新客户端已内置同款全局的对象 ---
        // 注意：state.js / raid-role.js 必须保留 —— 扩展大量模块在加载时就引用
        // 全局 GameState / Role / Room（新客户端是登录后才暴露这些全局，加载时还没有），
        // 跳过了会直接 ReferenceError 崩溃（甚至导致登录握手失败）。
        "ws-js/modules/wg-core/wg-setting.js",       // Setting（新客户端自带）
        "ws-js/modules/wg-core/wg-confirm.js",       // Confirm（新客户端自带）
        "ws-js/modules/extension-manager.js"         // SCRIPT（新客户端自带）
    ]);

    // 新模式：给页面脚本打标记（在扩展脚本加载前设置）。
    // 【2026-09-05 修复】直接写 window 属性（content script 与页面脚本共享 window 对象），
    // 不再用注入 <script> 的方式 —— 注入脚本可能因解析时序不执行，导致模块误走旧模式分支。
    function markNewClientMode() {
        try { window.__extNewClientMode = true; } catch (e) { }
    }

    // 按顺序加载自定义脚本（并行抓取 + 按插入顺序执行）
    function loadScriptsInOrder() {
        if (!extensionEnabled) {
            console.log("扩展已禁用，跳过自定义脚本加载");
            return Promise.resolve();
        }

        // DOMContentLoaded 之后判定新模式（此时 <head> 已解析，能查到 dist_new 的 script 标签）
        const newClientMode = detectNewClientMode();
        if (newClientMode) {
            markNewClientMode();
        }

        // 复制一份列表，把 funny2 模块插进去（如果在列表里就加）
        const scriptFiles = (newClientMode
            ? baseScriptFiles.filter((f) => !NEW_CLIENT_EXCLUDES.has(f))
            : baseScriptFiles.slice());
        if (loadFunny2) {
            scriptFiles.splice(FUNNY2_INSERT_INDEX, 0,
                "ws-js/features/funny2-utils.js",
                "ws-js/features/funny2.js",
                "ws-js/features/funny2-settings.js",
                "ws-js/features/funny2-layout-core.js",
                "ws-js/features/funny2-layout-ui.js",
                "ws-js/features/funny2-layout.js",
                "ws-js/features/funny2-auto.js"
            );
        }
        // 【2026-09-05 新版客户端适配】新模式在首位加载补丁脚本：
        // 修补新客户端 Dialog 懒初始化缺陷（直接收到 dialog 数据且面板未打开时 onData 崩溃）。
        // 放在 funny2 之后 splice，避免打乱 funny2 的固定插入位置。
        if (newClientMode) {
            scriptFiles.splice(0, 0, "ws-js/core/newclient-shim.js");
        }
        // 主题脚本：在 funny2 布局之后加载
        if (selectedTheme === "fork") {
            scriptFiles.push("ws-js/themes/theme-fork.js");
        }

        // 【2026-08-17】确保版本号已设置（在加载 GM_API.js 之前）
        return ensureVersionSet().then(() => {
            // 【2026-08-14 性能优化】并行加载：
            // 一次性把全部脚本按【原始顺序】插进 <head>。浏览器会并行抓取所有脚本，
            // 但仍按插入顺序依次执行（动态插入的 classic 脚本，async=false 时规范保证顺序执行，
            // 见 loadScript 中的 script.async = false）。
            // 相比原先"一个下载完才下载下一个"的串行 Promise 链，冷启动耗时明显下降，依赖顺序完全不变。
            const tasks = scriptFiles.map((file) => loadScript(chrome.runtime.getURL(file)));
            return Promise.all(tasks);
        });
    }

    // 加载单个脚本：往页面 <head> 里插一个 <script src=...> 标签
    function loadScript(src) {
        if (!extensionEnabled) return Promise.resolve();

        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = false;   // 【2026-08-14】显式非异步：并行抓取、按插入顺序执行（不抢跑）
            script.onload = () => {           // 加载成功
                console.log("脚本加载成功:", src);
                resolve();
            };
            script.onerror = () => {          // 加载失败
                console.error("脚本加载失败:", src);
                scriptLoadErrors.push(src);   // 【2026-08-14】记录，等全部加载完统一提示
                // 即使失败也 resolve，以继续加载下一个脚本（不让一个失败卡死全部）
                resolve();
            };
            (document.head || document.documentElement).appendChild(script);
        });
    }

    // 【2026-08-17】确保版本号已设置（在加载 GM_API.js 之前，localStorage 已由初始化时写入）
    function ensureVersionSet() {
        const stored = localStorage.getItem('wsmud_version');
        if (!stored) {
            localStorage.setItem('wsmud_version', chrome.runtime.getManifest().version);
        }
        return Promise.resolve();
    }

    // ---------------------------------------------------------------------------
    // 桥接通道：与页面脚本通信以调用 GM_* 等页面上下文函数
    // ---------------------------------------------------------------------------
    // 页面脚本（比如 popup 想调游戏里的函数）不能直接互相调用，
    // 因为一个在"隔离世界"、一个在游戏页面里。
    // 解决办法：用 window.postMessage 互发消息（浏览器原生功能，跨世界传话）。
    // ---------------------------------------------------------------------------

    // 接收页面脚本发起的 openHtmlFile 请求，转发给 background（让它开新标签页）
    // 【2026-08-15 安全加固】与下方 extConfigSync 监听保持一致：校验 event.source === window，
    // 只信本窗口自己的脚本（游戏本体 / 扩展注入脚本），防止第三方 iframe 伪造桥消息触发开页
    window.addEventListener("message", (event) => {
        if (!event.data || !event.data.__EXT_BRIDGE__) return;
        if (event.source !== window) return;
        if (event.data.action !== 'openHtmlFile') return;

        // 转发给后台：后台收到后会新开一个标签页打开"综合工具网页版"
        chrome.runtime.sendMessage({ action: 'openHtmlFile' }, (response) => {
            if (response && response.success) {
                console.log('HTML文件已在新标签页打开');
            } else {
                console.error('打开HTML文件失败:', response?.error || '未知错误');
            }
        });
    });

    // 【2026-08-14 跨窗口同步】页面广播（GM_setValue 里发出）→ 写入 chrome.storage.local 触发跨窗口事件
    window.addEventListener("message", (event) => {
        if (!event.data || !event.data.__EXT_BRIDGE__) return;
        if (event.source !== window) return;
        if (event.data.action !== 'extConfigSync') return;
        const { key, value } = event.data;
        if (!key) return;
        chrome.storage.local.set({ __extCfgSync: { ts: Date.now(), key, value } });
    });

    // 跨窗口同步接收端：其它窗口的 storage.onChanged 触发 → 注入脚本"静默应用"到页面
    // （带抑制标记，接收方写入不再广播，防止循环）
    let extSyncLastTs = 0;
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        const ch = changes.__extCfgSync;
        if (!ch || !ch.newValue) return;
        const { ts, key, value } = ch.newValue;
        if (!key || ts === extSyncLastTs) return;
        extSyncLastTs = ts;
        const script = document.createElement('script');
        script.textContent = `(function(){ try {
            window.__extSyncApplying = true;
            GM_setValue(${JSON.stringify(key)}, ${JSON.stringify(value)});
            // 顺带刷新对应的全局变量（_pushSwitch → pushSwitch 等），即时生效无需刷新页面
            var vname = ${JSON.stringify(key)}.replace(/^_/, '');
            if (typeof window[vname] !== 'undefined') window[vname] = ${JSON.stringify(value)};
            window.__extSyncApplying = false;
        } catch (e) { window.__extSyncApplying = false; } })();`;
        (document.documentElement || document.body).appendChild(script);
        script.parentNode.removeChild(script);
    });

    // ---------------------------------------------------------------------------
    // 消息处理：来自扩展其它部分（如 popup 弹窗）的消息
    // ---------------------------------------------------------------------------
    function handleMessages(message, sender, sendResponse) {
        // 【2026-08-11 安全最佳实践】校验消息来源：只处理本扩展自身的消息
        // （sender.id 是发送方扩展 ID，外部扩展/页面伪装调用会被忽略，防止被恶意控制）
        if (sender && sender.id && sender.id !== chrome.runtime.id) {
            return;
        }
        // ① 更新插件总开关状态（popup 里点开关时触发）
        if (message.action === "updateExtensionStatus") {
            extensionEnabled = message.enabled;
            console.log("扩展状态更新为:", extensionEnabled ? "启用" : "禁用");
            return;
        }

        // ② 更新 funny2 加载开关（popup 里点开关时触发）
        if (message.action === 'updateLoadFunny2') {
            loadFunny2 = !!message.enabled;
            console.log('loadFunny2 set to', loadFunny2);

            if (loadFunny2 && extensionEnabled) {
                // 从"关"变"开"：立即把 funny2 模块注入进去（不用刷新页面）
                var funny2Scripts = [
                    'ws-js/features/funny2-utils.js',
                    'ws-js/features/funny2.js',
                    'ws-js/features/funny2-settings.js',
                    'ws-js/features/funny2-layout-core.js',
                    'ws-js/features/funny2-layout-ui.js',
                    'ws-js/features/funny2-layout.js',
                    'ws-js/features/funny2-auto.js',
                ];
                Promise.all(funny2Scripts.map(function (s) {
                    return loadScript(chrome.runtime.getURL(s));
                }))
                    .then(function () {
                        console.log('动态加载 funny2 模块完成');
                        sendResponse({ success: true });
                    })
                    .catch(function (err) {
                        console.error('动态加载 funny2 模块失败', err);
                        sendResponse({ success: false, error: String(err) });
                    });
                return true;  // 返回 true = 异步回复，告诉 Chrome"我等会再回话"
            }

            // 从"开"变"关"：已经注入的脚本没办法卸载，只能让用户刷新页面
            sendResponse({ success: true, message: 'disabled_requires_reload' });
            return;
        }

        // ③ 更新主题设置（popup 里切换主题时触发，或 storage 变化时跨标签页同步）
        if (message.action === 'updateTheme') {
            applyTheme(message.theme || 'master');
            sendResponse({ success: true });
            return;
        }

        // ④ 导出配置（popup 点"导出"时触发）：把游戏 localStorage 全部打包成 JSON
        if (message.action === 'GM_export') {
            try {
                const data = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    data[key] = localStorage.getItem(key);
                }
                // 【2026-08-14 安全提示】导出的数据里若含一键登录账号（含可解密的密码），
                // 回传标记让 popup 弹窗警示用户妥善保管，避免备份文件泄露账号
                const hasAccountData = Object.prototype.hasOwnProperty.call(data, 'mud_game_account_data');
                sendResponse({ success: true, data: JSON.stringify(data, null, 2), hasAccountData });
            } catch (err) {
                sendResponse({ success: false, error: String(err) });
            }
            return true;
        }

        // ⑤ 导入配置（popup 点"导入"时触发）：把 JSON 写回游戏 localStorage
        // 【2026-08-14 安全警示】配置里可能包含"可执行/自动操作"的键（登录后执行命令、自命令、
        // 触发器、定时任务、扩展脚本等）——导入别人给的配置 = 可能执行别人的命令。
        // 检测到这类键且未确认（force 标记）时不写入，要求用户确认来源后重发。
        if (message.action === 'GM_import') {
            try {
                const payload = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                if (payload && typeof payload === 'object') {
                    // 可执行/自动操作键检测：结尾匹配即视为"含可执行内容"
                    const execKeys = Object.keys(payload).filter((k) =>
                        /(loginhml|zml|ztjk|timequestion|zdy_btnlist|TriggerData|extends)$/i.test(k) ||
                        /(^|@)flow_store@/.test(k) || /(^|@)global_params@/.test(k)
                    );
                    if (execKeys.length > 0 && !message.force) {
                        sendResponse({ success: false, requiresConfirm: true, keys: execKeys.slice(0, 10) });
                        return true;
                    }
                    for (const k in payload) {
                        try {
                            localStorage.setItem(k, payload[k]);
                        } catch (e) {
                            console.error('localStorage.setItem failed for key', k, e);
                        }
                    }
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'invalid_payload' });
                }
            } catch (err) {
                sendResponse({ success: false, error: String(err) });
            }
            return true;
        }
    }

    // ---------------------------------------------------------------------------
    // 初始化
    // ---------------------------------------------------------------------------
    // 从扩展存储里读出上次的开关状态（popup 里设置的），然后开始加载脚本
    chrome.storage.local.get(["extensionEnabled", "loadFunny2", "selectedTheme"], (result) => {
        extensionEnabled = result.extensionEnabled !== false;   // 默认开
        loadFunny2 = result.loadFunny2 !== false;               // 默认开
        selectedTheme = result.selectedTheme || "master";       // 默认 master

        const startLoading = () => {
            loadScriptsInOrder()
                .then(() => {
                    if (extensionEnabled) console.log("所有自定义脚本按顺序加载完成");
                    // 【2026-08-14】有脚本加载失败 → 往游戏日志区提示（此时 messageAppend 已就绪，挂机也能一眼看到）
                    if (scriptLoadErrors.length > 0) {
                        const errScript = document.createElement('script');
                        errScript.textContent = `(function(){ try {
                            if (typeof messageAppend !== 'function') return;
                            var list = ${JSON.stringify(scriptLoadErrors)};
                            for (var i = 0; i < list.length; i++) {
                                messageAppend('<hir>⚠️ 插件脚本加载失败：' + list[i] + '，相关功能可能缺失，建议刷新页面重试</hir>', 1);
                            }
                        } catch (e) { } })();`;
                        (document.head || document.documentElement).appendChild(errScript);
                        errScript.parentNode.removeChild(errScript);
                    }
                })
                .catch((err) => {
                    console.error("脚本加载过程中出现错误:", err);
                });
        };

        // 等页面准备就绪再开始加载（太早的话 <head> 可能还不存在）
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", startLoading);
        } else {
            startLoading();
        }
    });

    // 主题切换通用函数（供 message handler 和 storage.onChanged 共用）
    var _lastTheme = null;
    function applyTheme(theme) {
        theme = theme || 'master';
        if (theme === _lastTheme) return; // 防重复（当前标签页会收到 message + storage 两次）
        _lastTheme = theme;
        selectedTheme = theme;
        console.log('selectedTheme set to', selectedTheme);
        localStorage.setItem('wsmud_theme', selectedTheme);
        window.postMessage({ __EXT_BRIDGE__: true, action: 'themeChanged', theme: selectedTheme }, '*');
        if (selectedTheme === 'fork') {
            loadScript(chrome.runtime.getURL('ws-js/themes/theme-fork.js'));
        }
    }

    // 监听 storage 变化：popup 在任意标签页中切换主题时，所有标签页同步生效
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.selectedTheme) {
            applyTheme(changes.selectedTheme.newValue || 'master');
        }
    });

    // 注册消息监听，popup 给本脚本发消息时会走到 handleMessages
    chrome.runtime.onMessage.addListener(handleMessages);
})();
