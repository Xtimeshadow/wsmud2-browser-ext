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
    .WG_log{
        flex: 1;
        overflow-y: auto;
        border: 1px solid #404040;
        max-height: 10em;
        width: calc(100% - 10px);
        border-radius: 0.5em;
    }
    .WG_log > pre {
        margin: 0px;
        white-space: pre-line;
    }
    .WG_log_log {
        flex: 1;
        overflow-y: auto;
        border: 1px solid #303030;
        max-height: 25em;
        width: calc(100% - 10px);
        border-radius: 0.5em;
        margin-top: 4px;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
    }
    .WG_log_log_title {
        color: #ffffff;
        font-size: 14px;
        font-weight: bold;
        padding: 4px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.25);
        flex-shrink: 0;
    }
    .WG_log_log > pre {
        margin: 0px;
        white-space: pre-line;
        flex: 1;
        overflow-y: auto;
        padding: 4px 10px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
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
    .WG_log, .WG_log * { box-sizing: content-box; }
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