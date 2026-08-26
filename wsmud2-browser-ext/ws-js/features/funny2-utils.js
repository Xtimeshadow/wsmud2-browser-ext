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
function SendCommand(command) {
    if (Array.isArray(command)) {
        if (command.length === 0) return;
        let cmd1 = command[0];
        let cmd2 = command.slice(1);
        if (typeof cmd1 === "number") {
            setTimeout(() => SendCommand(cmd2), cmd1);
        } else if (cmd1) {
            SendCommand(cmd1);
            SendCommand(cmd2);
        }
    } else if (typeof command === "string") {
        window.WG.SendCmd(command);
    }
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