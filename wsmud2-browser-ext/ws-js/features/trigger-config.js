// ============================================================
// trigger-config.js —— 触发器系统·配置导入导出与初始化
// ------------------------------------------------------------
// 提供 TriggerConfig（导入/导出所有 GM 配置）、
// 页面就绪启动逻辑、__init__ 初始化函数、
// 以及对外暴露 TriggerUI / TriggerConfig / TriggerCenter。
// ============================================================
'use strict';

/***********************************************************************************\
    Trigger Config
\***********************************************************************************/

const TriggerConfig = {
    get: function () {
        let all = {};
        let keys = GM_listValues();
        keys.forEach(key => {
            if (key != "roles") {
                all[key] = GM_getValue(key);
            }
        });
        return all;
    },
    set: function (config) {
        for (const key in config) {
            GM_setValue(key, config[key]);
        }
        TriggerCenter.reload();
    }
};

/***********************************************************************************\
    Ready
\***********************************************************************************/

let Running = false;

$(document).ready(function () {
    __init__();
    if (WG == undefined || WG == null || ToRaid == undefined || ToRaid == null) {
        setTimeout(__init__, 300);
    }
});

function __init__() {
    WG = unsafeWindow.WG;

    messageAppend = unsafeWindow.messageAppend;
    messageClear = unsafeWindow.messageClear;
    ToRaid = unsafeWindow.ToRaid;

    if (WG == undefined || WG == null || ToRaid == undefined || ToRaid == null) {
        setTimeout(() => { __init__() }, 300);
        return;
    }
    Role = unsafeWindow.Role;

    unsafeWindow.TriggerUI = TriggerUI;
    unsafeWindow.TriggerConfig = TriggerConfig;
    unsafeWindow.TriggerCenter = TriggerCenter;

    WG.add_hook("login", function (data) {
        if (Running) return;
        Running = true;

        TriggerCenter.run();
        MonitorCenter.run();
    });
}