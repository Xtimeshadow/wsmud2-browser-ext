// ============================================================
// trigger-core-utils.js —— 触发器系统·核心工具类
// ------------------------------------------------------------
// 包含：CopyObject、is_match、通知中心(NotificationCenter)、
// 监控中心(MonitorCenter)
// ============================================================
'use strict';

function CopyObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function is_match(src, input) {
    if (src.length == 0 && input.length == 0) {
        return true;
    }
    if (src[0] == "*" && src.length == 1) {
        return true;
    }
    if (src.length == 0 || input.length == 0) {
        return false;
    }
    if (src[0] == "?") {
        return is_match(src.substring(1), input.substring(1));
    } else
        if (src[0] == "*") {
            return is_match(src.substring(1), input) || is_match(src.substring(1), input.substring(1)) || is_match(src, input.substring(1));
        } else
            if (src[0] == input[0]) {
                return is_match(src.substring(1), input.substring(1));
            } else {
                return false;
            }

}

/***********************************************************************************\
    Notification Center
\***********************************************************************************/

class Notification {
    constructor(name, params) {
        this.name = name;
        this.params = params;
    }
}

class NotificationObserver {
    constructor(targetName, action) {
        this.targetName = targetName;
        this.action = action;
    }
}

const NotificationCenter = {
    observe: function (notificationName, action) {
        const index = this._getOberverIndex();
        const observer = new NotificationObserver(notificationName, action);
        this._observers[index] = observer;
        return index;
    },
    removeOberver: function (index) {
        delete this._observers[index];
    },
    /**
     * @param {Notification} notification
     */
    post: function (notification) {
        for (const key in this._observers) {
            if (!this._observers.hasOwnProperty(key)) continue;
            const observer = this._observers[key];
            if (observer.targetName != notification.name) continue;
            // 【2026-08-11 隔离】单个触发器执行抛错不再中断同一通知的其他触发器
            try {
                observer.action(notification.params);
            } catch (e) {
                try { ExtLog.error('[触发] 触发器执行异常（已隔离）:', e && e.message); } catch (e2) { }
            }
        }
    },

    _observerCounter: 0,
    _observers: {},
    _getOberverIndex: function () {
        const index = this._observerCounter;
        this._observerCounter += 1;
        return index;
    }
};

/***********************************************************************************\
    Monitor Center
\***********************************************************************************/

class Monitor {
    constructor(run) {
        this.run = run;
    }
}

const MonitorCenter = {
    addMonitor: function (monitor) {
        this._monitors.push(monitor);
    },
    run: function () {
        for (const monitor of this._monitors) {
            monitor.run();
        }
    },

    _monitors: []
};