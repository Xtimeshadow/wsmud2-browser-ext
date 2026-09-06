// ============================================================
// trigger-ui.js —— 触发器系统·管理界面（主对象）
// ------------------------------------------------------------
// 提供触发器管理 UI：列表页、新建/编辑表单、弹窗控制。
// 对外暴露 TriggerUI 对象（挂在全局）。
// 表单方法在 trigger-ui-form.js 中。
// ============================================================
'use strict';

/***********************************************************************************\
    UI
\***********************************************************************************/

// 【2026-08-11 加固】Vue 单实例管理：弹窗每次 new Vue({el:'#app'}) 前销毁旧实例，
// 避免连续开关弹窗累积 Vue 实例（内存泄漏 + 状态残留）
let _triggerVue = null;

// 【2026-09-05 修复】WMsg 用"扩展已有对象"而非重新 var 定义：
// raid-tools.js 先定义了带 cmdLog 的 WMsg（Raid 流程日志用），这里若再用
// var WMsg = {append, clean} 会覆盖掉 cmdLog，导致不带 //~silent 的流程
// 调用 WMsg.cmdLog() 时报 "cmdLog is not a function" 而停止。
var WMsg = window.WMsg || {};
if (typeof WMsg.append !== 'function') {
    WMsg.append = function (msg, area) {
        // 【2026-08-11 修复】同步插入：弹窗 HTML append 后立即 new Vue({el:'#app'})，异步批量会让 Vue 挂载失败 → 弹窗空白
        messageAppend(msg, area, null, true);
    };
}
if (typeof WMsg.clean !== 'function') {
    WMsg.clean = function () {
        messageClear();
    };
}

const TriggerUI = {
    triggerHome: function () {
        const content = `
        <div>
            <div v-for="t in triggers">
                <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;"></div>
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:3px 0 3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;">{{ t.name }}</td>
                        <td style="width:40px;text-align:center;">
                            <span style="display:inline-block;width:99px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(255,255,255,0.18);cursor:pointer;font-size:12px;" v-on:click="editTrigger(t)">设置</span>
                        </td>
                        <td style="width:54px;text-align:center;">
                            <span v-if="t.active()" style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:#4caf50;color:#e8f5e9;font-size:12px;cursor:pointer;" v-on:click="switchStatus(t)">已开启</span>
                            <span v-else style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(120,120,120,0.5);color:#dddddd;font-size:12px;cursor:pointer;" v-on:click="switchStatus(t)">已关闭</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;" v-if="triggers.length"></div>
        </div>
        `;
        const rightText = "<span v-on:click='createTrigger()'><wht>新建</wht></span>";
        TriggerUI._appendHtml("🍟 <hio>触发器</hio>", content, rightText);
        if (_triggerVue) { _triggerVue.$destroy(); _triggerVue = null; }
        _triggerVue = new Vue({
            el: '#app',
            data: {
                triggers: TriggerCenter.getAll()
            },
            methods: {
                switchStatus: function (t) {
                    if (t.active()) {
                        TriggerCenter.deactivate(t.name);
                    } else {
                        TriggerCenter.activate(t.name);
                    }
                    TriggerUI.triggerHome();
                },
                editTrigger: TriggerUI.editTrigger,
                createTrigger: TriggerUI.selectTriggerTemplate
            }
        });
    },
    selectTriggerTemplate: function () {
        const content = `
        <span class="zdy-item" style="width:120px" v-for="t in templates" v-on:click="select(t)">{{ t.event }}</span>
        `;
        const leftText = "<span v-on:click='back()'>< 返回</span>";
        TriggerUI._showModal("<wht>选择触发事件</wht>", content, null, leftText);
        if (_triggerVue) { _triggerVue.$destroy(); _triggerVue = null; }
        _triggerVue = new Vue({
            el: '#app',
            data: {
                templates: TriggerTemplateCenter.getAll()
            },
            methods: {
                select: TriggerUI.createTrigger,
                back: function () { TriggerUI._closeModal(); TriggerUI.triggerHome(); }
            }
        });
    },
    createTrigger: function (template) {
        TriggerUI._updateTrigger(template);
    },
    editTrigger: function (trigger) {
        TriggerUI._updateTrigger(trigger.template, trigger);
    },
};