// ============================================================
// trigger-ui-form.js —— 触发器系统·表单/弹窗
// ------------------------------------------------------------
// 包含：TriggerUI._updateTrigger、TriggerUI._appendHtml、TriggerUI._closeModal、
// TriggerUI._showModal
// ============================================================
'use strict';

TriggerUI._updateTrigger = function (template, trigger) {
    const content = `
    <div style="margin:0 2em 0 2em">
        <div style="float:left;width:120px">
            <span class="zdy-item" style="width:90px" v-for="f in filters">
            <p style="margin:0"><wht>{{ f.description() }}</wht></p>
            <input v-if="f.type=='input'" style="width:80%" v-model="conditions[f.name]">
            <select v-if="f.type=='select'" v-model="conditions[f.name]">
                <option v-for="opt in f.options" :value="opt">{{ opt }}</option>
            </select>
            </span>
        </div>
        <div style="float:right;width:calc(100% - 125px)">
            <textarea id="trigger-source-editor" class = "settingbox hide" spellcheck="false" style = "height:20rem;display:inline-block;font-size:14px;line-height:1.5;width:100%;font-family:'JetBrains Mono',monospace;" v-model="source"></textarea>
            <span class="raid-item shareTrigger" v-if="canShared" v-on:click="share()">分享此触发器</span>
        </div>
    </div>
    `;
    const title = `<input style='width:110px' type="text" placeholder="输入触发器名称" v-model="name">`;
    let rightText = "<span v-on:click='save'><wht>保存</wht></span>";
    if (trigger) {
        rightText = "<span v-on:click='remove'>删除</span>"
    }
    let leftText = "<span v-on:click='back'>< 返回</span>";
    if (trigger) {
        leftText = "<span v-on:click='saveback'>< 保存&返回</span>"
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
            canShared: trigger != null
        },
        methods: {
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
    var realLeftText = leftText == null ? "" : leftText;
    var realRightText = rightText == null ? "" : rightText;
    var html = `
    <div class = "item-commands" style="text-align:center" id="app">
        <div style="margin-top:0.5em">
            <div style="width:6em;float:left;text-align:left;padding:0px 0px 0px 2em;height:1.23em" id="wsmud_raid_left">${realLeftText}</div>
            <div style="width:calc(100% - 16em);float:left;height:1.23em">${title}</div>
            <div style="width:6em;float:right;text-align:right;padding:0px 2em 0px 0px;height:1.23em" id="wsmud_raid_right">${realRightText}</div>
        </div>
        <br><br>
        ${content}
    </div>`;
    WMsg.clean();
    WMsg.append(html, 2);
};

TriggerUI._closeModal = function () {
    // 【2026-08-11 加固】关闭弹窗时销毁 Vue 实例（防累积泄漏）
    if (_triggerVue) { _triggerVue.$destroy(); _triggerVue = null; }
    var el = document.getElementById('trigger-modal-overlay');
    if (el) el.remove();
};

TriggerUI._showModal = function (title, content, rightText, leftText) {
    TriggerUI._closeModal();
    // 移除可能残留的 #app 元素，避免 Vue 挂载到错误的位置
    var staleApp = document.getElementById('app');
    if (staleApp) staleApp.remove();
    var realLeftText = leftText ?? "";
    var realRightText = rightText ?? "";
    var overlay = document.createElement('div');
    overlay.id = 'trigger-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    var modal = document.createElement('div');
    // 【2026-08-26 统一弹窗风格】恢复26.4版本样式
    modal.style.cssText = 'background:#1a1a2e;border:1px solid #555;border-radius:12px;padding:24px;width:80vw;height:75vh;max-width:95%;max-height:85vh;overflow:auto;position:relative;box-shadow:0 0 30px rgba(0,0,0,0.5);';
    var html = `
    <div class="item-commands" style="text-align:center" id="app">
        <div style="margin-top:0.5em">
            <div style="width:12em;float:left;text-align:left;padding:0px 0px 0px 2em;height:1.23em" id="wsmud_raid_left">${realLeftText}</div>
            <div style="width:calc(100% - 16em);float:left;height:1.23em">${title}</div>
            <div style="width:6em;float:right;text-align:right;padding:0px 2em 0px 0px;height:1.23em" id="wsmud_raid_right">${realRightText}</div>
        </div>
        <br><br>
        ${content}
    </div>`;
    modal.insertAdjacentHTML('beforeend', html);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};