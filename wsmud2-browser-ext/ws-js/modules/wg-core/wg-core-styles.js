// ============================================================
// wg-core-styles.js —— WG 核心界面样式
// ------------------------------------------------------------
// 从 wg-core.js login() 中提取的 CSS 字符串，供 wg-core-login.js 使用。
// 包含：zdy-item 按钮样式、代码框字体样式、背景图样式。
// ============================================================
'use strict';

// 自定义按钮/日志/开关等核心样式
function _getZdyItemCSS() {
    return `.zdy-item{
        display: inline-block;
        border: solid 1px gray;
        color: gray;
        background-color: black;
        text-align: center;
        cursor: pointer;
        border-radius: 0.25em;
        min-width: 2.5em;
        min-height: 0.5em;
        margin-right: 0em;
        margin-left: 0.4em;
        position: relative;
        padding-left: 0.4em;
        padding-right: 0.4em;
        line-height: 24px;
        transition: background-size 0.2s linear;
        background: linear-gradient(to top, rgba(128, 128, 128, 0.5) 0%, rgba(128, 128, 128, 0.5) 100%);
        background-size: 0% 100%;
        background-position: 100% 100%;
        background-repeat: no-repeat;
    }
    .zdy-commands {
        white-space: nowrap;
        overflow-x: auto;
        display: block;
        line-height: 2em;
        margin-bottom: 0.25em;
    }
    .zdy-commands>.act-item {
        display: inline-block;
        border: solid 1px gray;
        color: gray;
        background-color: black;
        text-align: center;
        cursor: pointer;
        border-radius: 4px;
        min-width: 2.5em;
        margin-right: 0.5em;
        position: relative;
        padding-left: 0.4em;
        padding-right: 0.4em;
        margin-bottom: 2px;
        background: linear-gradient(to top, rgba(128, 128, 128, 0.5) 0%, rgba(128, 128, 128, 0.5) 100%);
        background-size: 0% 100%;
        background-position: 100% 100%;
        background-repeat: no-repeat;
    }
    .zdy-commands .act-item.act-item-zdy,
    .item-commands .act-item.act-item-zdy {
        min-width: 2.5em;
        padding-left: 0.4em;
        padding-right: 0.4em;
    }
    .WG_left_log{
        flex: 1;
        overflow-y: auto;
        border: 1px solid #404040;
        max-height: 10em;
        width: calc(100% - 10px);
        border-radius: 0.5em;
    }
    .WG_left_log > pre {
        margin: 0px;
        white-space: pre-line;
    }
    .WG_right_log {
        flex: 1;
        overflow-y: auto;
        max-height: 25em;
        width: calc(100% - 10px);
        margin-top: 4px;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
    }
    .WG_right_log_title {
        color: #ffffff;
        font-weight: bold;
        padding: 4px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.25);
        flex-shrink: 0;
    }
    .WG_right_log > pre {
        margin: 0px;
        white-space: pre-line;
        flex: 1;
        overflow-y: auto;
        padding: 4px 10px;
    }
    .WG_button {
        width: calc(100% - 40px); 
        overflow-x: auto;
        display: block;
        line-height:2em;
        justify-content: flex-start;
        padding: 10px 0;
    }
    .WG_button > .zdy-item:active {background-color: gray;color:black;}
    .item-plushp{display: inline-block;float: right;width: 100px;}
    .item-dps{display: inline-block;float: right;width: 100px;}
    .settingbox {margin-left: 0.625em;border: 1px solid gray;background-color: transparent;color: unset;resize: none;width: 80%;height: 3rem;}
    .runtest textarea{display:block;width:300px;height:160px;border:10px solid #F8F8F8;border-top-width:0;padding:10px;line-height:20px;overflow:auto;background-color:#3F3F3F;color:#eee;font-size:12px;font-family:'JetBrains Mono',monospace}
    .layui-btn,.layui-input,.layui-select,.layui-textarea,.layui-upload-button{outline:0;-webkit-appearance:none;transition:all .3s;-webkit-transition:all .3s;box-sizing:border-box}
    .layui-btn{display:inline-block;height:38px;line-height:38px;padding:0 18px;background-color:#009688;color:#fff;white-space:nowrap;text-align:center;font-size:14px;border:none;border-radius:2px;cursor:pointer}
    .layui-btn-normal{background-color:#1E9FFF}
    .layui-layer-moves{background-color:transparent}
    .switch2 {display: inline-block;position: relative;height: 1.25em;width: 3.125em;line-height: 1.25em;
        border-radius: 0.875em;background: #dedede;cursor: pointer;-ms-user-select: none;-moz-user-select: none;
        -webkit-user-select: none;user-select: none;vertical-align: middle;text-align: center;}
    .switch2 > .switch-button {position: absolute;left: 0px;height: 1.25em;width: 1.25em;
        border-radius: 0.875em;background: #fff;box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
        transition: 0.3s;-webkit-transition: 0.3s;left: 0px;}
    .switch2 > .switch-text {color:#898989;margin-left: 0.625em;}
    .on>.switch-button {right:0px;left:auto;}
    .on>.switch-text {color:#ffffff;margin-right: 0.625em;margin-left: 0px;}
    .on {background-color:#008000;}
    .crit{
        height:24px;
        position:relative;
        animation:myfirst 1s;
        -webkit-animation:myfirst 0.4s;
    }
    @keyframes myfirst {
        0%   {background:red; left:0px; top:0px;}
        33%  {background:red; left:0px; top:-14px;}
        66%  {background:red; left:0px; top:14px;}
        100% {background:red; left:0px; top:0px;}
    }
    @-webkit-keyframes myfirst {
        0%   {background:red; left:0px; top:0px;}
        33%  {background:red; left:0px; top:-30px;}
        100% {background:red; left:0px; top:0px;}
    }
    .rainbow-text{
        color:red;
        background-image: repeating-linear-gradient(45deg, violet, indigo, blue, green, yellow, orange, red, violet);
        background-size:800% 800%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: rainbow 8s ease infinite;
        -webkit-animation: rainbow 8s ease infinite;
        font-weight: bold;
    }
    @keyframes rainbow {
        0%{background-position:0% 50%}
        50%{background-position:100% 25%}
        100%{background-position:0% 50%}
    }
    @keyframes highlight-gradient {
        0%  {background-position: 0% 50%;}
        100%{background-position: 100% 50%;}
    }
    .high-light-name {
        animation:  highlight-gradient 5s infinite;
        background: linear-gradient(90deg, #f0f, #0ff, #ff0, #f0f);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: bold;
    }
    #raidToolbar, #raidToolbar * { box-sizing: content-box; }
    .WG_left_log, .WG_left_log * { box-sizing: content-box; }
    .supernova-text {
        position: relative !important;
        font-weight: bold;
        font-family: "Microsoft YaHei", "微软雅黑", sans-serif;
        color: transparent !important;
        background: linear-gradient(90deg, #f0f, #0ff, #ff0, #f0f);
        background-size: 300% 300%;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        -webkit-background-clip: text;
        animation: text-flow 6s linear infinite;
    }
    @keyframes text-flow {
        0%   { background-position: 0% 50%; }
        100% { background-position: 300% 50%; }
    }`;
}

// 【2026-09-07 全面重设计】弹窗/列表/表单设计系统（青金夜色主题）
// 供 触发 / 流程 / 自命令 三个面板的列表页与弹窗共用；在 wg-core-login.js 登录时注入。
function _getDialogCSS() {
    return `
    /* 【2026-09-08 接近原生】调色板改为近黑中性(去靛蓝/紫)，保留青/金/绿/红等原生彩色点缀，侧栏/按钮/弹窗统一 */
    :root {
        --ws-bg: #0c0c10; --ws-card: #16161a; --ws-card-hover: #202026;
        --ws-border: #35353c; --ws-border-hover: #50505a; --ws-line: #26262c;
        --ws-cyan: #4fd6bd; --ws-gold: #d9b45c; --ws-danger: #d9534f; --ws-success: #5cb85c;
        --ws-text: #e8e8ea; --ws-text-dim: #9a9aa3; --ws-text-weak: #6a6a72;
    }
    /* 主界面侧栏/面板接近原生黑，与中栏黑色自然衔接 */
    .left, .right { background: var(--ws-bg); }
    .left-content { border-radius: 8px; }
    .content-title, .content-info { border-color: var(--ws-border) !important; background: var(--ws-card); border-radius: 8px; }
    .item-row { border-bottom-color: var(--ws-line) !important; }
    .right-channel, .right-channel-tabs { background-color: transparent !important; border-color: var(--ws-border); }
    .right-channel-tabs > span { color: var(--ws-text-dim); }
    .right-channel-tabs > span:hover { background: var(--ws-card-hover); color: var(--ws-text); }
    .right-channel-tabs > span.selected { background: rgba(255,255,255,.12); color: var(--ws-text); }
    .WG_right_log { background-color: transparent !important; border-color: var(--ws-border); }
    .WG_right_log_title { color: var(--ws-text); border-bottom-color: var(--ws-border); }
    .right-divider { background: var(--ws-border); }
    .right-divider:hover, .right-divider.active { background: rgba(255,255,255,.4); }
    .wsmd-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(8, 8, 18, .72); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
    }
    .wsmd-modal {
        background: var(--ws-bg); border: 1px solid var(--ws-border);
        border-radius: 12px; box-shadow: 0 0 40px rgba(0,0,0,.55);
        display: flex; flex-direction: column; width: 80vw; height: 75vh;
        max-width: 95%; max-height: 85vh; overflow: hidden; position: relative;
    }
    .wsmd-modal-header {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 16px; border-bottom: 1px solid var(--ws-border); flex-shrink: 0;
    }
    .wsmd-modal-title { flex: 1; font-size: 15px; font-weight: 600; color: var(--ws-text); text-align: left; }
    .wsmd-modal-close {
        flex-shrink: 0; width: 26px; height: 26px; line-height: 1; font-size: 15px;
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        color: var(--ws-text-dim); background: transparent; border: none; border-radius: 6px;
        transition: all .15s ease;
    }
    .wsmd-modal-close:hover { color: var(--ws-danger); background: rgba(229,88,79,.12); }
    .wsmd-modal-body { flex: 1; overflow: auto; padding: 14px 16px; }
    .wsmd-modal-footer {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 10px 16px; border-top: 1px solid var(--ws-border); flex-shrink: 0;
    }
    .wsmd-modal-foot-left { display: inline-flex; align-items: center; gap: 6px; }
    .wsmd-modal-foot-right { display: inline-flex; align-items: center; gap: 6px; }

    /* 按钮体系 */
    .wsmd-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 4px;
        height: 28px; padding: 0 14px; font-size: 13px; line-height: 1;
        color: var(--ws-text); background: var(--ws-card); border: 1px solid var(--ws-border-hover);
        border-radius: 6px; cursor: pointer; user-select: none; white-space: nowrap;
        transition: all .15s ease; text-decoration: none;
    }
    .wsmd-btn:hover { background: var(--ws-card-hover); border-color: var(--ws-border-hover); }
    .wsmd-btn:active { transform: translateY(1px); }
    .wsmd-btn-primary { color: var(--ws-cyan); border-color: var(--ws-cyan); background: transparent; }
    .wsmd-btn-primary:hover { background: rgba(65,217,183,.12); border-color: var(--ws-cyan); }
    .wsmd-btn-gold { color: var(--ws-gold); border-color: var(--ws-gold); background: transparent; }
    .wsmd-btn-gold:hover { background: rgba(232,180,90,.12); border-color: var(--ws-gold); }
    .wsmd-btn-success { color: var(--ws-success); border-color: var(--ws-success); background: transparent; }
    .wsmd-btn-success:hover { background: rgba(76,175,121,.12); border-color: var(--ws-success); }
    .wsmd-btn-danger { color: var(--ws-danger); border-color: var(--ws-danger); background: transparent; }
    .wsmd-btn-danger:hover { background: rgba(229,88,79,.12); border-color: var(--ws-danger); }
    .wsmd-btn-ghost { color: var(--ws-text-dim); border-color: transparent; background: transparent; }
    .wsmd-btn-ghost:hover { color: var(--ws-text); background: transparent; border-color: transparent; }
    .wsmd-btn-muted { color: var(--ws-text-dim); }
    .wsmd-btn-muted:hover { color: var(--ws-text); }
    .wsmd-btn-sm { height: 22px; padding: 0 9px; font-size: 12px; border-radius: 5px; }

    /* 列表 */
    .wsmd-list-head { display: flex; align-items: center; margin-bottom: 8px; height: 34px; box-sizing: border-box; padding: 0; border-bottom: 1px solid var(--ws-border); }
    .wsmd-list-head-left  { flex: 0 0 auto; min-width: 80px; display: flex; align-items: center; gap: 6px; }
    .wsmd-list-head-title { flex: 1; text-align: center; font-weight: 600; font-size: 14px; color: var(--ws-text); }
    .wsmd-list-head-right { flex: 0 0 auto; min-width: 80px; display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
    /* 列表整体外框：上下用框线把列表括起来，与日志区其他内容分隔 */
    .wsmd-list { margin: 0; border: 1px solid var(--ws-border-hover); border-radius: 8px; overflow: hidden; }
    /* 【2026-09-07】列表项用分隔线划分（卡片式在深色主题下分隔不明显） */
    .wsmd-list-row {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 10px; margin: 0;
        font-size: 13px;
        border-bottom: 1px solid var(--ws-line);
        transition: background .15s ease;
    }
    .wsmd-list-row:last-child { border-bottom: none; }
    .wsmd-list-row:hover { background: var(--ws-card-hover); }
    .wsmd-list-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ws-text); }
    .wsmd-list-actions { display: inline-flex; align-items: center; gap: 6px; }
    .wsmd-empty { text-align: center; color: var(--ws-text-weak); padding: 26px 0; font-size: 13px; line-height: 1.7; }
    /* 冻结列表表头：raid 列表渲染到左日志区时，滚动日志而表头固定（wsmd-list 的 overflow:hidden 会吞掉 sticky，需覆盖为 visible） */
    .WG_left_log .wsmd-list { overflow: visible; }
    .WG_left_log .wsmd-list-head { position: sticky; top: 0; z-index: 3; background: var(--ws-card); border-radius: 7px 7px 0 0; }

    /* 表单 */
    .wsmd-form { margin: 0; }
    .wsmd-field { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
    .wsmd-field-col { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; margin: 8px 0; }
    .wsmd-label { flex-shrink: 0; font-size: 13px; color: var(--ws-text-dim); }
    .wsmd-input, .wsmd-select, .wsmd-textarea {
        background: var(--ws-bg); border: 1px solid var(--ws-border); border-radius: 6px;
        color: var(--ws-text); padding: 4px 8px; font-size: 13px; outline: none; caret-color: var(--ws-cyan);
        transition: border-color .15s ease, box-shadow .15s ease;
    }
    .wsmd-input:focus, .wsmd-select:focus, .wsmd-textarea:focus {
        border-color: var(--ws-cyan); box-shadow: 0 0 0 3px rgba(65,217,183,.15);
    }
    .wsmd-textarea { line-height: 1.5; resize: vertical; font-family: inherit; border-color: var(--ws-border-hover); }
    .wsmd-code { font-family: 'JetBrains Mono', monospace !important; }

    /* 滚动条 */
    .wsmd-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .wsmd-scroll::-webkit-scrollbar-track { background: transparent; }
    .wsmd-scroll::-webkit-scrollbar-thumb { background: var(--ws-border); border-radius: 4px; }
    .wsmd-scroll::-webkit-scrollbar-thumb:hover { background: var(--ws-text-weak); }

    /* 模板卡片（触发-选择事件） */
    .wsmd-tpl-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .wsmd-tpl-card {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 110px; padding: 10px 14px; font-size: 13px; cursor: pointer;
        color: var(--ws-text); background: var(--ws-card); border: 1px solid var(--ws-cyan);
        border-radius: 8px; transition: all .15s ease;
    }
    .wsmd-tpl-card:hover { background: rgba(65,217,183,.12); color: var(--ws-cyan); }

    /* 触发表单：左条件列 + 右编辑器 */
    .wsmd-trigger-form { display: flex; gap: 14px; align-items: stretch; }
    .wsmd-trigger-filters { flex: 0 0 150px; overflow-y: auto; padding-right: 6px; }
    .wsmd-trigger-editor { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
    .wsmd-filter-card {
        background: var(--ws-card); border: 1px solid var(--ws-border); border-radius: 8px;
        padding: 6px 10px; margin-bottom: 6px; display: block;
    }

    /* 颜色标签兜底：弹窗/列表头里旧的 <wht>/<hir> 等标签也能上色 */
    .wsmd-overlay wht, .wsmd-list-head wht { color: #ffffff; }
    .wsmd-overlay hiy, .wsmd-list-head hiy { color: #ffee58; }
    .wsmd-overlay hir, .wsmd-list-head hir { color: #ef5350; }
    .wsmd-overlay hio, .wsmd-list-head hio { color: #ff9800; }
    .wsmd-overlay hig, .wsmd-list-head hig { color: #66bb6a; }
    .wsmd-overlay hic, .wsmd-list-head hic { color: #4fc3f7; }

    /* ===== 自命令/监控面板（#zmlandztjk 作用域） ===== */
    #zmlandztjk, #zmlandztjk * { box-sizing: border-box; }
    #zmlandztjk .wsmd-section-title {
        font-weight: 600; font-size: 13px; color: var(--ws-text);
        padding: 4px 0; border-bottom: 1px solid var(--ws-border); margin-bottom: 6px;
    }
    #zmlandztjk .wsmd-input, #zmlandztjk .wsmd-select, #zmlandztjk .wsmd-textarea { width: 100%; }
    #zmlandztjk .zml-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 2px;
        height: 24px; padding: 0 10px; font-size: 12px; line-height: 1; white-space: nowrap;
        color: var(--ws-text); background: var(--ws-card); border: 1px solid var(--ws-border-hover);
        border-radius: 5px; cursor: pointer; transition: all .15s ease; margin: 0 2px;
    }
    #zmlandztjk .zml-btn:hover { opacity: .85; background: var(--ws-card-hover); border-color: var(--ws-border-hover); }
    #zmlandztjk .zml-btn-run { border-color: var(--ws-cyan); color: var(--ws-cyan); }
    #zmlandztjk .zml-btn-run:hover { background: rgba(65,217,183,.12); }
    #zmlandztjk .zml-btn-edit { color: var(--ws-text); }
    #zmlandztjk .zml-btn-quick { border-color: var(--ws-success); color: var(--ws-success); }
    #zmlandztjk .zml-btn-quick:hover { background: rgba(76,175,121,.12); }
    #zmlandztjk .zml-btn-quick-off { color: var(--ws-text-weak); }
    #zmlandztjk .zml-btn-move { border-color: transparent; background: transparent; color: var(--ws-text-dim); }
    #zmlandztjk .zml-btn-action { color: var(--ws-text-dim); }
    #zmlandztjk .zml-btn-add { border-color: var(--ws-gold); color: var(--ws-gold); height: 26px; padding: 0 14px; }
    #zmlandztjk .zml-btn-add:hover { background: rgba(232,180,90,.12); }
    #zmlandztjk .zml-move-wrap { display: flex; width: 90px; }
    #zmlandztjk .zml-move-wrap .zml-btn-move { flex: 1; margin: 0; border-radius: 0; }
    #zmlandztjk .zml-move-wrap .zml-btn-move:first-child { border-radius: 5px 0 0 5px; }
    #zmlandztjk .zml-move-wrap .zml-btn-move:last-child { border-radius: 0 5px 5px 0; }
    /* ZML 列表项交换动画（transition-group name="zml-flip"） */
    .zml-flip-move { transition: transform .25s ease; }
    .zml-flip-enter-active { transition: all .25s ease; }
    .zml-flip-leave-active { transition: all .25s ease; position: absolute; }
    .zml-flip-enter { opacity: 0; transform: translateY(-10px); }
    .zml-flip-leave-to { opacity: 0; transform: translateY(10px); }
    /* layer 弹窗白色关闭按钮（仅本插件 layer，不改游戏自身） */
    .layui-layer-setwin .layui-layer-close1 { background: none !important; text-decoration: none !important; outline: none; border-bottom: none !important; }
    .layui-layer-setwin .layui-layer-close1:before { content: "\\2716"; font-size: 16px; color: #fff; text-decoration: none !important; }
    .layui-layer-setwin .layui-layer-close1:hover:before { opacity: .7; }
    `;
}

// 代码框等 monospace 字体样式
function _getCodeFontCSS() {
    return `
        #testmain,
        .runtest textarea,
        #create-flow-source,
        #modify-flow-source,
        #loginhml {
            font-family: 'JetBrains Mono', monospace !important;
        }
        textarea.settingbox[style*="height:10rem"],
        textarea.settingbox[style*="height:5rem"],
        textarea.settingbox[style*="height: 10rem"],
        textarea.settingbox[style*="height: 5rem"] {
            font-family: 'JetBrains Mono', monospace !important;
        }
    `;
}

// 背景图模糊样式（backimageurl 不为空时启用）
function _getBackImageCSS() {
    return `
    .loading {
        background-color: rgba(252, 248, 227, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .loader {
        background-color: rgba(252, 248, 227, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .mypanel > ul > .active {
        background-color: rgba(51, 122, 183, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .mypanel .content {
        background-color: rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .mypanel .bottom {
        background-color: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .panel_item {
        background-color: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .panel_item:hover {
        background-color: rgba(153, 153, 153, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .scroll-flag {
        background-color: rgba(34, 34, 34, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .chat-panel > .channel-emotes,
    .chat-panel > .channel-box > span,
    .chat-panel > .channel-box > .selected,
    .chat-panel > .channel-box > .close {
        background-color: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .chat-panel > .chat-input > .sender-box,
    .chat-panel > .chat-input > .sender-btn {
        background-color: rgba(190, 190, 190, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .tool-bar > .tool-item {
        background-color: rgba(128, 128, 128, 1);
    }
    .tool-bar > .tool-item:hover {
        background-color: rgba(102, 102, 102, 1);
    }
    .room-commands>.act-item,
    .combat-commands>.pfm-item {
        display: inline-block;
        border: solid 1px gray;
        color: gray;
        background-color: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
        text-align: center;
        cursor: pointer;
        border-radius: 4px;
        min-width: 2.5em;
        margin-right: 0.5em;
        position: relative;
        padding-left: 0.4em;
        padding-right: 0.4em;
        margin-bottom: 2px;
        background: linear-gradient(to top, rgba(128, 128, 128, 0.5) 0%, rgba(128, 128, 128, 0.5) 100%);
        background-size: 0% 100%;
        background-position: 100% 100%;
        background-repeat: no-repeat;
    }
    .item-commands > span {
        background-color: rgba(0, 0, 0, 0.3);
    }
    .warn-dialog {
        background: rgba(17, 17, 17, 0.5);
    }
    .dialog > .dialog-header,
    .dialog-score > .score-section,
    .dialog-titles > .title-item,
    .dialog-titles > .title-item > .btn-noused,
    .dialog > .dialog-footer,
    .dialog > .dialog-footer > .eq-group,
    .dialog-skills > .skill-item,
    .dialog-skills > .book-item,
    .dialog-skills > .book-item > .book-action,
    .obj-list > .obj-item,
    .trade-list > .obj-item,
    .obj-item > .obj-oper,
    .eq-list > .eq-item,
    .eq-list > .eq-item > .eq-type,
    .state-bar,
    .state-bar > .item-command,
    .setting-item,
    .setting-item > .button,
    .setting-item > .button:active,
    .extend-list > .buttons > button,
    .extend-row,
    .extend-row > .extend-input,
    .extend-menus > button,
    .skey-item,
    .skey-item > .skey-key,
    .switch,
    .dialog-confirm,
    .dialog-party > .party-roles > .party-role,
    .dialog-party > .party-item,
    .dialog-party > .party-item > .party-item-cmd,
    .confirm-count > .btn,
    .dialog-pms > .pm-item,
    .dialog-pms > .selected,
    .dialog-events > .event-item,
    .dialog-tasks > .task-item,
    .fb-actions > .fb-action,
    .fb-actions > .fb-action > .action-name,
    .dialog-fb > .fb-left > .fb-content > .fb-item,
    .dialog-fb > .fb-left > .fam-item,
    .dialog-shop > .shop-item,
    .dialog-shop > .shop-item > .shop-btn,
    .stats-container-left > .stats-silder,
    .stats-container-left > .select,
    .dialog-stats > .top-item,
    .dialog-message > .message-list > .message-item,
    .dialog-team > .team-item,
    .dialog-relation > .relation-item,
    .dialog-relation > .relation-item > .relation-cmd,
    .detail-item,
    .detail-item > .detail-rec,
    .zdy-item,
    .raid-item,
    .item-commands>span {
        background-color: rgba(17, 17, 17, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    .item-commands .zdy-item {
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        background-color: rgba(0, 0, 0, 0.8);
    }
    .switch {
        background-color: rgba(34, 34, 34, 0.3);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }
    div.room_desc,
    div.room_title {
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        background-color: rgba(34, 34, 34, 0.5);
        padding: 1px;
        border-radius: 4px;
        overflow: hidden;
    }
    div.room_desc span,
    div.room_title span {
        background-color: transparent !important;
    }
    `;
}