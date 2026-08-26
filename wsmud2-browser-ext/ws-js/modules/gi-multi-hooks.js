// ============================================================
// gi-multi-hooks.js —— GlobalInit 多类型消息钩子处理
// ------------------------------------------------------------
// 处理以下类型消息（一个大 switch）：
//   login/exits/room/items/itemadd/itemremove/sc/perform/
//   clearDistime/dispfm/enapfm/combat/status/text/die
// ============================================================
'use strict';

Object.assign(GlobalInit, {
    handleMultiType: function (data) {
        switch (data.type) {
            case "login":
                GameState.id = data.id;
                GameState.connected = true;
                WG.online = true;
                break;
            case "exits":
                GameState.room.exits = new Map();
                if (data.items["north"]) { GameState.room.exits.set("north", { exits: data.items["north"] }); }
                if (data.items["south"]) { GameState.room.exits.set("south", { exits: data.items["south"] }); }
                if (data.items["east"]) { GameState.room.exits.set("east", { exits: data.items["east"] }); }
                if (data.items["west"]) { GameState.room.exits.set("west", { exits: data.items["west"] }); }
                if (data.items["northup"]) { GameState.room.exits.set("northup", { exits: data.items["northup"] }); }
                if (data.items["southup"]) { GameState.room.exits.set("southup", { exits: data.items["southup"] }); }
                if (data.items["eastup"]) { GameState.room.exits.set("eastup", { exits: data.items["eastup"] }); }
                if (data.items["westup"]) { GameState.room.exits.set("westup", { exits: data.items["westup"] }); }
                if (data.items["northdown"]) { GameState.room.exits.set("northdown", { exits: data.items["northdown"] }); }
                if (data.items["southdown"]) { GameState.room.exits.set("southdown", { exits: data.items["southdown"] }); }
                if (data.items["eastdown"]) { GameState.room.exits.set("eastdown", { exits: data.items["eastdown"] }); }
                if (data.items["westdown"]) { GameState.room.exits.set("westdown", { exits: data.items["westdown"] }); }
                if (data.items["up"]) { GameState.room.exits.set("up", { exits: data.items["up"] }); }
                if (data.items["down"]) { GameState.room.exits.set("down", { exits: data.items["down"] }); }
                if (data.items["enter"]) { GameState.room.exits.set("enter", { exits: data.items["enter"] }); }
                if (data.items["out"]) { GameState.room.exits.set("out", { exits: data.items["out"] }); }
                clearAllBuffTimers();
                break;
            case "room":
                let tmp = data.path.split("/");
                GameState.room.type = tmp[0];
                GameState.room.path = tmp[1];
                if (GameState.room.type == 'home' || GameState.room.path == 'kuang')
                    can_auto = true;
                else
                    can_auto = false;
                GameState.room.name = data.name;
                if (GameState.fight.in_fight) {
                    GameState.fight.in_fight = false;
                    WG.auto_preform("stop");
                    WG.clean_dps();
                }
                break;
            case "items":
                WG.saveRoomstate(data);
                GameState.items = new Map();
                for (var i = 0; i < data.items.length; i++) {
                    let item = data.items[i];
                    if (item.id) {
                        if (item.id == GameState.id && item.status != null) {
                            GameState.selfStatus = []
                            for (var x = 0; x < item.status.length; x++) {
                                GameState.selfStatus.push(item.status[x].sid)
                            }
                        }
                        let n = _plainName(item.name);
                        let i = n.lastIndexOf(' ');
                        let j = n.lastIndexOf('<');
                        let t = "";
                        let s = "";
                        if (j >= 0) { s = n.substr(j + 1, 2); }
                        if (i >= 0) {
                            t = n.substr(0, i);
                            n = n.substr(i + 1).replace(/<.*>/g, '');
                        }
                        GameState.items.set(item.id, {
                            name: n, title: t, state: s, max_hp: item.max_hp, max_mp: item.max_mp,
                            hp: item.hp, mp: item.mp, p: item.p, damage: 0, status: item.status
                        });
                    }
                    if (item.status && item.status.length > 0) {
                        for (let j = 0; j < item.status.length; j++) {
                            const statusItem = item.status[j];
                            showBuffDuration(statusItem.sid, statusItem.duration, item.id, statusItem.count || 0, statusItem.overtime);
                        }
                    }
                }
                break;
            case "itemadd":
                if (data.id) {
                    let n = _plainName(data.name);
                    let i = n.lastIndexOf(' ');
                    let j = n.lastIndexOf('<');
                    let t = "";
                    let s = "";
                    if (i >= 0) {
                        t = n.substr(0, i);
                        if (j >= 0) { s = n.substr(j + 1, 2); }
                        n = n.substr(i + 1).replace(/<.*>/g, '');
                    }
                    GameState.items.set(data.id, {
                        name: n, title: t, state: s, max_hp: data.max_hp, max_mp: data.max_mp,
                        hp: data.hp, mp: data.mp, p: data.p, damage: 0, status: data.status
                    });
                    if (data.status && data.status.length > 0) {
                        for (let i = 0; i < data.status.length; i++) {
                            const statusItem = data.status[i];
                            showBuffDuration(statusItem.sid, statusItem.duration, data.id, statusItem.count || 0, statusItem.overtime);
                        }
                    }
                }
                break;
            case "itemremove":
                GameState.items.delete(data.id);
                break
            case "sc":
                let xitem = GameState.items.get(data.id);
                if (data.hp !== undefined) {
                    xitem.hp = data.hp;
                    if (data.id != GameState.id) { GameState.fight.fight_id = data.id; }
                }
                if (data.mp !== undefined) { xitem.mp = data.mp; }
                if (data.id != GameState.id) break;
                if (data.hp != null) GameState.score.hp = data.hp;
                if (data.max_hp != null) GameState.score.maxHp = data.max_hp;
                if (data.mp != null) GameState.score.mp = data.mp;
                if (data.max_mp != null) GameState.score.maxMp = data.max_mp;
                break
            case "perform":
                GameState.skills.perform = data.skills;
                if (zdyskilllist == "") {
                    zdyskilllist = JSON.stringify(data.skills);
                    GM_setValue(roleid + "_zdyskilllist", zdyskilllist);
                }
                break
            case 'clearDistime':
                WG.cds.forEach(function (v, k) {
                    WG.cds.set(k, { iscd: false, distime: 0 });
                    clearSkillCDDisplay(k);
                });
                break;
            case 'dispfm':
                if (data.id) {
                    WG.cds.set(data.id, { iscd: true, distime: data.distime || 0 });
                    var _id = data.id;
                    setTimeout(function () {
                        WG.cds.set(_id, { iscd: false, distime: 0 });
                        let pfmtimeTips = { data: JSON.stringify({ type: "enapfm", id: _id }) };
                        WG.receive_message(pfmtimeTips);
                    }, data.distime);
                    showSkillCD(data.id, data.distime);
                }
                if (data.rtime) {
                    if (WG.gcd) { clearTimeout(GlobalInit.gcdThread); }
                    WG.gcd = true;
                    GlobalInit.gcdThread = setTimeout(function () { WG.gcd = false; }, data.rtime);
                }
                break;
            case 'enapfm':
                clearSkillCDDisplay(data.id);
                break;
            case "combat":
                if (data.start) {
                    GameState.fight.in_fight = true;
                    battleStartTime = new Date();
                    WG.auto_preform();
                }
                if (data.end) {
                    GameState.fight.in_fight = false;
                    WG.auto_preform("stop");
                    WG.clean_dps();
                }
                break
            case "status":
                if (data.count != undefined) {
                    GameState.status.set(data.id, { "sid": data.sid, "count": data.count });
                }
                if (data.id == GameState.id) {
                    if (data.action == 'add') {
                        GameState.selfStatus.push(data.sid)
                        if (data.duration) {
                            setTimeout(() => {
                                GameState.selfStatus.remove(data.sid);
                            }, data.duration - (data.overtime || 0));
                        }
                    } else if (data.action == 'remove') {
                        let tmpbufflist = []
                        for (let i = 0; i < GameState.selfStatus.length; i++) {
                            if (GameState.selfStatus[i] != data.sid) { tmpbufflist.push(GameState.selfStatus[i]) }
                        }
                        GameState.selfStatus = tmpbufflist;
                    } else if (data.action == 'clear') {
                        GameState.selfStatus = []
                    }
                }
                let item = GameState.items.get(data.id);
                if (item == null) { break; }
                if (data.action == 'add' || data.action == 'refresh') {
                    if (item.status == null) { item.status = []; }
                    const buffIndex = item.status.findIndex(buff => buff.sid === data.sid);
                    let currentDuration = data.duration;
                    if (buffIndex !== -1) {
                        item.status[buffIndex].duration = data.duration || item.status[buffIndex].duration;
                        currentDuration = item.status[buffIndex].duration;
                    } else {
                        item.status.push({ sid: data.sid, name: data.name, duration: data.duration, count: data.count || 0, overtime: 0 });
                    }
                    showBuffDuration(data.sid, currentDuration, data.id, data.count || 0, 0);
                } else if (data.action == 'remove') {
                    for (let i = 0; i < item.status.length; i++) {
                        let s = item.status[i];
                        if (s.sid == data.sid) {
                            item.status.splice(i, 1);
                            clearBuffDisplay(data.sid, data.id);
                            break;
                        }
                    }
                } else if (data.action == 'clear') {
                    const id = data.id;
                    for (let i = 0; i < item.status.length; i++) {
                        clearBuffDisplay(item.status[i].sid, id);
                        item.status.splice(i, 1);
                    }
                }
                if (busy_info === '开' || busy_info === true || busy_info === 'true') {
                    if (data.id == GameState.id) {
                        if (data.action == 'add') {
                            if (data.sid == 'busy' || data.sid == 'faint') {
                                messageAppend(`<hig>你被${data.name}了${data.duration / 1000}秒`, 0, data.id + '_' + data.name);
                                if (data.name == '绊字诀') return;
                            }
                        }
                    } else {
                        if (data.action == 'add') {
                            if (data.sid == 'busy' || data.sid == 'faint' || data.sid == 'chidun' || data.sid == 'unarmed') {
                                let npc = GameState.items.get(data.id)
                                messageAppend(`<hig>${npc.name}被${data.name}了${data.duration / 1000}秒`, 0, data.id + '_' + data.name);
                            }
                        }
                    }
                }
                break
            case "text":
                if (data.msg.indexOf("今日副本次数") >= 0 && data.msg.indexOf("BOSS挑战") >= 0) {
                    const info = data.msg;
                    const regex = /武道塔进度\d+层，已累积(\d+)份奖励\n武道残页总量\d+\n门派职位等级[^，\n]+，已累积(\d+)份师门物资\n衙门职位等级[^，\n]+，已累积(\d+)份奖励\n今日副本次数(\d+)\/20\nBOSS挑战(\d+)\/5\n([^，\n]+)\n(获取圣元碎片(\d+)\/1\n)?(获取帝魄碎片(\d+)\/1\n)?获取额外(\d+)\/(\d+)师门功绩\n本周已经获取襄阳军功(\d+)\/(\d+)\n已领取(\d+)\/(\d+)奖励军功/;
                    const matches = info.match(regex);
                    if (!matches) { return; }
                    const result = {
                        wudao: parseInt(matches[1], 10), shimen: parseInt(matches[2], 10),
                        yamen: parseInt(matches[3], 10), fuben: parseInt(matches[4], 10),
                        boss: parseInt(matches[5], 10), qingan: matches[6] === '尚未请安',
                        shengyuan: matches[8] ? parseInt(matches[8], 10) : -1,
                        dipo: matches[10] ? parseInt(matches[10], 10) : -1,
                        gongji: { cur: parseInt(matches[11], 10), max: parseInt(matches[12], 10) },
                        jungong: { cur: parseInt(matches[13], 10), max: parseInt(matches[14], 10) },
                        jungong1: parseInt(matches[15], 10)
                    };
                    if (result.wudao > 5) { messageAppend(`<hir>武道塔累积${result.wudao}天，请尽快领取</hir>`); }
                    if (result.shimen > 48) { messageAppend(`<hir>师门累积${result.shimen}份，请尽快领取</hir>`); }
                    if (result.yamen > 48) { messageAppend(`<hir>衙门累积${result.yamen}份，请尽快领取</hir>`); }
                    if (result.fuben < 20) { messageAppend(`<hir>免费精力未用完，请尽快使用</hir>`); }
                    if (result.boss < 5) {
                        autoBoss = "开";
                        messageAppend(`<hiy>Boss次数未用完，已开启自动领取Boss</hiy>`);
                        GM_setValue(roleid + "_autoBoss", autoBoss);
                    } else {
                        autoBoss = "关";
                        GM_setValue(roleid + "_autoBoss", autoBoss);
                    }
                    if (result.qingan) { WG.SendCmd('sx greet'); messageAppend(`<hiy>未请安，已自动请安</hiy>`); }
                    if (result.shengyuan === 0) { messageAppend(`<hir>圣元碎片未获取，请尽快获取</hir>`); }
                    if (result.dipo === 0) { messageAppend(`<hir>帝魄碎片未获取，请尽快获取</hir>`); }
                    if (result.gongji.cur < result.gongji.max) { messageAppend(`<hir>门派战功绩未满，请尽快获取</hir>`); }
                    if (result.jungong.cur < result.jungong.max) { messageAppend(`<hir>军功未满，请尽快获取</hir>`); }
                    if (result.jungong1 == 0) { messageAppend(`<hir>胜利军功未领取，请尽快领取</hir>`); }
                    if (result.fuben >= 20 && result.boss >= 5 && !result.qingan && result.shengyuan !== 0 && result.dipo !== 0 && result.gongji.cur >= result.gongji.max) {
                        messageAppend(`<hig>今日任务全部完成!</hig>`);
                    }
                }
                if (data.msg.indexOf("还没准备好，你还不能使用。") >= 0) {
                    if (!WG.gcd) {
                        WG.gcd = true;
                        setTimeout(() => { WG.gcd = false }, 500);
                    }
                }
                if ((data.msg.indexOf("不要急") >= 0 || data.msg.indexOf("你现在手忙脚乱") >= 0 ||
                    data.msg.indexOf("你正在昏迷") >= 0 || data.msg.indexOf("你上个技能") >= 0) && (auto_pfmswitch == "开" || auto_pfmswitch === true || auto_pfmswitch === 'true')) {
                    if (!WG.gcd) {
                        WG.gcd = true;
                        setTimeout(() => { WG.gcd = false }, 500);
                    }
                }
                break
            case 'die':
                GameState.selfStatus = []
                if (data.relive == null) {
                    try { if (_pushDeath == '开' && typeof PushAlert === 'function') PushAlert('die', '⚠️ 角色死亡！请尽快处理'); } catch (e) { }
                    if (die_str != '') textShow(die_str)
                } else {
                    try { if (_pushDeath == '开' && typeof PushAlert === 'function') PushAlert('die_recover', '✅ 角色已复活'); } catch (e) { }
                }
                break;
            default:
                break;
        }
    }
});