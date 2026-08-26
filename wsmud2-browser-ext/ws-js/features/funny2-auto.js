// funny2-auto.js
// @zdsell / @zduse 自动售卖/使用处理
"use strict";

window.__funny2_auto = {
    init: function () {
        // 劫持 SendChatMessage 拦截 @zdsell / @zduse
        const _origSendChatMessage = unsafeWindow.SendChatMessage;
        unsafeWindow.SendChatMessage = function () {
            const msg = $(".sender-box").val();
            if (msg === '@zdsell') {
                $(".sender-box").val('').focus();
                window.__funny2_auto.autoProcessPack('sell');
                return;
            }
            if (msg === '@zduse') {
                $(".sender-box").val('').focus();
                window.__funny2_auto.autoProcessPack('use');
                return;
            }
            return _origSendChatMessage.apply(this, arguments);
        };
    },

    // 遍历背包执行操作
    autoProcessPack: function (mode) {
        var list = [];
        var rid = unsafeWindow.roleid || window.__funny2.id || '';
        if (mode === 'sell') {
            var val = localStorage.getItem(rid + '_autosell');
            list = val ? val.split('\n').filter(function (s) { return s.trim(); }) : [];
        } else {
            var val = localStorage.getItem(rid + '_autouse');
            list = val ? val.split('\n').filter(function (s) { return s.trim(); }) : [];
        }
        if (!list.length) {
            AddContent('<hir>' + (mode === 'sell' ? '自动售卖' : '自动使用') + '清单为空，请先在扩展设置中填写\n</hir>');
            return;
        }
        var items = unsafeWindow.Dialog && unsafeWindow.Dialog.pack && unsafeWindow.Dialog.pack.items;
        if (!items || !items.length) {
            AddContent('<hir>背包数据为空，请先打开背包\n</hir>');
            return;
        }
        var cmd = mode === 'sell' ? 'sell' : 'use';
        var count = 0;
        items.forEach(function (item) {
            var match = list.some(function (name) {
                return item.name.indexOf(name) !== -1 || name.indexOf(item.name) !== -1;
            });
            if (match && item.count > 0) {
                SendCommand(cmd + ' ' + item.id);
                count++;
            }
        });
        AddContent('<hiy>' + (mode === 'sell' ? '自动售卖' : '自动使用') + '完成，共处理 ' + count + ' 项\n</hiy>');
    }
};