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
        //【2026-08-09 移植v1.0.0 + 强化】execute 改 async：预扫描 (:eqHas) 词条用法。
        // 每次使用都强制重新 checkobj 查看装备（词条可被替换/洗练，不能用缓存），等待回包（最大 3 秒）
        execute: async function (performer, cmd) {
            var eqHasPattern = /\(:eqHas\s+([^,]+?),\s*[^)]+\)/g;
            var match;
            var fetchIds = [];
            var allParam = {};
            Object.assign(allParam, VariableStore.getAll(), performer.tempParams || {});
            while ((match = eqHasPattern.exec(cmd)) !== null) {
                var hasId = (match || ["", "", "", ""])[1].trim();
                if (hasId.indexOf("(") == 0 && hasId.lastIndexOf(")") == hasId.length - 1) {
                    var hasVar = hasId.substring(1, hasId.length - 1);
                    hasId = allParam[hasVar] || "";
                }
                if (hasId && fetchIds.indexOf(hasId) < 0) {
                    fetchIds.push(hasId);
                }
            }
            if (fetchIds.length > 0) {
                for (var fi = 0; fi < fetchIds.length; fi++) {
                    var eqId = fetchIds[fi];
                    // 【2026-08-09 优化】智能定位：本地数据能确定位置就只发一条，避免无脑发两条
                    var locate = null; // 'eq' | 'item' | null(未知)
                    if (Role.equipments && Role.equipments.eqs) {
                        for (var ei = 0; ei < Role.equipments.eqs.length; ei++) {
                            if (Role.equipments.eqs[ei] && Role.equipments.eqs[ei].id == eqId) {
                                locate = "eq";
                                break;
                            }
                        }
                    }
                    if (locate == null && Role.items && Role.items[eqId] != null) {
                        locate = "item";
                    }
                    var tries = locate == null ? ["eq", "item"] : [locate];
                    for (var ti = 0; ti < tries.length; ti++) {
                        Role._pendingEqFetch = eqId;
                        WG.SendCmd("checkobj " + eqId + " from " + tries[ti]);
                        console.log("[Raid] (:eqHas) 自动查看装备: checkobj " + eqId + " from " + tries[ti]);
                        // 非最后位置只等 1 秒就切换下一个位置；最后位置等 3 秒
                        var waitMax = (ti < tries.length - 1) ? 10 : 30;
                        await new Promise(function (resolve) {
                            var waitCount = 0;
                            var timer = setInterval(function () {
                                waitCount++;
                                if (Role._pendingEqFetch === "done") {
                                    clearInterval(timer);
                                    Role._pendingEqFetch = null;
                                    resolve();
                                } else if (waitCount > waitMax) {
                                    clearInterval(timer);
                                    Role._pendingEqFetch = null;
                                    resolve();
                                }
                            }, 100);
                        });
                        if (Role.itemDescs[eqId] != null) break; // 已拉到描述，不再试下一个位置
                    }
                    if (Role.itemDescs[eqId] == null) {
                        console.warn("[Raid] 自动查看装备超时/无返回，词条数据未就绪: checkobj " + eqId);
                    }
                }
            }
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
                Message.append(`<ord>流程「${this._name}」编译错误</ord>: ${err}`);
                return;
            }

            if (this._log) Message.append(`<hiy>开始执行，流程: ${this._name}...</hiy>`);
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
            if (this._log) Message.append(`<hiy>执行完毕，流程: ${this._name}。</hiy>`);
            if (this._callback) this._callback();
        }
        pause() {
            if (!this._running) return;
            if (this._log) Message.append(`<hiy>暂停执行，流程: ${this._name}...</hiy>`);
            this._pausing = true;
            for (const subflow of this._subflows) {
                subflow.pause();
            }
        }
        resume() {
            if (!this._running || !this._pausing) return;
            if (this._log) Message.append(`<hiy>恢复执行，流程: ${this._name}。</hiy>`);
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
                Message.append(`<ord>流程「${this._name}」执行错误</ord>: ${err}${_errCmd ? '（命令：' + _errCmd + '）' : ''}`);
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