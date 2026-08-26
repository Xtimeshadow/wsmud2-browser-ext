// ============================================================
// wg-auto-zml-edit.js —— 自命令编辑
// ------------------------------------------------------------
//   从 wg-auto-zml.js 拆分而来
//   包含：_zmlInitZmlEdit, zml_edit, isseted, zml_showp
// ============================================================
'use strict';

Object.assign(WG, {
    _zmlInitZmlEdit: function () {
        var self = WG;
        WG._zmlVue = new Vue({
            el: '#zmldialog',
            data: {
                singnalzml: { name: '', zmlType: '0', zmlRun: '' },
                zmldata: zml
            },
            created() {
                this.zmldata = zml;
            },
            methods: {
                add: function () {
                    var zmljson = {
                        name: this.singnalzml.name,
                        zmlRun: this.singnalzml.zmlRun,
                        zmlShow: 0,
                        zmlType: this.singnalzml.zmlType
                    };
                    var _flag = true;
                    for (var item of this.zmldata) {
                        if (item.name == zmljson.name) {
                            zmljson.zmlShow = item.zmlShow;
                            item = zmljson;
                            _flag = false;
                        }
                    }
                    if (_flag) this.zmldata.push(zmljson);
                    GM_setValue(roleid + '_zml', this.zmldata);
                    LayerHelper.msg('保存成功');
                },
                del: function () {
                    this.zmldata.forEach(function (v, k) {
                        if (v.name == this.singnalzml.name) {
                            this.zmldata.baoremove(k);
                            GM_setValue(roleid + '_zml', this.zmldata);
                            LayerHelper.msg('删除成功');
                        }
                    }, this);
                },
                getShare: function () {
                    var id = prompt('请输入分享码');
                    SettingsStore.getShareJson(id, function (res) {
                        var v = JSON.parse(res.json);
                        if (v.zmlRun != undefined) {
                            this.singnalzml = v;
                        } else {
                            LayerHelper.msg('不合法');
                        }
                    }.bind(this));
                },
                edit: function (v) {
                    this.singnalzml = v;
                },
                showp: function (v) {
                    zmlshowsetting = GM_getValue(roleid + '_zmlshowsetting', zmlshowsetting);
                    var a = $('.room-commands');
                    if (zmlshowsetting == 1) a = $('.zdy-commands');
                    for (var item of a.children()) {
                        if (item.textContent == v.name.replace(/<[a-zA-Z]+>/g, '')) {
                            item.remove();
                            v.zmlShow = 0;
                            GM_setValue(roleid + '_zml', zml);
                            LayerHelper.msg('删除快速使用' + v.name);
                            return;
                        }
                    }
                    a.append('<span class="act-item act-item-zdy">' + v.name + '</span>');
                    v.zmlShow = 1;
                    GM_setValue(roleid + '_zml', zml);
                    LayerHelper.msg('设置快速使用' + v.name);
                    $('.act-item-zdy').off('click');
                    $('.act-item-zdy').on('click', function () {
                        TaskHelper.usezml(0, this.textContent, '');
                    });
                },
                share: function (v) {
                    SettingsStore.shareJson(GameState.id, v);
                }
            }
        });
        $('.zml-back-btn').off('click').on('click', function () {
            self._zmlOpenView('main');
        });
    },
    zml_edit: function () {
        zml = GM_getValue(roleid + "_zml", zml);
        // 【2026-08-15 修复】原 `! typeof zml instanceof Array` 优先级错误恒为 false
        // （typeof 结果是字符串，! 后为 false，false instanceof Array 永远 false），
        // 导致存储损坏时不会重置为数组，后续 for..of 直接抛错；改用 Array.isArray。
        if (!Array.isArray(zml)) {
            zml = [];
        }
        messageClear();
        var edithtml = UI.zmlsetting;
        messageAppend(edithtml, 0, null, true);   // 【2026-08-12 修复】sync：zml 编辑面板同步插入，Vue 挂载 #zmldialog 才能命中
        const zmlvue = new Vue({
            el: "#zmldialog",
            data: {
                singnalzml: {
                    name: "",
                    zmlType: "0",
                    zmlRun: ""
                },
                zmldata: zml
            },
            created() {
                this.zmldata = zml;
            },
            methods: {
                add: function () {
                    let zmljson = {
                        "name": this.singnalzml.name,
                        "zmlRun": this.singnalzml.zmlRun,
                        "zmlShow": 0,
                        "zmlType": this.singnalzml.zmlType
                    };
                    let _flag = true;
                    for (let item of this.zmldata) {
                        if (item.name == zmljson.name) {
                            zmljson.zmlShow = item.zmlShow;
                            item = zmljson;
                            _flag = false;
                        }
                    }

                    if (_flag) {
                        this.zmldata.push(zmljson);
                    }
                    GM_setValue(roleid + "_zml", this.zmldata);
                    LayerHelper.msg("保存成功");
                },
                del: function () {
                    this.zmldata.forEach((v, k) => {
                        if (v.name == this.singnalzml.name) {
                            this.zmldata.baoremove(k);
                            GM_setValue(roleid + "_zml", this.zmldata);
                            LayerHelper.msg("删除成功");
                        }
                    });
                },
                getShare: function () {
                    var id = prompt("请输入分享码");
                    SettingsStore.getShareJson(id, (res) => {
                        let v = JSON.parse(res.json);
                        if (v.zmlRun != undefined) {
                            this.singnalzml = v;
                        } else {
                            LayerHelper.msg("不合法")
                        }
                    });
                },
                edit: function (v) {
                    this.singnalzml = v;
                },
                showp: function (v) {
                    zmlshowsetting = GM_getValue(roleid + "_zmlshowsetting", zmlshowsetting);
                    let a = $(".room-commands");

                    if (zmlshowsetting == 1) {
                        a = $(".zdy-commands");
                    }

                    for (let item of a.children()) {
                        if (item.textContent == v.name.replace(/<[a-zA-Z]+>/g, '')) {
                            item.remove();
                            v.zmlShow = 0;
                            GM_setValue(roleid + "_zml", zml);
                            messageAppend("<hiy>删除快速使用" + v.name);
                            return;
                        }
                    }
                    a.append("<span class=\"act-item act-item-zdy\">" + v.name + "</span>")
                    v.zmlShow = 1;
                    GM_setValue(roleid + "_zml", zml);
                    messageAppend("设置快速使用" + v.name, 1);
                    //绑定事件
                    $('.act-item-zdy').off('click');
                    $(".act-item-zdy").on('click', function () {
                        TaskHelper.usezml(0, this.textContent, "");
                    });
                },
                share: function (v) {
                    SettingsStore.shareJson(GameState.id, v);
                }
            }
        })

        },
    isseted: false,
    zml_showp: function () {
        $(".zdy-commands").empty();
        $('.act-item-zdy').remove();
        zml = GM_getValue(roleid + "_zml", zml);
        zmlshowsetting = GM_getValue(roleid + "_zmlshowsetting", zmlshowsetting);

        for (let zmlitem of zml) {
            let a = $(".room-commands");
            if (zmlshowsetting == 1) {
                for (let item of a.children()) {
                    if (item.textContent == zmlitem.name) {
                        item.remove();
                    }
                }
                a = $(".zdy-commands");
                if (!WG.isseted) {
                    let px = $('.tool-bar.right-bar').css("bottom");
                    px.replace("px", "");
                    px = parseInt(px);
                    px = px + 24;
                    $('.tool-bar.right-bar').css("bottom", px + "px");
                    WG.isseted = true;
                }

            } else {
                for (let item of $(".zdy-commands").children()) {
                    if (item.textContent == zmlitem.name) {
                        item.remove();
                    }
                }
            }

            if (zmlitem.zmlShow == 1) {

                a.append("<span class=\"act-item act-item-zdy\">" + zmlitem.name + "</span>")
                messageAppend("设置快速使用" + zmlitem.name, 0, 1);
                //绑定事件
                $('.act-item-zdy').off('click');
                $(".act-item-zdy").on('click', function () {
                    TaskHelper.usezml(0, this.textContent, "");
                });
            }
        }
    }
});