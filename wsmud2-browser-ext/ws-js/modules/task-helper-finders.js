// ============================================================
// task-helper-finders.js —— TaskHelper 查找相关方法
// ------------------------------------------------------------
// 从 helpers.js 拆分出来的查找/装备/使用功能：
//   T.findItem / T._findItem / T.findPlayerByName / T.pname
//   T.killw / T.eqw / T.usezml / T.usetz
// 依赖：TaskHelper 对象（helpers.js 定义）、WG、GameState、roomData
// ============================================================
'use strict';

// 查找物品（内部方法，通过 dialog hook 监听）
TaskHelper._findItem = async function (itemname, callback) {
    console.log("finditem" + itemname);
    TaskHelper.findhook = WG.add_hook("dialog", async function (data) {
        if (data.items) {
            for (let item of data.items) {
                if (item.name == itemname) {
                    callback(item.id);
                    WG.remove_hook(TaskHelper.findhook);
                }
            }
            callback("");
        }
        WG.remove_hook(TaskHelper.findhook);
    });

    WG.Send("pack");
};

// 按玩家名查找（pname 是别名）
TaskHelper.pname = function (idx = 0, n, cmds) {
    TaskHelper.findPlayerByName(idx, n, cmds);
};
TaskHelper.findPlayerByName = function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx - 1, cmds);
    if (cmds.indexOf(",") >= 0) {
        cmds = cmds.split(",");
    } else {
        cmds = cmds.split(";");
    }
    let p = cmds[0].split("$")[0];
    cmds = TaskHelper.recmd(0, cmds);
    p = p.replaceAll("-", " ");
    if (p[p.length - 1] == " ") {

        p = p.substring(0, p.length - 1)
    }
    console.log("findPlayerByName" + n);

    for (let i = 0; i < roomData.length; i++) {
        if (roomData[i].name && roomData[i].name.indexOf(n) >= 0) {
            WG.Send(p + " " + roomData[i].id);
        }
    }
    WG.SendCmd(cmds);
};

// 按物品名查找
TaskHelper.findItem = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx - 1, cmds);
    if (cmds.indexOf(",") >= 0) {
        cmds = cmds.split(",");
    } else {
        cmds = cmds.split(";");
    }
    let p = cmds[0].split(" ")[0];
    cmds = TaskHelper.recmd(0, cmds);
    console.log("finditem" + n);

    WG.Send("pack");
    for (let item of GameState.packs.items) {
        if (item.name == n) {
            if (p == "fenjie" || p == "drop") {
                if (item.name.indexOf("★") >= 0) {
                    messageAppend("高级物品 ,不分解");
                    continue;
                }
            }
            WG.SendCmd(p + " " + item.id);
        }
    }

    WG.SendCmd(cmds);
};

// 杀怪（通过 itemremove hook 监听）
TaskHelper.killhook = undefined;
TaskHelper.killw = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    var killid = "";
    for (let i = 0; i < roomData.length; i++) {
        if (roomData[i].name && roomData[i].name.indexOf(n) >= 0) {
            killid = roomData[i].id;
        }
    }
    TaskHelper.killhook = WG.add_hook('itemremove', function (data) {
        if (data.id == killid) {
            WG.SendCmd(cmds);
            WG.remove_hook(TaskHelper.killhook);
            TaskHelper.killhook = undefined;
        }
    });
    WG.SendCmd("kill " + killid);
};

// 穿装备（通过 dialog hook 监听）
TaskHelper.eqhook = undefined;
TaskHelper.eqw = async function (idx = 0, n, cmds) {
    var pcmds = TaskHelper.recmd(idx, cmds);
    if (n.indexOf("<") >= 0) {
        TaskHelper._findItem(n, async function (id) {
            let p_itemid = id;
            let p_flag = true;
            if (p_itemid == "") {
                p_flag = false;
                WG.SendCmd(pcmds);
                return;
            }
            TaskHelper.eqhook = WG.add_hook('dialog', function (data) {
                if (data.eq == 0 && data.id == p_itemid) {
                    p_flag = false;
                    WG.SendCmd(pcmds);
                    WG.remove_hook(TaskHelper.eqhook);
                    TaskHelper.eqhook = undefined;
                }
            });
            while (p_flag) {
                WG.Send("pack");
                WG.SendCmd('eq ' + p_itemid);
                await WG.sleep(1000);
            }

        });
    } else {
        let p_itemid = n;
        let p_flag = true;
        if (p_itemid == "") {
            p_flag = false;
            WG.SendCmd(pcmds);
            return;
        }
        TaskHelper.eqhook = WG.add_hook(['text', 'dialog'], function (data) {
            if (data.type == 'dialog') {
                if (data.eq == 0 && data.id == p_itemid) {
                    p_flag = false;
                    WG.SendCmd(pcmds);
                    WG.remove_hook(TaskHelper.eqhook);
                    TaskHelper.eqhook = undefined;
                }
            }
            if (data.type == 'text') {
                if (data.msg.indexOf("你要装备什么") >= 0) {
                    p_flag = false;
                    WG.SendCmd(pcmds);
                    WG.remove_hook(TaskHelper.eqhook);
                    TaskHelper.eqhook = undefined;
                }
            }
        });
        while (p_flag) {
            WG.Send("pack");
            WG.SendCmd('eq ' + p_itemid);
            await WG.sleep(1000);
        }
    }
};

// 使用自命令列表中的技能组合
TaskHelper.usezml = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    zml = GM_getValue(roleid + "_zml", zml);
    for (var zmlitem of zml) {
        if (zmlitem.name == n) {
            await WG.zmlfire(zmlitem);
        }
    }
    await WG.sleep(100);
    WG.SendCmd(cmds);
};

// 使用扩展脚本
TaskHelper.usetz = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    let tz = GM_getValue("extends");
    for (var tzitem of tz) {
        if (tzitem.name == n) {
            await WG.sleep(100);
            let cmd = tzitem.content;
            SCRIPT.run(cmd);
        }
    }
};