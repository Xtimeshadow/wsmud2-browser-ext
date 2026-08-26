// ============================================================
// dialog-panels.js —— 对话框面板加载器
// ------------------------------------------------------------
// 原大文件（4641 行）已拆分为以下子文件，按依赖顺序排列。
// content.js 中已替换为逐个加载这些子文件。
// 本文件保留仅作占位/文档用途，不再包含实际面板代码。
// ============================================================
// 拆分清单（按 content.js 加载顺序）：
//
//   共享工具函数：
//     dialog-common.js          — checkScroll, level_desc, wrap_name, moneyToStr, format_time_span
//
//   Dialog.skills（3 部分）：
//     dialog-skills-1.js       — isShow ~ format_books（属性/方法前半）
//     dialog-skills-2.js       — onData ~ skill_levels（属性/方法后半）
//     dialog-skills-3.js       — item_click, _bindCalc
//
//   Dialog.master：
//     dialog-master.js         — 师父/随从技能面板
//
//   Dialog.pack（3 部分）：
//     dialog-pack-1.js         — close ~ updateitem（属性/方法前半）
//     dialog-pack-2.js         — get_item ~ createItems（属性/方法中段）
//     dialog-pack-3.js         — create_eqs ~ item_cleanup（属性/方法后半）
//
//   Dialog.pack2：
//     dialog-pack2.js          — 他人背包面板
//
//   独立面板（单文件）：
//     dialog-trade.js          — 交易面板
//     dialog-list-1.js         — 商店/仓库买卖（第一部分）
//     dialog-list-2.js         — 商店/仓库买卖（第二部分）
//     dialog-channel.js        — 聊天频道面板
//     dialog-setting-1.js      — 设置面板（第一部分）
//     dialog-setting-2.js      — 设置面板（第二部分）
//     dialog-tasks.js          — 任务面板
//     dialog-stats-1.js        — 排行榜面板（第一部分）
//     dialog-stats-2.js        — 排行榜面板（第二部分）
//     dialog-jh-fam.js         — 江湖·门派面板
//     dialog-jh-fb.js          — 江湖·副本面板
//     dialog-jh-ar.js          — 江湖·禁地面板
//     dialog-jh.js             — 江湖面板（门派/副本/禁地导航）
//     dialog-shop.js           — 商城面板
//     dialog-message-1.js      — 消息面板（第一部分）
//     dialog-message-2.js      — 消息面板（第二部分）
//     dialog-relation.js       — 关系面板（夫妻/师徒/家人）
//     dialog-party.js          — 帮派面板
//     dialog-team.js           — 队伍面板
//     dialog-events.js         — 活动面板
//     dialog-pm.js             — 拍卖行面板
//     dialog-keys-1.js         — 快捷键面板（第一部分）
//     dialog-keys-2.js         — 快捷键面板（第二部分）
//     dialog-extend-1.js       — 自定义扩展/触发器（第一部分）
//     dialog-extend-2.js       — 自定义扩展/触发器（第二部分）
//     dialog-extend-3.js       — 自定义扩展/触发器（第三部分）
//     dialog-extend-4.js       — 自定义扩展/触发器（第四部分）+ Dialog.friend + Dialog.pay
//     dialog-friend.js         — 好友面板（已合入 extend-4）
//     dialog-pay.js            — 支付面板（已合入 extend-4）
// ============================================================
// 注意：此文件不再包含实际面板代码。
// 如需修改面板内容，请编辑对应的 dialog-*.js 子文件。
// ============================================================