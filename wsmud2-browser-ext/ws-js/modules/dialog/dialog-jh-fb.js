// ============================================================
// dialog-jh-fb.js —— 江湖·副本面板
// 提取自 dialog-panels.js（原第 2492-2596 行）
// ============================================================
'use strict';
Dialog.jh_fb = {
    'name': '副本',
    'type': 'fb',
    'items': null,
    'selected_index': -1,
    'select': Dialog.jh_fam.select,
    'onClickItem': Dialog.jh_fam.onClickItem,
    'onDetail': function(data) {
        var item = this.items[data.index];
        if (!item)
            return;
        item.type = '副本';
        item.desc = data.desc;
        item.reward = data.reward;
        item.diffs = data.diffs;
        item.status = data.status;
        return this.showDetail(item);
    },
    'update_unlock': function(unlockLevel) {
        this.unlock = unlockLevel;
        for (let i = 0; i < this.items.length; i++) {
            this.items[i].unlock = unlockLevel >= i;
        }
        if (this.selected_index < 0)
            this.selected_index = unlockLevel;
    },
    'show': function(listEl, descEl) {
        this.listElement = listEl;
        this.descElement = descEl;
        var htmlParts = ["<div class='fb-content'>"];
        for (var i = 0; i < this.items.length; i++) {
            var fbItem = this.items[i];
            htmlParts.push("<div class=\"fb-item");
            !fbItem.unlock && htmlParts.push(" lock");
            fbItem.index = i;
            htmlParts.push("\" index=\"", i, '\x22>', fbItem.name, '</div>');
        }
        this.listElement.html(htmlParts.join(''));
        this.onClickItem(this.selected_index);
    },
    'show_first': function(element) {
        let prevHtml = element.prev().html();
        prevHtml && ReceiveMessage(prevHtml);
    },
    'fb_models': ['普通', "<red>困难</red>", "<hic>组队</hic>"],
    'showDetail': function(item) {
        var htmlParts = ["<pre>"];
        htmlParts.push(item.name);
        item.unlock ? htmlParts.push("\n<hig>已解锁</hig>\n") : htmlParts.push("\n<red>未解锁</red>\n");
        htmlParts.push(item.desc);
        this.append_status(htmlParts, item);
        if (item.unlock && item.diffs) {
            htmlParts.push("<div class=\"item-commands\">");
            for (let i = 0; i < item.diffs.length; i++) {
                if (item.diffs[i])
                    htmlParts.push("<span cmd=\"jh fb ", item.index, '\x20start', i + 1, '\x22>', this.fb_buttons[i], "</span>");
            }
            let extraItems = [];
            Dialog.extend.append(extraItems, "map", item);
            for (let extraItem of extraItems) {
                htmlParts.push("<span cmd=\"", extraItem.cmd, '\x22>', extraItem.name, "</span>");
            }
            htmlParts.push('</div>');
        }
        htmlParts.push(item.reward);
        htmlParts.push("</pre>");
        this.descElement.html(htmlParts.join(''));
        this.select(item.index);
    },
    'append_status': function(htmlParts, item) {
        const statusList = item.status ?? [];
        if (!statusList.length)
            return;
        htmlParts.push("<div class=\"fb-actions\">");
        for (let i = 0; i < statusList.length; i++) {
            let statusItem = statusList[i];
            if (!statusItem)
                continue;
            if (statusItem[0] === 1) {
                htmlParts.push("<div class=\"fb-action finshed\">");
                htmlParts.push("<span class=\"action-desc\">由", statusItem[1], "首次通过", "</span>");
                htmlParts.push("<span class=\"action-name\" cmd=\"cr2 ", item.index, '\x20', i, '\x22>', this.fb_models[i], "</span>");
                htmlParts.push("</div>");
            } else {
                htmlParts.push("<div class=\"fb-action\">");
                htmlParts.push("<span class=\"action-desc\">该模式尚未完成首杀", statusItem[1] ? '，称号奖励：' + statusItem[1] : '', "</span>");
                htmlParts.push("<span class=\"action-name\"  cmd=\"cr2 ", item.index, '\x20', i, '\x22>', this.fb_models[i], "</span>");
                htmlParts.push('</div>');
            }
        }
        htmlParts.push('</div>');
    },
    'fb_buttons': ['进入副本', '困难模式', '组队进入'],
    'append_footer': function() {
        let item = this.items[this.selected_index];
        let htmlParts = [];
        if (item.unlock)
            for (let i = 0; i < item.diffs.length; i++) {
                if (item.diffs[i]) {
                    htmlParts.push("<span cmd=\"jh fb ", item.index, '\x20start', i + 1, '\x22>', this.fb_buttons[i], "</span>");
                }
            }
        Dialog.footerElement.find(".item-commands").html(htmlParts.join(''));
    }
};