// ============================================================
// raid-compiler.js —— 控制逻辑编译层 + 预编译实现层
// ============================================================

//---------------------------------------------------------------------------
//  Precompiler
//---------------------------------------------------------------------------

class PrecompileRule {
    constructor(handle, priority) {
        this._handle = handle;
        this.priority = priority;
    }
    handle(cmds) {
        return this._handle(cmds);
    }
}

class PrecompileRuleCenter extends PrecompileRule {
    constructor() {
        const handle = function (cmds) {
            var result = cmds;
            for (const rule of this._rules) {
                result = rule.handle(result);
            }
            return result;
        };
        super(handle, -1);
        this._rules = [];
        this.instance = this;
    }
    static shared() {
        if (!this.instance) {
            this.instance = new PrecompileRuleCenter();
        }
        return this.instance;
    }
    addRule(rule) {
        SortInsert(this._rules, rule, (p, c) => {
            return p.priority >= c.priority;
        });
    }
};

class Precompiler {
    precompile(source) {
        var cmds = SourceCodeHelper.split(source);
        if (cmds.length <= 0) return cmds;

        var result = PrecompileRuleCenter.shared().handle(cmds);

        // console.log("<<<============================");
        // console.log("预编译最终代码:");
        // for (let k = 0; k < result.length; k++) {
        //     console.log(k + " " + result[k]);
        // }
        // console.log("============================>>>");
        return result;
    }
}

//---------------------------------------------------------------------------
//  Compiler
//---------------------------------------------------------------------------

const ControlKeys = {
    while: "while",
    continue: "continue",
    break: "break",
    if: "if",
    elseif: "elseif",
    else: "else",
    exit: "exit",
};

class Compiler {
    constructor() {
        this._cc = "CC";
        this._pc = "PC";
        this._breakStacks = [];
    }

    compile(source) {
        if (source == null) return [];

        var precompiler = new Precompiler();
        var cmds = precompiler.precompile(source);

        var blockCmds = ["[if] true"];
        cmds.forEach(cmd => {
            blockCmds.push("  " + cmd);
        });
        var result = this._handleBlock(blockCmds, 0).cmds;
        result.push("%exit");

        // console.log("<<<============================");
        // console.log("编译最终代码:");
        // for (let k = 0; k < result.length; k++) {
        //     console.log(k + " " + result[k]);
        // }
        // console.log("============================>>>");
        return result;
    }

    /**
     * @param {string[]} cmds
     * @param {number} start block 首句在的 index
     * @param {number} loopStart 最邻近的 while 的首句索引
     */
    _handleBlock(cmds, start, loopStart) {
        var realLoopStart = loopStart;

        var result = [];
        var r = this._handleCondition(cmds[0]);
        var callback = function () { };
        var self = this;
        switch (r.type) {
            case ControlKeys.while:
                this._breakStacks.push([]);
                result.push(r.cmd);
                result.push(null);
                callback = function () {
                    result.push(`%${self._pc}=${start}`);
                    var truePC = start + 2;
                    var falsePC = result.length + start;
                    result[1] = `%${self._pc}=${self._cc}?${truePC}:${falsePC}`;
                    var breakStack = self._breakStacks.pop();
                    breakStack.forEach(index => {
                        result[index - start] = `%${self._pc}=${falsePC}`;
                    });
                };
                realLoopStart = start;
                break;
            case ControlKeys.if:
                result.push(r.cmd);
                result.push(null);
                callback = function () {
                    result.push("%pass");
                    var truePC = start + 2;
                    var falsePC = result.length + start;
                    result[1] = `%${self._pc}=${self._cc}?${truePC}:${falsePC}`;
                };
                break;
            case ControlKeys.elseif:
                result.push(r.cmd);
                result.push(null);
                callback = function () {
                    result.push("%pass");
                    var truePC = start + 2;
                    var falsePC = result.length + start;
                    result[1] = `%${self._pc}=${self._cc}?${truePC}:${falsePC}`;
                };
                break;
            case ControlKeys.else:
                result.push(null);
                callback = function () {
                    var truePC = start + 1;
                    var falsePC = result.length + start;
                    result[0] = `%${self._pc}=${self._cc}?${falsePC}:${truePC}`;
                };
                break;
            case ControlKeys.continue:
                result.push(`%${self._pc}=${loopStart}`);
                return { type: "continue", cmds: result };
            case ControlKeys.break:
                result.push(null);
                var breakStack = this._breakStacks[this._breakStacks.length - 1];
                breakStack.push(start);
                return { type: "break", cmds: result };
            case ControlKeys.exit:
                result.push("%exit");
                return { type: "exit", cmds: result };
            default:
                throw "未知的控制关键字: " + r.type;
        }

        var cmdsLength = cmds.length;
        var i = 1;
        while (i < cmdsLength) {
            var cmd = cmds[i];
            var header = /^\s*/g.exec(cmd)[0];
            var headerLength = header.length;
            if (cmd[headerLength] == "[") {
                var blockCmds = [cmd];
                var j = i + 1;
                while (j < cmdsLength) {
                    var next = cmds[j];
                    if (next[headerLength] != " ") break;
                    blockCmds.push(next);
                    j += 1;
                }
                var lastCmdIndex = result.length - 1;
                var blockStart = result.length + start;
                var k = this._handleBlock(blockCmds, blockStart, realLoopStart);
                k.cmds.forEach(cmd1 => {
                    result.push(cmd1);
                });
                if (k.type == "elseif") {
                    result[lastCmdIndex] = `%${this._pc}=${result.length + start - 1}`;
                } else if (k.type == "else") {
                    result[lastCmdIndex] = `%${this._pc}=${result.length + start}`;
                }
                i = j;
            } else {
                result.push(cmd.substring(headerLength));
                i += 1;
            }
        }

        callback();
        return { type: r.type, cmds: result };
    }
    _handleCondition(condition) {
        var type = null;
        var cmd = null;
        var formats = [
            { type: ControlKeys.while, regexp: /^\s*\[while\]/g },
            { type: ControlKeys.if, regexp: /^\s*\[if\]/g },
            { type: ControlKeys.elseif, regexp: /^\s*\[else\s?if\]/g },
            { type: ControlKeys.else, regexp: /^\s*\[else\]/g },
            { type: ControlKeys.continue, regexp: /^\s*\[continue\]/g },
            { type: ControlKeys.break, regexp: /^\s*\[break\]/g },
            { type: ControlKeys.exit, regexp: /^\s*\[exit\]/g },
        ];
        for (const format of formats) {
            var r = format.regexp.exec(condition);
            if (r) {
                type = format.type;
                var exp = condition.substring(r[0].length);
                cmd = `%${this._cc}=${exp}`
                break;
            }
        }
        if (type == null) {
            throw "编译失败: " + condition;
        }
        return { type: type, cmd: cmd };
    }
}

// ============================================================
// 预编译实现层
// ============================================================

const PrecompileRulePriority = {
    subflow: 100,
    call: 90,
    annatition: 80,
    compatible: 70,
    guard: 60,
    emptyLine: 50,

    // 层外使用
    high: 30,
    ordinary: 20,
    low: 10
};

//---------------------------------------------------------------------------
//  Precompile Annatitions
//---------------------------------------------------------------------------

(function () {
    const handle = function (cmds) {
        var result = [];
        for (const cmd of cmds) {
            if (/^\s*\/\//.test(cmd)) continue;
            result.push(cmd);
        }
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.annatition);
    PrecompileRuleCenter.shared().addRule(rule);
})();

(function () {
    const handle = function (cmds) {
        var result = [];
        var ignore = false;
        for (const cmd of cmds) {
            if (/^\s*\/\*/.test(cmd)) {
                ignore = true;
                continue;
            }
            if (ignore && /\*\/\s*$/.test(cmd)) {
                ignore = false;
                continue;
            }
            if (!ignore) {
                result.push(cmd);
            }
        }
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.annatition);
    PrecompileRuleCenter.shared().addRule(rule);
})();

//---------------------------------------------------------------------------
//  Precompile Subflows
//---------------------------------------------------------------------------

(function () {
    const handle = function (cmds) {
        let result = [];
        let collecting = false;
        let subflowCmd = null;
        for (const cmd of cmds) {
            var r = /^(\s*)<===+\s*$/.exec(cmd);
            if (r != null) {
                collecting = true;
                subflowCmd = "<===";
                continue;
            }
            if (collecting) {
                var r2 = /^\s*=+==>\s*$/.exec(cmd);
                if (r2 != null) {
                    collecting = false;
                    subflowCmd += "===>";
                    result.push(subflowCmd);
                } else {
                    subflowCmd += `\n${cmd}`;
                }
                continue;
            }
            result.push(cmd);
        }
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.subflow);
    PrecompileRuleCenter.shared().addRule(rule);
})();

//---------------------------------------------------------------------------
//  Precompile Guards
//---------------------------------------------------------------------------

(function () {
    const handle = function (cmds) {
        var result = [];
        // {headerLength: Number, cmds: [String]}
        var guards = [];
        var guarding = false;
        for (const cmd of cmds) {
            var r = /^(\s*)<---+/.exec(cmd);
            if (r != null) {
                guarding = true;
                const guard = {
                    headerLength: r[1].length,
                    cmds: []
                }
                guards.push(guard);
                continue;
            }
            if (guarding) {
                var r2 = /^\s*-+-->/.exec(cmd);
                if (r2 == null) {
                    const guard = guards[guards.length - 1];
                    guard.cmds.push(cmd.substring(guard.headerLength));
                } else {
                    guarding = false;
                }
                continue;
            }
            result.push(cmd);
            var r3 = /^(\s*)[^\[\s]/.exec(cmd);
            if (r3 != null) {
                var header = r3[1];
                var hasGuard = false;
                for (let j = guards.length; j > 0; j--) {
                    const guard = guards[j - 1];
                    if (header.length < guard.headerLength) {
                        guards.pop();
                        continue;
                    }
                    if (!hasGuard) {
                        result.push(`${header}%guardStart`);
                        hasGuard = true;
                    }
                    guard.cmds.forEach(cmd1 => {
                        result.push(`${header}${cmd1}`);
                    });
                }
                if (hasGuard) result.push(`${header}%guardEnd`);
            }
        }
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.guard);
    PrecompileRuleCenter.shared().addRule(rule);
})();

//---------------------------------------------------------------------------
//  Precompile Calls
//---------------------------------------------------------------------------

var __CallCounter = 0;
var FlowStore = null; // PersistentCache

// TODO: 尚不支持嵌套调用
// @call 函数名 参数1,参数2,参数3,...
(function () {
    const handle = function (cmds) {
        let result = [];
        cmds.forEach(cmd => {
            var r = /^(\s*)@call\s(\S+)(\s*(\S.*)+\s*|\s*)$/.exec(cmd);
            if (r == null) {
                result.push(cmd);
                return;
            }
            const paramsField = r[4];
            let args = "";
            if (paramsField != null && paramsField.length > 0) {
                const params = paramsField.split(",");
                for (let i = 0; i < params.length; i++) {
                    const param = params[i];
                    args += `($arg${i})=${param}\n`;
                }
            }
            const flowName = r[2];
            let source = FlowStore.get(flowName);
            if (source == null) {
                Message.append(`<ord>未找到调用的流程 ${flowName}</ord>`);
                //throw `未找到调用的流程 ${flowName}`;
            }
            let callSource = `[if] true\n` + SourceCodeHelper.appendHeader("    ", `${args}\n${source}`);
            const callId = __CallCounter; __CallCounter += 1;
            callSource = callSource.replace(/\(\$([_a-z][a-zA-Z0-9_]*?)\)/g, `($__x${callId}_$1)`);
            callSource = callSource.replace(/\(([_a-z][a-zA-Z0-9_]*?)\)/g, `(__x${callId}_$1)`);
            const callCmds = SourceCodeHelper.split(callSource);
            const header = r[1];
            for (const callCmd of callCmds) {
                if (/^\s*#/.test(callCmd)) continue;
                result.push(`${header}${callCmd}`);
            }
        });
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.call);
    PrecompileRuleCenter.shared().addRule(rule);
})();

//---------------------------------------------------------------------------
//  Precompile Empty Line
//---------------------------------------------------------------------------

(function () {
    const handle = function (cmds) {
        var result = [];
        for (const cmd of cmds) {
            if (!/\S+/.test(cmd)) continue;
            result.push(cmd);
        }
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.emptyLine);
    PrecompileRuleCenter.shared().addRule(rule);
})();

//---------------------------------------------------------------------------
//  Precompile Raid 1.x.x
//---------------------------------------------------------------------------

(function addCompatibleGuardRule() {
    const handle = function (cmds) {
        var result = [];
        cmds.forEach(cmd => {
            var r = /^\s*#(\[.*)$/.exec(cmd);
            if (r == null) {
                result.push(cmd);
                return;
            }
            var c1 = `<---`;
            var c2 = r[1];
            var c3 = `--->`;
            result.push(c1, c2, c3);
        });
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.compatible);
    PrecompileRuleCenter.shared().addRule(rule);
})();

function CompatibleOperator(exp) {
    var result = exp;
    result = result.replace(/([^&])[&]([^&])/g, "$1&&$2");
    result = result.replace(/([^\|])[\|]([^\|])/g, "$1||$2");
    result = result.replace(/([^=<>!])[=]([^=])/g, "$1==$2");
    return result;
}

(function addCompatibleUntilRule() {
    const handle = function (cmds) {
        var result = [];
        cmds.forEach(cmd => {
            var r = /^(\s*)\[=(.+?)\](.*)$/.exec(cmd);
            if (r == null) {
                result.push(cmd);
                return;
            }
            var header = r[1];
            var condition = r[2];
            condition = CompatibleOperator(condition);
            var command = r[3];
            var c1 = `${header}@until ${condition}`;
            result.push(c1);
            if (!/\S/.test(command)) return;
            var c2 = `${header}${command}`;
            result.push(c2);
        });
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.compatible);
    PrecompileRuleCenter.shared().addRule(rule);
})();

(function addCompatibleIfRule() {
    const handle = function (cmds) {
        var result = [];
        cmds.forEach(cmd => {
            var r = /^(\s*)\[(.*?[=<>].*?|true|false)\](.*)$/i.exec(cmd);
            if (r == null) {
                result.push(cmd);
                return;
            }
            var command = r[3];
            if (!/\S/.test(command)) return;
            var header = r[1];
            var condition = r[2];
            condition = CompatibleOperator(condition);
            var c1 = `${header}[if] ${condition}`;
            var c2 = `${header}    ${command}`;
            result.push(c1, c2);
        });
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.compatible);
    PrecompileRuleCenter.shared().addRule(rule);
})();

(function addCompatibleNextRule() {
    const handle = function (cmds) {
        var result = [];
        cmds.forEach(cmd => {
            var r = /^(\s*)@next(.*)$/i.exec(cmd);
            if (r == null) {
                result.push(cmd);
                return;
            }
            var header = r[1];
            result.push(`${header}[continue]`);
        });
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.compatible);
    PrecompileRuleCenter.shared().addRule(rule);
})();

(function addCompatibleExitRule() {
    const handle = function (cmds) {
        var result = [];
        cmds.forEach(cmd => {
            var r = /^(\s*)@exit(.*)$/i.exec(cmd);
            if (r == null) {
                result.push(cmd);
                return;
            }
            var header = r[1];
            result.push(`${header}[break]`);
        });
        return result;
    };
    const rule = new PrecompileRule(handle, PrecompileRulePriority.compatible);
    PrecompileRuleCenter.shared().addRule(rule);
})();