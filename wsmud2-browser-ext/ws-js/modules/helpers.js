// ============================================================
// helpers.js —— 自命令函数库 TaskHelper（别名 T）核心
// ------------------------------------------------------------
// 这是 TaskHelper 的核心文件，包含基础命令处理、等待、通用动作。
// 查找/装备相关方法 → task-helper-finders.js
// 自动施法/状态监控相关方法 → task-helper-pfm.js
// 你在自命令里写 T.函数名 就会调到这里：
//   T.wait / T.batwait           等待（含"等待某个条件"）
//   T.killall / T.getall / T.to  全杀/全捡/前往
//   T.roll / T.cls / T.syso      掷骰子/清屏/输出
//   T.stop / T.close / T.tts / T.beep / T.music  杂项
// ============================================================
'use strict';

// 助手函数
const TaskHelper = {
    //private
    _recmd: function (cmds) {
        if (cmds) {
            cmds = cmds instanceof Array ? cmds : cmds.split(';');
            cmds.baoremove(0);
            cmds = cmds.join(";");
            return cmds;
        } else {
            return "";
        }
    },
    recmd: function (idx, cmds) {
        for (let i = 0; i < idx + 1; i++) {
            cmds = TaskHelper._recmd(cmds);
        }
        return cmds;
    },
    // 等待指定毫秒
    wait: async function (idx = 0, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        console.log("延时:" + n + "ms,延时触发:" + cmds);
        await WG.sleep(parseInt(n));
        WG.SendCmd(cmds);
    },
    // 战斗中等待
    batwait: async function (idx = 0, n, cmds) {
        if (GameState.fight.in_fight) {
            cmds = TaskHelper.recmd(idx, cmds);
            console.log("延时:" + n + "ms,延时触发:" + cmds);
            await WG.sleep(parseInt(n));
            WG.SendCmd(cmds);
        }
    },
    // 前往光明之巅
    gogzm: async function () {
        WG.SendCmd("jh fam 9 start;go enter;go up;")
        await WG.sleep(1000);
        var ltId = "";
        for (let i = 0; i < roomData.length; i++) {
            if (roomData[i].name && roomData[i].name.indexOf("疯癫的老头") >= 0) {
                ltId = roomData[i].id
            }
        }
        WG.SendCmd("ggdl " + ltId + ";go north;go north;go north;go north;$wait 250;go north;go north;$wait 250;look shi;tiao1 shi;tiao1 shi;tiao2 shi;$wait 250;jumpdown;")
    },
    // 前往道德不板
    godddb: async function () {
        WG.SendCmd("jh fam 9 start;go enter;go up;")
        await WG.sleep(1000);
        var ltId = "";
        for (let i = 0; i < roomData.length; i++) {
            if (roomData[i].name && roomData[i].name.indexOf("疯癫的老头") >= 0) {
                ltId = roomData[i].id
            }
        }
        WG.SendCmd("ggdl " + ltId + ";go north;go north;go north;go north;$wait 250;go north;go down;")
    },
    // 全杀
    killall: async function (idx = 0, n = null, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.kill_all();
        await WG.sleep(100);
        WG.SendCmd(cmds);
    },
    // 全捡
    getall: async function (idx = 0, n = null, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.get_all();
        await WG.sleep(100);
        WG.SendCmd(cmds);
    },
    // 前往指定地点
    to: async function (idx = 0, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.go(n);
        await WG.sleep(100);
        WG.SendCmd(cmds);
    },
    // 自动打坐
    zdwk: async function (idx = 0, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.zdwk();
        await WG.sleep(100);
        WG.SendCmd(cmds);
    },
    // 停止打坐
    rzdwk: async function (idx = 0, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.zdwk("", false);
        await WG.sleep(100);
        WG.SendCmd(cmds);
    },
    // 右键菜单
    callcontextMenu: function (idx = 0, n, cmds) {
        $('.container').contextMenu({
            x: 1,
            y: 1
        })
    },
    // 停止所有自动
    stopallauto: function (idx = 0, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.stopAllAuto();
        messageAppend("暂停自动喜宴及自动BOSS", 1);
        WG.SendCmd(cmds);
    },
    // 恢复所有自动
    startallauto: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.reSetAllAuto();
        messageAppend("暂停自动喜宴及自动BOSS", 1);
        WG.SendCmd(cmds);
    },
    // 掷骰子
    roll: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        if (n == 1) {
            WG.SendCmd("pty " + Math.random() * 100);
        } else if (n == 2) {
            WG.SendCmd("chat " + Math.random() * 100);
        } else if (n == 3) {
            WG.SendCmd("say " + Math.random() * 100);
        }
        WG.SendCmd(cmds);
    },
    // 清 DPS 统计
    clsSakada: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.clean_dps();
        WG.SendCmd(cmds);
    },
    // 清屏
    cls: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        messageClear();
        WG.SendCmd(cmds);
    },
    // 输出消息
    syso: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        messageAppend(n);
        WG.SendCmd(cmds);
    },
    // 停止定时器
    stop: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        WG.timer_close();
        WG.SendCmd(cmds);
    },
    // 关闭对话框
    close: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        KEY.dialog_close();
        WG.SendCmd(cmds);
    },
    // TTS 语音
    tts: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        FakerTTS.playtts(n);
        WG.SendCmd(cmds);
    },
    // 蜂鸣
    beep: async function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        Beep();
        WG.SendCmd(cmds);
    },
    // 播放音乐
    music: function (idx, n, cmds) {
        cmds = TaskHelper.recmd(idx, cmds);
        var music = new MusicBox({
            loop: false,
            musicText: '6 - - 5 - 3 2 - 1 - - - 3 - - 2 1 - ·6 ·5 - - - ·5 - ·6 - ·5 - ·6 - 1 - - 2 - 3 5 6 - - 3 2 1 - 2',
            autoplay: 6,
            type: 'triangle',
            duration: 2
        });
        WG.SendCmd(cmds);
    }
};
const T = TaskHelper;