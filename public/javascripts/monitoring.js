var monitoring = {};

monitoring.init = function () {
    monitoring.bindEvent();
    monitoring.renderMonitoring();
};

monitoring.bindEvent = function () {
    $("#canIndexUrl").on('click',function () {
        window.location.href = "/";
    });
    $("#canBackIndex").on('click',function () {
        window.location.href = "/";
    });
    $("#createMonitorings").on('click',function () {
        window.location.href = "/create-monitoring";
    });
};

monitoring.renderMonitoring = function () {
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    var monitoringListHtml = '';
    $("#renserMonitoringListHtml").html(monitoringListHtml);
    $.get('/v1/monitoring/search?token='+token,function (result) {
        console.log(result);
        if(result.result == true) {
            if (result.data.length > 0) {
                $.each(result.data, function (key, val) {
                    monitoringListHtml = "<tr><td>"+result.data[key].monitoring_id+"</td><td>"+result.data[key].monitoring_name+"</td><td>"+result.data[key].monitoring_info+"</td> <td> <a class='icon-box' onClick=monitoring.onmonitoringDelItemClick(" + result.data[key].monitoring_id + ")> <i class='icon icon-del'></i> <span >删除</span> </a> </td></tr>";
                    $("#renserMonitoringListHtml").append(monitoringListHtml);
                });
            } else if(!result.result && result.message == "token过期，重新登录!"){
                clearSession();
                window.location.href = "/login";
                return;
            } else {
                alert("网络暂时异常￣へ￣!");
                return;
            }
        }
    });
};

monitoring.onmonitoringDelItemClick = function (monitoring_id) {
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    console.log(monitoring_id);
    var param = {monitoring_id:monitoring_id,token:token};
    $.post('/v1/monitoring/delmonitoring',param,function (result) {
        if(result.result == true){
            monitoring.renderMonitoring();
        } else if(!result.result && result.message == "token过期，重新登录!"){
            clearSession();
            window.location.href = "/login";
            return;
        } else {
            alert("网络暂时异常￣へ￣!");
            return;
        }
    })
};

monitoring.onsiteUpdItemClick = function (sitelist_id) {
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    console.log(sitelist_id);
    var param = {sitelist_id:sitelist_id,token:token};
    $.post('/v1/sitelist/update',param,function (result) {
        if(result.result == true){
            index.renderSite();
        } else if(!result.result && result.message == "token过期，重新登录!"){
            clearSession();
            window.location.href = "/login";
            return;
        } else {
            alert("网络暂时异常￣へ￣!");
            return;
        }
    })
};

monitoring.onsiteDetailsItemClick = function (sitelist_id) {
    console.log(sitelist_id);
    window.location.href = '/site-details?sitelist_id='+sitelist_id;
};

$(function(){
    monitoring.init();
});
