// ============================================================
// wg-combat-extra.js —— 战斗扩展功能
// ------------------------------------------------------------
// collBoss / xiyan / auto_fight / dsj（定时任务）
// zdsell / zduse / formatCurrencyTenThou / gen
// ============================================================
'use strict';

Object.assign(WG, {
    formatCurrencyTenThou: function (num) {
        num = num.toString().replace(/\$|\,/g, '');
        if (isNaN(num)) num = "0";
        var sign = (num == (num = Math.abs(num)));
        num = Math.floor(num * 10 + 0.50000000001);
        num = Math.floor(num / 10).toString();
        for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
            num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
        }
        return (((sign) ? '' : '-') + num);
    },
    gen: function (nl, xg, hg) {
        var jg = nl / 100 + xg * hg / 10;
        var sd = this.formatCurrencyTenThou(jg);
        return sd;
    },

    collBoss: function (data) {
        var c = "<div class=\"item-commands\"><span id = 'closeauto'>关闭自动执行后命令</span></div>";
        messageAppend("自动领取BOSS " + c);
        $('#closeauto').off('click');
        $('#closeauto').on('click', () => {
            if (timer != 0) { clearTimeout(timer); timer = 0; messageAppend("已停止后命令"); } else { messageAppend("已经停止"); }
        });
        WG.SendCmd("stopstate");
        WG.SendCmd("$wait 3000");
        let commands = Array.from({ length: 5 }, () => `events ${data[0]} ok`).join(';');
        WG.SendCmd(commands);
        messageAppend(`<hig>已自动领取boss</hig>`);
        autoBoss = "关";
        GM_setValue(roleid + "_autoBoss", autoBoss);
        messageAppend(`<hiy>已关闭自动领取boss，下次领取前请重新开启</hiy>`);
        timer = setTimeout(() => {
            if (auto_command && auto_command != "" && auto_command != "null") { WG.SendCmd(auto_command); } else { WG.zdwk(); }
            next = 0;
        }, 3000);
    },

    xiyan: async function () {
        var c = "<div class=\"item-commands\"><span id = 'closeauto'>关闭自动执行后命令</span></div>";
        messageAppend("自动喜宴 " + c);
        $('#closeauto').off('click');
        $('#closeauto').on('click', () => {
            if (timer != 0) { clearTimeout(timer); timer = 0; messageAppend("已停止后命令"); } else { messageAppend("已经停止"); }
        });
        WG.SendCmd("stopstate");
        WG.SendCmd("$wait 1000");
        WG.SendCmd("events marry ok");
        timer = setTimeout(() => {
            if (auto_command && auto_command != "" && auto_command != "null") { WG.SendCmd(auto_command); } else { WG.zdwk(); }
            next = 0;
        }, 3000);
    },

    dsj_hook: undefined,
    dsj_func: function () {
        if (WG.dsj_hook) { WG.remove_hook(WG.dsj_hook); }
        messageAppend("已注入定时任务", 1);
        timequestion = GM_getValue(roleid + "_timequestion", timequestion);
        WG.dsj_hook = WG.add_hook("time", (data) => {
            if (data.type == 'time') {
                let i = 0;
                for (let p of timequestion) {
                    if ((p.h == data.h && p.m == data.m && p.s == data.s) ||
                        (p.h == "" && p.m == data.m && p.s == data.s) ||
                        (p.h == "" && p.m == "" && p.s == data.s)) {
                        messageAppend("<hiy>已触发计划" + p.name, 0);
                        WG.SendCmd(p.send);
                        if (p.type == 1) {
                            messageAppend("<hiy>一次性任务,已移除" + p.name, 0);
                            timequestion.baoremove(i);
                            GM_setValue(roleid + "_timequestion", timequestion);
                        }
                    }
                    i = i + 1;
                }
            }
        });
    },

    dsj: function () {
        WG.dsj_func();
        messageClear();
        var html = UI.timeoutui;
        messageAppend(html, 2, null, true);
        $(".startQuest").off('click');
        $(".removeQuest").off('click');
        timequestion = GM_getValue(roleid + "_timequestion", timequestion);
        for (let q of timequestion) {
            let phtml = `<span class='addrun${q.name}'>编辑${q.name}</span><span class='stoprun${q.name}'>删除${q.name}</span><br/>`;
            $('.questlist').append(phtml);
            $("." + `addrun${q.name}`).on("click", () => {
                $("#questname").val(q.name); $("#rtype").val(q.type); $("#ht").val(q.h); $("#mt").val(q.m); $("#st").val(q.s); $("#zml_info").val(q.send);
            });
            $("." + `stoprun${q.name}`).on("click", () => {
                let questname = q.name;
                let i = 0;
                for (let p of timequestion) { if (p.name == questname) { timequestion.baoremove(i); } i = i + 1; }
                GM_setValue(roleid + "_timequestion", timequestion);
                WG.dsj();
            });
        }
        $(".startQuest").on("click", () => {
            let questname = $("#questname").val();
            let type = $("#rtype").val();
            let h = $("#ht").val();
            let m = $("#mt").val();
            let s = $("#st").val();
            let send = $("#zml_info").val();
            questname = questname.replaceAll(" ", "_");
            let item = { "name": questname, "type": type, "send": send, "h": h, "m": m, "s": s };
            let i = 0;
            for (let p of timequestion) {
                if (questname == p.name) { timequestion[i] = item; GM_setValue(roleid + "_timequestion", timequestion); WG.dsj(); return; }
                i = i + 1;
            }
            timequestion.push(item);
            GM_setValue(roleid + "_timequestion", timequestion);
            WG.dsj();
        });
        $(".removeQuest").on("click", () => {
            let questname = $("#questname").val();
            let i = 0;
            for (let p of timequestion) { if (p.name == questname) { timequestion.baoremove(i); return; } i = i + 1; }
            GM_setValue(roleid + "_timequestion", timequestion);
            WG.dsj();
        });
    },

    // 【2026-08-09 移植v1.0.0】自动售卖
    zdsell: async function () {
        if (!autoSellList) { messageAppend("<hig>自动售卖清单为空，请先在设置中填写物品名称</hig>"); return; }
        let names = autoSellList.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s; });
        if (names.length === 0) { messageAppend("<hig>自动售卖清单为空</hig>"); return; }
        let summary = [];
        try {
            let Role = unsafeWindow.Role;
            if (Role && Role.items) {
                let items = Object.values(Role.items);
                names.forEach(function (name) {
                    let groups = {};
                    let patt = new RegExp(name);
                    items.forEach(function (item) {
                        if (item && item.name && patt.test(item.name)) {
                            let fullName = item.name.replace(/<[^>]+>/g, "").trim();
                            groups[fullName] = (groups[fullName] || 0) + parseInt(item.count || 0);
                        }
                    });
                    for (let fullName in groups) { if (groups[fullName] > 0) summary.push(fullName + groups[fullName] + "个"); }
                });
            }
        } catch (e) { summary = []; }
        if (summary.length === 0) { messageAppend("<hig>背包中没有要售卖的物品</hig>"); return; }
        let source = "//~silent\n@cmdDelay 0\npack\n";
        names.forEach(function (name) { source += "[while] {b(" + name + ")}? != null\n    sell {b(" + name + ")}\n    @await 100\n"; });
        if (unsafeWindow && unsafeWindow.ToRaid && unsafeWindow.ToRaid.perform) {
            unsafeWindow.ToRaid.perform(source, "自动售卖", false);
            messageAppend("<hig>自动售卖" + summary.join("、") + "</hig>");
        } else { messageAppend("<hig>未找到 Raid 引擎，无法执行自动售卖</hig>"); }
    },

    // 【2026-08-09 移植v1.0.0】自动使用
    zduse: async function () {
        if (!autoUseList) { messageAppend("<hig>自动使用清单为空，请先在设置中填写物品名称</hig>"); return; }
        let names = autoUseList.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s; });
        if (names.length === 0) { messageAppend("<hig>自动使用清单为空</hig>"); return; }
        let summary = [];
        try {
            let Role = unsafeWindow.Role;
            if (Role && Role.items) {
                let items = Object.values(Role.items);
                names.forEach(function (name) {
                    let groups = {};
                    let patt = new RegExp(name);
                    items.forEach(function (item) {
                        if (item && item.name && patt.test(item.name)) {
                            let fullName = item.name.replace(/<[^>]+>/g, "").trim();
                            groups[fullName] = (groups[fullName] || 0) + parseInt(item.count || 0);
                        }
                    });
                    for (let fullName in groups) { if (groups[fullName] > 0) summary.push(fullName + groups[fullName] + "个"); }
                });
            }
        } catch (e) { summary = []; }
        if (summary.length === 0) { messageAppend("<hig>背包中没有要使用的物品</hig>"); return; }
        let source = "//~silent\n@cmdDelay 0\npack\n";
        names.forEach(function (name) { source += "[while] {b(" + name + ")}? != null\n    use {b(" + name + ")}\n    @await 100\n"; });
        if (unsafeWindow && unsafeWindow.ToRaid && unsafeWindow.ToRaid.perform) {
            unsafeWindow.ToRaid.perform(source, "自动使用", false);
            messageAppend("<hig>自动使用" + summary.join("、") + "</hig>");
        } else { messageAppend("<hig>未找到 Raid 引擎，无法执行自动使用</hig>"); }
    },

    fight_listener: undefined,
    auto_fight: function () {
        if (WG.fight_listener) {
            messageAppend("<hio>自动比试</hio>结束");
            WG.remove_hook(WG.fight_listener);
            WG.fight_listener = undefined;
            return;
        }
        let name = prompt("请输入NPC名称,例如:\"高根明\"");
        let id = WG.find_item(name);
        if (id == null) { messageAppend("没有找到" + name); return; }
        WG.fight_listener = WG.add_hook(["text", "sc", "combat"], async function (data) {
            if (data.type == "combat" && data.end) {
                let item = GameState.items.get(GameState.id);
                if (item.mp / item.max_mp < 0.8) { WG.SendCmd("dazuo"); }
                WG.SendCmd("liaoshang");
            } else if (data.type == "sc" && data.id == id) {
                let item = GameState.items.get(id);
                if (item.hp >= item.max_hp) { WG.Send("stopstate;fight " + id); }
            } else if (data.type == 'sc' && data.id == GameState.id) {
                if (data.hp >= data.max_hp) { WG.Send("stopstate;fight " + id); }
            } else if (data.type == 'text') {
                if (data.msg.indexOf("你先调整好自己的状态再来找别人比试吧") >= 0) { WG.SendCmd("liaoshang"); }
                if (data.msg.indexOf("你想趁人之危吗") >= 0) { WG.SendCmd("dazuo"); }
                if (data.msg.indexOf(">你疗伤完毕，深深吸了口气") >= 0) { WG.Send("stopstate;fight " + id); }
            }
        });
        WG.Send("stopstate;fight " + id);
        messageAppend("<hio>自动比试</hio>开始");
    }
});