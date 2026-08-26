// ============================================================
// wg-auto-zml-monitor.js —— 自定义监控编辑
// ------------------------------------------------------------
//   从 wg-auto-zml.js 拆分而来
//   包含：_zmlInitZtjkEdit, zmlztjk
// ============================================================
'use strict';

Object.assign(WG, {
    _zmlInitZtjkEdit: function () {
        var self = WG;
        ztjk_item = GM_getValue(roleid + '_ztjk', []);
        $('.ztjk_sharedfind').off('click').on('click', function () {
            var id = prompt('请输入分享码');
            SettingsStore.getShareJson(id, function (res) {
                var v = JSON.parse(res.json);
                if (v.script !== undefined) {
                    $('#ztjk_name').val(v.name);
                    $('#ztjk_script').val(v.script);
                } else {
                    LayerHelper.msg('不合法的分享码');
                }
            });
        });
        $('.ztjk_editadd').off('click').on('click', function () {
            var ztjk = {
                name: $('#ztjk_name').val(),
                script: $('#ztjk_script').val(),
                isactive: 1
            };
            if (!ztjk.name || !ztjk.script) {
                LayerHelper.msg('名称和脚本不能为空！');
                return;
            }
            var _flag = true;
            ztjk_item.forEach(function (v, k) {
                if (v.name == ztjk.name) {
                    ztjk_item[k] = ztjk;
                    _flag = false;
                }
            });
            if (_flag) ztjk_item.push(ztjk);
            GM_setValue(roleid + '_ztjk', ztjk_item);
            self._zmlOpenView('ztjkEdit');
            LayerHelper.msg('保存成功');
            WG.ztjk_func();
        });
        $('.ztjk_editdel').off('click').on('click', function () {
            var name = $('#ztjk_name').val();
            for (var i = ztjk_item.length - 1; i >= 0; i--) {
                if (ztjk_item[i].name === name) {
                    ztjk_item.splice(i, 1);
                    GM_setValue(roleid + '_ztjk', ztjk_item);
                    self._zmlOpenView('ztjkEdit');
                    LayerHelper.msg('删除成功');
                    WG.ztjk_func();
                    return;
                }
            }
        });
        $('#ztjk_show').empty();
        $('#ztjk_set').empty();
        ztjk_item.forEach(function (v, k) {
            var btn = $("<span class='zdy-item'>编辑: " + v.name + "</span>").on('click', function () {
                $('#ztjk_name').val(v.name);
                $('#ztjk_script').val(v.script);
            });
            $('#ztjk_show').append(btn);
            var tmptext = v.isactive ? '暂停' : '启用';
            var setbtn = $("<span class='zdy-item'>" + tmptext + ': ' + v.name + "</span>").on('click', function () {
                ztjk_item[k].isactive = v.isactive ? 0 : 1;
                GM_setValue(roleid + '_ztjk', ztjk_item);
                WG.ztjk_func();
                self._zmlOpenView('ztjkEdit');
            });
            $('#ztjk_set').append(setbtn);
            var btn3 = $("<span class='zdy-item'>分享: " + v.name + "</span>").on('click', function () {
                SettingsStore.shareJson(GameState.id, v);
            });
            $('#ztjk_show').append(btn3);
        });
        $('.zml-back-btn').off('click').on('click', function () {
            self._zmlOpenView('main');
        });
    },
    zmlztjk: function () {
        if (WG._zmlLayerIndex) {
            WG._zmlClosePanel();
            return;
        }
        WG._zmlOpenView('main');
    }
});