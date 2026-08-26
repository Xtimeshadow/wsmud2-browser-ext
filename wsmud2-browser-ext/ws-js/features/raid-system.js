// ============================================================
// raid-system.js —— 系统库 + 时间变量 + 用户配置（从 Raid.js 拆分）
// ============================================================

    /***********************************************************************************\
        System Library
    \***********************************************************************************/

    class AtCmdExecutor extends CmdExecutor {
        constructor(key, execute, priority) {
            const appropriate = function (cmd) {
                return cmd.indexOf(`@${key}`) == 0;
            };
            const superExecute = function (performer, cmd) {
                const validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
                let param = /^\s*(.*)\s*$/.exec(validCmd.substring(key.length + 1))[1];
                if (param && param.length == 0) param = null;
                return execute(performer, param);
            };
            super(appropriate, superExecute, priority);
        }
    }

    (function () {
        const executor = new AtCmdExecutor("wait", function (performer, param) {
            if (performer.log()) Message.cmdLog(`等待 ${(param / 1000).toFixed(2)} 秒`);
            return new Promise(resolve => {
                setTimeout(() => resolve(), param);
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("await", function (performer, param) {
            function createWorker(f) {
                var blob = new Blob(['(function(){' + f.toString() + '})()']);
                var url = window.URL.createObjectURL(blob);
                var worker = new Worker(url);
                return worker;
            }
            return new Promise(resolve => {
                var wa = createWorker("setTimeout(() =>  postMessage('0'), " + param + ")")
                wa.onmessage = function (event) {
                    wa.terminate();
                    resolve();
                };
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("debug", function (performer, param) {
            let text = param;
            if (text[0] == ">") {
                text = JSON.stringify(eval(text.substring(1)));
            }
            var message = `&nbsp;&nbsp;[debug]: <hiz>${text}</hiz>`;
            Message.append(message);
            // console.log(message);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("print", function (performer, param) {
            Message.append(param,0);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();
    (function () {
        const executor = new AtCmdExecutor("show", function (performer, param) {
            Message.append(param,1);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();
    // 【2026-08-09 新增】@zdsell / @zduse：自动售卖 / 自动使用（清单在设置里配置，调用 WG 方法）
    (function () {
        const executor = new AtCmdExecutor("zdsell", function (performer, param) {
            return WG.zdsell();
        });
        CmdExecuteCenter.addExecutor(executor);
        const executor2 = new AtCmdExecutor("zduse", function (performer, param) {
            return WG.zduse();
        });
        CmdExecuteCenter.addExecutor(executor2);
    })();

    // 【2026-08-16】@zmlwait 自命令名 —— 阻塞执行自命令
    // 用法：流程/触发源码里写 `@zmlwait 武道回血`（替代非阻塞的 `$usezml 武道回血`），
    //       会等自命令真正执行完再继续，无需手动传变量 + @until。
    // 按自命令类型处理：
    //   类型0（命令串）→ 发给 WG.SendCmd，等命令队列清空 + 400ms 稳定（含 $wait 连锁补发，60s 兜底）
    //   类型1（Raid流程）→ 启动该流程并等它跑完
    //   类型2（JS）→ 同步执行；若返回 Promise 则等它
    (function () {
        function _runZmlBlocking(item, name) {
            var type = String(item.zmlType);
            if (type === '2') {
                // JS 类型：同步执行；若返回 Promise 则阻塞等待
                return Promise.resolve(eval(item.zmlRun));
            }
            if (type === '1') {
                // Raid 流程类型：启动子流程并等它跑完。
                // 【2026-08-17 修复】不用 ManagedPerformerCenter.start（会注册到"运行中流程"面板，
                // 导致 @zmlwait 多出一条「自命令-名称」条目）；改用裸 Performer 静默运行，面板只留主流程一条。
                return new Promise(function (resolve) {
                    try {
                        const p = new Performer('', item.zmlRun);
                        p.start(resolve);
                    } catch (e) {
                        console.error('[Raid] @zmlwait 子流程启动失败:', e);
                        resolve();
                    }
                });
            }
            // 类型 0（默认）：命令串 → 轮询命令队列清空 + 400ms 稳定
            return new Promise(function (resolve) {
                try { WG.SendCmd(item.zmlRun); } catch (e) { resolve(); return; }
                var lastBusy = Date.now();
                var timer = setInterval(function () {
                    try {
                        var idle = (typeof unsafeWindow.__extCmdQueueIdle === 'function') ? unsafeWindow.__extCmdQueueIdle() : true;
                        if (idle) {
                            if (Date.now() - lastBusy >= 400) {
                                clearInterval(timer);
                                resolve();
                            }
                        } else {
                            lastBusy = Date.now();
                        }
                    } catch (e) { clearInterval(timer); resolve(); }
                }, 150);
                setTimeout(function () { clearInterval(timer); resolve(); }, 60000); // 60s 兜底，防卡死流程
            });
        }

        const executor = new AtCmdExecutor("zmlwait", function (performer, param) {
            const name = String(param || '').trim();
            if (!name) return Promise.resolve();
            try {
                const list = GM_getValue(roleid + "_zml", zml);
                const item = (Array.isArray(list) ? list : []).find(function (z) { return z && z.name == name; });
                if (!item) {
                    if (performer.log()) Message.append(`<hir>自命令「${name}」不存在，@zmlwait 已跳过</hir>`, 0);
                    return Promise.resolve();
                }
                if (performer.log()) Message.cmdLog(`执行自命令「${name}」（阻塞等待完成）`);
                return _runZmlBlocking(item, name);
            } catch (e) {
                console.error('[Raid] @zmlwait 执行失败:', e);
                return Promise.resolve();
            }
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    class UntilAtCmdExecutor extends CmdExecutor {
        constructor(key, assert, priority, tryAgain, timeout) {
            const appropriate = function (cmd) {
                return cmd.indexOf(`@${key}`) == 0;
            };
            const superExecute = function (performer, cmd) {
                const tryExecute = function (callback) {
                    const validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
                    let param = /^\s*(.*)\s*$/.exec(validCmd.substring(key.length + 1))[1];
                    if (param != null && param.length == 0) param = null;
                    const result = assert(performer, param);
                    if (result == true) {
                        if (timeout != null) {
                            setTimeout(_ => { callback(); }, timeout);
                        } else {
                            callback();
                        }
                    } else {
                        setTimeout(_ => { tryExecute(callback); }, tryAgain != null ? tryAgain : 500);
                    }
                };
                if (performer.log()) Message.cmdLog("等待，直至符合条件", cmd);
                return new Promise(resolve => {
                    tryExecute(resolve);
                });
            };
            super(appropriate, superExecute, priority);
            this._key = key;
            this._assert = assert;
        }
    }

    (function () {
        const executor = new UntilAtCmdExecutor("until", function (performer, param) {
            const assert = AssertHolderCenter.get(param);
            return assert();
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return cmd.indexOf("@js ") == 0;
        };
        const execute = function (performer, cmd) {
            const validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
            let exp = validCmd.substring(4);
            console.log(performer);
            if (performer.log()) Message.cmdLog("调用 js", exp);
            const result = /^\(\$([A-Za-z_][a-zA-Z0-9_]*?)\)\s*=\s*/.exec(exp);
            if (result == null) {
                eval(exp);
                return;
            }
            const name = result[1];
            exp = exp.substring(result[0].length);
            UpdateVariable(performer, name, eval(exp));
        };
        const executor = new CmdExecutor(appropriate, execute);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return cmd.indexOf("@stop ") == 0;
        };
        const execute = function (performer, cmd) {
            const validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
            let exp = validCmd.substring(6);
            if (performer.log()) Message.cmdLog("停止流程", exp);
            const result = /^\(\$([A-Za-z_][a-zA-Z0-9_]*?)\)\s*=\s*/.exec(exp);
            if (result == null) {
                ManagedPerformerCenter.getAll().filter(x => x.name() == exp).forEach(x => x.stop())
                return;
            }
            const name = result[1];
            exp = exp.substring(result[0].length);
            UpdateVariable(performer, name, ManagedPerformerCenter.getAll().filter(x => x.name() == exp).forEach(x => x.stop()));
        };
        const executor = new CmdExecutor(appropriate, execute);
        CmdExecuteCenter.addExecutor(executor);
    })();

    // 【发呆检测】@idle_cmd 命令：开/关/状态/设置
    (function () {
        const appropriate = function (cmd) {
            return cmd.indexOf("@idle_cmd ") == 0;
        };
        const execute = function (performer, cmd) {
            const validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
            let exp = validCmd.substring(10).trim();
            if (performer.log()) Message.cmdLog("发呆检测", exp);
            if (exp == "开" || exp == "关") {
                _idleCmdSwitch = exp;
                GM_setValue("_idleCmdSwitch", _idleCmdSwitch);
                idleCmdStart();
                Message.append("<hio>发呆检测已" + (exp == "开" ? "开启" : "关闭") + "</hio>");
            } else if (exp == "状态") {
                var status = _idleCmdSwitch == "开" ? "开启" : "关闭";
                var isIdle = (typeof Role !== 'undefined' && Role.isIdle) ? Role.isIdle() : false;
                var idleSec = isIdle ? Role.getIdleTime() : 0;
                Message.append("<hio>发呆检测：" + status + "，阈值：" + _idleCmdSeconds + "秒" + (isIdle ? "，当前已发呆：" + idleSec + "秒" : "") + "，命令：" + (_idleCmdContent || "无") + "</hio>");
            } else {
                var parts = exp.split(/\s+/);
                if (parts.length >= 1 && !isNaN(parseInt(parts[0]))) {
                    _idleCmdSeconds = parseInt(parts[0]);
                    _idleCmdContent = parts.slice(1).join(" ") || _idleCmdContent;
                    GM_setValue("_idleCmdSeconds", _idleCmdSeconds);
                    GM_setValue("_idleCmdContent", _idleCmdContent);
                    Message.append("<hio>发呆检测已设置：阈值 " + _idleCmdSeconds + "秒，命令：" + (_idleCmdContent || "无") + "</hio>");
                }
            }
        };
        const executor = new CmdExecutor(appropriate, execute);
        CmdExecuteCenter.addExecutor(executor);
    })();

    /***********************************************************************************\
        Time Variables
    \***********************************************************************************/

    VariableStore.register(_ => {
        return {
            ":date": new Date().getDate(),
            ":day": new Date().getDay(),
            ":hour": new Date().getHours(),
            ":minute": new Date().getMinutes(),
            ":second": new Date().getSeconds(),
            ':mSec': new Date().getMilliseconds()
        }
    });

    /***********************************************************************************\
        Compatible With wsmud_pluginss
    \***********************************************************************************/

    /**
     * @param {String} source
     * @param {Function} callback function(resolve)->void
     */
    function PerformerPromise(source, callback, log) {
        return new Promise(resolve => {
            const p = new Performer("", source);
            if (log) p.log(log);
            p.start(_ => {
                if (callback) {
                    callback(resolve);
                } else {
                    resolve();
                }
            });
        });
    }

    (function () {
        const appropriate = function (cmd) {
            return cmd.indexOf("$wait ") == 0;
        };
        const execute = function (performer, cmd) {
            return PerformerPromise(`@wait ${cmd.substring(6)}`, null, performer.log());
        };
        const executor = new CmdExecutor(appropriate, execute);
        CmdExecuteCenter.addExecutor(executor);
    })();

    /***********************************************************************************\
        User Config Param
    \***********************************************************************************/

    var __ConfigDomIdCounter = 0;
    function GetConfigDomId() {
        const id = __ConfigDomIdCounter;
        __ConfigDomIdCounter += 1;
        return `wsmud_raid_config_dom_id_${id}`;
    }

    var __ConfigPanelHtml = "";
    var __ConfigPanelInits = [];
    var __ConfigPanelActions = [];

    class HashCmdExecutor extends CmdExecutor {
        constructor(key, handle) {
            const appropriate = function (cmd) {
                return cmd.indexOf(`#${key}`) == 0;
            };
            const superHandle = function (performer, cmd) {
                const validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
                const param = validCmd.substring(this._key.length + 2);
                const result = handle(performer, cmd, param);
                if (result == null) return;
                if (result.html) __ConfigPanelHtml += result.html;
                if (result.init) __ConfigPanelInits.push(result.init);
                if (result.action) __ConfigPanelActions.push(result.action);
            };
            super(appropriate, superHandle);
            this._key = key;
        }
    }

    (function () {
        const executor = new HashCmdExecutor("input", function (performer, cmd, param) {
            const result = /^\(\$([a-zA-Z0-9_]+)\)\s?=\s?([^,]+?),(.*)\s*$/.exec(param);
            if (result == null) {
                throw `错误的格式: ${cmd}`;
            }
            const variableName = result[1];
            const desc = result[2];
            const defaultValue = result[3] == null ? "" : result[3];
            const id = GetConfigDomId();
            const html = `
            <p>
                <label for="${id}">&nbsp;* ${desc}:&nbsp;</label><input style='width:80px' id ="${id}" type="text">
            </p>`;
            const init = function () {
                $(`#${id}`).val(defaultValue);
            };
            const action = function () {
                let result = {};
                result[variableName] = $(`#${id}`).val();
                return result;
            };
            return { html: html, init: init, action: action };
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new HashCmdExecutor("select", function (performer, cmd, param) {
            const result = /^\(\$([a-zA-Z0-9_]+)\)\s?=\s?([^,]+?),([^,]+?),([^,]+?)\s*$/.exec(param);
            if (result == null) {
                throw `错误的格式: ${cmd}`;
            }
            const variableName = result[1];
            const desc = result[2];
            const options = result[3].split("|");
            const defaultValue = result[4];
            const id = GetConfigDomId();
            let optionsHtml = "";
            options.forEach(option => {
                optionsHtml += `<option value="${option}">${option}</option>`;
            });
            const html = `
            <p>
                <label for="${id}">&nbsp;* ${desc}:&nbsp;</label><select style='width:80px' id="${id}">
                    ${optionsHtml}
                </select>
            </p>`;
            const init = function () {
                $(`#${id}`).val(defaultValue);
            };
            const action = function () {
                let result = {};
                result[variableName] = $(`#${id}`).val();
                return result;
            };
            return { html: html, init: init, action: action };
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const appropriate = function (cmd) {
            return /^#config\s*$/.test(cmd);
        };
        const execute = function (performer, cmd) {
            return new Promise(resolve => {
                var index = layer.open({
                    type: 1,
                    skin: "layui-layer-rim", //加上边框
                    area: "350px",
                    title: "配置参数",
                    content: __ConfigPanelHtml,
                    offset: "auto",
                    shift: 2,
                    move: false,
                    closeBtn: 0,
                    success: function (layero, index) {
                        __ConfigPanelInits.forEach(init => { init(); });
                        for (const node of layero[0].children) {
                            if (node.className != "layui-layer-content") continue;
                            node.setAttribute("style", "max-height: 370px;color: rgb(0, 128, 0);");
                        }
                    },
                    end: function () {
                        __ConfigPanelHtml = "";
                        __ConfigPanelInits = [];
                        __ConfigPanelActions = [];
                    },
                    btn: ['运行流程', '取消'],
                    yes: function () {
                        __ConfigPanelActions.forEach(action => {
                            const params = action();
                            for (const key in params) {
                                if (!params.hasOwnProperty(key)) continue;
                                UpdateVariable(performer, key, params[key]);
                            }
                        });
                        layer.close(index);
                        resolve();
                    },
                    btn2: function () {
                        performer.stop();
                        resolve();
                    }
                });
            });
        };
        const executor = new CmdExecutor(appropriate, execute);
        CmdExecuteCenter.addExecutor(executor);
    })();