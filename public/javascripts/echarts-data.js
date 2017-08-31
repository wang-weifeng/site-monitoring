/**
 * Created by lina on 2017/6/8.
 */
$(function () {
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
    var details = {};
    details.onsiteDelItemClick = function (logs_monitoring_id) {
        console.log(logs_monitoring_id);
        $.get('/v1/site-monitoring/search?site_id='+sitelist_id+"&logs_monitoring_id="+logs_monitoring_id,function (result){

        });
    };

    var option = {
        tooltip : {
            trigger: 'axis'
        },
        legend: {
            data:['全网均值']
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
                name: '秒(s)'
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
                name:'全网均值',
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
            data:['全网均值']
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
                name:'全网均值',
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

})