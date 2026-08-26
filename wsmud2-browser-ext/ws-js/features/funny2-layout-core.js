// funny2-layout-core.js
// 武神传说 MUD 界面布局 —— 核心布局初始化（三栏布局、样式、频道标签、角色信息面板结构）
"use strict";

window.__funny2_layout = window.__funny2_layout || {};

(function () {
    var layout = window.__funny2_layout;

    // ========== 三栏布局（BODY） ==========
    layout.initLayoutBody = function () {
        /********************BODY********************/
        GM_addStyle([
            'body { width: 100%; display: flex; flex-flow: row nowrap; }',
            '.container, .login-content { width: 400px; flex: 1 0 auto; margin: 0; }',
            '.left, .right { width:390px; height:100%; flex: 0 0 auto; margin: 0 10px; }',
        ].join('\n'));

        $("body").append(
            $('<div class="left"></div>'),
            $('<div class="right"></div>')
        );

        function confirmWight() {
            var d = document.querySelector('.dialog-confirm');
            var l = document.querySelector('.left') || { offsetWidth: 0 };
            var r = document.querySelector('.right') || { offsetWidth: 0 };
            if (!d) return;
            var total = l.offsetWidth + r.offsetWidth;
            d.style.width = (window.innerWidth - total) + 'px';
            d.style.left = l.offsetWidth + 'px';
            d.style.right = r.offsetWidth + 'px';
        }

        (function moveAndStyleToolbar() {
            function getElement(selector) { return document.querySelector(selector); }
            function moveElementIfNeeded(sourceSelector, targetSelector) {
                var sourceElement = getElement(sourceSelector);
                var targetContainer = getElement(targetSelector);
                if (sourceElement && targetContainer && !targetContainer.contains(sourceElement)) {
                    targetContainer.appendChild(sourceElement);
                }
            }
            function attemptMove() {
                var moveTasks = [
                    { source: '#raidToolbar', target: 'body > div.left > div.left-hotkeys' },
                    { source: '.WG_log', target: 'body > div.left > div.left-hotkeys' },
                    { source: '.WG_log_log', target: 'body > div.right > div.left-console' },
                    { source: '.channel', target: 'body > div.right > div.right-channel' }
                ];
                moveTasks.forEach(function (task) {
                    moveElementIfNeeded(task.source, task.target);
                });
            }
            attemptMove();
            var observer = new MutationObserver(function () { attemptMove(); });
            observer.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false });
            window.__toolbarObserver__ = observer;
        })();

        confirmWight();
        window.addEventListener('resize', function () { confirmWight(); });
    };

    // ========== 右侧栏（RIGHT） ==========
    layout.initRightColumn = function () {
        /********************RIGHT********************/
        GM_addStyle([
            '.right{ order: 1; display: flex; flex-direction: column; flex-wrap: nowrap; }',
            '.right-channel { width: 100%; flex: 0 0 50%; overflow: auto; margin-top: 10px; display: flex; flex-direction: column; position: relative; min-height: 0; }',
            '.channel { max-height: 90% !important; flex: 1; overflow: auto;}',
            '.right-channel-tabs { flex-shrink: 0; display: flex; gap: 2px; padding: 4px 6px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.15); }',
            '.right-channel-tabs > span { cursor: pointer; padding: 2px 8px; border-radius: 3px; font-size: 12px; color: #aaa; }',
            '.right-channel-tabs > span:hover { background: rgba(255,255,255,0.1); color: #fff; }',
            '.right-channel-tabs > span.selected { background: rgba(190,190,190,0.3); color: #fff; }',
            '.left-console { width: 100%; flex: 1; overflow: auto; margin: 8px; display: flex; flex-direction: column; min-height: 0; }',
            '.WG_log_log { width: 100%;height: 100%; flex: 1; overflow: hidden; max-height: none !important; display: flex; flex-direction: column; }',
            '.WG_log_log_title { color: #ffffff; font-size: 14px; font-weight: bold; padding: 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.25); flex-shrink: 0; }',
            '.WG_log_log > pre { flex: 1; overflow-y: auto; font-family: \'JetBrains Mono\', monospace; font-size: 12px; }',
            '.right-divider { height: 5px; cursor: row-resize; background: rgba(128,128,128,0.3); flex-shrink: 0; position: relative; z-index: 1; display: none; }',
            '.right-divider:hover, .right-divider.active { background: rgba(128,128,128,0.6); }',
        ].join('\n'));

        $(".right").append(
            $('<div class="right-channel"></div>'),
            $('<div class="right-divider"></div>'),
            $('<div class="left-console"></div>')
        );

        // 可拖拽分割线
        (function () {
            var rightDivider = document.querySelector('.right-divider');
            var rightChannel = document.querySelector('.right-channel');
            var isDragging = false;
            rightDivider.addEventListener('mousedown', function (e) {
                isDragging = true;
                rightDivider.classList.add('active');
                e.preventDefault();
            });
            document.addEventListener('mousemove', function (e) {
                if (!isDragging) return;
                var rightEl = document.querySelector('.right');
                var rect = rightEl.getBoundingClientRect();
                var offsetY = e.clientY - rect.top;
                var percent = Math.max(10, Math.min(90, (offsetY / rect.height) * 100));
                rightChannel.style.flex = '0 0 ' + percent + '%';
            });
            document.addEventListener('mouseup', function () {
                if (isDragging) {
                    isDragging = false;
                    rightDivider.classList.remove('active');
                }
            });
        })();

        // 创建右侧频道标签栏
        var _channelTabData = [['全部', ''], ['世界', 'chat'], ['队伍', 'tm'], ['门派', 'fam'], ['全区', 'es'], ['帮派', 'pty'], ['系统', 'sys']];
        var _channelTabBar = $('<div class="right-channel-tabs" style="display:none;"></div>');
        _channelTabData.forEach(function (item, idx) {
            var tab = $('<span for="' + item[1] + '">' + item[0] + '</span>');
            if (idx === 0) tab.addClass('selected');
            tab.on('click', function () {
                _channelTabBar.find('span').removeClass('selected');
                $(this).addClass('selected');
                var channel = $(this).attr('for') || '';
                if (typeof Dialog !== 'undefined' && Dialog.channel && Dialog.channel.footerChanged) {
                    Dialog.channel.footerChanged(channel);
                }
            });
            _channelTabBar.append(tab);
        });

        // 持续监控：确保 .channel 在 .right-channel 内
        setInterval(function () {
            var $channel = $('.channel');
            var $rightChannel = $('.right-channel');
            if ($channel.length > 0 && $rightChannel.length > 0) {
                if (!$channel.parent().hasClass('right-channel')) {
                    $channel.appendTo($rightChannel);
                }
                $channel.off('click');
                if (typeof GameState !== 'undefined' && GameState.id) {
                    if (_channelTabBar.parent().length === 0) {
                        $rightChannel.append(_channelTabBar);
                    }
                    _channelTabBar.show();
                    $('.right-divider').show();
                } else {
                    _channelTabBar.hide();
                    $('.right-divider').hide();
                }
            }
        }, 200);
    };

    // ========== 左侧栏（LEFT） ==========
    layout.initLeftColumn = function () {
        /********************LEFT********************/
        GM_addStyle([
            '.left { height: calc(100vh - 20px); order: -1; display: flex; flex-direction: column; flex-wrap: nowrap; }',
            '.left-content { width: 100%; height: auto; flex: 0 0 auto;}',
            '.left-hotkeys { width: 100%; flex: 1; padding-left: 5px; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }',
            '.WG_log { width: 100%; flex: 1; overflow-y: auto; max-height: none !important; min-height: 0; }',
            '.map-panel { display: flex; justify-content: center; overflow-x: auto; }',
            '.map-panel svg.map { flex-shrink: 0; }',
        ].join('\n'));

        $(".left").append(
            $('<div class="left-content"></div>'),
            $('<div class="left-hotkeys"></div>')
        );
    };

    // ========== 左侧角色信息面板（LEFT-CONTENT） ==========
    layout.initLeftContent = function () {
        /********************LEFT-CONTENT********************/
        GM_addStyle([
            '.left-content { margin: 10px 0; font-size: 16px; overflow: auto; }',
            '.left-content { display: flex; flex-direction: column; flex-wrap: nowrap; }',
            '.content-title { flex: 0 0 auto; border: gray solid 1px; border-radius: 3px; display: flex; }',
            '.content-info { flex: 0 1 auto; border: gray solid 1px; border-radius: 3px; margin-top: 5px; overflow: auto; }',
            '.info-row { display: flex; }',
            '.info-item { flex: 0 1 999px; dispaly: inline-block; text-align: center; }',
            '.info-title { flex: 0 0 65px; dispaly: inline-block; text-align: center; }',
            '.item-row { display: flex; border-bottom: gray dotted 0.5px; }',
            '.item-name { cursor: pointer; }',
            '.item-count { dispaly: inline-block; text-align: right; flex: 1 0 auto; }',
        ].join('\n'));

        $(".left-content").append(
            $('<div class="content-title"></div>'),
            $('<div class="content-info"></div>')
        );
        $(".content-info").show();
        $(".content-title").append(
            $('<span>　</span>'), $('<hiy class="role_family">门派</hiy>'), $('<span>　</span>'),
            $('<span class="role_level">LEVEL</span>'), $('<span>　</span>'),
            $('<hic class="role_name">NAME</hic>'), $('<span>　</span>'),
            $('<hiw class="role_id">ID</hiw>')
        );

        $(".content-info").append(
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">经验<span>'),
                $('<span class="info-item role_exp">999999<span>'),
                $('<span class="info-title">潜能<span>'),
                $('<span class="info-item role_pot">999999<span>')
            ),
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">气血<span>'),
                $('<span class="info-item"><hir class="role_hp">0</hir> / <span class="role_max_hp">999999</span><span>')
            ),
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">内力<span>'),
                $('<span class="info-item"><hic class="role_mp">0</hic> / <span class="role_max_mp">999999</span><span>')
            ),
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">臂力<span>'),
                $('<span class="info-item"><hiy class="role_str">15</hiy> + <span class="role_str_add">999</span><span>'),
                $('<span class="info-title">根骨<span>'),
                $('<span class="info-item"><hiy class="role_con">15</hiy> + <span class="role_con_add">999</span><span>')
            ),
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">身法<span>'),
                $('<span class="info-item"><hiy class="role_dex">15</hiy> + <span class="role_dex_add">999</span><span>'),
                $('<span class="info-title">悟性<span>'),
                $('<span class="info-item"><hiy class="role_int">15</hiy> + <span class="role_int_add">999</span><span>')
            ),
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">攻击<span>'),
                $('<hig class="info-item role_gj">99999<hig>'),
                $('<span class="info-title">命中<span>'),
                $('<hig class="info-item role_mz">99999<hig>')
            ),
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">防御<span>'),
                $('<hig class="info-item role_fy">99999<hig>'),
                $('<span class="info-title">招架<span>'),
                $('<hig class="info-item role_zj">99999<hig>')
            ),
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">躲闪<span>'),
                $('<hig class="info-item role_ds">99999<hig>'),
                $('<span class="info-title">攻速<span>'),
                $('<hig class="info-item role_gjsd">99999<hig>')
            ),
            $('<div class="info-row"></div>').append(
                $('<span class="info-title">财产<span>'),
                $('<span class="info-item role_money">999999两<hiy>黄金</hiy><span>')
            )
        );
    };
})();