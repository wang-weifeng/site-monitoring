var details = {};

details.init = function () {

    details.bindEvent();
    details.renderSite();
    details.rendermonitoring();
    details.siteTable();
    details.rendsiteTime();
    details.rendsiteTable();

};

details.bindEvent = function () {
    $("#backSite").on('click',function () {
        window.location.href = "/";
    });
    $("#refresh").on('click',function () {
        if($("#end_time").val() == '' || $("#start_time").val() =='' ){
            alert("查询日期填写完整");
            return;
        }
        details.picture();
        details.rendsiteTable();
    });
    $("#backINdex").on('click',function () {
        window.location.href = "/";
    });
};

details.renderSite = function () {
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    $.get('/v1/sitelist/search?sitelist_id='+sitelist_id+"&token="+token,function (result) {
        console.log(result);
        if(result.result == true) {
            $("#currentSiteName1").text(result.data[0].sitelist_name);
            $("#currentSiteName2").text(result.data[0].sitelist_name);
            $("#currentSiteAddress").text(result.data[0].sitelist_address);
            $("#currentSiteTime").text(result.data[0].sitelist_time);
            $("#currentSiteChoose").text(result.data[0].sitelist_choose);
        } else if(!result.result && result.message == "token过期，重新登录!"){
            clearSession();
            window.location.href = "/login";
            return;
        } else {
            alert("网络暂时异常￣へ￣!");
            return;
        }
    });
};

details.rendermonitoring = function () {
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    var monitoringListHtml = '';
    var MsName = '';
    //var MsName = '<label for="quan"><input type="radio" name="address" checked="checked" value="0" onClick=details.onsiteDelItemClick(0)> <span>全网均值</span></label>';
    var normal = 0;
    var missing = 0;
    var mistake = 0;
    $("#siteMoringDetails").html(monitoringListHtml);
    $("#MSName").html(MsName);
    $.get('/v1/site/monitoring-search?sitelist_id='+sitelist_id+"&token="+token,function (result){
        console.log(result);
        if(result.result == true) {
            if (result.data.length > 0) {
                $.each(result.data, function (key, val) {
                    if(key == 0){
                        MsName = "<label for='dx1'><input type='radio' name='address' checked='checked' value='"+result.data[key].logs_monitoring_id+"' onClick=details.onsiteDelItemClick(" + result.data[key].logs_monitoring_id + ")><span>"+result.data[key].monitoring_name+"</span></label>";
                    } else {
                        MsName = "<label for='dx1'><input type='radio' name='address' value='"+result.data[key].logs_monitoring_id+"' onClick=details.onsiteDelItemClick(" + result.data[key].logs_monitoring_id + ")><span>"+result.data[key].monitoring_name+"</span></label>";
                    }
                    if(result.data[key].logs_reptime == null){
                        missing++;
                        result.data[key].logs_reptime = 0;
                        monitoringListHtml = "<div class='canvas-box'> <p>"+result.data[key].monitoring_name+"</p> <span>"+result.data[key].logs_reptime+"ms</span> <div class='canvas-wrap'> <canvas class='circle-process' width='100' height='100' process='50%' colors = "+'#face00'+">50%</canvas> <div class='text'> <p class='num'>50%</p> </div> </div> </div>";
                    } else if(result.data[key].logs_status != 0 && result.data[key].logs_reptime && result.data[key].logs_process == 1){
                        mistake++;
                        monitoringListHtml = "<div class='canvas-box' onClick=details.onLogsErrorItemClick(" + result.data[key].logs_monitoring_id + ",'" + result.data[key].monitoring_name + "')> <p>"+result.data[key].monitoring_name+"</p> <span>"+result.data[key].logs_reptime+"ms</span> <div class='canvas-wrap'> <canvas class='circle-process' width='100' height='100' process='10%' colors = "+'#ff2211'+">0%</canvas> <div class='text'> <p class='num'>0%</p> </div> </div> </div>";
                    } else if((result.data[key].logs_status == 0 || result.data[key].logs_process == 0) && result.data[key].logs_reptime){
                        normal++;
                        monitoringListHtml = "<div class='canvas-box'> <p>"+result.data[key].monitoring_name+"</p> <span>"+result.data[key].logs_reptime+"ms</span> <div class='canvas-wrap'> <canvas class='circle-process' width='100' height='100' process='100%' colors = "+'#37b008'+">100%</canvas> <div class='text'> <p class='num'>100%</p> </div> </div> </div>";
                    }

                    $("#siteMoringDetails").append(monitoringListHtml);
                    $("#MSName").append(MsName);
                });
            }
            $("#errlogstotal").on('click',function () {
                window.location.href = '/more-errlogs?sitelist_id='+sitelist_id;
            });
            $("#normal").text(normal);
            $("#mistake").text(mistake);
            $("#missing").text(missing);
            details.render();
            var choosetime = 24 ;
            details.picture(choosetime);
        } else if(!result.result && result.message == "token过期，重新登录!"){
            clearSession();
            window.location.href = "/login";
            return;
        } else {
            alert("网络暂时异常￣へ￣!");
            return;
        }
    });
};

details.onLogsErrorItemClick = function (logs_monitoring_id,monitoring_id_name) {
    console.log(monitoring_id_name);
    window.location.href = '/single-errlogs?logs_monitoring_id='+logs_monitoring_id+"&sitelist_id="+sitelist_id+"&monitoring_id_name="+monitoring_id_name;
};

details.render = function (sitelist_id) {
    initCanvas();
    function initCanvas(){
        console.log("1");
        // 选出页面上所有class为process的canvas元素
        var colorAttr = [];
        $('canvas.circle-process').each(function() {
            // 获取进度数值
            var text = $(this).attr('process');
            var colors = $(this).attr('colors');
            colorAttr.push(colors)
            var process = text.substring(0, text.length-1);
            drawProcess(this, process, colors);
        });
        $('.canvas-box span').each(function (i) {
            $(this).css({'color':colorAttr[i]})
        });
        //hover事件
        var processInterval = null;
        $('.canvas-wrap').hover(function(e){
            var start = 0,
                canvas = $(this).find('canvas.circle-process')[0],
                colors = $(this).find('canvas.circle-process').attr('colors');
            end = $(canvas).attr('process').split('%')[0],
                intervalTime = 500/end;
            processInterval = setInterval(function(){
                //画帧
                drawProcess(canvas, start++,colors);
                if(start > end){
                    clearInterval(processInterval);
                    processInterval = null;
                }
            }, intervalTime);
        }, function(e){
            var canvas = $(this).find('canvas.circle-process')[0],
                colors = $(this).find('canvas.circle-process').attr('colors');
            end = $(canvas).attr('process').split('%')[0];
            if(processInterval){
                //有动画，直接显示最终效果
                clearInterval(processInterval);
                processInterval = null;
                drawProcess(canvas, end,colors);
            }
        });
    }
    function drawProcess(canvas, process, colors) {
        // 拿到绘图上下文
        var context = canvas.getContext('2d');
        var cWidth = canvas.width;
        var cHeight = canvas.height;
        var circleX = cWidth/2;
        var circleY = cHeight/2;
        var circleR = circleX-2;
        // 将绘图区域清空
        context.clearRect(0, 0, cWidth, cHeight);
        //灰色背景
        context.beginPath();

        context.moveTo(circleX, circleY);

        context.arc(circleX, circleY, circleR, 0, Math.PI * 2, false);
        context.closePath();
        context.fillStyle = '#eee';
        context.fill();
        // 画进度
        context.beginPath();

        context.moveTo(circleX, circleY);

        context.arc(circleX, circleY, circleR, -Math.PI/2, Math.PI * (2 * (process-.005) / 100-.5), false);
        context.closePath();
        context.fillStyle = colors;
        context.fill();

        // 画内部空白
        context.beginPath();
        context.moveTo(circleX, circleY);
        context.arc(circleX, circleY, circleR-6, 0, Math.PI * 2, true);
        context.closePath();
        context.fillStyle = '#fff';
        context.fill();
    }
};

details.picture = function () {
    if($("#end_time").val() == '' || $("#start_time").val() =='' ){
        alert("查询日期填写完整");
        return;
    }
    var end_time =  $("#end_time").val();
    var start_time = $("#start_time").val();
    var arrow = $('.arrow'),siction1Box = $('.siction1-box'),flage = true;
    arrow.on('click',function () {
        if(flage){
            flage = false;
            siction1Box.css({'height':'inherit'});
            $(this).addClass('down')
        }else {
            flage = true;
            siction1Box.css({'height':'218px'});
            $(this).removeClass('down')
        }

    })

    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('main'));
    // 视图2
    var myChart2 = echarts.init(document.getElementById('main2'));
    details.onsiteDelItemClick = function (logs_monitoring_id) {
        if($("#end_time").val() == '' || $("#start_time").val() =='' ){
            alert("查询日期填写完整");
            return;
        }
        var end_time =  $("#end_time").val();
        var start_time = $("#start_time").val();
        var token = sessionStorage.getItem("token");
        if(!token){
            clearSession();
            window.location.href = "/login";
            return;
        }
        if(!logs_monitoring_id){
            logs_monitoring_id = -1;
        }
        $.get('/v1/site-monitoring/search?site_id='+sitelist_id+"&logs_monitoring_id="+logs_monitoring_id+"&token="+token+"&start_time="+start_time+"&end_time="+end_time,function (result){
            console.log(result);
            if(result.result == true ){
                var yData = [];
                var xData = [];
                var yData1 = [];
                var xData1 = [];
                $.each(result.data, function (key, val) {
                    var logs_time = Date.parse(new Date(result.data[key].logs_time));
                    yData.push(result.data[key].logs_reptime);
                    xData.push(util.formateDate(logs_time));
                    yData1.push(result.data[key].logs_dnstime);
                    xData1.push(util.formateDate(logs_time));
                })
                option.xAxis[0].data= xData;
                option.series[0].data= yData;
                // option.legend.data= Dataname;
                // option.series[0].name= Dataname;
                // option2.legend.data= Dataname;
                // option2.series[0].name= Dataname;
                option2.xAxis[0].data= xData1;
                option2.series[0].data= yData1;
                // 使用刚指定的配置项和数据显示图表。
                myChart.setOption(option);
                //视图2
                myChart2.setOption(option2);
            } else if(!result.result && result.message == "token过期，重新登录!"){
                clearSession();
                window.location.href = "/login";
                return;
            } else {
                alert("网络暂时异常￣へ￣!");
                return;
            }

        });
    };
    console.log($('input:radio[name="address"]:checked').val());
    var MName = $('input:radio[name="address"]:checked').val();
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    $.get('/v1/site-monitoring/search?site_id='+sitelist_id+"&logs_monitoring_id="+MName+"&token="+token+"&start_time="+start_time+"&end_time="+end_time,function (result){
        console.log(result);
        if(result.result == true){
            var yData = [];
            var xData = [];
            var yData1 = [];
            var xData1 = [];
            $.each(result.data, function (key, val) {
                var logs_time = Date.parse(new Date(result.data[key].logs_time));
                yData.push(result.data[key].logs_reptime);
                xData.push(util.formateDate(logs_time));
                yData1.push(result.data[key].logs_dnstime);
                xData1.push(util.formateDate(logs_time));
            })
            option.xAxis[0].data= xData;
            option.series[0].data= yData;
            // option.legend.data= Dataname;
            // option.series[0].name= Dataname;
            // option2.legend.data= Dataname;
            // option2.series[0].name= Dataname;
            option2.xAxis[0].data= xData1;
            option2.series[0].data= yData1;
            // 使用刚指定的配置项和数据显示图表。
            myChart.setOption(option);
            //视图2
            myChart2.setOption(option2);
        } else if(!result.result && result.message == "token过期，重新登录!"){
            clearSession();
            window.location.href = "/login";
            return;
        } else {
            alert("网络暂时异常￣へ￣!");
            return;
        }
    });
    var option = {
        tooltip : {
            trigger: 'axis'
        },
        legend: {
            data:['']
        },
        toolbox: {
            show : true,
            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                restore : {show: true},
                saveAsImage : {show: true}
            }
        },
        calculable : true,
        xAxis : [
            {
                type : 'category',
                boundaryGap : false,
                data : ['06/02 16:13','06/02 16:18','06/02 16:23','06/02 17:23','06/02 18:20','06/02 19:23','06/02 20:23','06/02 21:15','06/02 22:15', '06/02 20:23','06/02 21:15','06/02 24:15']
            }
        ],
        yAxis : [
            {
                type : 'value',
                name: '毫秒'
            }
        ],
        dataZoom: [
            {
                type: 'slider',
                show: true,
                xAxisIndex: [0],
                minSpan: 15,
                start: 1,
                end: 50
            },

            {
                type: 'inside',
                xAxisIndex: [0],
                minSpan: 15,
                start: 1,
                end: 50
            }
        ],
        series : [
            {
                name:'',
                type:'line',
                stack: '总量',
                itemStyle : {
                    normal : {
                        color:'#429adc',
                        lineStyle:{
                            color:'#429adc'
                        }
                    }
                },
                data:[120, 132, 101, 134, 90, 230, 210, 310 , 220, 210, 310 , 620]
            }
        ]
    };
    //视图2
    var option2 = {
        tooltip : {
            trigger: 'axis'
        },
        legend: {
            data:['']
        },
        toolbox: {
            show : true,
            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                restore : {show: true},
                saveAsImage : {show: true}
            }
        },
        calculable : true,
        xAxis : [
            {
                type : 'category',
                boundaryGap : false,
                data : ['06/02 16:13','06/02 16:18','06/02 16:23','06/02 17:23','06/02 18:20','06/02 19:23','06/02 20:23','06/02 21:15','06/02 22:15', '06/02 20:23','06/02 21:15','06/02 24:15']
            }
        ],
        yAxis : [
            {
                type : 'value',
                name: '毫秒'
            }
        ],
        dataZoom: [
            {
                type: 'slider',
                show: true,
                xAxisIndex: [0],
                minSpan: 15,
                start: 1,
                end: 50
            },

            {
                type: 'inside',
                xAxisIndex: [0],
                minSpan: 15,
                start: 1,
                end: 50
            }
        ],
        series : [
            {
                name:'',
                type:'line',
                stack: '总量',
                itemStyle : {
                    normal : {
                        color:'#ff5900',
                        lineStyle:{
                            color:'#ff5900'
                        }
                    }
                },
                data:[120, 132, 101, 134, 90, 230, 210, 310 , 220, 210, 310 , 620]
            }
        ]
    };
    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
    //视图2
    myChart2.setOption(option2);
};

var util = {};

Date.prototype.format = function(format) {
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1
                ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
};

util.formateDate = function (timestamp) {
    var newDate = new Date();
    newDate.setTime(timestamp);

    return newDate.format('yyyy.MM.dd hh:mm');
};

util.formateDat = function (timestamp) {
    var newDate = new Date();
    newDate.setTime(timestamp);

    return newDate.format('yyyy-MM-dd hh:mm:ss');
};

details.rendsiteTime = function () {
    var t=new Date().getTime();
    console.log(util.formateDat(t));
    $("#end_time").val(util.formateDat(t));
    $("#start_time").val(util.formateDat(t- 86400000));
};

details.siteTable = function () {
    var idTmr;
    function  getExplorer() {
        var explorer = window.navigator.userAgent ;
        //ie
        if (explorer.indexOf("MSIE") >= 0) {
            return 'ie';
        }
        //firefox
        else if (explorer.indexOf("Firefox") >= 0) {
            return 'Firefox';
        }
        //Chrome
        else if(explorer.indexOf("Chrome") >= 0){
            return 'Chrome';
        }
        //Opera
        else if(explorer.indexOf("Opera") >= 0){
            return 'Opera';
        }
        //Safari
        else if(explorer.indexOf("Safari") >= 0){
            return 'Safari';
        }
    }
    details.method5 = function (tableid) {
        if(getExplorer()=='ie')
        {
            var curTbl = document.getElementById(tableid);
            var oXL = new ActiveXObject("Excel.Application");
            var oWB = oXL.Workbooks.Add();
            var xlsheet = oWB.Worksheets(1);
            var sel = document.body.createTextRange();
            sel.moveToElementText(curTbl);
            sel.select();
            sel.execCommand("Copy");
            xlsheet.Paste();
            oXL.Visible = true;

            try {
                var fname = oXL.Application.GetSaveAsFilename("Excel.xls", "Excel Spreadsheets (*.xls), *.xls");
            } catch (e) {
                print("Nested catch caught " + e);
            } finally {
                oWB.SaveAs(fname);
                oWB.Close(savechanges = false);
                oXL.Quit();
                oXL = null;
                idTmr = window.setInterval("Cleanup();", 1);
            }

        }
        else
        {
            tableToExcel(tableid)
        }
    }
    function Cleanup() {
        window.clearInterval(idTmr);
        CollectGarbage();
    }
    var tableToExcel = (function() {
        var uri = 'data:application/vnd.ms-excel;base64,',
            template = '<html><head><meta charset="UTF-8"></head><body><table>{table}</table></body></html>',
            base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) },
            format = function(s, c) {
                return s.replace(/{(\w+)}/g,
                    function(m, p) { return c[p]; }) };
        return function(table, name) {
            if (!table.nodeType) table = document.getElementById(table);
            var ctx = {worksheet: name || 'Worksheet', table: table.innerHTML};
            window.location.href = uri + base64(format(template, ctx));
        }
    })()
};

details.rendsiteTable = function () {
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    var end_time =  $("#end_time").val();
    var start_time = $("#start_time").val();
    var rendTable = '';
    var rendExistTable = "<tr align='center'> <td colspan='9' align='center'>"+start_time+","+end_time+"监控报表</td> </tr> <tr> <td colspan='4' align='center'>监测概况</td> <td colspan='3' align='center'>重点网页监测情况</td>"+
        "<td colspan='2' align='center'>DNS监测情况</td> </tr> <tr> <td align='center'>监控点</td> <td align='center'>发起测试次数</td> <td align='center'>平均响应时间(ms)</td> <td align='center'>平均DNS解析时间(ms)</td> <td align='center'>网页内容不符次数</td>"+
        "<td align='center'>网页内容不符原因分析</td> <td align='center'>网页报警高峰时段</td> <td>dns劫持次数</td> " +
        " <td align='center'>dns劫持高峰时段</td> </tr>";
    $("#tableExcel").html(rendTable);
    $.get('/v1/site/monitoring-table?sitelist_id='+sitelist_id+"&token="+token+"&start_time="+start_time+"&end_time="+end_time,function (result){
        console.log(result);
        if(result.result == true) {
            if (result.data.length > 0) {
                $("#tableExcel").append(rendExistTable);
                $.each(result.data, function (key, val) {
                    if(result.data[key].num_end !=0 && result.data[key].num_start !=0){
                        var num_start = util.formateDate(Date.parse(result.data[key].num_start));
                        var num_end = util.formateDate(Date.parse(result.data[key].num_end));
                        num_start  = new Date(num_start);
                        num_end  = new Date(num_end);
                        var time_details = (num_start.getTime()-num_end.getTime())/60000;
                        if(time_details == 0){
                         var num_details = 1;
                        } else {
                            var num_details = time_details/result.data[key].sitelist_time;
                        }
                    } else {
                        var num_details = result.data[key].sitemonitoringnum;
                    }
                    if(result.data[key].peak_rep_time_end == 0){
                        var peak_rep_time_end = 0;
                    } else {
                        var peak_rep_time_end = util.formateDate(Date.parse(result.data[key].peak_rep_time_end));
                    }
                    if(result.data[key].peak_rep_time_start == 0){
                        var peak_rep_time_start = 0;
                    } else {
                        var peak_rep_time_start = util.formateDate(Date.parse(result.data[key].peak_rep_time_start));
                    }
                    if(result.data[key].peak_dns_time_end == 0){
                        var peak_dns_time_end = 0;
                    } else {
                        var peak_dns_time_end = util.formateDate(Date.parse(result.data[key].peak_dns_time_end));
                    }
                    if(result.data[key].peak_dns_time_end == 0){
                        var peak_dns_time_start = 0;
                    } else {
                        var peak_dns_time_start = util.formateDate(Date.parse(result.data[key].peak_dns_time_start));
                    }
                    if(num_details == 0){
                        var vagreptime = 0;
                        var vagdnstime = 0;
                    } else {
                        var vagreptime = result.data[key].logs_reptime/num_details;
                        vagreptime = vagreptime.toFixed(2);
                        var vagdnstime = result.data[key].logs_dnstime/num_details;
                        vagdnstime = vagdnstime.toFixed(2);
                    }
                    rendTable = "<tr align='center'> <td>"+result.data[key].monitoring_name+"</td> <td>"+num_details+"</td> <td>"+vagreptime+"</td> <td>"+vagdnstime+"</td> <td>"+result.data[key].logs_status_html_err+"</td> <td>"+result.data[key].logs_status_html_err_true+"网站更新,"+result.data[key].logs_status_html_err_err+"内容不符</td> <td>"+peak_rep_time_end+"-"+peak_rep_time_start+"</td> <td>"+result.data[key].logs_status_dns_err+"</td> <td>"+peak_dns_time_end+"-"+peak_dns_time_start+"</td> </tr>";
                    $("#tableExcel").append(rendTable);
                });
            }
        } else if(!result.result && result.message == "token过期，重新登录!"){
            clearSession();
            window.location.href = "/login";
            return;
        } else {
            alert("网络暂时异常￣へ￣!");
            return;
        }
    });
};

$(function(){
    details.init();
});
