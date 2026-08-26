// ============================================================
// wslogin-crypto.js —— 密码加密/解密工具
// ------------------------------------------------------------
// 定义全局加密函数，供 wslogin.js 使用。
// 密码加密：每个字符转两位 hex，整体循环右移 1 位后再 base64。
// ============================================================
'use strict';

// 密码加密
function _encryptPassword(password) {
    let hexString = "";
    for (let i = 0; i < password.length; i++) {
        const hex = password.charCodeAt(i).toString(16);
        hexString += ("0" + hex).slice(-2);
    }
    const shiftedHex = hexString.slice(-1) + hexString.slice(0, -1);
    return btoa(shiftedHex);
}

// 密码解密：加密的逆过程
function _decryptPassword(encoded) {
    // 以 { 开头的是已取消的"主密码保护"（AES-GCM v2）数据，无法再解密
    if (typeof encoded === 'string' && encoded.charAt(0) === '{') {
        console.warn("[WSMUD] 检测到已取消的主密码加密数据（v2），无法解密，请重新登录一次以重新保存密码");
        return null;
    }
    try {
        const shiftedHex = atob(encoded);
        const hexString = shiftedHex.slice(1) + shiftedHex.slice(0, 1);
        let password = "";
        for (let i = 0; i < hexString.length; i += 2) {
            const hexPair = hexString.substr(i, 2);
            const charCode = parseInt(hexPair, 16);
            password += String.fromCharCode(charCode);
        }
        return password;
    } catch (e) {
        console.error("密码解密失败:", e);
        return null;
    }
}