// ============================================================
// GM_API.js —— 模拟油猴（Tampermonkey）的 GM_* 系列函数
// ------------------------------------------------------------
// 这个插件最初是"油猴脚本"，油猴给脚本提供了一套 GM_* 函数：
//   GM_setValue()   存数据
//   GM_getValue()   读数据
//   GM_addStyle()   注入 CSS 样式
//   ... 等等
// 现在改成浏览器扩展了，没有油猴了，所以这里自己写一份一模一样的，
// 让所有脚本照旧用 GM_* 函数，底层实际存进浏览器的 localStorage。
//
// 通俗理解：GM_* 就是插件的"存东西/取东西"工具箱，
// 游戏里的各种设置、开关、配置，都靠它保存，关掉浏览器也不会丢。
// ============================================================

// 相当于 window（全局对象），游戏脚本里用 window 的地方都可以用 unsafeWindow
let unsafeWindow = window;
// 插件信息（版本号等），下面会从服务器拉取
let GM_info = {};
// 一个 HTTP 请求对象，用来请求远程版本信息
var httpRequest = new XMLHttpRequest();

// 往页面里注入一段 CSS 样式（比如加自定义颜色、边框）
function GM_addStyle(css) {
    try {
        const style = document.createElement("style");   // 造一个 <style> 标签
        style.textContent = css;                          // 把 CSS 文字放进去
        (document.head || document.body || document.documentElement || document).appendChild(style);  // 挂到页面
    } catch (e) {
        console.log("GM_addStyle: " + e);
    }
}

// 【存配置】写入一个值：key 是名字，value 是内容（会自动转成 JSON 字符串存）
// 【2026-08-11 参考 Violentmonkey GM 标准】① undefined 值转 null（避免 JSON.stringify(undefined) 返回 undefined 写脏数据）
// ② localStorage 写满（约 5MB 配额）时给出警告并建议导出备份，不再静默失败
// 【2026-08-14 跨窗口同步】③ 全局设置（_ 开头 / color_select）变更时广播到其它游戏窗口
//   —— 由设置面板"跨窗口同步全局设置"开关控制（window.__extConfigSyncOn），默认关；
//   —— window.__extSyncApplying 为接收同步写入时的抑制标记（防循环广播）
function GM_setValue(key, value) {
    try {
        if (value === undefined) value = null;   // undefined 无法 JSON 序列化，统一存 null
        localStorage.setItem(key, JSON.stringify(value));
        if (window.__extConfigSyncOn && !window.__extSyncApplying &&
            (key.charAt(0) === '_' || key === 'color_select')) {
            try {
                window.postMessage({ __EXT_BRIDGE__: true, action: 'extConfigSync', key: key, value: value }, '*');
            } catch (e) { }
        }
    } catch (e) {
        if (e && e.name === 'QuotaExceededError') {
            try { ExtLog.warn('配置存储已满（' + key + ' 写入失败），建议：设置 → 导出配置备份'); } catch (e2) { }
            console.warn('[WSMUD] GM_setValue 存储满:', key, e);
        } else {
            console.log("GM_setValue: " + e);
        }
    }
}

// 【读配置】读取一个值（会自动把 JSON 字符串还原成原来的类型）
// 注意：如果没存过（或存的值是空），就返回 defaultValue（默认值）
function GM_getValue(key, defaultValue) {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;   // 没存过 → 用默认值
    try {
        return JSON.parse(stored);      // 存过 → 解析还原
    } catch (e) {
        console.log("GM_getValue: " + e);
        return defaultValue;
    }
}

// 列出所有已存配置的名字（key）列表
function GM_listValues() {
    const length = localStorage.length;
    const keys = [];
    for (let i = 0; i < length; i++) {
        keys.push(localStorage.key(i));
    }
    return keys;
}

// 删除一个配置项
// 【2026-08-11】try 包裹（隐私模式/禁用存储时 removeItem 可能抛错）
function GM_deleteValue(key) {
    try { localStorage.removeItem(key); } catch (e) { }
}



// 复制文本到剪贴板
// 【2026-08-14 现代化】优先用 navigator.clipboard.writeText（异步、标准 API），
// 失败时回退到老的"造输入框 + execCommand"方案（execCommand 已废弃，部分环境失效）
function GM_setClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            navigator.clipboard.writeText(text).catch(function () {
                _clipboardFallback(text);   // 权限/安全上下文受限时回退
            });
            return;
        } catch (e) { }
    }
    _clipboardFallback(text);
}
function _clipboardFallback(text) {
    try {
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.value = text;
        input.focus();
        input.select();
        document.execCommand("copy");
        input.blur();
        document.body.removeChild(input);
    } catch (e) {
        console.log("GM_setClipboard: " + e.message);
    }
}

// 【导出全部配置】把所有 GM 配置打包成一个 JSON 字符串
// 如果运行在安卓壳里（有 android.exportToFile 接口），还会顺便写进文件
function GM_export(filename = "wsmud_data.json") {
    try {
        const keys = GM_listValues();
        const data = {};
        for (let i = 0; i < keys.length; i++) {
            data[keys[i]] = GM_getValue(keys[i]);   // 一个 key 一个值，装进 data 对象
        }
        const json = JSON.stringify(data, null, 2);  // 转成好看缩进的 JSON 文本
        console.log(json);
        if (typeof android !== "undefined" && android.exportToFile) {
            android.exportToFile(json, filename);    // 安卓环境写文件
        }
        return json;
    } catch (e) {
        console.log("GM_export: " + e.message);
        return null;
    }
}

// 【导入配置】把 JSON 字符串（或对象）里的内容全部写回 GM 配置
function GM_import(data) {
    try {
        const obj = typeof data === "string" ? JSON.parse(data) : data;  // 字符串就解析成对象
        for (const key in obj) {
            GM_setValue(key, obj[key]);   // 逐条写回
        }
        console.log("数据导入成功");
        return true;
    } catch (e) {
        console.log("GM_import: " + e.message);
        return false;
    }
}

// 导出时用带时间戳的文件名（比如 wsmud_data_2026-08-08T15-53-01.json）
function GM_exportToFile() {
    return GM_export("wsmud_data_" + new Date().toISOString().slice(0, 19).replace(/:/g, "-") + ".json");
}

// 【2026-08-17】版本号从 localStorage 读取（由 content.js 最先写入）
GM_info.script = { version: localStorage.getItem('wsmud_version') || "" };
// 服务器接口保留（用于可能的未来功能），但不再覆盖版本号
// 【2026-08-14 修复】升级为 https（防游戏站将来上 https 后被混合内容拦截）+ 3 秒超时 + 解析保护
httpRequest.open("GET", "https://wsmud.ii74.com/S/version", true);  // 请求远程版本接口
httpRequest.timeout = 3000;
httpRequest.send();
httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === 4 && httpRequest.status === 200) {  // 请求完成且成功
        try {
            const text = httpRequest.responseText;
            // 不再覆盖版本号，保持 manifest.json 的版本
            // GM_info.script = JSON.parse(text);   // 服务器返回的版本信息（已废弃）
        } catch (e) { }   // 返回非 JSON 时保持默认值，不报错
    }
};
