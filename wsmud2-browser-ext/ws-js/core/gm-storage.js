// ============================================================
// gm-storage.js —— GM 存储分析工具（只读分析 + 孤儿键清理）
// ------------------------------------------------------------
// 从 GM_API.js 拆分出来的存储分析相关函数：
//   GM_storageReport   统计 localStorage：键数/总大小/角色分布/疑似孤儿键
//   GM_knownRoleIds    获取已知角色 ID 白名单
//   GM_scanOrphanKeys  扫描孤儿键（只读，不删除）
//   GM_cleanOrphanKeys 清理孤儿键（先备份，确认写成功才删）
// ============================================================

// 【2026-08-11 存储分析（只读，不删除）】统计 localStorage：键数/总大小/角色分布/疑似孤儿键
// 用途：配置接近 5MB 上限或怀疑有历史遗留键时，先看报告再决定是否手动清理。
// 注意：判定为"孤儿"的键可能包含游戏自身使用的键（本函数不删任何数据，仅报告）。
function GM_storageReport() {
    var report = { count: 0, totalBytes: 0, roles: {}, orphans: [] };
    var keys = GM_listValues();
    // 从键里提取已知角色 ID（角色前缀 / 角色ID@ / flow_store@角色ID / global_params@角色ID）
    var roleIds = new Set();
    keys.forEach(function (k) {
        var m = k.match(/^(\d+)@/);
        if (m) roleIds.add(m[1]);
        m = k.match(/^(?:flow_store|global_params)@(\d+)$/);
        if (m) roleIds.add(m[1]);
        m = k.match(/^(\d+)_/);
        if (m) roleIds.add(m[1]);
    });
    keys.forEach(function (k) {
        var raw = localStorage.getItem(k);
        var size = raw ? raw.length * 2 : 0;   // UTF-16 约估字节
        report.totalBytes += size;
        report.count++;
        var isRole = false;
        roleIds.forEach(function (rid) {
            if (k.indexOf(rid) >= 0) {
                isRole = true;
                report.roles[rid] = (report.roles[rid] || 0) + size;
            }
        });
        if (isRole) return;
        if (/^_/.test(k) || /^ext_/.test(k) || k.indexOf('@') >= 0) return;  // 合法全局/扩展/复合键
        report.orphans.push({ key: k, size: size });
    });
    return report;
}

// 【2026-08-13 存储孤儿键清理】角色删除/改名后，扩展写入的旧配置键会残留占用存储。
// 安全性设计：
//   ① 只处理"扩展写入的角色键"（角色ID前缀 / flow_store@ / global_params@ / ###CodeTranslator@），绝不碰游戏自身键；
//   ② 用"已知角色白名单"（一键登录保存过的所有角色 + 当前登录角色）判定孤儿，白名单为空则拒绝扫描，避免误删；
//   ③ 清理前自动把孤儿键备份到 ext_orphan_backup_<时间戳>，确认写成功后才删除。
// 获取已知角色 ID 白名单
function GM_knownRoleIds() {
    var ids = [];
    try { if (typeof Role !== 'undefined' && Role && Role.id) ids.push(String(Role.id)); } catch (e) { }
    try {
        var raw = localStorage.getItem('mud_game_account_data');
        if (raw) {
            var data = JSON.parse(raw);
            for (var acc in data) {
                if (!data.hasOwnProperty(acc)) continue;
                var servers = data[acc];
                for (var sv in servers) {
                    if (sv === 'password') continue;
                    var info = servers[sv];
                    if (info && Array.isArray(info.roles)) {
                        for (var i = 0; i < info.roles.length; i++) {
                            if (info.roles[i] && info.roles[i].id) ids.push(String(info.roles[i].id));
                        }
                    }
                }
            }
        }
    } catch (e) { }
    return ids;
}
// 扫描孤儿键（只读，不删除）。返回 { ok, message, knownRoles, orphans:[{key,size}], totalBytes }
function GM_scanOrphanKeys() {
    var known = GM_knownRoleIds();
    var knownSet = {};
    for (var i = 0; i < known.length; i++) knownSet[known[i]] = true;
    var result = { ok: known.length > 0, knownRoles: known, orphans: [], totalBytes: 0 };
    if (known.length === 0) {
        result.message = '无法判定角色列表（未用一键登录保存过角色且未登录），为避免误删不执行扫描';
        return result;
    }
    var keys = GM_listValues();
    for (var j = 0; j < keys.length; j++) {
        var k = keys[j];
        var rid = null, m = null;
        m = k.match(/^(\d+)@/); if (m) rid = m[1];
        if (!rid) { m = k.match(/^(\d+)_/); if (m) rid = m[1]; }
        if (!rid) { m = k.match(/^flow_store@(\d+)$/); if (m) rid = m[1]; }
        if (!rid) { m = k.match(/^global_params@(\d+)$/); if (m) rid = m[1]; }
        if (!rid) { m = k.match(/^###CodeTranslator@(\d+)$/); if (m) rid = m[1]; }
        if (!rid) continue;
        if (knownSet[rid]) continue;   // 已知角色 → 不是孤儿
        var raw = localStorage.getItem(k);
        result.orphans.push({ key: k, size: raw ? raw.length * 2 : 0 });
        result.totalBytes += raw ? raw.length * 2 : 0;
    }
    return result;
}
// 清理孤儿键：先备份（确认写成功才删）。返回 { ok, message, removed, backupKey }
function GM_cleanOrphanKeys() {
    var scan = GM_scanOrphanKeys();
    if (!scan.ok) return scan;
    if (scan.orphans.length === 0) { scan.message = '没有孤儿键，无需清理'; scan.removed = 0; return scan; }
    var backup = {};
    for (var i = 0; i < scan.orphans.length; i++) backup[scan.orphans[i].key] = localStorage.getItem(scan.orphans[i].key);
    var ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    var backupKey = 'ext_orphan_backup_' + ts;
    try {
        GM_setValue(backupKey, backup);
        if (GM_getValue(backupKey, null) === null) { scan.message = '备份写入失败，已取消删除'; return scan; }
    } catch (e) {
        scan.message = '备份写入失败：' + ((e && e.message) || e); return scan;
    }
    var removed = 0;
    for (var j = 0; j < scan.orphans.length; j++) { GM_deleteValue(scan.orphans[j].key); removed++; }
    scan.removed = removed;
    scan.backupKey = backupKey;
    return scan;
}