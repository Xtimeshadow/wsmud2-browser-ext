// ============================================================
// raid-ui.js —— UI
// ============================================================

//---------------------------------------------------------------------------
//  兼容 1.x.x
//---------------------------------------------------------------------------

var CmdGroupManager = {
    /**
     * @returns {{ id: number, name: string }[]}
     */
    getAll: function () {
        var result = [];
        GM_listValues().map(function (key) {
            if (key.indexOf(CmdGroupManager._prefix) == 0) {
                var id = CmdGroupManager._id(key);
                var name = CmdGroupManager.getName(id);
                result.push({ id: id, name: name });
            }
        });
        return result;
    },
    getName: function (id) {
        var value = GM_getValue(this._key(id));
        if (value == null) return null;
        var obj = JSON.parse(value);
        return obj.name;
    },
    getCmdsText: function (id) {
        var value = GM_getValue(this._key(id));
        if (value == null) return "";
        var obj = JSON.parse(value);
        var cmdsStr = obj.cmdsStr;
        return cmdsStr;
    },
    /**
     * @returns {string[]}
     */
    getCmds: function (id) {
        var text = this.getCmdsText(id);
        var cmds = text.split(/^\s*|\s*\n+\s*/g);
        var first = cmds[0];
        if (first != null && first.length == 0) {
            cmds.splice(0, 1);
        }
        var last = cmds[cmds.length - 1];
        if (last != null && last.length == 0) {
            cmds.splice(cmds.length - 1, 1);
        }
        return cmds;
    },
    createCmdGroup: function (name, cmdsStr) {
        var id = new Date().getTime();
        return this.updateCmdGroup(id, name, cmdsStr);
    },
    updateCmdGroup: function (id, name, cmdsStr) {
        if (name == null || !/\S+/g.test(name)) {
            alert("命令组想要一个名字...");
            return false;
        }
        if (cmdsStr == null || !/\S+/g.test(cmdsStr)) {
            alert("命令组不想没有任何内容...");
            return false;
        }
        // 存储格式
        var value = {
            name: name,
            cmdsStr: cmdsStr
        };
        GM_setValue(this._key(id), JSON.stringify(value));
        return true;
    },
    removeCmdGroup: function (id) {
        GM_deleteValue(this._key(id));
    },

    _prefix: "@cmdgroup",
    _key: function (id) {
        return this._prefix + id;
    },
    _id: function (key) {
        return parseInt(key.substring(this._prefix.length));
    }
};

var WorkflowConfigManager = {
    /**
     * @returns {{ id: number, name: string }[]}
     */
    getAll: function () {
        var result = [];
        GM_listValues().map(function (key) {
            if (WorkflowConfigManager._isMyKey(key)) {
                var id = WorkflowConfigManager._id(key);
                var name = WorkflowConfigManager.getName(id);
                result.push({ id: id, name: name });
            }
        });
        return result;
    },
    getName: function (id) {
        var value = GM_getValue(this._key(id));
        if (value == null) return null;
        var obj = JSON.parse(value);
        return obj.name;
    },
    /**
     * @returns {{ id: number, repeat: number }[]}
     */
    getCmdGroupInfos: function (id) {
        var value = GM_getValue(this._key(id));
        if (value == null) return null;
        var obj = JSON.parse(value);
        return obj.infos;
    },
    /**
     * @returns {Workflow}
     */
    getWorkflow: function (id) {
        var cmdGroupInfos = this.getCmdGroupInfos(id);
        var items = [];
        for (const info of cmdGroupInfos) {
            var name = CmdGroupManager.getName(info.id);
            var cmds = CmdGroupManager.getCmds(info.id);
            var commandWorkflow = new CommandWorkflow(name, cmds, info.repeat);
            items.push(commandWorkflow);
        }
        var workflow = new Workflow(this.getName(id), items, 1);
        return workflow;
    },
    /**
     * @param {string} name
     * @param {{ id: string, repeat: number }[]} cmdGroupInfos
     */
    createWorkflowConfig: function (name, cmdGroupInfos) {
        var id = new Date().getTime();
        return this.updateWorkflowConfig(id, name, cmdGroupInfos);
    },
    /**
     * @param {number} id
     * @param {string} name
     * @param {{ id: string, repeat: number }[]} cmdGroupInfos
     */
    updateWorkflowConfig: function (id, name, cmdGroupInfos) {
        if (name == null || !/\S+/g.test(name)) {
            alert("工作流想要一个名字...");
            return false;
        }
        if (cmdGroupInfos == null || cmdGroupInfos.length <= 0) {
            alert("工作流不想没有任何内容...");
            return false;
        }
        // 存储格式
        var value = {
            name: name,
            infos: cmdGroupInfos
        };
        GM_setValue(this._key(id), JSON.stringify(value));
        return true;
    },
    removeWorkflowConfig: function (id) {
        GM_deleteValue(this._key(id));
    },

    _prefix: "workflow@",
    _isMyKey: function (key) {
        return key.indexOf(this._prefix + Role.id) == 0;
    },
    _key: function (id) {
        return this._prefix + Role.id + id;
    },
    _id: function (key) {
        return parseInt(key.substring((this._prefix + Role.id).length));
    }
};

const CodeTranslator = {
    run: function () {
        const oldFinder1 = this._getFinder("原命令组");
        if (oldFinder1) {
            WorkflowConfig.removeFinder(oldFinder1);
        }
        WorkflowConfig.createFinder("原命令组");
        const oldFinder2 = this._getFinder("原工作流程");
        if (oldFinder2) {
            WorkflowConfig.removeFinder(oldFinder2);
        }
        WorkflowConfig.createFinder("原工作流程");

        let allCmdGroup = CmdGroupManager.getAll();
        let allWorkflow = WorkflowConfigManager.getAll();
        const result = this._newSingleName(allCmdGroup, allWorkflow);
        allCmdGroup = result.group;
        allWorkflow = result.flow;

        allCmdGroup.forEach(g => {
            const cmdsText = CmdGroupManager.getCmdsText(g.id);
            const header = "    ";
            const cmdsTextHasHeader = this._appendHeader(header, cmdsText);
            const source = `($_i) = 0\n[while] (_i) < (arg0)\n${cmdsTextHasHeader}\n${header}($_i) = (_i) + 1`;
            WorkflowConfig.createWorkflow(g.name, source, "原命令组");
        });

        allWorkflow.forEach(f => {
            const infos = WorkflowConfigManager.getCmdGroupInfos(f.id);
            let source = "";
            infos.forEach(info => {
                let cmdGroupName = null;
                for (const cmdGroup of allCmdGroup) {
                    if (cmdGroup.id == info.id) {
                        cmdGroupName = cmdGroup.name;
                        break;
                    }
                }
                source += `@call ${cmdGroupName} ${info.repeat}\n`;
            });
            WorkflowConfig.createWorkflow(f.name, source, "原工作流程");
        });
    },
    _newSingleName: function (cmdGroups, workflows) {
        let allCmdGroup = this._singleName(cmdGroups);
        let allWorkflow = this._singleName(workflows);
        allCmdGroup.forEach(cmdGroup => {
            const name = cmdGroup.name;
            for (const flow of allWorkflow) {
                if (flow.name == name) {
                    cmdGroup.name = `芫${name}`;
                    break;
                }
            }
        });
        return { group: allCmdGroup, flow: allWorkflow };
    },
    _singleName: function (list) {
        for (const item of list) {
            item.name = item.name.replace(/[^_a-zA-Z0-9\u4e00-\u9fa5]/g, "");
        }
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            let name = item.name;
            let number = 1;
            for (let j = i + 1; j < list.length; j++) {
                const item1 = list[j];
                if (item1.name == name) {
                    item1.name = `${name}_${number}`;
                    number += 1;
                }
            }
        }
        return list;
    },
    _getFinder: function (name) {
        let list = WorkflowConfig._rootList();
        const index = WorkflowConfig._findFinder(name, list);
        if (index == null) return null;
        return list[index];
    },
    _appendHeader: function (header, text) {
        let result = `\n${text}`;
        result = result.replace(/(\n)/g, `$1${header}`);
        result = result.replace(/\n\s*\n/g, "\n");
        result = result.replace(/^\s*\n/, "");
        // console.log(result);
        return result;
    }
};

//---------------------------------------------------------------------------
//  2.1.x UI
//---------------------------------------------------------------------------

var WorkflowConfig = {
    rootFinderName: "根文件夹",
    rootFinderSortWay: function (value) {
        const key = "__WorkflowRootFinderSortWay";
        if (value == null) {
            return GM_getValue(key, "nameAsc");
        }
        GM_setValue(key, value);
    },
    finderList: function (finderName) {
        let result = [];
        if (finderName == this.rootFinderName) {
            result = this._rootList();
        } else {
            const list = this._rootList();
            const index = this._findFinder(finderName, list);
            if (index != null) {
                const finder = list[index];
                result = finder.flows;
            }
        }
        result.forEach(item => {
            if (item.type == "flow") {
                item.finder = finderName;
            }
        });
        switch (this.rootFinderSortWay()) {
            case "updateDesc":
                result.reverse();
                break;
            case "nameAsc":
                result.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
                break;
            case "nameDesc":
                result.sort(function (a, b) {
                    return b.name.localeCompare(a.name);
                });
                break;
            case "updateAsc":
            default:
                break;
        }
        return result;
    },
    createFinder: function (name, flows) {
        const result = this._checkName(null, name, true);
        if (result != true) return result;

        let list = this._rootList();
        const finder = { name: name, type: "finder", flows: flows ? flows : [] };
        list.push(finder);
        this._rootList(list);
        return true;
    },
    modifyFinder: function (finder, newName) {
        const result = this._checkName(finder.name, newName, true);
        if (result != true) return result;

        if (finder.name == newName) return true;

        this.removeFinder(finder);
        return this.createFinder(newName, finder.flows);
    },
    removeFinder: function (finder) {
        let list = this._rootList();
        const index = this._findFinder(finder.name, list);
        if (index == null) return;

        list.splice(index, 1);
        this._rootList(list);

        for (const flow of finder.flows) {
            FlowStore.remove(flow.name);
        }
    },
    createWorkflow: function (name, source, finderName) {
        const result = this._checkName(null, name, false);
        if (result != true) return result;

        const flow = { name: name, type: "flow" };
        let list = this._rootList();
        let success = false;
        if (finderName == this.rootFinderName) {
            list.push(flow);
            success = true;
        } else {
            const index = this._findFinder(finderName, list);
            if (index != null) {
                const finder = list[index];
                finder.flows.push(flow);
                success = true;
            }
        }
        if (success) {
            FlowStore.save(name, source);
            this._rootList(list);
            return true;
        } else {
            return `未找到名为"${finderName}"的文件夹。`;
        }
    },
    modifyWorkflow: function (flow, newName, newSource, newFinderName) {
        const result = this._checkName(flow.name, newName, false);
        if (result != true) return result;

        if (flow.name != newName || flow.finder != newFinderName) {
            this.removeWorkflow(flow);
            return this.createWorkflow(newName, newSource, newFinderName);
        } else if (FlowStore.get(flow.name) != newSource) {
            FlowStore.save(flow.name, newSource);
        }
        return true;
    },
    removeWorkflow: function (flow) {
        let list = this._rootList();
        if (flow.finder == this.rootFinderName) {
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                if (item.type == "flow" && item.name == flow.name) {
                    list.splice(i, 1);
                    break;
                }
            }
        } else {
            const index = this._findFinder(flow.finder, list);
            if (index != null) {
                const finder = list[index];
                const flows = finder.flows;
                for (let k = 0; k < flows.length; k++) {
                    const flow1 = flows[k];
                    if (flow1.name == flow.name) {
                        flows.splice(k, 1);
                        break;
                    }
                }
            }
        }
        this._rootList(list);

        FlowStore.remove(flow.name);
    },
    getFinderNames: function () {
        let result = [this.rootFinderName];
        let list = this._rootList();
        list.forEach(item => {
            if (item.type == "finder") {
                result.push(item.name);
            }
        });
        return result;
    },
    _rootList: function (list) {
        const key = `WorkflowConfig_${Role.id}`;
        if (list != null) {
            GM_setValue(key, list);
        }
        return GM_getValue(key, []);
    },
    _checkName: function (oldName, name, isFinder) {
        if (name == oldName) return true;
        const itemName = isFinder ? "文件夹" : "工作流程";
        if (!/\S+/.test(name)) return `${itemName}的名称不能为空。`;
        if (name.indexOf(this.rootFinderName) != -1) return `${itemName}的名称中不能包含"${this.rootFinderName}"。`;
        if (!/^[_a-zA-Z0-9\u4e00-\u9fa5]+$/.test(name)) return `${itemName}的名称只能使用中文、英文和数字字符。`;
        let list = this._rootList();
        const type = isFinder ? "finder" : "flow";
        for (const item of list) {
            if (item.type == type && item.name == name) {
                return `已经存在此名称的${itemName}。`;
            }
            if (item.type == "finder" && !isFinder) {
                for (const flow of item.flows) {
                    if (flow.name == name) {
                        return `已经存在此名称的${itemName}。`;
                    }
                }
            }
        }
        return true;
    },
    _findFinder: function (name, list) {
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (item.type == "finder" && item.name == name) {
                return i;
            }
        }
        return null;
    }
};

var ManagedPerformerCenter = {
    start: function (name, source, log, callback) {
        const p = new Performer(name, source);
        p.log(log != null ? log : true);
        const key = `key${this._counter}`;
        this._counter += 1;
        this._performers[key] = p;
        p.start(_ => {
            delete ManagedPerformerCenter._performers[key];
            if (ManagedPerformerCenter.getAll().length == 0) {
                // 【2026-08-11 修复】移除运行态 class（原 css border-color "inherit" 会覆盖不了 funny2 的墨绿描边，导致流程结束后按钮回不到原样）
                $("#workflows-button").removeClass("raid-running");
            }
            if (callback) callback();
        });
        // 【2026-08-11】运行态改用 class（原直接设 border-color:#00FF00 亮绿刺眼且结束恢复不干净）
        $("#workflows-button").addClass("raid-running");
    },
    getAll: function () {
        return Object.values(this._performers);
    },
    _counter: 0,
    _performers: {}
};

// 【2026-08-11 加固】Vue 单实例管理：ContentModel 弹窗每次创建前销毁旧实例，防累积泄漏
let _raidVue = null;

const RaidUI = {
    showToolbar: function () {
        if (!RaidUI._toolbarHidden) return;
        RaidUI._toolbarHidden = false;
        var raidToolbar = `
        <style>
            .raid-item{
                display: inline-block;
                border: solid 1px gray;
                color: gray;
                background-color: black;
                text-align: center;
                cursor: pointer;
                border-radius: 0.25em;
                //min-width: 2.5em;
                margin-right: 0em;
                //margin-left: 0.4em;
                position: relative;
                padding-left: 0.2em;
                padding-right: 0.3em;
                line-height: 28px;
            }
        </style>
        <div id="raidToolbar">
            <div class="raidToolbar" style="width:100%;margin:5px 0 5px 0">
                <span class="raid-item forum"><hiy>快捷</hiy></span>
                <span class="raid-item shortcut"><hiz>功能</hiz></span>
                <span class="raid-item trigger"><hio>触发</hio></span>
                <span class="raid-item customFlow" id="workflows-button"><hig>流程</hig></span>
                <span class="raid-item moreRaid"><hic>副本</hic></span>
                <span class="raid-item commandLine"><hir>命令</hir></span>
                <span class="raid-item itemLog"><hig>获得物品</hig></span>
                <span class="raid-item zmlztjk"><hir>自命令</hir></span>
            </div>
        </div>`
        $(".WG_log").before(raidToolbar);
        $(".customFlow").on('click', RaidUI.workflows);
        $(".trigger").on('click', RaidUI.trigger);
        $(".forum").on('click', RaidUI.forum);
        $(".shortcut").on('click', RaidUI.shortcut);
        $(".moreRaid").on('click', RaidUI.dungeons);
        $(".commandLine").on('click', RaidUI.commandLine);
        $(".itemLog").on('click', RaidUI.itemLog);
        // 【2026-08-08 新增】"自命令"按钮：点击打开/关闭 自命令+自定义监控 面板（同右键菜单"自命令、自定义监控"）
        $(".zmlztjk").on('click', function () {
            if (unsafeWindow && unsafeWindow.WG && WG.zmlztjk) {
                WG.zmlztjk();
            }
        });
    },
    trigger: function () {
        if (unsafeWindow.TriggerUI == null) {
            const content = `
            <span class = "zdy-item install-trigger" style="width:120px"> 前往安装 </span>
            `;
            RaidUI._appendHtml("🍟 <hio>触发器</hio>", content);
            $(document).off('click.wd-installtrigger').on('click.wd-installtrigger', '.install-trigger', function () {
                window.open("https://greasyfork.org/zh-CN/scripts/378984", '_blank').location;
            });
        } else {
            unsafeWindow.TriggerUI.triggerHome();
        }
    },
    forum: function () {
        const forumItems = [
            { name: "走出桃花林", action: function () { WG.SendCmd('stopstate'); THIsland.outMaze(); } },
            { name: "找到周伯通", action: function () { WG.SendCmd('stopstate'); THIsland.zhoubotong(); } },
            { name: "古宗门寻路", action: function () { WG.SendCmd('stopstate'); DungeonsShortcuts.extension_guzongmen(); } },
            { name: "慈航七重门", action: function () { WG.SendCmd('stopstate'); DungeonsShortcuts.extension_cihang(); } },
            { name: "战神殿解谜", action: function () { WG.SendCmd('stopstate'); DungeonsShortcuts.extension_zhanshendian(); } },
            { name: "扫荡妖塔", action: function () { DungeonsShortcuts.extension_sdyt(); } },
            { name: "一键妖塔", action: function () { DungeonsShortcuts.extension_yjyt(); } },
            { name: "参数设置", action: function () { if (window.WG && WG.setting) { WG.setting(); } else { DungeonsShortcuts.extension_setting(); } } }
        ];
        const content = `
        <div id="forum-list-app">
            <div v-for="item in items">
                <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;"></div>
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:3px 0 3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;">{{ item.name }}</td>
                        <td style="width:80px;text-align:center;">
                            <span style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(255,255,255,0.18);cursor:pointer;font-size:12px;" v-on:click="item.action()">运行</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;" v-if="items.length"></div>
        </div>`;
        RaidUI._appendHtml("🐟 <hiy>快捷扩展</hiy>", content);
        new Vue({
            el: '#forum-list-app',
            data: { items: forumItems }
        });
    },
    shortcut: function () {
        const shortcutItems = [
            { name: "工具网页", action: function () { openExtensionHtml(); } },
            { name: "攻略网站", action: function () { window.open("https://ucn595zz2fou.feishu.cn/wiki/JvEZw8bEiiIpf3kQiFJcAwbanji", "_blank"); } },
            { name: "自定义按钮", action: function () { WG.zdy_btnset(); } },
            { name: "清空数据", action: function () { WG.clean_data(); } },
            { name: "延迟测试", action: function () { WG.wsdelaytest(); } },
            { name: "定时任务", action: function () { WG.dsj(); } },
            { name: "分享角色流程", action: function () { Server.uploadFlows(); } },
            { name: "拷贝角色流程", action: function () {
                layer.confirm('拷贝成功将会完全覆盖原有角色流程！', {
                    title: "<red>! 警告</red>",
                    btn: ['那还是算了', '好的继续'],
                    shift: 2,
                }, function (index) {
                    layer.close(index);
                }, function () {
                    layer.prompt({ title: '输入角色流程获取码', formType: 0, shift: 2 }, function (pass, index) {
                        layer.close(index);
                        Server.downloadFlows(pass);
                    });
                });
            } },
            { name: "分享角色触发", action: function () { Server.uploadTriggers(); } },
            { name: "拷贝角色触发", action: function () {
                layer.confirm('拷贝成功将会完全覆盖原有角色触发器！', {
                    title: "<red>警告</red>",
                    btn: ['取消', '确认'],
                    shift: 2,
                }, function (index) {
                    layer.close(index);
                }, function () {
                    layer.prompt({ title: '输入角色触发获取码', formType: 0, shift: 2 }, function (pass, index) {
                        layer.close(index);
                        Server.downloadTriggers(pass);
                    });
                });
            } },
            { name: "导入流程", action: function () {
                let allFinder = WorkflowConfig.getFinderNames().join("|");
                let source = `
                #input ($token)=分享码,
                #select ($target)=目标文件夹,${allFinder},${WorkflowConfig.rootFinderName}
                #config
                @js Server.importFlow("(token)", "(target)");
                `
                const p = new Performer("导入流程", source);
                p.log(false);
                p.start();
            } },
            { name: "导入触发器", action: function () {
                let source = `
                #input ($token)=分享码,
                #config
                @js Server.importTrigger("(token)");
                `
                const p = new Performer("导入触发器", source);
                p.log(false);
                p.start();
            } },
        ];
        const content = `
        <div id="shortcut-list-app">
            <div v-for="item in items">
                <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;"></div>
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:3px 0 3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;">{{ item.name }}</td>
                        <td style="width:80px;text-align:center;">
                            <span style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(255,255,255,0.18);cursor:pointer;font-size:12px;" v-on:click="item.action()">运行</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;" v-if="items.length"></div>
        </div>`;
        RaidUI._appendHtml("🍯 <hiz>插件功能</hiz>", content);
        new Vue({
            el: '#shortcut-list-app',
            data: { items: shortcutItems }
        });
    },
    dungeons: function () {
        RaidUI._appendHtml("🍺 <hic>自动副本</hic>", "");
        const model = RaidUI._dungeonsContentModel();
        RaidUI._mountableDiv().appendChild(model.$el);
    },
    commandLine: function () {
        messageAppend("[命令提示] <hio>第一行输入“//”即可运行流程命令，第一行输入“#js”即可运行JavaScript</hio>");
        const lastrun = GM_getValue("_lastrun", "");
        const content = `
        <textarea id="cmdline-input" class="settingbox hide" style="display:inline-block;height:8rem;width:calc(100% - 4em);font-size:0.8em;font-family:'JetBrains Mono',monospace;margin:0 2em">${lastrun}</textarea>
        <div class="item-commands" style="text-align:center">
            <span class="cmdline-run" style="width:120px"><wht>运行</wht></span>
        </div>`;
        RaidUI._appendHtml("<hir>命令</hir>", content);
        var input = $("#cmdline-input");
        input.focusout(function () {
            GM_setValue("_lastrun", input.val());
        });
        $(document).off('click.wd-cmdlinerun').on('click.wd-cmdlinerun', '.cmdline-run', function () {
            // 【2026-08-11 委托化】点击时直接取弹窗内输入框，不依赖外层闭包时序
            var text = $("#cmdline-input").val();
            if (!text) return;
            if (text.split("\n")[0].indexOf("//") >= 0) {
                if (unsafeWindow && unsafeWindow.ToRaid) {
                    ToRaid.perform(text);
                }
            } else if (text.split("\n")[0].indexOf("#js") >= 0) {
                var jscode = text.split("\n");
                jscode.baoremove(0);
                eval(jscode.join(""));
            } else {
                WG.SendCmd(text);
            }
        });
    },

    itemLog: function () {
        if (RaidUI._itemLogTimer) {
            clearInterval(RaidUI._itemLogTimer);
        }
        RaidUI._renderItemLog();
        RaidUI._itemLogTimer = setInterval(function () {
            if ($('.WG_log pre').text().indexOf('获得物品') >= 0) {
                RaidUI._renderItemLog();
            } else {
                clearInterval(RaidUI._itemLogTimer);
                RaidUI._itemLogTimer = null;
            }
        }, 2000);
    },
    _renderItemLog: function () {
        var items = raidItemData || {};
        var keys = Object.keys(items);
        if (keys.length === 0) {
            RaidUI._appendHtml("<hig>获得物品</hig>", "<hiy>暂无物品记录</hiy>");
            return;
        }
        function colorizeName(name) {
            return name.replace(/<(\w+)>(.*?)<\/\1>/g, function (match, tag, text) {
                return '<' + tag + '>' + text + '</' + tag + '>';
            });
        }
        var rows = '';
        for (var i = 0; i < keys.length; i++) {
            var item = items[keys[i]];
            rows += '<tr>' +
                '<td style="padding:2px 8px;text-align:left">' + colorizeName(item.name) + '</td>' +
                '<td style="padding:2px 8px;text-align:right"><hig>' + item.count + '</hig></td>' +
                '<td style="padding:2px 8px;text-align:right">' + item.current + '</td>' +
                '<td style="padding:2px 8px;text-align:left">' + item.unit + '</td>' +
                '</tr>';
        }
        var content = '<div style="max-height:60vh;overflow-y:auto">' +
            '<table style="width:100%;border-collapse:collapse;font-size:0.9em">' +
            '<thead><tr style="border-bottom:1px solid #555">' +
            '<th style="padding:4px 8px;text-align:left">物品名</th>' +
            '<th style="padding:4px 8px;text-align:right">获得数量</th>' +
            '<th style="padding:4px 8px;text-align:right">当前持有</th>' +
            '<th style="padding:4px 8px;text-align:left">单位</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
            '<div class="item-commands" style="text-align:center;margin-top:8px">' +
            '<span class="getitem" style="width:80px">清空</span></div>';
        RaidUI._appendHtml("<hig>获得物品</hig>", content);
        $(".getitem").on("click", function () {
            for (var key in raidItemData) {
                delete raidItemData[key];
            }
            for (var key in itemTotalCount) {
                delete itemTotalCount[key];
            }
            RaidUI._renderItemLog();
        });
    },

    workflows: function () {
        if (ManagedPerformerCenter.getAll().length == 0) {
            RaidUI.workflowsHome();
        } else {
            RaidUI.runningFlows();
        }
    },
    workflowsHome: function () {
        // const leftText = `
        // <select style='width:80px' id="workflows-sort">
        //     <option value="updateAsc">更新时间升序</option>
        //     <option value="updateDesc">更新时间降序</option>
        //     <option value="nameAsc">名称升序</option>
        //     <option value="nameDesc">名称降序</option>
        // </select>
        // `
        const leftText = `<wht>运行中</wht>`;
        const rightText = `
        <select style='width:80px' id="workflows-opts">
            <option value="none">选择操作</option>
            <option value="createFinder">新建文件夹</option>
            <option value="createFlow">新建流程</option>
        </select>`
        // const getMoreFlows = function() {
        //     window.open("http://wsmud.bobcn.me:4567/category/2", '_blank').location;
        // };
        RaidUI._appendHtml("🥗 <hig>工作流程</hig>", "", rightText, null, leftText, RaidUI.runningFlows);
        $('#workflows-opts').val("none");
        $("#workflows-opts").change(function () {
            switch ($('#workflows-opts').val()) {
                case "createFinder":
                    RaidUI.createFinder();
                    break;
                case "createFlow":
                    RaidUI.createWorkflow(WorkflowConfig.rootFinderName);
                    break;
                case "none":
                default:
                    break;
            };
        });
        const model = RaidUI._workflowContentModel(WorkflowConfig.finderList(WorkflowConfig.rootFinderName));
        RaidUI._mountableDiv().appendChild(model.$el);
    },
    runningFlows: function () {
        RaidUI._appendHtml("🥗 <hig>运行中流程</hig>", "", null, null, RaidUI._backTitle, RaidUI.workflowsHome);
        const model = RaidUI._runningFlowsContentModel();
        RaidUI._mountableDiv().appendChild(model.$el);
    },
    createFinder: function () {
        const content = `
        <div style="margin: 0 2em 5px 2em;text-align:center;width:calc(100% - 4em)">
            <label for="create-finder-name"> 名称:</label><input id ="create-finder-name" style='width:120px' type="text"  name="create-finder-name" value="">
        </div>`;
        const save = function () {
            const name = $("#create-finder-name").val();
            const result = WorkflowConfig.createFinder(name);
            if (result == true) {
                RaidUI._closeModal();
                RaidUI.workflowsHome();
            } else {
                alert(result);
            }
        };
        RaidUI._showModal("🥗 <hig>新建文件夹</hig>", content, "<wht>保存</wht>", save, RaidUI._backTitle, function () { RaidUI._closeModal(); RaidUI.workflowsHome(); });
    },
    modifyFinder: function (finder) {
        const content = `
        <div style="margin: 0 2em 5px 2em;text-align:center;width:calc(100% - 4em)">
            <label for="modify-finder-name"> 名称:</label><input id ="modify-finder-name" style='width:120px' type="text"  name="modify-finder-name" value="">
        </div>`;
        const remove = function () {
            var verify = confirm("删除文件夹将删除其中的所有流程，确认删除吗？");
            if (verify) {
                WorkflowConfig.removeFinder(finder);
                RaidUI._closeModal();
                RaidUI.workflowsHome();
            }
        };
        const back = function () {
            const name = $("#modify-finder-name").val();
            const result = WorkflowConfig.modifyFinder(finder, name);
            if (result != true) {
                alert(result);
                return;
            }
            RaidUI._closeModal();
            RaidUI.workflowsHome();
        };
        RaidUI._showModal("🥗 <hig>修改文件夹</hig>", content, "删除", remove, RaidUI._backSaveTitle, back);
        $('#modify-finder-name').val(finder.name);
    },
    openFinder: function (finderName) {
        if (finderName == WorkflowConfig.rootFinderName) {
            RaidUI.workflowsHome();
            return;
        }
        const list = WorkflowConfig.finderList(finderName);
        RaidUI._appendHtml(`<wht>📂 ${finderName}</wht>`, "", null, null, RaidUI._backTitle, RaidUI.workflowsHome);
        const model = RaidUI._workflowContentModel(list);
        RaidUI._mountableDiv().appendChild(model.$el);
    },
    createWorkflow: function (finderName) {
        const content = `
        <div style="margin: 0 2em 5px 2em;text-align:left;width:calc(100% - 4em)">
            <label for="create-flow-name"> 名称:</label><input id ="create-flow-name" style='width:120px' type="text"  name="create-flow-name" value="">
        </div>
        <textarea class = "settingbox hide" spellcheck="false" style = "height:20rem;display:inline-block;font-size:14px;line-height:1.5;width:calc(100% - 4em);font-family:'JetBrains Mono',monospace;" id = "create-flow-source"></textarea>`;
        // 【2026-08-12 终版：textarea 方案】语法高亮/行号已取消，最终 = textarea + Tab 缩进（黑底灰字 + spellcheck 关闭）
        const save = function () {
            const name = $("#create-flow-name").val();
            const source = $("#create-flow-source").val();
            const result = WorkflowConfig.createWorkflow(name, source, finderName);
            if (result == true) {
                RaidUI._closeModal();
                RaidUI.workflowsHome();
            } else {
                alert(result);
            }
        };
        RaidUI._showModal("🥗 <hig>新建流程</hig>", content, "<wht>保存</wht>", save, RaidUI._backTitle, function () { RaidUI._closeModal(); RaidUI.workflowsHome(); });
        try {
            var _cfTa = document.getElementById('create-flow-source');
            if (_cfTa) {
                enableTabIndent(_cfTa);
                // 【2026-08-13 移植作者 26.2】语法高亮编辑器（@js 行走 JS 高亮）
                try { createRaidEditor('create-flow-source', { height: '20rem' }); } catch (e2) { }
            }
        } catch (e) { }
    },
    modifyWorkflow: function (flow) {
        let options = "";
        WorkflowConfig.getFinderNames().forEach(finderName => {
            options += `<option value="${finderName}">${finderName}</option>`;
        });
        const content = `
        <div style="margin: 0 2em 5px 2em;text-align:left;width:calc(100% - 4em)">
            <label for="modify-flow-name"> 名称:</label><input id ="modify-flow-name" style='width:120px' type="text"  name="modify-flow-name" value="">
            <label for="modify-flow-finder">移动至</label><select id="modify-flow-finder">
                ${options}
            </select>
        </div>
        <textarea class = "settingbox hide" spellcheck="false" style = "height:20rem;display:inline-block;font-size:14px;line-height:1.5;width:calc(100% - 4em);font-family:'JetBrains Mono',monospace;" id = "modify-flow-source"></textarea>
        <span class="raid-item shareFlow">分享此流程</span>`;
        const remove = function () {
            var verify = confirm("确认删除此工作流程吗？");
            if (verify) {
                WorkflowConfig.removeWorkflow(flow);
                RaidUI._closeModal();
                RaidUI.workflowsHome();
            }
        };
        // 【2026-08-12 终版：textarea 方案】语法高亮/行号已取消，最终 = textarea + Tab 缩进
        const back = function () {
            const name = $("#modify-flow-name").val();
            const source = $("#modify-flow-source").val();
            const finderName = $("#modify-flow-finder").val();
            const result = WorkflowConfig.modifyWorkflow(flow, name, source, finderName);
            if (result != true) {
                alert(result);
                return;
            }
            RaidUI._closeModal();
            RaidUI.openFinder(finderName);
        };
        RaidUI._showModal("🥗 <hig>修改流程</hig>", content, "删除", remove, RaidUI._backSaveTitle, back);
        $("#modify-flow-name").val(flow.name);
        $("#modify-flow-finder").val(flow.finder);
        $("#modify-flow-source").val(FlowStore.get(flow.name) || "");
        try {
            var _mfTa2 = document.getElementById('modify-flow-source');
            if (_mfTa2) {
                enableTabIndent(_mfTa2);
                // 【2026-08-13 移植作者 26.2】语法高亮编辑器（@js 行走 JS 高亮）
                try { createRaidEditor('modify-flow-source', { height: '20rem' }); } catch (e2) { }
            }
        } catch (e) { }
        $(".shareFlow").on('click', function () {
            const data = {
                name: $("#modify-flow-name").val(),
                source: $("#modify-flow-source").val()
            };
            RaidUI._share("流程", data);
        });
    },

    _toolbarHidden: true,
    _backTitle: "<wht>< 返回</wht>",
    _backSaveTitle: "<wht>< 保存&返回</wht>",

    _appendHtml(title, content, rightText, rightAction, leftText, leftAction) {
        const finalLeftText = leftText == null ? "" : leftText;
        const finalRightText = rightText == null ? "" : rightText;
        var html = `
        <div class = "item-commands" style="text-align:center">
            <div style="margin-top:0.5em">
                <div style="width:6em;float:left;text-align:left;padding:0 0 0 2em;height:1.23em" id="wsmud_raid_left">${finalLeftText}</div>
                <div style="width:calc(100% - 16em);float:left;text-align:center;height:1.23em">${title}</div>
                <div style="width:6em;float:right;text-align:right;padding:0 2em 0 0;height:1.23em" id="wsmud_raid_right">${finalRightText}</div>
            </div>
            <br><br>
            ${content}
        </div>`;
        // 【2026-08-08 按用户选择：方案A】Raid 弹窗内容仍写回日志区 .WG_log pre（原版行为），
        // 只把 Raid 工具栏搬到左侧（见 4258 行附近）。如以后想把弹窗也移左侧，改这里即可。
        Message.clean();
        Message.append(html, 2);
        $("#wsmud_raid_left").on('click', function () {
            if (leftAction) leftAction();
        });
        $("#wsmud_raid_right").on('click', function () {
            if (rightAction) rightAction();
        });
    },
    _closeModal: function () {
        // 【2026-08-11 加固】关闭弹窗时销毁 Vue 实例（防累积泄漏）
        if (_raidVue) { _raidVue.$destroy(); _raidVue = null; }
        var el = document.getElementById('raid-modal-overlay');
        if (el) el.remove();
    },
    _mountableDiv: function () {
        var wg_log = document.getElementsByClassName("WG_log")[0];
        var pre = wg_log.getElementsByTagName("pre")[0];
        var div = pre.getElementsByTagName("div")[0];
        return div;
    },
    _showModal: function (title, content, rightText, rightAction, leftText, leftAction) {
        RaidUI._closeModal();
        var finalLeftText = leftText == null ? "" : leftText;
        var finalRightText = rightText == null ? "" : rightText;
        var overlay = document.createElement('div');
        overlay.id = 'raid-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
        var modal = document.createElement('div');
        // 【2026-08-26 统一弹窗风格】恢复26.4版本样式
        modal.style.cssText = 'background:#1a1a2e;border:1px solid #555;border-radius:12px;padding:24px;width:80vw;height:75vh;max-width:95%;max-height:85vh;overflow:auto;position:relative;box-shadow:0 0 30px rgba(0,0,0,0.5);';
        var html = `
        <div class="item-commands" style="text-align:center">
            <div style="margin-top:0.5em">
                <div style="width:12em;float:left;text-align:left;padding:0 0 0 2em;height:1.23em" id="wsmud_modal_left">${finalLeftText}</div>
                <div style="width:calc(100% - 18em);float:left;text-align:center;height:1.23em">${title}</div>
                <div style="width:6em;float:right;text-align:right;padding:0 2em 0 0;height:1.23em" id="wsmud_modal_right">${finalRightText}</div>
            </div>
            <br><br>
            ${content}
        </div>`;
        modal.insertAdjacentHTML('beforeend', html);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        var leftEl = document.getElementById('wsmud_modal_left');
        if (leftEl && leftAction) leftEl.onclick = function () { leftAction(); };
        var rightEl = document.getElementById('wsmud_modal_right');
        if (rightEl && rightAction) rightEl.onclick = function () { rightAction(); };
    },
    _workflowContentModel: function (items) {
        if (_raidVue) { _raidVue.$destroy(); _raidVue = null; }
        _raidVue = new Vue({
            el: '#WorkflowsContentModel',
            template: `
            <div id="workflows-list-app">
                <div v-for="item in items">
                    <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;"></div>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="padding:3px 0 3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;">
                                <span v-if="item.type=='finder'">{{ item.name }}</span>
                                <span v-else>▶️{{ item.name }}</span>
                            </td>
                            <td style="width:80px;text-align:center;">
                                <span style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(255,255,255,0.18);cursor:pointer;font-size:12px;" v-on:click="run(item)">运行</span>
                            </td>
                            <td style="width:80px;text-align:center;">
                                <span style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(255,255,0,0.15);cursor:pointer;font-size:12px;" v-on:click="edit(item)">设置</span>
                            </td>
                        </tr>
                    </table>
                </div>
                <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;" v-if="items.length"></div>
            </div>`,
            data: function () {
                return { items: items };
            },
            methods: {
                run: function (item) {
                    if (item.type == "finder") {
                        RaidUI.openFinder(item.name);
                    } else {
                        ManagedPerformerCenter.start(item.name, FlowStore.get(item.name));
                    }
                },
                edit: function (item) {
                    if (item.type == "finder") {
                        RaidUI.modifyFinder(item);
                    } else {
                        RaidUI.modifyWorkflow(item);
                    }
                }
            }
        });
        return _raidVue;
    },
    _dungeonsContentModel: function () {
        if (_raidVue) { _raidVue.$destroy(); _raidVue = null; }
        _raidVue = new Vue({
            el: '#DungeonsContentModel',
            template: `
            <div id="dungeons-list-app">
                <div v-for="item in items">
                    <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;"></div>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="padding:3px 0 3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;">{{ item.desc || item.name }}</td>
                            <td style="width:80px;text-align:center;">
                                <span style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(255,255,255,0.18);cursor:pointer;font-size:12px;" v-on:click="run(item)">运行</span>
                            </td>
                        </tr>
                    </table>
                </div>
                <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;" v-if="items.length"></div>
            </div>`,
            data: function () {
                return { items: Dungeons };
            },
            methods: {
                run: function (item) {
                    ManagedPerformerCenter.start('自动副本-' + item.name, GetDungeonSource(item.name));
                }
            }
        });
        return _raidVue;
    },
    _runningFlowsContentModel: function () {
        if (_raidVue) { _raidVue.$destroy(); _raidVue = null; }
        _raidVue = new Vue({
            el: '#WorkflowsContentModel',
            template: `
            <div id="running-flows-list-app">
                <div v-for="flow in items">
                    <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;"></div>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="padding:3px 0 3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;">{{ flow.name() }}</td>
                            <td style="width:80px;text-align:center;">
                                <span style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(255,255,255,0.18);cursor:pointer;font-size:12px;" v-on:click="toggle(flow)">{{ flow.pausing() ? '▶️恢复' : '⏸暂停' }}</span>
                            </td>
                            <td style="width:80px;text-align:center;">
                                <span style="display:inline-block;width:66px;height:24px;line-height:24px;text-align:center;border-radius:12px;background-color:rgba(255,0,0,0.15);cursor:pointer;font-size:12px;" v-on:click="stop(flow)">⏹停止</span>
                            </td>
                        </tr>
                    </table>
                </div>
                <div style="height:1px;background-color:rgba(255,255,255,0.25);margin:0 -20px;" v-if="items.length"></div>
            </div>`,
            data: function () {
                return { items: ManagedPerformerCenter.getAll() };
            },
            methods: {
                toggle: function (flow) {
                    if (flow.pausing()) {
                        flow.resume();
                    } else {
                        flow.pause();
                    }
                    RaidUI.runningFlows();
                },
                stop: function (flow) {
                    flow.stop();
                    RaidUI.runningFlows();
                }
            }
        });
        return _raidVue;
    },

    _shareData: null,
    /**
     * @param {String} type 流程  触发
     * @param {Object} value
     */
    _share: function (type, value) {
        RaidUI._shareData = value;
        let source = `
        [if] (__FormUserName) == null
            (__FormUserName) = (:name)
        #input ($__FormUserName)=当前角色名,(:name)
        #config
        ($__FormUserName)=(:name)
        ($password)=233
        @js Server.shareFlowTrigger("(__FormUserName)", "(password)", "${type}", RaidUI._shareData);
        `
        const p = new Performer(`分享${type}`, source);
        p.log(false);
        p.start();
    }
}