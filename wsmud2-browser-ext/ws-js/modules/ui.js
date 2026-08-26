// ============================================================
// ui.js —— 界面生成（核心）
// ------------------------------------------------------------
// 负责生成各种界面 HTML：
//   UI.wgui        主界面（快捷操作栏等）
//   UI.zmlsetting  自命令设置面板
//   UI.ztjksetting 状态监控设置面板
//   UI.timeoutui   定时任务界面
//   UI.zdybtnui    自定义按钮界面
// 自定义组件 → ui-components.js
// 系统设置面板 → ui-settings.js
// 精炼滑块控件 → ui-jinglian.js
// ============================================================
'use strict';

//UI
var UI = {
    codeInput: `<div class="runtest layui-layer-wrap" style="display: none;">
                    <textarea class="site-demo-text" id="testmain" data-enpassusermodified="yes">
                    </textarea>
                    <a class="layui-btn layui-btn-normal runtesta" style="position:absolute;right:20px;bottom:20px"  >运行</a>
                 </div>`,
    zdybtnui: function () {
        let ui = `<div class='WG_button'>`;
        let keyitem = ["Q", "W", "E", "R", "T", "Y"];
        let i = 0;
        for (let item of zdy_btnlist) {
            if (item.name !== '无' && item.name !== '') {
                ui = ui + ` <span class='zdy-item' id = 'keyin${keyitem[i]}'>${item.name}(${keyitem[i]})</span>`;
            }
            i = i + 1;
        }
        return ui + `<span class="zdy-item auto_perform" style="float:right;"> 自动攻击 </span>
            <span class="zdy-item cmd_echo" style="float:right;">命令代码</span> </div>`;
    },
    btnui: function () {
        return `<div class='WG_button'>
        <span class="zdy-item auto_perform" style="float:right;"> 自动攻击 </span>
            <span class="zdy-item cmd_echo" style="float:right;">命令代码</span> </div>`
    },
    wgui: function () {
        let p;
        if (inzdy_btn) {
            p = UI.zdybtnui();
        } else {
            p = UI.btnui();
        }
        return `
            <div class='WG_log'>
                <pre></pre>
            </div>
            <div class='WG_log_log'>
                <div class="WG_log_log_title">日志</div>
                <pre></pre>
            </div>` + p;
    },
    cleandataui: function() {
        return `
            <div class="setting-item" >
                <div class="item-commands"><span class="dps">清空战斗统计</span></div>
            </div>
            <div class="setting-item" >
                <div class="item-commands"><span class="getjy">清空累积经验</span></div>
            </div>
            <div class="setting-item" >
                <div class="item-commands"><span class="getitem">清空获得物品</span></div>
            </div>
        `
    },
    zdyBtnsetui: function () {
        let ui = '';
        let keyitem = ["Q", "W", "E", "R", "T", "Y"];
        for (let item of keyitem) {
            ui = ui + `<div class="ext-setting-item">
                <span class="ext-label" style="min-width:20px;font-size:12px;color:#FFD700;">${item}:</span>
                <span class="ext-control" style="gap:4px;">
                    <span class="ext-label" style="min-width:auto;font-size:12px;color:#aaa;">名称</span>
                    <input id="name${item}" class="ext-input" style="width:80px;">
                    <span class="ext-label" style="min-width:auto;font-size:12px;color:#aaa;margin-left:8px;">命令</span>
                    <input id="send${item}" class="ext-input" style="width:180px;">
                </span>
            </div>`;
        }
        ui = ui + `
            <div class="ext-setting-item">
                <div class="ext-button-row">
                    <span class="ext-btn savebtn">保存自定义按钮设置</span>
                </div>
            </div>
        `;
        return ui;
    },
    switchClick: function (e) {
        let t = $(this),
            s = t.closest("[for]").attr("for");
        if (t.is(".on")) {
            t.removeClass("on");
            t.find(".switch-text").html("关")
        } else {
            t.addClass("on");
            t.find(".switch-text").html("开");
        }
    },
    zmlsetting: `<div class='zdy_dialog' style='text-align:right;width:280px' id="zmldialog">
<div class="setting-item"><span><label for="zml_name"> 输入自定义命令名称:</label></span><span><input id="zml_name"
            style='width:80px' type="text" name="zml_name" value="" v-model="singnalzml.name"></span></div>
<div class="setting-item"> <label for="zml_type"> 自命令类型： </label><select id="zml_type" style="width:80px"
        v-model="singnalzml.zmlType">
        <option value="0"> 插件原生 </option>
        <option value="1"> Raidjs流程 </option>
        <option value="2"> JS原生 </option>
    </select> </div>
<div class="setting-item"> <label for="zml_info"> 输入自定义命令(用半角分号(;)分隔):</label></div>
<div class="setting-item"><textarea class="settingbox hide zdy-box" style="display: inline-block;" id='zml_info'
        v-model="singnalzml.zmlRun"></textarea></div>
<div class="item-commands"><span class="getSharezml" @click="getShare"> 查询分享 </span> <span class="editadd"
        @click="add"> 保存 </span> <span class="editdel" @click="del"> 删除 </span> </div>
<div class="item-commands" id="zml_show">
    <span v-for="(item, index) in zmldata" @click="edit(item)">
        编辑{{item.name}}
    </span>
    <br />
    <span v-for="(item, index) in zmldata" @click="showp(item)">
         <label v-if="item.zmlShow == '1'">取消快速使用</label><label v-else>快速使用</label>{{item.name}}
    </span>
    <br />
    <span v-for="(item, index) in zmldata" @click="share(item)">
        分享{{item.name}}
    </span>
    <br />
</div>
</div> `,
    zmlandztjkui: `<div class='zdy_dialog' id="zmlandztjk" style="height:100%;display:flex;flex-direction:column;font-size:13px;">

  <!-- ==================== ZML 列表视图 ==================== -->
  <div v-show="cv==='zmlList'" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">
    <div style="font-weight:bold;color:#ccc;padding:4px 0;border-bottom:1px solid #555;margin-bottom:6px;">自命令列表</div>
    <transition-group name="zml-flip" tag="div" style="flex:1;overflow-y:auto;">
      <div v-for="(item, idx) in zmldata" :key="item._key" style="display:flex;align-items:center;padding:5px 4px;border-bottom:1px solid #333;cursor:default;">
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ddd;" :title="item.zmlRun">{{item.name}}</span>
        <span class="zml-btn zml-btn-run" @click="runZml(item)">运行</span>
        <span class="zml-btn zml-btn-edit" @click="editZml(item)">编辑</span>
        <span :class="zmlShowBtnCls(item)" @click="toggleZmlShow(item)">{{zmlShowBtn(item)}}</span>
        <div class="zml-move-wrap">
          <span class="zml-btn zml-btn-move" :style="idx===0?{display:'none'}:{}" @click="moveZml(idx,-1)">上移</span>
          <span class="zml-btn zml-btn-move" :style="idx===zmldata.length-1?{display:'none'}:{}" @click="moveZml(idx,1)">下移</span>
        </div>
      </div>
    </transition-group>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-top:1px solid #555;margin-top:6px;">
      <span class="zml-btn zml-btn-add" @click="addZml">+ 添加</span>
      <span style="color:#888;font-size:12px;">共 {{zmldata.length}} 个自命令</span>
    </div>
    <div style="display:flex;gap:8px;padding:8px 4px;border-top:1px solid #555;">
      <span class="zml-btn zml-btn-action" @click="openZtjkList">编辑自定义监控</span>
      <span class="zml-btn zml-btn-action" @click="injectAll">注入所有监控</span>
      <span class="zml-btn zml-btn-action" @click="stopAll">暂停所有监控</span>
    </div>
  </div>

  <!-- ==================== ZML 编辑视图 ==================== -->
  <div v-show="cv==='zmlEdit'" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">
    <div style="font-weight:bold;color:#ccc;padding:4px 0;border-bottom:1px solid #555;margin-bottom:8px;">编辑自命令</div>
    <div class="setting-item" style="margin-bottom:6px;">
      <span><label for="zml_name" style="color:#ccc;">输入自定义命令名称:</label></span>
      <span><input id="zml_name" style="width:120px;background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:3px 6px;outline:none;" type="text" v-model="editForm.name"></span>
    </div>
    <div class="setting-item" style="margin-bottom:6px;">
      <label for="zml_type" style="color:#ccc;">自命令类型：</label>
      <select id="zml_type" style="width:100px;background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:3px 4px;outline:none;" v-model="editForm.zmlType">
        <option value="0">插件原生</option>
        <option value="1">Raidjs流程</option>
        <option value="2">JavaScript</option>
      </select>
    </div>
    <div class="setting-item" style="margin-bottom:4px;">
      <label for="zml_info" style="color:#ccc;">输入自定义命令(用半角分号(;)分隔):</label>
    </div>
    <div class="setting-item" style="flex:1;min-height:0;margin-bottom:8px;display:flex;">
      <textarea id="zml_info" v-model="editForm.zmlRun" style="flex:1;width:100%;background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:4px 6px;outline:none;resize:vertical;font-family:inherit;box-sizing:border-box;"></textarea>
    </div>
    <div class="item-commands" style="display:flex;gap:10px;padding:6px 0;border-top:1px solid #555;">
      <span class="zml-btn zml-btn-edit" @click="getShareZml">查询分享</span>
      <span class="zml-btn zml-btn-run" @click="saveZml">保存</span>
      <span class="zml-btn" style="border-color:#f88;color:#f88;" @click="deleteZml">删除</span>
    </div>
    <div class="item-commands" style="padding:4px 0;border-top:1px solid #555;">
      <span class="zml-btn zml-btn-action" @click="backToZmlList">← 返回</span>
    </div>
  </div>

  <!-- ==================== ZTJK 列表视图 ==================== -->
  <div v-show="cv==='ztjkList'" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">
    <div style="font-weight:bold;color:#ccc;padding:4px 0;border-bottom:1px solid #555;margin-bottom:6px;">自定义监控列表</div>
    <transition-group name="zml-flip" tag="div" style="flex:1;overflow-y:auto;">
      <div v-for="(item, idx) in ztjkdata" :key="item._key" style="display:flex;align-items:center;padding:5px 4px;border-bottom:1px solid #333;cursor:default;">
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ddd;font-size:12px;" :title="item.script">{{item.name}}</span>
        <span :class="'zml-btn ' + (item.isactive?'zml-btn-quick':'zml-btn-quick-off')" @click="toggleZtjk(item)">{{item.isactive?'启用':'暂停'}}</span>
        <span class="zml-btn zml-btn-edit" @click="editZtjk(item)">编辑</span>
        <div class="zml-move-wrap">
          <span class="zml-btn zml-btn-move" :style="idx===0?{display:'none'}:{}" @click="moveZtjk(idx,-1)">上移</span>
          <span class="zml-btn zml-btn-move" :style="idx===ztjkdata.length-1?{display:'none'}:{}" @click="moveZtjk(idx,1)">下移</span>
        </div>
      </div>
    </transition-group>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-top:1px solid #555;margin-top:6px;">
      <span class="zml-btn zml-btn-add" @click="addZtjk">+ 添加</span>
      <span style="color:#888;font-size:12px;">共 {{ztjkdata.length}} 个自定义监控</span>
    </div>
    <div style="padding:4px 0;border-top:1px solid #555;">
      <span class="zml-btn zml-btn-action" @click="backToZmlList">← 返回自命令</span>
    </div>
  </div>

  <!-- ==================== ZTJK 编辑视图 ==================== -->
  <div v-show="cv==='ztjkEdit'" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">
    <div style="font-weight:bold;color:#ccc;padding:4px 0;border-bottom:1px solid #555;margin-bottom:8px;">编辑自定义监控</div>
    <div class="setting-item" style="margin-bottom:6px;">
      <label for="ztjk_name" style="color:#ccc;">监控名称:</label>
      <input id="ztjk_name" style="width:150px;background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:3px 6px;outline:none;" type="text" v-model="editZtjkForm.name">
    </div>
    <div class="setting-item" style="margin-bottom:4px;">
      <label for="ztjk_script" style="color:#ccc;">监控脚本 (传入参数为 data, 可用全局变量 G, WG, T):</label>
    </div>
    <div class="setting-item" style="flex:1;min-height:0;margin-bottom:8px;display:flex;">
      <textarea id="ztjk_script" v-model="editZtjkForm.script" style="flex:1;width:100%;background:#14141f;border:1px solid #555;border-radius:4px;color:#ccc;padding:4px 6px;outline:none;resize:vertical;font-family:inherit;box-sizing:border-box;"></textarea>
    </div>
    <div class="item-commands" style="display:flex;gap:10px;padding:6px 0;border-top:1px solid #555;">
      <span class="zml-btn zml-btn-edit" @click="getShareZtjk">查询分享</span>
      <span class="zml-btn zml-btn-run" @click="saveZtjk">保存</span>
      <span class="zml-btn" style="border-color:#f88;color:#f88;" @click="deleteZtjk">删除</span>
    </div>
    <div class="item-commands" style="padding:4px 0;border-top:1px solid #555;">
      <span class="zml-btn zml-btn-action" @click="backToZtjkList">← 返回</span>
    </div>
  </div>

</div>`, ztjksetting: `<div class='zdy_dialog' style='text-align:right;width:280px'>
<div class="setting-item"> <label> 监控脚本引擎：在这里，你可以编写JS代码来处理任何游戏事件。</label></div>
<div class="setting-item"> <label for="ztjk_name"> 监控名称:</label><input id="ztjk_name" style='width:150px' type="text"
        name="ztjk_name" value=""></div>
        
<div class="setting-item"><span><label for="ztjk_script"> 监控脚本 (传入参数为 data, 可用全局变量 G, WG, T):</label></span></div>
<div class="setting-item"> <textarea class="settingbox hide zdy-box" style="display: inline-block; width: 260px; height: 120px;"
        id='ztjk_script'></textarea></div>

<div class="item-commands"><span class="ztjk_sharedfind"> 查询分享 </span> <span class="ztjk_editadd"> 保存 </span> <span
        class="ztjk_editdel"> 删除 </span></div>
<div class="item-commands" id="ztjk_show"></div>
<div class="item-commands" id="ztjk_set"></div>
</div> `,
    timeoutui: `<div class='zdy_dialog' style='text-align:right;width:280px'> 注意,可以留空的时或者分,这样就是每分钟/小时 的x秒触发任务,秒为必填项目 <div class="setting-item">    <span>任务名:<input type="text" id="questname" placeholder="任务名" style="width:50%"></span></div> <div class="setting-item">     <label for = "rtype"> 运行次数 </label><select style='width:80px' id="rtype"></div> <option value="1">一次</option> <option value="2">每天</option> </select></span></div> <div class="setting-item">  <span>时:<input type="number" id="ht" placeholder="时" style="width:50%"></span></div> <div class="setting-item">   <span>分:<input type="number" id="mt" placeholder="分" style="width:50%"></span></div> <div class="setting-item">  <span>秒:<input type="number" id="st" placeholder="秒" style="width:50%"></span></div> <div class="setting-item">  <span><label for="zml_info"> 输入自定义命令(用半角分号(;)分隔):</label></span></div> <div class="setting-item">   <textarea class = "settingbox hide zdy-box"style = "display: inline-block;"id = 'zml_info'></textarea></div> <div class = "item-commands"> <span class = "startQuest"> 开始 </span><span class = "removeQuest"> 删除 </span>  </div> <div class='questlist item-commands'></div> </div>`,
    toui: [
        `<div class='item-commands'>
        <span cmd = "$to 扬州城-当铺" > 当铺 </span>
        <span cmd = "$to 后勤"> 后勤 </span>
        <span cmd = "$to 师父"> 师父 </span>
        <span cmd = "$to 扬州城-钱庄" > 仓库 </span>
        <span cmd = "$to 少林派-西侧殿" > 木头人 </span></div>`,
    ],
    fbui: function (name, mulit, diffi) {
        let ui = `<div class='item-commands'>`;
        if (unsafeWindow && unsafeWindow.ToRaid) {
            if (ToRaid.existAutoDungeon(`${name} 0`)) {
                ui = ui + `<span cmd = "@fb ${name} 0" >自动副本-${name}</span>`;
            }
            if (diffi) {
                if (ToRaid.existAutoDungeon(`${name} 1`)) {
                    ui += `<span cmd = "@fb ${name} 1" >自动副本-${name}-困难</span>`;
                }
            }
            if (mulit) {
                if (ToRaid.existAutoDungeon(`${name} 2`)) {
                    ui += `<span cmd = "@fb ${name} 2" >自动副本-${name}-组队</span>`;
                }
            }
        } else {
            ui += `未安装Raid.js插件`;
        }
        if (ui == `<div class='item-commands'>`) {
            return `<div>暂无自动副本脚本,欢迎共享。</div>`
        } else {
            return ui + `</div>`;
        }
    },
    itemui: function (itemname) {
        itemname = itemname.toLowerCase();
        let ui = `<div class="item-commands ">`;
        if (itemname.indexOf("★") >= 0 || itemname.indexOf("☆") >= 0) {
            ui = ui + '</div>';
        } else if (itemname.indexOf("残页") >= 0 && itemname != "武道残页"){
            ui = ui + `<span class = "addzxbuy"  cmd='$addzxbuy ${itemname}'> 添加到回收 </span>`;
        }
        ui = ui + `</div>`;
        return ui;
    }
}