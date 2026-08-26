// ============================================================
// trigger-events-buff.js —— 触发器系统·Buff状态改变事件
// ------------------------------------------------------------
// Buff 状态变化钩子（新增/移除/层数刷新）
// ============================================================
'use strict';

/***********************************************************************************\
    WSMUD
\***********************************************************************************/

// WG/messageAppend/messageClear/ToRaid/Role 在其它模块中已声明


//---------------------------------------------------------------------------
//  status
//---------------------------------------------------------------------------

(function () {
    const type = new SelectFilter("改变类型", ["新增", "移除", "层数刷新"], 0);
    const value = new InputFilter("BuffId", InputFilterFormat.text, "weapon", ContainAssert);
    const target = new SelectFilter("触发对象", ["自己", "他人"], 0);
    let filters = [type, value, target];
    const intro = `// Buff状态改变触发器
// 触发对象id：(id)
// buff的sid：(sid)
// buff层数：(count)
// duration持续时间：(duration);
// buff的名字：(name)
// ⚠ 填写提示：多个 BuffId 用单个 | 分隔，如 weapon|sword`;
    const t = new TriggerTemplate("Buff状态改变", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        const post = function (data, sid, type) {
            let params = {
                "改变类型": type,
                "BuffId": sid,
                "触发对象": data.id == Role.id ? "自己" : "他人"
            };
            params["id"] = data.id;
            params["sid"] = sid;
            params["count"] = 0;
            params["duration"] = 0;
            params["name"] = data.name;
            if (data.count != null) params["count"] = data.count;
            if (data.duration != null) params["duration"] = data.duration;
            const n = new Notification("Buff状态改变", params);
            NotificationCenter.post(n);
        };
        WG.add_hook("status", data => {
            if (data.action == null || data.id == null || data.sid == null) return;
            const types = {
                "add": "新增",
                "remove": "移除",
                "refresh": "层数刷新"
            };
            const type = types[data.action];
            if (type == null) return;
            if (data.sid instanceof Array) {
                for (const s of data.sid) {
                    post(data, s, type);
                }
            } else {
                post(data, data.sid, type);
            }
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();