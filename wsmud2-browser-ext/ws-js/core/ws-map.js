// ============================================================
// ws-map.js —— 地图绘制（从 ws.js 拆分）
// ------------------------------------------------------------
//   MAP 地图：房间绘制、方向出口、换房间缓存
// ============================================================
'use strict';

const MAP = {
    'DIRS': ["west", "north", "south", "east", "northwest", "southwest", "northeast", "southeast", 'down', 'up', 'westdown', "northdown", "southdown", 'eastdown', "westup", "northup", 'southup', "eastup", 'enter', "out"],
    'REG': /<(\w+)>(.+)<\/\w+>/,
    'CreateExitsMap': function(_t268, _t269, _t270) {
        var _t272 = _t270.split('-');
        if (_t272.length > 1)
            _t270 = _t272[_t272.length - 1];
        _t270 = _t270.replace(/\(.*?\)/, '');
        var _n35 = 30
          , _n36 = 70
          , _n37 = 60
          , _n38 = 20
          , _t273 = _n35 + 10
          , _t274 = (_t269 - _n37) / 2
          , _n39 = 10
          , _o3 = {};
        if (_t268.north && _t268.up) {
            _t268.north_2 = _t268.up;
            delete _t268.up;
        }
        if (_t268.south && _t268.down) {
            _t268.south_2 = _t268.down;
            delete _t268.down;
        }
        for (var _t275 in _t268) {
            if (_t275.indexOf("south") > -1 || _t275 === "down" || _t275 === "out")
                _o3.s = true;
            else
                (_t275.indexOf("north") > -1 || _t275 === 'up' || _t275 === "enter") && (_o3.n = true);
        }
        if (_o3.s)
            _t273 += _n35;
        if (_o3.n) {
            _t273 += _n35;
            _n39 += _n35;
        }
        var _a17 = [];
        _a17.push("<svg style=\"margin-left:-2em\" height=\"" + _t273 + '\x22\x20width=\x22' + _t269 + '\x22>');
        _a17.push("<rect x=\"" + _t274 + "\" y=\"" + _n39 + ("\"  fill=\"dimgrey\" stroke-width=\"1\" stroke=\"gray\" "));
        _a17.push('width=\x22' + _n37 + "\" height=\"" + _n38 + "\"></rect>");
        _a17.push(" <text x=\"" + (_t274 + 30) + "\" y=\"" + (_n39 + 14) + ("\"  text-anchor=\"middle\" style=\"font-size:12px;\" "));
        this.pushName(_a17, _t270, true);
        for (_t275 in _t268) {
            var _t276, _t277, _t278;
            switch (_t275) {
            case "west":
            case "westup":
            case "westdown":
                _t276 = [_t274 - (_n36 - _n37), _n39 + _n38 / 2];
                _t277 = [_t274, _n39 + _n38 / 2];
                _t278 = [_t274 - _n36, _n39];
                break;
            case "east":
            case "eastup":
            case 'eastdown':
                _t276 = [_t274 + _n37, _n39 + _n38 / 2];
                _t277 = [_t274 + _n36, _n39 + _n38 / 2];
                _t278 = [_t274 + _n36, _n39];
                break;
            case "south":
            case 'southup':
            case "southdown":
            case "down":
                _t276 = [_t274 + _n37 / 2, _n39 + _n38];
                _t277 = [_t274 + _n37 / 2, _n39 + _n35];
                _t278 = [_t274, _n39 + _n35];
                break;
            case "north":
            case "northup":
            case 'northdown':
            case 'up':
                _t276 = [_t274 + _n37 / 2, _n39];
                _t277 = [_t274 + _n37 / 2, _n39 - (_n35 - _n38)];
                _t278 = [_t274, _n39 - _n35];
                break;
            case 'northwest':
                _t276 = [_t274 - _n36 + _n37, _n39 - _n35 + _n38];
                _t277 = [_t274, _n39];
                _t278 = [_t274 - _n36, _n39 - _n35];
                break;
            case "northeast":
            case "north_2":
            case "enter":
                _t276 = [_t274 + _n36, _n39 - _n35 + _n38];
                _t277 = [_t274 + _n37, _n39];
                _t278 = [_t274 + _n36, _n39 - _n35];
                break;
            case "southeast":
            case 'south_2':
                _t276 = [_t274 + _n36, _n39 + _n35];
                _t277 = [_t274 + _n37, _n39 + _n38];
                _t278 = [_t274 + _n36, _n39 + _n35];
                break;
            case "southwest":
            case "out":
                _t276 = [_t274 - _n36 + _n37, _n39 + _n35];
                _t277 = [_t274, _n39 + _n38];
                _t278 = [_t274 - _n36, _n39 + _n35];
                break;
            }
            var _t279 = _t268[_t275];
            if (_t275 === "south_2")
                _t275 = 'down';
            else {
                if (_t275 === 'north_2')
                    _t275 = 'up';
            }
            _a17.push('<rect\x20x=\x22' + _t278[0] + "\" y=\"" + _t278[1] + '\x22\x20dir=\x22' + _t275 + ("\" fill=\"#232323\" stroke-width=\"1\" stroke=\"gray\" "));
            _a17.push('width=\x22' + _n37 + '\x22\x20height=\x22' + _n38 + '\x22></rect>');
            _a17.push(" <text x=\"" + (_t278[0] + 30) + '\x22\x20y=\x22' + (_t278[1] + 14) + "\" dir=\"" + _t275 + ("\" text-anchor=\"middle\" style=\"font-size:12px;\""));
            this.pushName(_a17, _t279, false);
            if (_t276) {
                _a17.push("<line  stroke=\"gray\" ");
                _a17.push('\x20x1=\x27' + _t276[0] + "' y1='" + _t276[1] + "' x2='" + _t277[0] + "' y2='" + _t277[1] + '\x27');
                if (_t275.indexOf('up') > -1 || _t275.indexOf("down") > -1) {
                    _a17.push(" stroke-dasharray='5,5'");
                    _a17.push(" stroke-width='10'");
                } else {
                    _a17.push(" stroke-width='1'");
                }
                _a17.push("></line >");
            }
        }
        _a17.push("</svg>");
        return _a17.join('');
    },
    'colors': {
        'hig': "#00FF00",
        'hir': "#FF0000",
        'him': "#FF00FF",
        'hic': '#00FFFF',
        'hiy': "#FFFF00",
        'wht': "#C0C0C0",
        'mag': '#800080',
        'red': "#800000",
        'hiw': "#FFFFFF",
        'gre': "#008000",
        'blu': '#000080',
        'hib': "#0000FF"
    },
    'GetColor': function(_t280, _t281) {
        return this.colors[_t280.toLowerCase()] || "dimgrey";
    },
    'ShowMap': function(_t283, _t284) {
        if (!_t283)
            return;
        this.CurMapID = _t284;
        var _a18 = []
          , _t286 = MAP.getMinPos(_t283)
          , _n40 = 0 - _t286.minX
          , _n41 = 0 - _t286.minY
          , _n42 = 50
          , _n43 = 100
          , _n44 = 60
          , _n45 = 20
          , _J47 = $('.map-panel');
        MAP.MapWidth = (_t286.maxX + _n40 + 1) * _n43;
        let _n46 = 0
        let _t287 = _J47.width();
        if (MAP.MapWidth < _t287) {
            _n46 = (_t287 - MAP.MapWidth) / 2;
            MAP.MapWidth = _t287;
        }
        MAP.MapHeight = (_t286.maxY + _n41 + 1) * _n42;
        if (MAP.MapWidth < 0 || MAP.MapHeight < 0)
            return;
        var _t288 = /^([a-z]{1,2})(\d)?([d|l])?$/;
        _a18.push("<svg class=\"map\" height=\"" + MAP.MapHeight + "\" width=\"" + MAP.MapWidth + '\x22>');
        for (var _n47 = 0; _n47 < _t283.length; _n47++) {
            _a18.push("<rect class='map-room' rm='" + _t283[_n47].id + '\x27\x20');
            var _t289 = (_t283[_n47].p[0] + _n40) * _n43 + _n46 + 20
              , _t290 = (_t283[_n47].p[1] + _n41) * _n42 + 20;
            _a18.push('x=\x27' + _t289 + '\x27\x20y=\x27' + _t290 + '\x27');
            _a18.push(" fill=\"dimgrey\" stroke-width=\"1\" stroke=\"gray\" ");
            _a18.push('width=\x22' + _n44 + '\x22\x20height=\x22' + _n45 + "\"></rect>");
            var _t291 = _t283[_n47].exits;
            if (_t291)
                for (var _n48 = 0; _n48 < _t291.length; _n48++) {
                    _t288.test(_t291[_n48]);
                    var _t292 = RegExp.$2 ? parseInt(RegExp.$2) : 1, _t293, _t294;
                    switch (RegExp.$1) {
                    case 'w':
                        _t293 = [_t289 - (_n43 - _n44) - _n43 * (_t292 - 1), _t290 + _n45 / 2];
                        _t294 = [_t289, _t290 + _n45 / 2];
                        break;
                    case 'e':
                        _t293 = [_t289 + _n44, _t290 + _n45 / 2];
                        _t294 = [_t289 + _n43 + _n43 * (_t292 - 1), _t290 + _n45 / 2];
                        break;
                    case 's':
                        _t293 = [_t289 + _n44 / 2, _t290 + _n45];
                        _t294 = [_t289 + _n44 / 2, _t290 + _n42 + _n42 * (_t292 - 1)];
                        break;
                    case 'n':
                        _t293 = [_t289 + _n44 / 2, _t290];
                        _t294 = [_t289 + _n44 / 2, _t290 - (_n42 - _n45) - _n42 * (_t292 - 1)];
                        break;
                    case 'nw':
                        _t293 = [_t289 - _t292 * _n43 + _n44, _t290 - _t292 * _n42 + _n45];
                        _t294 = [_t289, _t290];
                        break;
                    case 'ne':
                        _t293 = [_t289 + _n44, _t290];
                        _t294 = [_t289 + _t292 * _n43, _t290 - (_n42 - _n45)];
                        break;
                    case 'se':
                        _t293 = [_t289 + _n44, _t290 + _n45];
                        _t294 = [_t289 + _t292 * _n43, _t290 + _t292 * _n42];
                        break;
                    case 'sw':
                        _t293 = [_t289, _t290 + _n45];
                        _t294 = [_t289 - (_n43 - _n44) - _n43 * (_t292 - 1), _t290 + _t292 * _n42];
                        break;
                    }
                    if (_t293) {
                        _a18.push("<line  stroke=\"gray\" ");
                        _a18.push('\x20x1=\x27' + _t293[0] + '\x27\x20y1=\x27' + _t293[1] + "' x2='" + _t294[0] + "' y2='" + _t294[1] + '\x27');
                        if (RegExp.$3) {
                            _a18.push(" stroke-dasharray='5,5'");
                        }
                        if (RegExp.$3 === 'l') {
                            _a18.push(" stroke-width='10'");
                        } else {
                            _a18.push(" stroke-width='1'");
                        }
                        _a18.push('></line\x20>');
                    }
                }
            _a18.push(" <text x=\"" + (_t289 + 30) + "\" y=\"" + (_t290 + 14) + ("\" text-anchor=\"middle\" style=\"font-size:12px;\" "));
            this.pushName(_a18, _t283[_n47].n, true);
        }
        _a18.push('</svg>');
        _J47.html(_a18.join(''));
        this.MapContent = $("svg");
        if (!this.IsShow) {
            this.IsShow = true;
            $(".map-panel").slideDown("fast");
        }
        this.SetRoom(this.Room);
    },
    'pushName': function(_t295, _t296, _t297) {
        var _t299 = this.REG.exec(_t296);
        if (_t299) {
            _t295.push("  fill=\"" + this.GetColor(_t299[1]) + '\x22');
            _t295.push('>' + _t299[2] + "</text>");
        } else {
            _t295.push(" fill=\"");
            _t295.push(_t297 ? "#232323" : 'dimgrey');
            _t295.push('\x22>' + _t296 + "</text>");
        }
    },
    'getMinPos': function(_t300) {
        var _o4 = {
            'minX': 99999,
            'minY': 99999,
            'maxX': 0,
            'maxY': 0
        };
        for (var _n49 = 0; _n49 < _t300.length; _n49++) {
            var _t302 = _t300[_n49].p[0]
              , _t303 = _t300[_n49].p[1];
            _t302 < _o4.minX && (_o4.minX = _t302);
            if (_t302 > _o4.maxX)
                _o4.maxX = _t302;
            _t303 < _o4.minY && (_o4.minY = _t303);
            if (_t303 > _o4.maxY)
                _o4.maxY = _t303;
        }
        return _o4;
    },
    'State': 0,
    'ZoomState': 100,
    'Buffer': {},
    'HideItem': function() {
        if (this.State === 0) {
            this.State = 1;
            $(".room_desc").slideUp("fast");
        }
    },
    'ShowItem': function() {
        if (this.State === 1) {
            this.State = 0;
            $(".room_desc").slideDown("fast");
        }
    },
    'ZoomIn': function(_t306) {
        if (_t306.zoom)
            return;
        MAP.ZoomState = MAP.ZoomState / _t306.zoom;
        if (MAP.ZoomState > 200)
            MAP.ZoomState = 200;
        if (MAP.ZoomState < 80)
            MAP.ZoomState = 80;
        var _t308 = MAP.MapWidth * MAP.ZoomState / 100
          , _t309 = MAP.MapHeight * MAP.ZoomState / 100;
        this.MapContent.attr("viewBox", "0,0," + _t308 + ',' + _t309);
    },
    'SetRoom': function(_t310) {
        this.Room = _t310;
        if (!this.IsShow)
            return;
        if (this.CurRoomItem) {
            this.CurRoomItem.attr("fill", "dimgrey");
            this.CurRoomItem.attr("stroke", "gray");
        }
        this.CurRoomItem = null;
        var _t312 = this.MapContent.find("rect[rm='" + _t310.path + '\x27]');
        if (_t312.length) {
            this.CurRoomItem = _t312;
            this.CurRoomItem.attr('fill', "#bebebe");
            this.CurRoomItem.attr("stroke", "gray");
            var _a19 = [_t312.attr('x'), _t312.attr('y'), _t312.attr("width"), _t312.attr("height")]
              , _t313 = document.querySelector(".map-panel")
              , _t314 = _t313.offsetHeight
              , _t315 = _t313.offsetWidth;
            _t313.scrollTop = _a19[1] - (_t314 - _a19[3]) / 2;
            _t313.scrollLeft = _a19[0] - (_t315 - _a19[2]) / 2;
        }
        var _t316 = _t310.path.substr(0, _t310.path.lastIndexOf('/'));
        if (_t316 !== this.CurMapID) {
            if (MAP.Buffer[_t316])
                return MAP.ShowMap(MAP.Buffer[_t316], _t316);
            SendCommand("map " + _t316);
        }
    },
    'LoadMap': function() {
        if (this.IsShow) {
            this.IsShow = false;
            $(".map-panel").slideUp("fast");
            return;
        }
        var _t318 = MAP.Room;
        if (!_t318)
            return;
        var _t319 = _t318.path.substr(0, _t318.path.lastIndexOf('/'));
        if (_t319 === this.CurMapID) {
            $(".map-panel").slideDown("fast");
            this.IsShow = true;
            return;
        }
        if (MAP.Buffer[_t319])
            return MAP.ShowMap(MAP.Buffer[_t319], _t319);
        SendCommand("map " + _t319);
    },
    'SetMapBuffer': function(_t320, _t321) {
        MAP.Buffer[_t321] = _t320;
    },
    'UpdateMap': function(_t323, _t324) {
        var _t326 = MAP.Buffer[_t323];
        if (!_t326)
            return;
        if (!_t324.id) {
            MAP.Buffer[_t323] = null;
            if (this.CurMapID == _t323)
                this.CurMapID = null;
            return;
        }
        for (var _n50 = 0; _n50 < _t326.length; _n50++) {
            if (_t326[_n50].id == _t324.id) {
                _t326[_n50].n = _t324.n || _t326[_n50].n;
                _t326[_n50].p = _t324.p || _t326[_n50].p;
                _t326[_n50].exits = _t324.exits || _t326[_n50].exits;
                break;
            }
        }
        _t323 === this.CurMapID && MAP.ShowMap(_t326, _t323);
    }
};