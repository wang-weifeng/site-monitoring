var moreeerrlogs = {};

moreeerrlogs.init = function () {
    moreeerrlogs.bindEvent();
    moreeerrlogs.rendererrlogs();
};

moreeerrlogs.bindEvent = function () {
    $("#backUrlSiteS").on('click',function () {
        window.location.href = "/";
    });
    $("#totalCl").on('click',function () {
        $.get('/v1/total/more?sitelist_id='+sitelist_id,function (result) {
            if(result.result == true) {
                alert("异常全部被处理");
            }
        })
    });
};

moreeerrlogs.rendererrlogs = function () {
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    var errLogsListHtml = '';
    $("#renderErrLogs").html(errLogsListHtml);
    $.get('/v1/moreerrlogs/search?sitelist_id='+sitelist_id+"&token="+token,function (result) {
        console.log(result);
        if(result.result == true) {
            if(result.data.length > 0){
                $.each(result.data, function (key, val) {
                    if(result.data[key].logs_status == 1){
                        var logs_status = 'dns解析错误';
                    } else if(result.data[key].logs_status == 2){
                        var logs_status = '网页内容不符合';
                    } else if(result.data[key].logs_status == 2){
                        var logs_status = '网站更新';
                    }
                    if(result.data[key].logs_time){
                        var logs_time = Date.parse(new Date(result.data[key].logs_time));
                    }
                    if(result.data[key].logs_process == 1){
                        var logs_process = '未处理';
                    } else if(result.data[key].logs_process == 0){
                        var logs_process = '已处理';
                    }
                    errLogsListHtml = "<tr><td>"+result.data[key].monitoring_name+"</td> <td>"+result.data[key].sitelist_name+"</td> <td style='width: 295px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;display: inline-block'>"+result.data[key].sitelist_address+"</td> <td>"+result.data[key].err_num+"</td> <td style='cursor: pointer;' onClick=moreeerrlogs.onLogsErrorItemClick(" + result.data[key].logs_monitoring_id + ",'" + result.data[key].monitoring_name + "')>详情</td> </tr>";
                    $("#renderErrLogs").append(errLogsListHtml);
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

moreeerrlogs.onLogsErrorItemClick = function (logs_monitoring_id,monitoring_id_name) {
    console.log(monitoring_id_name);
    window.location.href = '/single-errlogs?logs_monitoring_id='+logs_monitoring_id+"&sitelist_id="+sitelist_id+"&monitoring_id_name="+monitoring_id_name;
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

    return newDate.format('yyyy.MM.dd h:m:s');
};

$(function(){
    moreeerrlogs.init();
});
