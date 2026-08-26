// ============================================================
// settings-store.js —— 配置云端存储（分享/备份）
// ------------------------------------------------------------
// 从 audio-push.js 拆分出来的 SettingsStore 对象。
// 提供配置的云端分享和备份恢复功能。
// ============================================================
'use strict';

var SettingsStore = {
    serverUrl: "https://wsmud.ii74.com",
    shareJson: function (usernaem, json) {
        $.post(SettingsStore.serverUrl + "/sharejk", {
            username: usernaem,
            json: JSON.stringify(json)
        }, (res) => {
            if (res && res.code == 0) {
                GM_setClipboard(res.shareid);
                messageAppend("复制成功" + res.msg + ":" + res.shareid);
            } else {
                messageAppend("失败了" + res.msg);
            }
        })
    },
    getShareJson: function (id, callback) {
        $.post(SettingsStore.serverUrl + "/getjk", {
            shareid: id
        }, (res) => {
            if (res && res.code == 0) {
                callback(res);
            } else {
                messageAppend("失败了" + res.msg);
            }
        });
    },
    getUserConfig: function (id, callback) {
        $.get(SettingsStore.serverUrl + "/User/Load?id=" + id, (res) => {
            if (res && res != "") {
                callback(res);
            } else {
                messageAppend("失败了");
            }
        });
    },
    uploadUserConfig: function (id, data, callback) {
        $.post(SettingsStore.serverUrl + "/User/Backup", {
            id: id,
            data: JSON.stringify(data)
        }, (res) => {
            if (res && res == "true") {
                callback(res);
            } else {
                messageAppend("失败了,或配置已存在");
            }
        });
    }
};