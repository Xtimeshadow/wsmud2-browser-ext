// ============================================================
// ws-combat.js —— 战斗面板（从 ws.js 拆分）
// ------------------------------------------------------------
//   Combat 战斗面板：血条蓝条、招式 CD 动画、伤害显示
// ============================================================
'use strict';

const Combat = {
  'IsShow': false,
  'Skills': null,
  'actions': null,
  'room_actions': null,
  'object_actions': null,
  'Scroll': function(_t177) {
      let _J41 = $(this)[0];
      _J41.scrollLeft += _t177.originalEvent.deltaY;
  },
  'Show': function() {
      if (Combat.IsShow)
          return Combat.Hide();
      if (!this.object_actions)
          SendCommand('actions');
      Combat.IsShow = true;
      !Setting.off_hp && $(".room-item>.item-status").show();
      $(".combat-panel").removeClass("hide");
      this.refActions();
      Process.message.scroll2end();
  },
  'Hide': function() {
      Combat.IsShow = false;
      !Setting.off_hp && $(".room-item>.item-status").hide();
      $(".combat-panel").addClass("hide");
  },
  'ShowRoomCommands': function(_t178) {
      this.room = _t178;
      this.room_actions = _t178.commands;
      if (!Combat.IsShow)
          return;
      this.refActions();
  },
  'def_actions': [{
      'cmd': "dazuo",
      'name': '打坐'
  }, {
      'cmd': 'liaoshang',
      'name': '疗伤'
  }],
  'refActions': function() {
      let _a13 = [...this.def_actions];
      this.actions = _a13;
      this.room && Dialog.extend.append(_a13, "action", this.room);
      this.create_actions();
  },
  'ShowActions': function(_t180) {
      this.object_actions = _t180.actions ?? [];
      this.refActions();
      if (_t180.skills)
          this.ShowPFM(_t180);
  },
  'ShowPFM': function(_t182) {
      this.Skills = _t182.skills || [];
      this.create_skillItems(_t182.skills);
  },
  'append_items': function(_t184, _t185) {
      if (!_t184)
          return;
      for (let _t187 of _t184) {
          _t187.elem = $("<span class='act-item' cmd='" + _t187.cmd + '\x27>' + _t187.name + "</span>").appendTo(_t185);
          if (_t187.disper > 0) {
              _t187.elem.css("backgroundSize", _t187.disper + "% 100%");
          }
      }
  },
  'create_actions': function(_t188) {
      var _J42 = $(".room-commands").empty();
      this.append_items(this.actions, _J42);
      this.append_items(this.object_actions, _J42);
      this.append_items(this.room_actions, _J42);
  },
  'DisObj': function(_t190) {
      if (!this.object_actions)
          return;
      var _t192 = _t190.act ? _t190.id : "use " + _t190.id;
      for (var _n20 = 0; _n20 < this.object_actions.length; _n20++) {
          var _t193 = this.object_actions[_n20];
          if (_t193.cmd === _t192) {
              if (_t190.remove) {
                  this.object_actions.splice(_n20, 1);
                  _t193.elem.remove();
                  return;
              }
              else
                  this.ANI_OBJ(_t193, _t190.time, _t190.time);
          }
      }
  },
  'AddObj': function(_t194, _t195) {
      if (!this.object_actions)
          return;
      var _t197 = "use " + _t194;
      for (var _n21 = 0; _n21 < this.object_actions.length; _n21++) {
          var _t198 = this.object_actions[_n21];
          if (_t198.cmd == _t197)
              return;
      }
      this.object_actions.push({
          'cmd': "use " + _t194,
          'name': _t195.replace(/<.+?>/g, '')
      });
      this.create_actions();
  },
  'ANI_OBJ': function(_t199, _t200, _t201) {
      let _t203 = _t199.elem;
      if (!_t203)
          return;
      var _t204 = _t201 * 100 / _t200;
      // 【后台省电】低功耗模式（无真实交互的挂机标签）跳过血条 DOM 写入，保留状态与调度链。
      // 只砍"画给眼睛看的"，不影响战斗逻辑/出招命令；恢复交互后动画自动续播。
      var _lp = window._extLowPower && _extLowPower();
      if (_t204 > 0) {
          if (!_lp)
              _t203.css("backgroundSize", _t204 + '%\x20100%');
      } else {
          if (_t204 < 0)
              _t204 = 0;
          if (!_lp)
              _t203.css("backgroundSize", '0%\x20100%');
      }
      _t199.disper = _t204;
      setTimeout(Combat.ANI_OBJ, 1000, _t199, _t200, _t201 - 1000);
  },
  'create_skillItems': function(_t205) {
      var _J43 = $(".combat-commands").empty();
      if (!_t205.length)
          return;
      for (var _n22 = 0; _n22 < _t205.length; _n22++) {
          var _a14 = [];
          _a14.push("<span class='pfm-item' pid='" + _t205[_n22].id + "' id='" + _t205[_n22].id + '\x27>');
          _a14.push(_t205[_n22].name);
          _a14.push('</span>');
          _t205[_n22].elem = $(_a14.join('')).appendTo(_J43);
      }
  },
  'ChangeDistime': function(_t207) {
      var _t209 = _t207.id.replace('/', '.');
      for (var _n23 = 0; _n23 < Combat.dis_pfms.length; _n23++) {
          if (Combat.dis_pfms[_n23].id == _t209) {
              Combat.dis_pfms[_n23].ani_time += _t207.time;
              break;
          }
      }
  },
  'ClearDistime': function(_t210) {
      if (!Combat.dis_pfms)
          return;
      var _t212 = _t210.id ? _t210.id.replace('/', '.') : _t210.id;
      for (var _n24 = 0; _n24 < Combat.dis_pfms.length; _n24++) {
          (!_t212 || Combat.dis_pfms[_n24].id == _t212) && (Combat.dis_pfms[_n24].ani_time = 0);
      }
  },
  'redisable': function() {
      Combat.dis_pfms = [];
      for (var _n25 = 0; _n25 < Combat.Skills.length; _n25++) {
          var _t214 = Combat.Skills[_n25];
          Combat.dis_pfms.push({
              'id': _t214.id,
              'distime': _t214.distime,
              'ani_time': _t214.distime
          });
      }
      !Combat.time_handler && Combat.ANI_PFM();
  },
  'On_Perform': function(_t215) {
      if (!this.Skills)
          return;
      if (_t215.id === "all" && !_t215.rtime)
          return this.redisable();
      if (_t215.id)
          _t215.id = _t215.id.replace('/', '.');
      _t215.rtime = _t215.rtime || 0;
      _t215.distime = _t215.distime || 0;
      if (!this.dis_pfms)
          this.dis_pfms = [];
      for (var _n26 = 0; _n26 < this.dis_pfms.length; _n26++) {
          if (this.dis_pfms[_n26].id == _t215.id) {
              _t215.id = null;
              this.dis_pfms[_n26].distime = _t215.distime;
              this.dis_pfms[_n26].ani_time = _t215.distime;
              continue;
          }
          if (this.dis_pfms[_n26].ani_time < _t215.rtime) {
              this.dis_pfms[_n26].ani_time = _t215.rtime;
              this.dis_pfms[_n26].distime = _t215.rtime;
          }
      }
      _t215.id && this.dis_pfms.push({
          'id': _t215.id,
          'distime': _t215.distime,
          'ani_time': _t215.distime
      });
      Combat.ani_time = Combat.ani_time ?? 0;
      if (_t215.rtime > Combat.ani_time) {
          Combat.distime = _t215.rtime;
          Combat.ani_time = _t215.rtime;
      }
      !this.time_handler && Combat.ANI_PFM();
  },
  'PFM_INTERVAL': 300,
  'ANI_PFM': function() {
      var _n27 = 0;
      if (Combat.distime > 0)
          _n27 = Combat.ani_time * 100 / Combat.distime;
      // 【后台省电】低功耗模式跳过技能条 DOM 写入，保留冷却状态推进与调度链（恢复交互即续播）。
      var _lp = window._extLowPower && _extLowPower();
      for (var _n28 = 0; _n28 < Combat.Skills.length; _n28++) {
          var _t218 = Combat.Skills[_n28]
            , _t219 = _n27;
          for (var _n29 = 0; _n29 < Combat.dis_pfms.length; _n29++) {
              if (Combat.dis_pfms[_n29].id == _t218.id && Combat.dis_pfms[_n29].distime) {
                  _t219 = Combat.dis_pfms[_n29].ani_time * 100 / Combat.dis_pfms[_n29].distime;
                  _t219 < 0 ? Combat.dis_pfms.splice(_n29, 1) : Combat.dis_pfms[_n29].ani_time -= Combat.PFM_INTERVAL;
                  break;
              }
          }
          if (_t219 > 0) {
              if (_t219 < 0)
                  _t219 = 0;
              if (!_lp)
                  _t218.elem.css("backgroundSize", _t219 + '%\x20100%');
          } else if (!_lp)
              _t218.elem.css("backgroundSize", "0% 100%");
      }
      Combat.ani_time > 0 || Combat.dis_pfms.length ? Combat.time_handler = setTimeout(Combat.ANI_PFM, Combat.PFM_INTERVAL) : Combat.time_handler = null;
      Combat.ani_time -= Combat.PFM_INTERVAL;
  },
  'StatusChanged': function(_t220) {
      var _J44 = $(".room-item");
      for (var _n30 = 0; _n30 < _J44.length; _n30++) {
          var _J45 = $(_J44[_n30]);
          if (_J45.attr('itemid') == _t220.id) {
              this.UpdateBar(_t220, 'mp', _J45);
              this.UpdateBar(_t220, 'hp', _J45);
              break;
          }
      }
  },
  'UpdateBar': function(data, key, $container) {
      const currentVal = data[key];
      let maxVal = 0;

      if (currentVal === undefined) return;

      const $bar = $container.find('.' + key + ' > .progress-bar');

      // 取max值：优先data.max_xxx，否则读dom属性
      if (data['max_' + key]) {
          maxVal = data['max_' + key];
          $bar.attr("max", maxVal);
      } else {
          maxVal = parseInt($bar.attr("max"));
      }

      // hp数值显示
      if (Setting.show_hpnum && key === 'hp') {
          const hpText = Process.get_hpnum(currentVal, maxVal);
          $container.find(".progress-num").html(`[${hpText}<nor>/</nor><hiy>${maxVal}</hiy>]`);
      }

      // 设置进度条宽度
      $bar.css("width", Combat.CountWidth(currentVal, maxVal) + '%');

      // 伤害百分比显示（非玩家）
      if (Setting.show_damage && data.damage && data.id !== Process.player) {
          let damagePercent;
          if (data.damage === -1) {
              damagePercent = Math.trunc((maxVal - currentVal) * 1000 / maxVal) / 10;
          } else {
              damagePercent = Math.trunc(data.damage * 1000 / maxVal) / 10;
          }

          let $damageDom = $container.find(".item-damage");
          if (!$damageDom.length) {
              $damageDom = $("<span class=\"item-damage\">[<hiy>0%</hiy>]</span>").appendTo($container.find(".item-name"));
          }
          $damageDom.html(`[<hiy>${damagePercent}%</hiy>]`);
      }
  },
  'CountWidth': function(_t228, _t229) {
      if (_t229 === 0)
          return 0;
      const _t230 = _t228 * 100 / _t229;
      if (_t230 >= 100)
          return 100;
      if (_t230 < 0)
          return 0;
      return _t230;
  },
  'Perform': function() {
      const _J46 = $(this);
      if (_J46.is("disable"))
          return;
      const _t232 = _J46.attr("pid");
      if (!_t232)
          return;
      SendCommand('perform\x20' + _t232);
  },
  'STATUS': {},
  'AppendStatusItem': function(_t233, _t234, _t235) {
      var _o2 = {
          'elem': _t234,
          'items': {}
      };
      if (_t235)
          for (var _n33 = 0; _n33 < _t235.length; _n33++) {
              this.StatusItem_add(_o2, _t235[_n33]);
          }
      this.STATUS[_t233] = _o2;
  },
  'StatusItemChanged': function(_t237) {
      var _t239 = Combat["StatusItem_" + _t237.action];
      _t239 && _t239.call(Combat, this.STATUS[_t237.id], _t237);
  },
  'StatusItem_add': function(_t240, _t241) {
      if (!_t240)
          return;
      var _a15 = [];
      _a15.push("<span class=\"status-item");
      _t241.downside && _a15.push('\x20downside');
      _a15.push("\" sid=\"");
      _a15.push(_t241.sid);
      _a15.push('\x22>');
      _a15.push(_t241.name);
      if (_t241.count !== undefined) {
          _a15.push('x');
          _a15.push(_t241.count);
      }
      _a15.push("<span class=\"shadow\"></span></span>");
      _t240.items[_t241.sid] = {
          'elem': $(_a15.join('')).appendTo(_t240.elem)[0],
          'name': _t241.name,
          'count': _t241.count,
          'duration': _t241.duration,
          'anitime': _t241.duration - (_t241.overtime || 0)
      };
      if (_t241.duration > 0)
          Combat.StatusItemANI(_t240.items[_t241.sid]);
  },
  'StatusItem_remove': function(_t243, _t244) {
      if (!_t243)
          return;
      var _t246 = _t244.sid;
      if (typeof _t246 === 'string')
          _t246 = [_t246];
      for (var _n34 = 0; _n34 < _t246.length; _n34++) {
          var _t247 = _t243.items[_t246[_n34]];
          if (_t247) {
          $(_t247.elem).remove();
          if (_t247.handler) clearTimeout(_t247.handler);
          delete _t243.items[_t246[_n34]];
      }
      }
  },
  'StatusItem_refresh': function(_t248, _t249) {
      if (!_t248) return;
      const _t251 = _t248.items[_t249.sid];
      if (!_t251) return;
      const _t252 = _t251.elem.firstChild;
      const _t253 = _t251.elem.lastChild;
      _t251.count = _t249.count;
      _t251.elem.innerHTML = _t251.name + 'x' + _t251.count + _t253.outerHTML;
      _t251.handler && clearTimeout(_t251.handler);
      _t251.anitime = _t251.duration;
      Combat.StatusItemANI(_t251);
  },
  'StatusItem_override': function(_t254, _t255) {
      var _t257 = _t254.items[_t255.sid];
      if (!_t257)
          return;
      _t257.handler && clearTimeout(_t257.handler);
      _t257.anitime = _t257.duration;
      Combat.StatusItemANI(_t257);
  },
  'StatusItem_clear': function(_t258, _t259) {
      if (!_t258)
          return;
      for (const _t261 in _t258.items) {
          const _t262 = _t258.items[_t261];
          if (_t262) {
              $(_t262.elem).remove();
              clearTimeout(_t262.handler);
          }
      }
      _t258.items = {};
  },
  'StatusItemANI': function(_t263) {
      var _t265 = _t263.elem.lastChild
        , _t266 = _t263.anitime * 100 / _t263.duration;
      if (_t266 < 0)
          _t266 = 0;
      _t265.style.right = _t266 + '%';
      _t263.anitime = _t263.anitime - 1000;
      if (_t266 > 0) {
          _t263.handler = setTimeout(Combat.StatusItemANI, 1000, _t263);
      } else {
          _t263.handler = 0;
      }
  }
};