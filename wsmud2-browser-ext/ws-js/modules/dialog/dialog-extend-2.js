// ============================================================
// dialog-extend-2.js —— 自定义扩展/触发器面板（第二部分）
// 提取自 dialog-panels.js（Dialog.extend）
// ============================================================
'use strict';
// 此文件延续 Dialog.extend，需在 dialog-extend-1.js 之后加载
Dialog.extend.excluded_check = [_t1018 => _t1018.startsWith('jh') && _t1018.indexOf("start") < 0, _t1019 => _t1019.startsWith("stats"), _t1020 => _t1020.startsWith("map"), _t1021 => _t1021.startsWith("look")];
Dialog.extend.record = function(_t1022) {
    if (!this.is_record)
        return;
    if (this.excluded[_t1022])
        return;
    for (let _fn8 of this.excluded_check) {
        if (_fn8(_t1022))
            return;
    }
    let _t1024 = Date.now();
    if (this.prev_time > 0)
        this.record_cmds.push('#wait\x20' + (_t1024 - this.prev_time));
    this.record_cmds.push(_t1022);
    this.prev_time = _t1024;
};
Dialog.extend.stop_record = function() {
    if (!this.is_record)
        return;
    this.is_record = false;
    ReceiveMessage("<cyn>已停止记录你的操作命令。</cyn>");
    this.edit_elem.find('.switch').removeClass('on');
    if (this.record_cmds.length > 0) {
        Dialog.show("setting");
        Dialog.setting.footerChanged(3);
        this.edit_elem.removeClass("hide");
        this.list_elem.addClass('hide');
        this.edit_elem.find("textarea").val(this.record_cmds.join(';'));
        Process.state();
    }
};
Dialog.extend.helper = "<li ecmd='show_actions'>可用命令参考</li><li ecmd='show_vars'>可用变量参考</li><li ecmd='show_paras'>参数用法参考</li>";
Dialog.extend.append_edit = function(_t1026) {
    _t1026.push("<div class=\"extend-add hide\">");
    _t1026.push("<div class=\"extend-row\">");
    _t1026.push("<input  prop=\"name\" class=\"extend-input\"/>");
    _t1026.push("<div class='extend-row-header'>提示/描述/说明</div>");
    _t1026.push("</div>");
    _t1026.push("<div class=\"extend-row\">");
    _t1026.push("<select prop=\"type\" class=\"extend-input\">");
    for (let _t1028 of this.types) {
        _t1026.push("<option value=\"", _t1028.value, '\x22>', _t1028.name, '</option>');
    }
    _t1026.push("</select><div class='extend-row-header'>扩展类型</div>");
    _t1026.push('</div>');
    let _t1029 = this.types[0];
    _t1026.push("<div class=\"extend-row\">");
    _t1026.push("<select prop=\"for\" class=\"extend-input\">");
    for (let _t1030 of _t1029.for) {
        _t1026.push("<option value=\"", _t1030.value, '\x22>', _t1030.name, "</option>");
    }
    _t1026.push("</select><div class='extend-row-header'>可用选项</div>");
    _t1026.push('</div>');
    _t1026.push("<div class=\"extend-row\">");
    _t1026.push("<input  prop=\"paras\" class=\"extend-input\"/>");
    _t1026.push("<div class='extend-row-header'>可选参数</div>");
    _t1026.push("</div>");
    _t1026.push("<div class=\"extend-row flex-1\">");
    _t1026.push("<textarea   prop=\"content\"  class=\"extend-input\"></textarea>");
    _t1026.push("<div class='extend-row-header extend-menus'>");
    _t1026.push("<span class=\"switch\"> <span class=\"switch-button\"> </span><span class=\"switch-text\">开始记录</span></span>");
    _t1026.push("<ul class='extend-help'>");
    _t1026.push(this.helper);
    _t1026.push("</ul><button ecmd='save'>保存</button>");
    _t1026.push("</div></div>");
    _t1026.push("</div>");
};
Dialog.extend.onClickRow = function() {
    var _J82 = $(this)
      , _t1032 = Dialog.extend.setting[_J82.attr("sid")];
    if (!_t1032)
        return;
    Dialog.extend.selected_item = _t1032,
    !Dialog.extend.edit_button && (Dialog.extend.edit_button = $("<div class=\"buttons\"><button ecmd=\"edit\">编辑</button><button ecmd=\"up\">上移</button><button ecmd=\"down\">下移</button><button ecmd=\"remove\">移除</button></div>")),
    Dialog.extend.edit_button.insertAfter(_J82);
};
Dialog.extend.show = function(_t1033) {
    this.init(_t1033),
    !this.footer_buttons && (this.footer_buttons = $("<div class=\"obj-money\"><span for=\"import\" class=\"footer-item\">导入</span><span for=\"export\" class=\"footer-item\">导出</span><span for=\"add\" class=\"footer-item\">添加扩展</span></div>")),
    Dialog.footerElement.append(this.footer_buttons);
};
Dialog.extend.command = function(_t1035) {
    const _t1037 = this["cmd_" + _t1035];
    if (_t1037)
        _t1037.call(this);
};
Dialog.extend.cmd_import = function() {
    if (!this.fileinput) {
        let _J83 = $("<input type=\"file\" style=\"display:none\"  accept=\".json\" />")[0];
        document.body.appendChild(_J83),
        this.fileinput = _J83,
        _J83.addEventListener("change", function(_t1039) {
            const _t1041 = _t1039.target.files[0];
            if (!_t1041)
                return ReceiveMessage("<red>未选择扩展文件。</red>");
            const _t1042 = _t1041.name.split('.').pop().toLowerCase()
              , _a94 = ["application/json", 'text/json', "text/plain"];
            if (_t1042 !== "json" && !_a94.includes(_t1041.type))
                return _t1039.target.value = '',
                ReceiveMessage("<red>请选择有效的JSON文件！</red>");
            const _t1043 = new FileReader();
            _t1043.onload = function(_t1044) {
                try {
                    const _t1046 = JSON.parse(_t1044.target.result);
                    Dialog.extend.setting = _t1046.items;
                    Dialog.extend.refresh_list();
                    Dialog.extend.save_extend();
                    ReceiveMessage("<cyn>扩展文件加载成功。</cyn>");
                } catch (_t1047) {
                    console.error('JSON解析错误：', _t1047);
                    ReceiveMessage('<red>扩展文件加载失败！</red>');
                }
            }
            ,
            _t1043.onerror = function() {
                console.error('文件读取失败：', _t1043.error);
                ReceiveMessage('<red>文件读取失败！</red>');
            }
            ,
            _t1043.readAsText(_t1041, "utf-8");
        });
    }
    this.fileinput.click();
};
Dialog.extend.cmd_export = function() {
    try {
        let _o8 = {
            'id': Process.player,
            'version': "0.1",
            'items': Dialog.extend.setting
        };
        const _t1050 = JSON.stringify(_o8, null, 2);
        if (window.android && typeof window.android.saveJsonFile === "function") {
            window.android.saveJsonFile("武神扩展.json", _t1050);
            ReceiveMessage("<cyn>扩展导出为本地文件【武神扩展.json】。</cyn>");
        }
        else {
            const _t1051 = new Blob([_t1050],{
                'type': "application/json;charset=utf-8"
            })
              , _t1052 = URL.createObjectURL(_t1051)
              , _t1053 = document.createElement('a');
            _t1053.href = _t1052;
            _t1053.style.display = "none ";
            _t1053.download = "武神扩展.json";
            document.body.appendChild(_t1053);
            _t1053.click();
            document.body.removeChild(_t1053);
            URL.revokeObjectURL(_t1052);
            ReceiveMessage("<cyn>扩展导出为本地文件【武神扩展.json】。</cyn>");
        }
    } catch (_t1054) {
        console.error("保存JSON文件失败：", _t1054);
        alert("文件保存失败，请重试！");
    }
};