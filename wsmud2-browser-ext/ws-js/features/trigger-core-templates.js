// ============================================================
// trigger-core-templates.js —— 触发器系统·模板
// ------------------------------------------------------------
// 包含：TriggerTemplate、TriggerTemplateCenter
// ============================================================
'use strict';

class TriggerTemplate {
    constructor(event, filters, introdution) {
        this.event = event;
        this.filters = filters;
        this.introdution = `${introdution}\n// 如需更多信息，可以到论坛触发器版块发帖。`;
    }
    getFilter(name) {
        for (const filter of this.filters) {
            if (filter.name == name) return filter;
        }
        return null;
    }
}

const TriggerTemplateCenter = {
    add: function (template) {
        this._templates[template.event] = template;
    },
    getAll: function () {
        return Object.values(this._templates);
    },
    get: function (event) {
        return this._templates[event];
    },

    _templates: {},
};