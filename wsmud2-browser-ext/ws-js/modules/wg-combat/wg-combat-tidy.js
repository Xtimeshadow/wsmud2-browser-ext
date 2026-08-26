// ============================================================
// wg-combat-tidy.js —— @tidyBag 整理包裹辅助函数
// ------------------------------------------------------------
// 提供 WG 上的整理包裹相关方法，供 Raid 引擎 @tidyBag 指令调用。
// ============================================================
'use strict';

Object.assign(WG, {
    // 【2026-08-24】取清单里"背包中实际存在"的物品全名（去颜色标签、去重），用于分步进度提示。
    _tidyPresentNames: function (listStr) {
        const names = String(listStr || "").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s; });
        const result = [];
        try {
            const items = (unsafeWindow.Role && unsafeWindow.Role.items) ? Object.values(unsafeWindow.Role.items) : [];
            names.forEach(function (n) {
                const patt = new RegExp(n);
                items.forEach(function (it) {
                    if (it && it.name && patt.test(it.name)) {
                        const full = String(it.name).replace(/<[^>]+>/g, "").trim();
                        if (full && result.indexOf(full) == -1) result.push(full);
                    }
                });
            });
        } catch (e) { }
        return result;
    },

    // 【2026-08-24 增强 @tidyBag】自动使用（阻塞式）：
    tidyBlockUse: function (stepLog) {
        return new Promise(function (resolve) {
            const names = (autoUseList || "").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s; });
            const present = WG._tidyPresentNames(autoUseList);
            if (present.length === 0) { try { if (stepLog) stepLog("当前无需自动使用"); } catch (e) { } resolve(); return; }
            try { if (stepLog) stepLog("自动使用：" + present.join("、")); } catch (e) { }
            let source = "//~silent\n@cmdDelay 0\npack\n";
            names.forEach(function (name) {
                source += "[while] {b(" + name + ")}? != null\n    use {b(" + name + ")}\n    @await 100\n";
            });
            if (!(unsafeWindow && unsafeWindow.ToRaid && unsafeWindow.ToRaid.perform)) { resolve(); return; }
            unsafeWindow.ToRaid.perform(source, "自动使用(整理包裹)", false);
            const start = Date.now();
            (function poll() {
                let allGone = names.every(function (n) {
                    try { return unsafeWindow.Role.findItem(n, true) == null; } catch (e) { return true; }
                });
                if (allGone || Date.now() - start >= 20000) { resolve(); return; }
                setTimeout(poll, 600);
            }());
        });
    },

    // 【2026-08-24 增强 @tidyBag】收集需分解的物品列表
    _tidyFenjieItemList: function () {
        const list = [];
        try {
            const fjlist = (GM_getValue(roleid + "_fenjieList") || "").split(",");
            const pack = (GameState.packs && GameState.packs.items) ? GameState.packs.items : [];
            for (let i = 0; i < fjlist.length; i++) {
                const item = fjlist[i].trim();
                if (!item) continue;
                const match = item.match(/^([\u4e00-\u9fa5]+)(\d*)$|^(\d+)$/);
                const name = match && match[3] ? null : (match ? match[1] || null : null);
                const grade = match ? (match[3] || match[2] || null) : null;
                for (let j = 0; j < pack.length; j++) {
                    const p = pack[j];
                    if (!p || !p.can_eq || p.locked) continue;
                    const nameMatch = name ? (p.name ? String(p.name).indexOf(name) != -1 : false) : true;
                    const gradeMatch = grade ? (p.grade == grade) : true;
                    if (nameMatch && gradeMatch) list.push({ id: p.id, name: p.name ? String(p.name).replace(/<[^>]+>/g, "").trim() : "" });
                }
            }
        } catch (e) { }
        return list;
    },

    // 【2026-08-24 修复】随从逐件分解
    tidyDecomposeFollower: function (items, names, stepLog) {
        return new Promise(function (resolve) {
            const fname = fj_sc || "";
            if (!fname || !items || items.length === 0) { resolve(); return; }
            const nameText = (names && names.length) ? names.join("、") : (items.length + "件装备");
            try { if (stepLog) stepLog("随从" + fname + "逐件分解：" + nameText); } catch (e) { }
            const fworkEl = (GameState.relation.follower || []).find(function (i) { return i && i[0] && String(i[0]).indexOf(fname) != -1; });
            const fworkCmd = (fworkEl && fworkEl[2]) ? `dc {r${fname}} ${fworkEl[2]};` : "";
            let idx = 0, moving = false, moveTimer = null, finished = false, hookId = null;

            const finish = function () {
                if (finished) return;
                finished = true;
                if (hookId != null) { try { WG.remove_hook(hookId); } catch (e) { } }
                if (moveTimer) clearTimeout(moveTimer);
                if (fworkCmd) WG.SendCmd(fworkCmd);
                try { if (stepLog) stepLog("随从分解结束"); } catch (e) { }
                resolve();
            };
            const next = function () {
                if (moveTimer) { clearTimeout(moveTimer); moveTimer = null; }
                if (idx >= items.length) { finish(); return; }
                const it = items[idx]; idx++;
                moving = true;
                WG.SendCmd(`give {r${fname}} ${it.id};dc {r${fname}} fenjie ${it.id};`);
                moveTimer = WG._tapSched(function () { moving = false; next(); }, 2000);
            };
            hookId = WG.add_hook("text", function (data) {
                if (finished || !moving) return;
                const m = (data && data.msg) ? String(data.msg) : "";
                if (m.indexOf(fname) == -1) return;
                if (m.indexOf("分解为") != -1) { moving = false; next(); return; }
                if (m.indexOf("正在") != -1 || m.indexOf("没时间这么做") != -1 || m.indexOf("要给出") != -1 || m.indexOf("要分解") != -1) { moving = false; next(); }
            });
            WG.SendCmd(`goto home;go northeast;$wait 200;dc {r${fname}} stopstate;`);
            WG._tapSched(function () { next(); }, 2500);
        });
    },

    // 【2026-08-24 增强 @tidyBag】自动售卖（阻塞式）
    tidyBlockSell: function (stepLog) {
        return new Promise(function (resolve) {
            const names = (autoSellList || "").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s; });
            const present = WG._tidyPresentNames(autoSellList);
            if (present.length === 0) { try { if (stepLog) stepLog("当前无需按清单售卖"); } catch (e) { } resolve(); return; }
            try { if (stepLog) stepLog("按清单售卖：" + present.join("、")); } catch (e) { }
            let source = "//~silent\n@cmdDelay 0\npack\n";
            names.forEach(function (name) {
                source += "[while] {b(" + name + ")}? != null\n    sell {b(" + name + ")}\n    @await 100\n";
            });
            if (!(unsafeWindow && unsafeWindow.ToRaid && unsafeWindow.ToRaid.perform)) { resolve(); return; }
            unsafeWindow.ToRaid.perform(source, "自动售卖(整理包裹)", false);
            const start = Date.now();
            (function poll() {
                let allGone = names.every(function (n) {
                    try { return unsafeWindow.Role.findItem(n, true) == null; } catch (e) { return true; }
                });
                if (allGone || Date.now() - start >= 15000) { resolve(); return; }
                setTimeout(poll, 600);
            }());
        });
    },

    // 【2026-08-24 增强 @tidyBag】发送分解命令并阻塞
    tidyBlockFenjie: function (stepLog) {
        return new Promise(function (resolve) {
            const usedFollower = follower_fenjie == '开' || follower_fenjie === true || follower_fenjie === 'true';
            const items = WG._tidyFenjieItemList();
            const names = items.map(function (it) { return it.name; }).filter(function (n) { return n; });
            if (items.length === 0) { try { if (stepLog) stepLog("当前无需分解装备"); } catch (e) { } resolve(); return; }
            if (usedFollower) {
                WG.tidyDecomposeFollower(items, names, stepLog).then(resolve);
                return;
            }
            try { if (stepLog) stepLog("分解装备：" + names.join("、")); } catch (e) { }
            let cmd = "";
            items.forEach(function (it) { cmd += `fenjie ${it.id};$wait 400;`; });
            WG.SendCmd(cmd);
            const start = Date.now();
            (function poll() {
                let free = true;
                try { free = !!(unsafeWindow.Role && unsafeWindow.Role.isFree()); } catch (e) { free = true; }
                if (free || Date.now() - start >= 30000) { resolve(); return; }
                setTimeout(poll, 600);
            }());
        });
    }
});