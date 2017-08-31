var xiugaisite = {};

xiugaisite.init = function () {
    xiugaisite.sitelist_time = 0;
    xiugaisite.bindEvent();
    xiugaisite.obeyIndex();
};

xiugaisite.bindEvent = function () {
    $("#headerUrlCreate").on('click',function () {
        window.location.href = "/";
    });
    $("#siteListCreate").on('click',function () {
        window.location.href = "/";
    });
    $("#determine").on('click',function () {
        console.log("xiugaisite.sitelist_time3:"+xiugaisite.sitelist_time);
        var token = sessionStorage.getItem("token");
        if(!token){
            clearSession();
            window.location.href = "/login";
            return;
        }
        var sitelist_time = '';
        if(xiugaisite.sitelist_time == 0){
            sitelist_time = 5;
        } else if(xiugaisite.sitelist_time == 1){
            sitelist_time = 10;
        } else if(xiugaisite.sitelist_time == 2){
            sitelist_time = 15;
        } else if(xiugaisite.sitelist_time == 3){
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
            sitelist_id: sitelist_id,
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
        $.post('/v1/sitelist/xiugai',param,function (result) {
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

xiugaisite.obeyIndex = function () {
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    $.get('/v1/sitelist/search?sitelist_id='+sitelist_id,function (result) {
        console.log(result);
        if(result.result == true) {
            $("#sitelist_name").val(result.data[0].sitelist_name);
            $("#sitelist_address").val(result.data[0].sitelist_address);
            $("#sitelist_choose").val(result.data[0].sitelist_choose);
            $("#sitelist_dns").val(result.data[0].sitelist_dns);
            $("#sitelist_ip").val(result.data[0].sitelist_ip);
            $("#cssTimeVal").val(result.data[0].sitelist_time);
            var checkeds_time = 0;
            if(result.data[0].sitelist_time == 5){
                checkeds_time = 0;
            } else if(result.data[0].sitelist_time == 10){
                checkeds_time = 1;
            } else if(result.data[0].sitelist_time == 15){
                checkeds_time = 2;
            } else if(result.data[0].sitelist_time == 20){
                checkeds_time = 3;
            }
            console.log(result.data[0].sitelist_time);
            xiugaisite.star(checkeds_time);
        } else if(!result.result && result.message == "token过期，重新登录!"){
            clearSession();
            window.location.href = "/login";
            return;
        } else {
            alert("网络暂时异常￣へ￣!");
            return;
        }
    });

    $.get('/v1/site/search-monitoring?sitelist_id='+sitelist_id,function (result) {
        var monitoringListHtml = '';
        $("#monitoringList").html(monitoringListHtml);
        console.log(result);
        if(result.result == true) {
            if (result.data.length > 0) {
                $.each(result.data, function (key, val) {
                    if(result.data[key].site_id == null){
                        monitoringListHtml = "<input type='checkbox' name='message' value="+result.data[key].monitoring_id+"><span>"+result.data[key].monitoring_name+"</span>";
                    } else {
                    monitoringListHtml = "<input type='checkbox' name='message' checked='checked' value="+result.data[key].monitoring_id+"><span>"+result.data[key].monitoring_name+"</span>";
                    }
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
xiugaisite.star = function (checkeds_time) {
    var tab = $('.tabBox li');
    tab.click(function () {
        var index = tab.index($(this));
        $(this).addClass('active').siblings().removeClass('active');
        xiugaisite.sitelist_time = index;
    });
    if(checkeds_time){
        tab.eq(checkeds_time).addClass('active').siblings().removeClass('active');
        xiugaisite.sitelist_time = checkeds_time;
    }
    // var checkeds = $('.checked input');
    // for(var i=0; i<checkeds.length;i++){
    //     $(checkeds[i]).attr('checked','checked')
    // }
};

$(function(){
    xiugaisite.init();
});
