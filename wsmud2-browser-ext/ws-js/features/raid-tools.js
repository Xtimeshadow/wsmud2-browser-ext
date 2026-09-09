// ============================================================
// raid-tools.js —— 工具层
// ============================================================

//---------------------------------------------------------------------------
//  Message Output
//---------------------------------------------------------------------------

var WMsg = {
    append: function (msg) {
        console.log(msg);
    },
    clean: function () { },
    cmdLog: function (title, cmd) {
        let msg = `&nbsp;&nbsp;<hic>${title}</hic>`
        if (cmd != null) {
            msg += `: ${cmd}`;
        }
        this.append(msg);
    }
};

// 【2026-09-05 新版客户端适配】新模式跳过 raid-role.js（新客户端自带 Role），
// 由这里把 Raid/Trigger 的日志输出接到插件日志区（原在 raid-role.js 里做）。
// 新模式判定：优先用 content.js 打的标记，兜底自查 DOM。
var _extNewClientMode = window.__extNewClientMode || !!document.querySelector('script[src*="dist_new"]');
if (_extNewClientMode) {
    WMsg.append = function (msg, area) {
        try { messageAppend(msg, area, null, true); } catch (e) { console.log(msg); }
    };
    WMsg.clean = function () {
        try { messageClear(); } catch (e) { }
    };
}

function CopyObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @param {Array} list
 * @param {*} value
 * @param {Function} assert function(previous, current)
 */
const SortInsert = function (list, value, assert) {
    let index = list.length;
    while (index >= 0) {
        if (index == 0) {
            list.splice(index, 0, value);
            break;
        }
        const previous = list[index - 1];
        if (assert(previous, value)) {
            list.splice(index, 0, value);
            break;
        }
        index -= 1;
    }
};

//---------------------------------------------------------------------------
//  Source Split Helper
//---------------------------------------------------------------------------

const SourceCodeHelper = {
    split: function (source) {
        var cmds = source.split(/\s*\n+/g);
        var first = cmds[0];
        if (first != null && /\S/.test(first) == false) {
            cmds.splice(0, 1);
        }
        var last = cmds[cmds.length - 1];
        if (last != null && /\S/.test(last) == false) {
            cmds.splice(cmds.length - 1, 1);
        }
        return cmds;
    },
    appendHeader: function (header, text) {
        let result = `\n${text}`;
        result = result.replace(/(\n)/g, `$1${header}`);
        result = result.replace(/\n\s*\n/g, "\n");
        result = result.replace(/^\s*\n/, "");
        return result;
    }
};

//---------------------------------------------------------------------------
//  Persistent Cache Interface
//---------------------------------------------------------------------------

class PersistentCache {
    constructor(save, getAll, remove) {
        this._save = save;
        this._getAll = getAll;
        this._remove = remove;
    }
    save(key, value) {
        this._save(key, value);
    }
    get(key) {
        return this.getAll()[key];
    }
    getAll() {
        return this._getAll();
    }
    remove(key) {
        this._remove(key);
    }
}

//---------------------------------------------------------------------------
//  Shared Modal / List Shell （2026-09-07 全面重设计）
//---------------------------------------------------------------------------
// 供 触发/流程 面板共用的弹窗与列表页外壳，样式来自 wg-core-styles.js 的
// _getDialogCSS()（wsmd-* 设计系统，登录时注入）。
//   Wsmud.modalShell(opts)  遮罩弹窗外壳
//   Wsmud.listShell(opts)   列表页头部 HTML 字符串
//---------------------------------------------------------------------------
window.Wsmud = window.Wsmud || {};

/**
 * 构造遮罩弹窗外壳：overlay(.wsmd-overlay) > modal(.wsmd-modal) >
 * header(标题 + ✕ 关闭) / body(内容, 可滚动) / footer(左/右操作区)。
 * @param {Object} opts
 *   overlayId  遮罩 id（保留旧 id 供 _closeModal 等依赖）
 *   title      标题 HTML（可含 Vue 指令，原样注入）
 *   content    主体 HTML（原样注入）
 *   left/right 底部操作区 HTML（原样注入）
 *   wrapVue    true 时把 header/body/footer 包进 <div id="app">（trigger 需 Vue 编译）
 *   onLeft/onRight  绑定到 #wsmud_modal_left/right 的点击（raid 用 jQuery 式绑定）
 *   onClose    ✕ 或 Esc 触发
 * @returns {{ overlay: HTMLElement, close: Function }}
 */
Wsmud.modalShell = function (opts) {
    var title = (opts.title || '').toString();
    var content = (opts.content || '').toString();
    var left = (opts.left || '').toString();
    var right = (opts.right || '').toString();
    var header = '<div class="wsmd-modal-header">' +
        '<span class="wsmd-modal-title">' + title + '</span>' +
        '<span class="wsmd-modal-close" data-wsmd-close title="关闭">✕</span>' +
        '</div>';
    var body = '<div class="wsmd-modal-body wsmd-scroll">' + content + '</div>';
    var footer = '<div class="wsmd-modal-footer">' +
        '<span class="wsmd-modal-foot-left" id="wsmud_modal_left">' + left + '</span>' +
        '<span class="wsmd-modal-foot-right" id="wsmud_modal_right">' + right + '</span>' +
        '</div>';
    var shell = opts.wrapVue ? '<div id="app">' + header + body + footer + '</div>' : header + body + footer;

    var overlay = document.createElement('div');
    overlay.id = opts.overlayId || ('wsmud-overlay-' + Date.now());
    overlay.className = 'wsmd-overlay';
    var modal = document.createElement('div');
    modal.className = 'wsmd-modal';
    modal.insertAdjacentHTML('beforeend', shell);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var leftEl = document.getElementById('wsmud_modal_left');
    if (leftEl && typeof opts.onLeft === 'function') leftEl.onclick = function () { opts.onLeft(); };
    var rightEl = document.getElementById('wsmud_modal_right');
    if (rightEl && typeof opts.onRight === 'function') rightEl.onclick = function () { opts.onRight(); };

    // ✕ 关闭：事件委托在 overlay 上（trigger 场景 ✕ 在 #app 内被 Vue 编译，直接 onclick 会丢）
    overlay.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.closest && t.closest('[data-wsmd-close]')) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof opts.onClose === 'function') opts.onClose();
        }
    });
    // Esc 关闭
    var onKey = function (e) {
        if (e.key === 'Escape' && typeof opts.onClose === 'function') opts.onClose();
    };
    document.addEventListener('keydown', onKey);

    return {
        overlay: overlay,
        close: function () {
            document.removeEventListener('keydown', onKey);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }
    };
};

/**
 * 列表页头部 HTML：与旧版 wsmud_raid_left/right 相同的左右功能区 id，
 * 供各自文件的 jQuery/Vue 绑定继续使用。
 * @param {Object} opts { title, left, right }
 * @returns {String}
 */
Wsmud.listShell = function (opts) {
    return '<div class="wsmd-list-head">' +
        '<span class="wsmd-list-head-left" id="wsmud_raid_left">' + (opts.left || '') + '</span>' +
        '<span class="wsmd-list-head-title">' + (opts.title || '') + '</span>' +
        '<span class="wsmd-list-head-right" id="wsmud_raid_right">' + (opts.right || '') + '</span>' +
        '</div>';
};