// ============================================================
// global-init.js —— 数据同步中枢（核心骨架）
// ------------------------------------------------------------
// 游戏服务器下发的每条消息，都会先经过这里解析，然后：
//   1. 刷新到全局 GameState（房间/背包/属性/技能/状态）
//   2. 触发各种自动化：自动当铺购买、领喜宴、领 BOSS、分解杂物、
//      战斗统计、每日任务完成提醒、背包满提醒、屏蔽 NPC 等
//
// 钩子回调已拆分至：
//   gi-dialog-hooks.js  → dialog 消息处理
//   gi-multi-hooks.js   → 多类型消息处理（login/exits/room/items/...）
//   gi-text-roles.js    → text 文本 + roles 角色列表处理
// ============================================================
// global-init.js
// GI global init: hooks and data sync
'use strict';

// 【2026-08-14 性能优化】去掉物品/角色名里的 HTML 颜色标签（如 <HIR>）
// 原实现每次 `$('<body>'+name+'</body>').text()` 都要临时造一个 DOM 节点，
// 进房间/刷物品时高频调用会反复触发 DOM 创建回收；改用正则 + 实体解码，语义等价且快得多。
// 注意：&nbsp; 与 jQuery .text() 一致保留为不换行空格（\u00a0），避免影响下游按普通空格拆分名字的逻辑。
function _plainName(s) {
    return String(s)
        .replace(/<[^>]*>/g, '')                                   // 去掉 <xxx> 标签
        .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, function (m) {  // HTML 实体单遍解码（同 .text() 行为）
            switch (m) {
                case '&amp;': return '&';
                case '&lt;': return '<';
                case '&gt;': return '>';
                case '&quot;': return '"';
                case '&#39;': return "'";
                case '&nbsp;': return '\u00a0';
                default: return m;
            }
        })
        .trim();
}

//GlobalInit
var GlobalInit = {
    gcdThread: null,
    init: function () {
        WG.add_hook("dialog", function (data) {
            GlobalInit.handleDialog(data);
        });

        WG.add_hook(["status", "login", "exits", "room", "items", "itemadd", "itemremove", "sc", "text", "state", "msg", "perform", "clearDistime", "dispfm", "combat", "die"], function (data) {
            GlobalInit.handleMultiType(data);
        });

        WG.add_hook('text', function (data) {
            GlobalInit.handleText(data);
        });

        WG.add_hook("roles", function (data) {
            GlobalInit.handleRoles(data);
        });
    },
    configInit: function () {
        family = GM_getValue(roleid + "_family", family);
        automarry = GM_getValue(roleid + "_automarry", automarry);
        autoBoss = GM_getValue(roleid + "_autoBoss", autoBoss);
        BossName = GM_getValue(roleid + "_BossName", BossName);
        onekey_fenjie = GM_getValue(roleid + "_onekey_fenjie", onekey_fenjie);
        follower_fenjie = GM_getValue(roleid + "_follower_fenjie", follower_fenjie);
        fj_sc = GM_getValue(roleid + "_fj_sc", fj_sc);
        fenjieList = GM_getValue(roleid + "_fenjieList", fenjieList);
        eqgroup = GM_getValue(roleid + "_eqgroup", eqgroup);
        skgroup = GM_getValue(roleid + "_skgroup", skgroup);
        if (family == null) {
            family = $('.role-list .select').text().substr(0, 2)
        }
        unauto_pfm = GM_getValue(roleid + "_unauto_pfm", unauto_pfm);
        auto_pfmswitch = GM_getValue(roleid + "_auto_pfmswitch", auto_pfmswitch);
        auto_pfm_mode = GM_getValue(roleid + "_auto_pfm_mode", auto_pfm_mode);
        busy_info = GM_getValue(roleid + "_busy_info", busy_info);
        buffCD = GM_getValue(roleid + "_buffCD", buffCD);
        skillCD = GM_getValue(roleid + "_skillCD", skillCD);
        skillCDColor = GM_getValue(roleid + "_skillCDColor", skillCDColor);
        buffCDColor = GM_getValue(roleid + "_buffCDColor", buffCDColor);
        saveAddr = GM_getValue(roleid + "_saveAddr", saveAddr);
        auto_relogin = GM_getValue(roleid + "_auto_relogin", auto_relogin);
        auto_recover = GM_getValue(roleid + "_auto_recover", auto_recover);
        rainbow_name = GM_getValue(roleid + "_rainbow_name", rainbow_name);
        getitemShow = GM_getValue(roleid + "_getitemShow", getitemShow);
        merge_item_display = GM_getValue(roleid + "_merge_item_display", merge_item_display);
        zml = GM_getValue(roleid + "_zml", zml);
        ztjk_item = GM_getValue(roleid + "_ztjk", ztjk_item);
        auto_command = GM_getValue(roleid + "_auto_command", auto_command);
        var unpfm = unauto_pfm.split(',');
        for (var pfmname of unpfm) {
            if (pfmname) blackpfm.push(pfmname)
        }
        die_str = GM_getValue(roleid + "_die_str", die_str);
        autowork = GM_getValue(roleid + "_autowork", autowork);
        custom_dock = GM_getValue(roleid + "_custom_dock", custom_dock);
        shieldswitch = GM_getValue("_shieldswitch", shieldswitch);
        shield = GM_getValue("_shield", shield);
        shieldkey = GM_getValue("_shieldkey", shieldkey);
        loginhml = GM_getValue(roleid + "_loginhml", loginhml);
        timequestion = GM_getValue(roleid + "_timequestion", timequestion);
        dpssakada = GM_getValue(roleid + "_dpssakada", dpssakada);
        funnycalc = GM_getValue(roleid + "_funnycalc", funnycalc);
        keepalive = GM_getValue("_keepalive", keepalive);
        ext_sync_global = GM_getValue("_ext_sync_global", ext_sync_global);
        window.__extConfigSyncOn = (ext_sync_global == "开" || ext_sync_global === true || ext_sync_global === 'true');
        autoBuyList = GM_getValue(roleid + "_autoBuyList", autoBuyList);
        autoSellList = GM_getValue(roleid + "_autoSellList", autoSellList);
        autoUseList = GM_getValue(roleid + "_autoUseList", autoUseList);
        zdyskilllist = GM_getValue(roleid + "_zdyskilllist", zdyskilllist);
        zdyskills = GM_getValue(roleid + "_zdyskills", zdyskills);
        pushSwitch = GM_getValue(roleid + "_pushSwitch", pushSwitch);
        pushType = GM_getValue(roleid + "_pushType", pushType);
        pushToken = GM_getValue(roleid + "_pushToken", pushToken);
        color_select = GM_getValue("color_select", color_select);
        auto_buy_talisman = GM_getValue(roleid + "_auto_buy_talisman", auto_buy_talisman);
        event_poll_interval = parseInt(GM_getValue(roleid + "_event_poll_interval", event_poll_interval)) || 1;
        healthcheck_enabled = GM_getValue(roleid + "_healthcheck_enabled", healthcheck_enabled);
        try { if (healthcheck_enabled && typeof extHealthStart === 'function') extHealthStart(); } catch (e) { }
        try { if (typeof extIdleStart === 'function') extIdleStart(); } catch (e) { }
        try { if (typeof idleCmdStart === 'function') idleCmdStart(); } catch (e) { }
        WG.zdy_btnListInit();
        try {
            var today = new Date();
            var todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
            if (GM_getValue("ext_backup_date", "") != todayStr && WG.backup_config) {
                if (WG.backup_config(true)) { GM_setValue("ext_backup_date", todayStr); }
            }
        } catch (e) { }
        try { GlobalInit.restartEventPolling(); } catch (e) { }
    },
    // 【2026-08-13 移植作者 26.2】重启活动轮询定时器（设置改动间隔后立即生效）
    restartEventPolling: function () {
        if (_eventPollTimer) {
            clearInterval(_eventPollTimer);
            _eventPollTimer = null;
        }
        var interval = parseInt(event_poll_interval) || 1;
        if (interval < 1) interval = 1;
        _eventPollTimer = setInterval(function () {
            if (typeof WG !== 'undefined' && WG.SendCmd) {
                WG.SendCmd("events");
            }
        }, interval * 60000);
    }
};