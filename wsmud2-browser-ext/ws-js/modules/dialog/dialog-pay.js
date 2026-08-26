// ============================================================
// dialog-pay.js —— 支付面板
// 提取自 dialog-panels.js（原第 4630-4641 行）
// ============================================================
'use strict';
Dialog.pay = {
    'createElement': function() {},
    'show': function() {
        this.isShow = true;
        this.element = this.createElement();
        this.element.appendTo(Dialog.contentElement);
    },
    'close': function() {
        this.element.remove();
        this.isShow = false;
    }
};