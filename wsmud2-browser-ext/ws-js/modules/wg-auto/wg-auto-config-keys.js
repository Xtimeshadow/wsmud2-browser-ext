// ============================================================
// wg-auto-config-keys.js —— 配置键判定工具
// ------------------------------------------------------------
//   从 wg-auto-config.js 拆分而来
//   包含：_isKeyOfRole, _isRoleKey, _isSensitiveLsKey
// ============================================================
'use strict';

Object.assign(WG, {
    // 【2026-08-23 安全修复】判断 GM 键是否属于指定角色 rid。
    // 之前在 make_config 用 key.indexOf(rid)>=0 做子串匹配，ID 短的账号（如 1/10/abc 等子串）
    // 会误匹配到其他角色的键 → 上传了别人的账号配置；下载时又全量写回，造成跨账号泄露。
    // 现改为"前缀 + 边界符"精确判定（角色ID可能是纯数字如 123，也可能是字母数字混合
    // 如 hn7c10b71717，故不能硬编码 \d）：
    //   键 == rid 本身，或键以 rid@ / rid_ / rid- 开头，或精确命中 flow_store@{rid} /
    //   global_params@{rid} / ###CodeTranslator@{rid}
    _isKeyOfRole: function (key, rid) {
        if (typeof key !== 'string' || !key || !rid) return false;
        rid = String(rid);
        if (key === rid) return true;
        if (key.indexOf(rid + "@") === 0) return true;
        if (key.indexOf(rid + "_") === 0) return true;
        if (key.indexOf(rid + "-") === 0) return true;
        if (key === "flow_store@" + rid) return true;
        if (key === "global_params@" + rid) return true;
        if (key === "###CodeTranslator@" + rid) return true;
        return false;
    },
    // 【2026-08-23】判断某键是否是"某个角色的专属键"（不关心是哪个角色）。
    // 角色ID可能是纯数字或多位字母数字混合（如 hn7c10b71717）。判定依据键前缀边界符：
    //  - 不以 _ 开头（排除 _shieldswitch / _pushSwitch 这类全局或别名键）、不含 __LS__
    //  - 命中 <text>@ 或 <text>_ 前缀，或精确匹配 flow_store@ / global_params@ / ###CodeTranslator@
    // 下载时对这类键做"只属于当前角色才写回"过滤，避免其他账号角色键被覆盖回来。
    _isRoleKey: function (key) {
        if (typeof key !== 'string' || !key) return false;
        if (key.charAt(0) === '_') return false;                  // 下划线开头 = 全局/别名，非角色键
        if (key.charAt(0) === '@') return false;
        if (/^.+@/.test(key)) return true;                       // xxx@（如 hn7c10b71717@triggers）
        if (/^.+_/.test(key)) return true;                       // xxx_（如 123_pushSwitch）
        if (key.indexOf("flow_store@") === 0) return true;
        if (key.indexOf("global_params@") === 0) return true;
        if (key.indexOf("###CodeTranslator@") === 0) return true;
        return false;
    },
    // 【2026-08-23 安全修复】判断 localStorage 键是否敏感（不该参与上传/下载）：
    //  - cookie / session（会话凭证）
    //  - 一键登录账号密码库（mud_game_account_data，含可还原编码的密码）
    //  - 其它已知敏感项（上次登录名等）
    _isSensitiveLsKey: function (key) {
        if (typeof key !== 'string' || !key) return true;
        var lower = key.toLowerCase();
        if (lower.indexOf("cookie") >= 0) return true;
        if (lower.indexOf("session") >= 0) return true;
        if (key.indexOf("mud_game_account_data") >= 0) return true;   // 账号+密码库
        if (key.indexOf("login_name") === 0) return true;              // 补充：上次登录名
        return false;
    }
});