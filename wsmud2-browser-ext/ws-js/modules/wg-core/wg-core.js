// ============================================================
// wg-core.js —— WG 核心方法
// ------------------------------------------------------------
//   WG 对象的定义 + 核心方法。
//   login() 已拆分至 wg-core-login.js。
//   CSS 样式已拆分至 wg-core-styles.js。
// ============================================================
'use strict';

var WG = window.WG = window.WG || {};
Object.assign(WG, {
    online: false,

    // ---- 反序列化包数据 ----
    deserializePackData: function (data) {
        if (data.items) {
            data.items = data.items.map(arr => {
                const item = {};
                itemKeys.forEach((key, i) => {
                    item[key] = arr[i];
                });
                return item;
            });
        }
        if (data.eqs) {
            data.eqs = data.eqs.map(arr => {
                if (!arr) return null;
                const eq = {};
                eqKeys.forEach((key, i) => {
                    eq[key] = arr[i];
                });
                return eq;
            });
        }
        if (data.selllist) {
            if (data.dialog == "shop") {
                data.selllist = data.selllist.map(arr => {
                    if (!arr) return null;
                    const selllist = {};
                    shopKeys.forEach((key, i) => {
                        selllist[key] = arr[i];
                    });
                    return selllist;
                });
            } else {
                data.selllist = data.selllist.map(arr => {
                    if (!arr) return null;
                    const selllist = {};
                    selllistKeys.forEach((key, i) => {
                        selllist[key] = arr[i];
                    });
                    return selllist;
                });
            }
        }
        if (data.stores) {
            data.stores = data.stores.map(arr => {
                if (!arr) return null;
                const store = {};
                storeKeys.forEach((key, i) => {
                    store[key] = arr[i];
                });
                return store;
            });
        }
        return data;
    },

    // ---- 深拷贝 ----
    smartClone: function (obj) {
        if (typeof structuredClone !== 'undefined') {
            try {
                return structuredClone(obj);
            } catch (e) {
                console.warn('structuredClone failed, fallback to JSON method');
            }
        }
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error('JSON clone failed', e);
            return null;
        }
    },

    // ---- 黑色条块（页面底部抬高） ----
    customDock: function (num) {
        const barId = 'pure-black-raised-bar';
        const styleId = 'pure-black-raised-bar-style';
        const barHeight = 0;
        const raiseAmount = num;
        const oldBar = document.getElementById(barId);
        if (oldBar) oldBar.remove();
        const oldStyle = document.getElementById(styleId);
        if (oldStyle) oldStyle.remove();
        const requiredBodyPadding = barHeight + raiseAmount;
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
            body {
                position: relative !important;
                padding-bottom: ${requiredBodyPadding}px !important;
                box-sizing: border-box !important;
            }
            #${barId} {
                position: absolute;
                bottom: ${raiseAmount}px;
                left: 0;
                width: 100%;
                height: ${barHeight}px;
                background-color: #000000;
                z-index: 9999;
                border: none;
            }
        `;
        document.head.appendChild(styleElement);
        const barElement = document.createElement('div');
        barElement.id = barId;
        document.body.appendChild(barElement);
    },

    // ---- 登录按钮绑定 ----
    init: function () {
        $("li[command=SelectRole]").on("click", function () {
            WG.login();
        });
    },

    // ---- 检查值是否在数组中 ----
    inArray: function (val, arr) {
        for (let i = 0; i < arr.length; i++) {
            let item = arr[i];
            if (item[0] == "<") {
                if (item == val) return true;
            } else {
                if (item != "") {
                    if (val.indexOf(item) >= 0) return true;
                }
            }
        }
        return false;
    },

    // ---- 检查值是否存在于数组或对象中 ----
    hasStr: function (val, arr) {
        if (arr.length == null) {
            for (let item in arr) {
                for (let i of arr[item]) {
                    if (i == val) return true;
                }
            }
        } else {
            for (let i = 0; i < arr.length; i++) {
                let item = arr[i];
                if (item == val) return true;
            }
        }
        return false;
    },

    // ---- 挂机健康自检 ----
    healthCheck: function () {
        try {
            var warnings = [];
            if (typeof window._getCmdQueue === 'function') {
                var queue = window._getCmdQueue();
                if (queue && queue.length > 20) {
                    warnings.push('命令队列积压：' + queue.length + '条');
                }
            }
            var logArea = document.querySelector('.content-message');
            if (logArea && logArea.querySelector('pre')) {
                var pre = logArea.querySelector('pre');
                var childCount = pre.getElementsByTagName('*').length;
                if (childCount > 500) {
                    warnings.push('日志DOM节点过多：' + childCount + '个');
                    var lines = pre.innerHTML.split('\n');
                    if (lines.length > 200) {
                        pre.innerHTML = lines.slice(-100).join('\n');
                    }
                }
                var htmlLen = pre.innerHTML.length;
                if (htmlLen > 50000) {
                    warnings.push('日志内容过长：' + htmlLen + '字符，已截断');
                    pre.innerHTML = pre.innerHTML.slice(-20000);
                }
            }
            var totalSize = 0;
            try {
                for (var key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        totalSize += localStorage.getItem(key).length || 0;
                    }
                }
            } catch (e) { }
            var maxSize = 4 * 1024 * 1024;
            if (totalSize > maxSize) {
                warnings.push('localStorage 已用 ' + (totalSize / 1024 / 1024).toFixed(1) + 'MB，可能接近存储上限');
            }
            if (warnings.length > 0) {
                var msg = '挂机健康检查告警：\n' + warnings.join('\n');
                console.warn('[healthCheck]', msg);
                if (typeof Push !== 'undefined') Push(msg);
                messageAppend('<hir>' + msg + '</hir>');
            }
        } catch (e) {
            console.error('[healthCheck] 检查异常', e);
        }
    },

    // ---- WebSocket 延迟测试 ----
    wsdelaytest: async function () {
        GameState.wsdelay.SetTime = new Date().getTime();
        GameState.wsdelay.SetCount = 1;
        GameState.wsdelay.delay = undefined;
        WG.SendCmd("test");
    }
});