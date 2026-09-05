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

// 【2026-09-05 新版客户端适配】新模式把 Raid/Trigger 的日志输出接到插件日志区
// （旧模式由 raid-role.js 挂载 messageAppend）。新模式判定：优先用 content.js 打的标记，兜底自查 DOM。
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