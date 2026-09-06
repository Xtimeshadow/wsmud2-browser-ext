// ============================================================
// config-vars.js —— 全局配置与常量中心（个性化修改的第一站！）
// ------------------------------------------------------------
// 插件的各种"默认设置"几乎都在这里：
//   place / mpz_path / needfind  各地点的寻路命令表（可改坐标）
//   autowork       挂机模式（0挖矿/1修炼/2钓鱼）
//   auto_pfmswitch / auto_pfm_mode  自动施法开关 / 智能或顺序模式
//   unauto_pfm     自动施法黑名单（哪些招不自动放）
//   automarry      自动喜宴
//   autoBoss / BossName / auto_command  自动打 BOSS
//   skillCD / buffCD / busy_info / getitemShow  显示开关
//   autoBuyList    自动购买清单（自动买药等）
//   onekey_fenjie / fj_sc / fenjieList  一键分解装备
//   shieldswitch / shield / shieldkey  聊天屏蔽
//   pushSwitch / pushType / pushToken  远程推送设置
//   die_str / custom_dock / backimageurl / color_select  外观杂项
//   zdyskills / zdyskilllist  自定义技能顺序
//   saveAddr       存仓地点
//   timequestion   定时任务
//   zdy_btnlist    自定义按钮
// 注意：这里是"默认值"，游戏里设置面板改过的值会覆盖它们（存 GM 配置里）。
// ============================================================
// config-vars.js
// L helper and global config variables
'use strict';

// 工具函数集合
var LayerHelper = {
    msg: function (msg) {
        if (layer) {
            layer.msg(msg, {
                offset: '50%',
                shift: 5
            })
        } else {
            messageAppend(msg);
        }
    },
    // 检测是否为移动设备
    isMobile: function () {
        var ua = navigator.userAgent;
        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
            isIphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
            isAndroid = ua.match(/(Android)\s+([\d.]+)/),
            isMobile = isIphone || isAndroid;
        return isMobile;
    }
};

// 房间物品选择索引
var roomItemSelectIndex = -1;
var itemKeys = [
"name", "id", "count", "grade", "unit",
"value", "can_eq", "can_use", "can_study",
"can_open", "can_combine", "locked"
];
var eqKeys = [
"name", "id", "grade", "can_use", "locked"
];
var selllistKeys = [
"name", "id", "count", "locked", "unit", "value"
];
var storeKeys = [
"name", "id", "count", "grade", "unit",
"value", "can_eq", "can_use", "can_study", 
"can_open", "can_combine"
];
var shopKeys = [
"id", "name", "desc", "price", "off", "max", "count", "buy"
];

// 计时器变量
var timer = 0;
// 计数器变量
var cnt = 0;
// 装备NPC变量
var zb_npc;
// 装备地点变量
var zb_place;
// 下一步操作标识
var next = 0;
// 房间数据数组
var roomData = [];
// 仓库数据数组
var storeData = [];
// 仓库物品列表
var store_list = [];
// 锁定物品列表
// 角色ID
var roleid;
// 玩家门派
var family = null;
// 副本路径配置
var fb_path = [];

//自动重连
var auto_relogin = null;
// 【2026-08-13 自动恢复】重连失败达上限后自动刷新页面重新登录（服务器无人值守场景）
var auto_recover = '开';
//dps统计信息
var normalHitCount = 0;       // 普通攻击次数
var normalDamageTotal = 0;    // 普通伤害总和
var dpssakada = '开'          // DPS统计开关
var critDamageTotal = 0;      // 暴击伤害总和
var critHitCount = 0;         // 暴击次数
var dpsLocked = 0;            // DPS统计锁定标志
var battleStartTime = 0;      // 战斗开始时间
var lastCritDamage = 0, lastNormalDamage = 0;  // 上次暴击/普通伤害
//funny计算
var funnycalc = '关';
//后台保活（全局键 _keepalive，防多开挂机被浏览器节流）
var keepalive = '开';
// 【2026-08-14 跨窗口同步】全局设置同步开关（全局键 _ext_sync_global，默认关）
var ext_sync_global = '关';
var expGained = 0;            // 获得经验
var potGained = 0;            // 获得潜能
//彩虹名字
var rainbow_name = null;
//登录后执行
var loginhml = '';

//【2026-08-09 移植v1.0.0】自动售卖清单 / 自动使用清单（物品名称，半角逗号分隔，模糊匹配）
var autoSellList = "";
var autoUseList = "";

//挂机选项
var autowork = '0';
//显示昏迷信息
var busy_info = "开";
//显示CD信息
var skillCD = "关";
var buffCD = "开";
// 【2026-08-12 移植作者 f45137e】CD 显示颜色（游戏颜色标签：hir红/hig绿/hiy黄/hic青/hiz蓝/hio橙/wht白）
var skillCDColor = 'hir';
var buffCDColor = 'hig';
// 【2026-08-13 移植作者 26.2】自动买符开关 + 活动轮询间隔
var auto_buy_talisman = false;
var event_poll_interval = 1;
var _eventPollTimer = null;
// 【2026-08-13 挂机健康自检】定时检查页面卡顿隐患（消息积压/日志膨胀/DOM节点/存储占用），默认开
var healthcheck_enabled = true;
var _healthTimer = null;
var _hcWarnedDom = false;        // DOM 超限是否已提示（防止每 5 分钟刷屏）
var _hcWarnedStorage = false;    // 存储超限是否已提示
// 获得物品展示设置
var getitemShow = "开";
var itemTotalCount = {};
var raidItemData = {};
var zmlshowsetting = 0;

// 自动喜宴
var automarry = '开';
// 自动boss
var autoBoss = null;
var BossName = null;
//停止后动作
var auto_command = null;

// 技能黑名单
var blackpfm = [];
//自动施法黑名单
var unauto_pfm = '';
//自动施法开关
var auto_pfmswitch = "关";
// 自动施法模式 开：智能施法，关：顺序施法
var auto_pfm_mode = "开";
var can_auto = true;

//自动购买
var autoBuyList = "";

//一键分解
var onekey_fenjie = "关";
var follower_fenjie = "关";
var fj_sc = "";
var fenjieList = "";

//死亡提示
var die_str = "";
var custom_dock = 0;
//背景图片
var backimageurl = '';
//配色
var color_select = "normal";

//屏蔽开关
var shieldswitch = "关"
//屏蔽列表
var shield = '';
//屏蔽关键字列表
var shieldkey = '';

//通知推送开关、方式、Token、Url
var pushSwitch = "关";
var pushType = "0";
var pushToken = "";
var _pushDeath = "开";          // 角色死亡/复活自动推送开关
// var pushUrl = "https://";
// 【2026-08-13 无人值守推送】关键事件（掉线/死亡/长时间无消息）自动推送到手机，依赖上面 pushSwitch 总开关
var _lastMsgTime = 0;          // 最后收到服务器消息的时间
var _idleWarned = false;       // 是否已推送过"长时间无消息"（收到消息后重置）
var _PUSH_IDLE_MINUTES = 15;   // 无消息超过此分钟数 → 推送"疑似卡死/断线"
var _pushIdleTimer = null;     // 无消息检测定时器

// 【发呆检测】角色长时间发呆（状态=none且不在战斗）时自动执行指定命令
var _idleCmdSwitch = "关";     // 发呆检测总开关
var _idleCmdSeconds = 120;     // 发呆多少秒后触发（默认2分钟）
var _idleCmdContent = "";      // 发呆时执行的命令（如 "@liaoshang"）
var _idleCmdFired = false;     // 本次发呆周期是否已触发过（恢复后重置）
var _idleCmdTimer = null;      // 发呆检测定时器

//自命令数组  type 0 原生 1 自命令 2js
//[{"name":"name","zmlRun":"zzzz","zmlShow":"1","zmlType":"0"}]
var zml = [];
//状态监控 type 类型  ishave  0 =其他任何人 1= 本人  2 仅npc  send 命令数组
//[{"name":"","type":"status","action":"remove","keyword":"busy","ishave":"0","send":"","isactive":"1","maxcount":10,"pname":"宋远桥","istip":"1"}]
var ztjk_item = [];
//  自定义技能开关
var zdyskills = "关";
var zdyskilllist = "";

//仓库位置
var saveAddr = "关";
//定时任务
//名称   类型 一次 1 每天 0 发送命令  触发时间 24小时制
//[{"name":"","type":"0","send":"","h":"","s":"","m":""}]
var timequestion = [];
//自定义btn
//[{"name":名称,"send":""},]
var inzdy_btn = false;
var zdy_btnlist = [];
// 系列自动开关
var stopauto = false;
//组列表
var eqgroup = [];
var skgroup = [];
// 命令代码显示
var cmd_echo = false;
var Coding = 0;

