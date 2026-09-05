// ============================================================
// raid-dungeons.js —— 副本（数据从 ws-js/data/dungeons.txt 加载）（从 Raid.js 拆分）
// ============================================================

    /***********************************************************************************\
        Dungeons（数据从 ws-js/data/dungeons.txt 加载）
    \***********************************************************************************/

    var Dungeons = [];

    function _loadDungeons() {
        var baseUrl = '';
        var scripts = document.querySelectorAll('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src.indexOf('Raid.js') > 0) {
                baseUrl = src.substring(0, src.indexOf('/ws-js/') + 1);
                break;
            }
        }
        var url = baseUrl + 'ws-js/data/dungeons.txt';
        fetch(url).then(function (r) { return r.text(); }).then(function (text) {
            var entries = text.split('\n=== ');
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (entry.trim() === '') continue;
                // First entry might not start with "=== " prefix
                var name, source;
                if (i === 0 && entry.indexOf(' ===\n') === -1) {
                    continue;
                }
                var idx = entry.indexOf(' ===\n');
                if (idx === -1) continue;
                name = entry.substring(0, idx);
                // 第一行开头可能带有 "=== " 前缀，需要去掉
                if (name.indexOf('=== ') === 0) {
                    name = name.substring(4);
                }
                source = entry.substring(idx + 5).trim();
                if (name && source) {
                    Dungeons.push({ name: name, source: source });
                }
            }
        }).catch(function (e) {
            console.error('[WSMUD] 加载副本流程数据失败:', e);
        });
    }
    _loadDungeons();

    const GetDungeonFlow = function (name) {
        for (const d of Dungeons) {
            if (d.name == name) {
                return d.source;
            }
        }
        return null;
    };

    // params: name subtype
    const AutoDungeonName = function (params) {
        const parts = params.split(' ');
        const name = parts[0];
        const type = parts[1];
        let totalName = '';
        switch (type) {
            case '0':
                if (GetDungeonFlow(name)) {
                    return name;
                }
                totalName = `${name}(简单)`;
                if (GetDungeonFlow(totalName)) {
                    return totalName;
                }
                break;
            case '1':
                totalName = `${name}(困难)`;
                if (GetDungeonFlow(totalName) != null) {
                    return totalName;
                };
                break;
            case '2':
                totalName = `${name}(组队)`;
                if (GetDungeonFlow(totalName) != null) {
                    return totalName;
                };
                break;
            default:
                break;
        }
        return null;
    };

    (function () {
        const executor = new AtCmdExecutor("fb", function (performer, param) {
            const name = AutoDungeonName(param);
            if (name == null) {
                WMsg.append('暂不支持次副本哦，欢迎到论坛分享此副本流程。');
            } else {
                const source = GetDungeonSource(name);
                return new Promise(resolve => {
                    const p = new Performer(`自动副本-${name}`, source);
                    p.log(true);
                    p.start(_ => {
                        resolve();
                    });
                });
            }
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    function GetDungeonSource(name) {
        let source = GetDungeonFlow(name);
        if (source == null) {
            return null;
        }
        const result = `
[if] (_DungeonHpThreshold) == null
    ($_DungeonHpThreshold) = 50
[if] (_DungeonWaitSkillCD) == null
    ($_DungeonWaitSkillCD) = 打开
[if] (_DungeonBagCleanWay) == null
    ($_DungeonBagCleanWay) = 存仓及售卖
[if] (_DungeonRecordGains) == null
    ($_DungeonRecordGains) = 是
#select ($_DungeonHpThreshold) = 副本内疗伤，当气血低于百分比,100|90|80|70|60|50|40|30|20|10,(_DungeonHpThreshold)
#select ($_DungeonWaitSkillCD) = Boss战前等待技能冷却,打开|关闭,(_DungeonWaitSkillCD)
#select ($_DungeonBagCleanWay) = 背包清理方案,不清理|售卖|存仓及售卖,(_DungeonBagCleanWay)
#select ($_DungeonRecordGains) = 结束后显示收益统计,是|否,(_DungeonRecordGains)
`;
        return result + source;
    }