// ============================================================
// wg-auto-config-local.js —— 本地配置备份/恢复/清理
// ------------------------------------------------------------
//   从 wg-auto-config.js 拆分而来
//   包含：backup_config, restore_config,
//         clear_local_login, clear_role_data, reset_default
// ============================================================
'use strict';

Object.assign(WG, {
    // 【2026-08-11 本地自动备份】备份当前角色配置（含触发器/流程/持久变量），不依赖云端服务器
    // silent=true 为每日自动备份（不弹提示）；false 为手动点击（弹提示）
    backup_config: function (silent) {
        var rid = (unsafeWindow && unsafeWindow.Role && unsafeWindow.Role.id) || roleid;
        if (!rid) {
            if (!silent) LayerHelper.msg("备份失败：未获取到角色 ID，请重新登录后重试");
            return false;
        }
        var data = {};
        var keys = GM_listValues();
        keys.forEach(function (key) {
            if (key.indexOf(rid) >= 0) data[key] = GM_getValue(key);
        });
        // 全局设置
        ['_shieldswitch', '_shield', '_shieldkey', '_idleCmdSwitch', '_idleCmdSeconds', '_idleCmdContent'].forEach(function (k) {
            try { data[k] = GM_getValue(k, null); } catch (e) { }
        });
        // 触发器/流程/持久变量（键名：角色ID@triggers / flow_store@角色ID / global_params@角色ID）
        try {
            var trigVal = GM_getValue(rid + "@triggers", null);
            if (trigVal != null) data[rid + "@triggers"] = trigVal;
            var flowVal = GM_getValue("flow_store@" + rid, null);
            if (flowVal != null) data["flow_store@" + rid] = flowVal;
            var gpVal = GM_getValue("global_params@" + rid, null);
            if (gpVal != null) data["global_params@" + rid] = gpVal;
        } catch (e) { }
        try {
            GM_setValue("ext_config_backup", { time: Date.now(), data: data });
            // 【2026-08-11 存储诊断】备份后顺带只读检查：接近上限或疑似孤儿键 → 控制台报告（不删任何数据）
            try {
                if (typeof GM_storageReport === 'function') {
                    var rep = GM_storageReport();
                    var MB = 5 * 1024 * 1024;
                    if (rep.totalBytes > MB * 0.85) {
                        ExtLog.warn('[存储] 配置占用 ' + (rep.totalBytes / 1024 / 1024).toFixed(2) + 'MB（约 5MB 上限 85%），建议清理或导出备份');
                    }
                    if (rep.orphans.length > 0) {
                        ExtLog.warn('[存储] 发现 ' + rep.orphans.length + ' 个疑似孤儿键（可能含游戏自身键，未删除）：' + rep.orphans.slice(0, 10).map(function (o) { return o.key; }).join(', '));
                    }
                }
            } catch (e3) { }
            if (!silent) LayerHelper.msg("已备份配置");
            return true;
        } catch (e) {
            ExtLog.error("配置备份失败:", e);
            if (!silent) LayerHelper.msg("备份失败：存储空间不足，请先导出配置清理");
            return false;
        }
    },
    // 【2026-08-11 恢复本地备份】从 ext_config_backup 写回全部配置并刷新
    restore_config: function () {
        var backup = GM_getValue("ext_config_backup", null);
        if (!backup || !backup.data) {
            LayerHelper.msg("没有可恢复的备份");
            return;
        }
        var t = backup.time ? new Date(backup.time).toLocaleString() : "未知时间";
        if (!confirm("确定从备份恢复配置吗？\n备份时间：" + t + "\n将覆盖当前角色设置、触发器和流程。")) return;
        var data = backup.data;
        for (var k in data) {
            GM_setValue(k, data[k]);
        }
        // 刷新内存缓存（触发器需 reload 重新加载）
        try {
            if (unsafeWindow && unsafeWindow.TriggerCenter && unsafeWindow.TriggerCenter.reload) {
                unsafeWindow.TriggerCenter.reload();
            }
        } catch (e) { }
        try { GlobalInit.configInit(); } catch (e) { }
        LayerHelper.msg("已从备份恢复（" + t + "）");
    },
    // 【2026-08-23 本地清理】清除本地的"一键登录账号密码库"及登录残留。
    // 目的：本机/别人拿到扩展存储时，不会有可还原的账号密码可被读取/上传。
    // 只删本地 localStorage 的登录器账号数据，不影响游戏内角色配置、触发器、流程。
    clear_local_login: function () {
        if (!confirm("确定清除本地的【一键登录账号密码库】吗？\n将删除本机保存的所有用于一键登录的账号和密码（mud_game_account_data）、上次登录名。\n之后一键登录弹窗需重新手动添加账号。\n继续？")) return;
        var removed = [];
        var removedNote = "";
        try {
            var data = localStorage.getItem("mud_game_account_data");
            if (data) { localStorage.removeItem("mud_game_account_data"); removed.push("账号密码库"); removedNote += ("（含 " + Object.keys(JSON.parse(data)).length + " 个账号）"); }
        } catch (e) { }
        try {
            if (localStorage.getItem("login_name") != null) { localStorage.removeItem("login_name"); removed.push("上次登录名"); }
        } catch (e) { }
        if (removed.length > 0) {
            LayerHelper.msg("已清除本地登录信息：" + removed.join("、") + removedNote + "，刷新后生效");
        } else {
            LayerHelper.msg("本地没有可清除的登录账号数据");
        }
    },
    // 【2026-08-23 彻底清理】删除指定角色的全部配置数据：角色设置、自命令、监控、触发器、流程、持久变量，
    // 以及 localStorage 中该角色的游戏设置。只针对目标角色，不影响其他角色/账号。
    // roleId：可选。传入则删除该指定角色；不传则删除当前登录角色。
    // silent：true 时跳过确认弹窗（供"删除整个账号"批量调用，避免每个角色都弹一次）。
    clear_role_data: function (roleId, silent) {
        var rid = roleId || (unsafeWindow && unsafeWindow.Role && unsafeWindow.Role.id) || roleid;
        if (!rid) { LayerHelper.msg("未获取到角色ID，无法删除"); return; }
        if (!silent) {
            if (!confirm("确定彻底删除角色 [" + rid + "] 的全部配置数据吗？\n将删除该角色的：自命令、自定义监控、触发器、Raid流程、持久变量、角色设置、游戏设置。\n此操作不可恢复。\n仅针对该角色，不影响其他账号。\n继续？")) return;
        }
        var gmDel = 0, gmReserve = 0;
        // 1) GM 键：删除当前角色专属的所有键（{rid}@ / {rid}_ / flow_store@{rid} / global_params@{rid} / ###CodeTranslator@{rid}）
        var keys = GM_listValues();
        keys.forEach(function (key) {
            if (!WG._isKeyOfRole(key, rid)) return;
            try { GM_deleteValue(key); gmDel++; } catch (e) { gmReserve++; }
        });
        // 2) localStorage 游戏设置：删除该角色相关键（key 以 rid@/rid_ 开头，或 __LS__ 前缀对应项）
        //    仅删除明显属于本角色的游戏本地键，绝不动 mud_game_account_data 等登录敏感键
        var lsDel = 0;
        try {
            for (var li = localStorage.length - 1; li >= 0; li--) {
                var lk = localStorage.key(li);
                if (!lk) continue;
                if (WG._isSensitiveLsKey(lk)) continue;          // 跳过 cookie/session/账号库
                var raw = lk;
                if (raw.indexOf("__LS__") === 0) raw = raw.substring(6);
                if (WG._isKeyOfRole(raw, rid)) { try { localStorage.removeItem(lk); lsDel++; } catch (e) { } }
            }
        } catch (e) { }
        // 3) 刷新内存配置
        try { GlobalInit.configInit(); } catch (e) { }
        try { if (unsafeWindow && unsafeWindow.TriggerCenter && unsafeWindow.TriggerCenter.reload) unsafeWindow.TriggerCenter.reload(); } catch (e) { }
        LayerHelper.msg("已删除当前角色配置（GM " + gmDel + " 项，localStorage " + lsDel + " 项，保留 " + gmReserve + " 项），重新登录后完全生效");
    },
    reset_default: function () {
        // 【2026-08-09 移植v1.0.0】恢复默认：仅重置当前角色设置，保留自命令/自定义监控/Raid流程/触发器
        if (!confirm("确定恢复当前角色的所有设置到默认值？\n此操作不会删除自命令、触发器和Raid流程。")) return;
        let keys = GM_listValues();
        let count = 0;
        keys.forEach(key => {
            // 只处理当前角色前缀的键
            if (key.indexOf(roleid) !== 0) return;
            // 保留自命令（roleid_zml）、自定义监控（roleid_ztjk）
            if (key.indexOf(roleid + "_zml") === 0) return;
            if (key.indexOf(roleid + "_ztjk") === 0) return;
            GM_deleteValue(key);
            count++;
        });
        GlobalInit.configInit();
        LayerHelper.msg("已恢复默认（清除 " + count + " 项），部分设置刷新后生效");
    }
});