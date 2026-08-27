// ============================================================
// wg-auto-settings-tabs.js —— 设置面板控件绑定与显示
// ------------------------------------------------------------
//   从 wg-auto-settings.js 拆分而来
//   包含：_settingBindings() —— 控件事件绑定
//         _settingDisplay() —— 控件值回显
// ============================================================
'use strict';

Object.assign(WG, {
    _settingBindings: function () {
        // 以下控件绑定沿用原逻辑（弹窗内选择器不变）
        $("#family").off('change');
        $('#autorelogin').off('click')
        $('#autorecover').off('click')
        $('#merge_item_display').off('click')
        $('#dpssakada').off('click')
        $('.clean_dps').off('click')

        $('#funnycalc').off('click')
        $('#keepalive').off('click')

        $('#loginhml').off('change')
        $("#autowork").off('change');
        $('#getitemShow').off('click')
        $("#zmlshowsetting").off('change')

        $('#marry_kiss').off('click')
        $('#autoBoss').off('click')
        $('#BossName').off('change')
        $('#auto_command').off('change')


        $(".savebtn").off('click')
        $('#clear_skillJson').off('click')
        $('#backup_btn').off('click')
        $('#load_btn').off('click')
        $('#reset_default_btn').off('click')
        $('#restore_btn').off('click')
        $('#storage_report_btn').off('click')
        $('#backup_now_btn').off('click')
        $('#restore_backup_btn').off('click')
        $('#autoBuy').off('change')
        $('#shieldkey').off('focusout');
        $('#shield').off('focusout');
        $('#zdyskilllist').off('change')
        $('#zdyskillsswitch').off('click')
        $('#shieldswitch').off('click')
        $('#die_str').off('focusout');
        $('#custom_dock').off('focusout');
        $('#unauto_pfm').off('change')
        $("#pushSwitch").off('click');
        $("#pushDeath").off('click');
        $("#pushType").off('change');
        $("#pushToken").off('change');
        // $("pushUrl").off('change');
        $("#idleCmdSwitch").off('click');
        $("#idleCmdSeconds").off('focusout');
        $("#idleCmdContent").off('focusout');
        $('#autorewardgoto').off('click')
        $('#autopfmswitch').off('click')
        $('#auto_eq').off('change')

        $('#fj_onekey').off('click')
        $('#fj_follower').off('click')
        $('#fj_sc').off('change')
        $('#fjList').off('change')
        $('#autoSell').off('change')
        $('#autoUse').off('change')
        $('#scan_orphan_btn').off('click')
        $('#clean_orphan_btn').off('click')
        $('#healthcheck').off('click')


        // 【2026-08-09 修复】开关视觉切换绑定：原来挂在 .dialog-extend（游戏对话框），独立弹窗后失效
        $("#ext-setting-mask").on("click", ".switch2", UI.switchClick);
        $("#family").change(function () {
            family = $("#family").val();
            GM_setValue(roleid + "_family", family);
        });
        $("#autowork").change(function () {
            autowork = $('#autowork').val();
            GM_setValue(roleid + "_autowork", autowork);
        });
        $('#marry_kiss').click(function () {
            automarry = WG.switchReversal($(this));
            GM_setValue(roleid + "_automarry", automarry);
        });
        $('#autoBoss').click(function () {
            autoBoss = WG.switchReversal($(this));
            GM_setValue(roleid + "_autoBoss", autoBoss);
        });
        $('#BossName').change(function () {
            BossName = $('#BossName').val();
            GM_setValue(roleid + "_BossName", BossName);
        });
        $('#fj_onekey').click(function () {
            onekey_fenjie = WG.switchReversal($(this));
            GM_setValue(roleid + "_onekey_fenjie", onekey_fenjie);
        });
        $('#fj_follower').click(function () {
            follower_fenjie = WG.switchReversal($(this));
            GM_setValue(roleid + "_follower_fenjie", follower_fenjie);
        });
        $('#fj_sc').change(function () {
            fj_sc = $('#fj_sc').val();
            GM_setValue(roleid + "_fj_sc", fj_sc);
        });
        $('#fjList').change(function () {
            fenjieList = $('#fjList').val();
            GM_setValue(roleid + "_fenjieList", fenjieList);
        });
        $('#autopfmswitch').click(function () {
            auto_pfmswitch = WG.switchReversal($(this));
            GM_setValue(roleid + "_auto_pfmswitch", auto_pfmswitch);
            // 【2026-08-15】按钮文字同步开关状态
            try { WG.auto_perform_button(); } catch (e) { }
        });
        $('#autopfmmode').click(function () {
            auto_pfm_mode = WG.switchReversal($(this));
            GM_setValue(roleid + "_auto_pfm_mode", auto_pfm_mode);
        });
        $('#busyinfo').click(function () {
            busy_info = WG.switchReversal($(this));
            GM_setValue(roleid + "_busy_info", busy_info);
        });
         $('#skillCD').click(function () {
            skillCD = WG.switchReversal($(this));
            GM_setValue(roleid + "_skillCD", skillCD);
        });
         $('#buffCD').click(function () {
            buffCD = WG.switchReversal($(this));
            GM_setValue(roleid + "_buffCD", buffCD);
        });
        // 【2026-08-12 移植作者 f45137e】CD 颜色下拉即时保存
        $('#skillCDColor').change(function () {
            skillCDColor = $(this).val();
            GM_setValue(roleid + "_skillCDColor", skillCDColor);
        });
        $('#buffCDColor').change(function () {
            buffCDColor = $(this).val();
            GM_setValue(roleid + "_buffCDColor", buffCDColor);
        });
        // 【2026-08-13 移植作者 26.2】自动买符开关 + 活动轮询间隔
        $('#autobuytalisman').click(function () {
            auto_buy_talisman = WG.switchReversal($(this));
            GM_setValue(roleid + "_auto_buy_talisman", auto_buy_talisman);
        });
        $('#event_poll_interval').change(function () {
            var v = parseInt($(this).val()) || 1;
            if (v < 1) v = 1;
            event_poll_interval = v;
            GM_setValue(roleid + "_event_poll_interval", v);
            try { if (GlobalInit.restartEventPolling) GlobalInit.restartEventPolling(); } catch (e) { }
        });
        $('#autorelogin').click(function () {
            auto_relogin = WG.switchReversal($(this));
            GM_setValue(roleid + "_auto_relogin", auto_relogin);
        });
        // 【2026-08-13 自动恢复】重连失败后自动刷新重登开关
        $('#autorecover').click(function () {
            auto_recover = WG.switchReversal($(this));
            GM_setValue(roleid + "_auto_recover", auto_recover);
        });
        $('#rainbowname').click(function () {
            rainbow_name = WG.switchReversal($(this));
            GM_setValue(roleid + "_rainbow_name", rainbow_name);
            rainbowplayer();
        });
        $("#zmlshowsetting").change(function () {
            zmlshowsetting = $('#zmlshowsetting').val();
            GM_setValue(roleid + "_zmlshowsetting", zmlshowsetting);
            WG.zml_showp();
        });
        $("#pushSwitch").click(function () {
            pushSwitch = WG.switchReversal($(this));
            GM_setValue(rid + "_pushSwitch", pushSwitch);
        });
        $("#pushDeath").click(function () {
            _pushDeath = WG.switchReversal($(this));
            GM_setValue(rid + "_pushDeath", _pushDeath);
        });
        $("#idleCmdSwitch").click(function () {
            _idleCmdSwitch = WG.switchReversal($(this));
            GM_setValue("_idleCmdSwitch", _idleCmdSwitch);
            idleCmdStart();
        });
        $("#idleCmdSeconds").focusout(function () {
            _idleCmdSeconds = parseInt($('#idleCmdSeconds').val()) || 120;
            GM_setValue("_idleCmdSeconds", _idleCmdSeconds);
        });
        $("#idleCmdContent").focusout(function () {
            _idleCmdContent = $('#idleCmdContent').val();
            GM_setValue("_idleCmdContent", _idleCmdContent);
        });
        $("#pushType").change(function () {
            pushType = $('#pushType').val();
            GM_setValue(rid + "_pushType", pushType);
        });
        $("#pushToken").focusout(function () {
            pushToken = $('#pushToken').val();
            GM_setValue(rid + "_pushToken", pushToken);
        });
        // 【2026-08-14 测试推送按钮】点击时先落库（blur 已触发 focusout），再用当前配置发一条测试
        $("#push_test_btn").off('click');
        $("#push_test_btn").on('click', function () {
            pushSwitch = GM_getValue(rid + "_pushSwitch", pushSwitch);
            pushType = GM_getValue(rid + "_pushType", pushType);
            pushToken = GM_getValue(rid + "_pushToken", pushToken);
            if (pushSwitch != '开' && pushSwitch !== true && pushSwitch !== 'true') {
                messageAppend("<hiy>请先打开推送开关再测试</hiy>");
                return;
            }
            messageAppend("<hiy>正在发送测试推送…</hiy>");
            Push("✅ 测试：这是一条来自 WSMUD 插件的测试推送，收到即表示配置正常");
            messageAppend("<hiy>已发送，请查看手机是否收到（当前渠道编号：" + pushType + "）</hiy>");
        });
        // $("#pushUrl").focusout(function () {
        //     pushUrl = $('#pushUrl').val();
        //     GM_setValue("_pushUrl", pushUrl);
        // });
        $("#color_select").change(function () {
            color_select = $('#color_select').val();
            GM_setValue("color_select", color_select);
        });
        $('#getitemShow').click(function () {
            getitemShow = WG.switchReversal($(this));
            GM_setValue(roleid + "_getitemShow", getitemShow);
        });
        $('#merge_item_display').click(function () {
            merge_item_display = WG.switchReversal($(this));
            GM_setValue(roleid + "_merge_item_display", merge_item_display);
        });
        $('#unauto_pfm').change(function () {
            unauto_pfm = $('#unauto_pfm').val();
            GM_setValue(roleid + "_unauto_pfm", unauto_pfm);
            var unpfm = unauto_pfm.split(',');
            blackpfm = [];
            for (var pfmname of unpfm) {
                if (pfmname)
                    blackpfm.push(pfmname);
            }
        });
        $('#auto_command').change(function () {
            auto_command = $('#auto_command').val();
            GM_setValue(roleid + "_auto_command", auto_command);
        });
        $('#die_str').focusout(function () {
            die_str = $('#die_str').val();
            GM_setValue(roleid + "_die_str", die_str);
        });
        $('#custom_dock').focusout(function () {
            custom_dock = $('#custom_dock').val();
            GM_setValue(roleid + "_custom_dock", custom_dock);
            WG.customDock(custom_dock);
        });
        $('#shieldswitch').click(function () {

            shieldswitch = WG.switchReversal($(this));
            GM_setValue("_shieldswitch", shieldswitch);
            if (shieldswitch == "开" || shieldswitch === true || shieldswitch === 'true') {
                messageAppend('已注入屏蔽系统', 1);
            }
        });
        $('#zdyskillsswitch').click(function () {

            zdyskills = WG.switchReversal($(this));
            GM_setValue(roleid + "_zdyskills", zdyskills);
            if (zdyskills == "开" || zdyskills === true || zdyskills === 'true') {
                messageAppend('已开启自定义技能顺序，填写顺序后，请刷新游戏生效', 1);
            }
        });

        $('#zdyskilllist').change(function () {

            let x = JSON.parse($("#zdyskilllist").val());
            // 【2026-08-15 修复】同 L262：`!typeof x instanceof Array` 恒为 false，改用 Array.isArray
            if (!Array.isArray(x)) {
                alert("无效的输入")
                return false;
            } else {
                zdyskilllist = $("#zdyskilllist").val();
                GM_setValue(roleid + "_zdyskilllist", zdyskilllist);
            }
        });
        $('#dpssakada').click(function () {

            dpssakada = WG.switchReversal($(this));
            GM_setValue(roleid + "_dpssakada", dpssakada);
            if (dpssakada == "开" || dpssakada === true || dpssakada === 'true') {
                messageAppend('已开启战斗统计', 1);
            }
        });
        $('#funnycalc').click(function () {

            funnycalc = WG.switchReversal($(this));
            GM_setValue(roleid + "_funnycalc", funnycalc);
            if (funnycalc == "开" || funnycalc === true || funnycalc === 'true') {
                messageAppend('已开启FUNNY计算', 1);
            }
        });
        // 【2026-08-10 新增】后台保活开关（全局键，即时生效）
        $('#keepalive').click(function () {
            keepalive = WG.switchReversal($(this));
            GM_setValue("_keepalive", keepalive);
            try {
                if (keepalive == "开") { window._extKeepAlive && window._extKeepAlive.start(); }
                else { window._extKeepAlive && window._extKeepAlive.stop(); }
            } catch (e) { }
            messageAppend(keepalive == "开" ? '已开启后台保活' : '已关闭后台保活', 1);
        });
        // 【2026-08-14 跨窗口同步】全局设置同步开关（默认关，开启后 _ 开头/color_select 设置广播到所有游戏窗口）
        $('#ext_sync_global').off('click');
        $('#ext_sync_global').click(function () {
            var v = WG.switchReversal($(this));
            ext_sync_global = v;
            window.__extConfigSyncOn = (v == "开");
            GM_setValue("_ext_sync_global", v);
            messageAppend(v == "开"
                ? '已开启跨窗口同步（屏蔽/推送/保活等全局设置将自动同步到所有游戏窗口）'
                : '已关闭跨窗口同步', 1);
        });
        $('#shield').focusout(function () {
            shield = $('#shield').val();
            GM_setValue("_shield", shield);
        });
        $('#shieldkey').focusout(function () {
            shieldkey = $('#shieldkey').val();
            GM_setValue("_shieldkey", shieldkey);
        });
        $('#loginhml').change(function () {
            loginhml = $('#loginhml').val();
            GM_setValue(roleid + "_loginhml", loginhml);
        });
        $('#autoBuy').change(function () {
            autoBuyList = $('#autoBuy').val();
            GM_setValue(roleid + "_autoBuyList", autoBuyList);
        });
        // 【2026-08-09 移植v1.0.0】自动售卖/自动使用：输入框保存 + 执行按钮
        $('#autoSell').change(function () {
            autoSellList = $('#autoSell').val();
            GM_setValue(roleid + "_autoSellList", autoSellList);
        });
        $('#autoUse').change(function () {
            autoUseList = $('#autoUse').val();
            GM_setValue(roleid + "_autoUseList", autoUseList);
        });
        $('#backup_btn').on('click', WG.make_config);
        $('#load_btn').on('click', WG.load_config);
        $('#reset_default_btn').on('click', WG.reset_default);
        $('#restore_btn').on('click', WG.restore_config);
        $('#storage_report_btn').on('click', function () {
            if (typeof GM_storageReport === 'function') {
                var rep = GM_storageReport();
                var msg = '配置存储报告：\n' + (rep || '无数据');
                LayerHelper.msg(msg, 5);
            } else {
                LayerHelper.msg('存储诊断功能不可用');
            }
        });
        // 【2026-08-11 本地自动备份】立即备份 / 恢复备份按钮 + 显示最近备份时间
        $('#backup_now_btn').on('click', function () {
            if (WG.backup_config(false)) {
                var bk = GM_getValue("ext_config_backup", null);
                if (bk && bk.time && $('#ext-backup-info').length) {
                    $('#ext-backup-info').text('最近备份：' + new Date(bk.time).toLocaleString());
                }
            }
        });
        $('#restore_backup_btn').on('click', WG.restore_config);
        // 【2026-08-13 存储孤儿键清理】扫描（只读）+ 备份并清理（删除前自动备份）
        $('#scan_orphan_btn').on('click', function () {
            try {
                if (typeof GM_scanOrphanKeys !== 'function') { LayerHelper.msg('扫描函数不可用'); return; }
                var rep = GM_scanOrphanKeys();
                if (!rep.ok) { LayerHelper.msg(rep.message || '无法扫描'); return; }
                if (rep.orphans.length === 0) {
                    if ($('#ext-orphan-info').length) $('#ext-orphan-info').text('未发现孤儿键，存储干净');
                    LayerHelper.msg('未发现孤儿键');
                    return;
                }
                var preview = rep.orphans.slice(0, 6).map(function (o) { return o.key; }).join('、');
                var more = rep.orphans.length > 6 ? (' 等 ' + rep.orphans.length + ' 项') : '';
                if ($('#ext-orphan-info').length) $('#ext-orphan-info').text('发现 ' + rep.orphans.length + ' 个孤儿键（约 ' + Math.ceil(rep.totalBytes / 1024) + 'KB）：' + preview + more);
                LayerHelper.msg('发现 ' + rep.orphans.length + ' 个孤儿键，可点「备份并清理」删除');
            } catch (e) { LayerHelper.msg('扫描出错：' + (e && e.message)); }
        });
        $('#clean_orphan_btn').on('click', function () {
            try {
                if (typeof GM_scanOrphanKeys !== 'function' || typeof GM_cleanOrphanKeys !== 'function') { LayerHelper.msg('清理函数不可用'); return; }
                var rep = GM_scanOrphanKeys();
                if (!rep.ok) { LayerHelper.msg(rep.message || '无法判定角色列表，暂不清理'); return; }
                if (rep.orphans.length === 0) { LayerHelper.msg('没有孤儿键，无需清理'); return; }
                layer.confirm('将备份并删除 ' + rep.orphans.length + ' 个孤儿键（约 ' + Math.ceil(rep.totalBytes / 1024) + 'KB）\n删除前会自动备份到本地，可随时恢复。确认继续？', {
                    title: "<red>! 警告</red>",
                    btn: ['取消', '备份并删除'],
                    shift: 2,
                }, function (index) {
                    layer.close(index);
                }, function () {
                    layer.close(index);
                    try {
                        var res = GM_cleanOrphanKeys();
                        if (res && res.removed > 0) {
                            LayerHelper.msg('已备份并清理 ' + res.removed + ' 个孤儿键（备份：' + res.backupKey + '）');
                            if ($('#ext-orphan-info').length) $('#ext-orphan-info').text('已清理 ' + res.removed + ' 个孤儿键，备份在：' + res.backupKey);
                            // 刷新顶部存储占用
                            try {
                                var _usage = 0, _cnt = 0, _klist = GM_listValues();
                                for (var _i = 0; _i < _klist.length; _i++) { _usage += (localStorage.getItem(_klist[_i]) || '').length; _cnt++; }
                                var _usageText = _usage > 1048576 ? (_usage / 1048576).toFixed(2) + 'MB' : Math.ceil(_usage / 1024) + 'KB';
                                $("#ext-storage-usage").text('（配置 ' + _cnt + ' 项 · 占用 ' + _usageText + ' / 约5MB）');
                            } catch (e2) { }
                        } else {
                            LayerHelper.msg((res && res.message) || '清理失败');
                        }
                    } catch (e3) { LayerHelper.msg('清理出错：' + (e3 && e3.message)); }
                });
            } catch (e) { LayerHelper.msg('清理出错：' + (e && e.message)); }
        });
        // 【2026-08-13 挂机健康自检】开关：即时启停定时器
        $('#healthcheck').click(function () {
            healthcheck_enabled = WG.switchReversal($(this));
            GM_setValue(roleid + "_healthcheck_enabled", healthcheck_enabled);
            try {
                if (healthcheck_enabled) { if (typeof extHealthStart === 'function') extHealthStart(); }
                else { if (typeof extHealthStop === 'function') extHealthStop(); }
            } catch (e) { }
        });
        try {
            var _bk = GM_getValue("ext_config_backup", null);
            if (_bk && _bk.time && $('#ext-backup-info').length) {
                $('#ext-backup-info').text('最近备份：' + new Date(_bk.time).toLocaleString());
            }
        } catch (e) { }
        $('#clear_skillJson').on('click', () => {
            zdyskilllist == "";
            messageAppend("已关闭自定义，请重新刷新获取技能数据!");
            zdyskills = "关";
            GM_setValue(roleid + "_zdyskilllist", "");
            GM_setValue(roleid + "_zdyskills", zdyskills);
        });


        $(".savebtn").on("click", function () {
            let tmp = [];
            for (let item of keyitem) {
                let zdybtnitem = {
                    name: '无',
                    send: ''
                };
                let pname = $(`#name${item}`).val();
                let psend = $(`#send${item}`).val();
                if (pname != '') {
                    zdybtnitem.name = pname;
                    zdybtnitem.send = psend;
                }

                tmp.push(zdybtnitem);
            }
            zdy_btnlist = tmp;
            GM_setValue(roleid + "_zdy_btnlist", zdy_btnlist);
            messageAppend("保存自定义按钮成功");
            inzdy_btn = true;
            GM_setValue(roleid + "_inzdy_btn", true);
            WG.zdy_btnshow();
        });
    },
    _settingDisplay: function () {
        $('#family').val(family);
        $('#marry_kiss').val(automarry);
        $('#autoBoss').val(autoBoss);
        $('#BossName').val(BossName);
        $('#fj_onekey').val(onekey_fenjie);
        $('#fj_follower').val(follower_fenjie);
        $('#fj_sc').val(fj_sc);
        $("#fjList").val(fenjieList);
        $('#autopfmswitch').val(auto_pfmswitch);
        $('#autopfmmode').val(auto_pfm_mode);
        $('#busyinfo').val(busy_info);
        $('#skillCD').val(skillCD);
        $('#buffCD').val(buffCD);
        // 【2026-08-12 移植作者 f45137e】CD 颜色回显
        $('#skillCDColor').val(skillCDColor);
        $('#buffCDColor').val(buffCDColor);
        // 【2026-08-13 移植作者 26.2】自动买符 + 活动轮询间隔回显
        $('#autobuytalisman').val(auto_buy_talisman);
        $('#event_poll_interval').val(event_poll_interval);
        // 【2026-08-13 挂机健康自检】回显
        $('#healthcheck').val(healthcheck_enabled);
        $('#autorelogin').val(auto_relogin);
        $('#autorecover').val(auto_recover);
        $('#rainbowname').val(rainbow_name);
        $("#zmlshowsetting").val(zmlshowsetting);
        $("#pushSwitch").val(pushSwitch);
        $("#pushType").val(pushType);
        $("#pushToken").val(pushToken);
        // $("#pushUrl").val(pushUrl);
        $("#idleCmdSwitch").val(_idleCmdSwitch);
        $("#idleCmdSeconds").val(_idleCmdSeconds);
        $("#idleCmdContent").val(_idleCmdContent);

        $("#color_select").val(color_select);
        $('#getitemShow').val(getitemShow);
        $('#merge_item_display').val(merge_item_display);
        $('#unauto_pfm').val(unauto_pfm);
        $('#auto_command').val(auto_command);
        $('#die_str').val(die_str);
        $('#custom_dock').val(custom_dock);
        $('#shieldswitch').val(shieldswitch);
        $('#dpssakada').val(dpssakada);
        $('#funnycalc').val(funnycalc);
        $('#shield').val(shield);
        $('#shieldkey').val(shieldkey);
        $("#loginhml").val(loginhml);
        $("#autowork").val(autowork);
        $("#autoBuy").val(autoBuyList);
        $("#autoSell").val(autoSellList);
        $("#autoUse").val(autoUseList);
        $("#zdyskillsswitch").val(zdyskills);
        $("#zdyskilllist").val(zdyskilllist);
        //自定义按钮刷新
        var keyitem = ["Q", "W", "E", "R", "T", "Y"];
        let zdybtni = 0;
        for (let item of keyitem) {
            $(`#name${item}`).val(zdy_btnlist[zdybtni].name);
            $(`#send${item}`).val(zdy_btnlist[zdybtni].send);
            zdybtni = zdybtni + 1;
        }
        // 【2026-08-26 修复】开关回显：同时支持新旧组件（.setting-item2 旧版 / .ext-setting-item[for] 新版）
        for (let w = $("#ext-setting-body .setting-item2, #ext-setting-body .ext-setting-item[for]"), t = 0; t < w.length; t++) {
            var s = $(w[t]),
                i = s.attr("for");
            if (i) {
                // 【2026-08-15 优化】原 eval(i) 仅用于按全局变量名取值（i 来自设置项
                // for="变量名" 属性），改用 window[i] 读取，行为一致且避免 eval。
                // 这些设置项都是 config-vars.js 里的 var 全局变量，挂在 window 上。
                var n = window[i];
                switch (i) {
                    default:
                        "开" == n && (s.find(".switch2").addClass("on"), s.find(".switch-text").html("开"))
                }
            }
        }
    }
});