// ============================================================
// raid-th.js —— 桃花岛（从 Raid.js 拆分）
// ============================================================

    /***********************************************************************************\
        TaoHua Island
    \***********************************************************************************/

    // 暂时保留给桃花岛解密用
    class AncientCmdExecuter {
        constructor(cmds, willStartExecute, didFinishExecute, willPerformCmd, didPerformCmd, interval) {
            this.cmds = cmds;
            this.willStartExecute = willStartExecute;
            this.didFinishExecute = didFinishExecute;
            this.willPerformCmd = willPerformCmd;
            this.didPerformCmd = didPerformCmd;
            this.interval = interval ? interval : 1000;
        }
        execute() {
            if (this.isWorking) return;
            this.isWorking = true;
            if (this.willStartExecute) this.willStartExecute();
            this._performCmd(0);
        }
        _performCmd(index) {
            if (index >= this.cmds.length) { this._finishExecute(); return; }
            if (!Role.isFree()) { this._delayPerformCmd(index); return; }
            var cmd = this.cmds[index];
            if (this.willPerformCmd) {
                var lastCmd = null;
                if (index > 0) lastCmd = this.cmds[index - 1];
                var valid = this.willPerformCmd(lastCmd, cmd);
                if (!valid) { this._delayPerformCmd(index); return; }
                cmd = valid;
            }
            // @开头，虚命令，不真正执行
            if (cmd.indexOf("@") == -1 && cmd.indexOf("kill?") == -1) WG.SendCmd(cmd);
            if (this.didPerformCmd) this.didPerformCmd(cmd);
            // [exit] 保留命令，立即退出执行器
            if (cmd.indexOf("[exit]") != -1) {
                this._finishExecute();
                return;
            }
            this._delayPerformCmd(index + 1);
        }
        _delayPerformCmd(index) {
            var executer = this;
            window.setTimeout(function () {
                executer._performCmd(index);
            }, executer.interval);
        }
        _finishExecute() {
            this.isWorking = false;
            WG.remove_hook(AncientCmdExecuter._hookIndex);
            if (this.didFinishExecute) this.didFinishExecute();
        }
    }

    const THIsland = {
        outMaze: function (callback) {
            if (!Role.atPath("taohua/haitan")) {
                WMsg.append("只有在 桃花岛的海滩 才能使用此虫洞。");
                return;
            }

            var cmds = [
                "go south",
                "@look 1",
                "@look 5"
            ];
            var willStartExecute = function () {
                THIsland._monitorMaze();
            };
            var didFinishExecute = function () {
                THIsland._cancelMonitorMaze();
                if (callback) callback();
            };
            var willPerformCmd = function (lastCmd, cmd) {
                if (cmd == "@look 1") {
                    if (THIsland._goCenterCmd) {
                        return THIsland._goCenterCmd;
                    } else {
                        return null;
                    }
                }
                if (cmd == "@look 5") {
                    if (THIsland._decodedMaze) {
                        return THIsland._outMazeCmd();
                    } else {
                        return null;
                    }
                }
                return cmd;
            };
            var executer = new AncientCmdExecuter(
                cmds,
                willStartExecute,
                didFinishExecute,
                willPerformCmd,
                undefined,
                1000
            );
            executer.execute();
        },
        zhoubotong: function (callback) {
            if (!Role.atPath("taohua/wofang")) {
                WMsg.append("只有在 蓉儿的卧室 才能使用此虫洞。");
                return;
            }

            var cmds = [
                "go south;go west;go west;go west;go north;go north;go north",
                "go west;go east;go west;go east;go west",
                "go south",
                "@look 1",
                "@look 5",
                "@go 2",
                "@go 3",
                "@go 4",
                "@go 6",
                "@go 7",
                "@go 8",
                "@end"
            ];
            var willStartExecute = function () {
                THIsland._monitorMaze();
                THIsland._exitsHookIndex = WG.add_hook("exits", function (data) {
                    if (THIsland._lastCoord == undefined || THIsland._lastCoord == [0, 0]) return;
                    if (Object.keys(data.items).length != 4) return;
                    for (var key in data.items) {
                        if (data.items[key] != "桃花林") return;
                    }
                    var normalExistMap = [
                        [["north", "northeast", "east"], ["east", "north", "south"], ["east", "south", "southeast"],],
                        [["east", "north", "west"], [], ["west", "east", "south"],],
                        [["west", "northwest", "north"], ["west", "south", "north"], ["west", "southwest", "south"],]
                    ];
                    var x = THIsland._lastCoord[0] + 1;
                    var y = THIsland._lastCoord[1] + 1;
                    var normalExists = normalExistMap[x][y];
                    for (var key2 in data.items) {
                        if (normalExists.indexOf(key2) != -1) continue;
                        THIsland._goCave = "go " + key2;
                        return;
                    }
                });
            };
            var didFinishExecute = function () {
                THIsland._lastCoord = undefined;
                THIsland._lastGo = undefined;
                THIsland._goCave = undefined;
                THIsland._cancelMonitorMaze();
                WG.remove_hook(THIsland._exitsHookIndex);
                if (callback) callback();
            };
            var willPerformCmd = function (lastCmd, cmd) {
                if (THIsland._goCave) return THIsland._goCave + ";go west;[exit]";

                var number = 0;
                switch (cmd) {
                    case "@look 1":
                        if (THIsland._goCenterCmd) {
                            return THIsland._goCenterCmd;
                        } else {
                            return null;
                        }
                        break;
                    case "@look 5":
                        if (!THIsland._decodedMaze) return null;
                        break;
                    case "@go 2":
                        THIsland._lastCoord = THIsland._mazeCoords[2];
                        THIsland._lastGo = THIsland._mazePath(THIsland._lastCoord);
                        return THIsland._lastGo;
                    case "@go 3": number = 3; break;
                    case "@go 4": number = 4; break;
                    case "@go 6": number = 6; break;
                    case "@go 7": number = 7; break;
                    case "@go 8": number = 8; break;
                }
                if (number != 0) {
                    var back = THIsland._mazeBackPath(THIsland._lastGo);
                    THIsland._lastCoord = THIsland._mazeCoords[number];
                    THIsland._lastGo = THIsland._mazePath(THIsland._lastCoord);
                    return back + ";" + THIsland._lastGo;
                }
                return cmd;
            };
            var executer = new AncientCmdExecuter(
                cmds,
                willStartExecute,
                didFinishExecute,
                willPerformCmd,
                undefined,
                1000
            );
            executer.execute();
        },

        _outMazeCmd: function () {
            var cmd = "";
            for (var i = 2; i <= 9; i++) {
                var coord = THIsland._mazeCoords[i];
                var go = THIsland._mazePath(coord);
                if (i == 9) {
                    cmd += go + ";" + go;
                } else {
                    cmd += go + ";" + THIsland._mazeBackPath(go) + ";";
                }
            }
            cmd += ";go south";
            return cmd;
        },
        _mazePath: function (coord) {
            var pathMap = [
                ["go southwest", "go west", "go northwest"],
                ["go south", "", "go north"],
                ["go southeast", "go east", "go northeast"]
            ];
            var x = coord[0] + 1;
            var y = coord[1] + 1;
            return pathMap[x][y];
        },
        _mazeBackPath: function (path) {
            var backMap = {
                "": "",
                "go southwest": "go northeast",
                "go west": "go east",
                "go northwest": "go southeast",
                "go south": "go north",
                "go north": "go south",
                "go southeast": "go northwest",
                "go east": "go west",
                "go northeast": "go southwest"
            };
            return backMap[path];
        },
        _monitorMaze: function () {
            THIsland._mazeCoords = [
                [2, 2], // unused
                [2, 2],
                [2, 2],
                [2, 2],
                [2, 2],
                [0, 0],
                [2, 2],
                [2, 2],
                [2, 2],
                [2, 2]
            ];
            THIsland._atFirst = false;
            THIsland._goCenterCmd = undefined;
            THIsland._decodedMaze = false;

            var index1 = WG.add_hook(["room", "exits"], function (data) {
                if (THIsland._goCenterCmd != undefined) return;

                if (data.type == "room") {
                    if (data.desc == undefined) return;
                    var patt = new RegExp("四周栽了大概有一棵桃树");
                    var result = patt.exec(data.desc);
                    if (result) THIsland._atFirst = true;
                } else if (data.type == "exits") {
                    if (data.items == undefined) return;
                    if (THIsland._atFirst) {
                        if (data.items.north && data.items.south) {
                            if (data.items.west) {
                                THIsland._mazeCoords[1] = [1, 0];
                                THIsland._goCenterCmd = "go west";
                            } else {
                                THIsland._mazeCoords[1] = [-1, 0];
                                THIsland._goCenterCmd = "go east";
                            }
                        } else if (data.items.west && data.items.east) {
                            if (data.items.north) {
                                THIsland._mazeCoords[1] = [0, -1];
                                THIsland._goCenterCmd = "go north";
                            } else {
                                THIsland._mazeCoords[1] = [0, 1];
                                THIsland._goCenterCmd = "go south";
                            }
                        }
                    }
                }
            });
            var index2 = WG.add_hook("room", function (data) {
                if (THIsland._decodedMaze) return;

                if (data.desc == undefined) return;
                var patt = new RegExp("能看到东南方向大概有.(?=棵桃树)");
                var count = patt.exec(data.desc);
                if (!count) return;
                var text = count.toString();
                switch (text.substring(text.length - 1)) {
                    case "二": THIsland._mazeCoords[2] = [1, -1]; break;
                    case "四": THIsland._mazeCoords[4] = [1, -1]; break;
                    case "六": THIsland._mazeCoords[6] = [1, -1]; break;
                    case "八": THIsland._mazeCoords[8] = [1, -1]; break;
                }

                THIsland._mazeCoords[9] = [-THIsland._mazeCoords[1][0], -THIsland._mazeCoords[1][1]];
                while (true) {
                    if (THIsland._mazeCoords[2][0] != 2) {
                        THIsland._mazeCoords[8] = [-THIsland._mazeCoords[2][0], -THIsland._mazeCoords[2][1]];
                    }
                    if (THIsland._mazeCoords[8][0] != 2) {
                        if (THIsland._mazeCoords[8][0] == THIsland._mazeCoords[1][0]) {
                            THIsland._mazeCoords[6] = [THIsland._mazeCoords[8][0], -THIsland._mazeCoords[8][1]];
                        } else {
                            THIsland._mazeCoords[6] = [-THIsland._mazeCoords[8][0], THIsland._mazeCoords[8][1]];
                        }
                    }
                    if (THIsland._mazeCoords[6][0] != 2) {
                        THIsland._mazeCoords[4] = [-THIsland._mazeCoords[6][0], -THIsland._mazeCoords[6][1]];
                    }
                    if (THIsland._mazeCoords[4][0] != 2) {
                        if (THIsland._mazeCoords[4][0] == THIsland._mazeCoords[9][0]) {
                            THIsland._mazeCoords[2] = [THIsland._mazeCoords[4][0], -THIsland._mazeCoords[4][1]];
                        } else {
                            THIsland._mazeCoords[2] = [-THIsland._mazeCoords[4][0], THIsland._mazeCoords[4][1]];
                        }
                    }
                    if (THIsland._mazeCoords[2][0] != 2 &&
                        THIsland._mazeCoords[4][0] != 2 &&
                        THIsland._mazeCoords[6][0] != 2 &&
                        THIsland._mazeCoords[8][0] != 2) {
                        break;
                    }
                }
                if (THIsland._mazeCoords[8][0] == THIsland._mazeCoords[4][0]) {
                    THIsland._mazeCoords[3] = [THIsland._mazeCoords[8][0], 0];
                } else {
                    THIsland._mazeCoords[3] = [0, THIsland._mazeCoords[8][1]];
                }
                THIsland._mazeCoords[7] = [-THIsland._mazeCoords[3][0], -THIsland._mazeCoords[3][1]];

                THIsland._decodedMaze = true;
            });
            THIsland._mazeHookIndexes = [index1, index2];
        },
        _cancelMonitorMaze: function () {
            for (var i = THIsland._mazeHookIndexes.length - 1; i >= 0; i--) {
                var index = THIsland._mazeHookIndexes[i];
                WG.remove_hook(index);
            }
        },
    };