// ============================================================
// raid-autocomplete.js —— 流程编辑器自动补全字典
// ------------------------------------------------------------
// RaidAutoComplete 对象，供 raid-editor.js 使用。
// 包含 @commands / #directives / [control flow] / (:variables)
// 四类补全项。
// ============================================================
'use strict';

var RaidAutoComplete = {
    // @commands (sorted by name)
    cmds: [
        { label: "@await", detail: "await ms - 等待(异步)", insert: "@await " },
        { label: "@beep", detail: "beep - 蜂鸣提示", insert: "@beep" },
        { label: "@call", detail: "call name args - 调用子流程", insert: "@call " },
        { label: "@cd", detail: "cd item - 等待物品CD", insert: "@cd " },
        { label: "@cleanBag", detail: "cleanBag - 整理背包", insert: "@cleanBag" },
        { label: "@cmdDelay", detail: "cmdDelay ms - 命令延迟", insert: "@cmdDelay " },
        { label: "@dazuo", detail: "dazuo - 打坐至满", insert: "@dazuo" },
        { label: "@debug", detail: "debug text - 调试输出", insert: "@debug " },
        { label: "@dialog", detail: "dialog name - 等待对话框", insert: "@dialog " },
        { label: "@eq", detail: "eq item - 装备物品", insert: "@eq " },
        { label: "@events", detail: "events text - 等待事件消息", insert: "@events " },
        { label: "@exit", detail: "exit - 退出", insert: "@exit" },
        { label: "@fb", detail: "fb name diff - 自动副本", insert: "@fb " },
        { label: "@force", detail: "force cmd - 强制发送命令", insert: "@force " },
        { label: "@js", detail: "js code - 执行JavaScript", insert: "@js " },
        { label: "@kill", detail: "kill entity - 叫杀", insert: "@kill " },
        { label: "@liaoshang", detail: "liaoshang - 疗伤至满", insert: "@liaoshang" },
        { label: "@msgtip", detail: "msgtip text - 等待消息提示", insert: "@msgtip " },
        { label: "@next", detail: "next - 进入下一次循环", insert: "@next" },
        { label: "@off", detail: "off - 关闭触发", insert: "@off" },
        { label: "@on", detail: "on - 开启触发", insert: "@on" },
        { label: "@perform", detail: "perform pfm - 释放绝招", insert: "@perform " },
        { label: "@print", detail: "print text - 输出消息", insert: "@print " },
        { label: "@push", detail: "push title content - 推送通知", insert: "@push " },
        { label: "@renew", detail: "renew - 修理装备", insert: "@renew" },
        { label: "@show", detail: "show text - 展示消息", insert: "@show " },
        { label: "@stop", detail: "stop name - 停止流程", insert: "@stop " },
        { label: "@task", detail: "task text - 等待任务提示", insert: "@task " },
        { label: "@taohualin", detail: "taohualin - 桃花林", insert: "@taohualin" },
        { label: "@tidyBag", detail: "tidyBag - 整理背包(使用→分解→清单卖→卖光→存仓)", insert: "@tidyBag" },
        { label: "@tip", detail: "tip text - 等待场景提示", insert: "@tip " },
        { label: "@toolbar", detail: "toolbar - 显示工具栏", insert: "@toolbar" },
        { label: "@until", detail: "until condition - 等待条件成立", insert: "@until " },
        { label: "@wait", detail: "wait ms - 等待毫秒", insert: "@wait " },
        { label: "@xy", detail: "xy coord - 等待场景坐标", insert: "@xy " },
    ],
    // #directives
    dirs: [
        { label: "#input", detail: "#input ($var)=描述,默认值 - 输入参数", insert: "#input ($)=" },
        { label: "#select", detail: "#select ($var)=描述,选项|分隔,默认 - 选择参数", insert: "#select ($)=" },
        { label: "#config", detail: "#config - 显示配置面板", insert: "#config" },
        { label: "#button", detail: "#button text - 自定义按钮", insert: "#button " },
    ],
    // [control flow]
    ctrls: [
        { label: "[if]", detail: "[if] condition - 条件判断", insert: "[if] " },
        { label: "[else if]", detail: "[else if] condition - 否则如果", insert: "[else if] " },
        { label: "[else]", detail: "[else] - 否则", insert: "[else]" },
        { label: "[while]", detail: "[while] condition - 循环", insert: "[while] " },
        { label: "[for]", detail: "[for] init;cond;step - for循环", insert: "[for] " },
        { label: "[break]", detail: "[break] - 跳出循环", insert: "[break]" },
        { label: "[continue]", detail: "[continue] - 继续循环", insert: "[continue]" },
        { label: "[exit]", detail: "[exit] - 退出流程", insert: "[exit]" },
    ],
    // (:variables) and trigger variables
    vars: [
        { label: "(:room)", detail: "当前房间名", insert: "(:room)" },
        { label: "(:state)", detail: "当前状态", insert: "(:state)" },
        { label: "(:hp)", detail: "当前气血", insert: "(:hp)" },
        { label: "(:maxHp)", detail: "最大气血", insert: "(:maxHp)" },
        { label: "(:hpPer)", detail: "气血百分比(0~1)", insert: "(:hpPer)" },
        { label: "(:mp)", detail: "当前内力", insert: "(:mp)" },
        { label: "(:maxMp)", detail: "最大内力", insert: "(:maxMp)" },
        { label: "(:mpPer)", detail: "内力百分比(0~1)", insert: "(:mpPer)" },
        { label: "(:name)", detail: "角色名", insert: "(:name)" },
        { label: "(:id)", detail: "角色ID", insert: "(:id)" },
        { label: "(:grade)", detail: "等级", insert: "(:grade)" },
        { label: "(:family)", detail: "门派", insert: "(:family)" },
        { label: "(:energy)", detail: "精力", insert: "(:energy)" },
        { label: "(:money)", detail: "金钱", insert: "(:money)" },
        { label: "(:weapon)", detail: "武器类型", insert: "(:weapon)" },
        { label: "(:target)", detail: "当前目标", insert: "(:target)" },
        { label: "(:free)", detail: "是否空闲", insert: "(:free)" },
        { label: "(:date)", detail: "当前日期(日)", insert: "(:date)" },
        { label: "(:day)", detail: "星期几(0-6)", insert: "(:day)" },
        { label: "(:hour)", detail: "当前小时", insert: "(:hour)" },
        { label: "(:minute)", detail: "当前分钟", insert: "(:minute)" },
        { label: "(:second)", detail: "当前秒", insert: "(:second)" },
        { label: "(:mSec)", detail: "当前毫秒", insert: "(:mSec)" },
        { label: "(type)", detail: "事件类型(触发)", insert: "(type)" },
        { label: "(event)", detail: "事件名称(触发)", insert: "(event)" },
        { label: "(content)", detail: "事件关键词(触发)", insert: "(content)" },
        { label: "(grade)", detail: "事件等级(触发)", insert: "(grade)" },
        { label: "(times)", detail: "持续时间戳(触发)", insert: "(times)" },
    ],
    // Get all suggestions as a flat array
    getAll: function () {
        if (!this._all) {
            this._all = [].concat(this.cmds, this.dirs, this.ctrls, this.vars);
        }
        return this._all;
    },
    // Get suggestions matching a prefix
    match: function (prefix) {
        if (!prefix || prefix.length === 0) return [];
        var lower = prefix.toLowerCase();
        return this.getAll().filter(function (item) {
            return item.label.toLowerCase().indexOf(lower) === 0;
        }).slice(0, 20);
    }
};