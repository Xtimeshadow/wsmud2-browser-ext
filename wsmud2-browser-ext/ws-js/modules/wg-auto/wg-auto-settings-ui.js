// ============================================================
// wg-auto-settings-ui.js —— 设置面板 UI 创建
// ------------------------------------------------------------
//   从 wg-auto-settings.js 拆分而来
//   包含：_settingUI() —— 弹窗样式、结构、搜索栏
// ============================================================
'use strict';

Object.assign(WG, {
    _settingUI: function () {
        // 【2026-08-10 优化】样式用固定 id 注入（先移除旧的再插入，避免每次打开累积 <style> 标签）；
        // 去掉遮罩 backdrop-filter 全屏模糊（性能杀手），改纯色背景
        $("#ext-setting-style").remove();
        // 【2026-08-26 统一弹窗风格】恢复26.4版本样式 + 自定义组件样式
        $('<style id="ext-setting-style">' +
        '#ext-setting-mask{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;font-family:"Microsoft YaHei UI","Microsoft YaHei",sans-serif;}' +
        '#ext-setting-dialog{width:580px;max-width:94vw;max-height:86vh;display:flex;flex-direction:column;background:#1a1a2e;border:1px solid #555;border-radius:12px;box-shadow:0 0 30px rgba(0,0,0,0.5);color:var(--ext-text-bright, #c0c0c0);overflow:hidden;animation:extDlgIn .15s ease;}' +
        '@keyframes extDlgIn{from{opacity:0;transform:translateY(10px) scale(.98);}to{opacity:1;transform:none;}}' +
        '#ext-setting-title{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #555;background:transparent;}' +
        '#ext-setting-title .ext-setting-title-text{font-size:14px;font-weight:600;color:var(--ext-gold, #FFD700);letter-spacing:.03em;}' +
        '#ext-setting-close{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:1px solid #555;color:var(--ext-text, #999999);font-size:18px;line-height:1;cursor:pointer;background:#1a1a2e;user-select:none;font-family:Arial;transition:background .2s,border-color .2s,transform .15s;}' +
        '#ext-setting-close:hover{background:var(--ext-text, #999999);border-color:var(--ext-text, #999999);color:#000000;transform:rotate(90deg);}' +
        '#ext-setting-body{padding:10px 14px;overflow-y:auto;flex:1 1 auto;}' +
        '#ext-setting-body::-webkit-scrollbar{width:6px;}' +
        '#ext-setting-body::-webkit-scrollbar-track{background:transparent;}' +
        '#ext-setting-body::-webkit-scrollbar-thumb{background:#555;border-radius:3px;}' +
        '#ext-setting-body::-webkit-scrollbar-thumb:hover{background:#777;}' +
        /* 自定义组件样式 */
        '.ext-setting-section{font-size:14px;font-weight:600;color:#FFD700;padding:10px 0 6px 0;margin:8px 0 4px 0;border-bottom:1px solid #444;}' +
        '.ext-setting-section:first-child{margin-top:0;}' +
        '.ext-setting-item{display:flex;align-items:center;padding:4px 2px;min-height:28px;}' +
        '.ext-setting-item.ext-desc,.ext-setting-item.ext-info{color:#888;font-size:11px;text-align:center;display:block;padding:2px 0;}' +
        '.ext-label{flex:0 0 auto;min-width:120px;font-size:13px;color:#ccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;}' +
        '.ext-control{flex:1 1 auto;display:flex;align-items:center;justify-content:flex-start;}' +
        '.ext-input{background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:4px 8px;font-size:12px;outline:none;box-sizing:border-box;}' +
        '.ext-input:focus{border-color:#777;}' +
        '.ext-select{background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:3px 4px;font-size:12px;outline:none;cursor:pointer;}' +
        '.ext-select:focus{border-color:#777;}' +
        '.ext-textarea{background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:4px 6px;font-size:12px;outline:none;resize:vertical;font-family:inherit;box-sizing:border-box;}' +
        '.ext-textarea:focus{border-color:#777;}' +
        '.ext-button-row{display:flex;flex-wrap:wrap;gap:6px;padding:2px 0;}' +
        '.ext-btn{display:inline-block;padding:3px 12px;border:1px solid #666;border-radius:4px;color:#aaa;font-size:12px;cursor:pointer;background:transparent;user-select:none;transition:background .2s,border-color .2s,color .2s;}' +
        '.ext-btn:hover{background:#555;border-color:#888;color:#fff;}' +
        '.ext-btn-danger{border-color:#c0392b;color:#e74c3c;}' +
        '.ext-btn-danger:hover{background:#c0392b;border-color:#c0392b;color:#fff;}'
        + '</style>').appendTo('head');
        var shell = '<div id="ext-setting-mask">'
            + '<div id="ext-setting-dialog">'
            + '<div id="ext-setting-title"><span class="ext-setting-title-text">武神传说插件设置 <span id="ext-storage-usage" style="font-size:11px;color:var(--ext-dim, #808080);font-weight:normal;"></span></span><span id="ext-setting-close" title="关闭">×</span></div>'
            // 【2026-08-14 设置搜索】搜索条：输入关键词即时过滤设置项与分组
            + '<div id="ext-setting-search" style="padding:6px 14px;border-bottom:1px solid #2a2a2a;">'
            + '<input id="ext-setting-search-input" type="text" placeholder="🔍 搜索设置项（如：推送、屏蔽、技能、保活）…" style="width:100%;box-sizing:border-box;padding:6px 10px;background:#14141f;color:var(--ext-text-bright,#c0c0c0);border:1px solid #555;border-radius:3px;outline:none;font-size:12px;">'
            + '</div>'
            + '<div id="ext-setting-body">' + UI.syssetting() + '</div>'
            + '</div></div>';
        $("body").append(shell);
        // 【2026-08-11 存储管理】显示配置占用（localStorage 约 5MB 配额，超限时 GM_setValue 已会提示）
        try {
            var _usage = 0, _cnt = 0, _klist = GM_listValues();
            for (var _i = 0; _i < _klist.length; _i++) { _usage += (localStorage.getItem(_klist[_i]) || '').length; _cnt++; }
            var _usageText = _usage > 1048576 ? (_usage / 1048576).toFixed(2) + 'MB' : Math.ceil(_usage / 1024) + 'KB';
            $("#ext-storage-usage").text('（配置 ' + _cnt + ' 项 · 占用 ' + _usageText + ' / 约5MB）');
        } catch (e) { }
        // 关闭：× 按钮 / 点遮罩空白处 / ESC
        $("#ext-setting-close").off('click').on('click', function () { $("#ext-setting-mask").remove(); });
        $("#ext-setting-mask").off('click').on('click', function (e) {
            if (e.target && e.target.id == "ext-setting-mask") $("#ext-setting-mask").remove();
        });
        $(document).off('keydown.extSetting').on('keydown.extSetting', function (e) {
            if (e.keyCode == 27 && $("#ext-setting-mask").length) {
                $("#ext-setting-mask").remove();
                $(document).off('keydown.extSetting');
            }
        });

        // 【2026-08-26 重写搜索】过滤自定义组件项，输入框随匹配项一起显示/隐藏
        $("#ext-setting-search-input").off('input').on('input', function () {
            var kw = $.trim($(this).val()).toLowerCase();
            var $body = $("#ext-setting-body");
            if (!kw) {
                $body.find(".ext-setting-section").css('display', '');
                $body.find(".ext-setting-item").css('display', '');
                return;
            }
            $body.find(".ext-setting-section").each(function () {
                var $section = $(this);
                var $items = $section.nextUntil(".ext-setting-section").filter(".ext-setting-item");
                var any = false;
                $items.each(function () {
                    var $it = $(this);
                    var hit = $it.text().toLowerCase().indexOf(kw) >= 0;
                    $it.css('display', hit ? '' : 'none');
                    if (hit) any = true;
                });
                $section.css('display', any ? '' : 'none');
            });
        });
    }
});