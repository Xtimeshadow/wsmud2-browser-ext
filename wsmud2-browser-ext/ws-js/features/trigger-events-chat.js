// ============================================================
// trigger-events-chat.js —— 触发器系统·聊天/人物/物品事件
// ------------------------------------------------------------
// 新聊天信息、人物刷新、物品拾取
// ============================================================
'use strict';

//---------------------------------------------------------------------------
//  msg
//---------------------------------------------------------------------------

(function () {
    const channel = new SelectFilter(
        "频道",
        ["全部", "世界", "队伍", "门派", "全区", "帮派", "谣言", "系统"],
        0,
        function (fromUser, fromGame) {
            if (fromUser == "全部") return true;
            return fromUser == fromGame;
        }
    );
    const talker = new InputFilter("发言人", InputFilterFormat.text, "", ContainAssert);
    const pass_talker = new InputFilter("忽略发言人", InputFilterFormat.text, "", ContainReverseAssert);
    const key = new InputFilter("关键字", InputFilterFormat.text, "", KeyAssert);
    let filters = [channel, talker, pass_talker, key];
    const intro = `// 新聊天信息触发器
// 聊天信息内容：(content)
// 发言人：(name)
// 发言人id：(id)
// 频道：(channel)
// ⚠ 填写提示：发言人/忽略发言人 多个用单个 | 分隔；关键字 用 || 或、&& 且、() 括号组合`;
    const t = new TriggerTemplate("新聊天信息", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("msg", data => {
            if (data.ch == null || data.content == null) return;
            const types = {
                "chat": "世界",
                "tm": "队伍",
                "fam": "门派",
                "es": "全区",
                "pty": "帮派",
                "rumor": "谣言",
                "sys": "系统"
            };
            const channel = types[data.ch];
            if (channel == null) return;
            const name = data.name == null ? "无" : data.name;
            const id = data.uid == null ? null : data.uid;
            const datacontent = data.content.replace(/\n/g, "")
            let params = {
                "频道": channel,
                "发言人": name,
                "关键字": data.content,
                "忽略发言人": name
            };
            params["content"] = datacontent;
            params["name"] = name;
            params["id"] = id;
            params["channel"] = channel;
            const n = new Notification("新聊天信息", params);
            NotificationCenter.post(n);
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();

//---------------------------------------------------------------------------
//  item add
//---------------------------------------------------------------------------

(function () {
    const name = new InputFilter("人物名称", InputFilterFormat.text, "", KeyAssert);
    name.description("人名关键字");
    let filters = [name];
    const intro = `// 人物刷新触发器
// 刷新人物id：(id)
// 刷新人物名称：(name)
// ⚠ 填写提示：人名关键字 用 || 或、&& 且、() 括号组合，如 张无忌 || 张三丰`;
    const t = new TriggerTemplate("人物刷新", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("itemadd", data => {
            if (data.name == null || data.id == null) return;
            let params = {
                "人物名称": data.name,
            };
            params["id"] = data.id;
            params["name"] = data.name;
            const n = new Notification("人物刷新", params);
            NotificationCenter.post(n);
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();

//---------------------------------------------------------------------------
//  dialog pack
//---------------------------------------------------------------------------

(function () {
    const name = new InputFilter("名称关键字", InputFilterFormat.text, "", KeyAssert);
    let filters = [name];
    const intro = `// 物品拾取触发器
// 拾取物品id：(id)
// 拾取物品名称：(name)
// 拾取物品数量：(count)
// 物品品质：(quality)  值：白、绿、蓝、黄、紫、橙、红、未知
// ⚠ 填写提示：名称关键字 用 || 或、&& 且、() 括号组合，如 玄铁剑 || 倚天剑`;
    const t = new TriggerTemplate("物品拾取", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("dialog", function (data) {
            if (data.dialog != "pack" || data.id == null || data.name == null || data.count == null || data.remove != null) return;
            let params = {
                "名称关键字": data.name,
            };
            params["id"] = data.id;
            params["name"] = data.name;
            params["count"] = data.count;
            let quality = "未知";
            const tag = /<\w{3}>/.exec(data.name)[0];
            const tagMap = {
                "<wht>": "白",
                "<hig>": "绿",
                "<hic>": "蓝",
                "<hiy>": "黄",
                "<HIZ>": "紫",
                "<hio>": "橙",
                "<ord>": "红"
            }
            quality = tagMap[tag];
            params["quality"] = quality;
            const n = new Notification("物品拾取", params);
            NotificationCenter.post(n);
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();