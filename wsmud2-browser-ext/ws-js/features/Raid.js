// ============================================================
// Raid.js —— Raid 脚本引擎（整个扩展最大的文件，6.5K+ 行）
// ------------------------------------------------------------
// 功能：一套"流程脚本"的编译器 + 解释器。
//   你在游戏里输入 // 开头或 @ 开头的命令（如 kill 木头人），
//   它会把命令/脚本编译成内部指令，然后逐条执行（战斗、寻路、等状态…）。
//
// 对外主要接口（挂在全局）：
//   ToRaid.perform(源码, 名称)  —— 执行一段 Raid 流程脚本（万能入口）
//   ToRaid.menu                 —— 显示 Raid 工具栏
//   Role                        —— 角色状态（hp/mp/物品/武功，findItem/renew/cleanBag 等）
//   内部类：Performer（执行器）、CmdExecuteCenter（命令分派表）、
//           WorkflowConfig（流程管理）、Server（云端分享）、
//           DungeonsShortcuts（一键妖塔/扫荡）
//
// 常用命令（游戏里输入）：@kill 名字 自动杀怪、@perform 自动放技能、
//   @liaoshang 疗伤、@dazuo 打坐、@renew 恢复、@cleanBag 清背包、
//   @fb 自动副本、@wait 等待、@until 直到、@print 输出、@js 执行JS、
//   @stop 停止、@toolbar 工具栏 等几十个。
//
// 想改：内置副本流程文案（Dungeons）、系统命令间隔（__systemCmdDelay=1500）、
//   恢复流程（Role.renew：回武庙→疗伤→打坐）、妖塔扫荡默认参数 → 在本文件搜索。
// 注意：本文件为大文件（6.5K+ 行），重构时仅做安全格式化，不改变变量名与逻辑行为。
// ============================================================
// Raid.js
// 武神传说 MUD 副本/任务自动化核心：源码编译器、命令执行器、副本快捷脚本、
// 角色与房间状态、对话框/任务/事件列表、襄阳战等模块。
// 注意：本文件为大文件（6.5K+ 行），重构时仅做安全格式化，不改变变量名与逻辑行为。
(function () {

    'use strict';

    /***********************************************************************************\
        Ready
    \***********************************************************************************/

    const ToRaid = {
        menu: RaidUI.showToolbar,

        perform: function (content, name, log) {
            const realName = name ? name : "第三方调用";
            ManagedPerformerCenter.start(realName, content, log);
        },

        existAutoDungeon: function (params) {
            return AutoDungeonName(params) != null;
        },

        shareTrigger: function (triggerData) {
            RaidUI._share("触发", triggerData);
        }
    };

    $(document).ready(function () {
        __init__();
        if (WG == undefined || WG == null) {
            setTimeout(__init__, 300);
        }
    });

    function __init__() {
        WG = unsafeWindow.WG;
        if (WG == undefined || WG == null) {
            setTimeout(() => { __init__() }, 300);
            return;
        }
        messageAppend = unsafeWindow.messageAppend;
        messageClear = unsafeWindow.messageClear;
        // TaskHelper/LayerHelper 已全局声明, 无需重复赋值

        unsafeWindow.ToRaid = ToRaid;
        unsafeWindow.Role = Role;

        Role.init();
        Room.init();
        SystemTips.init();
        MsgTips.init();
        DialogList.init();
        TaskList.init();
        EventList.init();
        Xiangyang.init();
    }
})();