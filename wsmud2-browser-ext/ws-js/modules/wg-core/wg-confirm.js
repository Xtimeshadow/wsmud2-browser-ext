// ============================================================
// wg-confirm.js —— 通用确认框
// ------------------------------------------------------------
//   提供商店买入/卖出/分解、丢弃、给予、合成、技能放弃等
//   操作的二次确认对话框。所有 Show_xxx 方法统一由 Process
//   路由分发。
// ============================================================
var Confirm = {
    'DEFAULT': {
        'onOK': function() {},
        'footer': true,
        'btn_text': '确认'
    },
    'Show': function(_t1256) {
        this.Init();
        this.Parameter = Object.assign({}, this.DEFAULT, _t1256);
        this.content.empty().append(this.Parameter.content);
        this.element.show();
        if (this.Parameter.footer) {
            this.btn.show();
            this.btn.find('.btn-text').html(this.Parameter.btn_text);
        } else {
            this.btn.hide();
        }
        this.isShow = true;
    },
    'Close': function(_t1258) {
        if (!Confirm.isShow)
            return;
        Confirm.element.hide();
        Confirm.isShow = false;
        if (!_t1258 && this.Parameter.onCancle)
            this.Parameter.onCancle();
    },
    'Init': function() {
        if (this._init)
            return;
        this.element = $(".dialog-confirm");
        this.content = this.element.find(".dialog-content");
        this.btn = this.element.find(".dialog-btn");
        this.element.on("click", ".btn-ok", function(_t1261) {
            if (Confirm.Parameter.content === Confirm.count_element) {
                var _t1263 = Confirm.count_element.find("input")
                  , _n153 = parseInt(_t1263.val());
                if (_n153.toString() === 'NaN')
                    _n153 = 0;
                if (_n153 > Confirm.max_count)
                    _n153 = Confirm.max_count;
                Confirm.Parameter.onOK(_n153);
            } else
                Confirm.Parameter.onOK();
            return Confirm.Close(true),
            false;
        });
        this.element.on('click', ".btn", function(_t1264) {
            var _t1266 = Confirm.max_count || 1000
              , _J89 = $(_t1264.target)
              , _n154 = parseInt(_J89.attr('ac'))
              , _t1267 = _J89.parent().find("input")
              , _n155 = parseInt(_t1267.val());
            if (_n155.toString() == "NaN")
                _n155 = 0;
            if (_n154 === -10)
                _n155 -= 10;
            else {
                if (_n154 === 10) {
                    if (_n155 === 1)
                        _n155 = 0;
                    _n155 += 10;
                } else
                    _n154 === 1 ? _n155 = _t1266 : _n155 = 1;
            }
            if (_n155 < 1)
                _n155 = 1;
            else {
                if (_n155 > _t1266)
                    _n155 = _t1266;
            }
            return _t1267.val(_n155),
            false;
        });
        this._init = true;
    },
    'Process': function(_t1268) {
        var _t1270 = _t1268[1]
          , _t1271 = '';
        _t1270 === 'dc' && (_t1270 = _t1268[3],
        _t1271 = _t1268.splice(1, 2),
        _t1271 = _t1271[0] + '\x20' + _t1271[1] + '\x20');
        var _t1272 = this["Show_" + _t1270];
        _t1272 && _t1272.call(this, _t1268, _t1271);
    },
    'get_countelement': function(_t1273, _t1274) {
        !this.count_element && (this.count_element = $("<div  class=\"confirm-count\"><span class=\"btn\" ac=\"0\">最少</span><span ac=\"-10\" class=\"btn\">减10</span><input type=\"text\" value=\"1\" /><span class=\"btn\"  ac=\"10\" >加10</span><span class=\"btn\" ac=\"1\" >最多</span></div>"));
        if (_t1273)
            this.count_element.find("input").val(_t1273);
        else
            this.count_element.find("input").val(1);
        if (_t1274)
            _t1274 = parseInt(_t1274);
        return this.max_count = _t1274 || 1000,
        this.count_element;
    },
    'Show_shop': function(_t1276, _t1277) {
        var _t1279 = _t1276[2];
        if (!_t1279)
            return;
        var _t1280 = Dialog.shop.get_item(_t1279);
        if (!_t1280)
            return;
        let _t1281 = _t1276[3] ? parseInt(_t1276[3]) : -1;
        this.Show({
            'content': this.get_countelement(1, _t1281 === -1 ? 9999 : _t1281),
            'btn_text': '购买' + _t1280.name,
            'onOK': function(_t1282) {
                if (!(_t1282 > 0))
                    return;
                SendCommand('shop\x20' + _t1279 + '\x20' + _t1282);
            }
        });
    },
    'Show_buy': function(_t1283) {
        var _t1285 = _t1283[3];
        if (!_t1285)
            return;
        var _n156 = parseInt(_t1283[2]);
        this.Show({
            'content': this.get_countelement(1, _n156 === -1 ? 9999 : _n156),
            'btn_text': '购买',
            'onOK': function(_t1286) {
                if (!(_t1286 > 0))
                    return;
                SendCommand("buy " + _t1286 + '\x20' + _t1285 + '\x20from\x20' + _t1283[5]);
            }
        });
    },
    'Show_greet': function(_t1287) {
        this.Show({
            'content': this.get_countelement(1, 99),
            'btn_text': '送花',
            'onOK': function(_t1289) {
                if (!(_t1289 > 0))
                    return;
                SendCommand("greet " + _t1289);
            }
        });
    },
    'Show_sell': function(_t1290) {
        var _t1292 = _t1290[3];
        if (!_t1292)
            return;
        this.Show({
            'content': this.get_countelement(_t1290[2], _t1290[2]),
            'btn_text': '卖出',
            'onOK': function(_t1293) {
                if (!(_t1293 > 0))
                    return;
                SendCommand("sell " + _t1293 + '\x20' + _t1292 + '\x20to\x20' + _t1290[5]);
            }
        });
    },
    'Show_store': function(_t1294) {
        var _t1296 = _t1294[3];
        if (!_t1296)
            return;
        if (_t1294[2] === 1)
            return SendCommand((Dialog.list.is_bookshelf ? "sj " : '') + 'store\x20' + _t1296);
        this.Show({
            'content': this.get_countelement(_t1294[2], _t1294[2]),
            'btn_text': '存入',
            'onOK': function(_t1297) {
                if (!(_t1297 > 0))
                    return;
                SendCommand((Dialog.list.is_bookshelf ? "sj " : '') + "store " + _t1297 + '\x20' + _t1296);
            }
        });
    },
    'Show_fenjie': function(_t1299, _t1300) {
        var _t1302 = _t1299[2];
        if (!_t1302)
            return;
        var _t1303 = Dialog.pack.isShow ? Dialog.pack.get_item(_t1302) : Dialog.pack2.get_item(_t1302);
        if (!_t1303)
            return;
        if (_t1303.name.indexOf('★') == -1)
            return SendCommand("fenjie " + _t1302);
        this.Show({
            'content': '是否确认分解' + _t1303.name + '？',
            'btn_text': '确认分解',
            'onOK': function() {
                SendCommand(_t1300 + 'fenjie\x20' + _t1302);
            }
        });
    },
    'Show_qu': function(_t1304) {
        var _t1306 = _t1304[2];
        if (!_t1306)
            return;
        var _t1307 = Dialog.list.find_item(3, _t1306);
        if (!_t1307)
            return;
        if (_t1307.count === 1)
            return SendCommand((Dialog.list.is_bookshelf ? 'sj\x20' : '') + "qu 1 " + _t1306);
        this.Show({
            'content': this.get_countelement(_t1307.count, _t1307.count),
            'btn_text': '取出',
            'onOK': function(_t1308) {
                if (!(_t1308 > 0))
                    return;
                SendCommand((Dialog.list.is_bookshelf ? 'sj\x20' : '') + "qu " + _t1308 + '\x20' + _t1306);
            }
        });
    },
    'Show_drop': function(_t1310, _t1311) {
        var _t1313 = _t1310[3];
        if (!_t1313)
            return;
        var _t1314 = Dialog.pack.isShow ? Dialog.pack.get_item(_t1313) : Dialog.pack2.get_item(_t1313);
        if (!_t1314)
            return;
        this.Show({
            'content': _t1310[2] === 1 ? "是否确认丢掉" + _t1314.name + '？' : this.get_countelement(_t1310[2], _t1310[2]),
            'btn_text': '丢掉',
            'onOK': function(_t1315) {
                if (_t1310[2] === 1)
                    return SendCommand(_t1311 + 'drop\x20' + _t1313);
                if (!(_t1315 > 0))
                    return;
                SendCommand(_t1311 + "drop " + _t1315 + '\x20' + _t1313);
            }
        });
    },
    'Show_give': function(_t1316, _t1317) {
        var _t1319 = _t1316[4];
        if (!_t1319)
            return;
        var _t1320 = Dialog.pack2.get_item(_t1319);
        if (!_t1320)
            return;
        if (_t1320.count === 1)
            return SendCommand(_t1317 + 'give\x20' + Process.player + '\x201\x20' + _t1319);
        this.Show({
            'content': this.get_countelement(_t1320.count, _t1320.count),
            'btn_text': '拿来',
            'onOK': function(_t1321) {
                if (!(_t1321 > 0))
                    return;
                SendCommand(_t1317 + "give " + Process.player + '\x20' + _t1321 + '\x20' + _t1319);
            }
        });
    },
    'Show_trade_add': function(_t1322) {
        if (!_t1322)
            return;
        this.Show({
            'content': this.get_countelement(_t1322.count, _t1322.count),
            'btn_text': '确定',
            'onOK': function(_t1324) {
                if (!(_t1324 > 0))
                    return;
                var _t1326 = Util.Clone(_t1322);
                _t1326.count = _t1324,
                Dialog.trade.add_trade(_t1326);
            }
        });
    },
    'Show_fangqi': function(_t1327, _t1328) {
        var _t1330 = _t1327[2];
        if (!_t1330)
            return;
        var _t1331 = _t1328 ? Dialog.master.skills[_t1330] : Dialog.skills.skills[_t1330];
        if (!_t1331)
            return;
        this.Show({
            'content': "是否确认放弃技能" + _t1331.name + '？',
            'onOK': function() {
                SendCommand(_t1328 + "fangqi " + _t1330);
            }
        });
    },
    'Show_combine': function(_t1332, _t1333) {
        var _t1335 = _t1332[2];
        if (!_t1335)
            return;
        var _t1336 = Dialog.pack.get_item(_t1335);
        if (!_t1336)
            return;
        var _n157 = parseInt(_t1332[3]);
        if (!_n157)
            return;
        var _n158 = parseInt(_t1336.count / _n157);
        if (_n158 === 1)
            return SendCommand("combine " + _t1335);
        this.Show({
            'content': this.get_countelement(_n158),
            'btn_text': '合成',
            'onOK': function(_t1337) {
                if (!(_t1337 > 0))
                    return;
                SendCommand(_t1333 + "combine " + _t1335 + '\x20' + _t1337);
            }
        });
    },
    'Show_pay': function() {
        SendCommand("pay 0 " + (/mobile/i.test(navigator.userAgent) ? 'm' : 'c'));
    }
}