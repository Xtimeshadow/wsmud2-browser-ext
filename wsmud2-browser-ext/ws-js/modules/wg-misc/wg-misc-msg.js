// ============================================================
// wg-misc-msg.js —— 消息接收处理
// ------------------------------------------------------------
// 从 wg-misc.js 拆分出的独立模块。
// 包含 WG.receive_message 完整实现：处理游戏服务器推送的
// 各类消息（文本、聊天、对话框、战斗、精炼、镶嵌、副本扫荡等）。
// 通过 Object.assign 挂载到 WG 对象上。
// ============================================================
'use strict';

Object.assign(WG, {
      receive_message: function (msg) {
          if (!msg || !msg.data) return;
          // 【2026-08-13 无人值守推送】任何服务器消息都算"角色活着"，刷新最后消息时间
          try { _lastMsgTime = Date.now(); } catch (e) { }
          var data;
          var deepCopy = function (source) {
              var result = {};
              for (var key in source) {
                  result[key] = typeof source[key] === 'object' ? deepCopy(source[key]) : source[key];
              }
              return result;
          }
          if (msg.data[0] == '{' || msg.data[0] == '[') {
              // 【2026-08-15 健壮性】服务器消息为单引号 JSON（标准 JSON.parse 会挂，故用 new Function）。
              // 原实现无 try：损坏/截断数据会让 new Function 构造抛错，直接中断整条消息管线
              // （本函数是 websocket-proxy 劫持后的第一个收包口）。现在与 ws.js OnReceived 同款处理：
              // 解析失败降级为文本消息显示并记录，不中断挂机。
              try {
                  var func = new Function("return " + msg.data + ";");
                  data = func();
              } catch (e) {
                  try { ExtLog.warn('[WS] 消息解析失败，已忽略损坏数据:', e && e.message); } catch (e2) { }
                  data = { type: 'text', msg: msg.data };
              }
          } else {
              data = {
                  type: 'text',
                  msg: msg.data
              };
          }
          // 开启代码显示功能后，打印所有Data
          // "状态(status)","exits","地图名与房间人物(room)","items","人物刷新(itemadd)","人物移除(itemremove)","血量状态(sc)","文本(text) ","聊天(msg) ","战斗状态(combat)","技能监控(dispfm),"死亡(die)","冷却结束(clearDistime)","技能可用(enapfm)""
          if (Coding && data.type != 'time'){
              console.log(data);
          } else if (cmd_echo && data.type != 'time') {
              console.log(data);
          }

          if (GameState.yaota.Flag && typeof (data.msg) == 'string') {
              let ytdata = data.msg;
              if (ytdata.indexOf("一股奇异的能量涌入你的体内，你获得") >= 0) {
                  GameState.yaoyuan = GameState.yaoyuan + parseInt(ytdata.replace(/[^0-9]/ig, ""))
                  $('#yt_prog').html("<hiy>目前已获得 " + GameState.yaoyuan + " 妖元</hiy>")
                  if (GameState.yaoyuan == 261) {
                      $('#yt_prog').html("<hiy>目前已获得 " + GameState.yaoyuan + " 妖元，boss出现！</hiy>")
                  }
              }
          }
          if (data.type == 'state') {
              if (data.silence == undefined && data.desc != []) {
                  data.desc = [];
                  data.silence = 1;
                  let p = deepCopy(msg);
                  p.data = JSON.stringify(data);
                  WG.run_hook(data.type, data);
                  ws_on_message.apply(this, [p]);
                  return;
              }
          }
          if (data.type == 'msg') {
              if (shieldswitch == '开' || shieldswitch === true || shieldswitch === 'true') {
                  if (shield != undefined &&
                      ((data.name && shield.indexOf(data.name) >= 0) ||   // 【2026-08-10 修复】name/uid 为空时跳过匹配，否则空字符串会命中 indexOf("") 误屏蔽表情/动作消息
                       (data.uid && shield.indexOf(data.uid) >= 0)))
                      return;
                  var skey = shieldkey.split(",");
                  for (let keyword of skey) {
                      if (keyword != "" && data.content.indexOf(keyword) >= 0) {
                          return;
                      }
                  }
              }

              // 个人需求：远程操控重连
              if (data.ch=="tm" && data.content=="关闭重连"){
                  auto_relogin="关";
                  GM_setValue(roleid + "_auto_relogin", auto_relogin);
                  let check_relogin = GM_getValue(roleid + "_auto_relogin", auto_relogin)
                  WG.SendCmd(`tm 当前重连为${check_relogin}`)
              }
              if (data.content=="开启重连"){
                  auto_relogin="开";
                  GM_setValue(roleid + "_auto_relogin", auto_relogin);
                  let check_relogin = GM_getValue(roleid + "_auto_relogin", auto_relogin)
                  WG.SendCmd(`tm 当前重连为${check_relogin}`)
              }
          }
          if (data.type == 'text') {
              if (shieldswitch == '开' || shieldswitch === true || shieldswitch === 'true') {
                  var skey = shieldkey.split(",");
                  for (let keyword of skey) {
                      if (keyword != "" && data.msg.indexOf(keyword) >= 0) {
                          return;
                      }
                  }
              }
          }

          if (data.type == 'dialog' && data.t == 'fam' && data.k == undefined) {
              if (UI.toui[data.index] != undefined) {
                  data.desc += "\n";
                  data.desc += UI.toui[data.index];
                  data.k = 'knva';
                  let p = deepCopy(msg);
                  p.data = JSON.stringify(data);
                  WG.run_hook(data.type, data);
                  ws_on_message.apply(this, [p]);
                  return;
              }
          }

          if (data.type == 'text' && data.msg == '什么？' && GameState.wsdelay.SetTime != undefined) {
              const time = new Date().getTime();
              if (GameState.wsdelay.SetCount <= 2) {
                  GameState.wsdelay.SetCount += 1;
                  if (GameState.wsdelay.delay == undefined) {
                      GameState.wsdelay.delay = time - GameState.wsdelay.SetTime;
                  } else {
                      GameState.wsdelay.delay = (time - GameState.wsdelay.SetTime + GameState.wsdelay.delay) / 2;
                  }
                  GameState.wsdelay.SetTime = time;
                  WG.SendCmd("test");
              } else {

                  GameState.wsdelay.delay = (time - GameState.wsdelay.SetTime + GameState.wsdelay.delay) / 2;
                  WG.SendCmd("state info");
                  messageAppend(`<hig>服务器到本地来回延迟约 ${GameState.wsdelay.delay} 毫秒</hig>`);
                  GameState.wsdelay.SetTime = undefined;
                  GameState.wsdelay.SetCount = undefined;
                  setTimeout(() => {
                      let content = $(".content-message pre").html();
                      content = content.replaceAll('什么？\n', '');
                      $(".content-message pre").html(content);
                  }, 10);
              }
          }

          if (data.type == 'dialog' && data.t == 'fb' && data.k == undefined) {
              data.desc += "\n";
              data.desc += UI.fbui(fb_path[data.index], data.is_multi, data.is_diffi)
              data.k = 'knva';
              let p = deepCopy(msg);
              p.data = JSON.stringify(data);
              WG.run_hook(data.type, data);
              ws_on_message.apply(this, [p]);
              return;
          }
          if (data.type == 'dialog' && data.dialog == 'pack' && data.from == 'item' && data.k == undefined) {
              let itemname = data.desc.split("\n")[0];
              data.desc += "\n";
              data.desc += UI.itemui(itemname);
              data.k = 'knva';
              let p = deepCopy(msg);
              p.data = JSON.stringify(data);
              WG.run_hook(data.type, data);
              ws_on_message.apply(this, [p]);
              return;
          }

          // 添加精炼选项
          if (data.type == 'dialog' && data.dialog == 'pack' && data.k == undefined && data.jldesc ) {
              let jlname = data.jldesc.split("<br/>")[0];
              let jlid = data.id;
              data.jldesc += UI.jinglianui(jlid);
              
              const observer = new MutationObserver(() => {
                  if (document.getElementById("fastjinglian")) {
                      observer.disconnect();
                      fastjinglian(jlname, jlid);
                  }
              });
              observer.observe(document.body, { childList: true, subtree: true });

              data.k = 'knva';
              let p = deepCopy(msg);
              p.data = JSON.stringify(data);
              WG.run_hook(data.type, data);
              ws_on_message.apply(this, [p]);
              return;
          }
          // 添加镶嵌选项
          if (data.type == 'dialog' && data.dialog == 'pack' && data.k == undefined && data.xqdesc ) {
              let xqid = data.id;
              data.xqdesc += UI.xiangqianui(xqid);
              data.k = 'knva';
              let p = deepCopy(msg);
              p.data = JSON.stringify(data);
              WG.run_hook(data.type, data);
              ws_on_message.apply(this, [p]);
              return;
          }
          if (data.type == "perform") {
              if (zdyskills == "开" || zdyskills === true || zdyskills === 'true') {
                  zdyskilllist = GM_getValue(roleid + "_zdyskilllist", zdyskilllist);
                  data.skills = JSON.parse(zdyskilllist);
                  let p = deepCopy(msg);
                  p.data = JSON.stringify(data);
                  WG.run_hook(data.type, data);
                  ws_on_message.apply(this, [p]);
                  return;
              }
          }
          if (data.type == 'cmds') {
              if (unsafeWindow && unsafeWindow.ToRaid) {
                  if (JSON.stringify(data.items).indexOf('进入副本') >= 0) {
                      let cr_path = data.items[0].cmd
                      let sd_path = ''
                      if (cr_path.indexOf("1 0") >= 0) {
                          sd_path = cr_path.replaceAll('1 0', '1')
                      } else {
                          sd_path = cr_path + " 0"
                      }
                      let cp = {}
                      cp.name = '扫荡指定次数';
                      cp.cmd = `@js ($sdnum) =prompt("请输入次数,注意:若副本掉落物品过多,请不要输入超过50次,否则可能号没了","10")
                                  [if] (sdnum)!=null
                                    ${sd_path} (sdnum)`;
                      data.items.push(cp);
                      let toudu = {}
                      toudu.name = '偷渡指定次数';
                      toudu.cmd = `@js ($sdnum) =prompt("请输入次数","10")
                                  [if] (sdnum)!=null
                                    [while] (sdnum) !=0
                                      ($sdnum) = (sdnum)-1
                                      ${cr_path}
                                      cr over`;
                      data.items.push(toudu);
                      let p = deepCopy(msg);
                      p.data = JSON.stringify(data);
                      WG.run_hook(data.type, data);
                      ws_on_message.apply(this, [p]);
                      return;
                  }
              }
          }

          WG.run_hook(data.type, data);

          // 【2026-08-22 修复】被其他设备登录踢下线：服务器返回 loginerror（"登陆凭证和角色不一致"）。
          // 此时 socket 虽连上但凭证已作废，重连/刷新都不能自动恢复 → 收到即触发自动刷新重登抢回账号。
          if (data.type == 'loginerror') {
              var _lerr = (data && (data.msg || '')) + '';
              if (_lerr.indexOf('凭证') >= 0 || _lerr.indexOf('不一致') >= 0) {
                  try {
                      if (typeof __extForceRelogin === 'function') {
                          try { ExtLog.warn('[恢复] 检测到账号在其他设备登录，自动刷新重新登录抢回'); } catch (e2) { }
                          __extForceRelogin((typeof roleid !== 'undefined') ? roleid : undefined);   // 传入被顶的事件角色，抢回时不跳号
                      }
                  } catch (e) { }
              }
          }

          // 【2026-08-12 移植作者 f45137e】合并"你获得了"物品消息（扫荡副本时大量重复提示聚合为一条）
          if (data.type == 'text' && typeof data.msg == 'string' &&
              data.msg.indexOf('你获得了') === 0 &&
              data.msg.indexOf('点经验') === -1 &&
              data.msg.indexOf('点潜能') === -1) {
              var itemName = data.msg.replace(/^你获得了/, '').replace(/[。，,.\s]/g, '').trim();
              if (itemName) {
                  if (!window._obtainedItems) {
                      window._obtainedItems = [];
                      window._obtainedMoney = { gold: 0, silver: 0, copper: 0 };
                  }
                  // 检测是否为金钱物品（先剥离颜色标签）
                  var cleanName = itemName.replace(/<[^>]+>/g, '');
                  var moneyAmount = null, moneyType = null;
                  var goldMatch = cleanName.match(/^(.+?)两黄金$/);
                  var silverMatch = cleanName.match(/^(.+?)两银子$/);
                  var copperMatch = cleanName.match(/^(.+?)文铜板$/) || cleanName.match(/^(.+?)铜板$/);
                  if (goldMatch) { moneyAmount = chineseNumToInt(goldMatch[1]); moneyType = 'gold'; }
                  else if (silverMatch) { moneyAmount = chineseNumToInt(silverMatch[1]); moneyType = 'silver'; }
                  else if (copperMatch) { moneyAmount = chineseNumToInt(copperMatch[1]); moneyType = 'copper'; }

                  if (moneyType) {
                      window._obtainedMoney[moneyType] += moneyAmount;
                  } else {
                      window._obtainedItems.push(itemName);
                  }
                  clearTimeout(window._obtainedTimer);
                  window._obtainedTimer = setTimeout(function () {
                      var parts = [];
                      // 先加入非金钱物品
                      if (window._obtainedItems && window._obtainedItems.length > 0) {
                          parts = window._obtainedItems.slice();
                      }
                      // 换算金钱：100铜板=1两银子，100两银子=1两黄金
                      var money = window._obtainedMoney;
                      if (money.copper >= 100) {
                          money.silver += Math.floor(money.copper / 100);
                          money.copper = money.copper % 100;
                      }
                      if (money.silver >= 100) {
                          money.gold += Math.floor(money.silver / 100);
                          money.silver = money.silver % 100;
                      }
                      // 将换算后的金钱追加到末尾
                      if (money.gold > 0) parts.push(intToChineseNum(money.gold) + '两黄金');
                      if (money.silver > 0) parts.push(intToChineseNum(money.silver) + '两银子');
                      if (money.copper > 0) parts.push(intToChineseNum(money.copper) + '文铜板');

                      if (parts.length > 0) {
                          var merged = '你获得了' + parts.join('、') + '。';
                          messageAppend('<hiw>' + merged + '</hiw>', 1);
                      }
                      window._obtainedItems = [];
                      window._obtainedMoney = { gold: 0, silver: 0, copper: 0 };
                  }, 500);
              }
              // 跳过原始消息显示，但保留 funny API
              if (unsafeWindow.funny && unsafeWindow.funny.API) {
                  unsafeWindow.funny.API.onmessage(msg);
              }
              return;
          }

          ws_on_message.apply(this, arguments);

          if (unsafeWindow.funny) {
              if (unsafeWindow.funny.API != null) { unsafeWindow.funny.API.onmessage(msg); }
          }
      },
});