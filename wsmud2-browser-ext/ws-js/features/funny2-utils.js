// funny2-utils.js
// 武神传说 MUD 工具函数：命令发送、消息追加、金额格式化等
"use strict";

// 将字符串解析为对象：以 { 开头视为对象字面量，否则包装为 {type:"text", text:str}
function Str2Obj(str) {
    if (str[0] === "{") {
        return (new Function("return " + str))();
    } else {
        return { "type": "text", "text": str };
    }
}

// 当前时间字符串（HH:MM）
function Time2Str() {
    let date = new Date();
    let str = date.toString().substr(16, 5);
    return str;
}

// 金额数字转中文描述：黄金/白银/铜板
function Money2Str(number) {
    if (number == 0 || isNaN(number)) return 0;
    let str = "" + number;
    let c = str.substring(str.length - 2, str.length);
    if (c && c !== "00") {
        c = parseInt(c) + "个<yel>铜板</yel>";
    } else {
        c = "";
    }
    let b = str.substring(str.length - 4, str.length - 2);
    if (b && b !== "00") {
        b = parseInt(b) + "两<wht>白银</wht>";
    } else {
        b = "";
    }
    let a = str.substring(0, str.length - 4);
    if (a) a = a + "两<hiy>黄金</hiy>";
    return a + b + c;
}

// 自动滚动到底部：仅在内容超出可视区时触发
function AutoScroll(selector) {
    const container = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

    if (!container) {
        console.warn('[AutoScroll] 找不到元素: ' + selector);
        return;
    }

    if (container.scrollHeight > container.clientHeight) {
        try {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth"
            });
        } catch (e) {
            container.scrollTop = container.scrollHeight;
        }
    }
}

// 深拷贝（仅适用于普通对象，不处理数组与循环引用）
function DeepCopy(object) {
    let result = {};
    for (const key in object) {
        result[key] = (typeof object[key] === "object") ? DeepCopy(object[key]) : object[key];
    }
    return result;
}

// 发送命令：支持字符串或数组（数组首项为数字时作为延迟毫秒）
// 【2026-09-05 新版客户端适配】改名 f2SendCommand，不再覆盖全局 SendCommand：
//  - 旧模式：仍挂到 window.SendCommand（保持原行为，拦截游戏/扩展的命令）
//  - 新模式：新客户端自带 SendCommand（模块内部发送不走 window），扩展内部改用 f2SendCommand
function f2SendCommand(command) {
    if (Array.isArray(command)) {
        if (command.length === 0) return;
        let cmd1 = command[0];
        let cmd2 = command.slice(1);
        if (typeof cmd1 === "number") {
            setTimeout(() => f2SendCommand(cmd2), cmd1);
        } else if (cmd1) {
            f2SendCommand(cmd1);
            f2SendCommand(cmd2);
        }
    } else if (typeof command === "string") {
        window.WG.SendCmd(command);
    }
}
// 【2026-09-05 新版客户端适配】新模式判定：优先用 content.js 打的标记，兜底自查 DOM
// （防止标记脚本未执行时误走旧模式分支、覆盖新客户端的 SendCommand 导致登录异常）
var _extNewClientMode = window.__extNewClientMode || !!document.querySelector('script[src*="dist_new"]');
if (_extNewClientMode) {
    window.f2SendCommand = f2SendCommand;   // 新模式：扩展内部专用（不碰 window.SendCommand）
} else {
    window.SendCommand = f2SendCommand;     // 旧模式：保持原覆盖行为
}

// 追加内容到主消息区并自动滚动
function AddContent(element) {
    $(".content-message pre").append(element);
    AutoScroll(".content-message");
    return false;
}

// 播放提示音并提示用户检查音量
function Tips() {
    NotSound();
    AddContent($("<span></span>").append("<hiy>如无声音，请检查音量\n</hiy>"));
}