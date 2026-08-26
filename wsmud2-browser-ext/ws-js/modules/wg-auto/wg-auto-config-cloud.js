// ============================================================
// wg-auto-config-cloud.js —— 云端配置上传/下载
// ------------------------------------------------------------
//   从 wg-auto-config.js 拆分而来
//   包含：make_config, load_config
// ============================================================
'use strict';

Object.assign(WG, {
    make_config: async function () {
        // 【2026-08-09 移植v1.0.0】上传配置：当前角色 GM 配置 + 全局设置 + 游戏自带 localStorage 设置（__LS__ 前缀）
        // 【2026-08-11 修复】角色 ID 优先用页面全局 Role.id（登录 DOM 读取的 roleid 可能失效 → indexOf 匹配不到 → 角色设置键漏传）
        var rid = (unsafeWindow && unsafeWindow.Role && unsafeWindow.Role.id) || roleid;
        if (!rid) {
            LayerHelper.msg("上传失败：未获取到角色 ID，请重新登录后重试");
            return;
        }
        let _config = {};
        let keys = GM_listValues();
        keys.forEach(key => {
            // 【2026-08-23 安全修复】改为精确判定当前角色专属键：不再用 key.indexOf(rid)>=0 子串匹配
            // （子串匹配会把 ID 是当前角色子串的其他账号键也收进来 → 泄露他人配置）
            // 注意：jQuery 绑定下 this 不是 WG 对象，用外层 WG 引用
            if (WG._isKeyOfRole(key, rid)) {
                _config[key] = GM_getValue(key);
            }
        });
        _config._shieldswitch = GM_getValue("_shieldswitch", shieldswitch);
        _config._shield = GM_getValue("_shield", shield);
        _config._shieldkey = GM_getValue("_shieldkey", shieldkey);
        _config._pushSwitch = GM_getValue(rid + "_pushSwitch", pushSwitch);
        _config._pushType = GM_getValue(rid + "_pushType", pushType);
        _config._pushToken = GM_getValue(rid + "_pushToken", pushToken);
        _config._pushDeath = GM_getValue(rid + "_pushDeath", _pushDeath);
        _config._idleCmdSwitch = GM_getValue("_idleCmdSwitch", _idleCmdSwitch);
        _config._idleCmdSeconds = GM_getValue("_idleCmdSeconds", _idleCmdSeconds);
        _config._idleCmdContent = GM_getValue("_idleCmdContent", _idleCmdContent);
        // 【2026-08-09 修复】显式包含 触发器/流程/持久变量：
        // 键名是 "角色ID@triggers" / "flow_store@角色ID" / "global_params@角色ID"（用 Role.id，不匹配 roleid 前缀会漏掉）
        try {
            var trigKey = rid + "@triggers";
            var trigVal = GM_getValue(trigKey, null);
            if (trigVal != null) _config[trigKey] = trigVal;
            var flowKey = "flow_store@" + rid;
            var flowVal = GM_getValue(flowKey, null);
            if (flowVal != null) _config[flowKey] = flowVal;
            var gparamKey = "global_params@" + rid;
            var gpVal = GM_getValue(gparamKey, null);
            if (gpVal != null) _config[gparamKey] = gpVal;
        } catch (e) { }
        // 【2026-08-23 安全修复】附带的游戏 localStorage 设置（含游戏自带拓展设置）。
        // 排除 cookie/session 及"一键登录账号密码库"等敏感键——绝不把可还原密码的账号库上传。
        try {
            for (var li = 0; li < window.localStorage.length; li++) {
                var lsKey = window.localStorage.key(li);
                if (lsKey && WG._isSensitiveLsKey(lsKey)) continue;   // cookie/session/账号库等一律跳过
                _config["__LS__" + lsKey] = window.localStorage.getItem(lsKey);
            }
        } catch (e) { }
        console.log(_config)
        SettingsStore.uploadUserConfig(GameState.id, _config, (res) => {
            if (res == "true") {
                LayerHelper.msg("已成功上传");
            }
        });
    },
    load_config: async function () {
        // 【2026-08-09 移植v1.0.0】下载配置：支持把 __LS__ 前缀项写回游戏 localStorage
        // 【2026-08-23 安全修复】写回前校验：只写回当前角色的专属键 + 非角色专属键，
        // 跳过"属于其他角色 ID"的键——防止在别人账号登录后下载到该账号的多角色配置。
        var rid = (unsafeWindow && unsafeWindow.Role && unsafeWindow.Role.id) || roleid;
        SettingsStore.getUserConfig(GameState.id, (res) => {
            if (res != "") {
                // 【2026-08-11 容错】res 可能是对象（jQuery 已解析）或字符串
                let _config = res;
                try {
                    if (typeof res === "string") _config = JSON.parse(res);
                } catch (e) {
                    LayerHelper.msg("下载失败：服务器返回的数据格式异常");
                    return;
                }
                for (const key in _config) {
                    // 【2026-08-23 安全修复】__LS__ 写回前过滤敏感键（cookie/session/账号密码库），
                    // 即使云端残留这类数据也不写入本地，杜绝登录器账号密码被还原
                    if (key.indexOf("__LS__") === 0) {
                        var lsRawKey = key.substring(6);
                        if (WG._isSensitiveLsKey(lsRawKey)) continue;
                        try { window.localStorage.setItem(lsRawKey, _config[key]); } catch (e) { }
                        continue;
                    }
                    // 【2026-08-23 安全修复】属于某角色的专属键：仅当属于当前角色时才写回，否则跳过
                    // （防止其他账号的 {id}@xxx / {id}_xxx / flow_store@{id} 等被下载覆盖回当前账号）
                    if (WG._isRoleKey(key) && !WG._isKeyOfRole(key, rid)) continue;
                    GM_setValue(key, _config[key]);
                }
                // 【2026-08-09 修复】下载后刷新触发器内存缓存（Raid 流程 FlowStore 每次动态读 GM，无需刷新）
                try {
                    if (unsafeWindow && unsafeWindow.TriggerCenter && unsafeWindow.TriggerCenter.reload) {
                        unsafeWindow.TriggerCenter.reload();
                    }
                } catch (e) { }

                GlobalInit.configInit();

                WG.setting();
                WG.ztjk_func();
                WG.zml_showp();
                WG.dsj_func();
                LayerHelper.msg("已成功加载");
            }
        });
    }
});