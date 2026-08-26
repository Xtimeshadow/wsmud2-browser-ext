// ============================================================
// wg-combat.js —— 战斗执行核心（核心骨架）
// ------------------------------------------------------------
// 插件"打架"的全部逻辑都在这里：
//   WG.Send / WG.SendCmd   指令解析与发送（支持 $等待、{r物品名}、T.函数 等语法）
//   go / at / kill_all / get_all / zdwk  寻路/杀怪/挂机
//   recover / clean_dps    血蓝回复 / DPS 统计
//
// 功能已拆分至：
//   wg-combat-tidy.js  → @tidyBag 整理包裹辅助函数
//   wg-combat-auto.js  → 自动施法（auto_preform / _tapCreate 等）
//   wg-combat-extra.js → collBoss / xiyan / auto_fight / dsj / zdsell / zduse
// ============================================================
'use strict';

// 【2026-08-14 安全优化】自命令 T.xxx 直接函数分发（替代 eval，防注入）
function TaskHelper_call(fnName, idx, arg, cmds) {
    try {
        if (!fnName || !Object.prototype.hasOwnProperty.call(TaskHelper, fnName) || typeof TaskHelper[fnName] !== 'function') {
            console.warn('[WSMUD] SendCmd 未知的自命令函数 T.' + fnName + '，已跳过');
            return;
        }
        TaskHelper[fnName](idx, arg, cmds);
    } catch (e) {
        console.error('[WSMUD] SendCmd T.' + fnName + ' 执行出错:', e);
    }
}

Object.assign(WG, {
    clean_data: function () {
        messageClear();
        let html = UI.cleandataui();
        messageAppend(html, 2, null, true);
        $(".dps").off('click'); $(".getjy").off('click'); $(".getitem").off('click');
        $(".dps").on("click", function () { WG.clean_dps(); messageAppend("清空成功"); });
        $(".getjy").on("click", function () { expGained = 0; potGained = 0; messageAppend("清空成功"); });
        $(".getitem").on("click", function () { for (let key in itemTotalCount) { delete itemTotalCount[key]; } messageAppend("清空成功"); });
    },
    clean_dps: function () {
        if (dpsLocked && battleStartTime != 0) {
            let allpfmnum = normalHitCount + critHitCount;
            let alldps = normalDamageTotal + critDamageTotal;
            let battle_t = (new Date().getTime() - battleStartTime.getTime()) / 1000;
            let real_dps = Math.ceil(alldps / battle_t);
            let real_act = allpfmnum / battle_t;
            if (battle_t < 1) { real_dps = Math.ceil(alldps); real_act = allpfmnum; }
            setTimeout(() => {
                messageAppend(`<hiw>⚔️战斗过程分析:\n⏱️战斗时长:<hir>${battle_t}秒</hir>\n⚔️普通攻击:<hir>${normalHitCount}次</hir>\n⚔️普通伤害:<hir>${addChineseUnit(normalDamageTotal)}</hir>\n🌟暴击攻击:<hir>${critHitCount}次</hir>\n🌟暴击伤害:<hir>${addChineseUnit(critDamageTotal)}</hir>\n⚔️总计攻击:<hir>${allpfmnum}次</hir>\n⚔️总计伤害:<hir>${addChineseUnit(alldps)}</hir>\n⏱️每秒伤害:<hir>${addChineseUnit(real_dps)}</hir>\n⏱️每秒攻击:<hir>${Math.round(real_act)}</hir></hiw>`, 0, "dps");
                normalDamageTotal = 0; normalHitCount = 0; critDamageTotal = 0; critHitCount = 0; dpsLocked = 0;
            }, 100);
        }
    },
    Send: async function (cmd) {
        if (CanUse) { send_cmd(cmd, true); }
        else {
            if (cmd) {
                cmd = cmd instanceof Array ? cmd : cmd.split(';');
                for (var c of cmd) { $("span[WG='WG']").attr("cmd", c).click(); }
            }
        }
    },
    SendStep: async function (cmd) {
        if (cmd) {
            cmd = cmd instanceof Array ? cmd : cmd.split(';');
            for (var c of cmd) { WG.SendCmd(c); await WG.sleep(12000); }
        }
    },
    SendCmd: async function (cmd) {
        if (cmd) {
            if (cmd.indexOf(",") >= 0) {
                cmd = cmd instanceof Array ? cmd : (cmd.indexOf(";") >= 0 ? cmd.split(";") : cmd.split(","));
            } else {
                cmd = cmd instanceof Array ? cmd : cmd.split(';');
            }
            let idx = 0;
            let cmds = '';
            for (var c of cmd) {
                if (c.indexOf("$") >= 0) {
                    if (c[0] == "$") {
                        c = c.replace("$", ""); let p0 = c.split(" ")[0]; let p1 = c.split(" ")[1];
                        cmds = cmd.join(";"); TaskHelper_call(p0, idx, p1, cmds); return;
                    } else {
                        var p_c = c.split(" "); p_c = p_c[p_c.length - 1];
                        if (p_c) {
                            if (p_c[0] == "$") {
                                p_c = p_c.replace("$", ""); let patt = new RegExp(/\".*?\"/);
                                var m1 = patt.exec(p_c); var result = m1 ? m1[0] : '';
                                cmds = cmd.join(";"); TaskHelper_call(p_c.split('(')[0], idx, result ? JSON.parse(result) : '', cmds); return;
                            } else {
                                p_c = c.split(" ");
                                if (p_c[1].indexOf('$') >= 0) {
                                    p_c = p_c[1].replace("$", ""); let patt = new RegExp(/\".*?\"/);
                                    var m2 = patt.exec(p_c); var result2 = m2 ? m2[0] : '';
                                    cmds = cmd.join(";"); TaskHelper_call(p_c.split('(')[0], idx, result2 ? JSON.parse(result2) : '', cmds); return;
                                }
                            }
                        } else { return; }
                    }
                }
                if (c.indexOf("{r") >= 0) {
                    var rep = c.match("\{r([^}]+)\}");
                    if (rep && rep[1]) {
                        for (let [id, item] of GameState.items) {
                            if (item.name.indexOf(rep[1]) >= 0) { var subStr = new RegExp('\{r([^}]+)\}'); c = c.replace(subStr, id); break; }
                        }
                    }
                }
                WG.Send(c);
                idx = idx + 1;
            }
        }
    },
    sleep: function (time) { return new Promise((resolve) => setTimeout(resolve, time)); },
    stopAllAuto: function () { stopauto = true; },
    reSetAllAuto: function () { stopauto = false; },
    go: async function (p) {
        if ((saveAddr == '开' || saveAddr === true || saveAddr === 'true') && p == '扬州城-钱庄') { p = '住房-卧室'; }
        if (needfind[p] == undefined) { if (WG.at(p)) return; }
        if (place[p] != undefined) {
            GameState.ingo = true;
            let cmd = typeof place[p] === 'function' ? place[p]() : place[p];
            await WG.SendCmd(cmd);
            GameState.ingo = false;
        }
    },
    at: function (p) {
        if ((saveAddr == '开' || saveAddr === true || saveAddr === 'true') && p == '扬州城-钱庄') { p = '住房-卧室'; }
        return $(".room-name").html().indexOf(p) != -1;
    },
    getIdByName: function (n) {
        for (let i = 0; i < roomData.length; i++) { if (roomData[i].name && roomData[i].name.indexOf(n) >= 0) return roomData[i].id; }
        return null;
    },
    ythook: undefined,
    ungetStore: false,
    kala_count: 0,
    eq: function (e) { WG.Send("eq " + e); },
    go_home: function () { WG.Send('goto home'); },
    go_wumiao: function () { WG.go('扬州城-武庙'); },
    kill_all: function () { for (let [id, item] of GameState.items) { if (item.p != 1) WG.Send("kill " + id); } },
    get_all: function () { for (let [id, item] of GameState.items) { if (item.name.indexOf("尸体") != -1) WG.Send("get all from " + id); } },
    auto_perform_button: function () {
        var on = (auto_pfmswitch == "开" || auto_pfmswitch === true || auto_pfmswitch === 'true');
        $(".auto_perform").text(on ? "自动攻击：开" : "自动攻击：关");
    },
    cmd_echo_button: function () {
        if (cmd_echo) { cmd_echo = false; messageAppend("<hio>命令代码关闭</hio>"); }
        else { cmd_echo = true; messageAppend("<hio>命令代码显示</hio>"); }
        $(".cmd_echo").text("代码：" + (cmd_echo ? "开" : "关"));
    },
    getItemNameByid: (id, callback) => {
        GameState.packs.items.forEach(function (item) { if (item != 0 && item.id == id) { callback(item.name); return; } });
    },
    zdwk: async function () {
        try { if (unsafeWindow.Role && typeof unsafeWindow.Role.resetIdleTime === 'function') unsafeWindow.Role.resetIdleTime(); } catch (e) { }
        switch (String(autowork)) {
            case "0": WG.Send("goto kuang;"); break;
            case "1": WG.Send("goto home;go west;xiulian;"); break;
            case "2": ToRaid.perform("goto home;go northeast;eq {b钓鱼竿}?;diao;"); break;
        }
    },
    timer_close: function () { if (timer) { clearInterval(timer); timer = 0; } },
    xue_auto: function () {
        var t = $(".room_items .room-item:first .item-name").text();
        t = t.indexOf("<打坐") != -1 || t.indexOf("<学习") != -1 || t.indexOf("<练习") != -1;
        if (timer == 0) { if (t == false) { messageAppend("当前不在打坐或学技能"); return; } timer = setInterval(WG.xue_auto, 1000); }
        if (t == false) { WG.timer_close(); WG.zdwk(); } else { messageAppend("自动打坐学技能"); }
    },
    showhideborad: function () {
        if ($('.WG_log').css('display') == 'none') { window.localStorage.setItem("closeBorad", "false"); $('.WG_log').show(); }
        else { window.localStorage.setItem("closeBorad", "true"); $('.WG_log').hide(); }
    },
    showhidebtn: function () {
        if ($('.WG_button').css('display') == 'none') { window.localStorage.setItem("closeBtn", "false"); $('.WG_button').show(); }
        else { window.localStorage.setItem("closeBtn", "true"); $('.WG_button').hide(); }
    },
    saveRoomstate(data) { roomData = data.items; },
    haspack: function (name, callback) {
        WG.Send('pack');
        for (let item of GameState.packs.items) { if (item.name.indexOf(name) >= 0) { callback(item.id); return; } }
        callback('');
    },
    find_item: function (name) { for (let [k, v] of GameState.items) { if (v.name == name) return k; } return null; },
    recover: function (hp, mp, cd, callback) {
        if (hp == 0) { if (WG.recover_timer) { clearTimeout(WG.recover_timer); WG.recover_timer = undefined; } return; }
        WG.Send("dazuo");
        WG.recover_timer = setInterval(function () {
            let item = GameState.items.get(GameState.id);
            if (item.mp / item.max_mp < mp) { if (item.state != "打坐") WG.Send("stopstate;dazuo"); return; }
            if (item.hp / item.max_hp < hp) { if (item.state != "疗伤") WG.Send("stopstate;liaoshang"); return; }
            if (item.state) WG.Send("stopstate");
            if (cd) { for (let [k, v] of WG.cds) { if (k == "force.tu") continue; if (v?.iscd) return; } }
            clearInterval(WG.recover_timer); callback();
        }, 1000);
    },
    zmlfire: async function (zml) {
        if (zml) {
            messageAppend("<hig>运行" + zml.name);
            if (zml.zmlType == 0 || zml.zmlType == "" || zml.zmlType == undefined) { await WG.SendCmd(zml.zmlRun); }
            else if (zml.zmlType == 1) { if (unsafeWindow && unsafeWindow.ToRaid) ToRaid.perform(zml.zmlRun); }
            else if (zml.zmlType == 2) { eval(zml.zmlRun); }
        }
    }
});