// ============================================================
// newclient-shim.js —— 新版客户端适配补丁（仅新模式加载）
// ------------------------------------------------------------
// 问题：新版客户端（dist_new/ws.js）的 Dialog 是"懒初始化"——
//   Dialog.show(name) 不带数据时才会创建面板元素（this.element），
//   直接收到服务器的 dialog 数据消息（Dialog.show(name, data) → onData）
//   若面板从未打开过，this.element 是 undefined → onData 里 .html() 崩溃。
// 扩展会直接发 "events"/"relation" 等命令（活动轮询、登录初始化），
//   服务器返回的 dialog 数据就会触发这个崩溃（游戏消息区刷报错）。
// 本补丁：拦截新客户端的 dialog 分发，数据到达时若面板元素未创建，
//   先调用 show() 补建元素（再隐藏面板，不弹窗），让 onData 正常渲染。
// 注：若新客户端内部用模块私有引用（不走 window.Process/window.Dialog），
//   这些补丁是无效兜底；主要路径（window.Process.dialog）通常能拦住。
// ============================================================
(function () {
    'use strict';
    var IS_NEW = window.__extNewClientMode || !!document.querySelector('script[src*="dist_new"]');
    if (!IS_NEW) return;

    function patchDialogCrash() {
        var D = window.Dialog;
        if (!D) return;
        // ① Dialog.show：数据到达且面板元素未创建时，先补建元素
        if (typeof D.show === 'function' && !D._extPatched) {
            var origShow = D.show;
            D.show = function (name, data) {
                try {
                    var dlg = this[name];
                    if (data && dlg && !dlg.element) {
                        _ensureDialogReady(dlg, name, D);
                    }
                } catch (e) { }
                var _ret = origShow.apply(this, arguments);
                // 【自愈】江湖面板打开后延迟检查内容，为空则补发 jh（游戏自身经常不自动拉数据）
                if (name === 'jh') _jhCheckHeal(1500);
                return _ret;
            };
            D._extPatched = true;
        }
        // ② Process.dialog：拦在分发前，先补建元素（与①互为兜底）
        var P = window.Process;
        if (P && typeof P.dialog === 'function' && !P._extDialogPatched) {
            var origDialog = P.dialog;
            P.dialog = function (data) {
                var name = data && data.dialog;
                var _isJh = name === 'jh';
                try {
                    // 诊断标记：记录最后一次 dialog 消息类型（便于排查 onData 崩溃）
                    try { document.body.setAttribute('data-ext-last-dialog', String(name)); } catch (e) { }
                    var dlg = name && D && D[name];
                    if (dlg && !dlg.element) {
                        _ensureDialogReady(dlg, name, D);
                    }
                } catch (e) { }
                try {
                    var _ret = origDialog.apply(this, arguments);
                    if (_isJh) {
                        // 收到江湖主数据(fbs) → 数据管道正常，重置自愈重试计数
                        if (data && data.fbs) _jhHealState.count = 0;
                        // 收到江湖消息后延迟检查渲染结果，为空则补发 jh
                        _jhCheckHeal(800);
                    }
                    return _ret;
                } catch (e) {
                    // 【自愈】渲染崩溃（新客户端 onData 的 null 解引用会在分发时抛出）
                    // 补发 jh 让服务端重发数据，同时保留游戏原有的报错打印行为
                    if (_isJh) { try { _jhTryHeal(); } catch (e2) { } }
                    throw e;
                }
            };
            P._extDialogPatched = true;
        }
    }

    // 确保对话框就绪：先初始化基础 Dialog（titleElement/contentElement 等），
    // 再调用面板自己的 show() 创建 this.element（若没有 show() 或建不出，直接补占位元素）。
    function _ensureDialogReady(dlg, name, D) {
        try {
            // 基础 Dialog 未初始化时，dlg.show() 里的 Dialog.title()/appendTo(contentElement) 会崩
            if (!D.isInit && typeof D.init === 'function') {
                D.init();
            }
        } catch (e) { }
        if (typeof dlg.show === 'function') {
            try {
                dlg.show(name);   // 创建面板元素（show 通常忽略参数）
            } catch (e) { }
        }
        if (!dlg.element) {
            // 兜底：show() 不存在或没建出元素 → 手动补一个占位容器，保证 onData 不崩
            try {
                dlg.element = $(document.createElement('div')).addClass('dialog-' + name).attr('data-ext-placeholder', '1');
            } catch (e2) { }
        }
        // 面板若被打开（isShow=true），关掉，避免弹窗
        try {
            if (dlg.isShow && typeof D.close === 'function') D.close();
        } catch (e3) { }
    }

    // ---- 【自愈】江湖面板空内容/渲染崩溃自愈 ----
    // 背景：新客户端 ws.js 的 Dialog.jh.onData 对某些 jh 消息存在无保护的 null 解引用
    // （编译前逻辑形如 he[data.t][items][data.index]，he/t/items 为 null 时崩溃），
    // 游戏日志报 "解析数据时发生了一个错误 ... Cannot read properties of null (reading '1')"。
    // 崩溃后数据没进缓存 → 之后每次打开江湖都是空内容（黑屏），且游戏不会自动重新拉数据。
    // 本自愈：面板打开 / 收到 jh 消息 / 渲染崩溃时，检测内容为空则自动补发 'jh' 指令，
    // 让服务端重新下发面板数据；带 6 秒防抖 + 每轮最多 3 次重试，避免刷屏。
    var _jhHealState = { lastTry: 0, count: 0 };
    function _sendCmd(cmd) {
        try {
            if (typeof SendCommand === 'function') { SendCommand(cmd); return; }
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow && typeof unsafeWindow.SendCommand === 'function') { unsafeWindow.SendCommand(cmd); return; }
            if (window.GameState && typeof window.GameState.send === 'function') { window.GameState.send(cmd); }
        } catch (e) { }
    }
    function _jhPanelEmpty() {
        try {
            var D = window.Dialog;
            if (!D || !D.jh) return false;
            var el = D.jh.element;
            if (!el) return false;
            var left = null;
            if (typeof $ === 'function' && $(el).find) { var _fb = $(el).find('.fb-left'); left = _fb && _fb.length ? _fb[0] : null; }
            if (!left && el.querySelector) left = el.querySelector('.fb-left');
            if (!left) return true;   // 面板开着但连左侧列表容器都没有 → 视为空
            var count = left.querySelectorAll ? left.querySelectorAll('.fb-item, .fam-item').length : (left.children ? left.children.length : 0);
            return count === 0;
        } catch (e) { return false; }
    }
    function _jhTryHeal() {
        try {
            var D = window.Dialog;
            if (!D || !D.jh) return;
            var now = Date.now();
            if (now - _jhHealState.lastTry < 6000) return;   // 防抖：6 秒内只自愈一次
            if (_jhHealState.count >= 3) return;             // 每轮最多重试 3 次，避免无限刷
            _jhHealState.lastTry = now;
            _jhHealState.count++;
            _sendCmd('jh');
        } catch (e) { }
    }
    function _jhCheckHeal(delay) {
        setTimeout(function () {
            try {
                var D = window.Dialog;
                if (!D || !D.jh || !D.jh.isShow) return;      // 面板没开就不折腾
                if (!_jhPanelEmpty()) { _jhHealState.count = 0; return; }   // 内容有了 → 自愈成功
                _jhTryHeal();
            } catch (e) { }
        }, delay);
    }

    // 新客户端在登录时会重新暴露部分全局，登录后再补一次补丁（防被覆盖）
    // 注意：WG 由扩展脚本在 DOMContentLoaded 后异步加载，本脚本早于 WG 就绪，
    // 需轮询等 WG 出现后再挂登录钩子。
    function reapplyOnLogin(retry) {
        try {
            if (typeof WG === 'undefined' || !WG || typeof WG.add_hook !== 'function') {
                if (retry < 10) setTimeout(function () { reapplyOnLogin(retry + 1); }, 300);
                return;
            }
            WG.add_hook('login', function () {
                setTimeout(patchDialogCrash, 500);
            });
        } catch (e) { }
    }

    // DOM 就绪后立即补丁
    function ready() {
        patchDialogCrash();
        reapplyOnLogin(0);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
    } else {
        ready();
    }
})();
