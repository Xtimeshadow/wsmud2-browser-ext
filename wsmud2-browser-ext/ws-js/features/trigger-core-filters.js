// ============================================================
// trigger-core-filters.js —— 触发器系统·过滤器
// ------------------------------------------------------------
// 包含：EqualAssert、ContainAssert、ContainReverseAssert、
// KeyAssert、Filter、SelectFilter、InputFilter
// ============================================================
'use strict';

/***********************************************************************************\
    Trigger Template And Trigger
\***********************************************************************************/

//---------------------------------------------------------------------------
//  Trigger Template
//---------------------------------------------------------------------------

const EqualAssert = function (lh, rh) {
    return lh == rh;
};

const ContainAssert = function (lh, rh) {
    if (/^\s*\*?\s*$/.test(lh)) return true;
    const list = lh.split("|");
    return list.indexOf(rh) != -1;
};
const ContainReverseAssert = function (lh, rh) {
    // console.log(lh, rh);
    if (/^\s*\*?\s*$/.test(lh)) return true;
    const list = lh.split("|");
    return list.indexOf(rh) == -1;
};

const KeyAssert = function (lh, rh) {
    if (/^\s*\*?\s*$/.test(lh)) return true;
    
    // 辅助函数：检查单个关键字是否匹配
    function isKeyMatch(key) {
        return rh.indexOf(key.trim()) != -1;
    }
    
    // 辅助函数：解析表达式
    function parseExpression(expr) {
        // 处理括号
        while (expr.includes('(')) {
            const start = expr.lastIndexOf('(');
            const end = expr.indexOf(')', start);
            if (end === -1) break; // 括号不匹配，忽略
            
            const subExpr = expr.substring(start + 1, end);
            const subResult = evaluateOr(subExpr);
            expr = expr.substring(0, start) + (subResult ? 'MATCHED' : 'UNMATCHED') + expr.substring(end + 1);
        }
        
        return evaluateOr(expr);
    }
    
    // 处理OR操作（||）
    function evaluateOr(expr) {
        const orParts = expr.split('||');
        for (const part of orParts) {
            if (evaluateAnd(part.trim())) {
                return true;
            }
        }
        return false;
    }
    
    // 处理AND操作（&&）
    function evaluateAnd(expr) {
        const andParts = expr.split('&&');
        for (const part of andParts) {
            const trimmed = part.trim();
            // 如果是前面括号处理后的结果，直接使用
            if (trimmed === 'MATCHED') continue;
            if (trimmed === 'UNMATCHED') return false;
            if (!isKeyMatch(trimmed)) {
                return false;
            }
        }
        return true;
    }
    
    return parseExpression(lh);
};

class Filter {
    constructor(name, type, defaultValue, assert) {
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue;
        this.assert = assert == null ? EqualAssert : assert;
    }
    description(value) {
        if (value != null) {
            this._desc = value;
            return;
        }
        return this._desc == null ? this.name : this._desc;
    }
}

class SelectFilter extends Filter {
    constructor(name, options, defaultNumber, assert) {
        const defaultValue = options[defaultNumber];
        super(name, "select", defaultValue, assert);
        this.options = options;
    }
}

const InputFilterFormat = {
    number: "数字",
    text: "文本"
};

class InputFilter extends Filter {
    /**
     * @param {String} name
     * @param {InputFilterFormat} format
     * @param {*} defaultValue
     */
    constructor(name, format, defaultValue, assert) {
        super(name, "input", defaultValue, assert);
        this.format = format;
    }
}