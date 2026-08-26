// ============================================================
// trigger-events-combat.js —— 触发器系统·战斗/死亡/时辰/技能
// ------------------------------------------------------------
// 战斗状态切换、死亡状态改变、时辰已到、技能释放/冷却结束
// ============================================================
'use strict';


//---------------------------------------------------------------------------
//  combat
//---------------------------------------------------------------------------

(function () {
    const type = new SelectFilter("类型", ["进入战斗", "脱离战斗"], 0);
    let filters = [type];
    const intro = "// 战斗状态切换触发器";
    const t = new TriggerTemplate("战斗状态切换", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("combat", data => {
            let params = null;
            if (data.start != null && data.start == 1) {
                params = { "类型": "进入战斗" };
            } else if (data.end != null && data.end == 1) {
                params = { "类型": "脱离战斗" };
            }
            const n = new Notification("战斗状态切换", params);
            NotificationCenter.post(n);
        });
        WG.add_hook("text", function (data) {
            if (data.msg == null) return;
            if (data.msg.indexOf('只能在战斗中使用') != -1 || data.msg.indexOf('这里不允许战斗') != -1 || data.msg.indexOf('没时间这么做') != -1) {
                const params = { "类型": "脱离战斗" };
                const n = new Notification("战斗状态切换", params);
                NotificationCenter.post(n);
            }
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();


//---------------------------------------------------------------------------
//  die
//---------------------------------------------------------------------------

(function () {
    const type = new SelectFilter("类型", ["已经死亡", "已经复活"], 0);
    let filters = [type];
    const intro = "// 死亡状态改变触发器";
    const t = new TriggerTemplate("死亡状态改变", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("die", data => {
            const value = data.relive == null ? "已经死亡" : "已经复活";
            let params = {
                "类型": value
            };
            const n = new Notification("死亡状态改变", params);
            NotificationCenter.post(n);
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();

//---------------------------------------------------------------------------
//  time
//---------------------------------------------------------------------------

(function () {
    // 【2026-08-22】时辰已到支持"任意/多选"自由输入：
    // 时/分/秒 改为文本输入框，填单个数字则精确匹配，填 1|2|3 多选，留空或填 * 表示"任意"。
    // 例：分=0、秒=0、时留空(*) → 每个整点触发一次，无需建 24 个触发器。
    const TimeReachedAssert = function (lh, rh) {
        if (lh == null || /^\s*$/.test(String(lh)) || /^\s*\*\s*$/.test(String(lh))) return true;
        return String(lh).split("|").indexOf(String(rh)) != -1;
    };
    const hour = new InputFilter("hour", InputFilterFormat.text, "", TimeReachedAssert);
    hour.description("时");
    const minute = new InputFilter("minute", InputFilterFormat.text, "", TimeReachedAssert);
    minute.description("分");
    const second = new InputFilter("second", InputFilterFormat.text, "", TimeReachedAssert);
    second.description("秒");
    let filters = [hour, minute, second];
    const intro = `// 时辰已到触发器
// ⚠ 填写提示：时/分/秒 留空或填 * = 任意；填 1|2|3 = 多个可选；填 5 = 仅 5；例（每个整点）：时留空、分=0、秒=0`;
    const t = new TriggerTemplate("时辰已到", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        // 【2026-08-24】"时辰已到"时钟改为【双源冗余】，确保服务器/后台/深度节流下到点绝不出错：
        //   ① Web Worker 时钟 —— worker 定时器后台不被节流，消息投递也不受节流；
        //   ② 主线程对齐定时器 —— 作为兜底基准（服务器前台常驻/无后台时同样精确）。
        //   两个来源都调用同一个 settle()：它按真实 wall-clock 去重投递 + 无条件回补漏秒，
        //   因此即便其中一路失效（如 worker 被 CSP/环境禁用，或主线程被节流），另一路仍保证不漏。
        let lastBoundary = null;   // 上一次已投递的整秒边界（epoch 毫秒）
        function postSecond(ms) {
            const d = new Date(ms);
            const n = new Notification("时辰已到", {
                "hour": d.getHours(),
                "minute": d.getMinutes(),
                "second": d.getSeconds()
            });
            NotificationCenter.post(n);
        }
        function settle(nowMs) {
            const curBound = Math.floor(nowMs / 1000) * 1000;
            if (lastBoundary == null) {
                lastBoundary = curBound;
                postSecond(curBound);
            } else if (curBound > lastBoundary) {
                // 无条件回补自上次投递以来漏掉的每个整秒，无论冻结/卡顿多久都不漏
                for (let b = lastBoundary + 1000; b <= curBound; b += 1000) {
                    postSecond(b);
                }
                lastBoundary = curBound;
            }
        }
        // 来源②：主线程对齐定时器（兜底基准，始终运行）
        (function mainClock() {
            try { settle(Date.now()); } catch (e) { }
            const now = Date.now();
            const nextBoundary = (Math.floor(now / 1000) * 1000) + 1000;
            setTimeout(function () { mainClock(); }, nextBoundary + 1 - now);
        })();
        // 来源①：Web Worker 时钟（抗后台节流；失败不影响来源②）
        try {
            const url = URL.createObjectURL(new Blob(
                ["setInterval(function(){postMessage(1);},250);"],
                { type: "application/javascript" }
            ));
            const worker = new Worker(url);
            worker.onmessage = function () { try { settle(Date.now()); } catch (e) { } };
            window.__wsmud_time_worker = worker;   // 保活引用，防 worker 被 GC 回收
        } catch (e) { /* 忽略：主线程时钟已可独立工作 */ }
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();

//---------------------------------------------------------------------------
//  dispfm
//---------------------------------------------------------------------------

(function () {
    const sid = new InputFilter("技能id", InputFilterFormat.text, "", ContainAssert);
    let filters = [sid];
    const intro = `// 技能释放触发器
// 技能id：(id)
// 出招时间：(rtime)
// 冷却时间：(distime)
// ⚠ 填写提示：技能id 多个用单个 | 分隔，如 100|200`;
    const t = new TriggerTemplate("技能释放", filters, intro);
    TriggerTemplateCenter.add(t);

    const sid1 = new InputFilter("技能id", InputFilterFormat.text, "", ContainAssert);
    let filters1 = [sid1];
    const intro1 = `// 技能冷却结束触发器
// 技能id：(id)
// ⚠ 填写提示：技能id 多个用单个 | 分隔，如 100|200`;
    const t1 = new TriggerTemplate("技能冷却结束", filters1, intro1);
    TriggerTemplateCenter.add(t1);

    const run = function () {
        WG.add_hook("dispfm", data => {
            if (data.id == null || data.distime == null || data.rtime == null) return;
            let params = {
                "技能id": data.id
            };
            params["id"] = data.id;
            params["rtime"] = data.rtime;
            params["distime"] = data.distime;
            const n = new Notification("技能释放", params);
            NotificationCenter.post(n);

            setTimeout(_ => {
                let params = {
                    "技能id": data.id
                };
                params["id"] = data.id;
                const n = new Notification("技能冷却结束", params);
                NotificationCenter.post(n);
            }, data.distime);
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();