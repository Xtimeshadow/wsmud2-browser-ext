// ============================================================
// wg-auto-monitor.js —— 自定义监控与妖塔监控
// ------------------------------------------------------------
//   从 wg-auto.js 拆分而来
//   包含：ztjk_edit, ytjk_func, ztjk_func, ztjk_hook
// ============================================================
'use strict';

Object.assign(WG, {
      ztjk_edit: function () {

          //[{"name":"","script":"","isactive":1}]

          ztjk_item = GM_getValue(roleid + "_ztjk", []);
          messageClear();
          var edithtml = UI.ztjksetting;
          messageAppend(edithtml, 0, null, true);   // 【2026-08-12 修复】sync：ztjk 编辑面板同步插入，按钮绑定才能命中
          $(".ztjk_sharedfind").on('click', () => {
              var id = prompt("请输入分享码");
              SettingsStore.getShareJson(id, (res) => {
                  let v = JSON.parse(res.json);
                  if (v.script !== undefined) {
                      $('#ztjk_name').val(v.name);
                      $('#ztjk_script').val(v.script);
                  } else {
                      LayerHelper.msg("不合法的分享码")
                  }
              });
          });
          $('.ztjk_editadd').on("click", function () {
              var ztjk = {
                  name: $('#ztjk_name').val(),
                  script: $('#ztjk_script').val(),
                  isactive: 1
              };
              if (!ztjk.name || !ztjk.script) {
                  LayerHelper.msg("名称和脚本不能为空！");
                  return;
              }
              let _flag = true;
              ztjk_item.forEach(function (v, k) {
                  if (v.name == ztjk.name) {
                      ztjk_item[k] = ztjk;
                      _flag = false;
                  }
              });
              if (_flag) {
                  ztjk_item.push(ztjk);
              }
              GM_setValue(roleid + "_ztjk", ztjk_item);

              WG.ztjk_edit();
              messageAppend("<hig>保存成功");
              WG.ztjk_func();
          });
          $(".ztjk_editdel").on('click', function () {
              let name = $('#ztjk_name').val();
              let found = false;
              for (let i = ztjk_item.length - 1; i >= 0; i--) {
                  if (ztjk_item[i].name === name) {
                      ztjk_item.splice(i, 1);
                      found = true;
                      break;
                  }
              }
              if(found) {
                      GM_setValue(roleid + "_ztjk", ztjk_item);
                      WG.ztjk_edit();
                      messageAppend("<hig>删除成功");
                      WG.ztjk_func();
                  }
              });
          ztjk_item.forEach(function (v, k) {
              var btn = $("<span class='zdy-item'>编辑: " + v.name + "</span>").on("click", function () {
                  $('#ztjk_name').val(v.name);
                  $('#ztjk_script').val(v.script);
              });
              $('#ztjk_show').append(btn);

              var tmptext = v.isactive ? "暂停" : "启用";
              var setbtn = $("<span class='zdy-item'>" + tmptext + ": " + v.name + "</span>").on('click', function () {
                  ztjk_item[k].isactive = v.isactive ? 0 : 1;
                  GM_setValue(roleid + "_ztjk", ztjk_item);
                  WG.ztjk_func();
                  WG.ztjk_edit();
              });
              $('#ztjk_set').append(setbtn);

              var btn3 = $("<span class='zdy-item'>分享: " + v.name + "</span>").on('click', function () {
                  SettingsStore.shareJson(GameState.id, v);
              });
              $('#ztjk_show').append(btn3);
          });
      },
      ytjk_func: function () {
          WG.add_hook("room", async function (data) {
              if (GameState.yaota.Flag && data.path != 'zc/mu/shishenta') {
                  $('.channel pre').append("<hig>【插件】" + "第 " + GameState.yaota.Count + " 次妖塔共获得 " + GameState.yaoyuan + " 点妖元，结束时间: " + dateFormat("YYYY-mm-dd HH:MM", new Date()) + "。<br><hig>")
                  $('.tm').append("<hig>【插件】" + "第 " + GameState.yaota.Count + " 次妖塔共获得 " + GameState.yaoyuan + " 点妖元，结束时间: " + dateFormat("YYYY-mm-dd HH:MM", new Date()) + "。<br><hig>")
                  setTimeout(async function () {
                      while (!WG.is_free()) {
                          await WG.sleep(1000)
                      }
                      if (GameState.yaoyuan == 261) {
                          WG.SendCmd("tm 第 " + GameState.yaota.Count + " 次妖塔圆满完成，撒花~~~~~")
                      } else {
                          WG.SendCmd("tm 第 " + GameState.yaota.Count + " 次妖塔遗憾收场，撒花~~~~~")
                      }
                      $('#yt_prog').remove()
                      GameState.yaota.Flag = false;
                      GameState.yaoyuan = 0;

                  }, 0)
              }
              if (data.path == 'zc/mu/shishenta') {
                  $(`.state-bar`).before(`<div id=yt_prog>开始攻略妖塔</div>`)
                  GameState.yaota.Count = GameState.yaota.Count + 1;
                  $('.channel pre').append("<hig>【插件】" + "开始第 " + GameState.yaota.Count + " 次攻略妖塔，现在时间是:" + dateFormat("YYYY-mm-dd HH:MM", new Date()) + "。<br><hig>")
                  $('.tm').append("<hig>【插件】" + "开始第 " + GameState.yaota.Count + " 次攻略妖塔，现在时间是:" + dateFormat("YYYY-mm-dd HH:MM", new Date()) + "。<br><hig>")
                  GameState.yaoyuan = 0;
                  GameState.yaota.Flag = true;
              }
          })
      },
      ztjk_hook: undefined,
      ztjk_func: function () {
          // 如果存在旧的hook，先移除，防止重复注册
          if (WG.ztjk_hook) {
              WG.remove_hook(WG.ztjk_hook);
              WG.ztjk_hook = undefined;
          }
          
          ztjk_item = GM_getValue(roleid + "_ztjk", []);
          
          // 使用通配符 '*' 注册一个新的、唯一的hook来处理所有事件
          WG.ztjk_hook = WG.add_hook("*", function (data) {
              // 遍历所有已定义的监控脚本
              ztjk_item.forEach(function (monitor) {
                  // 如果监控未激活或脚本为空，则跳过
                  if (!monitor.isactive || !monitor.script) {
                      return;
                  }

                  try {
                      // 使用 Function 构造函数创建一个函数来执行脚本
                      // 这是比 eval 更安全的方式，可以显式传入作用域内的变量
                      const userScript = new Function('data', 'WG', 'G', 'T', 'Push', 'window',monitor.script);
                      
                      // 执行用户脚本，并传入核心对象
                      userScript(data, WG, GameState, TaskHelper, Push, unsafeWindow);

                  } catch (e) {
                      // 如果用户脚本出错，捕获异常并打印错误信息
                      // 这样可以防止一个错误的监控脚本导致整个插件崩溃
                      console.error(`监控脚本 [${monitor.name}] 执行出错:`, e);
                      messageAppend(`<hir>监控脚本 [${monitor.name}] 执行出错，请检查代码！</hir>`, 1);
                      
                      // 自动禁用出错的脚本，防止反复报错
                      monitor.isactive = 0;
                      GM_setValue(roleid + "_ztjk", ztjk_item);
                      messageAppend(`<hir>已自动禁用监控 [${monitor.name}]。</hir>`, 1);
                  }
              });
          });
          
          messageAppend("<hig>自定义监控已重新注入。", 1);
      },
});