// ============================================================
// wg-equip.js —— 自动换装功能
// ------------------------------------------------------------
// 提供右键菜单中的「换装设置」和「换装」功能：
//   保存/读取装备套装、一键换装、一键切换技能、复制换装命令
// 数据存储于 GM_setValue(roleid + "_eqlist") 和 GM_setValue(roleid + "_skilllist")
// ============================================================
'use strict';

// 装备列表和技能列表（全局变量，与 WG.eqhelper 共享）
var eqlist = {};
var skilllist = {};

// 换装相关 hook 句柄
if (typeof WG.eqx === 'undefined') WG.eqx = null;
if (typeof WG.eqxp === 'undefined') WG.eqxp = null;

Object.assign(WG, {

    // ---- 核心：保存/换装 ----
    eqhelper: function (type, enaskill, realy) {
        if (enaskill === undefined) enaskill = 0;
        if (realy === undefined) realy = false;

        if (type == undefined || type == 0 || type > eqlist.length) {
            return;
        }

        // 从存储读取
        eqlist = GM_getValue(roleid + "_eqlist", {});
        skilllist = GM_getValue(roleid + "_skilllist", {});

        if (eqlist == null || eqlist[type] == null || eqlist[type] == "") {
            // -- 套装不存在，保存当前装备 --
            if (enaskill == 1) {
                return;
            }
            messageAppend("套装未保存,保存当前装备作为套装" + type + "!", 1);
            WG.eqx = WG.add_hook("dialog", function (data) {
                if (data.dialog == "pack" && data.eqs != undefined) {
                    data = WG.smartClone(data);
                    data = WG.deserializePackData(data);
                    eqlist = GM_getValue(roleid + "_eqlist", {});
                    eqlist[type] = JSON.parse(JSON.stringify(data.eqs));
                    GM_setValue(roleid + "_eqlist", eqlist);
                    messageAppend("套装" + type + "保存成功!", 1);
                    if (WG.eqx) { WG.remove_hook(WG.eqx); WG.eqx = null; }
                }
            });
            WG.eqxp = WG.add_hook("dialog", function (data) {
                if (data.dialog == 'skills' && data.items != null) {
                    var nowskill = { 'throwing': '', 'unarmed': '', 'force': '', 'dodge': '', 'sword': '', 'blade': '', 'club': '', 'staff': '', 'whip': '', 'parry': '' };
                    for (let item of data.items) {
                        if (nowskill[item.id] != null) {
                            nowskill[item.id] = item.enable_skill || 'none';
                        }
                    }
                    skilllist = GM_getValue(roleid + "_skilllist", {});
                    skilllist[type] = nowskill;
                    GM_setValue(roleid + "_skilllist", skilllist);
                    messageAppend("技能" + type + "保存成功!", 1);
                    if (WG.eqxp) { WG.remove_hook(WG.eqxp); WG.eqxp = null; }
                }
            });
            WG.Send("cha");
            WG.Send("pack");
        } else {
            // -- 套装已存在，执行换装 --
            if (WG.eqx != null || WG.eqxp != null) {
                if (WG.eqx) { WG.remove_hook(WG.eqx); WG.eqx = null; }
                if (WG.eqxp) { WG.remove_hook(WG.eqxp); WG.eqxp = null; }
            }
            eqlist = GM_getValue(roleid + "_eqlist", {});
            skilllist = GM_getValue(roleid + "_skilllist", {});

            if (realy) {
                // 复制命令到剪贴板
                var eqdata = "";
                if (enaskill == 0) {
                    for (let i = 1; i < 11; i++) {
                        if (eqlist[type][i] != null && eqlist[type][i] != "") {
                            eqdata += "eq " + eqlist[type][i].id + ";";
                        }
                    }
                    eqdata += "eq " + eqlist[type][0].id + ";";
                } else {
                    for (let i in skilllist[type]) {
                        if (skilllist[type][i] != null && skilllist[type][i] != "") {
                            eqdata += "enable " + i + " " + skilllist[type][i] + ";";
                        }
                    }
                }
                copyToClipboard(eqdata);
                messageAppend(type + "已复制到剪贴板!", 1);
                return;
            }

            var p_cmds = "";
            let mySkills = [];
            let myEqs = new Set();

            if (GameState && GameState.packs && GameState.packs.eqs) {
                for (let ski of GameState.packs.eqs) {
                    if (ski) {
                        myEqs.add(ski.id);
                    }
                }
            }
            let tsMsg = "套装";
            if (enaskill === 0) {
                for (let i = 1; i < 11; i++) {
                    if (eqlist[type][i] != null && !myEqs.has(eqlist[type][i].id)) {
                        p_cmds += ("$wait 20;eq " + eqlist[type][i].id + ";");
                    }
                }
                if (eqlist[type][0] != null && !myEqs.has(eqlist[type][0].id)) {
                    p_cmds += ("$wait 40;eq " + eqlist[type][0].id + ";");
                }
            }
            if (enaskill === 1) {
                var enableSkills = (GameState && GameState.skills && GameState.skills.enable_skills) ? GameState.skills.enable_skills : {};
                for (var key in skilllist[type]) {
                    if (enableSkills[key] && enableSkills[key].id != skilllist[type][key]) {
                        p_cmds += ("$wait 40;enable " + key + " " + skilllist[type][key] + ";");
                    }
                }
                tsMsg = "技能";
                $("span[command=skills]").click();
            }

            p_cmds = p_cmds + '$wait 40;cha;look3 1';

            WG.eqx = WG.add_hook('text', function (data) {
                if (data.type == 'text') {
                    if (data.msg.indexOf('没有这个玩家') >= 0) {
                        messageAppend(tsMsg + "装备成功" + type + "!", 1);
                        if (enaskill == 1) {
                            $("span[command=skills]").click();
                        }
                        if (WG.eqx) { WG.remove_hook(WG.eqx); WG.eqx = null; }
                    }
                }
            });

            WG.SendCmd(p_cmds);
        }
    },

    // ---- 删除套装 ----
    eqhelperdel: function (type) {
        eqlist = GM_getValue(roleid + "_eqlist", {});
        skilllist = GM_getValue(roleid + "_skilllist", {});
        delete eqlist[type];
        delete skilllist[type];
        GM_setValue(roleid + "_eqlist", eqlist);
        GM_setValue(roleid + "_skilllist", skilllist);
        messageAppend("清除套装 技能" + type + "设置成功!", 1);
    },

    // ---- 脱光装备 ----
    uneqall: function (isskill) {
        if (isskill === undefined) isskill = "0";
        if (isskill == "0") {
            var _eqx = WG.add_hook("dialog", function (data) {
                if (data.dialog == "pack" && data.eqs != undefined) {
                    data = WG.smartClone(data);
                    data = WG.deserializePackData(data);
                    for (let i = 0; i < data.eqs.length; i++) {
                        if (data.eqs[i] != null) {
                            WG.Send("uneq " + data.eqs[i].id);
                        }
                    }
                    WG.remove_hook(_eqx);
                }
            });
            WG.Send("pack");
            messageAppend("取消所有装备成功!", 1);
        } else {
            var enaNone = "enable unarmed none;enable blade none;enable force none;enable parry none;enable dodge none;enable sword none;enable throwing none;enable whip none;enable club none;enable staff none";
            var enalist = enaNone.split(";");
            for (let i = 0; i < enalist.length; i++) {
                if (enalist[i]) {
                    WG.sleep(10);
                    WG.Send(enalist[i]);
                }
            }
            messageAppend("取消所有技能成功!", 1);
        }
    },

    // ---- 生成右键菜单子项（动态） ----
    eqloader: function () {
        let tmp_eqlist = GM_getValue(roleid + "_eqlist", null);
        var subItems = {};
        if (tmp_eqlist) {
            for (let item in tmp_eqlist) {
                subItems[item] = { name: "装备" + item, icon: "fa-compress", callback: function () { WG.eqhelper(item, 0); } };
                subItems[item + "sk"] = { name: "技能" + item, icon: "fa-magic", callback: function () { WG.eqhelper(item, 1); } };
                subItems[item + "del"] = { name: "删除组" + item, icon: "fa-remove", callback: function () { WG.eqhelperdel(item); } };
            }
        }
        subItems['setting'] = { name: "套装管理", icon: "edit", callback: function () { WG.eqhelperui(); } };
        var dfd = jQuery.Deferred();
        setTimeout(function () {
            dfd.resolve(subItems);
        }, 20);
        return dfd.promise();
    },

    });