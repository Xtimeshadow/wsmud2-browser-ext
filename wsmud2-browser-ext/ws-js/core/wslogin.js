// ============================================================
// wslogin.js —— 一键登录助手（核心）
// ------------------------------------------------------------
// 功能：
//   1. 把账号/密码/区服/角色信息加密保存到 localStorage
//   2. 在登录界面注入"一键登录"按钮和弹窗
//   3. 自动完成整条登录流程：登录 → 选区服 → 选角色
// 全部封装在 AccountHelper 对象里，通过 window.__AccountHelper
// 暴露给 wslogin-ui.js / wslogin-flow.js 扩展。
// 加密函数由 wslogin-crypto.js 提供。
// UI 弹窗由 wslogin-ui.js 提供。
// 登录流程由 wslogin-flow.js 提供。
// ============================================================
(function () {
    "use strict";

    const AccountHelper = window.__AccountHelper = {
        accountData: {},
        currentAccount: null,
        currentServerName: null,
        storageKey: "mud_game_account_data",
        isButtonInjected: false,

        // 密码加密/解密（引用自 wslogin-crypto.js 的全局函数）
        encryptPassword: _encryptPassword,
        decryptPassword: _decryptPassword,

        // ---- 核心初始化 ----
        init: function () {
            this.loadData();
            // 监听用户手动登录，自动保存密码
            this.bindLoginCapture();
            // 等待 WG 就绪后挂载 hook，同时轮询注入"一键登录"按钮
            this.waitForWGAndHook();
            // UI 弹窗由 wslogin-ui.js 注入
            // 自动恢复登录由 wslogin-flow.js 调度
        },

        loadData: function () {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) this.accountData = JSON.parse(savedData);
        },

        saveData: function () {
            localStorage.setItem(this.storageKey, JSON.stringify(this.accountData));
            // 刷新下拉框（由 wslogin-ui.js 提供）
            if (this.populateAccountsDropdown) this.populateAccountsDropdown();
        },

        sleep: function (ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        },

        // ---- 捕获用户手动登录 ----
        bindLoginCapture: function () {
            $(document).on("click", '.panel_item[command="LoginIn"]', () => {
                const username = $("#login_name").val().trim().toLowerCase();
                const password = $("#login_pwd").val();
                if (!username || !password) return;
                this.currentAccount = username;
                if (!this.accountData[username]) this.accountData[username] = {};
                this.accountData[username].password = this.encryptPassword(password);
                this.saveData();
            });
        },

        // ---- 等待 WG 就绪并挂载 hook ----
        waitForWGAndHook: function () {
            // 备用轮询：找不到角色面板删除按钮时，持续尝试注入"一键登录"按钮
            const fallbackInterval = setInterval(() => {
                if (this.injectAssistantButton) this.injectAssistantButton();
                if (this.isButtonInjected) {
                    clearInterval(fallbackInterval);
                }
            }, 500);

            setTimeout(() => {
                clearInterval(fallbackInterval);
                if (!this.isButtonInjected) {
                    console.error("MUD登录助手：备用轮询超时，未能注入按钮。");
                }
            }, 1e4);

            const hookInterval = setInterval(() => {
                if (unsafeWindow.WG && typeof unsafeWindow.WG.add_hook === "function") {
                    clearInterval(hookInterval);

                    // 接收区服角色列表，保存到当前账号+区服下
                    unsafeWindow.WG.add_hook("roles", (data) => {
                        setTimeout(() => {
                            if (this.injectAssistantButton) this.injectAssistantButton();
                        }, 100);

                        if (!this.currentAccount) {
                            const lastLogin = localStorage.getItem("login_name");
                            if (lastLogin) this.currentAccount = lastLogin.toLowerCase();
                            else return;
                        }

                        const serverElement = $(".server-list > li.select");
                        if (serverElement.length === 0) return;
                        this.currentServerName = serverElement.text().trim();

                        if (!this.accountData[this.currentAccount][this.currentServerName]) {
                            this.accountData[this.currentAccount][this.currentServerName] = {};
                        }
                        this.accountData[this.currentAccount][this.currentServerName].roles = data.roles;
                        this.saveData();
                    });

                    // 登录成功后记录最后登录的角色
                    unsafeWindow.WG.add_hook("login", (data) => {
                        if (!this.currentAccount || !this.currentServerName) return;
                        const serverInfo = this.accountData[this.currentAccount][this.currentServerName];
                        if (serverInfo && serverInfo.roles) {
                            const loggedInRole = serverInfo.roles.find((role) => role.id === data.id);
                            if (loggedInRole) serverInfo.lastLoggedInRole = loggedInRole;
                        }
                        this.saveData();
                        this.currentServerName = null;
                    });
                }
            }, 500);
        }
    };

    // 执行核心初始化（加载数据、绑定事件监听）
    AccountHelper.init();
})();