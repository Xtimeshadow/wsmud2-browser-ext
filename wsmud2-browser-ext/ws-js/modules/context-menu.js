// ============================================================
// context-menu.js —— 右键菜单（传送/自动/设置等）
// ------------------------------------------------------------
// 从 main-ready.js 拆分出来的右键菜单功能。
// 包含常用地点传送、门派战传送、自动、设置等右键菜单项。
// ============================================================
'use strict';

$(document).ready(function () {
    // 点击房间名 → 弹出右键菜单
    $('.room-name').on('click', (e) => {
        e.preventDefault();
        $('.room-name').contextMenu({
            x: 1,
            y: 1
        });
    });

    // ---- 右键菜单子项：常用地点传送表 ----
    // 想加传送点？在这里加一行："名字": "去那里的命令"
    function makeTp(mp = 0) {
        var mptp = {
            "豪宅": "$to 住房",
            "当铺": "$to 扬州城-当铺;list {r唐楠}",
            "挖矿": "$to 扬州城-挖矿",
            "武庙": "$to 扬州城-武庙",
            "木头人": "$to 少林派-西侧殿",
            "师父": "$to 师父",
            "后勤": "$to 后勤;$wait 500;ask1 {r后勤}",
            "鉴宝阁": "$to 药王谷-鉴宝阁;list {r拍卖师}",
            "衙门": ["$to 扬州城-衙门正厅"],
        }
        if (mp == 1) {
            mptp = {
                "逍遥": "$to 门派橙-逍遥",
                "丐帮": "$to 门派橙-丐帮",
                "峨眉": "$to 门派橙-峨眉",
                "华山": "$to 门派橙-华山",
                "武当": "$to 门派橙-武当",
                "少林": "$to 门派橙-少林",
                "领取奖励": "events WUDANG_settle",
            }
        }
        var subItems = {};
        for (let item in mptp) {
            subItems[item] = {
                name: item, callback: function () {
                    WG.SendCmd(mptp[item]);
                }
            }
        }
        var dfd = jQuery.Deferred();
        setTimeout(function () {
            dfd.resolve(subItems);
        }, 20);
        return dfd.promise();
    }

    // ---- 组装整个右键菜单 ----
    function createRightClickMenu() {
        return {
            items: {
                "快捷传送": {
                    name: "常用地点",
                    "items": makeTp(0)
                },
                "门派战传送": {
                    name: "门派战传送",
                    "items": makeTp(1)
                },
                "打开仓库": {
                    name: "打开仓库",
                    callback: function (key, opt) {
                        WG.Send("store");
                    },
                },
                "关闭自动": {
                    name: "关闭自动",
                    visible: function (key, opt) {
                        return timer != 0;
                    },
                    callback: function (key, opt) {
                        WG.timer_close();
                    },
                },
                "自动": {
                    name: "自动",
                    visible: function (key, opt) {
                        return timer == 0;
                    },
                    "items": {
                        "自动比试": {
                            name: "自动比试",
                            visible: function (key, opt) {
                                return WG.fight_listener == undefined;
                            },
                            callback: function (key, opt) {
                                WG.auto_fight();
                            },
                        },
                        "关闭比试": {
                            name: "关闭比试",
                            visible: function (key, opt) {
                                return WG.fight_listener != undefined;
                            },
                            callback: function (key, opt) {
                                WG.auto_fight();
                            },
                        },
                    },
                },
                "自命令、自定义监控": {
                    name: "自命令、自定义监控",
                    callback: function (key, opt) {
                        WG.zmlztjk();
                    },
                },
                "换装设置": {
                    name: "换装设置",
                    callback: function (key, opt) {
                        $('.context-menu-list').hide();
                        $('.context-menu-icon').hide();
                        $('.context-menu-active').removeClass('context-menu-active');
                        WG.eqhelperui();
                    },
                },
                "换装": {
                    name: "换装",
                    items: WG.eqloader()
                },
                "设置": {
                    name: "设置",
                    callback: function (key, opt) {
                        $('.context-menu-list').hide();
                        $('.context-menu-icon').hide();
                        $('.context-menu-active').removeClass('context-menu-active');
                        WG.setting();
                    },
                },
                "打开快捷操作栏": {
                    name: "打开快捷操作栏",
                    visible: function (key, opt) {
                        return $('.WG_button').css('display') == 'none';
                    },
                    callback: function (key, opt) {
                        WG.showhidebtn();
                    },
                },
                "关闭快捷操作栏": {
                    name: "关闭快捷操作栏",
                    visible: function (key, opt) {
                        return $('.WG_button').css('display') != 'none';
                    },
                    callback: function (key, opt) {
                        WG.showhidebtn();
                    },
                }
            }
        }
    }

    // 判断是不是手机/平板（移动端右键菜单挂的位置不一样）
    function isMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android|iphone|ipod|ipad|blackberry|iemobile|opera mini/i.test(userAgent)) {
            return true;
        }
        if (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) {
            return window.innerWidth <= 1024;
        }
        return false;
    }

    // 注册右键菜单（移动端挂在房间名上，电脑端挂在游戏界面上）
    if (isMobile()) {
        $.contextMenu({
            selector: ".room-name",
            build: function ($trigger, e) {
                return createRightClickMenu()
            }
        })
    } else {
        $.contextMenu({
            selector: '.container',
            build: function ($trigger, e) {
                return createRightClickMenu();
            }
        });
    }
});