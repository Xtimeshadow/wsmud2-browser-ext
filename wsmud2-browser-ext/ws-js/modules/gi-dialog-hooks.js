// ============================================================
// gi-dialog-hooks.js —— GlobalInit dialog 钩子处理
// ------------------------------------------------------------
// 处理服务器下发的 dialog 类型消息：
//   list  → 仓库/当铺自动购买
//   score → 角色属性同步
//   pack  → 背包数据同步/自动使用
//   skills → 技能数据同步
//   party/team/relation/jh/events → 关系/活动
// ============================================================
'use strict';

Object.assign(GlobalInit, {
    handleDialog: function (data) {
        if (data.dialog == 'list') {
            // 自动当铺购买
            if (data.stores) {
                // 仓库数据
                data = WG.smartClone(data);
                data = WG.deserializePackData(data);
                storeData = data.stores;

                GameState.store.max_store_count = data.max_store_count;
                GameState.store.sum = data.sum;
                GameState.store.stores = data.stores;

            } else if (data.store) {
                // 单次存储
                let scan_store = true;
                let bag_remove_id = null;
                let store_remove_id = null;

                for (let i = 0; i < GameState.packs.items.length; i++) {
                    let bag_item = GameState.packs.items[i];
                    if (bag_item == null) { continue; }
                    if (bag_item.id == data.id) {
                        scan_store = false;
                        let over_num = bag_item.count - data.store;
                        if (over_num == 0) {
                            bag_remove_id = i;
                        } else {
                            GameState.packs.items[i].count = over_num;
                        }
                        break;
                    }
                }
                if (scan_store) {
                    for (let j = 0; j < storeData.length; j++) {
                        let store_item = storeData[j];
                        if (store_item == null) { continue; }
                        if (store_item.id == data.storeid) {
                            let item = {
                                id: data.id,
                                name: store_item.name,
                                count: Math.abs(data.store)
                            }
                            GameState.packs.items.push(item);
                            break;
                        }
                    }
                }
                let found_store = true;
                for (let j = 0; j < storeData.length; j++) {
                    let store_item = storeData[j];
                    if (store_item == null) { continue; }
                    if (store_item.id == data.id) {
                        found_store = false;
                        let store_count = store_item.count + data.store;
                        if (store_count === 0) {
                            store_remove_id = j;
                        } else {
                            storeData[j].count = store_count;
                        }
                        break;
                    }
                }
                if (found_store) {
                    for (let j = 0; j < GameState.packs.items.length; j++) {
                        let store_item = GameState.packs.items[j];
                        if (store_item == null) { continue; }
                        if (store_item.id === data.id) {
                            let item = {
                                id: data.stroeid,
                                name: store_item.name,
                                count: Math.abs(data.store)
                            }
                            storeData.push(item)
                            break;
                        }
                    }
                }
                if (bag_remove_id != null) {
                    GameState.packs.items.splice(bag_remove_id, 1)
                }
                if (store_remove_id != null) {
                    storeData.splice(store_remove_id, 1)
                }
            } else if (data.title == "唐楠正在贩卖以下物品：" && autoBuyList) {
                messageAppend("<hig>自动当铺购买中，如有问题请检查设置</hig>")
                let _seller;
                let _itemids = new Map();
                let _sendcmd = "";
                data = WG.smartClone(data);
                data = WG.deserializePackData(data);
                _seller = data.seller;
                for (let item of data.selllist) {
                    if (WG.inArray(item.name, autoBuyList.split(",")) && item.count) {
                        _itemids.set(item.id, item.count);
                    }
                }
                _itemids.forEach((val, key, map) => {
                    _sendcmd = _sendcmd + "buy " + val + " " + key + " from " + _seller + ";";
                    _sendcmd = _sendcmd + "$wait 500;";
                });
                WG.SendCmd(_sendcmd);
            }
        } else if (data.dialog == "score") {
            for (let key in data) {
                GameState.score[key] = data[key];
            }
            if (data.level) {
                if (data.level.indexOf('武帝') >= 0 || data.level.indexOf('武神') >= 0 ||
                    data.level.indexOf('剑神') >= 0 || data.level.indexOf('刀皇') >= 0 ||
                    data.level.indexOf('兵主') >= 0 || data.level.indexOf('战神') >= 0) {
                    GameState.score.isGod = true
                } else { GameState.score.isGod = false }
            }
            if (data.family) {
                GameState.score.family = data.family.replaceAll('派', '').replaceAll('楼', '');
                if (GameState.score.family == "无门无") { GameState.score.family = "武馆"; }
                family = GameState.score.family;

                const familyPyMap = { '武当': 'WUDANG', '峨眉': 'EMEI', '少林': 'SHAOLIN', '逍遥': 'XIAOYAO', '华山': 'HUASHAN', '丐帮': 'GAI', '杀手': 'SHASHOU', '武馆': '' };
                GameState.score.family_py = familyPyMap[family] || '';
                GM_setValue(roleid + "_family", GameState.score.family);
            }
        } else if (data.dialog == "pack") {
            if (data.items != undefined) {
                data = WG.smartClone(data);
                data = WG.deserializePackData(data);
                GameState.packs.items = data.items;
                GameState.packs.max_item_count = data.max_item_count;
                GameState.packs.money = data.money;
                if (auto_buy_talisman && data.money > 100) {
                    var today = new Date(), todayStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                    if (GM_getValue(roleid + "_auto_shop_date", "") !== todayStr) {
                        GM_setValue(roleid + "_auto_shop_date", todayStr);
                        WG.SendCmd('shop hd9f10f2a2e70 50');
                        WG.SendCmd('shop w62l10f2a2e70 10');
                    }
                }
                GameState.packs.eqs = data.eqs;
                GameState.packs.eq_group = data.eq_group;

                if (data.eq_group >= 0) {
                    eqgroup = GM_getValue(roleid + "_eqgroup") || [];
                    eqgroup[data.eq_group] = data.eqs;
                    GM_setValue(roleid + "_eqgroup", eqgroup);
                }
            }
            if (data.uneq != undefined) {
                let p = WG.smartClone(GameState.packs.eqs[data.uneq]);
                GameState.packs.eqs[data.uneq] = null;
                GameState.packs.items.push(p);
            }
            if (data.eq != undefined) {
                let index = GameState.packs.items.findIndex(item => { return item.id === data.id; });
                let p = WG.smartClone(GameState.packs.items[index]);
                GameState.packs.items.splice(index, 1);
                GameState.packs.eqs[data.eq] = p;
            }
            if (data.remove) {
                let index = GameState.packs.items.findIndex(item => { return item.id === data.id; });
                if (index == -1) return;
                let item = GameState.packs.items[index];
                let count = item.count - data.remove;
                if (count <= 0) {
                    GameState.packs.items.splice(index, 1);
                } else {
                    item.count = count;
                }
            }
            if (data.name != null) {
                let index = GameState.packs.items.findIndex(item => { return item.id === data.id; });
                let old_count = index == -1 ? null : GameState.packs.items[index].count;
                let item = {
                    id: data.id, name: data.name, count: data.count, grade: data.grade,
                    unit: data.unit, value: data.value, can_eq: data.can_eq || 0,
                    can_use: data.can_use || 0, can_study: data.can_study || 0,
                    can_open: data.can_open || 0, can_combine: data.can_combine || 0,
                };
                if (index !== -1) {
                    GameState.packs.items.splice(index, 1, item);
                } else {
                    GameState.packs.items.push(item);
                }
                if ((getitemShow == "开" || getitemShow === true || getitemShow === 'true') && !data.name.includes("<wht>")) {
                    let count = index == -1 ? data.count : data.count - old_count;
                    let id = data.id;
                    let str;
                    if (data.can_eq == 1) {
                        if (index != -1) return;
                        str = `获得1${data.unit}${data.name}`;
                    }
                    if (!itemTotalCount[id]) {
                        itemTotalCount[id] = 0;
                    } else if (itemTotalCount[id] < 0) return;
                    itemTotalCount[id] += count;
                    raidItemData[id] = { name: data.name, unit: data.unit, count: itemTotalCount[id], current: data.count };
                    str = `获得<hiw>${itemTotalCount[id]}</hiw>${data.unit}${data.name}，共有<hiw>${data.count}</hiw>${data.unit}`;
                    messageAppend(str, 0, id)
                }
            }
            if (data.can_use || data.can_open) {
                function autoUse(item) {
                    if (/养精丹|朱果|潜灵果|背包扩充石|仓库扩充石|小箱子|师门补给包|随从礼包|技能重置包/.test(item.name)) {
                        let cmd = ["stopstate"];
                        let count = item.count;
                        let zl = "use";
                        if (/小箱子|师门补给包|随从礼包|技能重置包/.test(item.name)) zl = "open";
                        for (let i = 0; i < count; i++) {
                            cmd.push(`$wait 250;${zl} ${item.id}`);
                        }
                        $(".content-message pre").append(
                            $(`<div class="item-commands"><span class="autouse">使用 ${item.name} ${count}次</span></div>`).click(() => WG.SendCmd(cmd)),
                        );
                    }
                }
                if (data.name) {
                    autoUse(data);
                }
            }
        } else if (data.dialog == "skills") {
            if (data.items) {
                GameState.skills.items = data.items;
                GameState.skills.limit = data.limit;
                GameState.skills.sk_group = data.sk_group;
                GameState.skills.items.forEach(item => {
                    if (item.name.indexOf("基本") >= 0) {
                        if (item.enable_skill) {
                            GameState.skills.enable_skills[item.id].id = item.enable_skill;
                        } else {
                            GameState.skills.enable_skills[item.id] = { name: null, id: null };
                        }
                    } else {
                        for (let key in GameState.skills.enable_skills) {
                            if (GameState.skills.enable_skills[key].id && item.id == GameState.skills.enable_skills[key].id) {
                                GameState.skills.enable_skills[key].name = item.name;
                            }
                        }
                    }
                });
            }
            if (data.books) {
                GameState.skills.books = data.books
            }
            if (data.sk_group >= 0) {
                skgroup = GM_getValue(roleid + "_skgroup", []);
                setTimeout(() => {
                    skgroup[data.sk_group] = GameState.skills.enable_skills
                    GM_setValue(roleid + "_skgroup", skgroup);
                }, 200)
            }
            if (data.enable != undefined) {
                for (let key in GameState.skills.enable_skills) {
                    let item = GameState.skills.enable_skills[key];
                    if (key == data.id) {
                        item.id = data.enable
                        for (let skill of GameState.skills.items) {
                            if (skill.id == data.enable) {
                                item.name = skill.name;
                                break;
                            }
                        }
                    }
                }
            }
            if (data.enable != null && (zdyskills == "开" || zdyskills === true || zdyskills === 'true')) {
                zdyskilllist == "";
                messageAppend("检测到更换技能,请刷新重新获取技能数据!");
                zdyskills = "关";
                GM_setValue(roleid + "_zdyskilllist", "");
                GM_setValue(roleid + "_zdyskills", zdyskills);
            }
        } else if (data.dialog == 'party' && data.name != undefined) {
            GameState.relation.party = data.name;
        } else if (data.dialog == 'team' && data.items != undefined) {
            GameState.relation.team = data.items;
        } else if (data.dialog == 'relation' && data.fls != undefined) {
            GameState.relation.follower = data.fls.slice(0, -1);
            const workMap = { 挖矿: 'wk', 钓鱼: 'diao', 采药: 'cai' };
            GameState.relation.follower.forEach(item => item[2] = workMap[item[2]]);
            let fls = GameState.relation.follower;
            let addr = GM_getValue(roleid + "_saveAddr");
            for (let i = 0; i < fls.length; i++) {
                let wk = fls[i][2];
                if (wk && (addr == "关" || addr === false || addr === 'false')) {
                    addr = "开"
                    GM_setValue(roleid + "_saveAddr", addr);
                } else if (!wk && (addr == "开" || addr === true || addr === 'true')) {
                    messageAppend(`<hiy>注意：随从<hir>${fls[i][0]}</hir>停止工作！！</hiy>`);
                    fls[i][2] = 'cai';
                }
            }
        } else if (data.dialog == 'jh') {
            if (data.fbs) {
                fb_path = data.fbs;
            }
        } else if (data.dialog == "events") {
            if (data.items && Array.isArray(data.items)) {
                GameState.events = data.items;
                for (let n = 0; n < data.items.length; n++) {
                    if (data.items[n] && data.items[n][0] === "marry") {
                        var automarry = GM_getValue(roleid + "_automarry", automarry);
                        if ((automarry == "开" || automarry === true || automarry === 'true') && GameState.fight.in_fight == false) {
                            if (stopauto || WG.at('副本')) {
                                messageAppend("<hiy>已自动领取喜宴</hiy>");
                                WG.xiyan();
                            } else {
                                WG.xiyan();
                            }
                        } else if ((automarry == "关" || automarry === false || automarry === 'false') || GameState.fight.in_fight == true) {
                            let b = "<div class=\"item-commands\"><span  id = 'onekeyjh'>参加喜宴</span></div>"
                            messageAppend("<hiy>点击参加喜宴</hiy>", 0, null, true);
                            messageAppend(b, 0, null, true);
                            $('#onekeyjh').on('click', function () {
                                WG.xiyan();
                            });
                        }
                    } else if (data.items[n] && data.items[n][0].includes("boss")) {
                        var boss_name = data.items[n][2].match(/(.*?)被击败了/)?.[1];
                        BossName = GM_getValue(roleid + "_BossName", BossName);
                        autoBoss = GM_getValue(roleid + "_autoBoss", autoBoss);
                        if (boss_name == null || BossName == '') { continue; }
                        if (boss_name && boss_name.includes("<hi")) {
                            boss_name = boss_name.match(/<hi([^>]+)>(.*?)<\/hi\1>/)[2]
                        }
                        if (boss_name != BossName) { continue; }
                        try {
                            if (typeof PushAlert === 'function') PushAlert('boss', '🐲 BOSS「' + boss_name + '」已刷新，可领取奖励');
                        } catch (e) { }
                        if ((autoBoss == "开" || autoBoss === true || autoBoss === 'true') && GameState.fight.in_fight == false) {
                            if (stopauto || WG.at('副本')) {
                                let b = "<div class=\"item-commands\"><span  id = 'onekeyboss'>领取BOSS</span></div>"
                                messageAppend("<hiy>自动领取boss</hiy>", 0, null, true);
                                messageAppend(b, 0, null, true);
                                $('#onekeyboss').on('click', function () { WG.collBoss(data.items[n]); });
                            } else {
                                WG.collBoss(data.items[n]);
                            }
                        } else if (GameState.fight.in_fight == true) {
                            let b = "<div class=\"item-commands\"><span  id = 'onekeyboss'>领取BOSS</span></div>"
                            messageAppend("<hiy>点击参加领取BOSS,由于未开启自动领取,或者在战斗中,需要手动领取</hiy>", 0, null, true);
                            messageAppend(b, 0, null, true);
                            $('#onekeyboss').on('click', function () { WG.collBoss(data.items[n]); });
                        }
                    }
                }
            } else if (data.update || data.finish) {
                WG.SendCmd("events");
            }
        }
    }
});