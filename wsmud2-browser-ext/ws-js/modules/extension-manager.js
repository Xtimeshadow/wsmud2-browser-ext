// ============================================================
// extension-manager.js —— 扩展脚本引擎 + 方向映射
// ------------------------------------------------------------
//   SCRIPT        扩展脚本引擎：支持 #wait（等待）/ #msg（发消息）/
//                 #action（执行动作）/ #pfm（出招）/ @me/@npc/@item（目标占位符）
//                 等模板命令，用来写简单的"扩展脚本"
//   MAP_DIR_EXITS 方向映射表
// ------------------------------------------------------------
//   Setting 已拆分至 wg-setting.js
//   Confirm 已拆分至 wg-confirm.js
// ============================================================
const SCRIPT = {
    'is_running': false,
    'run': async function(_t1162) {
        this.is_running = true;
        try {
            let _t1164 = _t1162.split(';');
            for (let _t1165 of _t1164) {
                await this.run_one(_t1165);
            }
        } catch (_t1166) {
            console.log("扩展执行失败：", _t1166);
        }
        this.is_running = false;
    },
    'var_reg': /^@(\w+)(?:\(([^)]*)\))?$/,
    'run_one': async function(_t1167) {
        let _t1169 = _t1167.split('\x20')
          , _t1170 = _t1169[0]
          , _fn10 = this.actions.def;
        if (_t1170[0] === '#') {
            _t1170 = _t1170.substring(1);
            _fn10 = this.actions[_t1170] ?? this.actions.def;
        }
        let _a98 = [[]]
          , _t1171 = null;
        for (let _n140 = 1; _n140 < _t1169.length; _n140++) {
            if (!_a98.length)
                break;
            _t1171 = _t1169[_n140];
            _t1171[0] === '@' ? await this.push_paras(_a98, _t1171) : _a98.map(_t1172 => _t1172.push(_t1171));
        }
        for (let _t1173 of _a98) {
            await _fn10(_t1173, _t1170);
        }
    },
    'push_paras': async function(_t1174, _t1175) {
        const _t1177 = _t1175.match(this.var_reg);
        if (!_t1177)
            throw new Error("<cyn>错误的参数格式" + _t1175 + "</cyn>");
        const _t1178 = _t1177[1]
          , _t1179 = _t1177[2] ? _t1177[2].split(',').map(_t1180 => _t1180.trim()) : [];
        let _fn11 = this.vars[_t1178];
        if (!_fn11)
            throw new Error('<cyn>无效参数' + _t1175 + "</cyn>");
        let _t1181 = await _fn11(..._t1179);
        if (!_t1181)
            return _t1174.length = 0;
        if (!Array.isArray(_t1181))
            return _t1174.map(_t1182 => _t1182.push(_t1181));
        if (!_t1181.length)
            return _t1174.length = 0;
        let _t1183 = _t1174.length;
        for (let _n141 = 1; _n141 < _t1181.length; _n141++) {
            for (let _n142 = 0; _n142 < _t1183; _n142++) {
                _t1174.push([..._t1174[_n142], _t1181[_n141]]);
            }
        }
        for (let _n143 = 0; _n143 < _t1183; _n143++) {
            _t1174[_n143].push(_t1181[0]);
        }
    },
    'actions': {
        'def': function(_t1184, _t1185) {
            if (_t1184.length)
                SendCommand(_t1185 + '\x20' + _t1184.join('\x20'));
            else
                SendCommand(_t1185);
        },
        'wait': function(_t1187) {
            return Util.Sleep(parseInt(_t1187[0]));
        },
        'action': async function(_t1189) {
            let _n144 = parseInt(_t1189[0]);
            if (!(_n144 >= 0 && _n144 < 10))
                return;
            let _J86 = $(".room-commands").children().eq(_n144).attr('cmd');
            if (_J86)
                SCRIPT.run(_J86);
        },
        'pfm': function(_t1191) {
            let _n145 = parseInt(_t1191[0]);
            if (!(_n145 >= 0 && _n145 < 12))
                return SendCommand("perform " + _t1191[0]);
            let _J87 = $(".combat-commands").children().eq(_n145).attr('pid');
            if (_J87)
                SCRIPT.run("perform " + _J87);
        },
        'menu': function(_t1193) {
            let _t1194 = _t1193[0];
            if (_t1194)
                HandlerMenuCommand(_t1194);
        },
        'msg': function(_t1195) {
            _t1195.length > 0 && ReceiveMessage(_t1195.join(''));
        }
    },
    'vars': {
        'me': function() {
            return Process.player;
        },
        'dir': function(_t1198) {
            let _t1200 = MAP_DIR_EXITS[_t1198];
            if (!_t1200)
                return;
            for (let _t1201 of _t1200) {
                if (Process.room_exits[_t1201])
                    return _t1201;
            }
        },
        'npc': function(..._t1202) {
            let _t1204 = Process.cur_room
              , _a99 = [];
            for (let _t1205 of _t1204.items) {
                if (!_t1205)
                    continue;
                if (_t1205.hp > 0 && !_t1205.p) {
                    if (!_t1202 || !_t1202.length)
                        _a99.push(_t1205.id);
                    else
                        for (let _t1206 of _t1202) {
                            if (_t1205.name.indexOf(_t1206) > -1) {
                                _a99.push(_t1205.id);
                                break;
                            }
                        }
                }
            }
            return _a99;
        },
        'item': function(..._t1207) {
            let _t1209 = Process.cur_room
              , _a100 = [];
            for (let _t1210 of _t1209.items) {
                if (!_t1210)
                    continue;
                if (!_t1207 || !_t1207.length)
                    _a100.push(_t1210.id);
                else
                    for (let _t1211 of _t1207) {
                        if (_t1210.name.indexOf(_t1211) > -1) {
                            _a100.push(_t1210.id);
                            break;
                        }
                    }
            }
            return _a100;
        },
        'id': function() {
            let _t1213 = SCRIPT.LAST_OBJ;
            if (_t1213)
                return _t1213.id;
            return '';
        },
        'obj': function(_t1214) {
            let _t1216 = SCRIPT.LAST_OBJ;
            if (!_t1214 || !_t1216)
                return;
            return _t1216[_t1214];
        },
        'pack': function(..._t1217) {
            let _t1219 = Dialog.pack.isShow ? Dialog.pack.items : Dialog.pack2.items;
            if (!_t1219)
                return;
            let _a101 = [];
            for (let _t1220 of _t1219) {
                for (let _t1221 of _t1217) {
                    if (_t1220.name.indexOf(_t1221) > -1) {
                        _a101.push(_t1220.id);
                        break;
                    }
                }
            }
            return _a101;
        },
        'goods': function(..._t1222) {
            let _t1224 = Dialog.list.selllist;
            if (!_t1224)
                return;
            let _a102 = [];
            for (let _t1225 of _t1224) {
                for (let _t1226 of _t1222) {
                    if (_t1225.name.indexOf(_t1226) > -1) {
                        _a102.push(_t1225.id);
                        break;
                    }
                }
            }
            return _a102;
        },
        'input': function() {
            const _o10 = {
                'btn_text': '确定',
                'min': 0,
                'max': 0
            };
            for (let _n146 = 0; _n146 < arguments.length; _n146++) {
                let _t1228 = arguments[_n146];
                if (typeof _t1228 === 'string')
                    _o10.btn_text = _t1228;
                else
                    _o10.max > 0 ? _o10.min = _t1228 : _o10.max = _t1228;
            }
            _o10.content = Confirm.get_countelement(_o10.min || 1, _o10.max || 9999);
            return new Promise( (_t1229, _t1230) => {
                _o10.onOK = _t1229;
                _o10.onCancle = _t1230;
                Confirm.Show(_o10);
            }
            );
        },
        'mat': function(_t1232) {
            let _t1234 = SCRIPT.lAST_MATCHES;
            if (!_t1234)
                return;
            return _t1234[_t1232];
        },
        'data': function(_t1235) {
            if (!_t1235 || !SCRIPT.LAST_DATA)
                return;
            return SCRIPT.LAST_DATA[_t1235];
        },
        'master': function() {
            return Dialog.master.master;
        },
        'dc': function() {
            if (Dialog.master.isShow)
                return "dc " + Dialog.master.master;
            return Dialog.pack2.command_before;
        }
    },
    'helper': {
        'actions': ["#wait 100：等待100毫秒执行", "#msg 你好：输出提示消息", "#menu score，打开对话框", "#action (0-9)，执行动作栏对应位置的操作", "#pfm (0-9)，释放对应位置的绝招", '持续增加'],
        'vars': ["@dir(left)：获取当前房间左边方向的出口命令", "@npc(小二)：获取当前房间的npc ID，无参数返回所有npc", "@item：获取当前房间所有物品ID，参数匹配名称", "@id：当前正在操作的道具，技能，NPC等的ID", "持续增加"],
        'paras': ["参数用来判断所在位置的数据属性，比如地图的参数，有name,type,index", "name(扬州)：名称里包含扬州二字的地图", "index(>3)：索引大于3的地图"]
    }
};

const MAP_DIR_EXITS = {
    'left': ['west', "westup", "westdown"],
    'right': ['east', "eastup", "eastdown"],
    'up': ['north', "northup", 'northdown', 'up'],
    'down': ["south", 'southup', "southdown", "down"],
    'leftup': ['northwest'],
    'leftdown': ['southwest'],
    'rightup': ['northeast'],
    'rightdown': ['southeast']
};