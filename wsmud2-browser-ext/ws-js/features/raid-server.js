// ============================================================
// raid-server.js —— 云端
// ============================================================

// 【2026-08-14 安全警示】判断 Raid 流程/触发器源码是否含可执行任意 JS 的指令（@js / #js）
// 分享的流程 = 别人写的代码，运行后可操作你的角色；导入前必须让用户确认信任来源
function SourceContainsExecutableCode(source) {
    if (typeof source !== 'string' || !source) return false;
    return /(^|\n)\s*@js(\s|$)|(^|\n)\s*#js(\s|$)/.test(source);
}

const Server = {

    uploadFlows: function () {
        const flows = FlowStore.getAll();
        const map = WorkflowConfig._rootList();
        const data = { map: map, flows: flows };
        const value = JSON.stringify(data);
        Server._sync("uploadFlows", { id: Role.id, value: value }, pass => {
            GM_setClipboard(pass);
            alert(`角色流程上传成功，该角色流程会在服务器保存 24 小时。\n角色流程获取码：${pass}，已复制到系统剪切板。`);
            Message.append(`<hiy>角色流程获取码：${pass}</hiy>`);
            Message.append(`<div class="item-commands"><span cmd = "@js prompt('请手动复制下面的数据','${pass}');" >
                             我无法复制 </span></div>`, 2);
        }, _ => {
            alert("角色流程上传失败！");
        });
    },
    downloadFlows: function (pass) {
        Server._sync("downloadFlows", { pass: pass }, value => {
            let data = JSON.parse(value);
            // 【2026-08-14 安全警示】云端流程里含 @js/#js（可执行任意代码）→ 提醒确认
            let hasExec = false;
            try {
                for (const name in data.flows) {
                    if (!data.flows.hasOwnProperty(name)) continue;
                    if (SourceContainsExecutableCode(data.flows[name].source)) { hasExec = true; break; }
                }
            } catch (e) { }
            if (hasExec && !confirm("⚠️ 该角色流程中包含可执行任意代码的 @js/#js 指令！\n\n云端分享的流程 = 别人写的代码，运行后可在你的游戏里执行任意操作。\n仅在你信任分享者时才拷贝。\n\n仍要拷贝吗？")) {
                return;
            }
            FlowStore.corver(data.flows);
            WorkflowConfig._rootList(data.map);
            // console.log(data);
            alert("拷贝角色流程成功！");
        }, _ => {
            alert("错误的角色流程获取码！");
        });
    },
    uploadTriggers: function () {

        const triggers = unsafeWindow.TriggerCenter.getAllData();
        const value = JSON.stringify(triggers);
        Server._sync("uploadTriggers", { id: Role.id, value: value }, pass => {
            GM_setClipboard(pass);
            alert(`角色触发器上传成功，该角色触发会在服务器保存 24 小时。\n角色触发器获取码：${pass}，已复制到系统剪切板。`);
            Message.append(`<hiy>角色触发获取码：${pass}</hiy>`);
            Message.append(`<div class="item-commands"><span cmd = "@js prompt('请手动复制下面的数据','${pass}');" >
                                我无法复制 </span></div>`, 2);
        }, _ => {
            alert("角色触发器上传失败！");
        });


    },
    downloadTriggers: function (pass) {
        Server._sync("downloadTriggers", { pass: pass }, value => {
            let data = JSON.parse(value);
            unsafeWindow.TriggerCenter.corver(data);
            // console.log(data);
            alert("拷贝角色触发器成功！");
        }, _ => {
            alert("错误的角色触发器获取码！");
        });
    },
    getNotice: function () {
        const noticeDataKey = "NoticeDataKey";
        const oldData = GM_getValue(noticeDataKey, { version: "0.0.0", type: "0", value: "欢迎使用 wsmud_Raid" });
        Server._async("notice", { version: oldData.version, id: Role.id }, data => {
            let validData = oldData;
            if (data.version > oldData.version) {
                GM_setValue(noticeDataKey, data);
                validData = data;
            }
            if (validData.type == "0") {
                LayerHelper.msg(`
                <div>
                <p><hig>Raid：</hig>${validData.value}</p>
                <p style="text-align:center">(v-${GM_info.script.version || ''})</p>
                </div>`);
            } else {
                const HideVersionNoticeKey = "HideVersionNoticeKey";
                if (GM_getValue(HideVersionNoticeKey, null) == validData.version) {
                    return;
                }
                layer.open({
                    type: 1,
                    skin: "layui-layer-rim", //加上边框
                    area: ["380px"],
                    title: `wsmud_Raid 提示`,
                    content: validData.value,
                    offset: "auto",
                    shift: 2,
                    move: false,
                    closeBtn: 0,
                    btn: ['确认', '不再显示'],
                    yes: function (index) {
                        layer.close(index);
                    },
                    btn2: function () {
                        GM_setValue(HideVersionNoticeKey, validData.version);
                    }
                });
            }
        });
    },

    shareFlowTrigger: function (username, password, type, data) {

        let value = data;
        value["author"] = username;
        const params = {
            username: username,
            password: password,
            name: data.name,
            phone: "",
            type: type,
            value: JSON.stringify(value)
        };
        // console.log(params);
        Server._sync("uploadSingle", params, token => {
            GM_setClipboard(token);
            alert(`${type}分享成功，该${type}会在服务器保存 30 天\n每次下载会延长保存 始于下载时刻的 30 天\n分享码：${token}\n已复制到系统剪切板。`);
            Message.append(`<hiy>${type}分享码：${token}</hiy>`);
            Message.append(`<div class="item-commands"><span cmd = "@js prompt('请手动复制下面的数据','${token}');" >
                                     我无法复制 </span></div>`, 2);
        }, error => {
            alert(error);
        });

    },
    importFlow: function (token, target) {
        if (token.indexOf("·流程") == -1) {
            alert("错误的流程分享码！");
            return;
        }
        const params = { token: token };
        Server._sync("downloadSingle", params, data => {
            const flow = JSON.parse(data);
            // 【2026-08-14 安全警示】分享的流程含 @js/#js（可执行任意代码）→ 导入前确认信任
            if (SourceContainsExecutableCode(flow.source)) {
                if (!confirm(`⚠️ 流程「${flow.name}」包含可执行任意代码的 @js/#js 指令！\n\n分享的流程 = 别人写的代码，运行后可在你的游戏里执行任意操作。\n仅在你信任分享者时才导入。\n\n仍要导入吗？`)) {
                    return;
                }
            }
            const result = WorkflowConfig.createWorkflow(flow.name, flow.source, target);
            if (result == true) {
                //alert(`导入流程 ${flow.name} 成功！`);
                Message.append(`<hiy>导入流程 ${flow.name} 成功！</hiy>`);
            } else {
                alert(result);
            }
        }, _ => {
            alert("错误的流程分享码！");
        });
    },
    importTrigger: function (token) {
        if (token.indexOf("·触发") == -1) {
            alert("错误的触发器分享码！");
            return;
        }
        const params = { token: token };
        Server._sync("downloadSingle", params, data => {
            const trigger = JSON.parse(data);
            // 【2026-08-14 安全警示】触发器源码含 @js/#js（可执行任意代码）→ 导入前确认信任
            if (SourceContainsExecutableCode(trigger.source)) {
                if (!confirm(`⚠️ 触发器「${trigger.name}」包含可执行任意代码的 @js/#js 指令！\n\n分享的触发器 = 别人写的代码，运行后可在你的游戏里执行任意操作。\n仅在你信任分享者时才导入。\n\n仍要导入吗？`)) {
                    return;
                }
            }
            const result = unsafeWindow.TriggerCenter.create(trigger.name, trigger.event, trigger.conditions, trigger.source, trigger.active);
            if (result == true) {
                //alert(`导入触发器 ${trigger.name} 成功！`);
                Message.append(`<hiy>导入触发器 ${trigger.name} 成功！</hiy>`);
            } else {
                alert(result);
            }
        }, _ => {
            alert("错误的触发器分享码！");
        });
    },

    _address: "wsmud.ii74.com/S",
    _async(uri, params, success, fail) {
        this._get(true, uri, params, success, fail);
    },
    _sync(uri, params, success, fail) {
        this._get(false, uri, params, success, fail);
    },
    _get(async, uri, params, success, fail) {
        $.ajax({
            type: "post",
            url: `https://${Server._address}/${uri}`,
            data: params,
            async: async,
            success: function (data) {
                if (data.code == 200) {
                    if (success != null) success(data.data);
                } else {
                    let error = data.code;
                    if (data.data != null) error = data.data;
                    if (fail != null) fail(error);
                }
            },
            dataType: "json"
        });
    },
    _getPhone(success, fail) {
        $.ajax({
            type: "post",
            url: `/UserAPI/GetPhone`,
            async: true,
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                if (data) {
                    //去掉*
                    data = data.replace(/\"/g, "");
                    if (success != null) success(data);
                } else {
                    fail(data);
                }
            }
        });
    }
};