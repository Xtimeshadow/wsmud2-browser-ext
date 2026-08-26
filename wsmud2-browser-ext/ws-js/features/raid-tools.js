// ============================================================
// raid-tools.js —— 工具层
// ============================================================

//---------------------------------------------------------------------------
//  Message Output
//---------------------------------------------------------------------------

var Message = {
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