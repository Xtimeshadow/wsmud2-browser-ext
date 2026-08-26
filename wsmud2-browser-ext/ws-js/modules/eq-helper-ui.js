// ============================================================
// eq-helper-ui.js —— 换装套装管理界面（Vue）
// ------------------------------------------------------------
// 从 wg-equip.js 拆分出来的套装管理 UI。
// 提供新建/覆盖/删除套装、复制命令、脱光装备等功能。
// ============================================================
'use strict';

Object.assign(WG, {

    // ---- 套装管理界面（Vue） ----
    eqhelperui: function () {
        messageClear();
        var a = [
            '<div class="item-commands" style="text-align:center" id="skillsPanelUI">',
            '  <div style="margin-top:0.5em">',
            '    <div style="width:8em;float:left;text-align:left;padding:0px 0px 0px 2em;height:1.23em" @click="show"><wht>{{role}}</wht></div>',
            '    <div style="width:calc(100% - 16em);float:left;height:1.23em"><hig>套装列表</hig></div>',
            '    <div style="width:8em;float:right;text-align:right;padding:0px 2em 0px 0px;height:1.23em">',
            '      <select style="width:80px" id="eqskills-opts" @change="eqskills_opts_change(eqskills_id)" v-model="eqskills_id">',
            '        <option value="none">选择操作</option>',
            '        <option value="save">新建套装</option>',
            '        <option value="covereq">覆盖套装</option>',
            '        <option value="copyeq">复制命令</option>',
            '        <option value="delete">删除套装</option>',
            '        <option value="uneqall">脱光装备</option>',
            '      </select>',
            '    </div>',
            '  </div>',
            '  <br><br>',
            '  <div class="item-commands">',
            '    <span class="zdy-item" v-for="(item, index) in eqlistdel" @click="deleq(index)" style="width:120px">',
            '      <div style="width:100%">删除{{index}}</div>',
            '    </span>',
            '  </div>',
            '  <div class="item-commands">',
            '    <span class="zdy-item" v-for="(item, index) in eqlist" @click="eq(index)" style="width:120px">',
            '      <div style="width:100%">装备套装:{{index}}</div>',
            '    </span>',
            '  </div>',
            '  <div class="item-commands">',
            '    <span class="zdy-item" v-for="(item, index) in covereqlist" @click="covereq(index)" style="width:120px">',
            '      <div style="width:100%">覆盖套装:{{index}}</div>',
            '    </span>',
            '  </div>',
            '  <br>',
            '  <div class="item-commands">',
            '    <span class="zdy-item" v-for="(item, index) in eqlist" @click="eqs(index)" style="width:120px">',
            '      <div style="width:100%">装备技能:{{index}}</div>',
            '    </span>',
            '  </div>',
            '  <div class="item-commands">',
            '    <span class="zdy-item" v-for="(item, index) in cpeqlist" @click="copyeq(index)" style="width:120px">',
            '      <div style="width:100%">复制装备套装:{{index}}</div>',
            '    </span>',
            '  </div>',
            '  <br>',
            '  <div class="item-commands">',
            '    <span class="zdy-item" v-for="(item, index) in cpeqlist" @click="copyeqs(index)" style="width:120px">',
            '      <div style="width:100%">复制装备技能:{{index}}</div>',
            '    </span>',
            '  </div>',
            '  <br>',
            '</div>'
        ].join('\n');
        messageAppend(a, 2, null, true);
        new Vue({
            el: "#skillsPanelUI",
            data: {
                role: role,
                roleid: roleid,
                eqlist: {},
                cpeqlist: {},
                eqlistdel: {},
                covereqlist: {},
                eqskills_id: "none"
            },
            mounted: function () {
                this.eqlist = GM_getValue(this.roleid + "_eqlist", {});
            },
            methods: {
                eq: function (name) { WG.eqhelper(name, 0); },
                eqs: function (name) { WG.eqhelper(name, 1); },
                copyeq: function (name) { WG.eqhelper(name, 0, true); },
                copyeqs: function (name) { WG.eqhelper(name, 1, true); },
                save: function (name) {
                    WG.eqhelper(name);
                    var that = this;
                    setTimeout(function () {
                        that.eqlist = GM_getValue(that.roleid + "_eqlist", {});
                        WG.eqhelperui();
                    }, 300);
                },
                covereq: function (name) {
                    this.deleq(name);
                    this.save(name);
                },
                deleq: function (name) {
                    WG.eqhelperdel(name);
                    var that = this;
                    setTimeout(function () {
                        WG.eqhelperui();
                    }, 200);
                },
                show: function () { WG.eqhelperui(); },
                saveUI: function () {
                    var that = this;
                    layer.prompt({ title: '请输入套装名...', formType: 2 }, function (text, index) {
                        layer.close(index);
                        if (text != null) {
                            that.save(text);
                        }
                    });
                },
                eqskills_opts_change: function (eqskills_id) {
                    switch (eqskills_id) {
                        case "save":
                            this.saveUI();
                            break;
                        case "copyeq":
                            this.covereqlist = {};
                            this.eqlist = {};
                            this.eqlistdel = {};
                            this.cpeqlist = GM_getValue(this.roleid + "_eqlist", {});
                            this.role = "<< 返回";
                            break;
                        case "delete":
                            this.cpeqlist = {};
                            this.eqlist = {};
                            this.covereqlist = {};
                            this.eqlistdel = GM_getValue(this.roleid + "_eqlist", {});
                            this.role = "<< 返回";
                            break;
                        case "covereq":
                            this.cpeqlist = {};
                            this.eqlist = {};
                            this.eqlistdel = {};
                            this.covereqlist = GM_getValue(this.roleid + "_eqlist", {});
                            this.role = "<< 返回";
                            break;
                        case "uneqall":
                            WG.uneqall();
                            break;
                        case "none":
                        default:
                            break;
                    }
                }
            }
        });
    }

});