// ============================================================
// trigger-core-triggers.js —— 触发器系统·触发器管理
// ------------------------------------------------------------
// 包含：Trigger、TriggerData、TriggerCenter
// ============================================================
'use strict';

//---------------------------------------------------------------------------
//  Trigger
//---------------------------------------------------------------------------

class Trigger {
    constructor(name, template, conditions, source) {
        this.name = name;
        this.template = template;
        this.conditions = conditions;
        this.source = source;
        this._action = function (params) {
            let realParams = CopyObject(params);
            for (const key in conditions) {
                if (!conditions.hasOwnProperty(key)) continue;
                const filter = template.getFilter(key);
                if (filter == null) return;   // 【2026-08-11】未知模板 filter 判空，避免执行时崩溃
                const fromUser = conditions[key];
                const fromGame = params[key];
                if (!filter.assert(fromUser, fromGame)) return;
                delete realParams[key];
            }
            let realSource = source;
            for (const key in realParams) {
                realSource = `($${key}) = ${realParams[key]}\n${realSource}`;
            }
            if (/\/\/\s*~silent\s*\n/.test(source) == false) {
                realSource = `@print 💡<hio>触发=>${name}</hio>\n${realSource}`;
            }
            ToRaid.perform(realSource, name, false);
        };
        this._observerIndex = null;
    }

    event() { return this.template.event; }
    active() { return this._observerIndex != null; }

    _activate() {
        if (this._observerIndex != null) return;
        if (this.template == null) return;
        this._observerIndex = NotificationCenter.observe(this.template.event, this._action);
    }
    _deactivate() {
        if (this._observerIndex == null) return;
        NotificationCenter.removeOberver(this._observerIndex);
        this._observerIndex = null;
    }
}

class TriggerData {
    constructor(name, event, conditions, source, active) {
        this.name = name;
        this.event = event;
        this.conditions = conditions;
        this.source = source;
        this.active = active;
    }
}

const TriggerCenter = {
    run: function () {
        const allData = GM_getValue(this._saveKey(), {});
        for (const name in allData) {
            this._loadTrigger(name);
        }
    },
    reload: function () {
        for (const name in this._triggers) {
            if (!this._triggers.hasOwnProperty(name)) continue;
            const trigger = this._triggers[name];
            trigger._deactivate();
            delete this._triggers[name];
        }
        this.run();
    },

    // for upload and download
    getAllData: function () {
        return GM_getValue(this._saveKey(), {});
    },
    corver: function (triggerDatas) {
        for (const old of this.getAll()) {
            this.remove(old.name);
        }
        for (const name in triggerDatas) {
            const trigger = triggerDatas[name];
            this.create(trigger.name, trigger.event, trigger.conditions, trigger.source, trigger.active);
        }
    },

    getAll: function () {
        return Object.values(this._triggers);
    },
    create: function (name, event, conditions, source, active) {
        const checkResult = this._checkName(name);
        if (checkResult != true) return checkResult;

        const theActive = active == null ? false : active;
        const data = new TriggerData(name, event, conditions, source, theActive);
        this._updateData(data);

        this._loadTrigger(name);
        return true;
    },
    modify: function (originalName, name, conditions, source) {
        const trigger = this._triggers[originalName];
        if (trigger == null) return "修改不存在的触发器？";

        const event = trigger.event();
        if (originalName == name) {
            const data = new TriggerData(name, event, conditions, source, trigger.active());
            this._updateData(data);
            this._reloadTrigger(name);
            return true;
        }

        const result = this.create(name, event, conditions, source);
        if (result == true) {
            this.remove(originalName);
            this._loadTrigger(name);
        }
        return result;
    },
    remove: function (name) {
        const trigger = this._triggers[name];
        if (trigger == null) return;

        trigger._deactivate();
        delete this._triggers[name];
        let allData = GM_getValue(this._saveKey(), {});
        delete allData[name];
        GM_setValue(this._saveKey(), allData);
    },

    activate: function (name) {
        for (let x in this._triggers) {
            if (is_match(name, x)) {
                const trigger = this._triggers[x];
                if (trigger == null) continue;
                if (trigger.active()) continue;
                trigger._activate();
                let data = this._getData(x);
                data.active = true;
                this._updateData(data);
            }
        }
    },
    deactivate: function (name) {
        for (let x in this._triggers) {
            if (is_match(name, x)) {
                const trigger = this._triggers[x];
                if (trigger == null) continue;
                if (!trigger.active()) continue;
                trigger._deactivate();
                let data = this._getData(x);
                data.active = false;
                this._updateData(data);
            }
        }
    },
    _triggers: {},

    _saveKey: function () {
        return `${Role.id}@triggers`;
    },
    _reloadTrigger: function (name) {
        const oldTrigger = this._triggers[name];
        if (oldTrigger != null) {
            oldTrigger._deactivate();
        }
        this._loadTrigger(name);
    },
    _loadTrigger: function (name) {
        const data = this._getData(name);
        if (data == null) return;
        // 【2026-08-11 数据健康】损坏数据不崩溃：非对象数据跳过并提示；字段缺失补默认（能打开/能删除）
        if (typeof data !== 'object') {
            try { ExtLog.warn('[触发] 数据损坏（非对象），已跳过加载: ' + name + '（可用设置→恢复备份 或手动删除该键）'); } catch (e) { }
            return;
        }
        if (typeof data.conditions !== 'object' || data.conditions == null) {
            data.conditions = {};
            try { ExtLog.warn('[触发] 数据不完整（conditions 缺失），已补默认: ' + name); } catch (e) { }
        }
        if (typeof data.source !== 'string') {
            data.source = '';
            try { ExtLog.warn('[触发] 数据不完整（source 缺失），已补默认: ' + name); } catch (e) { }
        }
        // 旧数据兼容：补全"忽略发言人"字段
        if (data['event'] === '新聊天信息' && data['conditions']['忽略发言人'] === undefined) {
            data['conditions']['忽略发言人'] = '';
        }
        const trigger = this._toTrigger(data);
        this._triggers[name] = trigger;
        if (data.active) {
            trigger._activate();
        }
    },
    _getData: function (name) {
        let allData = GM_getValue(this._saveKey(), {});
        return allData[name];
    },
    _updateData: function (data) {
        let allData = GM_getValue(this._saveKey(), {});
        allData[data.name] = data;
        GM_setValue(this._saveKey(), allData);
    },
    _toTrigger: function (data) {
        let template = TriggerTemplateCenter.get(data.event);
        if (template == null) {
            // 【2026-08-11 修复】未知事件兜底：老版本/导入的数据其事件模板可能不存在（template 为 null），
            // 原代码直接 new Trigger(name, null, ...) → 点「设置」时 template.filters 崩溃 → 触发打不开也删不掉。
            // 兜底模板：filters 为空、introdution 带提示，保证能打开编辑/删除。
            ExtLog.warn(`[Trigger] 触发「${data.name}」事件「${data.event}」模板不存在，已用兜底模板加载（建议删除或改用已知事件重建）`);
            template = new TriggerTemplate(data.event, [], `// ⚠️ 此触发的触发事件「${data.event}」在当前版本中不存在（老数据或导入损坏）。\n// 你可以查看下面的脚本内容，或直接删除此触发器。\n// 如需保留，请删除后改用「新建」选择正确的触发事件重建。`);
        }
        return new Trigger(data.name, template, data.conditions, data.source);
    },
    _checkName: function (name) {
        if (this._triggers[name] != null) return "无法修改名称，已经存在同名触发器！";
        if (!/\S+/.test(name)) return "触发器的名称不能为空。";
        if (!/^[_a-zA-Z0-9\u4e00-\u9fa5]+$/.test(name)) return "触发器的名称只能使用中文、英文和数字字符。";
        return true;
    }
};