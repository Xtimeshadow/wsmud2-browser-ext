// ============================================================
// ws-utils.js —— 工具函数与存储封装（从 ws.js 拆分）
// ------------------------------------------------------------
//   Util 工具函数 + storageUtil 本地存储封装
// ============================================================
'use strict';

const Util = {
    'ProxyHost': '/',
    'isMobile': /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent),
    'Json2Str': function(_t1339) {
        if (typeof _t1339 === 'object') {
            if (_t1339 === undefined || _t1339 === null)
                return '';
            return JSON.stringify(_t1339);
        }
        return _t1339;
    },
    'Json2Str2': function(_t1341) {
        if (_t1341 === undefined || _t1341 === null)
            return '';
        return JSON.stringify(_t1341);
    },
    'Date2Str': function(_t1342) {
        if (_t1342.valueOf)
            return "/Date(" + _t1342.valueOf() + ')/';
        return _t1342;
    },
    'Clone': function(_t1343) {
        var _o12 = {};
        for (var _t1344 in _t1343) {
            _o12[_t1344] = _t1343[_t1344];
        }
        return _o12;
    },
    'Sleep': function(_t1345) {
        if (!(_t1345 > 0))
            _t1345 = 1000;
        return new Promise(_t1346 => {
            setTimeout(_t1346, _t1345);
        }
        );
    },
    'Wait': async function(_fn20) {
        while (!_fn20()) {
            await this.Sleep(1);
        }
    },
    'Str2Json': function(_t1348) {
        if (_t1348.substring(0, 1) !== '{') _t1348 = '{' + _t1348 + '}';
        return new Function('return\x20' + _t1348)();
    },
    'Str2Json2': function(_t1349) {
        return new Function("return " + _t1349)();
    },
    'Str2XML': function(_t1350) {
        var _t1352;
        if (!window.DOMParser) {
            _t1352 = new ActiveXObject("Microsoft.XMLDOM");
            _t1352.async = "false";
            _t1352.loadXML(_t1350);
        }
        else {
            var _t1353 = new DOMParser();
            _t1352 = _t1353.parseFromString(_t1350, 'text/xml');
        }
        return $(_t1352.documentElement);
    },
    'Settings': {
        'MaxUploadFileLength': 1048576 * 30
    },
    'encode': function(_t1354) {
        return encodeURIComponent(_t1354);
    },
    'CookieHelper': {
        'setCookie': function(_t1355, _t1356, _t1357) {
            var _t1359 = _t1355 + '=' + escape(_t1356);
            if (_t1357) {
                var _t1360 = new Date();
                _t1360.setTime(_t1360.getTime() + _t1357 * 60 * 1000);
                _t1359 += "; expires=" + _t1360.toGMTString();
            }
            document.cookie = _t1359;
        },
        'getCookie': function(_t1361) {
            var begin
              , end;
            if (document.cookie.length > 0) {
                begin = document.cookie.indexOf(_t1361 + '=');
                if (begin !== -1)
                    return begin += _t1361.length + 1,
                    end = document.cookie.indexOf(';', begin),
                    end === -1 && (end = document.cookie.length),
                    unescape(document.cookie.substring(begin, end));
            }
            return '';
        },
        'delCookie': function(_t1363) {
            if (this.getCookie(_t1363)) {
                var _t1365 = new Date();
                _t1365.setYear(1000);
                document.cookie = _t1363 + "=;" + _t1365.toGMTString();
            }
        }
    },
    'C_STR': "零一二三四五六七八九",
    'C_STR2': ['', '十', '百', '千', '万', '亿'],
    'C_STR3': ['', '万', '亿'],
    'to_c': function(_t1366) {
        if (!_t1366)
            return '零';
        var _t1368 = ''
          , _n159 = 0
          , _n160 = 0;
        while (_t1366) {
            var _t1369 = _t1366 % 10;
            if (_n159) {
                if (_n159 % 4 === 0 && _n160 !== 3) {
                    _t1368 = Util.C_STR3[_n159 / 4] + _t1368;
                    _n160 = 3;
                }
                else
                    if (_t1369 && _n160 !== 2) {
                    _t1368 = Util.C_STR2[_n159 % 4] + _t1368;
                    _n160 = 2;
                }
            }
            if (_t1369) {
                if (_t1369 !== 1 || _t1366 > 10 || _n159 % 4 !== 1)
                    _t1368 = Util.C_STR[_t1369] + _t1368;
                _n160 = 1;
            } else
                if (_n160 === 1) {
                _t1368 = Util.C_STR[_t1369] + _t1368;
                _n160 = 0;
            }
            _t1366 = parseInt(_t1366 / 10);
            _n159++;
        }
        return _t1368;
    },
    'Get': function(_t1370, _t1371, _t1372) {
        if (!_t1370)
            return;
        var _a106 = [];
        if ($.isPlainObject(_t1371)) {
            for (var _t1374 in _t1371) {
                if (_t1371[_t1374])
                    _a106.push(_t1374 + '=' + Util.encode(Util.Json2Str(_t1371[_t1374])));
            }
            _t1370 = _t1370 + '?' + _a106.join('&');
        } else {
            if ($.isFunction(_t1371))
                _t1372 = _t1371;
            else {
                if ($.isArray(_t1371)) {
                    for (var _n161 = 0; _n161 < _t1371.length; _n161++) {
                        _a106.push(Util.encode(Util.Json2Str(_t1371[_n161])));
                    }
                    _t1370 = _t1370 + '/' + _a106.join('/');
                }
            }
        }
        var _o13 = {
            'url': this.ProxyHost + _t1370,
            'callBack': _t1372,
            'type': 'get'
        };
        return Util.Request(_o13);
    },
    'Post': function(_t1375, _t1376, _t1377) {
        var _a107 = [], _t1379;
        if ($.isPlainObject(_t1376)) {
            for (var _t1380 in _t1376) {
                if (_t1376[_t1380])
                    _a107.push(_t1380 + '=' + Util.Json2Str(_t1376[_t1380]));
            }
            _t1379 = _a107.join('&');
        } else {
            if (_t1376.length) {
                for (var _n162 = 0; _n162 < _t1376.length; _n162++) {
                    _a107.push(Util.Json2Str(_t1376[_n162]));
                }
                _t1379 = Util.Json2Str2(_a107);
            } else
                return;
        }
        var _o14 = {
            'url': this.ProxyHost + _t1375,
            'data': _t1379,
            'callBack': _t1377,
            'type': "post"
        };
        return Util.Request(_o14);
    },
    'Request': function(_t1381) {
        var _fn22 = _t1381.callBack
          , _J90 = $.isFunction(_fn22)
          , _t1383 = null;
        $.ajax(_t1381.url, {
            'data': _t1381.data,
            'type': _t1381.type || "post",
            'async': _J90,
            'dataType': _t1381.dataType || "json",
            'xhrFields': {
                'withCredentials': true
            },
            'statusCode': {
                404: function() {}
            },
            'success': function(_t1384) {
                $.isFunction(_fn22) && _fn22(_t1384);
            },
            'error': function(_t1385, _t1386, _t1387) {
                _t1387 = _t1385.responseText;
                $.isFunction(_fn22) && _fn22(_t1387);
            }
        });
        if (_J90 === false)
            return _t1383;
    },
    'RequestOver': function(_t1388) {
        return _t1388.Code >= 0;
    },
    'ToDate': function() {
        if (arguments.length === 0)
            return new Date();
        if (arguments.length === 1) {
            var _t1390 = arguments[0].split('-');
            return new Date(_t1390[0],parseInt(_t1390[1]) - 1,_t1390[2]);
        } else
            return new Date(arguments[0],arguments[1],arguments[2]);
    },
    'CheckInputs': function(_t1391, _t1392) {
        var _t1394 = _t1391.find("input");
        for (var _n163 = 0; _n163 < _t1394.length; _n163++) {
            var _J91 = $(_t1394[_n163]).val()
              , _b7 = false;
            if (_t1392)
                for (var _n164 = 0; _n164 < _t1392.length; _n164++) {
                    if (_t1392[_n164] == _J91) {
                        _b7 = true;
                    }
                }
            _b7 ? $(_t1394[_n163]).prop("checked", true) : $(_t1394[_n163]).removeProp("checked");
        }
    }
};

const storageUtil = {
    'setItem'(_t1488, _t1489) {
        try {
            if (!_t1489)
                return this.removeItem(_t1488);
            let _t1491 = _t1489;
            if (typeof _t1489 === "object")
                _t1491 = JSON.stringify(_t1489);
            localStorage.setItem(_t1488, _t1491);
            return true;
        } catch (_t1492) {
            console.error("存储数据失败:", _t1492);
            return false;
        }
    },
    'getItem'(_t1493, _t1494=null) {
        try {
            const _t1496 = localStorage.getItem(_t1493);
            if (!_t1496)
                return _t1494;
            if (_t1496[0] === '{' || _t1496[0] === '[')
                return JSON.parse(_t1496);
            return _t1496;
        } catch (_t1497) {
            console.error("获取数据失败:", _t1497);
            return _t1494;
        }
    },
    'removeItem'(_t1498) {
        try {
            localStorage.removeItem(_t1498);
            return true;
        } catch (_t1500) {
            console.error("移除数据失败:", _t1500);
            return false;
        }
    },
    'clearAll'() {
        try {
            localStorage.clear();
            return true;
        } catch (_t1502) {
            console.error("清除所有数据失败:", _t1502);
            return false;
        }
    }
};