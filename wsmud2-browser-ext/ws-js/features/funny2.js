// funny2.js
// 武神传说 MUD 综合增强脚本：监控游戏事件、代理状态、桥接子模块。
// 核心模块：变量、代理、事件钩子。
// 子模块：funny2-utils（工具函数）、funny2-settings（设置弹窗）、
//         funny2-layout（入口）/ funny2-layout-core（核心布局）/ funny2-layout-ui（UI元素）、
//         funny2-auto（自动售卖/使用）
(function () {
    "use strict";
    /********************变量********************/

    let isMoblie = false;
    let test = true;

    // 标题代理：写入时同步更新 document.title
    let title = new Proxy({ name: "RoleName", state: "<STATE>" }, {
        set: function (title, key, value) {
            title[key] = value;
            $("head title").html(title.name + title.state);
            return true;
        },
        get: function (title, key) {
            return title[key];
        }
    });
    let roles = {};
    let id = "";
    let login = false;

    // 角色代理：写入非 name 字段时同步更新对应 DOM；name 字段一旦存在就不再覆盖
    let role = new Proxy({}, {
        set: function (role, key, value) {
            if (!isMoblie) {
                if (key === "name" && role.name) return true;
                $(".role_" + key).html(value);
            }
            role[key] = value;
            return true;
        },
        get: function (role, key) {
            return role[key];
        }
    });
    let skills = new Proxy({}, {
        set: function (skills, key, value) {
            skills[key] = value;
            return true;
        },
        get: function (skills, key) {
            return skills[key];
        }
    });
    let room = new Proxy({ str: "a-b", name1: "a", name2: "b", path: "a/b/c", items: [] }, {
        set: function (room, key, value) {
            room[key] = value;
            return true;
        },
        get: function (room, key) {
            return room[key];
        }
    });
    let exits = {};

    // 内容代理：写入时若存在 .remove_<key> 元素则先移除，避免重复堆叠
    let content = new Proxy({ task: "任务", lwsb: "领悟石壁" }, {
        set: function (content, key, value) {
            if ($(".remove_" + key)[0]) {
                $(".remove_" + key).remove();
            }
            content[key] = value;
            return true;
        },
        get: function (content, key) {
            return content[key];
        }
    });

    // 检查判断
    {
        if (!test) {
            console.log = () => { return; };
        }
        if (navigator.userAgent) {
            let agent = navigator.userAgent.toLowerCase();
            if (/ipad|iphone|android|mobile/.test(agent)) {
                isMoblie = true;
            }
            console.log(agent);
        }
    }

    /********************桥接暴露********************/
    var __fn = window.__funny2 = {};
    __fn.follower = new Proxy({}, {
        set: function (follower, key, value) {
            follower[key] = value;
            return true;
        },
        get: function (follower, key) {
            return follower[key];
        }
    });
    Object.defineProperty(__fn, 'id', { get: function () { return id; } });
    Object.defineProperty(__fn, 'isMoblie', { get: function () { return isMoblie; } });
    __fn.role = role;
    __fn.room = room;

    /********************监控********************/

    window.WG.add_hook(['roles', 'login'], function (data) {
        if (data.type === "roles") {
            data.roles.forEach(function (r) {
                roles[r.id] = r.name;
            });
        } else if (data.type === "login") {
            id = data.id;
            title.name = roles[id];
            title.state = "<已登录>";
            role.name = roles[id];
        }
    });
    window.WG.add_hook('room', function (data) {
        room.str = data.name.replace("(副本区域)", "");
        var x = room.str.match(/(.*)-(.*)/) || ['', '', ''];
        room.name1 = x[1];
        room.name2 = x[2];
        room.path = data.path;
        room.desc = data.desc;
        if (room.desc.length > 20) {
            var desc0 = room.desc.replace(/<([^<]+)>/g, "");
            var desc1 = desc0.substr(0, 20);
            var desc2 = desc0.substr(20);
            data.desc = desc1 + '<span id="show"> <hic>»»»</hic></span><span id="more" style="display:none">' + desc2 + '</span><span id="hide" style="display:none"> <hic>«««</hic></span>';
        }
        $("#show").click(function () { $("#more").show(); $("#show").hide(); $("#hide").show(); });
        $("#hide").click(function () { $("#more").hide(); $("#show").show(); $("#hide").hide(); });
    });
    window.WG.add_hook('exits', function (data) {
        for (var key in exits) delete exits[key];
        for (var key in data.items) {
            exits[key] = data.items[key];
            exits[data.items[key]] = "go " + key;
        }
    });
    window.WG.add_hook(['items', 'itemadd', 'itemremove'], function (data) {
        if (data.type === "items") {
            room.items = [];
            data.items.forEach(function (item) {
                if (item === 0) {
                } else if (item.id && item.name && Object.entries(item).length === 2) {
                    if (!item.name.includes("尸体")) {
                        SendCommand('get ' + item.id);
                    }
                } else if (item.p !== 1) {
                    room.items.push(item);
                }
            });
        }
        if (data.type === "itemadd" && data.p !== 1) {
            room.items.push(data);
        }
        if (data.type === "itemremove") {
            var idx = room.items.findIndex(function (item) { return item.id === data.id; });
            if (idx !== -1) room.items.splice(idx, 1);
        }
    });
    window.WG.add_hook(['state', 'combat'], function (data) {
        if (data.type === "state") {
            if (data.state) {
                title.state = '<' + data.state.replace("你正在", "") + '>';
            } else {
                title.state = "<闲逛中>";
            }
        } else if (data.type === "combat") {
            if (data.start === 1) {
                title.state = "<战斗中>";
            } else if (data.end === 1) {
                title.state = "<闲逛中>";
            }
        }
    });

    var pack = new Proxy({ items: [], moneyStr: "" }, {
        set: function (pack, key, value) {
            if (key === "moneyStr") $(".role_money").html(value);
            pack[key] = value;
            return true;
        },
        get: function (pack, key) {
            return pack[key];
        }
    });

    window.WG.add_hook('dialog', function (data) {
        if (data.dialog == 'score') {
            for (var key in data) {
                if (key == 'name') {
                    var n1 = data[key].startsWith('<') ? data[key].split('</')[0] : data[key];
                    var n2 = n1.includes(' ') ? n1.split(' ').pop() : n1;
                    role[key] = n2.includes('<') ? n2.split('<')[0] : n2;
                    continue;
                }
                role[key] = data[key];
            }
        } else if (data.dialog == "skills") {
            if (data.items) {
                role.skill_limit = data.limit;
                role.pot = data.pot;
                role.skill_count = data.items.length;
                role.skills = data.items;
                data.items.forEach(function (skill) {
                    var color = ["/", "wht", "hig", "hic", "hiy", "hiz", "hio", "ord"];
                    for (var i = 1; i < color.length; i++) {
                        if (skill.name.includes(color[i])) {
                            skill.color = i;
                            break;
                        }
                    }
                    skills[skill.id] = skill;
                });
            } else if (data.item) {
                var color = ["/", "wht", "hig", "hic", "hiy", "hiz", "hio", "ord"];
                for (var i = 1; i < color.length; i++) {
                    if (data.item.name.includes(color[i])) {
                        data.item.color = i;
                        break;
                    }
                }
                skills[data.item.id] = data.item;
            } else if (data.enable) {
                skills[data.id].enable_skill = data.enable;
            } else if (data.exp) {
                var skill = skills[data.id];
                if (!skill) return true;
                if (data.level) {
                    skill.level = data.level;
                }
            }
        } else if (data.dialog == 'pack' && data.money) {
            $(".role_money").html(Money2Str(data.money));
        } else if (data.dialog == 'relation') {
            data = window.WG.smartClone(data);
            data = window.WG.deserializePackData(data);
            Object.keys(__fn.follower).forEach(function (key) { delete __fn.follower[key]; });
            var fls = data.fls;
            for (var i = 0; i < fls.length; i++) {
                var item = fls[i];
                if (!item) continue;
                var name = item[0].match(/^(?=.+?[\u4e00-\u9fa5])(?:(.+?)\s)?([\u4e00-\u9fa5]+)(?:\s?<hig>.*)?$/);
                if (name) name = name[2];
                var followerId = item[1];
                var work = item[2] || "采药";
                __fn.follower[name] = {};
                __fn.follower[name].id = followerId;
                __fn.follower[name].work = work;
                if (Object.keys(__fn.follower).length >= 3) break;
            }
        } else {
            return;
        }
    });

    /*****内力计算*****/
    window.WG.add_hook('sc', function (data) {
        if (data.id === id) {
            role.hp = data.hp;
            role.mp = data.mp;
            role.max_hp = data.max_hp;
            role.max_mp = data.max_mp;
        }
    });

    /*****侠客岛领悟石壁辅助*****/
    window.WG.add_hook('text', function (data) {
        if (/石破天对你说到：你知道(.*)是什么意思吗？/.test(data.text)) {
            var xkx = [
                ["赵客缦胡缨", "吴钩霜雪明", "银鞍照白马", "飒沓如流星"],
                ["十步杀一人", "千里不留行", "事了拂衣去", "深藏身与名"],
                ["闲过信陵饮", "脱剑膝前横", "将炙啖朱亥", "持觞劝侯嬴"],
                ["三杯吐然诺", "五岳倒为轻", "眼花耳热后", "意气素霓生"],
                ["救赵挥金槌", "邯郸先震惊", "千秋二壮士", "煊赫大梁城"],
                ["纵死侠骨香", "不惭世上英", "谁能书阁下", "白首太玄经"],
            ];
            var go = ["go east", "go south", "go west", "go north"];
            var x = data.text.match(/石破天对你说到：你知道(.*)是什么意思吗？/);
            for (var i = 0; i < xkx.length; i++) {
                for (var j = 0; j < xkx[i].length; j++) {
                    if (xkx[i][j] === x[1]) {
                        AddContent('<hig>检测到诗句<hiw>' + x[1] + '</hiw>，苏轻将帮你寻找石室。\n</hig>');
                        SendCommand(["stopstate", "go enter", go[j], "lingwu bi"]);
                        break;
                    }
                }
            }
        }
        if (data.type === "skills" && title.state === "<领悟石壁>") {
            var skill = skills[data.id];
            if (!skill) return;
            var x = skill.name.match(/<wht>基本(.*)<\/wht>/);
            content.lwsb = "是" + x[1];
            if (data.level) {
                AddContent('<hig>领悟石壁完成，苏轻将帮你寻找石破天。\n</hig>');
                var go = exits["山洞"];
                var say = "say " + content.lwsb;
                SendCommand(["stopstate", go, "go out", say, "cr"]);
                setTimeout(function () { Tips(); }, 1000);
            }
            AddContent('由于领悟石壁，你的技能' + skill.name + '提升到了<hig>' + data.exp + '%</hig>！\n');
            if (data.exp < 90) {
                $(".remove_exp_90").remove();
                AddContent('<hir class="remove_exp_90">建议将技能熟练度练习到90%以上再继续领悟石壁！\n</hir>');
            }
        }
    });

    /********************READY********************/
    $(document).ready(function () {
        GM_addStyle('.content-bottom { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }');
        GM_addStyle([
            '.span-btn { border: gray solid 1px; border-radius: 3px; display: inline-block; padding: 5px; font-size: 15px; margin: 0 5px 5px 0; }',
            '.span-btn { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; cursor: pointer; }',
            '.span-btn:hover { color: #ffffff; }',
            '.span-btn:active { transform: translateY(1px); }',
        ].join('\n'));
        GM_addStyle([
            '.layui-layer-rim { background:#1a1a2e !important; border:1px solid #555 !important; box-shadow:0 0 30px rgba(0,0,0,0.5) !important; }',
            '.layui-layer-title { background:#14141f !important; color:#ccc !important; border-bottom:1px solid #555 !important; }',
            '.layui-layer-content { color:#ccc !important; }',
        ].join('\n'));
        if (isMoblie) return;
        $(".signinfo").addClass("hide");
        $(".room_items")[0].style.maxHeight = "240px";
        $(".state-bar")[0].style.overflow = "hidden";
        $(".combat-commands")[0].style.overflow = "hidden";
        $(".dialog-content")[0].style.overflowX = "hidden";
        GM_addStyle([
            '.content-bottom { -webkit-user-select: none, -moz-user-select: none, -ms-user-select: none }',
            '.room-commands > .act-item { min-width: 1em;}',
            '.content-message { padding-right: 3.5em; }',
            '.dialog-stats > .top-item > .top-sc,',
            '.dialog-stats > .top-item > .top-title,',
        ].join('\n'));

        // 初始化自动售卖/使用拦截
        if (typeof window.__funny2_auto !== 'undefined') {
            window.__funny2_auto.init();
        }
    });

    function AddContent1(content) {
        unsafeWindow.AddMsg(content);
    }

    /********************暴露********************/
    unsafeWindow.funny = {
        role: role,
        follower: __fn.follower,
        title: title,
        room: room,
        exits: exits,
        SendCommand: SendCommand,
        showExtSettings: function () {
            if (typeof window.__funny2_settings !== 'undefined') {
                window.__funny2_settings.showExtSettings();
            }
        },
    };
    unsafeWindow.showExtSettings = function () {
        if (typeof window.__funny2_settings !== 'undefined') {
            window.__funny2_settings.showExtSettings();
        }
    };
    unsafeWindow.Tips = Tips;
})();