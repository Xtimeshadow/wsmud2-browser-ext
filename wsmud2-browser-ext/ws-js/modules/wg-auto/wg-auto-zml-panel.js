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
        if (WG._zmlLayerIndex) {
            layer.close(WG._zmlLayerIndex);
        }
        WG._zmlLayerIndex = null;
        WG._zmlCleanup();
    },
    _zmlOpenView: function (view) {
        // 关闭旧面板 & 清理 Vue
        WG._zmlClosePanel();

        // 所有视图统一使用同一个弹窗大小（与触发器编辑器一致）
        var area = ['80vw', '75vh'];
        var html = UI.zmlandztjkui;
        var title = '自命令';

        // 注入样式：关闭按钮白色、按钮统一样式、交换动画
        if (!document.getElementById('zml-panel-style')) {
            var $style = $('<style id="zml-panel-style"></style>');
            $style.text(
                '#zmlandztjk .zml-btn {' +
                '  display:inline-block;padding:2px 10px;border:1px solid #555;border-radius:4px;' +
                '  background:#14141f;cursor:pointer;font-size:12px;text-align:center;margin:0 2px;' +
                '  white-space:nowrap;' +
                '}' +
                '#zmlandztjk .zml-btn:hover {opacity:0.8;}' +
                '#zmlandztjk .zml-btn-run {border-color:#8cf;color:#8cf;}' +
                '#zmlandztjk .zml-btn-edit {border-color:#888;color:#ccc;}' +
                '#zmlandztjk .zml-btn-quick {border-color:#8c8;color:#8c8;}' +
                '#zmlandztjk .zml-btn-quick-off {border-color:#555;color:#888;}' +
                '#zmlandztjk .zml-btn-move {border-color:#555;color:#aaa;}' +
                '#zmlandztjk .zml-btn-action {border-color:#555;color:#aaa;}' +
                '#zmlandztjk .zml-btn-add {border-color:#8cf;color:#8cf;padding:3px 14px;}' +
                '#zmlandztjk .zml-move-wrap {display:flex;width:90px;}' +
                '#zmlandztjk .zml-move-wrap .zml-btn-move {flex:1;margin:0;}' +
                '#zmlandztjk .zml-move-wrap .zml-btn-move:first-child {border-radius:4px 0 0 4px;}' +
                '#zmlandztjk .zml-move-wrap .zml-btn-move:last-child {border-radius:0 4px 4px 0;}' +
                /* 交换动画：transition-group */
                '.zml-flip-move {transition:transform 0.25s ease;}' +
                '.zml-flip-enter-active {transition:all 0.25s ease;}' +
                '.zml-flip-leave-active {transition:all 0.25s ease;position:absolute;}' +
                '.zml-flip-enter {opacity:0;transform:translateY(-10px);}' +
                '.zml-flip-leave-to {opacity:0;transform:translateY(10px);}'
            );
            $('head').append($style);
        }

        // 设置关闭按钮白色
        var closeBtnStyle = document.getElementById('zml-close-btn-style');
        if (!closeBtnStyle) {
            closeBtnStyle = document.createElement('style');
            closeBtnStyle.id = 'zml-close-btn-style';
            closeBtnStyle.textContent =
                '.layui-layer-setwin .layui-layer-close1 { background: none !important; text-decoration:none !important; outline:none; border-bottom:none !important; }' +
                '.layui-layer-setwin .layui-layer-close1:before { content:"\\2716"; font-size:16px; color:#fff; text-decoration:none !important; }' +
                '.layui-layer-setwin .layui-layer-close1:hover:before { opacity:0.7; }';
            document.head.appendChild(closeBtnStyle);
        }

        WG._zmlLayerIndex = layer.open({
            type: 1,
            skin: 'layui-layer-rim',
            area: area,
            title: title,
            content: html,
            move: false,
            end: function () {
                WG._zmlLayerIndex = null;
                WG._zmlCleanup();
            }
        });

        WG._zmlInitMain();
    },
    _zmlInitMain: function () {
        var self = WG;
        // 加载数据
        zml = GM_getValue(roleid + "_zml", zml);
        if (!Array.isArray(zml)) zml = [];
        ztjk_item = GM_getValue(roleid + "_ztjk", []);
        if (!Array.isArray(ztjk_item)) ztjk_item = [];

        WG._zmlVue = new Vue({
            el: '#zmlandztjk',
            data: {
                cv: 'zmlList',         // 当前视图: zmlList / zmlEdit / ztjkList / ztjkEdit
                zmldata: zml,
                ztjkdata: ztjk_item,
                editForm: { name: '', zmlType: '0', zmlRun: '' },
                editZtjkForm: { name: '', script: '', isactive: 1 },
                editingIdx: -1
            },
            created() {
                this.zmldata = zml;
                this.ztjkdata = ztjk_item;
                // 确保每个项有唯一 key 用于 transition-group 动画追踪
                this._ensureKeys(this.zmldata, 'zm');
                this._ensureKeys(this.ztjkdata, 'zt');
            },
            methods: {
                // ===== 通用辅助 =====
                _ensureKeys: function (arr, prefix) {
                    arr.forEach(function (item) {
                        if (!item._key) item._key = prefix + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                    });
                },
                // ===== 快速使用切换 =====
                toggleZmlShow: function (item) {
                    item.zmlShow = item.zmlShow ? 0 : 1;
                    GM_setValue(roleid + "_zml", this.zmldata);
                    WG.zml_showp();
                },
                zmlShowBtn: function (item) {
                    return item.zmlShow ? '已启用快速使用' : '已禁用快速使用';
                },
                zmlShowBtnCls: function (item) {
                    return item.zmlShow ? 'zml-btn zml-btn-quick' : 'zml-btn zml-btn-quick-off';
                },
                // ===== ZML 列表操作 =====
                runZml: function (v) {
                    WG.zmlfire(v);
                },
                editZml: function (item) {
                    this.editForm = {
                        name: item.name,
                        zmlType: item.zmlType || '0',
                        zmlRun: item.zmlRun || ''
                    };
                    this.editingIdx = this.zmldata.indexOf(item);
                    this.cv = 'zmlEdit';
                },
                addZml: function () {
                    this.editForm = { name: '', zmlType: '0', zmlRun: '' };
                    this.editingIdx = -1;
                    this.cv = 'zmlEdit';
                },
                moveZml: function (idx, dir) {
                    var target = idx + dir;
                    if (target < 0 || target >= this.zmldata.length) return;
                    var tmp = this.zmldata[idx];
                    this.zmldata.splice(idx, 1);
                    this.zmldata.splice(target, 0, tmp);
                    GM_setValue(roleid + "_zml", this.zmldata);
                },
                saveZml: function () {
                    var zmljson = {
                        name: this.editForm.name,
                        zmlRun: this.editForm.zmlRun,
                        zmlShow: 0,
                        zmlType: this.editForm.zmlType
                    };
                    if (this.editingIdx >= 0) {
                        // 保留原有 _key 和 zmlShow，确保 Vue 能正确追踪
                        zmljson._key = this.zmldata[this.editingIdx]._key;
                        zmljson.zmlShow = this.zmldata[this.editingIdx].zmlShow;
                        this.zmldata.splice(this.editingIdx, 1, zmljson);
                    } else {
                        zmljson._key = 'zm' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                        this.zmldata.push(zmljson);
                    }
                    GM_setValue(roleid + "_zml", this.zmldata);
                    LayerHelper.msg('保存成功');
                    this.cv = 'zmlList';
                },
                deleteZml: function () {
                    if (this.editingIdx < 0) return;
                    this.zmldata.baoremove(this.editingIdx);
                    GM_setValue(roleid + "_zml", this.zmldata);
                    LayerHelper.msg('删除成功');
                    this.cv = 'zmlList';
                },
                getShareZml: function () {
                    var id = prompt('请输入分享码');
                    var self = this;
                    SettingsStore.getShareJson(id, function (res) {
                        var v = JSON.parse(res.json);
                        if (v.zmlRun != undefined) {
                            self.editForm = v;
                        } else {
                            LayerHelper.msg('不合法');
                        }
                    });
                },
                shareZml: function (item) {
                    SettingsStore.shareJson(GameState.id, item);
                },
                backToZmlList: function () {
                    this.cv = 'zmlList';
                },

                // ===== ZTJK 列表操作 =====
                editZtjk: function (item) {
                    this.editZtjkForm = {
                        name: item.name,
                        script: item.script || '',
                        isactive: item.isactive
                    };
                    this.editingIdx = this.ztjkdata.indexOf(item);
                    this.cv = 'ztjkEdit';
                },
                addZtjk: function () {
                    this.editZtjkForm = { name: '', script: '', isactive: 1 };
                    this.editingIdx = -1;
                    this.cv = 'ztjkEdit';
                },
                moveZtjk: function (idx, dir) {
                    var target = idx + dir;
                    if (target < 0 || target >= this.ztjkdata.length) return;
                    var tmp = this.ztjkdata[idx];
                    this.ztjkdata.splice(idx, 1);
                    this.ztjkdata.splice(target, 0, tmp);
                    GM_setValue(roleid + "_ztjk", this.ztjkdata);
                    WG.ztjk_func();
                },
                saveZtjk: function () {
                    var ztjk = {
                        name: this.editZtjkForm.name,
                        script: this.editZtjkForm.script,
                        isactive: this.editZtjkForm.isactive
                    };
                    if (!ztjk.name || !ztjk.script) {
                        LayerHelper.msg('名称和脚本不能为空！');
                        return;
                    }
                    if (this.editingIdx >= 0) {
                        ztjk._key = this.ztjkdata[this.editingIdx]._key;
                        this.ztjkdata.splice(this.editingIdx, 1, ztjk);
                    } else {
                        ztjk._key = 'zt' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                        this.ztjkdata.push(ztjk);
                    }
                    GM_setValue(roleid + "_ztjk", this.ztjkdata);
                    LayerHelper.msg('保存成功');
                    WG.ztjk_func();
                    this.cv = 'ztjkList';
                },
                deleteZtjk: function () {
                    if (this.editingIdx < 0) return;
                    this.ztjkdata.baoremove(this.editingIdx);
                    GM_setValue(roleid + "_ztjk", this.ztjkdata);
                    LayerHelper.msg('删除成功');
                    WG.ztjk_func();
                    this.cv = 'ztjkList';
                },
                toggleZtjk: function (item) {
                    item.isactive = item.isactive ? 0 : 1;
                    GM_setValue(roleid + "_ztjk", this.ztjkdata);
                    WG.ztjk_func();
                },
                getShareZtjk: function () {
                    var id = prompt('请输入分享码');
                    var self = this;
                    SettingsStore.getShareJson(id, function (res) {
                        var v = JSON.parse(res.json);
                        if (v.script !== undefined) {
                            self.editZtjkForm = v;
                        } else {
                            LayerHelper.msg('不合法的分享码');
                        }
                    });
                },
                shareZtjk: function (item) {
                    SettingsStore.shareJson(GameState.id, item);
                },
                backToZtjkList: function () {
                    this.cv = 'ztjkList';
                },
                openZtjkList: function () {
                    this.cv = 'ztjkList';
                },

                // ===== 监控控制 =====
                injectAll: function () {
                    WG.ztjk_func();
                },
                stopAll: function () {
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