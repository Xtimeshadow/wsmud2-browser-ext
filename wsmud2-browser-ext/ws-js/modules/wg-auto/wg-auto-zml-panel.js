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
        // 【2026-09-07】zml-btn 按钮、交换动画、layer 关闭按钮等样式已并入设计系统
        //   （wg-core-styles.js _getDialogCSS()，登录时注入），此处不再运行时注入。

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
                // ===== 代码编辑器（与触发/流程编辑区一致：Tab 缩进 + 行号/语法高亮/自动补全） =====
                _setupEditor: function (id) {
                    setTimeout(function () {
                        var ta = document.getElementById(id);
                        if (!ta) return;
                        try { enableTabIndent(ta); } catch (e) { }
                        try { createRaidEditor(id, { height: '100%' }); } catch (e2) { }
                    }, 0);
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
                    this._setupEditor('zml_info');
                },
                addZml: function () {
                    this.editForm = { name: '', zmlType: '0', zmlRun: '' };
                    this.editingIdx = -1;
                    this.cv = 'zmlEdit';
                    this._setupEditor('zml_info');
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
                            // 【2026-09-08】查询分享移至列表页：导入后作为新增进入编辑视图
                            self.editForm = v;
                            self.editingIdx = -1;
                            self.cv = 'zmlEdit';
                            self._setupEditor('zml_info');
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
                    this._setupEditor('ztjk_script');
                },
                addZtjk: function () {
                    this.editZtjkForm = { name: '', script: '', isactive: 1 };
                    this.editingIdx = -1;
                    this.cv = 'ztjkEdit';
                    this._setupEditor('ztjk_script');
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
                            // 【2026-09-08】查询分享移至监控列表页：导入后作为新增进入编辑视图
                            self.editZtjkForm = v;
                            self.editingIdx = -1;
                            self.cv = 'ztjkEdit';
                            self._setupEditor('ztjk_script');
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