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
            <div class="wsmd-list-row" v-for="t in triggers">
                <span class="wsmd-list-name">{{ t.name }}</span>
                <span class="wsmd-list-actions">
                    <span class="wsmd-btn wsmd-btn-sm" v-on:click="editTrigger(t)">设置</span>
                    <span v-if="t.active()" class="wsmd-btn wsmd-btn-success wsmd-btn-sm" v-on:click="switchStatus(t)">已开启</span>
                    <span v-else class="wsmd-btn wsmd-btn-muted wsmd-btn-sm" v-on:click="switchStatus(t)">已关闭</span>
                </span>
            </div>
            <div class="wsmd-empty" v-if="!triggers.length">还没有触发器，点右上角「新建」创建一个吧</div>
        </div>
        `;
        const rightText = "<span class='wsmd-btn wsmd-btn-primary wsmd-btn-sm' v-on:click='createTrigger()'>新建</span>";
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
        <div class="wsmd-tpl-grid">
            <span class="wsmd-tpl-card" v-for="t in templates" v-on:click="select(t)">{{ t.event }}</span>
        </div>
        `;
        const leftText = "<span class='wsmd-btn wsmd-btn-ghost wsmd-btn-sm' v-on:click='back()'>< 返回</span>";
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