// ============================================================
// task-helper-pfm.js —— TaskHelper 自动施法/状态监控方法
// ------------------------------------------------------------
// 从 helpers.js 拆分出来的战斗/施法相关方法：
//   T.waitpfm / T.startjk / T.stopjk
//   T.stoppfm / T.startpfm / T.stopautopfm / T.startautopfm
// 依赖：TaskHelper 对象（helpers.js 定义）、WG、auto_pfmswitch
// ============================================================
'use strict';

// 等待出招（等 GCD 和技能 CD 都好了再放）
TaskHelper.waitpfm = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    let _flag = true;
    let attemptCount = 0;

    while (_flag) {
        if (!WG.gcd && !WG.cds.get(n)?.iscd) {
            WG.Send("perform " + n);
            attemptCount++;
            if (WG.cds.get(n)?.iscd && _flag) {
                _flag = false;
                WG.SendCmd(cmds);
            }
            if (!GameState.fight.in_fight && _flag) {
                _flag = false;
                WG.SendCmd(cmds);
            }
            if (attemptCount >= 1 && _flag) {
                _flag = false;
                WG.SendCmd(cmds);
            }
        }
        attemptCount++;
        await WG.sleep(350);
    }

};

// 开始状态监控
TaskHelper.startjk = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    ztjk_item = GM_getValue(roleid + "_ztjk", ztjk_item);
    for (var item of ztjk_item) {
        if (item.name == n) {
            item.isactive = 1;
            GM_setValue(roleid + "_ztjk", ztjk_item);
            WG.ztjk_func();
            messageAppend("已注入" + item.name, 1);
            break;
        }
    }
    await WG.sleep(100);
    WG.SendCmd(cmds);
};

// 停止状态监控
TaskHelper.stopjk = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    ztjk_item = GM_getValue(roleid + "_ztjk", ztjk_item);
    for (var item of ztjk_item) {
        if (item.name == n) {
            item.isactive = 0;
            GM_setValue(roleid + "_ztjk", ztjk_item);
            WG.ztjk_func();
            messageAppend("已暂停" + item.name);
            break;
        }
    }
    await WG.sleep(100);
    WG.SendCmd(cmds);
};

// 关闭自动施法
TaskHelper.stoppfm = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    if (auto_pfmswitch == "开" || auto_pfmswitch === true || auto_pfmswitch === 'true') {
        auto_pfmswitch = "关";
        messageAppend("<hio>自动施法</hio>关闭");
        WG.auto_preform("stop");
        WG.auto_perform_button();
    }
    await WG.sleep(100);
    WG.SendCmd(cmds);
};

// 开启自动施法
TaskHelper.startpfm = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    if (auto_pfmswitch == "关" || auto_pfmswitch === false || auto_pfmswitch === 'false') {
        auto_pfmswitch = "开";
        messageAppend("<hio>自动施法</hio>开启");
        WG.auto_preform();
        WG.auto_perform_button();
    }
    await WG.sleep(100);
    WG.SendCmd(cmds);
};

// 停止自动施法（加入黑名单）
TaskHelper.stopautopfm = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    var dellist = n.split(",");
    for (let p of dellist) {
        if (!WG.inArray(p, blackpfm)) {
            blackpfm.push(p);
        }
    }
    console.log("当前自动施法黑名单为:" + blackpfm);
    await WG.sleep(100);
    WG.SendCmd(cmds);
};

// 开启自动施法（从黑名单移除）
TaskHelper.startautopfm = async function (idx = 0, n, cmds) {
    cmds = TaskHelper.recmd(idx, cmds);
    let dellist = n.split(",");
    for (var i = 0; i < blackpfm.length; i++) {
        for (var item of dellist) {
            if (item == blackpfm[i]) {
                blackpfm.baoremove(i);
            }
        }
    }
    console.log("当前自动施法黑名单为:" + blackpfm);
    await WG.sleep(100);
    WG.SendCmd(cmds);
};