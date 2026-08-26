// ============================================================
// dialog-friend.js —— 好友面板
// 提取自 dialog-panels.js（原第 4623-4629 行）
// ============================================================
'use strict';
Dialog.friend = {
    'show': function() {
        if (!this.data)
            return SendCommand('friend');
    },
    'onData': function(_t1159) {}
};