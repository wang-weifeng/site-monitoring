var createsite = {};

createsite.init = function () {
    createsite.sitelist_time = 0;
    createsite.bindEvent();
    createsite.star();
    createsite.rendermonitoringList();
};

createsite.bindEvent = function () {
    $("#headerUrlCreate").on('click',function () {
        window.location.href = "/";
    });
    $("#siteListCreate").on('click',function () {
        window.location.href = "/";
    });
    $("#determine").on('click',function () {
        console.log(createsite.sitelist_time);
        var token = sessionStorage.getItem("token");
        if(!token){
            clearSession();
            window.location.href = "/login";
            return;
        }
        var sitelist_time = '';
        if(createsite.sitelist_time == 0){
           sitelist_time = 5;
        } else if(createsite.sitelist_time == 1){
            sitelist_time = 10;
        } else if(createsite.sitelist_time == 2){
            sitelist_time = 15;
        } else if(createsite.sitelist_time == 3){
            sitelist_time = 20;
        }
        var sitelist_monitoring_id = $("input:checkbox[name='message']:checked").map(function(index,elem) {
            return $(elem).val();
        }).get().join('-');
        var sitelist_name = $("#sitelist_name").val();
        var sitelist_address = $("#sitelist_address").val();
        var sitelist_ip = $("#sitelist_ip").val();
        var sitelist_choose = $("#sitelist_choose").val();
        var sitelist_dns = $("#sitelist_dns").val();
        var sitelist_info = $("#sitelist_info").val();
        if(!sitelist_dns || !sitelist_name || !sitelist_address || !sitelist_ip || !sitelist_time ||!sitelist_monitoring_id){
            alert("必填项填写完整");
            return;
        }
        if(checkUrl(sitelist_address)){
            alert("请填写正确的网址，如https://www.baidu.com");
            return;
        }
        if(!sitelist_info){
            sitelist_info = '';
        }
        var param = {
            sitelist_name: sitelist_name,
            sitelist_address: sitelist_address,
            sitelist_ip: sitelist_ip,
            sitelist_choose: sitelist_choose,
            sitelist_dns: sitelist_dns,
            sitelist_time: sitelist_time,
            sitelist_info: sitelist_info,
            sitelist_monitoring_id:sitelist_monitoring_id,
            token:token
        };
        $.post('/v1/sitelist/add',param,function (result) {
            if(result.result == true){
                window.location.href = '/';
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

function checkUrl(urlString) {
    if (urlString != "") {
        var reg = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
        if (!reg.test(urlString)) {
            return true;
        } else {
            return false;
        }
    }
}

createsite.rendermonitoringList = function () {
    var monitoringListHtml = '';
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    $("#monitoringList").html(monitoringListHtml);
    $.get('/v1/monitoring/search?token='+token,function (result) {
        console.log(result);
        if(result.result == true) {
            if (result.data.length > 0) {
                $.each(result.data, function (key, val) {
                    monitoringListHtml = "<input type='checkbox' name='message' checked='checked' value="+result.data[key].monitoring_id+"><span>"+result.data[key].monitoring_name+"</span>";
                    $("#monitoringList").append(monitoringListHtml);
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

// 创建http监控任务
createsite.star = function () {
    var tab = $('.tabBox li');
    tab.click(function () {
        var index = tab.index($(this));
        $(this).addClass('active').siblings().removeClass('active');
        createsite.sitelist_time = index;
    });
    var checkeds = $('.checked input');
    for(var i=0; i<checkeds.length;i++){
        $(checkeds[i]).attr('checked','checked')
    }
};

$(function(){
    createsite.init();
});
