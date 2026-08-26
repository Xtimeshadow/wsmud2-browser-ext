// ============================================================
// ui-jinglian.js —— 精炼滑块控件
// ------------------------------------------------------------
// 从 ui.js 拆分出来的精炼相关 UI 和逻辑：
//   UI.xiangqianui / UI.jinglianui / fastjinglian()
// 依赖：UI 对象（ui.js 定义）
// ============================================================
'use strict';

// 取消镶嵌按钮
UI.xiangqianui = function (id) {
    return `<div class="item-commands "><span cmd="unxiangqian ${id}" style="color: #00FFFF"> 取消镶嵌 </span></div>`;
};

// 精炼滑块 UI
UI.jinglianui = function (id) {
    return `<div id="fastjinglian" style="display: flex; flex-direction: column; line-height: normal;"><div style="display: flex; align-items: center; gap: 4px;"><div id="jinglian-slider" style="flex: 1; min-width: 0; height: 32px; display: flex; align-items: center; position: relative;"><input type="range" min="0" max="12" step="1" value="0" id="jinglian-slider-input" style="width: 100%; height: 8px; outline: none;"></div><div id="jinglian-slider-number" style="min-width: 2.5em; text-align: center; font-weight: bold;color: #FF4500"></div></div><div style="display: flex; justify-content: space-between; align-items: center; padding: 0px 4px; margin: 0; flex-wrap: wrap;"><div style="display: flex; align-items: center; gap: 4px"><span>⟶</span><span class="item-commands"><span id="jinglian-preview"></span></span></div><div style="flex: 0 0 auto; line-height: 0;"><span id="jinglian-cost" style="font-size: 14px;;"></span><span style="font-size: 14px;color: #00FF00">&nbsp;玄晶</span></div></div></div><div class="item-commands" style="padding: 4px 16px;"><span cmd="unjinglian ${id}" style="color: #00FFFF">取消精炼</span></div>`;
};

// 精炼滑块逻辑
function fastjinglian(jlname, jlid) {
    // 匹配颜色
    let colormatch = jlname.match(/^<([^>]+)>/);
    let jl_color = colormatch ? colormatch[1].toLowerCase() : '';

    // 去除颜色标签
    let pureText = jlname.replace(/<[^>]+>/g, '');
    // 去除星星
    let lastname = pureText.replace(/^[★☆]+/, '');

    // 匹配星星
    let starsmatch = pureText.match(/^([★☆]+)/);
    let jl_stars = starsmatch ? starsmatch[1] : '';
    // 计算精炼等级
    let jl_times = 0;
    for (const s of jl_stars) {
        jl_times += s === '★' ? 2 : 1;
    }

    let xuanjing = 0
    for (let i = 0; i < GameState.packs.items.length; i++) {
        if (GameState.packs.items[i].name == "<hig>玄晶</hig>") {
            xuanjing = GameState.packs.items[i].count
            break
        }
    }
    // 获取元素内容
    const jinglianCost = document.getElementById("jinglian-cost");
    const jinglianPreview = document.getElementById("jinglian-preview");
    const jinglianSliderNumber = document.getElementById("jinglian-slider-number");
    const jinglianPreviewContent = document.createElement(jl_color);
    jinglianPreviewContent.textContent = jl_stars + lastname;
    jinglianPreview.appendChild(jinglianPreviewContent);
    let previewJinglianTimes = jl_times;
    // 滑动条事件
    const jinglianSliderInput = document.getElementById("jinglian-slider-input");
    jinglianSliderInput.addEventListener("click", (event) => {
        event.stopPropagation()
    });
    jinglianSliderInput.value = jl_times.toString();

    let jl_level = (function () {
        const jlgrade = [{
            color: "wht",
            cost: 0
        }, {
            color: "hig",
            cost: 2
        }, {
            color: "hic",
            cost: 4
        }, {
            color: "hiy",
            cost: 6
        }, {
            color: "hiz",
            cost: 8
        }, {
            color: "hio",
            cost: 10
        }, ];
        for (let grade of jlgrade) {
            if (jl_color === grade.color) {
                return grade
            }
        }
        return null
    })();

    function CalculateCost(times) {
        return jl_level.cost * (2 ** times - 1)
    }

    function UpdatePreview() {
        jinglianSliderNumber.textContent = `+${previewJinglianTimes}`;
        const alreadyCost = CalculateCost(jl_times);
        const previewCost = CalculateCost(previewJinglianTimes);
        if (previewJinglianTimes < jl_times) {
            jinglianCost.textContent = `${xuanjing}+${alreadyCost-previewCost}`;
            jinglianCost.style.color = "#00FFFF";
            jinglianPreview.setAttribute("cmd", ("#unjinglian " + jlid + ";" + ("jinglian " + jlid + " ok;").repeat(previewJinglianTimes)).slice(0, -1));
            jinglianPreview.style.cursor = "pointer"
        } else if (previewJinglianTimes === jl_times) {
            jinglianCost.textContent = `${xuanjing}`;
            jinglianCost.style.color = "#C0C0C0";
            jinglianPreview.removeAttribute("cmd");
            jinglianPreview.style.cursor = "default"
        } else if (previewJinglianTimes > jl_times) {
            jinglianCost.textContent = `${xuanjing}-${previewCost-alreadyCost}`;
            if (xuanjing >= (previewCost - alreadyCost)) {
                jinglianCost.style.color = "#00FF00";
                if (previewJinglianTimes >= 12) {
                    jinglianPreview.setAttribute("cmd", "#jinglian " + jlid + " full")
                } else {
                    jinglianPreview.setAttribute("cmd", (("#jinglian " + jlid + " ok;").repeat(previewJinglianTimes - jl_times)).slice(0, -1))
                }
                jinglianPreview.style.cursor = "pointer"
            } else {
                jinglianCost.style.color = "#800000";
                jinglianPreview.removeAttribute("cmd");
                jinglianPreview.style.cursor = "not-allowed"
            }
        }
        jinglianPreviewContent.textContent = "★".repeat(Math.floor(previewJinglianTimes / 2)) + "☆".repeat(previewJinglianTimes % 2) + lastname
    }
    UpdatePreview();
    jinglianSliderInput.addEventListener("input", (event) => {
        previewJinglianTimes = parseInt(event.target.value);
        UpdatePreview()
    });
}