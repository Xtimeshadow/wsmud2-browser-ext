// ============================================================
// raid-role.js —— 角色 + 房间 + 状态 + 变量（从 Raid.js 拆分）
// ============================================================

    /***********************************************************************************\
        WSMUD
    \***********************************************************************************/

    // WG/messageAppend/messageClear/TaskHelper/LayerHelper 已在其它模块中声明, 此处不重复声明

    Message.append = function (msg,area) {
        // 【2026-08-11 修复】同步插入：弹窗内容 append 后立即绑定事件（.on('click')），异步批量会错过绑定 → 弹窗按钮失效
        messageAppend(msg,area,null,true);
    };
    Message.clean = function () {
        messageClear();
    };

    const RoleState = {
        none: "发呆",
        liaoshang: "疗伤",
        dazuo: "打坐",
        wakuang: "挖矿",
        gongzuo: "工作",
        lianxi: "练习",
        xuexi: "学习",
        biguan: "闭关",
        lianyao: "炼药",
        lingwu: "领悟",
        dushu: "读书",
        juhun: "聚魂",
        tuiyan: "推演",
        // 【2026-08-09 补全】采药 / 钓鱼（v1.0.0 有，v26.1 缺失）
        caiyao: "采药",
        diaoyu: "钓鱼",
        // 【2026-08-09 新增】双修
        shuangxiu: "双修"
    };

    /**
     * @param {string} itemName
     * @param {Boolean} blurry
     * @param {string} [quality] white(w), green(g), blue(b), yellow(y), purple(p), orange(o), red(r)
     */
    function FindItem(list, itemName, blurry, quality, filterExp) {
        var pattStr = blurry ? itemName : "^" + itemName + "$";
        if (/<[a-zA-Z]{3}>.+<\/[a-zA-Z]{3}>/g.test(itemName)) {
            pattStr = "^" + itemName + "$";
        } else if (quality != null) {
            var map = {
                "white": "wht",
                "w": "wht",
                "green": "hig",
                "g": "hig",
                "blue": "hic",
                "b": "hic",
                "yellow": "hiy",
                "y": "hiy",
                "purple": "HIZ",
                "p": "HIZ",
                "orange": "hio",
                "o": "hio",
                "red": "ord",
                "r": "ord"
            };
            var tag = map[quality];
            if (tag != null) {
                if (blurry) {
                    pattStr = "<" + tag + ">.*" + itemName + ".*</" + tag + ">";
                } else {
                    pattStr = "<" + tag + ">" + itemName + "</" + tag + ">";
                }
            }
        }
        var patt = new RegExp(pattStr);
        for (const item of list) {
            if (patt.test(item.name) && !FilterCenter.filter(filterExp, item)) {
                return item;
            }
        }
        return null;
    }

    var Role = {
        id: null,
        name: null,
        grade: null,
        family: null,
        energy: 0,
        money: 0,

        hp: 0,
        maxHp: 0,
        mp: 0,
        maxMp: 0,

        status: {},
        equipments: {
            eqs: null,
            eq_group: null
        },
        items: {}, // {id: object}
        stores: {}, // {id: object}
        itemDescs: {}, // 【2026-08-09 移植v1.0.0】装备描述缓存 {id: {name, desc, attrs:[{name,value}]}}，供 (:eqHas) 词条判断
        _pendingEqFetch: null, // 词条拉取等待标记（fetch 用）
        _weaponType: '',
        skills: {},
        profitInfo: null,
        kongfu: {
            quan: null,
            nei: null,
            zhao: null,
            qing: null,
            jian: null,
            dao: null,
            gun: null,
            zhang: null,
            bian: null,
            an: null
        },

        init: function () {
            WG.add_hook("login", function (data) {
                Role.id = data.id;
                Role.status = [];
                setTimeout(function () {
                    $("span[command=skills]").click();
                    setTimeout(_ => { $(".glyphicon-remove-circle").click(); }, 500);
                }, 2000); // 查看装备技能
                // if (GM_getValue(`###CodeTranslator@${Role.id}`, null) != "did") {
                //     CodeTranslator.run();
                //     GM_setValue(`###CodeTranslator@${Role.id}`, "did");
                // }
                RaidUI.showToolbar();
                // 【2026-08-08 新增】登录后自动打开"触发"面板（模拟点击 Raid 工具栏的"触发"按钮）
                setTimeout(function () {
                    var $trigger = $(".raid-item.trigger");
                    if ($trigger.length > 0) {
                        $trigger.trigger('click');
                    }
                }, 500);
                // setTimeout(_ => { Server.getNotice(); }, 3000);
            });
            $("li[command=SelectRole]").on("click", function () {
                Role.name = $('.role-list .select').text().split(/\s+/).pop();
                //Role.grade = $('.role-list .select').text().split(/\s+/).slice(-2)[0];
            });
            Role._monitorHpMp();
            Role._monitorStatus();
            Role._monitorState();
            Role._monitorDeath();
            Role._monitorSkillCD();
            Role._monitorSkills();
            Role._monitorGains();
            Role._monitorItems();
            Role._monitorCombat();
            Role._monitorInfo();
            Role._monitorWeapon();
        },

        hasStatus: function (s) {
            var stamp = Role.status[s];
            if (stamp == null) return false;
            if (stamp < new Date().getTime()) return false;
            return true;
        },
        isFree: function () {
            return !Role.hasStatus("busy") && !Role.hasStatus("faint") && !Role.hasStatus("rash");
        },

        gains(from, to) {
            var theGains = Role._gains.slice();
            var start = -1;
            var end = -1;
            for (let i = 0; i < theGains.length; i++) {
                const gain = theGains[i];
                if (gain.timestamp >= from) { start = i; break; }
            }
            for (let j = theGains.length - 1; j >= 0; j--) {
                const gain = theGains[j];
                if (gain.timestamp <= to) { end = j; break; }
            }
            if (start == -1 || end == -1) return [];
            return theGains.slice(start, end + 1);
        },

        state: RoleState.none,

        // 【2026-08-15】发呆计时：统计 (:state)==发呆 且 (:combating)==false 的连续秒数
        // 供 Raid 流程 / 触发器源码通过预设变量 (:idle) / (:idle_time) 使用。
        idleStart: null,          // 本次"发呆且不在战斗"的起始时间戳（ms）；非发呆为 null
        idleTime: 0,              // 缓存：最近一次计算得到的发呆秒数
        isIdle: function () {     // 当前是否处于"发呆且不在战斗"
            return this.idleStart != null;
        },
        getIdleTime: function () { // 当前"发呆且不在战斗"连续秒数（引用时实时计算）
            if (this.idleStart == null) { this.idleTime = 0; return 0; }
            this.idleTime = Math.floor((Date.now() - this.idleStart) / 1000);
            return this.idleTime;
        },
        resetIdleTime: function () { // 开始挂机/手动重置：正发呆则从此刻重新计时
            if (this.idleStart != null) this.idleStart = Date.now();
        },
        _syncIdle: function () {   // state / combating 变化后调用，维护 idleStart
            var idle = this.state === RoleState.none && !this.combating;
            if (idle && this.idleStart == null) this.idleStart = Date.now();
            if (!idle) this.idleStart = null;
        },

        wearing: function (eqId) {
            for (const eq of this.equipments.eqs) {
                if (eq != null && eq.id == eqId) return true;
            }
            return false;
        },

        getEqId: function (index) {
            const eq = this.equipments.eqs[index];
            if (eq == null) return null;
            return eq.id;
        },

        living: true,

        combating: false,

        rtime: false,


        atPath: function (p) {
            switch (arguments.length) {
                case 0:
                    return Room.path;
                case 1:
                    return p == Room.path;
            }
        },
        inRoom: function (n) {
            switch (arguments.length) {
                case 0:
                    return Room.name;
                case 1:
                    return n == Room.name;
            }
        },

        findItem: function (itemName, blurry, quality, filterExp) {
            return FindItem(Object.values(Role.items), itemName, blurry, quality, filterExp);
        },

        renew: function (callback) {
            const source = `
            stopstate;$to 扬州城-武庙
            @liaoshang
            [if] (:mpPer)<0.8
                @dazuo
                stopstate
            `;
            const p = new Performer("", source);
            p.start(callback);
        },

        cleanBag: function (callback) {
            WG.Send("sell all");
        },

        tidyBag: function (callback) {
            WG.Send("sell all;store all");
        },

        hasCoolingSkill: function () {
            return Role._coolingSkills.length > 0;
        },
        coolingSkills: function () {
            var result = [];
            for (const mark of Role._coolingSkills) {
                result.push(mark.split("_")[0]);
            }
            return result;
        },
        coolingSkill: function (skill) {
            return this.coolingSkills().indexOf(skill) != -1
        },
        hasSkill: function (skill) {
            var combatStr = $('.combat-commands').html()
            if (combatStr.indexOf(skill) != -1) {
                return true;
            } else {
                return false;
            }
        },
        weapon: function () {
            return Role._weaponType
        },

        _renewHookIndex: null,
        _renewStatus: "resting",

        _coolingSkills: [],
        _gains: [], // [{timestamp: number, name: string, count: number, unit: string}]

        _monitorHpMp: function () {
            WG.add_hook(["items", "sc", "itemadd"], function (data) {
                switch (data.type) {
                    case "items":
                        if (data.items == null) break;
                        for (var i = data.items.length - 1; i >= 0; i--) {
                            var item = data.items[i];
                            if (item.id == Role.id) {
                                Role.hp = item.hp;
                                Role.maxHp = item.max_hp;
                                Role.mp = item.mp;
                                Role.maxMp = item.max_mp;
                                break;
                            }
                        }
                        break;
                    case "itemadd":
                    case "sc":
                        if (data.id != Role.id) break;
                        if (data.hp != null) Role.hp = data.hp;
                        if (data.max_hp != null) Role.maxHp = data.max_hp;
                        if (data.mp != null) Role.mp = data.mp;
                        if (data.max_mp != null) Role.maxMp = data.max_mp;
                        break;
                }
            });
        },
        _monitorStatus: function () {
            WG.add_hook(["items", "status", "itemadd"], function (data) {
                switch (data.type) {
                    case "items":
                        if (data.items == null) break;
                        for (var i = data.items.length - 1; i >= 0; i--) {
                            var item = data.items[i];
                            if (item.id != Role.id) continue;
                            if (item.status == null) break;
                            Role.status = {};
                            var timestamp = new Date().getTime();
                            for (var j = item.status.length - 1; j >= 0; j--) {
                                var s = item.status[j];
                                Role.status[s.sid] = timestamp + s.duration - s.overtime;
                            }
                            break;
                        }
                        break;
                    case "status":
                        if (data.id != Role.id) break;
                        var timestamp1 = new Date().getTime();
                        if (data.action == "add") {
                            Role.status[data.sid] = timestamp1 + data.duration;
                        } else if (data.action == "remove") {
                            delete Role.status[data.sid];
                        }
                        break;
                    case "itemadd":
                        if (data.id != Role.id) break;
                        if (data.status == null) break;
                        Role.status = {};
                        var timestamp2 = new Date().getTime();
                        for (var k = data.status.length - 1; k >= 0; k--) {
                            var s1 = data.status[k];
                            Role.status[s1.sid] = timestamp2 + s1.duration - s1.overtime;
                        }
                        break;
                }
            });
        },
        _monitorState: function () {
            WG.add_hook("state", function (data) {
                var text = data.state;
                if (text == null) {
                    Role.state = RoleState.none;
                    Role._syncIdle();
                    return;
                }
                for (const key in RoleState) {
                    if (!RoleState.hasOwnProperty(key)) continue;
                    const keyword = RoleState[key];
                    if (text.indexOf(keyword) != -1) {
                        Role.state = keyword;
                        Role._syncIdle();
                        return;
                    }
                }
                Role.state = RoleState.none;
                Role._syncIdle();
            });
        },
        _monitorDeath: function () {
            WG.add_hook("die", function (data) {
                if (data.relive == true) {
                    Role.living = true;
                } else {
                    Role.living = false;
                }
            });
        },
        _monitorInfo: function () {
            WG.add_hook("dialog", function (data) {
                if (data.dialog == "score" && data.id == Role.id) {
                    if (data.level != null) {
                        var dd = data.level.replace(/<\/?.+?>/g, "");
                        Role.grade = dd.replace(/ /g, "");
                    }
                    if (data.family != null) {
                        Role.family = data.family;
                    }
                    if (data.jingli != null) {
                        var dd = data.jingli.split("/");
                        Role.energy = dd[0];
                    }
                    if (data.pot != null) {
                        Role.pot = data.pot
                    }
                }
            });
        },
        _monitorItems: function () {
            WG.add_hook("dialog", function (data) {
                if (data.dialog == null) return;
                if (data.dialog == "pack") {
                    // 【2026-08-09 移植v1.0.0】checkobj 返回的装备描述 → 解析词条存 itemDescs，供 (:eqHas) 使用
                    if (data.from == "item" || data.from == "eq") {
                        if (data.id != null && data.desc != null) {
                            if (Role._pendingEqFetch === data.id) {
                                Role._pendingEqFetch = "done";
                            }
                            var descText = data.desc.replace(/<[^>]+>/g, "");
                            var itemName = descText.split("\n")[0].trim();
                            var attrs = [];
                            var lines = descText.split("\n");
                            for (var li = 0; li < lines.length; li++) {
                                var line = lines[li].trim();
                                if (!line) continue;
                                var m = line.match(/^(.+?)\s*[+×\-]\s*(.+)$/);
                                if (m) {
                                    var sign = line.match(/[+×\-]/);
                                    var val = m[2].trim();
                                    if (sign && sign[0] == "-") val = "-" + val;
                                    attrs.push({ name: m[1].trim(), value: val });
                                }
                            }
                            Role.itemDescs[data.id] = { name: itemName, desc: descText, attrs: attrs, rawDesc: data.desc };
                            var _ids = Object.keys(Role.itemDescs);
                            if (_ids.length > 200) {
                                for (var _i = 0; _i < _ids.length - 200; _i++) delete Role.itemDescs[_ids[_i]];
                            }
                        }
                    }
                    if (data.items != null) {
                        Role.items = {};
                        data = WG.smartClone(data);
                        data = WG.deserializePackData(data);
                        for (const item of data.items) {
                            if (item.id) Role.items[item.id] = item;
                        }
                    } else if (data.id != null) {
                        if (data.remove == null && data.count != null) {
                            Role.items[data.id] = data;
                            return;
                        } else if (data.remove != null) {
                            var item = Role.items[data.id];
                            if (item == null) return; // 从随从那里那回东西
                            if (item.count != null) {
                                item.count -= data.remove;
                            } else {
                                item.count = 0;
                            }
                            if (item.count == 0) delete Role.items[data.id];
                        }
                    }
                    if (data.eqs != null) {
                        Role.equipments.eqs = CopyObject(data.eqs);
                        Role.equipments.eq_group = data.eq_group;
                    } else if (data.uneq != null && data.id != null) {
                        let item = Role.equipments.eqs[data.uneq];
                        item.count = 1;
                        item.id = data.id;
                        Role.items[item.id] = item;
                        Role.equipments.eqs[data.uneq] = null;
                    } else if (data.eq != null && data.id != null) {
                        let item = Role.items[data.id];
                        Role.equipments.eqs[data.eq] = item;
                        delete Role.items[data.id];
                    }
                    if (data.money != null) {
                        Role.money = data.money;
                    }
                }
                if (data.dialog == "list") {
                    if (data.stores != null) {
                        Role.stores = {};
                        data = WG.smartClone(data);
                        data = WG.deserializePackData(data);
                        for (const item of data.stores) {
                            if (item.id) Role.stores[item.id] = item;
                        }
                    } else if (data.id != null && data.storeid != null && data.store != null) {
                        var item = Role.items[data.id];
                        var store = Role.stores[data.storeid];
                        if (item == null) {
                            item = Object.assign({}, store, { count: 0 });
                            item.id = data.id;
                            Role.items[item.id] = item;
                        }
                        if (store == null) {
                            store = Object.assign({}, item, { count: 0 });
                            Role.stores[store.id] = store;
                        }
                        item.count -= data.store;
                        store.count += data.store;
                        if (item.count <= 0) delete Role.items[data.id];
                        if (store.count <= 0) delete Role.stores[data.storeid];
                    }
                }
            });
        },
        _monitorGains: function () {
            WG.add_hook("dialog", function (data) {
                if (data.dialog != "pack" || data.id == null || data.name == null || data.unit == null || data.count == null || data.remove != null) return;
                var timestamp = new Date().getTime();
                // [{timestamp: number, name: string, count: number, unit: string}]
                var old = Role.items[data.id];
                var count = data.count;
                if (old != null && old.count != null) {
                    count -= old.count;
                }
                var gain = { timestamp: timestamp, name: data.name, count: count, unit: data.unit };
                Role._gains.push(gain);
            });
        },
        _monitorSkillCD: function () {
            WG.add_hook("dispfm", function (data) {
                var timestamp = Date.parse(new Date());
                var mark = data.id + "_" + timestamp;
                Role._coolingSkills.push(mark);
                window.setTimeout(function () {
                    var index = Role._coolingSkills.indexOf(mark);
                    if (index != -1) Role._coolingSkills.splice(index, 1);
                }, data.distime);
                if (data.rtime != null && data.rtime != 0) {
                    if (Role._rtimer != null) clearTimeout(Role._rtimer);
                    Role.rtime = true;
                    Role._rtimer = setTimeout(_ => {
                        Role.rtime = false;
                    }, data.rtime);
                }
            });
        },
        _monitorSkills: function () {
            var action = function (id, value, s_name) {
                switch (id) {
                    case "unarmed":
                        Role.kongfu.quan = value; Role.kongfu.quan_c = s_name; break;
                    case "force":
                        Role.kongfu.nei = value; Role.kongfu.nei_c = s_name; break;
                    case "parry":
                        Role.kongfu.zhao = value; Role.kongfu.zhao_c = s_name; break;
                    case "dodge":
                        Role.kongfu.qing = value; Role.kongfu.qing_c = s_name; break;
                    case "sword":
                        Role.kongfu.jian = value; Role.kongfu.jian_c = s_name; break;
                    case "blade":
                        Role.kongfu.dao = value; Role.kongfu.dao_c = s_name; break;
                    case "club":
                        Role.kongfu.gun = value; Role.kongfu.gun_c = s_name; break;
                    case "staff":
                        Role.kongfu.zhang = value; Role.kongfu.zhang_c = s_name; break;
                    case "whip":
                        Role.kongfu.bian = value; Role.kongfu.bian_c = s_name; break;
                    case "throwing":
                        Role.kongfu.an = value; Role.kongfu.an_c = s_name; break;
                    default:
                        break;
                }
            };
            WG.add_hook("dialog", function (data) {
                if (data.dialog == null || data.dialog != "skills") return;
                if (data.items != null) {
                    for (const item of data.items) {
                        var value = item.enable_skill ? item.enable_skill : null;
                        var s_name = "";
                        Role.skills = data.items;
                        for (const sklii_item of data.items) {
                            if (sklii_item.id == value) {
                                var mName = /<([^<>]*)>/.exec(sklii_item.name);
                                s_name = mName ? mName[1] : sklii_item.name;
                            }
                        }
                        action(item.id, value, s_name ? s_name.toLocaleLowerCase() : '');
                    }
                }
                if (data.id != null && data.enable != null) {
                    var value = data.enable;
                    if (value == false) value = "none";
                    var s_name = ""
                    for (const sklii_item of Role.skills) {
                        if (sklii_item.id == value) {
                            var mName2 = /<([^<>]*)>/.exec(sklii_item.name);
                            s_name = mName2 ? mName2[1] : sklii_item.name;
                        }
                    }
                    action(data.id, value, s_name ? s_name.toLocaleLowerCase() : '');
                }
            });
        },
        _monitorCombat: function () {
            WG.add_hook("combat", function (data) {
                if (data.start != null && data.start == 1) {
                    Role.combating = true;
                    Role._syncIdle();
                } else if (data.end != null && data.end == 1) {
                    Role.combating = false;
                    Role._syncIdle();
                }
            });
            WG.add_hook("text", function (data) {
                if (data.msg == null) return;
                if (data.msg.indexOf('只能在战斗中使用') != -1 || data.msg.indexOf('这里不允许战斗') != -1 || data.msg.indexOf('没时间这么做') != -1) {
                    Role.combating = false;
                    Role._syncIdle();
                }
                if (data.msg.indexOf('战斗中打坐，你找死吗？') != -1 || data.msg.indexOf('你正在战斗') != -1) {
                    Role.combating = true;
                    Role._syncIdle();
                }
            });

        },
        _monitorWeapon: function () {
            WG.add_hook("perform", function (data) {
                if (data.skills != null) {
                    if (JSON.stringify(data.skills).indexOf("sword") != -1) {
                        Role._weaponType = 'sword'
                    } else if (JSON.stringify(data.skills).indexOf("blade") != -1) {
                        Role._weaponType = 'blade'
                    } else {
                        Role._weaponType = ''
                    }
                }

            });

        }
    };

    var Room = {
        name: null,
        path: null,

        updateTimestamp: null,

        init: function () {
            this._monitorLocation();
            this._monitorItemsInRoom();
            this._monitorDeath();
        },
        getItem: function (id) {
            return this._itemsInRoom[id];
        },
        getItemId: function (name, blurry, living, filterExp) {
            for (const item of Object.values(this._itemsInRoom)) {
                if (blurry == true) {
                    if (item.name.indexOf(name) != -1) {
                        if (living == true && item.name.indexOf("的尸体") != -1) {
                            continue;
                        }
                        if (FilterCenter.filter(filterExp, item)) {
                            continue;
                        }
                        return item.id;
                    }
                } else {
                    if (item.name == name && !FilterCenter.filter(filterExp, item)) {
                        return item.id;
                    }
                }
            }
            return null;
        },
        /**
         * @param {{name: string, blurry: Boolean}[]} itemNameInfos
         * @returns {Boolean}
         */
        didKillItemsInRoom: function (itemNameInfos) {
            var deadItems = this._deadItemsInRoom.slice();
            for (const info of itemNameInfos) {
                var found = false;
                for (let j = 0; j < deadItems.length; j++) {
                    const deadItem = deadItems[j];
                    if (info.blurry == true) {
                        if (deadItem.name.indexOf(info.name) != -1) found = true;
                    } else {
                        if (deadItem.name == info.name) found = true;
                    }
                    if (found) {
                        deadItems.splice(j, 1);
                        break;
                    }
                }
                if (!found) return false;
            }
            return true;
        },

        _itemsInRoom: {},
        _deadItemsInRoom: [],

        _monitorLocation: function () {
            WG.add_hook("room", function (data) {
                Room.name = data.name;
                Room.path = data.path;
                Room.updateTimestamp = new Date().getTime();
                Room._itemsInRoom = {};
                Room._deadItemsInRoom = [];
            });
        },

        _monitorItemsInRoom: function () {
            WG.add_hook(["items", "itemadd", "itemremove", "sc", "status"], function (data) {
                switch (data.type) {
                    case "items":
                        if (data.items == null) break;
                        for (const item of data.items) {
                            if (item.name == null || item.id == null) continue;
                            Room._itemsInRoom[item.id] = item;
                        }
                        break;
                    case "itemadd":
                        if (data.name == null || data.id == null) break;
                        Room._itemsInRoom[data.id] = data;
                        break;
                    case "itemremove":
                        if (data.id == null) break;
                        delete Room._itemsInRoom[data.id];
                        break;
                    case "sc": {
                        if (data.id == null) break;
                        const item = Room._itemsInRoom[data.id];
                        if (item == null) break;
                        if (data.hp != null) item.hp = data.hp;
                        if (data.max_hp != null) item.max_hp = data.max_hp;
                        if (data.mp != null) item.mp = data.mp;
                        if (data.max_mp != null) item.max_mp = data.max_mp;
                        break;
                    }
                    // 此处与原生插件冲突，去除后不影响功能
                    // case "status": {
                    //     if (data.action == null || data.id == null || data.sid == null) return;
                    //     const item = Room._itemsInRoom[data.id];
                    //     if (item == null) break;
                    //     if (data.action == "add") {
                    //         if (item.status == null) item.status = [];
                    //         item.status.push({ sid: data.sid, name: data.name, duration: data.duration, overtime: 0 });
                    //     } else if (data.action == "remove") {
                    //         for (let i = 0; i < item.status.length; i++) {
                    //             const s = item.status[i];
                    //             if (s.sid == data.sid) {
                    //                 item.status.splice(i, 1);
                    //                 break;
                    //             }
                    //         }
                    //     }
                    //     break;
                    // }
                }
            });
        },
        _monitorDeath: function () {
            WG.add_hook("sc", function (data) {
                if (data.id == null || data.hp == null || data.hp != 0) return;
                for (const item of Object.values(Room._itemsInRoom)) {
                    if (item.id == data.id) {
                        Room._deadItemsInRoom.push(item);
                        return;
                    }
                }
            });
        }
    };

    class SystemTip {
        constructor(text) {
            this.timestamp = new Date().getTime();
            this.text = text;
        }
    }

    var SystemTips = {
        init: function () {
            this._monitorSystemTips();
        },
        search: function (regex, from) {
            var patt = new RegExp(regex);
            var tips = this._tips.slice();
            for (let index = tips.length - 1; index >= 0; index--) {
                const tip = tips[index];
                if (tip.timestamp < from) break;
                var result = patt.exec(tip.text);
                if (result) return result;
            }
            return null;
        },
        clean: function (to) {
            while (true) {
                if (this._tips.length <= 0) break;
                var tip = this._tips[0];
                if (tip.timestamp > to) break;
                this._tips.shift();
            }
        },
        rejectTimestamp: null,

        _monitorSystemTips: function () {
            var theSelf = this;
            WG.add_hook("text", function (data) {
                var tip = new SystemTip(data.msg);
                theSelf._push(tip);

                if (data.msg == "不要急，慢慢来。") {
                    theSelf.rejectTimestamp = new Date().getTime();
                }
            });
            WG.add_hook("item", function (data) {
                var desc = data.desc;
                if (desc == null) return;
                var tip = new SystemTip(desc);
                theSelf._push(tip);
            });
        },
        _push: function (tip) {
            if (this._tips.length >= this._maxCapacity) {
                this._tips.shift();
            }
            this._tips.push(tip);
        },
        _tips: [],
        _maxCapacity: 100,
    };
    class MsgTip {
        constructor(content, ch, name, uid) {
            this.timestamp = new Date().getTime();
            this.content = content;
            this.ch = ch;
            this.name = name;
            this.uid = uid;
        }
    }

    var MsgTips = {
        init: function () {
            this._monitorSystemTips();
        },
        search: function (regex, from) {
            var patt = new RegExp(regex);
            var tips = this._tips.slice();
            for (let index = tips.length - 1; index >= 0; index--) {
                const tip = tips[index];
                if (tip.timestamp < from) break;
                var result = patt.exec(tip.content);
                if (result) return result;
            }
            return null;
        },
        clean: function (to) {
            while (true) {
                if (this._tips.length <= 0) break;
                var tip = this._tips[0];
                if (tip.timestamp > to) break;
                this._tips.shift();
            }
        },
        rejectTimestamp: null,

        _monitorSystemTips: function () {
            var theSelf = this;
            WG.add_hook("msg", function (data) {
                // console.log(data)
                var tip = new MsgTip(data.content, data.ch, data.name, data.uid);
                theSelf._push(tip);
            });
        },
        _push: function (tip) {
            if (this._tips.length >= this._maxCapacity) {
                this._tips.shift();
            }
            this._tips.push(tip);
        },
        _tips: [],
        _maxCapacity: 100,
    };

    var DialogList = {
        init: function () {
            this._monitorDialogList();
        },
        timestamp: null,
        findItem: function (itemName, blurry, quality, filterExp) {
            return FindItem(this._list, itemName, blurry, quality, filterExp);
        },

        _list: [],
        _monitorDialogList: function () {
            const self = this;
            WG.add_hook("dialog", function (data) {
                let list = null;
                if (data.selllist != null) {
                    data = WG.smartClone(data);
                    if (data.dialog == "shop") {
                        data.selllist = data.selllist[0];
                    }
                    data = WG.deserializePackData(data);
                    list = data.selllist;
                    } else if (data.stores != null) {
                    data = WG.smartClone(data);
                    data = WG.deserializePackData(data);
                    list = data.stores;
                    } else if (data.dialog == "pack2" && data.items != null) {
                    data = WG.smartClone(data);
                    data = WG.deserializePackData(data);
                    list = data.items;
                }
                if (list == null) return;
                self.timestamp = new Date().getTime();
                self._list = list;
            });
        },
    };

    var TaskList = {
        init: function () {
            this._monitorTasksList();
        },
        search: function (regex, from) {
            if (this._timestamp < from) return null;
            var patt = new RegExp(regex);
            for (const task of this._list) {
                const result = patt.exec(task);
                if (result) return result;
            }
            return null;
        },

        _timestamp: null,
        _list: [],
        _monitorTasksList: function () {
            const self = this;
            WG.add_hook("dialog", function (data) {
                if (data.dialog == null || data.dialog != "tasks" || data.items == null) return;
                let list = [];
                for (const item of data.items) {
                    list.push(item.desc);
                }
                self._timestamp = new Date().getTime();
                self._list = list;
            });
        }
    };
    var EventList = {
        init: function () {
            this._monitorEventsList();
        },
        search: function (regex, from) {
            if (this._timestamp < from) return null;
            var patt = new RegExp(regex);
            for (const eventText of this._list) {
                const result = patt.exec(eventText);
                if (result) return result;
            }
            return null;
        },
        _timestamp: null,
        _list: [],
        _monitorEventsList: function () {
            const self = this;
            WG.add_hook("dialog", function (data) {
                if (data.dialog == null || data.dialog != "events" || data.items == null) return;
                let list = [];
                for (const item of data.items) {
                    if (item.length > 2) {
                        const searchableText = item[1] + " " + item[2];
                        list.push(searchableText);
                    }
                }
                self._timestamp = new Date().getTime();
                self._list = list;
            });
        }
    };
    var Xiangyang = {
        init: function () {
            this._monitorXiangyang();
        },
        search: function (regex, from) {
            if (this._timestamp < from) return null;
            var patt = new RegExp(regex);
            const result = patt.exec(this._desc);
            if (result) return result;
            return null;
        },

        _timestamp: null,
        _desc: '',
        _monitorXiangyang: function () {
            const self = this;
            WG.add_hook('dialog', function (data) {
                if (data.dialog == null || data.t != 'fam' || data.index != 8 || data.desc == null) return;
                self._timestamp = new Date().getTime();
                self._desc = data.desc;
            });
        }
    };

    /***********************************************************************************\
        Persistent Cache
    \***********************************************************************************/

    (function () {
        const FlowStoreKey = function () { return `flow_store@${Role.id}`; };
        const getMap = function () {
            let map = GM_getValue(FlowStoreKey(), null);
            if (map == null) {
                // 之前 FlowStoreKey 会错误地一只返回 flow_store@null
                map = GM_getValue("flow_store@null", {});
            }
            return map;
        };
        FlowStore = new PersistentCache((key, value) => {
            let map = getMap();
            map[key] = value;
            GM_setValue(FlowStoreKey(), map);
        }, _ => {
            return getMap();
        }, key => {
            let map = getMap();
            delete map[key];
            GM_setValue(FlowStoreKey(), map);
        });
        FlowStore.corver = function (value) {
            GM_setValue(FlowStoreKey(), value);
        };
    })();

    (function () {
        const PersistentVariablesKey = function () { return `global_params@${Role.id}`; };
        const getMap = function () {
            let map = GM_getValue(PersistentVariablesKey(), null);
            if (map == null) {
                // 之前 PersistentVariablesKey 会错误地一只返回 global_params@null
                map = GM_getValue("global_params@null", {});
            }
            return map;
        };
        PersistentVariables = new PersistentCache((key, value) => {
            let map = getMap();
            map[key] = value;
            GM_setValue(PersistentVariablesKey(), map);
        }, _ => {
            return getMap();
        }, key => {
            let map = getMap();
            delete map[key];
            GM_setValue(PersistentVariablesKey(), map);
        });
        VariableStore.register(_ => { return PersistentVariables.getAll(); });
    })();

    VariableStore.register(_ => {
        var vars = {
            ":online": WG.online,
            ":id": Role.id,
            ":name": Role.name,
            ":grade": Role.grade,
            ":family": Role.family,
            ":energy": Role.energy,
            ":pot": Role.pot,
            ":money": Role.money,
            ":hp": Role.hp,
            ":maxHp": Role.maxHp,
            ":hpPer": Role.hp / Role.maxHp,    // 0-1
            ":mp": Role.mp,
            ":maxMp": Role.maxMp,
            ":mpPer": Role.mp / Role.maxMp,    // 0-1
            ":living": Role.living,          // true/false
            ":state": Role.state,            // RoleState
            ":combating": Role.combating,    // true/false
            ":idle": Role.isIdle(),          // 【2026-08-15】是否"发呆且不在战斗"
            ":idle_time": Role.getIdleTime(),// 【2026-08-15】"发呆且不在战斗"连续秒数
            ":free": Role.isFree,
            ":gains": Role.profitInfo,

            ":room": Room.name,
            ":path": Room.path,

            ":eq0": Role.getEqId(0),
            ":eq1": Role.getEqId(1),
            ":eq2": Role.getEqId(2),
            ":eq3": Role.getEqId(3),
            ":eq4": Role.getEqId(4),
            ":eq5": Role.getEqId(5),
            ":eq6": Role.getEqId(6),
            ":eq7": Role.getEqId(7),
            ":eq8": Role.getEqId(8),
            ":eq9": Role.getEqId(9),
            ":eq10": Role.getEqId(10),

            ":kf_quan": Role.kongfu.quan,
            ":kf_nei": Role.kongfu.nei,
            ":kf_zhao": Role.kongfu.zhao,
            ":kf_qing": Role.kongfu.qing,
            ":kf_jian": Role.kongfu.jian,
            ":kf_dao": Role.kongfu.dao,
            ":kf_gun": Role.kongfu.gun,
            ":kf_zhang": Role.kongfu.zhang,
            ":kf_bian": Role.kongfu.bian,
            ":kf_an": Role.kongfu.an,

            ":kf_quan_c": Role.kongfu.quan_c,
            ":kf_nei_c": Role.kongfu.nei_c,
            ":kf_zhao_c": Role.kongfu.zhao_c,
            ":kf_qing_c": Role.kongfu.qing_c,
            ":kf_jian_c": Role.kongfu.jian_c,
            ":kf_dao_c": Role.kongfu.dao_c,
            ":kf_gun_c": Role.kongfu.gun_c,
            ":kf_zhang_c": Role.kongfu.zhang_c,
            ":kf_bian_c": Role.kongfu.bian_c,
            ":kf_an_c": Role.kongfu.an_c
        };
        // 【2026-08-09 移植v1.0.0】槽位装备名 :eqName0~:eqName10（去颜色标签/星级，取名字末段）
        for (var eqi = 0; eqi <= 10; eqi++) {
            var eqiObj = (Role.equipments && Role.equipments.eqs) ? Role.equipments.eqs[eqi] : null;
            vars[":eqName" + eqi] = eqiObj ? String(eqiObj.name).replace(/<.+?>|&lt.*/g, "").replace(/^[★☆]+/, "").split(" ").pop() : null;
        }
        return vars;
    });

    VariableStore.register(_ => {
        return {
            ":room ": function (param) {
                const parts = param.split(",");
                for (const part of parts) {
                    if (Room.name.indexOf(part) != -1) return true;
                }
                return false;
            },
            ":cd ": function (sid) {
                return Role.coolingSkill(sid);
            },
            ":status ": function (param) {
                const parts = param.split(",");
                console.log(parts)
                if (parts.length > 1) {
                    const status = parts[0];
                    const id = parts[1];
                    const item = Room.getItem(id);
                    if (item == null || item.status == null) return false;
                    for (const s of item.status) {
                        if (s.sid == status) return true;
                    }
                    return false;
                }
                return Role.hasStatus(param);
            },
            ":pack ": function (param) {
                const parts = param.split(",");
                if (parts.length <= 1) return;
                const id = parts[0];
                const attr = parts[1];
                console.log(id,attr)
                for (const key in Role.items) {
                    if (key == id) {
                        if (!Role.items[key].hasOwnProperty(attr)) return;
                        const value = Role.items[key][attr];
                        return value;
                    }
                }
            },
            ":hp ": function (id) {
                const item = Room.getItem(id);
                if (item != null) return item.hp;
                return -1;
            },
            ":hpPer ": function (id) {
                const item = Room.getItem(id);
                if (item != null) return item.hp/item.max_hp;
                return -1;
            },
            ":weapon ": function (id) {
                return id == Role.weapon()
            },
            ":maxHp ": function (id) {
                const item = Room.getItem(id);
                if (item != null) return item.max_hp;
                return -1;
            },
            ":mp ": function (id) {
                const item = Room.getItem(id);
                if (item != null) return item.mp;
                return -1;
            },
            ":mpPer ": function (id) {
                const item = Room.getItem(id);
                if (item != null) return item.mp/item.max_mp;
                return -1;
            },
            ":maxMp ": function (id) {
                const item = Room.getItem(id);
                if (item != null) return item.max_mp;
                return -1;
            },
            ":exist ": function (id) {
                if (id == null) return false;
                const item = Room.getItem(id);
                return item != null;
            },
            ":findName ": function (id) {
                if (id == null) return null;
                const item = Room.getItem(id);
                //if (item != null) return item.name.match(/.*\s([\u4e00-\u9fa5]+)/)[1];
                if (item != null) return item.name.replace(/<.+?>|&lt.*/g, '').split(' ').pop();
                //if (item != null) return item.name.replace(/<.+?>|&lt.*/g, '').match(/(\p{Script=Han}\s)*(\p{Script=Han}*)/u)[2]
                //if (item != null) return item.name.match(/(\p{Script=Han}\s)*(\p{Script=Han}*)/u)[2];
                return null;
            },
            ":eqHas ": function (param) {
                // 【2026-08-09 移植v1.0.0】判断装备是否有指定词条。用法：(:eqHas 装备ID,词条名)
                // 词条名支持"攻击"、"攻击%"（区分是否百分比词条），名称尾部冒号自动忽略
                var parts = param.split(",");
                if (parts.length <= 1) return false;
                var id = (parts || ["", "", "", ""])[0].trim();
                var q = (parts || ["", "", "", ""])[1].trim().replace(/：$/, "");
                var queryPct = q.charAt(q.length - 1) === "%";
                var qBase = queryPct ? q.slice(0, -1) : q;
                var desc = Role.itemDescs[id];
                if (desc == null || !desc.attrs) return false;
                for (var i = 0; i < desc.attrs.length; i++) {
                    var a = desc.attrs[i];
                    if (!a || !a.name) continue;
                    if (a.name.indexOf("◆") >= 0) continue;
                    var name = a.name.replace(/：$/, "");
                    var v = a.value == null ? "" : String(a.value);
                    var attrPct = v.indexOf("%") >= 0;
                    var aBase = name.replace(/%$/, "");
                    if (aBase === qBase && attrPct === queryPct) return true;
                }
                return false;
            },
            ":eqFind ": function (param) {
                // 【2026-08-19 优化】按名字查找物品ID，排除非 grade5/6 的装备
                if (param == null) return null;
                var name = String(param).trim();
                if (name == '') return null;
                // ① 背包 - 只查 grade5/6
                for (var key in Role.items) {
                    var item = Role.items[key];
                    if (item.grade == null || item.grade < 5) continue;
                    var itemName = item.name.replace(/<[^>]+>/g, "").trim();
                    if (itemName.indexOf(name) >= 0) {
                        return key;
                    }
                }
                // ② 身上装备 - 只查 grade5/6
                if (Role.equipments && Role.equipments.eqs) {
                    for (var i = 0; i < Role.equipments.eqs.length; i++) {
                        var eq = Role.equipments.eqs[i];
                        if (eq && eq.name) {
                            if (eq.grade == null || eq.grade < 5) continue;
                            var eqName = eq.name.replace(/<[^>]+>/g, "").trim();
                            if (eqName.indexOf(name) >= 0) {
                                return eq.id;
                            }
                        }
                    }
                }
                // ③ 描述缓存（itemDescs，无 grade 信息，保留原始逻辑）
                for (var descId in Role.itemDescs) {
                    if (Role.itemDescs[descId].name.indexOf(name) >= 0) {
                        return descId;
                    }
                }
                return null;
            },
            ":eqOn ": function (param) {
                // 【2026-08-09 移植v1.0.0】判断某装备ID是否正装备在身上（true/false）
                if (param == null) return false;
                var id = String(param).trim();
                if (!Role.equipments || !Role.equipments.eqs) return false;
                for (var i = 0; i < Role.equipments.eqs.length; i++) {
                    var eq = Role.equipments.eqs[i];
                    if (eq && eq.id == id) return true;
                }
                return false;
            }
        };
    });