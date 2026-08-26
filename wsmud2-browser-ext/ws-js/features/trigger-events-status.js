// ============================================================
// trigger-events-status.js —— 触发器系统·气血/内力/伤害事件
// ------------------------------------------------------------
// 气血内力改变、伤害已满
// ============================================================
'use strict';

//---------------------------------------------------------------------------
//  hp mp
//---------------------------------------------------------------------------

var RoomItems = {};

(function () {
    const name = new InputFilter("人名关键字", InputFilterFormat.text, "", KeyAssert);
    const type = new SelectFilter("类型", ["气血", "内力"], 0, EqualAssert);
    const compare = new SelectFilter("当", ["低于", "高于"], 0, EqualAssert);
    const valueType = new SelectFilter("值类型", ["百分比", "数值"], 0, EqualAssert);
    const value = new InputFilter("值", InputFilterFormat.number, 0, function (fromUser, fromGame) {
        const parts = fromGame.split(";");
        const oldvalue = parseFloat(parts[0]);
        const newvalue = parseFloat(parts[1]);
        if (oldvalue >= fromUser && newvalue < fromUser) return true;
        if (oldvalue <= fromUser && newvalue > fromUser) return true;
        return false;
    });
    let filters = [name, type, compare, valueType, value];
    const intro = `// 气血内力改变触发器
// 人物id：(id)
// 人物当前气血：(hp)
// 人物最大气血：(maxHp)
// 人物当前内力：(mp)
// 人物最大内力：(maxMp)
// ⚠ 填写提示：人名关键字 用 || 或、&& 且、() 括号组合，如 张无忌 || 张三丰`;
    const t = new TriggerTemplate("气血内力改变", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        WG.add_hook("items", data => {
            if (data.items == null) return;
            RoomItems = {};
            for (const item of data.items) {
                RoomItems[item.id] = CopyObject(item);
            }
        });
        WG.add_hook("itemadd", data => {
            RoomItems[data.id] = CopyObject(data);
        });
        const decorate = function (params, item) {
            params["id"] = item.id;
            params["hp"] = item.hp;
            params["maxHp"] = item.max_hp;
            params["mp"] = item.mp;
            params["maxMp"] = item.max_mp;
        };
        WG.add_hook("sc", data => {
            if (data.id == null) return;
            let item = RoomItems[data.id];
            if (item == null) return;
            if (data.hp != null) {
                let compare = "低于";
                if (data.hp > item.hp) compare = "高于";
                const oldValue = item.hp;
                const oldPer = (item.hp / item.max_hp * 100).toFixed(2);
                item.hp = data.hp;
                if (item.max_hp < item.hp) item.max_hp = item.hp;
                if (data.max_hp != null) item.max_hp = data.max_hp;
                const newValue = item.hp;
                const newPer = (item.hp / item.max_hp * 100).toFixed(2);
                let params1 = {
                    "人名关键字": item.name,
                    "类型": "气血",
                    "当": compare,
                    "值类型": "百分比",
                    "值": `${oldPer};${newPer}`
                };
                decorate(params1, item);
                const n1 = new Notification("气血内力改变", params1);
                NotificationCenter.post(n1);
                let params2 = {
                    "人名关键字": item.name,
                    "类型": "气血",
                    "当": compare,
                    "值类型": "数值",
                    "值": `${oldValue};${newValue}`
                };
                decorate(params2, item);
                const n2 = new Notification("气血内力改变", params2);
                NotificationCenter.post(n2);
            }
            if (data.mp != null) {
                let compare = "低于";
                if (data.mp > item.mp) compare = "高于";
                const oldValue = item.mp;
                const oldPer = (item.mp / item.max_mp * 100).toFixed(2);
                item.mp = data.mp;
                if (item.max_mp < item.mp) item.max_mp = item.mp;
                if (data.max_mp != null) item.max_mp = data.max_mp;
                const newValue = item.mp;
                const newPer = (item.mp / item.max_mp * 100).toFixed(2);
                let params1 = {
                    "人名关键字": item.name,
                    "类型": "内力",
                    "当": compare,
                    "值类型": "百分比",
                    "值": `${oldPer};${newPer}`
                };
                decorate(params1, item);
                const n1 = new Notification("气血内力改变", params1);
                NotificationCenter.post(n1);
                let params2 = {
                    "人名关键字": item.name,
                    "类型": "内力",
                    "当": compare,
                    "值类型": "数值",
                    "值": `${oldValue};${newValue}`
                };
                decorate(params2, item);
                const n2 = new Notification("气血内力改变", params2);
                NotificationCenter.post(n2);
            }
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();

//---------------------------------------------------------------------------
//  damage
//---------------------------------------------------------------------------

(function () {
    const name = new InputFilter("人名关键字", InputFilterFormat.text, "", KeyAssert);
    const valueType = new SelectFilter("值类型", ["百分比", "数值"], 0, EqualAssert);
    const value = new InputFilter("值", InputFilterFormat.number, 0, (fromUser, fromGame) => {
        const parts = fromGame.split(";");
        const oldvalue = parseFloat(parts[0]);
        const newvalue = parseFloat(parts[1]);
        if (oldvalue <= fromUser && newvalue > fromUser) return true;
        return false;
    });
    let filters = [name, valueType, value];
    const intro = `// 伤害已满触发器
// 备注：限制条件-值 不支持多条件
// 人物id：(id)
// 人物名称：(name)
// 伤害数值：(value)
// 伤害百分比：(percent)
// ⚠ 填写提示：人名关键字 用 || 或、&& 且、() 括号组合，如 张无忌 || 张三丰`;
    const t = new TriggerTemplate("伤害已满", filters, intro);
    TriggerTemplateCenter.add(t);

    const run = function () {
        const decorate = function (params, item, value, percent) {
            params["id"] = item.id;
            params["name"] = item.name;
            params["value"] = value;
            params["percent"] = percent;
        };
        WG.add_hook("sc", data => {
            if (data.id == null || data.damage == null) return;
            let item = RoomItems[data.id];
            if (item == null || item.id == null || item.name == null || item.max_hp == null) return;
            // 获取之前保存的伤害和伤害百分比
            const oldValue = item._damage == null ? 0 : item._damage;
            const oldPer = item._damagePer == null ? 0 : item._damagePer;
            const value = data.damage;
            const percent = (data.damage / item.max_hp * 100).toFixed(2);
            // 保存伤害和伤害百分比
            item._damage = value;
            item._damagePer = percent;
            let params1 = {
                "人名关键字": item.name,
                "值类型": "百分比",
                "值": `${oldPer};${percent}`
            };
            decorate(params1, item, value, percent);
            const n1 = new Notification("伤害已满", params1);
            NotificationCenter.post(n1);
            let params2 = {
                "人名关键字": item.name,
                "值类型": "数值",
                "值": `${oldValue};${value}`
            };
            decorate(params2, item, value, percent);
            const n2 = new Notification("伤害已满", params2);
            NotificationCenter.post(n2);
        });
    };
    const monitor = new Monitor(run);
    MonitorCenter.addMonitor(monitor);
})();