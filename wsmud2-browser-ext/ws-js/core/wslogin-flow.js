// ============================================================
// wslogin-flow.js —— 一键登录流程
// ------------------------------------------------------------
// 扩展 AccountHelper 的登录流程相关方法：
//   自动恢复登录、选定区服/角色、完整登录流程等。
// ============================================================
(function () {
    "use strict";

    const AccountHelper = window.__AccountHelper;
    if (!AccountHelper) return;

    Object.assign(AccountHelper, {

        // ---- 必要时返回到登录界面 ----
        ensureLoginScreen: async function () {
            this.updateStatus("需要切换账号，正在返回登录界面...");
            const start = Date.now();
            while (Date.now() - start < 12000) {
                try {
                    if ($("#login_panel").is(":visible")) {
                        this.updateStatus("已在登录界面。");
                        return true;
                    }
                    if ($("#role_panel").is(":visible")) {
                        $('.panel_item[command="ToServerPanel"]').click();
                        await this.sleep(400);
                        continue;
                    }
                    if ($("#slist_panel").is(":visible")) {
                        if (typeof unsafeWindow.CloseServer === "function") unsafeWindow.CloseServer();
                        $('.panel_item[command="ReLogin"]').click();
                        await this.sleep(400);
                        continue;
                    }
                } catch (e) { }
                await this.sleep(300);
            }
            this.updateStatus("返回登录界面超时，继续尝试登录...");
            return false;
        },

        // ---- 自动恢复登录（重连刷新后自动重登） ----
        autoRecoverLogin: async function () {
            try {
                const flag = localStorage.getItem("ext_auto_recover_flag");
                if (!flag) return;
                localStorage.removeItem("ext_auto_recover_flag");
                await this.waitForElementVisible("#wsmud-login-accounts", 8e3);
                if (!this.accountData || Object.keys(this.accountData).length === 0) {
                    this.updateStatus("未找到已保存的账号，无法自动重登，请手动登录");
                    try { if (typeof PushAlert === 'function') PushAlert('relogin_fail', '⚠️ 自动重登失败：未找到已保存的账号，请手动登录'); } catch (e) { }
                    return;
                }
                const kickTarget = localStorage.getItem("ext_kick_recover_role");
                let targetAccount = null, targetServer = null, targetRole = null;
                if (kickTarget) {
                    outer2:
                    for (const acc in this.accountData) {
                        if (!this.accountData.hasOwnProperty(acc)) continue;
                        for (const sv in this.accountData[acc]) {
                            if (sv === "password") continue;
                            const info = this.accountData[acc][sv];
                            const roles = (info && info.roles) || [];
                            for (const r of roles) {
                                if (r && String(r.id) === String(kickTarget)) {
                                    targetAccount = acc; targetServer = sv; targetRole = String(r.id);
                                    break outer2;
                                }
                            }
                        }
                    }
                    localStorage.removeItem("ext_kick_recover_role");
                    if (targetAccount) {
                        await this.loginToRole(targetAccount, targetServer, targetRole);
                        return;
                    }
                }
                outer:
                for (const acc in this.accountData) {
                    if (!this.accountData.hasOwnProperty(acc)) continue;
                    for (const sv in this.accountData[acc]) {
                        if (sv === "password") continue;
                        const info = this.accountData[acc][sv];
                        if (info && info.lastLoggedInRole && info.lastLoggedInRole.id) {
                            targetAccount = acc; targetServer = sv; targetRole = String(info.lastLoggedInRole.id);
                            break outer;
                        }
                    }
                }
                if (!targetAccount) {
                    const accs = Object.keys(this.accountData);
                    if (!accs.length) return;
                    targetAccount = accs[0];
                    const srvKeys = Object.keys(this.accountData[targetAccount]).filter((k) => k !== "password");
                    if (!srvKeys.length) return;
                    targetServer = srvKeys[0];
                    const roles = this.accountData[targetAccount][targetServer] && this.accountData[targetAccount][targetServer].roles;
                    if (!roles || !roles.length) return;
                    targetRole = String(roles[0].id);
                }
                await this.loginToRole(targetAccount, targetServer, targetRole);
            } catch (e) {
                try { console.error("[WSMUD] 自动恢复登录失败:", e); } catch (e2) { }
                try { if (typeof PushAlert === 'function') PushAlert('relogin_fail', '⚠️ 自动重登失败：' + String((e && e.message) || e).slice(0, 80)); } catch (e2) { }
            }
        },

        // ---- 按账号/区服/角色ID 填充下拉并执行完整登录流程 ----
        loginToRole: async function (account, server, roleId) {
            try {
                if (!account || !server || !roleId) return;
                $("#wsmud-login-accounts").val(account).trigger("change");
                await this.sleep(300);
                $("#wsmud-login-servers").val(server).trigger("change");
                await this.sleep(300);
                $("#wsmud-login-roles").val(roleId);
                if (!$("#wsmud-login-roles").val()) {
                    const firstRole = $("#wsmud-login-roles option").eq(1);
                    if (firstRole.length) $("#wsmud-login-roles").val(firstRole.val());
                }
                try { await this.waitForElementVisible("#login_panel", 15e3); } catch (e) { }
                $("#wsmud-login-overlay").removeClass("hide");
                this.updateStatus("正在登录 " + account + " / " + roleId + " ...");
                await this.handleAutoLogin();
            } catch (e) {
                try { console.error("[WSMUD] 登录流程失败:", e); } catch (e2) { }
                try { if (typeof PushAlert === 'function') PushAlert('relogin_fail', '⚠️ 登录失败：' + String((e && e.message) || e).slice(0, 80)); } catch (e2) { }
            }
        },

        // ---- 轮询等待元素出现 ----
        waitForElement: function (selector, timeout) {
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const iv = setInterval(() => {
                    if ($(selector).length > 0) {
                        clearInterval(iv);
                        resolve(true);
                    } else if (Date.now() - start > timeout) {
                        clearInterval(iv);
                        reject(`等待 ${selector} 超时`);
                    }
                }, 200);
            });
        },

        // ---- 选择区服（按名字包含匹配） ----
        selectServerByName: async function (server) {
            if (!server) return false;
            const start = Date.now();
            while (Date.now() - start < 10000) {
                try {
                    const $li = $(".server-list li").filter(function () {
                        return ($(this).text() || "").indexOf(server) >= 0;
                    }).first();
                    if ($li.length > 0) {
                        if (!$li.is(".select")) $li.click();
                        const selText = $(".server-list>.select").text() || "";
                        if (selText.indexOf(server) >= 0) {
                            this.updateStatus("区服已选中：" + server.trim());
                            return true;
                        }
                    }
                } catch (e) { }
                await this.sleep(300);
            }
            try { console.warn("[WSMUD] 区服选择失败/未找到：" + server); } catch (e) { }
            return false;
        },

        // ---- 选择角色（按 roleid 匹配） ----
        selectRoleById: async function (roleId) {
            if (!roleId) return false;
            const start = Date.now();
            while (Date.now() - start < 15000) {
                try {
                    const $role = $(".role-list .role-item[roleid='" + roleId + "']");
                    if ($role.length > 0) {
                        if (!$role.is(".select")) $role.click();
                        const selId = $(".role-list>.select").attr("roleid");
                        if (String(selId) === String(roleId)) {
                            this.updateStatus("角色已选中：" + $role.text().trim());
                            return true;
                        }
                    }
                } catch (e) { }
                await this.sleep(300);
            }
            try { console.warn("[WSMUD] 角色选择失败/未找到 roleid=" + roleId); } catch (e) { }
            return false;
        },

        // ---- 自动登录主流程 ----
        handleAutoLogin: async function () {
            const account = $("#wsmud-login-accounts").val();
            const server = $("#wsmud-login-servers").val();
            const roleId = $("#wsmud-login-roles").val();
            if (!account || !server || !roleId) {
                this.updateStatus("请选择完整的账号、区服和角色！", true);
                return;
            }

            $("#wsmud-login-overlay").addClass("hide");
            const $loginBtn = $("#wsmud-login-btn");
            const resetBtn = () => $loginBtn.removeClass("loading")
                .html('<span class="glyphicon glyphicon-flash"></span><span style="margin-left:0.5rem">立即登录</span>');
            $loginBtn.addClass("loading")
                .html('<span class="glyphicon glyphicon-spinner glyphicon-spin"></span><span style="margin-left:0.5rem">登录中...</span>');

            // 当前账号和区服已选中，直接选择角色
            if (this.currentAccount === account && this.currentServerName === server) {
                try {
                    this.updateStatus("账号服务器匹配，直接登录角色...");
                    await this.sleep(500);
                    await this.selectRoleById(roleId);
                    await this.sleep(300);
                    $('.panel_item[command="SelectRole"]').click();
                    this.updateStatus("登录指令已发送！");
                } catch (error) {
                    this.updateStatus(`错误: ${error}`, true);
                } finally {
                    resetBtn();
                }
                return;
            }

            // 切换账号：需要重新走完整登录流程
            const encodedPassword = this.accountData[account].password;
            if (!encodedPassword) {
                this.updateStatus("未找到该账号的密码！", true);
                resetBtn();
                return;
            }
            const password = this.decryptPassword(encodedPassword);
            if (password === null) {
                this.updateStatus("密码解密失败，数据可能已损坏！", true);
                resetBtn();
                return;
            }

            try {
                await this.ensureLoginScreen();
                this.updateStatus("步骤1/3: 正在登录账号...");
                try { await this.waitForElement("#login_name", 1e4); } catch (e) { }
                $("#login_name").val(account);
                $("#login_pwd").val(password);
                $('.panel_item[command="LoginIn"]').click();
                await this.waitForElementVisibleSoft("#slist_panel", 1e4);

                this.updateStatus("步骤2/3: 正在选择区服...");
                await this.selectServerByName(server);
                $('.panel_item[command="SelectServer"]').click();
                await this.waitForElementVisibleSoft("#role_panel", 1e4);

                this.updateStatus("步骤3/3: 正在选择角色...");
                await this.selectRoleById(roleId);
                await this.sleep(300);
                $('.panel_item[command="SelectRole"]').click();
                this.updateStatus("登录指令已发送！");
            } catch (error) {
                this.updateStatus(`错误: ${error}`, true);
            } finally {
                resetBtn();
            }
        },

        // ---- 轮询等待元素可见（硬等待：超时 reject） ----
        waitForElementVisible: function (selector, timeout) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    const $element = $(selector);
                    if ($element.is(":visible")) {
                        clearInterval(interval);
                        resolve();
                    } else if (Date.now() - startTime > timeout) {
                        clearInterval(interval);
                        reject(`操作超时: 等待 ${selector} 失败`);
                    }
                }, 200);
            });
        },

        // ---- 软等待：元素可见返回 true，超时不抛错返回 false ----
        waitForElementVisibleSoft: function (selector, timeout) {
            return new Promise((resolve) => {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    try {
                        const $element = $(selector);
                        if ($element.is(":visible")) {
                            clearInterval(interval);
                            resolve(true);
                            return;
                        }
                    } catch (e) { }
                    if (Date.now() - startTime > timeout) {
                        clearInterval(interval);
                        resolve(false);
                    }
                }, 200);
            });
        }
    });

    // 延迟执行自动恢复登录（重连刷新后自动重登）
    setTimeout(() => AccountHelper.autoRecoverLogin(), 1500);
})();