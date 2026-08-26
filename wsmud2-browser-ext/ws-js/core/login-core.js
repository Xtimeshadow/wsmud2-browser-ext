// ============================================================
// login-core.js —— 登录/注册/选服逻辑
// ------------------------------------------------------------
// 从 ws.js 拆出来的账号流程：
//   LoginMethods  登录面板各按钮的方法集（登录/注册/改密/绑手机）
//   LoginCommand  登录面板的命令分发
//   CheckLogin    校验登录状态
//   SendValidateCode 发送手机验证码
//   SetCookie     保存登录凭证
// 全局变量：GameClient（客户端实例）、SelectedServer（当前选中区服）、
//           SERVERS（区服列表）、screenTop
// 想改：注册时的用户名正则、角色属性范围（15-30、总和80）→ 在本文件搜索。
// ============================================================
'use strict';

// login-core.js — 登录逻辑（从 ws.js 提取），包含登录、注册、选服、角色管理等。

let GameClient, SelectedServer, screenTop = 0;
let SERVERS;

function open_map() {
    this.last_click = this.last_click ?? 0;
    const now = Date.now();
    if (now - this.last_click > 500) {
        this.last_click = now;
        return;
    }
    Dialog.show("map");
}

function init_mobile(ua, width, height, dpr) {
    let _t5 = window.devicePixelRatio;
    ua = Math.floor(ua / _t5);
    width = Math.floor(width / _t5);
    window.screenTop = ua;
    let _t6 = document.body.clientHeight - ua - width;
    $(".login-content").height(_t6 + 'px').css("marginTop", ua + 'px');
    $(".container").height(_t6 + 'px').css("marginTop", ua + 'px');
}

function CheckLogin() {
    var _t7 = GetUserCookie('p');
    if (!_t7)
        return $("#login_panel").show();
    ShowServers();
}

function is_weixin() {
    var _t8 = navigator.userAgent.toLowerCase();
    return _t8.match(/MicroMessenger/i) === "micromessenger" ? !![] : ![];
}

function LoginCommand(event) {
    var _J1 = $(this).attr("command");
    switch (_J1) {
    case "ToRolePanel":
        HideAndShow($("#role_panel"));
        break;
    case "ToServerPanel":
        CloseServer();
        HideAndShow($("#slist_panel"));
        break;
    case "ToLogin":
        HideAndShow($("#login_panel"));
        break;
    case 'Forget':
        HideAndShow($("#reset_panel"));
        break;
    case "CancleRegist":
        HideAndShow($("#login_panel"));
        break;
    case "Down":
        HideAndShow($("#download"));
        break;
    default:
        LoginMethods[_J1]();
        break;
    }
}


function SendValidateCode() {
    const _J19 = $(this);
    if (_J19.is(':disabled'))
        return;
    const _t36 = _J19.parent().prev().prev()
    let _t37 = _t36.val();
    if (!_t36.is(':disabled')) {
        if (!_t37) return ShowInputError(_t36, "请输入你的帐号绑定的手机号码");
        if (!/^1\d{10}$/.test(_t37)) return ShowInputError(_t36, '手机号码格式错误');
    } else
        _t37 = '';
    API.UserAPI.SendValidateCode(_t37, function(_t38) {
        if (!_t38)
            ShowInputError(_J19.parent(), "验证码发送失败");
    });
    _J19.prop("disabled", !![]);
    _J19.html("120秒后重新发送");
    SetButtonText(0, _J19);
}

function SetButtonText(remaining, button) {
    if (remaining === 120) {
        button.prop('disabled', ![]);
        button.html("发送验证码");
    } else {
        button.html(120 - remaining + '秒后重新发送');
        remaining++;
        window.setTimeout(SetButtonText.bind(this, remaining, button), 1000);
    }
}

function SetCookie(name, value) {
    const date = new Date();
    date.setTime(date.getTime() + 300 * 24 * 60 * 60 * 1000);
    const _t54 = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + ';\x20expires=' + date.toGMTString();
}