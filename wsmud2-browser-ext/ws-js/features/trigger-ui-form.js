// ============================================================
// trigger-ui-form.js —— 触发器系统·表单/弹窗
// ------------------------------------------------------------
// 包含：TriggerUI._updateTrigger、TriggerUI._appendHtml、TriggerUI._closeModal、
// TriggerUI._showModal
// ============================================================
'use strict';

TriggerUI._updateTrigger = function (template, trigger) {
    const content = `
    <div class="wsmd-trigger-form">
        <div class="wsmd-trigger-filters">
            <span class="wsmd-filter-card" v-for="f in filters">
                <span class="wsmd-label" style="display:block;margin-bottom:4px;">{{ f.description() }}</span>
                <input v-if="f.type=='input'" class="wsmd-input" style="width:100%;" v-model="conditions[f.name]">
                <select v-if="f.type=='select'" class="wsmd-select" style="width:100%;" v-model="conditions[f.name]">
                    <option v-for="opt in f.options" :value="opt">{{ opt }}</option>
                </select>
            </span>
        </div>
        <div class="wsmd-trigger-editor">
            <textarea id="trigger-source-editor" class="settingbox hide wsmd-code" spellcheck="false" style="height:20rem;display:inline-block;font-size:14px;line-height:1.5;width:100%;font-family:'JetBrains Mono',monospace;" v-model="source"></textarea>
            <div style="display:flex;justify-content:flex-end;">
                <span class="wsmd-btn wsmd-btn-gold wsmd-btn-sm" v-if="canShared" v-on:click="share()">分享此触发器</span>
            </div>
        </div>
    </div>
    `;
    const title = `<input class="wsmd-input" style="width:170px;" type="text" placeholder="输入触发器名称" v-model="name">`;
    let rightText = "<span class='wsmd-btn wsmd-btn-primary wsmd-btn-sm' v-on:click='save'>保存</span>";
    if (trigger) {
        rightText = "<span class='wsmd-btn wsmd-btn-danger wsmd-btn-sm' v-on:click='remove'>删除</span>"
    }
    let leftText = "<span class='wsmd-btn wsmd-btn-ghost wsmd-btn-sm' v-on:click='back'>< 返回</span>";
    if (trigger) {
        leftText = "<span class='wsmd-btn wsmd-btn-ghost wsmd-btn-sm' v-on:click='saveback'>< 保存&返回</span>"
    }
    TriggerUI._showModal(title, content, rightText, leftText);
    let conditions = {};
    if (trigger != null) {
        conditions = trigger.conditions;
    } else {
        for (const f of template.filters) {
            conditions[f.name] = f.defaultValue;
        }
    }
    let source = template.introdution;
    if (trigger != null) source = trigger.source;
    if (_triggerVue) { _triggerVue.$destroy(); _triggerVue = null; }
    _triggerVue = new Vue({
        el: '#app',
        data: {
            filters: template.filters,
            name: trigger ? trigger.name : "",
            conditions: conditions,
            source: source,
            canShared: trigger != null,
            // 【2026-09-07】变量参考面板：编辑已有触发器时默认展开，避免指导被源码覆盖后看不到变量
            guideText: template.introdution,
            showGuide: trigger != null
        },
        methods: {
            toggleGuide: function () { this.showGuide = !this.showGuide; },
            save: function () {
                const result = TriggerCenter.create(this.name, template.event, this.conditions, this.source);
                if (result == true) {
                    TriggerUI._closeModal();
                    TriggerUI.triggerHome();
                } else {
                    alert(result);
                }
            },
            remove: function () {
                const verify = confirm("确认删除此触发器吗？");
                if (verify) {
                    TriggerCenter.remove(trigger.name);
                    TriggerUI._closeModal();
                    TriggerUI.triggerHome();
                }
            },
            back: function () {
                TriggerUI.selectTriggerTemplate();
            },
            saveback: function () {
                const result = TriggerCenter.modify(trigger.name, this.name, this.conditions, this.source);
                if (result == true) {
                    TriggerUI._closeModal();
                    TriggerUI.triggerHome();
                } else {
                    alert(result);
                }
            },

            share: function () {
                ToRaid.shareTrigger(TriggerCenter._getData(trigger.name));
            }
        }
    })
    // 【2026-08-12 移植作者 f45137e】textarea（v-model 原生）+ Tab 缩进 + 语法高亮编辑器
    try {
        setTimeout(function () {
            var _ta = _triggerVue && _triggerVue.$el ? _triggerVue.$el.querySelector('textarea') : null;
            if (_ta) {
                enableTabIndent(_ta);
                // 【2026-08-13 移植作者 26.2】语法高亮编辑器（@js 行走 JS 高亮；v-model 靠 textarea 自身 input 事件，包装后不受影响）
                try { createRaidEditor('trigger-source-editor', { height: '20rem', width: '100%' }); } catch (e2) { }
            }
        }, 0);
    } catch (e) { }
};

TriggerUI._appendHtml = function (title, content, rightText, leftText) {
    const head = Wsmud.listShell({ title: title, left: leftText, right: rightText });
    const html = '<div id="app" class="wsmd-list">' + head + content + '</div>';
    WMsg.clean();
    WMsg.append(html, 2);
};

TriggerUI._closeModal = function () {
    // 【2026-08-11 加固】关闭弹窗时销毁 Vue 实例（防累积泄漏）
    if (_triggerVue) { _triggerVue.$destroy(); _triggerVue = null; }
    if (TriggerUI._modalHandle) {
        TriggerUI._modalHandle.close();
        TriggerUI._modalHandle = null;
    }
    var el = document.getElementById('trigger-modal-overlay');
    if (el) el.remove();
};

TriggerUI._showModal = function (title, content, rightText, leftText) {
    TriggerUI._closeModal();
    // 移除可能残留的 #app 元素，避免 Vue 挂载到错误的位置（日志区列表页复用 #app）
    var staleApp = document.getElementById('app');
    if (staleApp) staleApp.remove();
    // 【2026-09-07 全面重设计】复用 raid-tools.js 的共享弹窗外壳（wsmd-* 设计系统）
    // 【2026-09-08 修复】✕ / Esc 关闭弹窗后恢复触发器列表页：开弹窗时上面移除了日志区的 #app 列表页，
    // 若只 _closeModal 不移除遮罩，退出后左日志区会被错误清空（留白）
    TriggerUI._modalHandle = Wsmud.modalShell({
        overlayId: 'trigger-modal-overlay',
        title: title,
        content: content,
        left: leftText,
        right: rightText,
        wrapVue: true,
        onClose: function () { TriggerUI._closeModal(); TriggerUI.triggerHome(); }
    });
};