// ============================================================
// wg-auto-config.js —— 配置管理（入口模块）
// ------------------------------------------------------------
//   从 wg-auto.js 拆分而来
//   本文件仅保留入口，实际实现在以下子模块：
//     wg-auto-config-keys.js  —— 键判定工具（_isKeyOfRole / _isRoleKey / _isSensitiveLsKey）
//     wg-auto-config-cloud.js —— 云端上传/下载（make_config / load_config）
//     wg-auto-config-local.js —— 本地备份/恢复/清理（backup_config / restore_config / clear_local_login / clear_role_data / reset_default）
// ============================================================
'use strict';
// 实际实现在子模块中，通过 Object.assign(WG, { ... }) 注入