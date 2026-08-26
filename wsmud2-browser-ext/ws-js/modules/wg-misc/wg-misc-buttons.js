// ============================================================
// wg-misc-buttons.js —— 自定义按钮 / 登录 HTML
// ------------------------------------------------------------
// 从 wg-misc.js 拆分出的独立模块。
// 包含自定义按钮（zdybtnfunc / zdy_btnset / zdy_btnListInit /
// zdy_btnshow）和 runLoginhml 方法。
// 通过 Object.assign 挂载到 WG 对象上。
// ============================================================
'use strict';

Object.assign(WG, {
      zdybtnfunc: function (type) {
          const item = (zdy_btnlist && zdy_btnlist[type]) ? zdy_btnlist[type] : null;
          const send = (item && item.send) || "";
          const name = (item && item.name) || ("自定义按钮" + (type + 1));
          const content = String(send).trim();
          if (!content) return;
          // 【2026-08-24】自定义按钮统一走 Raid 引擎：既能执行普通游戏命令，也能执行 @ 语句/流程（如 @tidyBag）。
          // Raid 引擎不可用时回退为直接发送游戏命令。
          if (unsafeWindow && unsafeWindow.ToRaid && unsafeWindow.ToRaid.perform) {
              unsafeWindow.ToRaid.perform(content, name, false);
          } else {
              WG.SendCmd(content);
          }
      },
      zdy_btnset: function () {
          zdy_btnlist = GM_getValue(roleid + "_zdy_btnlist", zdy_btnlist);
          messageClear();
          let html = UI.zdyBtnsetui();
          // 【2026-08-15 修改】自定义按钮面板属于快捷面板一类，与定时任务/自命令一致渲染到左侧 .WG_log
          // （原 area=0 渲染到右侧 .WG_log_log）
          messageAppend(html, 2, null, true);
          var keyitem = ["Q", "W", "E", "R", "T", "Y"];
          let i = 0;
          for (let item of keyitem) {
              $(`#name${item}`).val(zdy_btnlist[i].name);
              $(`#send${item}`).val(zdy_btnlist[i].send);
              i = i + 1;
          }
          $(".savebtn").off('click');
          $(".savebtn").on("click", function () {
              let tmp = [];
              for (let item of keyitem) {
                  let zdybtnitem = {
                      name: '无',
                      send: ''
                  };
                  let pname = $(`#name${item}`).val();
                  let psend = $(`#send${item}`).val();
                  if (pname != '') {
                      zdybtnitem.name = pname;
                      zdybtnitem.send = psend;
                  }

                  tmp.push(zdybtnitem);
              }
              zdy_btnlist = tmp;
              GM_setValue(roleid + "_zdy_btnlist", zdy_btnlist);
              messageAppend("保存成功");
              inzdy_btn = true;
              GM_setValue(roleid + "_inzdy_btn", true);
              WG.zdy_btnshow();
          });
      },
      zdy_btnListInit: function () {
          zdy_btnlist = GM_getValue(roleid + "_zdy_btnlist", zdy_btnlist);
          inzdy_btn = GM_getValue(roleid + "_inzdy_btn", inzdy_btn);
          if (zdy_btnlist.length == 0) {
              for (var i = 0; i < 6; i++) {
                  zdy_btnlist.push({
                      "name": "无",
                      "send": ""
                  });
              }
              GM_setValue(roleid + "_zdy_btnlist", zdy_btnlist);
          }
          if (inzdy_btn) {
              WG.zdy_btnshow();
          } else {
              WG.zdy_btnshow('off');
          }
      },
      zdy_btnshow: function (type = 'on') {
          if (type == 'on') {
              inzdy_btn = true;
              var html = UI.zdybtnui();
              $('.WG_button').remove();
              $(".content-message").after(html);   // 【2026-08-09 修复】锚点改 .content-message：.WG_log 已被 funny2 搬到左侧，用它做锚点会导致保存后按钮栏位置漂移
              let keyitem = ["Q", "W", "E", "R", "T", "Y"];

              for (let i = 0; i < keyitem.length; i++) {
                  $(`#keyin${keyitem[i]}`).on('click', function () {
                      WG.zdybtnfunc(i);
                  });
              }
              $(".auto_perform").on("click", WG.auto_preform_switch);
              $(".cmd_echo").on("click", WG.cmd_echo_button);
              if (cmd_echo) {
                  $(".cmd_echo").html('<span style="color:#00FF00">代码：开</span>');
              } else {
                  $(".cmd_echo").html('<span style="color:#FF0000">代码：关</span>');
              }
              var autoOn = (auto_pfmswitch == "开" || auto_pfmswitch === true || auto_pfmswitch === 'true');
              if (autoOn) {
                  $(".auto_perform").html('<span style="color:#00FF00">自动攻击：开</span>');
              } else {
                  $(".auto_perform").html('<span style="color:#FF0000">自动攻击：关</span>');
              }
          } else if (type == 'off') {
              inzdy_btn = false;

              var html = UI.btnui();
              $('.WG_button').remove();
              $(".content-message").after(html);   // 【2026-08-09 修复】锚点改 .content-message：.WG_log 已被 funny2 搬到左侧，用它做锚点会导致保存后按钮栏位置漂移

              $(".go_wumiao").on("click", WG.go_wumiao);
              $(".go_home").on("click", WG.go_home);
              $(".auto_perform").on("click", WG.auto_preform_switch);
              $(".cmd_echo").on("click", WG.cmd_echo_button);
              if (cmd_echo) {
                  $(".cmd_echo").html('<span style="color:#00FF00">代码：开</span>');
              } else {
                  $(".cmd_echo").html('<span style="color:#FF0000">代码：关</span>');
              }
              var autoOn = (auto_pfmswitch == "开" || auto_pfmswitch === true || auto_pfmswitch === 'true');
              if (autoOn) {
                  $(".auto_perform").html('<span style="color:#00FF00">自动攻击：开</span>');
              } else {
                  $(".auto_perform").html('<span style="color:#FF0000">自动攻击：关</span>');
              }
              if (GameState.score.isGod) {
                  $('.zdy-item.zdwk').html("修炼(Y)");
              }
          }

          GM_setValue(roleid + "_inzdy_btn", inzdy_btn);
      },
      runLoginhml: function () {
          WG.SendCmd(loginhml);
      },
});