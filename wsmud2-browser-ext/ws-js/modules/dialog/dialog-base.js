// ============================================================
// dialog-base.js —— 对话框基座
// ------------------------------------------------------------
// Dialog 对象是所有游戏对话框（背包/技能/任务/排行…）的"底座"：
//   统一处理弹窗的显示/隐藏、当前打开的是哪个面板（curItem）、
//   数据更新（onData）、内容渲染等公共逻辑。
// 具体的每个面板（背包、技能、设置…）在 dialog-panels.js 里定义。
// 面板子对象（score / map）已拆分至 dialog-base-utils.js。
// ============================================================
const Dialog = {
    'isShow': false,
    'curItem': null,
    'show': function(_t358, _t359) {
        if (!_t358)
            return;
        if (!_t359) {
            if (this.isShow && _t358 === this.curItem)
                return this.hide();
            if (this.curItem && _t358 !== this.curItem) {
                if (Dialog[Dialog.curItem].close) {
                    Dialog[Dialog.curItem].close();
                }
                Dialog[Dialog.curItem].isShow = false;
                Dialog.contentElement.empty();
            }
            this.init();
            this.curItem = _t358;
            this[_t358].show(_t359);
            Process.message.scroll2end();
        } else if (this[_t358])
            this[_t358].onData(_t359);
    },
    'select': function(_t361) {
        if (this.isShow && _t361 === this.curItem)
            return this.hide();
        if (this.curItem && _t361 !== this.curItem) {
                if (Dialog[Dialog.curItem].close) {
                    Dialog[Dialog.curItem].close();
                }
                Dialog[Dialog.curItem].isShow = false;
                Dialog.contentElement.empty();
            }
        this.init();
        this.curItem = _t361;
    },
    'init': function() {
        if (this.isShow)
            return;
        if (!this.isInit) {
            this.contentElement = $(".dialog>.dialog-content");
            this.titleElement = $(".dialog>.dialog-header>.dialog-title");
            this.iconElement = $(".dialog>.dialog-header>.dialog-icon");
            this.footerElement = $(".dialog>.dialog-footer").on("click", ".footer-item", Dialog.footerClick);
            this.hiddenElement = $(".hidden-item");
            this.element = $(".dialog");
            $(".dialog>.dialog-header>.dialog-close").on("click", Dialog.hide);
            this.isInit = true;
        }
        $(".content-room").addClass("hide");
        this.element.removeClass("hide");
        this.isShow = true;
    },
    'hide': function() {
        if (Dialog[Dialog.curItem].hide && Dialog[Dialog.curItem].hide() === false)
            return;
        Dialog.close();
    },
    'footerClick': function() {
        var _J48 = $(this);
        if (_J48.is(".select"))
            return;
        var _t366 = _J48.attr("for");
        _J48.parent().find(".footer-item.select").removeClass('select');
        _J48.addClass('select');
        Dialog[Dialog.curItem].footerChanged(_t366, _J48);
    },
    'title': function(_t367) {
        Dialog.titleElement.html(_t367);
    },
    'icon': function(_t369) {
        this.iconElement.attr("class", "dialog-icon glyphicon glyphicon-" + _t369);
    },
    'footer': function(_t371) {
        _t371 ? this.footerElement.html(_t371) : this.footerElement.empty();
    },
    'close': function() {
        if (!Dialog.isShow)
            return;
        Dialog.isShow = false;
        $(".content-room").removeClass("hide");
        Dialog.element.addClass("hide");
    },
};