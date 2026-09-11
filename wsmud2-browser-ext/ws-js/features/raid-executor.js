// ============================================================
// raid-executor.js —— 代码执行器层（从 Raid.js 拆分）
// ============================================================

    /***********************************************************************************\
        代码执行器层
    \***********************************************************************************/

    //---------------------------------------------------------------------------
    //  Handle Condition
    //---------------------------------------------------------------------------

    var AssertLeftMarkHandlerCenter = {
        /**
         * @param {Function} handler function(leftMark)->{handle: Bool, value: string}
         */
        addHandler: function (handler) {
            this._leftMarkHandlers.push(handler);
        },
        getValue(leftMark) {
            for (let i = 0; i < this._leftMarkHandlers.length; i++) {
                const handler = this._leftMarkHandlers[i];
                var result = handler.handle(leftMark);
                if (!result.handle) continue;
                return result.value;
            }
            return leftMark;
        },
        _leftMarkHandlers: []
    };

    class AssertWrapper {
        /**
         * @param {Function} assert1 function(string)->Bool
         * @param {string} text
         */
        constructor(assert1) {
            var theSelf = this;
            this.assert = function () {
                return assert1(theSelf.text);
            };
        }
        setText(text) {
            this.text = text;
        }
    }

    class AssertHolder {
        /**
         * @param {Function} match function(expression)->Bool
         * @param {Function} getAssertWrapper function()->AssertWrapper
         */
        constructor(match, getAssertWrapper) {
            this.match = match;
            this._getAssertWrapper = getAssertWrapper;
        }
        getAssertWrapper() {
            return this._getAssertWrapper();
        }
    }

    var AssertHolderCenter = {
        /**
         * @param {AssertHolder} holder
         */
        addAssertHolder: function (holder) {
            this._assertHolders.push(holder);
        },
        /**
         * @param {string} expression
         * @returns {Function} assert: function()
         */
        get: function (expression) {
            var exp = expression.replace(/^\s*|\s*$/g, "");
            var theSelf = this;
            var relationIndex = exp.search(/&&|\|\|/g);
            if (relationIndex != -1) {
                var relation = exp.substring(relationIndex, relationIndex + 2);
                var left = exp.substring(0, relationIndex);
                var right = exp.substring(relationIndex + 2);
                var assert = function () {
                    var leftAssert = theSelf.get(left);
                    var rightAssert = theSelf.get(right);
                    switch (relation) {
                        case "&&":
                            return leftAssert() && rightAssert();
                        case "||":
                            return leftAssert() || rightAssert();
                    }
                };
                return assert;
            }
            var not = exp[0];
            if (not == "!") {
                var assert = function () {
                    return !theSelf.get(exp.substring(1))();
                }
                return assert;
            }
            for (let i = 0; i < this._assertHolders.length; i++) {
                const holder = this._assertHolders[i];
                if (holder.match(exp)) {
                    var wrapper = holder.getAssertWrapper();
                    wrapper.setText(exp);
                    return wrapper.assert;
                }
            }
            return null;
        },
        _assertHolders: []
    };

    (function addTureAssertHolder() {
        var match = function (text) {
            return text == "true";
        };
        var assert = function (text) {
            return true;
        };
        var holder = new AssertHolder(match, function () { return new AssertWrapper(assert); });
        AssertHolderCenter.addAssertHolder(holder);
    })();

    (function addFalseAssertHolder() {
        var match = function (text) {
            return text == "false";
        };
        var assert = function (text) {
            return false;
        };
        var holder = new AssertHolder(match, function () { return new AssertWrapper(assert); });
        AssertHolderCenter.addAssertHolder(holder);
    })();

    (function addPresetConfigAssertHolder() {
        var patt = new RegExp(">=?|<=?|!=|==?");
        var match = function (text) {
            return patt.test(text);
        };
        var assert = function (text) {
            let validText = text;
            validText = validText.replace(/<(\w+)>/g, "「$1」");
            validText = validText.replace(/<(\/\w+)>/g, "「¿$1」");
            var result = patt.exec(validText);
            // 【2026-08-14 修复】文本经标签替换后可能不再匹配（如原文本含 < > 干扰），exec 返回 null 时防空引用，按"条件不满足"处理
            if (result == null) return false;
            var opt = result[0];
            var parts = validText.split(opt);
            var left = parts[0].replace(/^\s*|\s*$/g, "");
            var lvalue = AssertLeftMarkHandlerCenter.getValue(left);
            var rvalue = parts[1].replace(/^\s*|\s*$/g, "");;
            var lfloat = parseFloat(lvalue);
            var rfloat = parseFloat(rvalue);
            var byDigit = false;
            if (!isNaN(lfloat) && !isNaN(rfloat)) {
                lvalue = lfloat;
                rvalue = rfloat;
                byDigit = true;
            }
            switch (opt) {
                case "=":
                case "==":
                    if (byDigit) {
                        return Math.abs(lvalue - rvalue) < 0.001;
                    } else {
                        return lvalue == rvalue;
                    }
                case ">":
                    return lvalue > rvalue;
                case "<":
                    return lvalue < rvalue;
                case ">=":
                    return lvalue >= rvalue;
                case "<=":
                    return lvalue <= rvalue;
                case "!=":
                    if (byDigit) {
                        return Math.abs(lvalue - rvalue) > 0.001;
                    } else {
                        return lvalue != rvalue;
                    }
                default:
                    return false;
            }
        };
        var holder = new AssertHolder(match, function () { return new AssertWrapper(assert); });
        AssertHolderCenter.addAssertHolder(holder);
    })();

    //---------------------------------------------------------------------------
    //  Cmd Prehandler
    //---------------------------------------------------------------------------

    const CmdPrehandlerPriority = {
        ordinary: 50,
    };

    class CmdPrehandler {
        /**
         * @param {Function} handle function(performer: Performer, cmd: String) -> String
         * @param {Number} [priority]
         */
        constructor(handle, priority) {
            this._handle = handle;
            this.priority = priority ? priority : CmdPrehandlerPriority.ordinary;
        }
        handle(performer, cmd) {
            return this._handle(performer, cmd);
        }
    }

    class CmdPrehandleCenter extends CmdPrehandler {
        constructor() {
            const handle = function (performer, cmd) {
                var result = cmd;
                for (const handler of this._handlers) {
                    result = handler.handle(performer, result);
                }
                return result;
            };
            super(handle, -1);
            this._handlers = [];
            this.instance = this;
        }
        static shared() {
            if (!this.instance) {
                this.instance = new CmdPrehandleCenter();
            }
            return this.instance;
        }
        addHandler(handler) {
            SortInsert(this._handlers, handler, (p, c) => {
                return p.priority >= c.priority;
            });
        }
    }

    //---------------------------------------------------------------------------
    //  Cmd Executor
    //---------------------------------------------------------------------------

    const CmdExecutorPriority = {
        compiler: 90,

        // 层外使用
        high: 30,
        ordinary: 20,
        low: 10
    };

    class CmdExecutor {
        /**
         * @param {Function} appropriate function(cmd: String) -> Boolean
         * @param {Function} execute function(performer: Performer, cmd: String)
         * @param {Number} priority
         */
        constructor(appropriate, execute, priority) {
            this._appropriate = appropriate;
            this._execute = execute;
            this.priority = priority ? priority : CmdExecutorPriority.ordinary;
        }
        appropriate(cmd) {
            return this._appropriate(cmd);
        }
        execute(performer, cmd) {
            return this._execute(performer, cmd);
        }
    }

    var CmdExecuteCenter = {
        addExecutor: function (executor) {
            SortInsert(this._executors, executor, (p, c) => {
                return p.priority >= c.priority;
            });
        },
        //【2026-09-06 调整】execute 改 async：已删除 (:eqHas) 词条的预扫描与自动 checkobj 拉取
        execute: async function (performer, cmd) {
            var valid = null;
            for (const executor of this._executors) {
                if (executor.appropriate(cmd)) {
                    valid = executor;
                    break;
                }
            }
            if (valid == null) {
                throw `无法处理此命令: ${cmd}`;
            }
            return valid.execute(performer, cmd);
        },
        _executors: []
    };

    //---------------------------------------------------------------------------
    //  Performer
    //---------------------------------------------------------------------------

    class Performer {
        /**
         * @param {String} source
         */
        constructor(name, source) {
            this._name = name;
            this._source = source;
            this._log = false;
            this._running = false;
            this._pausing = false;
        }

        name() {
            return this._name;
        }
        runing() {
            return this._running;
        }
        pausing() {
            return this._pausing;
        }
        log(value) {
            if (value == null) return this._log;
            if (/\/\/\s*~silent\s*\n/.test(this._source) == true) return this._log;
            this._log = value;
        }

        start(callback) {
            if (this._running) return;

            try {
                var compiler = new Compiler();
                var start = new Date().getTime();
                this._cmds = compiler.compile(this._source);
                var end = new Date().getTime();
                console.log(`编译总耗时: ${end - start} 毫秒`);
            } catch (err) {
                // 【2026-08-11】错误信息带流程名，方便排障定位
                WMsg.append(`<ord>流程「${this._name}」编译错误</ord>: ${err}`);
                return;
            }

            if (this._log) WMsg.append(`<hiy>开始执行，流程: ${this._name}...</hiy>`);
            this._running = true;
            this._pausing = false;

            this._callback = callback;

            this._pc = 0;
            this._cc = true;

            this._guarding = false;
            this._subflows = [];

            this._perform();
        }
        stop() {
            if (!this._running) return;
            this._running = false;
            for (const subflow of this._subflows) {
                subflow.stop();
            }
            if (this._log) WMsg.append(`<hiy>执行完毕，流程: ${this._name}。</hiy>`);
            if (this._callback) this._callback();
        }
        pause() {
            if (!this._running) return;
            if (this._log) WMsg.append(`<hiy>暂停执行，流程: ${this._name}...</hiy>`);
            this._pausing = true;
            for (const subflow of this._subflows) {
                subflow.pause();
            }
        }
        resume() {
            if (!this._running || !this._pausing) return;
            if (this._log) WMsg.append(`<hiy>恢复执行，流程: ${this._name}。</hiy>`);
            this._pausing = false;
            for (const subflow of this._subflows) {
                subflow.resume();
            }
            this._perform();
        }

        guarding() {
            return this._guarding;
        }
        timeSeries(timestamp) {
            if (timestamp != null) {
                if (!this.guarding()) this._systemCmdTimeSeries = timestamp;
                return;
            }
            return this._systemCmdTimeSeries;
        }

        async _perform() {
            if (!this._running || this._pausing) return;
            if (this._doing) return;

            var cmd = this._cmds[this._pc];
            // console.log(`>>> ${this._name}, ${this._pc}, ${this._cc}, ${cmd}`);
            this._pc += 1;

            try {
                this._doing = true;
                await CmdExecuteCenter.execute(this, cmd);
            } catch (err) {
                // 【2026-08-11】错误信息带流程名（+出错命令片段，便于定位哪条命令）
                var _errCmd = (cmd && typeof cmd === 'string' && cmd.length > 60) ? cmd.substring(0, 60).replace(/[\r\n]/g, ' ') + '…' : (cmd || '');
                WMsg.append(`<ord>流程「${this._name}」执行错误</ord>: ${err}${_errCmd ? '（命令：' + _errCmd + '）' : ''}`);
                this.stop();
                return;
            } finally {
                this._doing = false;
            }
            this._perform();
        }
    }

    // Compile Cmd Executor

    (function () {
        const appropriate = function (cmd) {
            return cmd == "%exit";
        };
        const execute = function (performer, cmd) {
            performer.stop();
        };
        const executor = new CmdExecutor(appropriate, execute, CmdExecutorPriority.compiler);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return cmd == "%pass";
        };
        const execute = function (performer, cmd) { };
        const executor = new CmdExecutor(appropriate, execute, CmdExecutorPriority.compiler);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return cmd.indexOf("%PC=CC") == 0;
        };
        const execute = function (performer, cmd) {
            performer._pc = eval(`performer._cc${cmd.substring(6)}`);
        };
        const executor = new CmdExecutor(appropriate, execute, CmdExecutorPriority.compiler);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return cmd.indexOf("%PC=") == 0;
        };
        const execute = function (performer, cmd) {
            performer._pc = eval(cmd.substring(4));
        };
        const executor = new CmdExecutor(appropriate, execute, CmdExecutorPriority.compiler);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return cmd.indexOf("%CC=") == 0;
        };
        const execute = function (performer, cmd) {
            const validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
            var assert = AssertHolderCenter.get(validCmd.substring(4));
            performer._cc = assert();
        };
        const executor = new CmdExecutor(appropriate, execute, CmdExecutorPriority.compiler);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return cmd == "%guardStart";
        };
        const execute = function (performer, cmd) {
            performer._guarding = true;
        };
        const executor = new CmdExecutor(appropriate, execute, CmdExecutorPriority.compiler);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return cmd == "%guardEnd";
        };
        const execute = function (performer, cmd) {
            performer._guarding = false;
        };
        const executor = new CmdExecutor(appropriate, execute, CmdExecutorPriority.compiler);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return /^<===[^爫]*===>$/.test(cmd);
        };
        const execute = function (performer, cmd) {
            const source = cmd.slice(4, -4);
            const p = new Performer("subflow", source);
            performer._subflows.push(p);
            p.start();
        };
        const executor = new CmdExecutor(appropriate, execute, CmdExecutorPriority.compiler);
        CmdExecuteCenter.addExecutor(executor);
    })();

    //---------------------------------------------------------------------------
    //  Variable
    //---------------------------------------------------------------------------

    function TryCalculate(expression) {
        if (/^[0-9\+\-\*\/% ]*$/g.test(expression)) {
            return eval(expression);
        }
        return expression;
    }

    var PersistentVariables = null; // PersistentCache

    function UpdateVariable(performer, name, exp) {
        if (/^_*[A-Z][a-zA-Z0-9_]*$/.test(name)) {
            PersistentVariables.save(name, TryCalculate(exp));
        } else if (/^_*[a-z][a-zA-Z0-9_]*$/.test(name)) {
            if (performer.tempParams == null) {
                performer.tempParams = {};
            }
            performer.tempParams[name] = TryCalculate(exp);
        }
    }

    (function () {
        var patt = /^\(\$([A-Za-z_][a-zA-Z0-9_]*?)\)\s*=\s*(.+)\s*/;
        const appropriate = function (cmd) {
            return patt.test(cmd);
        };
        const execute = function (performer, cmd) {
            const validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
            var result = patt.exec(validCmd);
            // 【2026-08-14 修复】handle() 会解析 {r}/{b} 占位符等改变命令文本，可能使 exec 不再匹配 → 防空引用
            if (result == null) return;
            var name = result[1];
            var exp = result[2];
            UpdateVariable(performer, name, exp);
        };
        const executor = new CmdExecutor(appropriate, execute);
        CmdExecuteCenter.addExecutor(executor);
    })();

    var VariableStore = {
        register: function (getAll) {
            this._allGetAll.push(getAll);
        },
        getAll: function () {
            var result = {};
            for (const getAll of this._allGetAll) {
                const all = getAll();
                for (const key in all) {
                    if (!all.hasOwnProperty(key)) continue;
                    result[key] = all[key];
                }
            }
            return result;
        },
        _allGetAll: []
    };

    (function () {
        const _assignVariables = function (expression, params) {
            var placeholders = [];
            var patt = /\([:a-zA-Z0-9_]+?\)/g;
            var result = patt.exec(expression);
            while (result != null) {
                placeholders.push(result[0]);
                result = patt.exec(expression);
            }
            let assignedExp = expression;
            for (let i = 0; i < placeholders.length; i++) {
                const placeholder = placeholders[i];
                var key = placeholder.substring(1, placeholder.length - 1);
                var value = params[key];
                if (value == null) value = "null";
                assignedExp = assignedExp.replace(placeholder, value);
            }

            let placeholders2 = [];
            let patt2 = /\((:[a-zA-Z0-9_]+?)\s+([^\(\)\s][^\(\)]*?)\s*\)/g;
            let r2 = patt2.exec(assignedExp);
            while (r2 != null) {
                placeholders2.push({ value: r2[0], key: `${r2[1]} `, params: r2[2] });
                r2 = patt2.exec(assignedExp);
            }
            for (const p of placeholders2) {
                const func = params[p.key];
                let value = "null";
                if (func != null && typeof func == "function") {
                    value = func(p.params);
                }
                assignedExp = assignedExp.replace(p.value, value);
            }

            return assignedExp;
        };
        const assignVariables = function (expression, params) {
            let result = expression;
            while (true) {
                const assigned = _assignVariables(result, params);
                if (assigned == result) return result;
                result = assigned;
            }
        };
        const handle = function (performer, cmd) {
            let allParam = {};
            Object.assign(allParam, VariableStore.getAll(), performer.tempParams);
            const result = assignVariables(cmd, allParam);
            return result;
        };
        const handler = new CmdPrehandler(handle)
        CmdPrehandleCenter.shared().addHandler(handler);
    })();