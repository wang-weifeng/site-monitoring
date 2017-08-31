var createmonitoring = {};

createmonitoring.init = function () {
    createmonitoring.bindEvent();
};

createmonitoring.bindEvent = function () {
    $("#canBackMonitoringList").on('click',function () {
        window.location.href = "/monitoring-list";
    });
    $("#headerUrlCreate").on('click',function () {
        window.location.href = "/";
    });
    $("#createdetermine").on('click',function () {
        var token = sessionStorage.getItem("token");
        if(!token){
            clearSession();
            window.location.href = "/login";
            return;
        }
        var monitoring_name = $("#monitoring_name").val();
        if(!monitoring_name){
            alert("必填项填写完整");
            return;
        }
        var param = {
            monitoring_name: monitoring_name,
            token:token
        };
        $.post('/v1/monitoring/add',param,function (result) {
            if(result.result == true){
                window.location.href = '/monitoring-list';
            } else if(!result.result && result.message == "token过期，重新登录!"){
                clearSession();
                window.location.href = "/login";
                return;
            } else {
                alert("网络暂时异常￣へ￣!");
                return;
            }
        });
    });
};

$(function(){
    createmonitoring.init();
});
