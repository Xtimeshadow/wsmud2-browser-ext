// ============================================================
// ws-client.js —— WebSocket 封装、网络连接、触摸事件、原型扩展（从 ws.js 拆分）
// ------------------------------------------------------------
//   Touch 触摸事件、Array/Date 原型扩展、WSClient WebSocket 封装、
//   API.UserAPI 用户 API
// ============================================================
'use strict';

const Touch = {
    'List': {},
    'AddListener': function (_t327, _t328, _t329) {
        document.querySelector(_t328).addEventListener('touchstart', Touch.Start);
        _t327 === 'zoom' ? document.querySelector(_t328).addEventListener("touchmove", Touch.Move) : document.querySelector(_t328).addEventListener("touchend", Touch.End);
        if (!Touch.List[_t327])
            Touch.List[_t327] = [];
        Touch.List[_t327].push(_t329);
    },
    'Start': function (_t331) {
        Touch.StartPos = [];
        for (var _n51 = 0; _n51 < _t331.changedTouches.length; _n51++) {
            var _t333 = _t331.changedTouches[_n51];
            Touch.StartPos.push([_t333.screenX, _t333.screenY]);
        }
    },
    'Move': function (_t334) {
        var _t336 = _t334.changedTouches.length;
        if (_t336 !== 2)
            return;
        var _a20 = [];
        for (var _n52 = 0; _n52 < _t336; _n52++) {
            var _t337 = _t334.changedTouches[_n52];
            _a20.push([_t337.screenX, _t337.screenY]);
        }
        if (_a20.length !== 2)
            return;
        Touch.Zoom(Touch.StartPos, _a20);
        Touch.StartPos = _a20;
    },
    'End': function (_t338) {
        var _a21 = [];
        for (var _n53 = 0; _n53 < _t338.changedTouches.length; _n53++) {
            var _t340 = _t338.changedTouches[_n53];
            _a21.push([_t340.screenX, _t340.screenY]);
        }
        if (!_a21.length || _a21.length != Touch.StartPos.length)
            return;
        if (_a21.length === 1)
            Touch.Slide(Touch.StartPos[0], _a21[0]);
        else
            _a21.length === 2 && Touch.Zoom(Touch.StartPos, _a21);
    },
    'Zoom': function (_t341, _t342) {
        var _t344 = Touch.Distance(_t341[0], _t341[1])
            , _t345 = Touch.Distance(_t342[0], _t342[1]);
        Touch.On("zoom", {
            'zoom': _t345 / _t344
        });
    },
    'Distance': function (_t346, _t347) {
        return Math.sqrt(Math.pow(_t346[0] - _t347[0], 2) + Math.pow(_t346[1] - _t347[1], 2));
    },
    'Slide': function (_t349, _t350) {
        var _t352 = _t349[0] - _t350[0]
            , _t353 = _t349[1] - _t350[1];
        Math.abs(_t352) < Math.abs(_t353) && Math.abs(_t353) > 20 && Touch.On("slide", {
            'offY': _t353,
            'offX': _t352,
            'isTop': _t353 > 0
        });
    },
    'On': function (_t354, _t355) {
        var _t357 = Touch.List[_t354];
        if (!_t357)
            return;
        for (var _n54 = 0; _n54 < _t357.length; _n54++) {
            _t357[_n54](_t355);
        }
    }
};
Array.prototype.Remove = function(_t1395) {
    var _t1397 = this.length;
    for (var _n165 = 0; _n165 < _t1397; _n165++) {
        if (this[_n165] == _t1395) {
            this.splice(_n165, 1);
            return this;
        }
    }
    return this;
}
,
Array.prototype.RemoveAt = function(_fn23) {
    for (var _n166 = 0; _n166 < this.length; _n166++) {
        _fn23(this[_n166]) && (this.splice(_n166, 1),
        _n166--);
    }
}
,
Array.prototype.Has = function(_t1398) {
    var _t1399 = this.length;
    for (var _n167 = 0; _n167 < _t1399; _n167++) {
        if (this[_n167] == _t1398)
            return true;
    }
    return false;
}
,
Array.prototype.Map = function(_fn24) {
    var _t1401 = this.length
      , _a108 = [];
    for (var _n168 = 0; _n168 < _t1401; _n168++) {
        var _t1402 = _fn24(this[_n168]);
        if (_t1402)
            _a108.push(_t1402);
    }
    return _a108;
}
,
Array.prototype.First = function(_fn25) {
    var _t1404 = this.length;
    for (var _n169 = 0; _n169 < _t1404; _n169++) {
        var _t1405 = this[_n169];
        if (_fn25(_t1405))
            return _t1405;
    }
    return null;
}
,
Array.prototype.Where = function(_fn26) {
    var _t1407 = this.length
      , _a109 = [];
    for (var _n170 = 0; _n170 < _t1407; _n170++) {
        var _t1408 = this[_n170];
        _fn26(_t1408) && _a109.push(_t1408);
    }
    return _a109;
}
,
Date.prototype.AddDays = function(_t1409) {
    return this.setDate(this.getDate() + _t1409),
    this;
}
,
Date.prototype.AddMonths = function(_t1411) {
    this.setMonth(this.getMonth() + _t1411);
            return this;
}
,
Date.prototype.ToDateString = function() {
    var _t1414 = this.getMonth() + 1;
    if (_t1414 < 10)
        _t1414 = '0' + _t1414;
    var _t1415 = this.getDate();
    if (_t1415 < 10)
        _t1415 = '0' + _t1415;
    return this.getFullYear() + '-' + _t1414 + '-' + _t1415;
}
,
Date.prototype.AddYears = function(_t1416) {
    this.setFullYear(this.getFullYear() + _t1416);
            return this;
}

var wsindex = 0
  , _mudSocket = WebSocket;

// 设置 window.WebSocket = null 以防止游戏页面代码创建额外的 WebSocket 连接，
// 避免覆盖 websocket-proxy.js 中共享的 ws 变量。WSClient 使用已保存的 _mudSocket 创建连接。
window.WebSocket = null;

function WSClient(url, options) {
    this.IP = url;
    this.Port = options;
}
WSClient.prototype.Connect = function(_t1419) {
    try {
        var _t1421 = location.protocol == "http:" ? 'ws' : "wss";
        this.ws = new _mudSocket(_t1421 + '://' + this.IP + ':' + this.Port);
        this.ws.onopen = this.OnConnect;
        this.ws.onclose = this.OnClose.bind(this);
        this.ws.onerror = this.OnError;
        this.ws.onmessage = this.OnReceived.bind(this);
        this.index = wsindex++;
    } catch (_t1422) {
        this.OnError && this.OnError(_t1422);
    }
}
,
WSClient.prototype.OnReceived = function(_t1423) {
    if (!_t1423 || !_t1423.data)
        return;
    var _t1425 = _t1423.data;
    if (_t1425[0] === '{' || _t1425[0] === '[') {
        // 【2026-08-11 容错】服务器消息为单引号 JSON（标准 JSON.parse 会挂，故用 new Function）。
        // 损坏/截断数据会让 new Function 构造抛错 → 原代码无 try，异常冒泡中断该消息处理。
        // 现在：解析失败降级为文本消息显示并记录，不中断挂机。
        var parsed;
        try {
            var _fn27 = new Function("return " + _t1425 + ';');
            parsed = _fn27();
        } catch (e) {
            try { ExtLog.warn('[WS] 消息解析失败，已忽略损坏数据:', e && e.message); } catch (e2) { }
            this.OnMessage(_t1425);
            return;
        }
        try {
            this.OnData(parsed);
        } catch (e) {
            // 数据处理链异常：隔离该条消息，避免中断整条 onmessage
            try { ExtLog.error('[WS] 数据处理异常（已隔离）:', e && e.message); } catch (e2) { }
        }
    } else
        this.OnMessage(_t1425);
}
,
WSClient.prototype.Send = function(_t1426) {
    try {
        this.ws.send(_t1426);
    } catch (_t1427) {
        ReceiveMessage(_t1427);
    }
}
,
WSClient.prototype.Destroy = function() {
    this.ws.onclose = null;
    this.ws.close();
}
,
WSClient.prototype.Close = function() {
    this.ws.close();
}
,
WSClient.prototype.Connected = function() {
    return this.ws && this.ws.readyState === 1;
}

var API = window.API || {};
API.UserAPI = {
    'Login': function(_t1431, _t1432, _t1433) {
        return Util.Post("api/user/login", {
            'code': _t1431,
            'pwd': _t1432
        }, _t1433);
    },
    'IsRegistValidation': function(_t1434) {
        return Util.Get("UserAPI/IsRegistValidation", _t1434);
    },
    'ValidationImage': function(_t1436) {
        return Util.Get("api/user/validimage", _t1436);
    },
    'Regist': function(_t1438, _t1439) {
        return Util.Post("api/user/regist", _t1438, _t1439);
    },
    'Enter': function(_t1440, _t1441) {
        return Util.Get('e', [_t1440], _t1441);
    },
    'ChangePassword': function(_t1443, _t1444, _t1445, _t1446) {
        return Util.Post("api/user/changepassword", {
            'oldpwd': _t1443,
            'pwd': _t1444,
            'no': _t1445
        }, _t1446);
    },
    'LoginOut': function(_t1448) {
        return Util.Get("UserAPI/LoginOut", _t1448);
    },
    'GetRoles': function(_t1450, _t1451) {
        return Util.Get("UserAPI/GetRoles", [_t1450], _t1451);
    },
    'AddRole': function(_t1452, _t1453) {
        return Util.Post("UserAPI/AddRole", {
            'player': _t1452
        }, _t1453);
    },
    'GetUser': function(_t1454) {
        return Util.Get("UserAPI/GetUser", _t1454);
    },
    'Search': function(_t1456, _t1457, _t1458, _t1459) {
        return Util.Get("UserAPI/Search", [_t1456, _t1457, _t1458], _t1459);
    },
    'ResetPassword': function(_t1460, _t1461) {
        return Util.Get("UserAPI/ResetPassword", [_t1460], _t1461);
    },
    'RecoverUser': function(_t1462, _t1463) {
        return Util.Get("UserAPI/RecoverUser", [_t1462], _t1463);
    },
    'LoadPlayer': function(_t1464, _t1465, _t1466) {
        return Util.Get("UserAPI/LoadPlayer", [_t1464, _t1465], _t1466);
    },
    'GetPhone': function(_t1467) {
        return Util.Get("api/user/getphone", _t1467);
    },
    'BindPhone': function(_t1468, _t1469, _t1470, _t1471) {
        return Util.Post("api/user/bindphone", {
            'code': _t1468,
            'no': _t1469,
            'pwd': _t1470
        }, _t1471);
    },
    'SendValidateCode': function(_t1472, _t1473) {
        return Util.Get("UserAPI/SendValidateCode", [_t1472], _t1473);
    },
    'ResetPasswordByPhone': function(_t1475, _t1476, _t1477, _t1478, _t1479) {
        return Util.Post("api/user/resetpwd", {
            'name': _t1475,
            'phone': _t1476,
            'vcode': _t1477,
            'pwd': _t1478
        }, _t1479);
    },
    'NewServer': function(_t1481) {
        return Util.Get("UserAPI/NewServer", _t1481);
    },
    'GetServer': function(_t1482) {
        return Util.Get("api/game/servers", _t1482);
    }
};