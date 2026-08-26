// ============================================================
// ui-settings.js —— 系统设置面板生成
// ------------------------------------------------------------
// 从 ui.js 拆分出来的 UI.syssetting 方法，构建完整的系统设置面板。
// 依赖：UI 对象（ui.js 定义）+ UI 组件（ui-components.js 定义）
// ============================================================
'use strict';

// 系统设置面板
UI.syssetting = function () {
    return ''

        // ===== 插件 =====
        + UI.ext_section('插件')
        + '<div class="ext-setting-item ext-info">武神传说2插件扩展自制版</div>'

        + UI.ext_select("family", "门派选择：", {
            "武当": "武当", "华山": "华山", "少林": "少林",
            "峨眉": "峨眉", "逍遥": "逍遥", "丐帮": "丐帮", "武馆": "武馆", "杀手楼": "杀手楼"
        }, "80px")

        + UI.ext_switch('autorelogin', '自动重连', 'auto_relogin')
        + UI.ext_switch('autorecover', '重连失败后自动刷新重登', 'auto_recover')
        + UI.ext_desc('自动重连仍失败(约13分钟)后刷新页面并自动重新登录，24小时内最多5次，防止无人值守时号挂死')
        + UI.ext_switch('dpssakada', '战斗统计', 'dpssakada')
        + UI.ext_switch('funnycalc', '经验统计', 'funnycalc')
        + UI.ext_switch('keepalive', '后台保活(防挂机延迟)', 'keepalive')
        + UI.ext_switch('rainbowname', '彩虹名字', 'rainbow_name')
        + UI.ext_input("loginhml", "登录后执行命令：", "如 @zdwk @zdsell")
        + UI.ext_select("autowork", "挂机选项($zdwk)：", { "0": "挖矿", "1": "修炼", "2": "钓鱼" }, "60px")

        // ===== 显示配置 =====
        + UI.ext_section('显示配置')
        + UI.ext_switch('busyinfo', '显示昏迷信息', 'busy_info')
        + UI.ext_switch('skillCD', '显示技能CD', 'skillCD')
        + UI.ext_switch('buffCD', '显示BuffCD', 'buffCD')
        + UI.ext_switch('getitemShow', '显示获得物品', 'getitemShow')
        + UI.ext_switch('merge_item_display', '集中显示获得物品', 'merge_item_display')
        + UI.ext_select("skillCDColor", "技能CD颜色：", {
            "hir": "红色", "hig": "绿色", "hiy": "黄色", "hic": "青色", "hiz": "蓝色", "hio": "橙色", "wht": "白色"
        }, "80px")
        + UI.ext_select("buffCDColor", "BuffCD颜色：", {
            "hir": "红色", "hig": "绿色", "hiy": "黄色", "hic": "青色", "hiz": "蓝色", "hio": "橙色", "wht": "白色"
        }, "80px")
        + UI.ext_select("zmlshowsetting", "自命令显示位置：", { "0": "物品栏", "1": "技能栏下方" }, "80px")

        // ===== 自动BOSS、喜宴配置 =====
        + UI.ext_section('自动BOSS、喜宴配置')
        + UI.ext_switch('marry_kiss', '自动喜宴', "automarry")
        + UI.ext_switch('autoBoss', '自动领取boss', "autoBoss")
        + UI.ext_input("BossName", "输入自动领取的boss名称", "如 ask")
        + UI.ext_input("auto_command", "输入喜宴、boss后命令", "留空为自动挖矿或修炼")

        // ===== 自动买符与活动轮询 =====
        + UI.ext_section('自动买符与活动轮询')
        + UI.ext_switch('autobuytalisman', '进游戏自动买符', 'auto_buy_talisman')
        + UI.ext_input("event_poll_interval", "定时轮询活动间隔时间（分钟）", "1", "60px")

        // ===== 挂机健康自检 =====
        + UI.ext_section('挂机健康自检')
        + UI.ext_switch('healthcheck', '定时检查页面卡顿隐患(每5分钟)', 'healthcheck_enabled')
        + UI.ext_desc('自动裁剪超长日志、检查消息积压/页面节点/存储占用，发现问题会提示')

        // ===== 自动施法配置 =====
        + UI.ext_section('自动施法配置')
        + UI.ext_switch('autopfmswitch', '自动施法开关', 'auto_pfmswitch')
        + UI.ext_switch('autopfmmode', 'AI施法模式', 'auto_pfm_mode')
        + UI.ext_textarea("unauto_pfm", "自动施法黑名单", "95%")

        // ===== 仓库存储配置 =====
        + UI.ext_section('仓库存储配置')
        + UI.ext_textarea("autoBuy", "自动当铺购买清单", "95%")
        + UI.ext_textarea("autoSell", "自动售卖清单", "95%")
        + UI.ext_textarea("autoUse", "自动使用清单", "95%")

        // ===== 自动分解配置 =====
        + UI.ext_section('自动分解配置')
        + UI.ext_switch('fj_onekey', '开启一键分解', "onekey_fenjie")
        + UI.ext_switch('fj_follower', '启用随从分解', "follower_fenjie")
        + UI.ext_input("fj_sc", "分解随从名", "输入随从名")
        + UI.ext_textarea("fjList", "自动分解装备(名字和级别，用半角逗号分隔)", "95%")

        // ===== 杂项配置 =====
        + UI.ext_section('杂项配置')
        + UI.ext_input("die_str", "死亡提示", "如 我死了")
        + UI.ext_input("custom_dock", "抬高高度（px）", "0", "60px")
        + UI.ext_switch('ext_sync_global', '跨窗口同步全局设置', 'ext_sync_global')
        + UI.ext_select("color_select", "界面配色：", { "normal": "原版", "flat": "flat模式", "access": "色若模式" }, "80px")
        + UI.ext_desc('*配色功能刷新后生效')
        + UI.ext_input("backimageurl", "背景图片url", "建议使用1920*1080分辨率图片")

        // ===== 屏蔽选项 =====
        + UI.ext_section('屏蔽选项')
        + UI.ext_switch('shieldswitch', '聊天频道屏蔽开关', 'shieldswitch')
        + UI.ext_input("shield", "屏蔽人物名", "用半角逗号分隔")
        + UI.ext_input("shieldkey", "屏蔽关键字", "用半角逗号分隔")

        // ===== 推送配置 =====
        + UI.ext_section('推送配置')
        + UI.ext_switch('pushSwitch', '远程通知推送开关', 'pushSwitch')
        + UI.ext_desc('使用@push推送通知，语法参考@print')
        + UI.ext_select("pushType", "通知推送方式：", {
            "0": "Server酱(限32字符)", "1": "Bark iOS",
            "2": "PushPlus.plus(支持html标签)", "3": "飞书机器人",
            "4": "Qmsg私聊", "5": "Qmsg群聊", "6": "企业微信机器人"
        }, "auto")
        + UI.ext_input("pushToken", "推送Token或Key", "只要Key不要填整个网址")
        + UI.ext_switch('pushDeath', '死亡推送', 'pushDeath')
        + UI.ext_desc('开启后除手动 @push 外，掉线重连失败/角色死亡/长时间无消息等关键事件也会自动推送到手机（同类事件15分钟内最多1次）')
        + UI.ext_buttons([{ text: '测试推送', id: 'push_test_btn' }])

        // ===== 发呆检测 =====
        + UI.ext_section('发呆检测')
        + UI.ext_switch('idleCmdSwitch', '发呆检测开关', '_idleCmdSwitch')
        + UI.ext_desc('角色发呆超过设定秒数时自动执行命令')
        + UI.ext_input("idleCmdSeconds", "发呆秒数阈值", "如 30", "60px")
        + UI.ext_input("idleCmdContent", "触发时执行的命令", "如 @liaoshang；留空只发提醒")

        // ===== 技能自定义 =====
        + UI.ext_section('技能自定义')
        + UI.ext_switch('zdyskillsswitch', '自定义技能顺序开关', 'zdyskills')
        + UI.ext_textarea("zdyskilllist", "自定义技能顺序json数组", "95%")
        + UI.ext_buttons([{ text: '清空技能json数组', id: 'clear_skillJson' }])

        // ===== 自定义按钮 =====
        + UI.ext_section('自定义按钮')
        + UI.zdyBtnsetui()

        // ===== 系统 =====
        + UI.ext_section('系统')
        + UI.ext_buttons([
            { text: '上传配置', id: 'backup_btn' },
            { text: '下载配置', id: 'load_btn' },
            { text: '一键恢复', id: 'restore_btn' },
            { text: '存储诊断', id: 'storage_report_btn' },
            { text: '恢复默认设置', id: 'reset_default_btn', danger: true }
        ])
        + UI.ext_desc('上传/下载配置用于跨角色同步（含游戏自带拓展设置），恢复默认仅重置当前角色设置。每日自动备份已开启，一键恢复从云端拉取最近备份')
        + UI.ext_buttons([
            { text: '立即备份', id: 'backup_now_btn' },
            { text: '恢复备份', id: 'restore_backup_btn', danger: true }
        ])
        + '<div class="ext-setting-item ext-desc" id="ext-backup-info">配置每天自动备份到本地，设置损坏时可一键恢复</div>'
        + UI.ext_buttons([
            { text: '扫描孤儿键', id: 'scan_orphan_btn' },
            { text: '备份并清理', id: 'clean_orphan_btn', danger: true }
        ])
        + '<div class="ext-setting-item ext-desc" id="ext-orphan-info">角色删除/改名后残留的配置键，可一键扫描清理（清理前自动备份，可恢复）</div>'
        ;
};