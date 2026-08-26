// ============================================================
// wg-auto-zml-panel.js —— 自命令面板管理
// ------------------------------------------------------------
//   从 wg-auto-zml.js 拆分而来
//   包含：_zmlLayerIndex, _zmlVue, _zmlCleanup,
//         _zmlClosePanel, _zmlOpenView, _zmlInitMain
// ============================================================
'use strict';

Object.assign(WG, {
    _zmlLayerIndex: null,
    _zmlVue: null,
    _zmlCleanup: function () {
        if (WG._zmlVue) {
            WG._zmlVue.$destroy();
            WG._zmlVue = null;
        }
    },
    _zmlClosePanel: function () {
        WG._zmlLayerIndex = null;
        WG._zmlCleanup();
    },
    _zmlOpenView: function (view) {
        // 关闭旧面板 & 清理 Vue
        WG._zmlClosePanel();

        var html = '', title = '', area = [''];
        if (view === 'main') {
            html = UI.zmlandztjkui;
            title = '自命令';
            area = ['340px', '420px'];
        } else if (view === 'zmlEdit') {
            zml = GM_getValue(roleid + "_zml", zml);
            html = UI.zmlsetting
                + '<div class="item-commands" style="margin-top:8px;border-top:1px solid #555;padding-top:8px;">'
                + '<span class="zml-back-btn" style="cursor:pointer;color:#aaa;">← 返回</span>'
                + '</div>';
            title = '编辑自命令';
            area = ['360px', '480px'];
        } else if (view === 'ztjkEdit') {
            ztjk_item = GM_getValue(roleid + "_ztjk", []);
            html = UI.ztjksetting
                + '<div class="item-commands" style="margin-top:8px;border-top:1px solid #555;padding-top:8px;">'
                + '<span class="zml-back-btn" style="cursor:pointer;color:#aaa;">← 返回</span>'
                + '</div>';
            title = '编辑自定义监控';
            area = ['360px', '480px'];
        }

        var self = WG;
        WG._zmlLayerIndex = layer.open({
            type: 1,
            skin: 'layui-layer-rim',
            area: area,
            title: title,
            content: html,
            end: function () {
                WG._zmlLayerIndex = null;
                WG._zmlCleanup();
            }
        });

        if (view === 'main') WG._zmlInitMain();
        else if (view === 'zmlEdit') WG._zmlInitZmlEdit();
        else if (view === 'ztjkEdit') WG._zmlInitZtjkEdit();
    },
    _zmlInitMain: function () {
        var self = WG;
        WG._zmlVue = new Vue({
            el: '#zmlandztjk',
            data: {},
            created() {
                this.zmldata = zml;
            },
            methods: {
                run: function (v) {
                    WG.zmlfire(v);
                },
                zml: function () {
                    self._zmlOpenView('zmlEdit');
                },
                ztjk: function () {
                    self._zmlOpenView('ztjkEdit');
                },
                startjk: function () {
                    WG.ztjk_func();
                },
                stopjk: function () {
                    if (WG.ztjk_hook) {
                        WG.remove_hook(WG.ztjk_hook);
                        WG.ztjk_hook = undefined;
                        LayerHelper.msg('已取消注入');
                    } else {
                        LayerHelper.msg('未注入');
                    }
                }
            }
        });
    }
});