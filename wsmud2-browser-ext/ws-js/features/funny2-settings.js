// funny2-settings.js
// 扩展设置弹窗：游戏设置 + 自动售卖/使用清单
"use strict";

window.__funny2_settings = {
    // 获取/初始化自动售卖/使用清单
    getAutoSellList: function () {
        var rid = unsafeWindow.roleid || window.__funny2.id || '';
        var val = localStorage.getItem(rid + '_autosell');
        return val ? val.split('\n').filter(function (s) { return s.trim(); }) : [];
    },
    getAutoUseList: function () {
        var rid = unsafeWindow.roleid || window.__funny2.id || '';
        var val = localStorage.getItem(rid + '_autouse');
        return val ? val.split('\n').filter(function (s) { return s.trim(); }) : [];
    },

    // 独立设置弹窗
    overlay: null,
    showExtSettings: function () {
        var self = window.__funny2_settings;
        if (self.overlay) return;

        var F = window.__funny2;
        var rid = unsafeWindow.roleid || F.id || '';
        var sellText = (localStorage.getItem(rid + '_autosell') || '').replace(/\\n/g, '\n');
        var useText = (localStorage.getItem(rid + '_autouse') || '').replace(/\\n/g, '\n');

        var overlay = $('<div class="ext-settings-overlay"></div>').css({
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)', zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        });
        var dialog = $('<div class="ext-settings-dialog"></div>').css({
            background: '#1a1a2e', border: '1px solid #555', borderRadius: '12px',
            width: '80vw', minHeight: '75vh', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', color: '#ccc', fontSize: '14px',
            boxShadow: '0 0 30px rgba(0,0,0,0.5)'
        });

        // 标题栏
        var header = $('<div class="ext-settings-header"></div>').css({
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid #555', fontSize: '16px', fontWeight: 'bold'
        }).append(
            $('<span>游戏设置</span>'),
            $('<span class="ext-settings-close" style="cursor:pointer;font-size:20px;line-height:1;">&times;</span>')
        );
        dialog.append(header);

        // 内容区
        var body = $('<div class="ext-settings-body"></div>').css({
            padding: '16px', overflowY: 'auto', flex: 1
        });

        // ===== 1. 所有游戏设置 =====
        body.append(UI.syssetting());

        // ===== 2. 自动售卖/使用分隔线 =====
        body.append($('<hr style="border:1px solid #555;margin:16px 0;">'));
        body.append($('<h3 style="margin:0 0 12px;color:#eee;font-size:15px;">扩展功能</h3>'));

        // 自动售卖
        body.append(
            $('<div style="margin-bottom:12px;"><label style="display:block;margin-bottom:4px;color:#eee;">自动售卖清单（每行一个物品名，匹配 @zdsell 使用）</label></div>'),
            $('<textarea class="ext-sell-textarea" style="width:100%;height:80px;resize:vertical;background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:6px;font-size:13px;font-family:inherit;"></textarea>').val(sellText)
        );

        // 自动使用
        body.append(
            $('<div style="margin-bottom:12px;margin-top:12px;"><label style="display:block;margin-bottom:4px;color:#eee;">自动使用清单（每行一个物品名，匹配 @zduse 使用）</label></div>'),
            $('<textarea class="ext-use-textarea" style="width:100%;height:80px;resize:vertical;background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:6px;font-size:13px;font-family:inherit;"></textarea>').val(useText)
        );

        // 保存按钮
        body.append(
            $('<div style="text-align:right;margin-top:12px;display:flex;gap:8px;justify-content:flex-end;"></div>').append(
                $('<span class="ext-settings-save" style="display:inline-block;padding:6px 20px;background:#4a6fa5;color:#fff;border-radius:4px;cursor:pointer;">保存设置</span>')
            )
        );
        dialog.append(body);
        overlay.append(dialog);
        $('body').append(overlay);

        self.overlay = overlay;

        // ===== 初始化设置值 + 绑定事件 =====
        self.initPopupSettings(body);

        // 关闭函数
        function closeExtSettings() {
            var sellVal = dialog.find('.ext-sell-textarea').val();
            var useVal = dialog.find('.ext-use-textarea').val();
            localStorage.setItem(rid + '_autosell', sellVal);
            localStorage.setItem(rid + '_autouse', useVal);
            overlay.remove();
            self.overlay = null;
            messageAppend('<hiy>游戏设置已保存</hiy>');
        }

        // × 关闭
        header.find('.ext-settings-close').on('click', closeExtSettings);
        // 遮罩关闭
        overlay.on('click', function (e) {
            if (e.target === overlay[0]) closeExtSettings();
        });
        // ESC 关闭
        var escHandler = function (e) {
            if (e.key === 'Escape') {
                closeExtSettings();
                $(document).off('keydown', escHandler);
            }
        };
        $(document).on('keydown', escHandler);

        // 保存按钮
        dialog.find('.ext-settings-save').on('click', function () {
            closeExtSettings();
        });
    },

    // 初始化弹窗内所有游戏设置的值和事件
    initPopupSettings: function (container) {
        var F = window.__funny2;
        var rid = unsafeWindow.roleid || F.id || '';

        function getVal(key) {
            try { var v = unsafeWindow.GM_getValue(key); if (v !== undefined && v !== null) return v; } catch(e) {}
            var stored = localStorage.getItem(key);
            if (!stored) return undefined;
            try { return JSON.parse(stored); } catch(e) { return stored; }
        }
        function setVal(key, val) {
            try { unsafeWindow.GM_setValue(key, val); } catch(e) {}
            localStorage.setItem(key, JSON.stringify(val));
        }

        // ---- 开关初始化 ----
        container.find('.setting-item2[for]').each(function () {
            var $item = $(this);
            var key = $item.attr('for');
            var val = getVal(rid + '_' + key);
            if (val === true || val === 'true' || val === '开') {
                $item.find('.switch2').addClass('on');
                $item.find('.switch-text').html('开');
            } else {
                $item.find('.switch2').removeClass('on');
                $item.find('.switch-text').html('关');
            }
        });

        // 开关点击事件
        container.find('.switch2').off('click').on('click', function () {
            var $this = $(this);
            var $item = $this.closest('.setting-item2[for]');
            var key = $item.attr('for');
            if ($this.is('.on')) {
                $this.removeClass('on');
                $this.find('.switch-text').html('关');
                setVal(rid + '_' + key, false);
                if (typeof window[key] !== 'undefined') window[key] = false;
            } else {
                $this.addClass('on');
                $this.find('.switch-text').html('开');
                setVal(rid + '_' + key, true);
                if (typeof window[key] !== 'undefined') window[key] = true;
            }
            if (key === 'rainbow_name' && typeof unsafeWindow.rainbowplayer === 'function') {
                unsafeWindow.rainbowplayer();
            }
        });

        // ---- 家族选择 ----
        container.find('#family').val(getVal(rid + '_family') || '武当').off('change').on('change', function () {
            setVal(rid + '_family', $(this).val());
        });

        // ---- 挂机选项 ----
        container.find('#autowork').val(getVal(rid + '_autowork') ?? '').off('change').on('change', function () {
            setVal(rid + '_autowork', $(this).val());
            if (typeof autowork !== 'undefined') autowork = $(this).val();
        });

        // ---- 自命令显示位置 ----
        container.find('#zmlshowsetting').val(getVal(rid + '_zmlshowsetting') || '0').off('change').on('change', function () {
            setVal(rid + '_zmlshowsetting', $(this).val());
        });

        // ---- 界面配色 ----
        container.find('#color_select').val(getVal('color_select') || 'normal').off('change').on('change', function () {
            setVal('color_select', $(this).val());
        });

        // ---- 技能CD/BuffCD颜色 ----
        container.find('#skillCDColor').val(getVal(rid + '_skillCDColor') || 'hir').off('change').on('change', function () {
            setVal(rid + '_skillCDColor', $(this).val());
            if (typeof skillCDColor !== 'undefined') skillCDColor = $(this).val();
        });
        container.find('#buffCDColor').val(getVal(rid + '_buffCDColor') || 'hig').off('change').on('change', function () {
            setVal(rid + '_buffCDColor', $(this).val());
            if (typeof buffCDColor !== 'undefined') buffCDColor = $(this).val();
        });

        // ---- 推送方式 ----
        container.find('#pushType').val(getVal('_pushType') || '0').off('change').on('change', function () {
            setVal('_pushType', $(this).val());
        });

        // ---- 文本输入 ----
        var inputIds = [
            { id: 'loginhml', prefix: true },
            { id: 'BossName', prefix: true },
            { id: 'auto_command', prefix: true },
            { id: 'die_str', prefix: true },
            { id: 'custom_dock', prefix: true },
            { id: 'shield', prefix: false },
            { id: 'shieldkey', prefix: false },
            { id: 'pushToken', prefix: false },
            { id: 'backimageurl', prefix: true },
            { id: 'autoBuy', prefix: true },
            { id: 'unauto_pfm', prefix: true },
            { id: 'fj_sc', prefix: true },
            { id: 'fjList', prefix: true },
            { id: 'zdyskilllist', prefix: true },
            { id: 'event_poll_interval', prefix: true },
        ];
        inputIds.forEach(function (item) {
            var $el = container.find('#' + item.id);
            if (!$el.length) return;
            var storageKey = item.prefix ? (rid + '_' + item.id) : ('_' + item.id);
            if (item.id === 'shield' || item.id === 'shieldkey') storageKey = '_' + item.id;
            if (item.id === 'pushToken') storageKey = '_pushToken';
            if (item.id === 'pushType') storageKey = '_pushType';
            if (item.id === 'color_select') storageKey = 'color_select';
            var saved = getVal(storageKey);
            if (saved !== null && saved !== undefined) $el.val(saved);
            $el.off('change focusout').on('change focusout', function () {
                setVal(storageKey, $(this).val());
            });
        });

        // ---- 活动轮询间隔 ----
        container.find('#event_poll_interval').off('change').on('change', function () {
            var val = parseInt($(this).val()) || 1;
            if (val < 1) val = 1;
            if (typeof event_poll_interval !== 'undefined') event_poll_interval = val;
            if (typeof GlobalInit !== 'undefined' && GlobalInit.restartEventPolling) {
                GlobalInit.restartEventPolling();
            }
        });

        // ---- 自定义按钮初始化 ----
        var zdyBtnList = (function () {
            try { var v = unsafeWindow.GM_getValue(rid + '_zdy_btnlist'); if (v) return v; } catch(e) {}
            try { var v = JSON.parse(localStorage.getItem(rid + '_zdy_btnlist')); if (v) return v; } catch(e) {}
            return [{name:'无',send:''},{name:'无',send:''},{name:'无',send:''},{name:'无',send:''},{name:'无',send:''},{name:'无',send:''}];
        })();
        var keyitem = ['Q','W','E','R','T','Y'];
        keyitem.forEach(function (k, i) {
            container.find('#name' + k).val(zdyBtnList[i] && zdyBtnList[i].name || '无');
            container.find('#send' + k).val(zdyBtnList[i] && zdyBtnList[i].send || '');
        });
        container.find('.savebtn').off('click').on('click', function () {
            var tmp = [];
            keyitem.forEach(function (k) {
                var pname = container.find('#name' + k).val();
                var psend = container.find('#send' + k).val();
                tmp.push({ name: pname || '无', send: psend || '' });
            });
            setVal(rid + '_zdy_btnlist', JSON.stringify(tmp));
            AddContent('<hiy>自定义按钮已保存\n</hiy>');
        });

        // ---- 清空技能 json ----
        container.find('.clear_skillJson').off('click').on('click', function () {
            setVal(rid + '_zdyskilllist', '');
            setVal(rid + '_zdyskills', false);
            container.find('#zdyskillsswitch').removeClass('on').find('.switch-text').html('关');
            container.find('#zdyskilllist').val('');
            AddContent('<hiy>已清空自定义技能\n</hiy>');
        });

        // ---- 上传/下载/恢复默认配置 ----
        container.find('.backup_btn').off('click').on('click', function () {
            if (typeof WG !== 'undefined' && WG.make_config) WG.make_config();
        });
        container.find('.load_btn').off('click').on('click', function () {
            if (typeof WG !== 'undefined' && WG.load_config) WG.load_config();
        });
        container.find('.reset_default_btn').off('click').on('click', function () {
            if (typeof WG !== 'undefined' && WG.reset_default) WG.reset_default();
        });
    }
};