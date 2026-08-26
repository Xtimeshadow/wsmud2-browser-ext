// ============================================================
// wg-misc.js —— 杂项功能（核心留存）
// ------------------------------------------------------------
// 从原 wg-misc.js 精简后保留的模块：
//   中文数字转换（chineseNumToInt / intToChineseNum）
//   WG 钩子系统（hooks / add_hook / remove_hook / run_hook）
// 自定义按钮 → wg-misc-buttons.js
// 健康自检/无人值守推送 → wg-misc-health.js
// 消息接收处理 → wg-misc-msg.js
// ============================================================
'use strict';


// 【2026-08-12 移植作者 f45137e】中文数字转整数（用于"你获得了"物品/金钱合并显示）
function chineseNumToInt(cn) {
    var numMap = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    var unitMap = { '十': 10, '百': 100, '千': 1000, '万': 10000 };
    var result = 0, current = 0;
    for (var i = 0; i < cn.length; i++) {
        var char = cn[i];
        if (unitMap[char] !== undefined) {
            if (current === 0) current = 1;
            result += current * unitMap[char];
            current = 0;
        } else if (numMap[char] !== undefined) {
            if (i + 1 < cn.length && unitMap[cn[i + 1]] !== undefined) {
                current = numMap[char];
            } else {
                result += numMap[char];
            }
        }
    }
    return result + current;
}

// 整数转中文数字
function intToChineseNum(n) {
    var cn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    var units = ['', '十', '百', '千', '万'];
    if (n === 0) return '零';
    var numStr = String(n);
    var result = '';
    var len = numStr.length;
    var lastWasZero = false;
    var hasNonZero = false;
    for (var i = 0; i < len; i++) {
        var digit = parseInt(numStr[i]);
        var pos = len - 1 - i;
        if (digit === 0) {
            if (hasNonZero) lastWasZero = true;
        } else {
            if (lastWasZero) { result += '零'; lastWasZero = false; }
            if (pos === 1 && digit === 1 && !hasNonZero) {
                result += '十';
            } else {
                result += cn[digit] + (pos > 0 ? units[pos] : '');
            }
            hasNonZero = true;
        }
    }
    return result;
}

Object.assign(WG, {
      hooks: [],
      hook_index: 0,
      add_hook: function (types, fn) {
          var hook = {
              'index': WG.hook_index++,
              'types': types,
              'fn': fn
          };
          WG.hooks.push(hook);
          return hook.index;
      },
      remove_hook: function (hookindex) {
          var that = this;
          for (var i = 0; i < that.hooks.length; i++) {
              if (that.hooks[i].index == hookindex) {
                  that.hooks.baoremove(i);
              }
          }
      },
      run_hook: function (type, data) {
          for (var i = 0; i < this.hooks.length; i++) {
              // if (this.hooks[i] !== undefined && this.hooks[i].type == type) {
              //     this.hooks[i].fn(data);
              // }
              try {
                  var listener = this.hooks[i];

                  // 新增：检查通配符 '*'
                  if (listener.types === '*') {
                      listener.fn(data); // 如果是通配符，直接执行
                      continue; // 继续检查下一个hook
                  }

                  // 原始逻辑：检查具体类型匹配
                  if (listener.types == data.type || (listener.types instanceof Array && $
                                                      .inArray(data.type, listener.types) >= 0)) {
                      listener.fn(data);
                  }
              }
              catch (e) {
                  console.error('hook error', e);
              }
          }
      },
});