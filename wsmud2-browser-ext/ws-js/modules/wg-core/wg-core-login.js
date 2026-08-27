// ============================================================
// wg-core-login.js —— WG 登录初始化
// ------------------------------------------------------------
// 扩展 WG 对象的 login() 方法：角色登录后的完整初始化流程。
// 依赖 wg-core-styles.js 提供的 CSS 函数。
// ============================================================
'use strict';

(function () {
    if (typeof WG === 'undefined') return;

    WG.login = function () {
        var role = $('.role-list .select').text().split(/[\s\n]/).pop();
        var roleid = $('.role-list .select').attr('roleid');
        GM_listValues().map(function (key) {
            if (key.indexOf(role + "_") == 0) {
                var tmpVal = key.split(role + "_")[1];
                console.log(tmpVal);
                GM_setValue(roleid + "_" + tmpVal, GM_getValue(key, null));
                GM_deleteValue(key);
            }
        });

        $(".bottom-bar").append("<span class='item-commands' style='display:none'><span WG='WG' cmd=''></span></span>");
        var html = UI.wgui();
        $(".content-message").after(html);
        $('.content-bottom').after("<div class='zdy-commands' style='font-size:0.9em'></div>");

        window.role = role;
        window.roleid = roleid;

        // 注入核心样式
        GM_addStyle(_getZdyItemCSS());
        GM_addStyle(_getCodeFontCSS());

        // 初始化角色配置
        GlobalInit.configInit();

        if (backimageurl != '') {
            // 背景图模糊样式
            var backcss = _getBackImageCSS();
            GM_addStyle(backcss);
            GM_addStyle(`body{background-color:rgb(0,0,0,.25)}
                div{ opacity:1;}
                html{background:rgba(255,255,255,0.25);
                background-image:url('${backimageurl}');
                background-repeat:no-repeat;
                background-size:100% 100%;
                -moz-background-size:100% 100%;} `);
        }

        // 界面配色读取
        color_select = GM_getValue("color_select", color_select);
        let link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = diff_colors[color_select];
        let head = document.getElementsByTagName("head")[0];
        head.appendChild(link);

        setTimeout(() => {
            try {
                if (GM_registerMenuCommand) {
                    GM_registerMenuCommand("设  置", WG.setting);
                    GM_registerMenuCommand("调  试", WG.cmd_echo_button);
                }
            } catch (e) { }

            document.title = role + "-MUD游戏-武神传说";
            LayerHelper.msg(`欢迎使用，版本号${GM_info.script.version || ''}`);

            // 自动打开栏目
            KEY.do_command("showtool");
            KEY.do_command("showcombat");

            // 获得必要信息
            setTimeout(() => {
                KEY.do_command("pack");
                KEY.do_command("score");
                WG.SendCmd("score2");
            }, 1000);

            let keys = GM_getValue('keys');
            if (!keys) {
                console.log('已自动设置快捷键，使用W A S D Q E Z C 控制快捷移动');
                GM_setValue('keys', {"KeyA":"0_0","KeyD":"0_1","KeyW":"0_2","KeyS":"0_3","KeyQ":"0_4","KeyE":"0_5","KeyZ":"0_6","KeyC":"0_7"});
            }

            WG.customDock(custom_dock);

            setTimeout(() => {
                var rolep = role;
                if (GameState.score.level) {
                    rolep = GameState.score.level + role;
                }
                if (CanUse) {
                    if (shieldswitch == "开" || shieldswitch === true || shieldswitch === 'true') {
                        messageAppend('已注入屏蔽系统', 1);
                    }
                    let tmp = `<hiy>欢迎${rolep},插件已加载！</hiy>`;
                    messageAppend(tmp);

                    WG.ztjk_func();
                    WG.zml_showp();
                    WG.dsj_func();
                    setTimeout(() => {
                        WG.SendCmd("info");
                        WG.SendCmd("events");
                    }, 1500);
                    setTimeout(() => {
                        WG.SendCmd("relation");
                        WG.wsdelaytest();
                    }, 5000);
                    if (GameState.score.level && GameState.score.isGod) {
                        WG.ytjk_func();
                    }
                } else {
                    var logintext = `
                        <hiy>欢迎${role},插件未正常加载！
                        当前浏览器不支持自动喜宴,请使用centbrowser浏览器
                        谷歌系浏览器,请在network中勾选disable cache,多刷新几次,直至提示已加载!
                        多次刷新无法仍然出现本提示，请打开tampermonkey 插件设置
                        开启高级设置，在最下方实验 设置 "注入模式：即时""严格模式：禁用"
                        插件版本: ${GM_info.script.version || ''}
                        </hiy>`;
                    messageAppend(logintext);
                }
            }, 500);

            // 执行记忆面板
            var closeBorad = localStorage.getItem("closeBorad");
            if (closeBorad === "true") {
                WG.showhideborad();
            }
            WG.runLoginhml();

            // 开启定时器
            var systime = setInterval(() => {
                var myDate = new Date();
                let timeTips = {
                    data: JSON.stringify({
                        type: "time",
                        h: myDate.getHours(),
                        m: myDate.getMinutes(),
                        s: myDate.getSeconds(),
                        time: myDate.toTimeString()
                    })
                };
                WG.receive_message(timeTips);
            }, 1000);

            // 挂机健康自检定时器（每5分钟）
            setInterval(function () {
                if (WG.healthCheck) WG.healthCheck();
            }, 300000);
        }, 1000);
    };
})();