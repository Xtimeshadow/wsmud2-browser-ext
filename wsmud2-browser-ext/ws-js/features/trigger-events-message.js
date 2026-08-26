// ============================================================
// trigger-events-message.js —— 触发器系统·提示/社交/拍卖/活动
// ------------------------------------------------------------
// 新提示信息、社交消息、拍卖查询、活动事件
// ============================================================
'use strict';

//---------------------------------------------------------------------------
//  text
//---------------------------------------------------------------------------

(function () {
    const name = new InputFilter("关键字", InputFilterFormat.text, "", KeyAssert);
    let filters = [name];
    const intro = `// 新提示信息触发器
// 提示信息：(text)
// ⚠ 填写提示：关键字 用 || 或、&& 且、() 括号组合`;
    const t = new TriggerTemplate("新提示信息", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("text", data => {
            if (data.msg == null) return;
            let params = {
                "关键字": data.msg,
            };
            params["text"] = data.msg.split('\n').join('');
            const n = new Notification("新提示信息", params);
            NotificationCenter.post(n);
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();

    //---------------------------------------------------------------------------
//  message
//---------------------------------------------------------------------------

(function () {
    const name = new InputFilter("关键字", InputFilterFormat.text, "", KeyAssert);
    let filters = [name];
    const intro = `// 社交消息触发器
// 社交消息：(msg)
// ⚠ 填写提示：关键字 用 || 或、&& 且、() 括号组合`;
    const t = new TriggerTemplate("社交消息", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("dialog", data => {
            if (data.dialog != "message" ||data.id ||data.items) return;

            let params = {
                "关键字": data.message.content,
            };
            params["msg"] = data.message.content;
            const n = new Notification("社交消息", params);
            NotificationCenter.post(n);
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();
//---------------------------------------------------------------------------
//  auction
//---------------------------------------------------------------------------
(function () {
    const key = new InputFilter("关键字", InputFilterFormat.text, "", KeyAssert);
    const grade = new InputFilter("物品等级", InputFilterFormat.text, "", ContainAssert);
    let filters = [key, grade];
    const intro = `// 拍卖查询触发器
// 拍卖需要使用pm list来触发
// ⚠ 填写提示：关键字 用 || 或、&& 且、() 括号组合；物品等级 多个用单个 | 分隔，如 1|2|3`;
// 物品id：(id)
// 物品名字：(name)
// 物品等级：(grade)
// 价格：(price)
// 剩余时间：(time)`;
    const t = new TriggerTemplate("拍卖查询", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("dialog", data => {
            if (data.dialog != "pm" || !Array.isArray(data.list)) return;

            // 遍历拍卖列表中的所有物品
            for (let i = 0; i < data.list.length; i++) {
                const item = data.list[i];

                // 提取原始数据
                const id = item[0];
                const rawName = item[1];
                const price = item[2];
                const rawTime = item[3];

                // 处理时间：转换为秒并取整
                const time = Math.floor(rawTime / 1000);

                // 处理物品名称和等级
                let name = "未知物品";
                let gradeNum = 0;
                
                // 从rawName中提取名称和等级
                if (typeof rawName === 'string') {
                    // 处理物品名称
                    const nameMatch = rawName.match(/<\w{3}>([^<]+)<\/\w{3}>/) || rawName.match(/<\w{3}>([^<]+)/);
                    if (nameMatch && nameMatch[1]) {
                        name = nameMatch[1].trim();
                    } else {
                        // 如果没有找到标签，使用原始文本
                        name = rawName.replace(/^\d+份/, '').trim();
                    }

                    // 处理物品等级（颜色标签转数字）
                    const gradeMap = {
                        '<hig>': '1', // 绿色
                        '<hic>': '2', // 蓝色
                        '<hiy>': '3', // 黄色
                        '<HIZ>': '4', // 紫色
                        '<hio>': '5'  // 橙色
                    };

                    for (const [tag, num] of Object.entries(gradeMap)) {
                        if (rawName.includes(tag)) {
                            gradeNum = num;
                            break;
                        }
                    }
                }

                // 构建参数对象
                let params = {
                    "关键字": name,
                    "物品等级": gradeNum
                };
                params["id"] = id;
                params["name"] = name;
                params["grade"] = gradeNum;
                params["price"] = price;
                params["time"] = time;

                // 发送通知
                const n = new Notification("拍卖查询", params);
                NotificationCenter.post(n);
            }
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();


//---------------------------------------------------------------------------
//  dialog events
//---------------------------------------------------------------------------
(function () {
    const eventname = new SelectFilter(
        "名称",["挖矿指南", "门派战", "BOSS", "婚礼", "帮派战", "襄阳守城", "龙脉", "仙山"],0,
        function (fromUser, fromGame) {
            // 实现包含匹配逻辑，不要求完全相同
            if (!fromGame || typeof fromGame !== 'string') return false;
            return fromGame.toLowerCase().includes(fromUser.toLowerCase());
        }
    );
    const key = new InputFilter("关键字", InputFilterFormat.text, "", KeyAssert);
    let filters = [eventname, key];
    const intro = `// 活动事件触发器
// 活动类型代码：(type);
// 活动名称：(event);
// 活动关键词：(content);
// 活动等级：(grade);
// 活动持续时间：当日时间戳(times);值为：(小时)*3600+(分钟)*60+(秒)
// ⚠ 填写提示：关键字 用 || 或、&& 且、() 括号组合`;
    const t = new TriggerTemplate("活动事件", filters, intro);
    TriggerTemplateCenter.add(t);
    const run = function () {
        WG.add_hook("dialog", data => {
            if (data.dialog != "events" || !Array.isArray(data.items)) return;

            // 遍历所有活动项目
            for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];

            const activityName = item[1]; // 活动名称
            const activityKeyword = item[2]; // 活动关键词

            // 处理时间戳
            let timestampStr = "";
            if (activityName === "boss" && item[4] !== undefined && typeof item[4] !== "number" && item[5] !== undefined) {
                const fullTimestamp = item[5]; // 原始毫秒时间戳
                const date = new Date(fullTimestamp);
                const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                // 计算从当天0:00开始的时间差（毫秒），转换为秒并向下取整
                const timeSinceMidnight = fullTimestamp - todayStart.getTime();
                timestampStr = Math.floor(timeSinceMidnight / 1000).toString();
            } else if (item[4]) {
                // 新的时间戳处理逻辑：计算从本日0:00开始的时间戳（毫秒），转换为秒并向下取整
                const fullTimestamp = item[4]; // 原始毫秒时间戳
                const date = new Date(fullTimestamp);
                const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                // 计算从当天0:00开始的时间差（毫秒），转换为秒并向下取整
                const timeSinceMidnight = fullTimestamp - todayStart.getTime();
                timestampStr = Math.floor(timeSinceMidnight / 1000).toString();
            }

            // 构建参数对象
            let params = {
                "名称": activityName,
                "关键字": activityKeyword,
            };

            // 添加类型ID（如果存在）
            params["type"] = item[0];
            params["grade"] = item[3];
            params["times"] = timestampStr;
            params["content"] = activityKeyword;
            params["event"] = activityName;
            // 创建并发送通知
            const n = new Notification("活动事件", params);
            NotificationCenter.post(n);

            }
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();