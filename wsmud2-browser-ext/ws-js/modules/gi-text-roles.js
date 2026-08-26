// ============================================================
// gi-text-roles.js —— GlobalInit text + roles 钩子处理
// ------------------------------------------------------------
// text 钩子 → 背包满提醒/屏蔽NPC/伤害统计/一键分解/任务提醒
// roles 钩子 → 多开自动登录角色选择
// ============================================================
'use strict';

Object.assign(GlobalInit, {
    handleText: function (data) {
        if (data.msg.indexOf(`${Role.name}身上东西太多了`) >= 0 || data.msg.indexOf("你身上东西太多了") >= 0 || data.msg.indexOf("你拿不下那么多东西。") >= 0) {
            messageAppend("<hiy>友情提示：请检查是否背包已满！");
            Beep();
        } else if (data.msg.indexOf("长得") >= 0 && data.msg.indexOf("看起来") >= 0) {
            let s = data.msg.split("\n")[0].split(" ");
            let name = s[s.length - 1];
            if (name.indexOf("<") >= 0) { name = name.split("<")[0]; }
            let t = new Date().getMilliseconds();
            let shieldhtml = `<div class="item-commands"><span id="addshield${t}">屏蔽 ${name}</span></div>`
            messageAppend(shieldhtml, 0, null, true);
            $(`#addshield${t}`).on('click', function () {
                shield = GM_getValue('_shield', shield);
                if (shield != "") { shield = shield + "," + name; } else { shield = name; }
                GM_setValue('_shield', shield);
                $('#shield').val(shield);
                messageAppend("<hiy>已屏蔽", 1);
            });
        } else if ((dpssakada == '开' || dpssakada === true || dpssakada === 'true') && /.*造成<.*>.*<\/.*>点.*/.test(data.msg)) {
            let pdata = data.msg;
            let a = pdata.split(/.*造成<wht>|.*造成<hir>|<\/wht>点|<\/hir>点/);
            let b = a[2].split(/伤害|\(|</);
            if (b[2] != '你') {
                if (b[0] == '暴击') { lastCritDamage = parseInt(a[1]); }
                else { lastNormalDamage = parseInt(a[1]); }
                dpsLocked = 1;
            }
        } else if ((dpssakada == '开' || dpssakada === true || dpssakada === 'true') && /看起来充满活力，一点也不累。|似乎有些疲惫，但是仍然十分有活力。|看起来可能有些累了。|动作似乎开始有点不太灵光，但是仍然有条不紊。|已经一副头重脚轻的模样，正在勉力支撑著不倒下去。|看起来已经力不从心了。|已经陷入半昏迷状态，随时都可能摔倒晕去。|似乎十分疲惫，看来需要好好休息了。|气喘嘘嘘，看起来状况并不太好。|摇头晃脑、歪歪斜斜地站都站不稳，眼看就要倒在地上。/.test(data.msg)) {
            let dd = data.msg.split(/看起来充满活力，一点也不累。|似乎有些疲惫，但是仍然十分有活力。|看起来可能有些累了。|动作似乎开始有点不太灵光，但是仍然有条不紊。|已经一副头重脚轻的模样，正在勉力支撑著不倒下去。|看起来已经力不从心了。|已经陷入半昏迷状态，随时都可能摔倒晕去。|似乎十分疲惫，看来需要好好休息了。|气喘嘘嘘，看起来状况并不太好。|摇头晃脑、歪歪斜斜地站都站不稳，眼看就要倒在地上。/);
            if (dd.length >= 2) {
                if (dd[0].indexOf("你") < 0) {
                    if (lastCritDamage > 0) { critDamageTotal = critDamageTotal + lastCritDamage; critHitCount = critHitCount + 1; }
                    if (lastNormalDamage > 0) { normalDamageTotal = normalDamageTotal + lastNormalDamage; normalHitCount = normalHitCount + 1; }
                }
                lastCritDamage = 0;
                lastNormalDamage = 0;
            }
        } else if (/看起来.*想杀死你！|你扑向/.test(data.msg)) {
            let match = data.msg.match(/看起来(.*)想杀死你！/) || data.msg.match(/你扑向(.*)/);
            if (Array.isArray(match) && match.length > 1) {
                let name = match[1];
                let room = roomData.find(room => room.name && room.name.includes(name));
                if (room) { GameState.fight.fight_id = room.id; }
            }
        } else if ((onekey_fenjie == "开" || onekey_fenjie === true || onekey_fenjie === 'true') && (data.msg.indexOf("你将身上的杂物卖了") >= 0 || data.msg.indexOf("你身上的杂物已经清理干净了") >= 0)) {
            let fjlist = GM_getValue(roleid + "_fenjieList").split(",");
            let pack = GameState.packs.items;
            let cmd = "";
            if (fjlist && fjlist.length > 0) {
                let cmd0 = "";
                let cmd1 = "";
                if (follower_fenjie == '开' || follower_fenjie === true || follower_fenjie === 'true') {
                    cmd0 = `goto home;go northeast;$wait 200;dc {r${fj_sc}} stopstate;$wait 1000;`
                    let fwork = GameState.relation.follower.find(i => i[0].includes(fj_sc))?.[2];
                    cmd1 = `dc {r${fj_sc}} ${fwork};`
                }
                for (let i = 0; i < fjlist.length; i++) {
                    let item = fjlist[i].trim();
                    let match = item.match(/^([\u4e00-\u9fa5]+)(\d*)$|^(\d+)$/);
                    let name = match?.[3] ? null : (match?.[1] || null);
                    let grade = match?.[3] || match?.[2] || null;
                    for (let j = 0; j < pack.length; j++) {
                        if (!pack[j].can_eq || pack[j].locked) continue;
                        let nameMatch = name ? pack[j].name.includes(name) : true;
                        let gradeMatch = grade ? pack[j].grade == grade : true;
                        if (nameMatch && gradeMatch) {
                            let id = pack[j].id;
                            if (follower_fenjie == '开' || follower_fenjie === true || follower_fenjie === 'true') {
                                cmd += `give {r${fj_sc}} ${id};dc {r${fj_sc}} fenjie ${id};$wait 600;`;
                            } else { cmd += `fenjie ${id};$wait 400;`; }
                        }
                    }
                }
                if (!cmd) return;
                if (cmd0) WG.SendCmd(cmd0 + cmd + cmd1);
                else WG.SendCmd(cmd);
            }
        } else if (/你获得了(.*)点经验，(.*)点潜能/.test(data.msg) && (funnycalc == '开' || funnycalc === true || funnycalc === 'true')) {
            let x = data.msg.match(/获得了(.*)点经验，(.*)点潜能/);
            expGained += parseInt(x[1]);
            potGained += parseInt(x[2]);
            $(".content-message pre #totla").remove();
            setTimeout(() => messageAppend(`\n共计获得了<hig>${expGained}</hig>点经验和<hig>${potGained}</hig>点潜能。`, 1, "totla"), 50);
        } else if (/你从武道秘籍中领悟到了/.test(data.text)) {
            Tips();
        } else if (data.msg.indexOf("说：") == -1) {
            if (data.msg.indexOf("只能在战斗中使用。") >= 0 || data.msg.indexOf('这里不允许战斗') != -1 || data.msg.indexOf('没时间这么做') != -1) {
                if (GameState.fight.in_fight) {
                    GameState.fight.in_fight = false;
                    WG.auto_preform("stop");
                    WG.clean_dps();
                }
            }
            if (data.msg.indexOf("加油，加油！！") >= 0) {
                if (GameState.fight.in_fight == false) {
                    GameState.fight.in_fight = true;
                    WG.auto_preform();
                }
            }
            if (data.msg.indexOf("你的内力不够，无法使用") >= 0) {
                if (WG.preform_timer != null) {
                    WG.auto_preform("stop");
                    messageAppend("<hiy>内力不足,停止自动出招", 0)
                }
            }
        }
    },
    handleRoles: function (data) {
        function sendRoles() {
            if (originWindow.source) {
                originWindow.source.postMessage(data.roles, '*');
            } else {
                setTimeout(sendRoles, 1000);
            }
        }
        sendRoles();
        setTimeout(() => {
            let loginnum = getQueryVariable("login")
            if (loginnum) {
                let userList = $('#role_panel > ul > li.content > ul >li');
                for (let uidx = 0; uidx < userList.length; uidx++) {
                    if (loginnum == uidx + 1) {
                        $(userList[uidx]).addClass("select");
                    } else {
                        $(userList[uidx]).removeClass("select");
                    }
                }
                $("li[command=SelectRole]").click()
                return;
            }
        }, 5000);
    }
});