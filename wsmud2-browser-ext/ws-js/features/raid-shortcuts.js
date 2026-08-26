// ============================================================
// raid-shortcuts.js —— 快捷功能（从 Raid.js 拆分）
// ============================================================

    //---------------------------------------------------------------------------

    /* @taohualin 走出桃花林 */
    (function () {
        const executor = new AtCmdExecutor("taohualin", function (performer, param) {
            return new Promise(resolve => {
                THIsland.outMaze(resolve);
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    /* @zhoubotong 找到周伯通 */
    (function () {
        const executor = new AtCmdExecutor("zhoubotong", function (performer, param) {
            return new Promise(resolve => {
                THIsland.zhoubotong(resolve);
            });
        });
        CmdExecuteCenter.addExecutor(executor);
    })();

    const DungeonsShortcuts = {
        extension_sdyt: function () {
            let source = `
                [if] (:room 副本区域,忧愁谷)==true || (:state)==推演 || (:state)==领悟
                @print <ord>当前状态无法进行一键咸鱼，自动停止！</ord>
                [exit]
                @print 🐟 一键咸鱼 => <hic>扫荡妖塔</hic>
                @print <hic>如果想自己静默式调用扫荡妖塔功能，请先设定变量扫荡次数 <hiy>SDYTnum</hiy> 和 单次消耗精力上限 <hiy>SDYTjlsx</hiy> 的值。</hic>
                [if] (SDYTjlsx) == 0 || (SDYTjlsx) == null || (SDYTjlsx) == undefined
                @js ($SDYTjlsx) = prompt("请输入单次消耗精力上限，超过后将自动停止：", "85");
                [if] (SDYTnum) == 0 || (SDYTnum) == null || (SDYTnum) == undefined
                @js ($SDYTnum) = prompt("请输入本轮扫荡次数，注意：单次消耗精力达到上限后将自动停止。","5")
                ($sdyt_num) = (SDYTnum)
                //($SDYTnum) = null
                [if] (sdyt_num) == 0 || (sdyt_num) == null || (sdyt_num) == undefined
                @print <ord>扫荡次数为0，取消扫荡。</ord>
                [exit]
                @print <hiy>计划扫荡(sdyt_num)次妖塔。</hiy>
                stopstate
                [if] (:room) != 古大陆-墓园
                $goyt
                @await 1500
                [if] (:room) != 古大陆-墓园
                @print <ord>无法前往古大陆，请重试或确定当前角色是否已解锁古大陆。</ord>
                $zdwk
                [exit]
                [if] {b扫荡符#}? < (sdyt_num) || {b扫荡符}? == null
                shop 0 (sdyt_num)
                ($num) = 0
                @cmdDelay 500
                ($ytWeek) = null
                [while] (num) < (sdyt_num)
                ss muyuan
                @tip 你即将消耗一个扫荡符，($jl_yt)精力快速完成一次弑妖塔|你即将消耗($jl_yt)精力快速完成一次弑妖塔|你尚未($ytJS)弑妖塔|你已达到($ytWeek)上限
                [if] (ytJS) != null
                    @print <hiy>妖塔未解锁，无法扫荡。</hiy>
                    [break]
                [if] (ytWeek) != null
                    @print <hiy>妖塔扫荡已达到本周上限。</hiy>
                    [break]
                [if] (jl_yt) > (SDYTjlsx) && (jl_yt) != null
                    @print <ord>单次扫荡精力超过(SDYTjlsx)，自动停止。</ord>
                    [break]
                [else]
                    saodang muyuan
                    @tip 你消耗一个扫荡符|精力快速完成弑妖塔|你的($lack)不够|你已达到($ytWeek)上限
                    [if] (ytWeek) != null
                    @print <hiy>妖塔扫荡已达到本周上限。</hiy>
                    [break]
                    [if] (lack) != null
                    @print <ord>(lack)不足，自动停止扫荡妖塔。</ord>
                    [break]
                ($num) = (num) + 1
                @await 1000
                $zdwk
            `
            const p = new Performer("扫荡妖塔", source);
            p.log(false);
            p.start();
        },
        extension_yjyt: async function () {
            let source = `
                jh fam 9 start;go enter;go up;
                @await 1000;
                ggdl {r疯癫的老头}?;
                go north[4];
                @await 250;
                go north[2];look shi;tiao1 shi;tiao3 shi;
                @await 250;
                tiao1 shi;tiao3 shi;tiao2 shi;go north;"
            `
            const p = new Performer("一键妖塔", source);
            p.log(false);
            p.start();
           },
        extension_setting: function () {
            let source = `
                [(SDYTjlsx)==null]($SDYTjlsx)=85
                [(SDYTnum)==null]($SDYTnum)=5
                @print 🐟 一键咸鱼 => <hic>参数设置</hic>
                #input ($SDYTjlsx)=<hiz>一键设置各种常用流程（陆续更新添加）参数</hiz><br/>&nbsp*&nbsp<ord>🐉 扫荡妖塔</ord> 参数<br/>&nbsp*&nbsp妖塔单次消耗精力上限,(SDYTjlsx)
                #input ($SDYTnum)=每轮妖塔扫荡次数,(SDYTnum)
                #config
                @print 已完成参数设置
            `
            const p = new Performer("参数设置", source);
            p.log(false);
            p.start();
        },
        extension_cihang: function () {
            let source = `
[if] (:room 慈航静斋) == false
    @print <hiy>请先进入慈航副本再运行。</hiy>
    [exit]
[else]
    [if] (:room) != 慈航静斋-山门(副本区域) && (:room) != 慈航静斋-帝踏峰(副本区域)
        @print <hiy>请在山门或帝踏峰运行。</hiy>
        [exit]
($go) = 'east','west','south','north'
($qiku) = '老','病','死','爱别离','怨憎会','求不得'
($num1) = 0
[if] (:room) == 慈航静斋-山门(副本区域)
    go south
[else if] (:room) == 慈航静斋-帝踏峰(副本区域)
    go south[2]
@print <hiy>开始自动寻路，寻路期间请勿点击地图……</hiy>
@cmdDelay 500
[while] (num1) < 6
    @js ($ku) = [(qiku)][(num1)]
    ($num2) = 0
    [while] true
        [if] (map) != null && (retry) == true
            (map)
            @await 500
        @js ($fx) = [(go)][(num2)]
        [if] (fx) == null
            @print <hiy>自动寻路失败，请回到山门重新运行！</hiy>
            [exit]
        go (fx)
        [if] (:room) == 慈航静斋-七重门(副本区域)
            @js ($ku_now) = $(".room_desc").text().match("，是名([^%]+)苦。")[1]
            [if] (ku) != (ku_now)
                [while] true
                    go west
                    [if] (:room) == 慈航静斋-七重门(副本区域)
                        @js ($dir_gc) = $("text:contains('广场')").attr("dir")
                    [if] (dir_gc) == south
                        go south
                    @await 200
                    [if] (:room) == 慈航静斋-山门(副本区域)
                        [break]
                    [else if] (:room) == 慈航静斋-广场(副本区域)
                        @print <hiy>已走出七重门！</hiy>
                        [exit]
                go south
                ($num2) = (num2) + 1
                ($retry) = true
            [else]
                [if] (map) == null
                    ($map) = go (fx)
                [else]
                    ($map) = (map);go (fx)
                ($retry) = false
                [break]
        [else if] (:room) == 慈航静斋-广场(副本区域)
            @print <hiy>已走出七重门！</hiy>
            [exit]
    ($num1) = (num1) + 1
go south
[if] (:room) == 慈航静斋-广场(副本区域)
    @print <hiy>已走出七重门！</hiy>
            `
            const p = new Performer("慈航七重门", source);
            p.log(false);
            p.start();
        },
        extension_zhanshendian: function () {
            let source = `[if] (:room 战神殿) == false
    @print <hiy>请先进入战神殿副本再运行。</hiy>
    [exit]
[if] (:room) != 战神殿-左雁翼(副本区域)
    @print <hiy>请先手动向左走到左雁翼。</hiy>
@until (:room) == 战神殿-左雁翼(副本区域)
look shi
@tip 和外面星空星宿位置一一对应，($star_0)，($star_1)，($star_2)，($star_3)，($star_4)，($star_5)，($star_6)，($star_7)这些星宿依次闪烁
($stars) = "(star_0)","(star_1)","(star_2)","(star_3)","(star_4)","(star_5)","(star_6)","(star_7)"
($dirs) = {"star":"角亢室","dir":1,"eswn":"东北↗︎","go":"northeast"},{"star":"氏房心","dir":0,"eswn":"东→","go":"east"},{"star":"尾箕轸","dir":2,"eswn":"东南↘︎","go":"southeast"},{"star":"井鬼参","dir":4,"eswn":"西南↙︎","go":"southwest"},{"star":"柳星张翼","dir":3,"eswn":"南↓","go":"south"},{"star":"奎娄斗牛","dir":6,"eswn":"西北↖︎","go":"northwest"},{"star":"胃昴毕觜","dir":5,"eswn":"西←","go":"west"},{"star":"女虚危壁","dir":7,"eswn":"北↑","go":"north"}
@cmdDelay 100
($num_1) = 0
[while] (num_1) < 8
    @js ($star) = [(stars)][(num_1)]
    ($num_2) = 0
    [while] (num_2) < 28
        ($dir) = null
        @js ($dir) = var d=[(dirs)];var s=d[(num_2)]["star"].indexOf("(star)");if(s>=0){d[(num_2)]["dir"]}
        [if] (dir) != null
            [break]
        ($num_2) = (num_2) + 1
    push (dir)
    ($num_1) = (num_1) + 1
look shi
@tip 殿顶的星图依旧，却仅剩一颗($last)宿星孤零零的闪烁着
($num_3) = 0
[while] (num_3) < 28
    ($dir_l) = null
    ($go_l) = null
    @js ($dir_l) = var d=[(dirs)];var s=d[(num_3)]["star"].indexOf("(last)");if(s>=0){d[(num_3)]["eswn"]}
    @js ($go_l) = var d=[(dirs)];var s=d[(num_3)]["star"].indexOf("(last)");if(s>=0){d[(num_3)]["go"]}
    [if] (dir_l) != null && (go_l) != null
        [break]
    ($num_3) = (num_3) + 1
@print <hiy>(last)宿，最后一个方位是【(dir_l)】</hiy>
tm (last)宿，最后一个方位是【(dir_l)】60秒倒计时已开始，请抓紧开打。
@print <ord>打完右雁翼最后一波守卫后会自动进秘道【(go_l)】</ord>
@until (:room) == 战神殿-右雁翼(副本区域) || (:room 副本区域) == false
@until (:combating) == true || (:room 副本区域) == false
@until (:combating) == false || (:room 副本区域) == false
[if] (:room 副本区域) == false
    [exit]
[while] (:room) == 战神殿-右雁翼(副本区域) && (:living) == true
    go (go_l);$wait 100
            \`
            const p = new Performer("战神殿解谜", source);
            p.log(false);
            p.start();
        },
        extension_guzongmen: function () {
            let source = \`
@print <hiy>如果寻路一直失败，请检查设置中<ord>【切换房间时不清空上房间信息】</ord>是否开启。</hiy>
[if] (:room 副本区域,忧愁谷) == true
    @print <ord>当前处于副本中，无法寻路！</ord>
    [exit]
@cmdDelay 500
stopstate
jh fam 9 start
go enter
go up
@tip 打败我，你就($pass)上去|聚魂成功|踏过长生门|你已堪破生死|古老的大陆寻找真相|你连($pass)都没聚合|你想($pass)为神吗
[if] (pass) != null
    @print <ord>不符合前往古大陆要求，流程终止。</ord>
    [exit]
ggdl {r疯癫的老头}
go north[3]
go north[3]
look shi
tiao1 shi;tiao1 shi;tiao2 shi
@until (:room) == 古大陆-断山
@js ($ylfx) = $(".room_desc").text().match(/[东南西北]，/g)
@js ($ylfx) = var f="(ylfx)";f.replace(/，/g,"")
@js ($ylfx) = var f="(ylfx)";f.replace(/东/g,"west")
@js ($ylfx) = var f="(ylfx)";f.replace(/西/g,"east")
@js ($ylfx) = var f="(ylfx)";f.replace(/南/g,"north")
@js ($ylfx) = var f="(ylfx)";f.replace(/北/g,"south")
@js ($ylfx) = var f="(ylfx)";f.replace(/,/g,"','")
@js ($ylfx) = var f=['(ylfx)'];f.reverse()
@js ($ylfx) = var f="(ylfx)";f.replace(/,/g,"','")
@js ($ylfx) = "'"+"(ylfx)"+"'"
@js ($fl) = [(ylfx)].length
go down
go south[3]
go south[2]
go west
($go) = 'east','west','south','north'
($num) = 0
[while] (num) < 4
    @await 500
    @js $(".content-message pre").html("");
    @await 500
    @js ($fx1) = [(go)][(num)]
    go (fx1)
    @js ($lost) = $(".content-message").text().match("你似乎迷路了")
    [if] (lost) != null
        go south[3]
        go south[3]
        go west
        ($num) = (num) + 1
    [else]
        [break]
[if] (fl) == 5
    ($num) = 0
    [while] (num) < 5
        @js ($fx) = [(ylfx)][(num)]
        go (fx)
        ($num) = (num) + 1
[else if] (fl) == 4
    @js ($fx2) = [(ylfx)][0]
    @js ($fx3) = [(ylfx)][1]
    @js ($fx4) = [(ylfx)][2]
    @js ($fx5) = [(ylfx)][3]
    ($lxjh) = {"lx":"go (fx2);go (fx3);go (fx4);go (fx5);go (fx5)"},{"lx":"go (fx2);go (fx3);go (fx4);go (fx4);go (fx5)"},{"lx":"go (fx2);go (fx3);go (fx3);go (fx4);go (fx5)"},{"lx":"go (fx2);go (fx2);go (fx3);go (fx4);go (fx5)"}
[else if] (fl) == 3
    @js ($fx2) = [(ylfx)][0]
    @js ($fx3) = [(ylfx)][1]
    @js ($fx4) = [(ylfx)][2]
    ($lxjh) = {"lx":"go (fx2);go (fx3);go (fx4);go (fx4);go (fx4)"},{"lx":"go (fx2);go (fx3);go (fx3);go (fx3);go (fx4)"},{"lx":"go (fx2);go (fx2);go (fx2);go (fx3);go (fx4)"},{"lx":"go (fx2);go (fx3);go (fx3);go (fx4);go (fx4)"},{"lx":"go (fx2);go (fx2);go (fx3);go (fx4);go (fx4)"},{"lx":"go (fx2);go (fx2);go (fx3);go (fx3);go (fx4)"}
[else if] (fl) == 2
    @js ($fx2) = [(ylfx)][0]
    @js ($fx3) = [(ylfx)][1]
    ($lxjh) = {"lx":"go (fx2);go (fx3);go (fx3);go (fx3);go (fx3)"},{"lx":"go (fx2);go (fx2);go (fx3);go (fx3);go (fx3)"},{"lx":"go (fx2);go (fx2);go (fx2);go (fx3);go (fx3)"},{"lx":"go (fx2);go (fx2);go (fx2);go (fx2);go (fx3)"}
[else if] (fl) == 1
    @js ($fx2) = [(ylfx)][0]
    ($lxjh) = {"lx":"go (fx2);go (fx2);go (fx2);go (fx2);go (fx2)"}
[if] (fl) < 5
    @js ($fxlen) = [(lxjh)].length
    ($num) = 0
    [while] (num) < (fxlen)
        @js ($map) = var f=[(lxjh)];f[(num)]["lx"]
        (map)
        [if] (:room) != 古大陆-药林
            [while] (:room) != 古大陆-平原
                go south
                @await 350
            go north;go west
            go (fx1)
            ($num) = (num) + 1
        [else]
            [break]
tiao bush
[if] (:room) == 古大陆-山脚
    @print <ord>古宗门自动寻路已完成！</ord>
[else]
    @print <ord>寻路失败，请重新运行或换个时间。</ord>
            `
            const p = new Performer("古宗门寻路", source);
            p.log(false);
            p.start();
        },
    };