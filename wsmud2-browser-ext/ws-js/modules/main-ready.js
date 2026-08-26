// ============================================================
// main-ready.js —— 页面就绪后的启动动作
// ------------------------------------------------------------
// 游戏页面加载完成后（document ready）执行：
//   1. 引入几个外部样式（右键菜单样式、layer 弹窗样式、图标字体）
//   2. 挂上输入框（UI.codeInput —— 游戏内命令行）
//   3. 初始化 KEY（快捷键）、WG（主框架）、GlobalInit（数据同步）
//   4. 把一堆功能对象暴露到全局（unsafeWindow.xxx），方便游戏内调用
//   5. 注册右键菜单：常用地点传送、自动、设置等
//   6. 处理从其它地方（比如游戏内 iframe）postMessage 过来的命令
// ============================================================
'use strict';

var originWindow = {};
$(document).ready(function () {
    // 【2026-08-14 CDN 样式本地化】右键菜单 / layer / font-awesome 样式原走第三方 CDN
    // （CDN 挂掉界面样式即丢失）。已改为 content.js 在 document_start 注入扩展本地文件
    // （ws-js/lib/skin/ 下的 jquery.contextMenu.min.css、layer.css、font-awesome.css），此处不再引用 CDN。
    // 挂上游戏内命令行输入框（UI.codeInput 在 ui.js 里定义）
    $('body').append(UI.codeInput);
    // 【2026-08-20】游戏内命令行输入框支持 Tab 缩进
    try { enableTabIndent(document.getElementById('testmain')); } catch (e) { }

    // ---- 初始化三大核心 ----
    KEY.init();              // 快捷键
    WG.init();               // 插件主框架（wg-core.js）
    GlobalInit.init();       // 数据同步中枢（global-init.js）

    // ---- 暴露到全局：让游戏页面任何地方都能直接用这些对象 ----
    unsafeWindow.WG = WG;                 // 插件主接口（SendCmd、setting 等）
    unsafeWindow.TaskHelper = TaskHelper; // 自命令函数库（别名 T）
    unsafeWindow.LayerHelper = LayerHelper; // 弹窗助手
    unsafeWindow.GameState = GameState;   // 全局状态
    unsafeWindow.show_msg = show_msg;     // 显示消息
    unsafeWindow.messageClear = messageClear; // 清空日志
    unsafeWindow.messageAppend = messageAppend; // 追加日志
    unsafeWindow.send_cmd = send_cmd;     // 发命令（走队列）
    unsafeWindow.roomData = roomData;     // 房间数据
    unsafeWindow.MusicBox = MusicBox;     // 八音盒（音乐播放）
    unsafeWindow.FakerTTS = FakerTTS;     // 语音朗读
    unsafeWindow.Push = Push;             // 远程推送（Server酱等）
    unsafeWindow.WSStore = store;         // 存储封装
    unsafeWindow.imgShow = imgShow;       // 图片显示

    // ---- 监听其它窗口 postMessage 发来的命令 ----
    // （游戏内嵌 iframe 或用户粘贴命令时会走到这里）
    window.addEventListener("message", receiveMessage, false);

    function receiveMessage(event) {
        // 【2026-08-14 安全加固】校验 postMessage 来源，防止第三方 iframe / 陌生窗口注入命令：
        //   ✓ event.source === window            —— 本窗口自身脚本（游戏本体 / 扩展注入脚本）
        //   ✓ event.source === window.opener     —— 通过 window.open 打开本页的外部登录器
        //   ✓ event.origin === location.origin   —— 游戏站自己的 iframe
        //   其余来源一律忽略（尤其阻止跨站 iframe 触发 #js 任意代码执行 / denglu 自动登录）
        if (event.source !== window && event.source !== window.opener &&
            event.origin !== location.origin) {
            return;
        }
        originWindow = event;
        var origin = event.origin;
        var data = event.data;
        // 自动登录辅助：收到 "denglu 用户名" 时自动选择对应角色
        if (String(data).indexOf("denglu") >= 0) {
            if (typeof role !== 'undefined') {   // 已经登录了就不用
                return;
            }
            let userName = String(data).split(" ")[1];   // 取出用户名
            let userList = $('#role_panel > ul > li.content > ul >li');  // 角色列表
            for (let user of userList) {
                // 高亮匹配的角色
                if (user.innerText.indexOf(userName) >= 0) {
                    $(user).addClass("select");
                } else {
                    $(user).removeClass("select");
                }
            }
            $("li[command=SelectRole]").click()   // 点"选择角色"
            return;
        }
        // 是 JSON 数据就忽略（游戏协议消息不走这里）
        try {
            if (JSON.parse(data) instanceof Object) {
                return;
            }
        } catch (error) {
            console.log("Run at message");
        }
        // 文本命令处理
        if (typeof data == 'string') {
            //包含setImmediate 跳过
            if (data.indexOf("setImmediate") >= 0) {
                return;
            }
            if (data === '挖矿' || data === '修炼') {   // 快捷词：挖矿/修炼
                WG.zdwk();
            } else if (data === '挂机') {                // 快捷词：挂机 = 停止挂机
                WG.SendCmd("stopstate");
            } else {
                if (data.split("\n")[0].indexOf("//") >= 0) {   // // 开头 = Raid 流程
                    if (unsafeWindow && unsafeWindow.ToRaid) {
                        ToRaid.perform(data);
                    }
                } else if (data.split("\n")[0].indexOf("#js") >= 0) {  // #js 开头 = 直接执行 JS
                    // 【2026-08-14 安全加固】#js 可执行任意代码，只接受"本窗口自身脚本"发来的消息
                    // （外部登录器 / iframe 发来的 #js 一律拒绝，防止被注入执行）
                    if (event.source !== window) {
                        console.warn("[WSMUD] 已阻止非本窗口来源的 #js 命令");
                        return;
                    }
                    var jscode = data.split("\n");
                    jscode.baoremove(0)
                    eval(jscode.join(""));
                } else {   // 其它 → 当作普通游戏命令发给服务器
                    WG.SendCmd(data);
                }
            }
        }
    }
});
