// ============================================================
// raid-commands.js —— WSMUD 命令处理器 + 占位符 + 技能状态机（从 Raid.js 拆分）
// ============================================================

    /***********************************************************************************\
        WSMUD Cmd Prehandler And Handler
    \***********************************************************************************/

    //---------------------------------------------------------------------------
    //  WSMUD Raid 占位符
    //---------------------------------------------------------------------------

    const FilterCenter = {
        filter: function (filterExp, obj) {
            if (filterExp == null) {
                return false;
            }
            const exp = filterExp.substring(1, filterExp.length - 2);
            const yes = eval(`${exp}`);
            return yes;
        }
    }

    function ReplacePlaceholder(exp) {
        var patt = /\{([a-z]?)([^a-z%#]+?|<\w+>[^a-z%#]+?<\/\w+>)([a-z]?)(%?)(#?)\}\??(#[^#{}]*#)?/g;
        var placeholders = [];
        var result = patt.exec(exp);
        while (result != null) {
            placeholders.push({
                text: result[0],
                location: result[1] == "" ? null : result[1],
                name: result[2],
                blurry: result[4] != "%",
                quality: result[3] == "" ? null : result[3],
                type: result[5] != "#" ? "id" : "amount",
                filterExp: result[6]
            });
            result = patt.exec(exp);
        }
        const getValue = function (p) {
            let locationOrder = [];
            if (p.location == null) {
                locationOrder = p.quality == null ? ["r", "b", "d"] : ["b", "d"];
            } else {
                locationOrder = [p.location];
            }
            for (const location of locationOrder) {
                let value = null;
                switch (location) {
                    case "r":
                        value = Room.getItemId(p.name, p.blurry, false, p.filterExp);
                        break;
                    case "b": {
                        let item = Role.findItem(p.name, p.blurry, p.quality, p.filterExp);
                        if (item) {
                            value = p.type == "id" ? item.id : item.count;
                        }
                        break;
                    }
                    case "d": {
                        let item = DialogList.findItem(p.name, p.blurry, p.quality, p.filterExp);
                        if (item) {
                            value = p.type == "id" ? item.id : item.count;
                        }
                        break;
                    }
                }
                if (value != null) return value;
            }
            return null;
        };
        let realExp = exp;
        for (const p of placeholders) {
            let value = getValue(p);
            realExp = realExp.replace(p.text, value);
        }
        return realExp;
    }

    (function () {
        const handle = function (performer, cmd) {
            return ReplacePlaceholder(cmd);
        };
        const handler = new CmdPrehandler(handle)
        CmdPrehandleCenter.shared().addHandler(handler);
    })();

    (function () {
        const handle = function (cmds) {
            var result = [];
            var tempcmds = "";
            var inString = false;
            for (const cmd of cmds) {
                if (cmd.indexOf("`") == 0 || inString) {
                    var ccmd = cmd
                    if (cmd.indexOf("`") == 0) {
                        ccmd = cmd.substr(1);
                    }
                    if (cmd[cmd.length - 1] == "`") {
                        ccmd = cmd.substr(0, cmd.length - 1);
                    }
                    tempcmds = tempcmds + " " + ccmd
                    inString = true;
                }
                if (cmd[cmd.length - 1] == "`") {
                    result[result.length - 1] = result[result.length - 1] + tempcmds
                    tempcmds = "";
                    inString = false;
                    continue;
                }
                if (inString) {
                    continue;
                }
                const header = /^\s*/.exec(cmd)[0];
                let patt = /(\{[^\}]+\})([^\?]|$)/g;
                let r = patt.exec(cmd);
                let j = cmd.indexOf("@js")
                while (r != null && j == -1) {
                    result.push(`${header}@until ${r[1]}? != null`);
                    r = patt.exec(cmd);
                }
                result.push(cmd);
            }
            return result;
        };
        const rule = new PrecompileRule(handle, PrecompileRulePriority.low);
        PrecompileRuleCenter.shared().addRule(rule);
    })();

    //---------------------------------------------------------------------------
    //  WSMUD Raid 命令
    //---------------------------------------------------------------------------
    var __RecordGainsFrom = null;
    (function () {
        const executor = new CmdExecutor(cmd => {
            return cmd.indexOf("<-recordGains") == 0;
        }, (performer, _) => {
            if (performer.log()) WMsg.cmdLog("开始记录物品获取");
            __RecordGainsFrom = new Date().getTime();
        })
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new CmdExecutor(cmd => {
            return cmd.indexOf("recordGains->") == 0;
        }, (_, cmd) => {
            const gains = Role.gains(__RecordGainsFrom, new Date().getTime());
            var result = {};
            gains.forEach(gain => {
                var oldCount = 0;
                var old = result[gain.name];
                if (old) oldCount = old.count;
                result[gain.name] = { count: oldCount + gain.count, unit: gain.unit };
            });
            var content = "";
            if (cmd.indexOf("recordGains->silent") == -1) {
                WMsg.clean();
                WMsg.append("&nbsp;&nbsp;> 战利品列表如下：");
            }
            for (const name in result) {
                if (!result.hasOwnProperty(name)) continue;
                const gain = result[name];
                if (cmd.indexOf("recordGains->silent") == -1) {
                    WMsg.append("&nbsp;&nbsp;* " + name + " " + gain.count + gain.unit);
                }
                content += `&nbsp;&nbsp;* ${name} ${gain.count}${gain.unit}<br>`;
            }

            // 【2026-08-13 26.1.25】收益转纯文本：供流程变量引用（:gains 预设变量 / (_lastGains) 持久变量），
            // 流程里可直接拼进推送/聊天，如 @push 本次收益：(_lastGains)
            var _plain = (content || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n+/g, '\n').replace(/^ +/gm, '').trim();
            // 【2026-08-16】带颜色前缀版本：将游戏颜色标签 <hir>/<hig> 等转为 [颜色] 前缀文本，
            // 如 <hig>狂风快刀</hig> → [绿]狂风快刀，供企业微信等渠道直接推送（纯文本，无需格式转换）
            // 【2026-08-17】修正颜色映射：hic=蓝, hiz=紫（无大写标签）
            var _colorMap = { '<hig>':'[绿]','</hig>':'',
                '<hir>':'[红]','</hir>':'',
                '<him>':'[品红]','</him>':'',
                '<hic>':'[蓝]','</hic>':'',
                '<hiy>':'[黄]','</hiy>':'',
                '<hiz>':'[紫]','</hiz>':'',
                '<hio>':'[橙]','</hio>':'',
                '<wht>':'','</wht>':'',
                '<hiw>':'[白]','</hiw>':'',
                '<gre>':'[深绿]','</gre>':'',
                '<mag>':'[紫]','</mag>':'',
                '<red>':'[暗红]','</red>':'',
                '<blu>':'[深蓝]','</blu>':'',
                '<hib>':'[深蓝]','</hib>':'' };
            var _richContent = (content || '');
            // 【2026-08-17 修复】服务器返回的颜色标签大小写不固定（实测有大写 <HIZ>），
            // 原 split/join 只匹配小写标签导致大写标签不转换；改用不区分大小写的正则替换
            _richContent = _richContent.replace(/<(\/?)(hig|hir|him|hic|hiy|hiz|hio|wht|hiw|gre|mag|red|blu|hib)>/gi, function (m, sl, tag) {
                var key = '<' + sl + tag.toLowerCase() + '>';
                return _colorMap.hasOwnProperty(key) ? _colorMap[key] : m;
            });
            _richContent = _richContent.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/g, ' ').replace(/\n+/g, '\n').replace(/^ +/gm, '').trim();
            Role.profitInfo = _plain != "" ? _plain : null;
            // 持久变量 _lastGains：刷新后仍在，流程里 (_lastGains) 引用
            try {
                if (typeof PersistentVariables !== 'undefined' && PersistentVariables && typeof PersistentVariables.save === 'function') {
                    PersistentVariables.save('_lastGains', _plain != "" ? _plain : "");
                }
            } catch (e) { }

            // 【2026-08-13 26.1.23 收益推送】战利品统计推送到手机（企业微信等渠道；推送总开关未开则静默）
            // silent/nopopup 模式也推送——正好适合"游戏内静默统计 + 手机看收益"的挂机场景
            // 收益推送使用 _richContent（带企业微信颜色标签），其他渠道用 _plain（纯文本）
            try {
                if (typeof PushAlert === 'function' && _plain) {
                    var _d = new Date();
                    var _ts = String(_d.getHours()).padStart(2, '0') + ':' + String(_d.getMinutes()).padStart(2, '0');
                    // 收益类 10 分钟防重复（比默认 15 分钟宽松，避免连续副本吞掉统计）
                    PushAlert('gains', '💰 收益统计(' + _ts + ')：\n' + _richContent, 10 * 60 * 1000);
                }
            } catch (e) { }

            if (cmd.indexOf("recordGains->nopopup") == 0 || cmd.indexOf("recordGains->silent") == 0) return;
            layer.open({
                type: 1,
                skin: "layui-layer-rim",
                area: ["380px", "300px"],
                title: "战利品列表",
                content: content,
                offset: 'auto',
                shift: 2
            });
        })
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("toolbar", function (performer, param) {
            performer.timeSeries(new Date().getTime());
            $(`span[command=${param}]`).click();
            return new Promise(resolve => {
                setTimeout(_ => {
                    $(".glyphicon-remove-circle").click();
                    resolve();
                }, 500);
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new UntilAtCmdExecutor("liaoshang", function (performer, param) {
            if (Role.hp / Role.maxHp >= 1) {
                WG.SendCmd("stopstate");
                return true;
            }
            if (Role.state != RoleState.liaoshang) {
                WG.SendCmd("stopstate;liaoshang");
            }
            return false;
        }, null, 1000);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new UntilAtCmdExecutor("dazuo", function (performer, param) {
            if (Role.mp / Role.maxMp > 0.99) {
                WG.SendCmd("stopstate");
                return true;
            }
            if (Role.state != RoleState.dazuo) {
                WG.SendCmd("stopstate;dazuo");
            }
            return false;
        }, null, 1000);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new UntilAtCmdExecutor("eq", function (performer, param) {
            const eqIds = param.split(",");
            let cmds = [];
            eqIds.forEach(eqId => {
                if (!Role.wearing(eqId)) cmds.push(`eq ${eqId}`);
            });
            if (cmds.length > 0) {
                WG.SendCmd("stopstate;" + cmds.join(";"));
                return false;
            }
            return true;
        }, null, 1000);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new UntilAtCmdExecutor("cd", function (performer, param) {
            if (param == null) {
                return !Role.hasCoolingSkill();
            }

            let validParam = param;
            let isBlack = false;
            if (validParam[0] == "^") {
                validParam = validParam.substring(1);
                isBlack = true;
            }
            const skills = validParam.split(",");
            if (isBlack) {
                for (const cooling of Role.coolingSkills()) {
                    if (skills.indexOf(cooling) == -1) {
                        return false;
                    }
                }
            } else {
                let coolings = Role.coolingSkills();
                for (const skill of skills) {
                    if (coolings.indexOf(skill) != -1) {
                        return false;
                    }
                }
            }
            return true;
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    class UntilSearchedAtCmdExecutor extends UntilAtCmdExecutor {
        constructor(key, search) {
            const assert = function (performer, param) {
                let placeholders = [];
                let patt = /\(\$[a-zA-Z0-9_]+?\)/g;
                let result = patt.exec(param);
                while (result != null) {
                    placeholders.push(result[0]);
                    result = patt.exec(param);
                }
                let regex = param;
                for (let i = 0; i < placeholders.length; i++) {
                    const placeholder = placeholders[i];
                    regex = regex.replace(placeholder, "(.+?)");
                }
                let result2 = search(regex, performer.timeSeries());
                if (result2 == null) {
                    return false;
                }
                for (let j = 0; j < placeholders.length; j++) {
                    const placeholder = placeholders[j];
                    let key = placeholder.substring(2, placeholder.length - 1);
                    let value = result2[j + 1];
                    if (value != null) {
                        UpdateVariable(performer, key, value);
                    }
                }
                return true;
            };
            super(key, assert);
        }
    }

    (function () {
        const executor = new UntilSearchedAtCmdExecutor("tip", (regex, from) => {
            return SystemTips.search(regex, from);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new UntilSearchedAtCmdExecutor("msgtip", (regex, from) => {
            return MsgTips.search(regex, from);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new UntilSearchedAtCmdExecutor("task", (regex, from) => {
            return TaskList.search(regex, from);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();
    (function () {
        // 【2026-08-09 修改】@events：内置 events 命令，等服务器回包后再判断（不阻塞整个流程，
        // 但等待这一次 events 请求的服务器数据，最多 3 秒兜底）；带参数时用回包数据立即匹配并提取变量。
        // 【2026-08-22 修复】不能用 AtCmdExecutor——它会在 superExecute 里无条件调 CmdPrehandleCenter，
        // 把反向捕获占位符 ($Var) 提前替换成变量当前值，导致反捕获失效（匹配命中也无法取值）。
        // 改用手工"智能替换"：($Var) 保留给反向捕获，其余 (Var)/(:预设) 才做变量替换。
        const smartReplace = function (performer, param) {
            // 1) 先临时把反捕获占位符 ($Name) 换成哨兵符，避免被变量替换吞掉
            var tokens = [];
            param = param.replace(/\(\$[a-zA-Z0-9_]+?\)/g, function (s) {
                return "\u0001" + (tokens.push(s) - 1) + "\u0001";
            });
            // 2) 对剩余部分做正常变量替换（复用已注册进 CmdPrehandleCenter 的替换 handler）
            param = CmdPrehandleCenter.shared().handle(performer, param);
            // 3) 还原反捕获占位符
            for (let i = 0; i < tokens.length; i++) {
                param = param.replace("\u0001" + i + "\u0001", tokens[i]);
            }
            return param;
        };
        const executor = new CmdExecutor(function (cmd) {
            // 【2026-08-23】精确匹配 @events（需带参数或完全相等），避免拦截 @eventsall 命令
            return cmd === "@events" || /^@events\s/.test(cmd);
        }, function (performer, cmd) {
            const matched = /@events\s+(.*)$/.exec(cmd);
            const param = matched ? matched[1] : "";
            return new Promise(function (resolve) {
                var finished = false;
                var timeoutTimer = null;
                var hookId = null;
                var finish = function () {
                    if (finished) return;
                    finished = true;
                    if (timeoutTimer) clearTimeout(timeoutTimer);
                    if (hookId != null) {
                        try { WG.remove_hook(hookId); } catch (e) { }
                    }
                    resolve();
                };
                hookId = WG.add_hook("dialog", function (data) {
                    if (finished) return;
                    if (data.dialog == null || data.dialog != "events" || data.items == null) return;
                    if (param != null) {
                        // 服务器回包到达：用本次数据立即匹配（参考 EventList._monitorEventsList 的文本拼接）
                        let list = [];
                        for (const item of data.items) {
                            if (item.length > 2) {
                                list.push(item[1] + " " + item[2]);
                            }
                        }
                        // 智能替换：保留 ($Var) 用于反向捕获，其余做变量替换
                        const text = smartReplace(performer, param);
                        let placeholders = [];
                        let patt = /\(\$[a-zA-Z0-9_]+?\)/g;
                        let result = patt.exec(text);
                        while (result != null) {
                            placeholders.push(result[0]);
                            result = patt.exec(text);
                        }
                        // 反向捕获键名列表（后续用于"整轮未匹配则置 null"）
                        const captureKeys = placeholders.map(p => p.substring(2, p.length - 1));
                        let regex = text;
                        for (let i = 0; i < placeholders.length; i++) {
                            regex = regex.replace(placeholders[i], "(.+?)");
                        }
                        // 记录本轮是否匹配成功；未匹配到的反捕获变量置 null
                        let matched = false;
                        try {
                            let reg = new RegExp(regex);
                            for (const t of list) {
                                let m2 = reg.exec(t);
                                if (m2 != null) {
                                    matched = true;
                                    for (let j = 0; j < placeholders.length; j++) {
                                        let key = placeholders[j].substring(2, placeholders[j].length - 1);
                                        let value = m2[j + 1];
                                        if (value != null) UpdateVariable(performer, key, value);
                                    }
                                    break;
                                }
                            }
                        } catch (e) { }
                        // 【2026-08-22】整轮 events 数据都匹配不上时，反向捕获变量应置 null（而非沿用旧值）
                        if (!matched) {
                            for (const key of captureKeys) {
                                UpdateVariable(performer, key, null);
                            }
                        }
                    }
                    finish();
                });
                WG.Send("events");   // 向服务器请求事件列表
                timeoutTimer = setTimeout(finish, 3000);   // 3 秒兜底（服务器没回包也不卡流程）
            });
        }, CmdExecutorPriority.ordinary);
        CmdExecuteCenter.addExecutor(executor);
    })();
    (function () {
        // 【2026-08-23 新增】@eventsall：与 @events 一样等服务器 dialog:events 回包，但同一回包内
        // 支持按 `|` 分隔的多个独立匹配分支，每个分支各自对全部事件条目扫描并捕获变量，互不干扰。
        // 适用场景：同一次回包里包含多条不同活动（如"挖矿效率+($wkzn)。|采药获得的经验+($cyzn)。"），
        // 希望一次性把多个变量都提取到（原 @events 遇到第一条命中即 break，只能取到一个）。
        // smartReplace 与 @events 同逻辑（该 IIFE 局部变量，此处复制一份供本命令使用）
        const smartReplace = function (performer, param) {
            var tokens = [];
            param = param.replace(/\(\$[a-zA-Z0-9_]+?\)/g, function (s) {
                return "\u0001" + (tokens.push(s) - 1) + "\u0001";
            });
            param = CmdPrehandleCenter.shared().handle(performer, param);
            for (let i = 0; i < tokens.length; i++) {
                param = param.replace("\u0001" + i + "\u0001", tokens[i]);
            }
            return param;
        };
        const executor = new CmdExecutor(function (cmd) {
            return cmd.indexOf("@eventsall") == 0;
        }, function (performer, cmd) {
            const matched = /@eventsall\s+(.*)$/.exec(cmd);
            const param = matched ? matched[1] : "";
            return new Promise(function (resolve) {
                var finished = false;
                var timeoutTimer = null;
                var hookId = null;
                var finish = function () {
                    if (finished) return;
                    finished = true;
                    if (timeoutTimer) clearTimeout(timeoutTimer);
                    if (hookId != null) {
                        try { WG.remove_hook(hookId); } catch (e) { }
                    }
                    resolve();
                };
                hookId = WG.add_hook("dialog", function (data) {
                    if (finished) return;
                    if (data.dialog == null || data.dialog != "events" || data.items == null) return;
                    if (param != null) {
                        let list = [];
                        for (const item of data.items) {
                            if (item.length > 2) {
                                list.push(item[1] + " " + item[2]);
                            }
                        }
                        // 智能替换：保留 ($Var) 用于反向捕获，其余做变量替换
                        const text = smartReplace(performer, param);
                        // 收集本命令所有反捕获占位符（整轮全部未匹配时置 null 用）
                        let allPlaceholders = [];
                        let ptt = /\(\$[a-zA-Z0-9_]+?\)/g;
                        let rr = ptt.exec(text);
                        while (rr != null) {
                            allPlaceholders.push(rr[0]);
                            rr = ptt.exec(text);
                        }
                        const allCaptureKeys = allPlaceholders.map(p => p.substring(2, p.length - 1));
                        // 按 | 拆成多个独立分支，各自扫描全部条目捕获
                        const segments = String(text).split("|");
                        const hitKeys = {};
                        for (const seg of segments) {
                            if (!seg) continue;
                            // 该分支占位符 → 替换为正则捕获组
                            let segPlaceholders = [];
                            let sp = /\(\$[a-zA-Z0-9_]+?\)/g;
                            let sr = sp.exec(seg);
                            while (sr != null) {
                                segPlaceholders.push(sr[0]);
                                sr = sp.exec(seg);
                            }
                            let segRegex = seg;
                            for (let i = 0; i < segPlaceholders.length; i++) {
                                segRegex = segRegex.replace(segPlaceholders[i], "(.+?)");
                            }
                            try {
                                let sreg = new RegExp(segRegex);
                                for (const t of list) {
                                    let m3 = sreg.exec(t);
                                    if (m3 != null) {
                                        for (let j = 0; j < segPlaceholders.length; j++) {
                                            let key = segPlaceholders[j].substring(2, segPlaceholders[j].length - 1);
                                            let value = m3[j + 1];
                                            if (value != null) {
                                                UpdateVariable(performer, key, value);
                                                hitKeys[key] = true;
                                            }
                                        }
                                        break;   // 该分支命中即停，去处理下一分支
                                    }
                                }
                            } catch (e) { }
                        }
                        // 整轮（所有分支）都未捕获到的反捕获变量 → 置 null
                        for (const key of allCaptureKeys) {
                            if (!hitKeys[key]) {
                                UpdateVariable(performer, key, null);
                            }
                        }
                    }
                    finish();
                });
                WG.Send("events");   // 请求事件列表
                timeoutTimer = setTimeout(finish, 3000);
            });
        }, CmdExecutorPriority.ordinary);
        CmdExecuteCenter.addExecutor(executor);
    })();
    (function () {
        const executor = new UntilSearchedAtCmdExecutor("xy", (regex, from) => {
            return Xiangyang.search(regex, from);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new UntilAtCmdExecutor("kill", function (performer, param) {
            const parts = param.split(",");
            let infos = [];
            for (let i = 0; i < parts.length; i++) {
                const name = parts[i];
                let blurry = true;
                if (name.substring(name.length - 1) == "%") {
                    name = name.substring(0, name.length - 1);
                    blurry = false;
                }
                infos.push({ name: name, blurry: blurry });
            }
            const finish = Room.didKillItemsInRoom(infos);
            if (finish) {
                return true;
            } else {
                let cmd = "";
                infos.forEach(info => {
                    const itemId = Room.getItemId(info.name, info.blurry, true);
                    if (itemId != null) { // 检查是否已处理
                        cmd += "kill " + itemId + ";";
                    }
                });
                WG.SendCmd(cmd);
                return false;
            }
        }, null, 1000, 1000);
        CmdExecuteCenter.addExecutor(executor);
    })();

    /* 等待，直到 dialog 打开，在打开 dialog 后调用，便于后续使用占位符 */
    (function () {
        const executor = new UntilAtCmdExecutor("dialog", function (performer, param) {
            return DialogList.timestamp > performer.timeSeries();
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    function UntilRoleFreePerformerPromise(callback, log) {
        return PerformerPromise("@until (:free) == true", callback, log);
    }

    (function () {
        const executor = new AtCmdExecutor("cleanBag", function (performer, param) {
            if (performer.log()) WMsg.cmdLog("清理包裹");
            return UntilRoleFreePerformerPromise(resolve => {
                WG.SendCmd("sell all");
                setTimeout(resolve, 1000);
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        // 【2026-08-24 增强】@tidyBag：真正的一键整理包裹，固定顺序
        //   stopstate → 自动使用 → 分解 → 清单售卖(autoSellList) → 卖光剩余 → 存仓
        // 使用/分解/清单售卖均做"阻塞"（轮询物品用尽/角色空闲），确保上一步完成后再进入下一步。
        const executor = new AtCmdExecutor("tidyBag", function (performer, param) {
            // 分步进度提示（始终显示，不受 performer.log 开关限制）
            const step = function (m) { WMsg.cmdLog(m); };
            WMsg.cmdLog("整理包裹开始");
            return new Promise(function (resolve) {
                // 0) 先 stopstate 停掉当前动作，避免与新指令冲突
                WG.SendCmd("stopstate");
                setTimeout(function () {
                    // 1) 自动使用（阻塞）
                    WMsg.cmdLog("[1/4] 自动使用物品");
                    WG.tidyBlockUse(step).then(function () {
                        // 2) 分解（阻塞）
                        WMsg.cmdLog("[2/4] 分解装备");
                        WG.tidyBlockFenjie(step).then(function () {
                            // 3) 按 autoSellList 清单售卖（阻塞）
                            WMsg.cmdLog("[3/4] 按清单售卖");
                            WG.tidyBlockSell(step).then(function () {
                                // 4) 卖光剩余 + 存仓
                                WMsg.cmdLog("[4/4] 卖光剩余并存入仓库");
                                WG.SendCmd("sell all;store all");
                                setTimeout(function () { WMsg.cmdLog("整理包裹完成"); resolve(); }, 1000);
                            });
                        });
                    });
                }, 500);
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();


    (function () {
        const executor = new AtCmdExecutor("renew", function (performer, param) {
            if (performer.log()) WMsg.cmdLog("恢复角色气血和内力");
            return UntilRoleFreePerformerPromise(resolve => {
                Role.renew(_ => { setTimeout(resolve, 1000); });
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("beep", function (performer, param) {
            NotSound();
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("push", function (performer, param) {
            Push(param);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    //---------------------------------------------------------------------------
    //  Skill State Machine
    //---------------------------------------------------------------------------

    var SkillStateMachine = {
        perform: function (skill, force) {
            // if (!Role.hasSkill(skill)) return;
            const timestamp = new Date().getTime();
            this._perform(skill, force, timestamp);
        },
        _perform: function (skill, force, timestamp) {
            if (this._skillStack[skill] != null && this._skillStack[skill] > timestamp) return;
            const self = this;
            if ((!Role.isFree() && !force) || Role.coolingSkill(skill) || Role.rtime) {
                setTimeout(_ => {
                    self._perform(skill, force, timestamp);

                }, 200);
                return;
            }
            // if (!Role.hasSkill(skill)) {
            //     if( self._performNum < 10){
            //         setTimeout(_ => {
            //             self._perform(skill, force, timestamp);
            //         }, 200);
            //     }else{
            //         self._performNum = 0;
            //         return;
            //     }
            //     self._performNum = self._performNum + 1;
            //     return;
            // }
            this._skillStack[skill] = timestamp;
            WG.SendCmd(`perform ${skill}`);
            const timer = setInterval(_ => {
                if (Role.coolingSkill(skill) || Role.combating == false) {
                    clearInterval(timer);
                    if (self._skillStack[skill] != null && self._skillStack[skill] == timestamp) {
                        delete self._skillStack[skill];
                    }
                    return;
                }
                if (!Role.isFree() || Role.rtime) return;
                WG.SendCmd(`perform ${skill}`);
            }, 1000);
        },
        reset: function () {
            this._skillStack = {};
        },
        _skillStack: {},
        _performNum: 0
    }

    //---------------------------------------------------------------------------
    //  Send System Cmd
    //---------------------------------------------------------------------------

    var __systemCmdDelay = 1500;

    (function () {
        const executor = new AtCmdExecutor("cmdDelay", function (performer, param) {
            performer._cmdDelay = parseInt(param);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    const UnpackSystemCmd = function (cmd) {
        let result = cmd;
        let patt = /([^;]+)\[(\d+?)\]/g;
        let r = patt.exec(cmd);
        while (r != null) {
            const packedCmd = r[1];
            const count = parseInt(r[2]);
            const temp = (new Array(count)).fill(packedCmd);
            const unpackedCmd = temp.join(";");
            result = result.replace(r[0], unpackedCmd);
            r = patt.exec(cmd);
        }
        return result;
    };

    (function () {
        function createWorker(f) {
            var blob = new Blob(['(function(){' + f.toString() + '})()']);
            var url = window.URL.createObjectURL(blob);
            var worker = new Worker(url);
            return worker;
        }
        const executor = new CmdExecutor(_ => {
            return true;
        }, (performer, cmd) => {
            let validCmd = CmdPrehandleCenter.shared().handle(performer, cmd);
            validCmd = UnpackSystemCmd(validCmd);
            return UntilRoleFreePerformerPromise(resolve => {
                const timestamp = new Date().getTime();
                let delay = 0;
                const fromReject = timestamp - SystemTips.rejectTimestamp;
                if (fromReject < 1500) {
                    // console.log(fromReject);
                    delay = fromReject;
                }
                var wa = createWorker("setTimeout(() =>  postMessage('0'), " + delay + ")")
                wa.onmessage = function (event) {
                    wa.terminate();
                    if (performer.log()) WMsg.cmdLog("执行系统命令", validCmd);
                    performer.timeSeries(timestamp);
                    performer.systemCmdTimestamp = timestamp;
                    WG.SendCmd(validCmd);
                    const cmdDelay = performer._cmdDelay == null ? __systemCmdDelay : performer._cmdDelay;
                    setTimeout(resolve, cmdDelay);
                };
            });
        }, CmdExecutorPriority.low);
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("force", function (performer, param) {
            return new Promise(resolve => {
                if (performer.log()) WMsg.cmdLog("强行执行系统命令", param);
                WG.SendCmd(param);
                const cmdDelay = performer._cmdDelay == null ? __systemCmdDelay : performer._cmdDelay;
                setTimeout(resolve, cmdDelay);
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("perform", function (performer, param) {
            const skills = param.split(",");
            for (const skill of skills) {
                SkillStateMachine.perform(skill, false);
            }
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    //---------------------------------------------------------------------------
    //  Manage Trigger
    //---------------------------------------------------------------------------

    (function () {
        const executor = new AtCmdExecutor("on", function (performer, param) {
            unsafeWindow.TriggerCenter.activate(param);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    (function () {
        const executor = new AtCmdExecutor("off", function (performer, param) {
            unsafeWindow.TriggerCenter.deactivate(param);
        });
        CmdExecuteCenter.addExecutor(executor);
    })();