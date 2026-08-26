// ============================================================
// wslogin-ui.js —— 一键登录弹窗 UI
// ------------------------------------------------------------
// 扩展 AccountHelper 的 UI 相关方法：
//   注入登录弹窗 DOM 与样式、注入"一键登录"按钮、
//   绑定面板/弹窗事件、下拉框联动等。
// ============================================================
(function () {
    "use strict";

    const AccountHelper = window.__AccountHelper;
    if (!AccountHelper) return;

    Object.assign(AccountHelper, {

        // ---- 注入登录弹窗 DOM 与样式 ----
        injectLoginDialog: function () {
            const dialogHTML = `
                <div id="wsmud-login-overlay" class="wsmud-login-overlay hide">
                    <div id="wsmud-login-dialog-container" class="wsmud-login-dialog">
                        <div class="wsmud-login-dialog-header">
                            <span class="wsmud-login-dialog-title">一键登录助手</span>
                            <span class="wsmud-login-dialog-close glyphicon glyphicon-remove-circle"></span>
                        </div>
                        <div class="wsmud-login-dialog-content">
                            <h3>选择已保存的账号</h3>
                            <select id="wsmud-login-accounts" class="wsmud-login-select"><option value="">--请选择账号--</option></select>
                            <h3>选择区服</h3>
                            <select id="wsmud-login-servers" class="wsmud-login-select" disabled><option value="">--请选择区服--</option></select>
                            <h3>选择角色</h3>
                            <select id="wsmud-login-roles" class="wsmud-login-select" disabled><option value="">--请选择角色--</option></select>
                            <div id="wsmud-login-status"></div>
                            <div id="wsmud-login-btn">
                                <span class="glyphicon glyphicon-flash"></span>
                                <span style="margin-left:0.5rem">立即登录</span>
                            </div>
                            <div id="wsmud-login-clear-account" class="wsmud-login-clear-account">
                                <span class="glyphicon glyphicon-remove"></span>
                                <span>删除账号</span>
                            </div>
                            <div class="wsmud-login-version">v4.2</div>
                        </div>
                    </div>
                </div>
            `;
            $("body").append(dialogHTML);

            const customCSS = `
                .wsmud-login-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.7); z-index: 9998;
                    display: flex; justify-content: center; align-items: center;
                    transition: opacity 0.3s ease; opacity: 0; pointer-events: none;
                }
                .wsmud-login-overlay:not(.hide) { opacity: 1; pointer-events: auto; }
                @keyframes wsmud-login-fadein {
                    from { opacity: 0; transform: scale(0.92) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .wsmud-login-dialog {
                    width: 340px; max-width: 92%; background-color: #1f2937;
                    border: 1px solid #374151; box-shadow: 0 8px 32px rgba(0,0,0,0.6); color: #f3f4f6;
                    border-radius: 12px; animation: wsmud-login-fadein 0.3s ease-out;
                    overflow: hidden;
                }
                .wsmud-login-dialog-header {
                    padding: 14px 20px; background-color: #2d3748; border-bottom: 1px solid #374151;
                    position: relative; font-weight: 600; font-size: 16px;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.4);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) inset;
                }
                .wsmud-login-dialog-close {
                    position: absolute; top: 50%; right: 20px; transform: translateY(-50%);
                    cursor: pointer; font-size: 1.4em; color: #9ca3af;
                    transition: color 0.2s ease, transform 0.2s ease;
                }
                .wsmud-login-dialog-close:hover {
                    color: #f87171; transform: translateY(-50%) rotate(9deg);
                }
                .wsmud-login-dialog-content {
                    padding: 20px; display: flex; flex-direction: column; gap: 12px;
                }
                .wsmud-login-dialog-content h3 {
                    margin: 6px 0 4px; font-size: 14px; color: #9ca3af;
                    font-weight: 500;
                }
                .wsmud-login-select {
                    width: 100%; padding: 10px 12px; background-color: #2d3748; color: #f3f4f6;
                    border: 1px solid #374151; border-radius: 8px; box-sizing: border-box;
                    transition: all 0.25s ease; font-size: 14px;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M8 11l4-4H4l4 4z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat; background-position: right 12px center;
                }
                .wsmud-login-select:hover {
                    border-color: #60a5fa; background-color: #374151;
                }
                .wsmud-login-select:focus {
                    outline: none; border-color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
                }
                .wsmud-login-select:disabled {
                    background-color: #262f3f; color: #6b7280;
                    border-color: #374151; cursor: not-allowed;
                }
                #wsmud-login-status {
                    margin-top: 8px; font-size: 13px; text-align: center;
                    min-height: 18px; padding: 4px 0;
                }
                #wsmud-login-btn {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: #ffffff; text-align: center;
                    padding: 12px 15px; border-radius: 8px; cursor: pointer;
                    font-weight: 600; margin-top: 12px;
                    transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    display: flex; justify-content: center; align-items: center;
                }
                #wsmud-login-btn:hover {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                }
                #wsmud-login-btn:active {
                    transform: scale(0.97); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }
                #wsmud-login-btn.loading {
                    background: linear-gradient(135deg, #4b5563, #374151);
                    cursor: not-allowed;
                }
                .wsmud-login-version {
                    margin-top: 10px; font-size: 12px; color: #6b7280;
                    text-align: center;
                }
                .wsmud-login-clear-account {
                    color: #f87171; border: 1px solid #dc2626;
                    text-align: center; padding: 7px 8px; border-radius: 8px;
                    cursor: pointer; font-size: 13px; margin-top: 8px;
                    transition: all 0.2s ease;
                    display: flex; justify-content: center; align-items: center; gap: 4px;
                }
                .wsmud-login-clear-account:hover {
                    background: rgba(220, 38, 38, 0.12);
                }
                .wsmud-login-clear-account:active {
                    transform: scale(0.97);
                }
                .panel_item[command="ShowLoginDialog"] {
                    color: orange;
                    padding: 10px 0 10px 10px;
                    text-shadow: 0 0 15px;
                    transition: background-color 0.2s ease, color 0.2s ease;
                }
                .panel_item[command="ShowLoginDialog"]:hover {
                    background-color: rgba(96, 165, 250, 0.1);
                    color: #60a5fa;
                }
            `;
            $("head").append(`<style>${customCSS}</style>`);
            this.populateAccountsDropdown();
        },

        // ---- 在角色面板的"删除角色"按钮之后插入"一键登录"按钮 ----
        injectAssistantButton: function () {
            if (this.isButtonInjected) return;

            const $deleteButton = $('#role_panel ul li[command="DeleteRole"]');
            if ($deleteButton.length > 0) {
                const assistantButtonHTML = `
                    <li class="panel_item" command="ShowLoginDialog">
                        <span class="glyphicon glyphicon-user"></span>
                        <span style="margin-left:0.5rem">一键登录</span>
                    </li>`;
                $deleteButton.after(assistantButtonHTML);
                this.isButtonInjected = true;
            }
        },

        // ---- 绑定面板与登录弹窗的事件 ----
        bindPanelEvents: function () {
            // 点击"一键登录"按钮显示弹窗
            $(document).on("click", ".panel_item[command]", function () {
                const command = $(this).attr("command");
                if (command === "ShowLoginDialog") {
                    $("#wsmud-login-overlay").removeClass("hide");
                }
            });

            // 点击关闭按钮或遮罩层关闭弹窗
            $(document).on("click", ".wsmud-login-dialog-close, #wsmud-login-overlay", function (e) {
                if (e.target === this) {
                    $("#wsmud-login-overlay").addClass("hide");
                }
            });

            // 阻止点击弹窗内容区域时事件冒泡到遮罩层
            $(document).on("click", "#wsmud-login-dialog-container", function (e) {
                e.stopPropagation();
            });

            $("#wsmud-login-accounts").on("change", (e) => this.handleAccountChange(e));
            $("#wsmud-login-servers").on("change", (e) => this.handleServerChange(e));
            $("#wsmud-login-btn").on("click", () => this.handleAutoLogin());

            // 删除账号
            $("#wsmud-login-clear-account").on("click", () => {
                const account = $("#wsmud-login-accounts").val();
                if (!account) {
                    alert("请先选择要删除的账号");
                    return;
                }
                const roleIds = [];
                try {
                    const raw = localStorage.getItem("mud_game_account_data");
                    if (raw) {
                        const data = JSON.parse(raw);
                        const accInfo = data[account];
                        if (accInfo) {
                            for (const sv in accInfo) {
                                if (sv === "password") continue;
                                const info = accInfo[sv];
                                const roles = (info && info.roles) || [];
                                for (const r of roles) {
                                    if (r && r.id) roleIds.push(String(r.id));
                                }
                            }
                        }
                    }
                } catch (e) { }
                if (!confirm("确定删除账号 [" + account + "] 吗？\n将删除该账号下登录器保存的记录，并彻底删除其下 " + roleIds.length + " 个角色的全部配置。\n此操作不可恢复！\n继续？")) return;
                let cfgDel = 0;
                if (unsafeWindow && unsafeWindow.WG && unsafeWindow.WG.clear_role_data) {
                    for (const rid of roleIds) {
                        try { unsafeWindow.WG.clear_role_data(rid, true); cfgDel++; } catch (e) { }
                    }
                }
                try {
                    const raw = localStorage.getItem("mud_game_account_data");
                    if (raw) {
                        const data = JSON.parse(raw);
                        if (data[account]) {
                            delete data[account];
                            localStorage.setItem("mud_game_account_data", JSON.stringify(data));
                        }
                    }
                } catch (e) { }
                this.accountData = {};
                this.loadData();
                this.populateAccountsDropdown();
                this.resetDropdowns(["#wsmud-login-servers", "#wsmud-login-roles"]);
                alert("已删除账号 [" + account + "] 及其下 " + roleIds.length + " 个角色的配置");
            });

            $(".wsmud-login-select").on("focus", function () {
                $(this).addClass("focused");
            }).on("blur", function () {
                $(this).removeClass("focused");
            });
        },

        // ---- 重新填充账号下拉框，并重置区服/角色下拉框 ----
        populateAccountsDropdown: function () {
            const $select = $("#wsmud-login-accounts")
                .empty()
                .append('<option value="">--请选择账号--</option>');
            for (const account in this.accountData) {
                $select.append(`<option value="${account}">${account}</option>`);
            }
            this.resetDropdowns(["#wsmud-login-servers", "#wsmud-login-roles"]);
        },

        // ---- 账号切换：填充对应的区服列表 ----
        handleAccountChange: function (e) {
            const account = $(e.target).val();
            this.resetDropdowns(["#wsmud-login-servers", "#wsmud-login-roles"]);
            if (!account) return;

            const servers = Object.keys(this.accountData[account]).filter((k) => k !== "password");
            const $serverSelect = $("#wsmud-login-servers");
            if (servers.length > 0) {
                servers.forEach((server) => {
                    const cleanName = server.replace(/^武神传说2[\s\u00a0]*/, "").replace(/\u00a0/g, " ").trim() || server;
                    $serverSelect.append(`<option value="${server}">${cleanName}</option>`);
                });
                $serverSelect.prop("disabled", false);
                $serverSelect.css("opacity", 0.6).animate({ opacity: 1 }, 200);
                $serverSelect.prop("selectedIndex", 1).trigger("change");
            }
        },

        // ---- 区服切换：填充对应的角色列表 ----
        handleServerChange: function (e) {
            const server = $(e.target).val();
            const account = $("#wsmud-login-accounts").val();
            this.resetDropdowns(["#wsmud-login-roles"]);
            if (!server || !account) return;

            const roles = this.accountData[account][server]?.roles || [];
            const $roleSelect = $("#wsmud-login-roles");
            if (roles.length > 0) {
                roles.forEach((role) => $roleSelect.append(`<option value="${role.id}">${role.name} (${role.title})</option>`));
                $roleSelect.prop("disabled", false);
                $roleSelect.css("opacity", 0.6).animate({ opacity: 1 }, 200);
                $roleSelect.prop("selectedIndex", 1);
            }
        },

        // ---- 重置指定下拉框为初始状态 ----
        resetDropdowns: function (selectors) {
            selectors.forEach((selector) => {
                $(selector).empty().append('<option value="">--请选择--</option>').prop("disabled", true);
                $(selector).css("opacity", 1);
            });
        },

        // ---- 更新登录状态提示 ----
        updateStatus: function (message, isError = false) {
            const $status = $("#wsmud-login-status");
            $status.text(message).css("color", isError ? "#f87171" : "#f59e0b");
            $status.css("opacity", 0.6).animate({ opacity: 1 }, 200);
        }
    });

    // 注入登录弹窗 DOM 与绑定面板事件
    AccountHelper.injectLoginDialog();
    AccountHelper.bindPanelEvents();
})();