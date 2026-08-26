// ============================================================
// wg-combat-auto.js —— 自动施法核心
// ------------------------------------------------------------
// auto_preform 自动施法循环（智能模式 + 普通模式）
// Web Worker 后台计时源（_tapCreate / _tapSched / _tapSleep / _tapDestroy）
// 状态判断：is_free, switchReversal, auto_preform_switch
// ============================================================
'use strict';

Object.assign(WG, {
    forcebufskil: '',
    bufskill: {},
    xubuf: null,
    pfmskill: null,
    cds: new Map(),
    preform_timer: undefined,

    is_free: function () {
        if (WG.hasStr("faint", GameState.selfStatus) || WG.hasStr("busy", GameState.selfStatus) || WG.hasStr("rash", GameState.selfStatus) || WG.hasStr("bss", GameState.selfStatus)) {
            return false;
        }
        return true;
    },

    // 后台标签页安全的计时源（Web Worker 驱动）
    _tapCreate: function () {
        if (WG._tap) { try { WG._tapDestroy(); } catch (e) { } }
        try {
            const src = "setInterval(function(){postMessage(0);},50);";
            const url = URL.createObjectURL(new Blob([src], { type: "application/javascript" }));
            const worker = new Worker(url);
            let queue = [];
            worker.onmessage = function () {
                const now = Date.now();
                for (let i = 0; i < queue.length; i++) {
                    const item = queue[i];
                    if (item && item.t <= now) { queue[i] = null; try { item.fn(); } catch (e) { } }
                }
                if (queue.length) queue = queue.filter(Boolean);
            };
            WG._tap = {
                worker: worker, url: url,
                sched: function (fn, ms) { const item = { t: Date.now() + (ms | 0), fn: fn }; queue.push(item); return item; },
                sleep: function (ms) { return new Promise(function (res) { WG._tap.sched(function () { res(); }, ms); }); },
                destroy: function () { try { worker.terminate(); } catch (e) { } try { URL.revokeObjectURL(url); } catch (e) { } queue.length = 0; WG._tap = null; }
            };
        } catch (e) { WG._tap = null; }
    },
    _tapSched: function (fn, ms) {
        if (WG._tap && WG._tap.sched) return WG._tap.sched(fn, ms);
        return setTimeout(fn, ms);
    },
    _tapSleep: function (ms) {
        if (WG._tap && WG._tap.sleep) return WG._tap.sleep(ms);
        return new Promise(function (res) { setTimeout(res, ms); });
    },
    _tapDestroy: function () {
        if (WG._tap && WG._tap.destroy) WG._tap.destroy();
    },

    switchReversal: function (e) {
        let p = e.hasClass("on");
        return p ? "关" : "开";
    },

    auto_preform_switch: function () {
        if (auto_pfmswitch == "开" || auto_pfmswitch === true || auto_pfmswitch === 'true') {
            auto_pfmswitch = "关";
            messageAppend("<hio>自动施法</hio>关闭");
            WG.auto_preform("stop");
        } else {
            auto_pfmswitch = "开";
            messageAppend("<hio>自动施法</hio>开启");
            WG.auto_preform();
        }
        WG.auto_perform_button();
    },

    auto_preform: function (v) {
        if (v == "stop") {
            GameState.selfStatus = [];
            WG.xubuf = null;
            WG.pfmskill = null;
            if (WG.preform_timer) {
                try { WG._tapDestroy(); } catch (e) { }
                WG.preform_timer = undefined;
                $(".auto_perform").css("background", "");
                WG.forcebufskil = '';
                WG.bufskill = {};
            }
            return;
        }
        if (WG.preform_timer || auto_pfmswitch == "关" || auto_pfmswitch === false || auto_pfmswitch === 'false') return;
        $(".auto_perform").css("background", "#3E0000");
        unauto_pfm = GM_getValue(roleid + "_unauto_pfm", unauto_pfm);
        var unpfm = unauto_pfm.split(',');
        for (var pfmname of unpfm) {
            if (!WG.hasStr(pfmname, blackpfm)) blackpfm.push(pfmname);
        }
        if (!WG.hasStr("force.tuoli", blackpfm)) { blackpfm.push('force.tuoli'); }

        if (auto_pfm_mode == "开" || auto_pfm_mode === true || auto_pfm_mode === 'true') {
            // ---- 智能施法模式 ----
            let force_buff_skill = ['force.cui', 'force.power', 'force.xi', 'force.xin', 'force.chu', 'force.ztd', 'force.zhen', 'force.busi', 'force.wang'];
            let buff_skill_dict = {
                "weapon": ['sword.wu', 'blade.shi', 'sword.yu'],
                "ztd": ["force.ztd"], "mingyu": ["force.wang"], "force": ["*"],
                "dodge": ["dodge.power", "dodge.fo", "dodge.gui", "dodge.lingbo", "dodge.zhui"]
            };
            WG.xubuf = null;
            WG.pfmskill = null;
            WG._tapCreate();
            WG.preform_timer = true;
            const _smartTick = function () {
                if (GameState.fight.in_fight == false) { WG.auto_preform("stop"); return; }
                if (WG.xubuf == null) {
                    WG.xubuf = WG._tapSched(async () => {
                        for (var skill of GameState.skills.perform) {
                            if (WG.hasStr(skill.id, blackpfm)) continue;
                            for (let buf in buff_skill_dict) {
                                for (let ski of buff_skill_dict[buf]) {
                                    if (ski == skill.id) {
                                        if (!WG.gcd && !WG.cds.get(skill.id)?.iscd && !WG.hasStr(buf, GameState.selfStatus)) {
                                            WG.Send("perform " + skill.id);
                                            WG._tapSched(function () { var _c = WG.cds.get(skill.id); if (_c && _c.iscd && _c.distime === 601) { WG.cds.set(skill.id, { iscd: false, distime: 0 }); } }, 750);
                                            await WG._tapSleep(200);
                                            while (!WG.cds.get(skill.id)?.iscd) {
                                                if (GameState.fight.in_fight == false) { WG.auto_preform("stop"); return; }
                                                if (!WG.is_free()) break;
                                                WG.Send("perform " + skill.id);
                                                WG._tapSched(function () { var _c = WG.cds.get(skill.id); if (_c && _c.iscd && _c.distime === 601) { WG.cds.set(skill.id, { iscd: false, distime: 0 }); } }, 750);
                                                await WG._tapSleep(200);
                                            }
                                            if (WG.hasStr(buf, GameState.selfStatus)) { WG.bufskill[buf] = skill.id; }
                                        }
                                        break;
                                    }
                                }
                            }
                            if (WG.hasStr(skill.id, force_buff_skill)) {
                                if (!WG.gcd && !WG.cds.get(skill.id)?.iscd && !WG.hasStr("force", GameState.selfStatus)) {
                                    WG.Send("perform " + skill.id);
                                    WG._tapSched(function () { var _c = WG.cds.get(skill.id); if (_c && _c.iscd && _c.distime === 601) { WG.cds.set(skill.id, { iscd: false, distime: 0 }); } }, 750);
                                    await WG._tapSleep(200);
                                    while (!WG.cds.get(skill.id)?.iscd && !WG.hasStr("force", GameState.selfStatus)) {
                                        if (GameState.fight.in_fight == false) { WG.auto_preform("stop"); return; }
                                        if (!WG.is_free()) break;
                                        WG.Send("perform " + skill.id);
                                        WG._tapSched(function () { var _c = WG.cds.get(skill.id); if (_c && _c.iscd && _c.distime === 601) { WG.cds.set(skill.id, { iscd: false, distime: 0 }); } }, 750);
                                        await WG._tapSleep(200);
                                    }
                                    if (WG.hasStr("force", GameState.selfStatus)) { WG.forcebufskil = skill.id; }
                                }
                            }
                        }
                        WG.xubuf = null;
                    }, 10);
                }
                if (WG.pfmskill == null) {
                    WG.pfmskill = WG._tapSched(async () => {
                        for (var skill of GameState.skills.perform) {
                            if (WG.hasStr(skill.id, blackpfm)) continue;
                            if (WG.gcd) break;
                            if (!WG.gcd && !WG.cds.get(skill.id)?.iscd && !(WG.hasStr(skill.id, force_buff_skill) || WG.hasStr(skill.id, buff_skill_dict))) {
                                WG.Send("perform " + skill.id);
                                WG._tapSched(function () { var _c = WG.cds.get(skill.id); if (_c && _c.iscd && _c.distime === 601) { WG.cds.set(skill.id, { iscd: false, distime: 0 }); } }, 750);
                                break;
                            }
                            if (WG.forcebufskil != '') {
                                if (!WG.gcd && !WG.cds.get(skill.id)?.iscd && WG.hasStr(skill.id, force_buff_skill) && skill.id != WG.forcebufskil &&
                                    !WG.hasStr(skill.id, buff_skill_dict['mingyu']) && !WG.hasStr(skill.id, buff_skill_dict['ztd'])) {
                                    WG.Send("perform " + skill.id);
                                    WG._tapSched(function () { var _c = WG.cds.get(skill.id); if (_c && _c.iscd && _c.distime === 601) { WG.cds.set(skill.id, { iscd: false, distime: 0 }); } }, 750);
                                    if (!WG.is_free()) break;
                                }
                            }
                            WG._tapSched(function () { var _c = WG.cds.get(skill.id); if (_c && _c.iscd && _c.distime === 601) { WG.cds.set(skill.id, { iscd: false, distime: 0 }); } }, 750);
                        }
                        WG.pfmskill = null;
                    }, 10);
                }
            };
            (function schedSmart() { WG._tapSched(function () { if (!WG.preform_timer) return; _smartTick(); schedSmart(); }, 300); })();
        } else {
            // ---- 普通施法模式 ----
            WG._tapCreate();
            WG.preform_timer = true;
            const _normalTick = function () {
                if (GameState.fight.in_fight == false) WG.auto_preform("stop");
                for (var skill of GameState.skills.perform) {
                    if (WG.inArray(skill.id, blackpfm)) continue;
                    if (!WG.gcd && !WG.cds.get(skill.id)?.iscd) {
                        WG.Send("perform " + skill.id);
                        WG._tapSched(function () { var _c = WG.cds.get(skill.id); if (_c && _c.iscd && _c.distime === 601) { WG.cds.set(skill.id, { iscd: false, distime: 0 }); } }, 750);
                        break;
                    }
                }
            };
            (function schedNormal() { WG._tapSched(function () { if (!WG.preform_timer) return; _normalTick(); schedNormal(); }, 350); })();
        }
    }
});