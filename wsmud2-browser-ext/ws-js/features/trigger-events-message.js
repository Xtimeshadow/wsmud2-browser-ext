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
// 触发方式：游戏提示信息（系统/战斗/场景等提示）出现时触发
// ⚠ 条件填写：关键字 用 || 或、&& 且、() 括号组合
//
// 变量说明（触发时自动注入源码开头，源码中直接用 (变量名) 引用）：
//   (text)      提示信息内容`;
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
// 触发方式：收到社交消息时触发
// ⚠ 条件填写：关键字 用 || 或、&& 且、() 括号组合
//
// 变量说明（触发时自动注入源码开头，源码中直接用 (变量名) 引用）：
//   (msg)       消息内容`;
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
// 触发方式：游戏里执行 pm list 打开拍卖列表时触发，列表里每条物品触发一次
// ⚠ 条件填写：关键字 用 || 或、&& 且、() 括号组合；物品等级 多个用 | 分隔，如 1|2|3
//
// 变量说明（触发时自动注入源码开头，源码中直接用 (变量名) 引用）：
//   (id)        物品ID
//   (name)      物品名字
//   (grade)     物品等级（1绿 2蓝 3黄 4紫 5橙）
//   (price)     价格
//   (time)      剩余时间（秒）
//
// 示例：只想处理 3 分钟内到期、等级≥4 的物品时，在源码里用 (grade) 和 (time) 做判断即可`;
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
        "名称",["（任意活动）", "挖矿指南", "门派战", "BOSS", "婚礼", "帮派战", "襄阳守城", "龙脉", "仙山"],0,
        function (fromUser, fromGame) {
            // 实现包含匹配逻辑，不要求完全相同
            if (!fromGame || typeof fromGame !== 'string') return false;
            // 选「（任意活动）」时通配所有活动
            if (!fromUser || fromUser === '（任意活动）') return true;
            return fromGame.toLowerCase().includes(fromUser.toLowerCase());
        }
    );
    const key = new InputFilter("关键字", InputFilterFormat.text, "", KeyAssert);
    let filters = [eventname, key];
    const intro = `// 活动事件触发器
// 触发方式：游戏活动（挖矿指南/门派战/BOSS/婚礼/帮派战/襄阳守城/龙脉/仙山）开启时触发
// ⚠ 条件填写：名称 匹配活动类型；关键字 用 || 或、&& 且、() 括号组合
//
// 变量说明（触发时自动注入源码开头，源码中直接用 (变量名) 引用）：
//   (type)     活动类型代码
//   (event)    活动名称
//   (content)  活动关键词
//   (grade)    活动等级
//   (times)    持续时间（当日时间戳，秒）；值为 (小时)*3600+(分钟)*60+(秒)。来自 item[4]（毫秒）；
//               BOSS 未击败/活动未开启时 item[4]=0 → (times) 为 null。
//               （item[5] 是按钮文字，如"前往挑战/领取/进入战场"，不是时间戳）
//   (eventList) 本次事件面板全部活动名称（空格分隔，如 "挖矿指南 BOSS 婚礼"）。用来判断某个活动在不在列表里：
//               源码里用包含关系判断，例如婚礼开着否 = (eventList) 是否包含 "婚礼"；不包含即该活动没开`;
    const t = new TriggerTemplate("活动事件", filters, intro);
    TriggerTemplateCenter.add(t);
    const run = function () {
        WG.add_hook("dialog", data => {
            if (data.dialog != "events" || !Array.isArray(data.items)) return;

            // 遍历所有活动项目
            for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];

            // 本次完整事件列表摘要（空格分隔所有活动名称），供源码判断“某活动在不在列表里”
            const eventList = data.items
                .map(it => (it && it[1] != null ? String(it[1]) : ""))
                .filter(Boolean)
                .join(" ");

            const activityName = item[1]; // 活动名称
            const activityKeyword = item[2]; // 活动关键词

            // 处理时间戳：时间戳统一在第4列(item[4])，单位为毫秒。
            // BOSS 未击败/尚未开启时 item[4] 为 0，此时视为"无持续时间" → (times) 为 null。
            // （第5列 item[5] 是按钮文字，如"前往挑战/领取/进入战场"，不是时间戳；判定是否 BOSS 应看 item[0] 是否含 "boss"）
            let timestampStr = null;
            if (item[4] != null && Number(item[4]) > 0) {
                const fullTimestamp = Number(item[4]); // 原始毫秒时间戳
                const date = new Date(fullTimestamp);
                if (!isNaN(date.getTime())) {
                    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    // 计算从当天0:00开始经过的毫秒数，转为秒并向下取整
                    const timeSinceMidnight = fullTimestamp - todayStart.getTime();
                    timestampStr = Math.max(0, Math.floor(timeSinceMidnight / 1000)).toString();
                }
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
            params["eventList"] = eventList;
            // 创建并发送通知
            const n = new Notification("活动事件", params);
            NotificationCenter.post(n);

            }
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();