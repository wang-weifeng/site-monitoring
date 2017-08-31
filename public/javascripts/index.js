var index = {};

index.init = function () {
    index.bindEvent();
    index.renderSite();
};

index.bindEvent = function () {
    $("#addSite").on('click',function () {
        window.location.href = "/create-site";
    });
    $("#headerUrl").on('click',function () {
        window.location.href = "/";
    });
    $("#addMonring").on('click',function () {
        window.location.href = "/monitoring-list";
    });
    $("#XGpass").on('click',function () {
        $("#xGpassword").show();
        $("#test_tc").show();
    });
    $("#quxiao").on('click',function () {
        $("#old_password").val('');
        $("#new_password").val('');
        $("#xGpassword").hide();
        $("#test_tc").hide();
    });
    $("#determineXigai").on('click',function () {
        var token = sessionStorage.getItem("token");
        var user_id = sessionStorage.getItem("user_id");
        if(!token){
            clearSession();
            window.location.href = "/login";
            return;
        }
        var oldpassword = $("#old_password").val();
        var newpassword = $("#new_password").val();
        var param = {oldpassword:oldpassword,newpassword:newpassword,user_id:user_id,token:token};
        $.post('/v1/password/xiugai',param,function (result) {
            if(result.result == true){
                alert("密码修改成功!");
                $("#old_password").val('');
                $("#new_password").val('');
                $("#xGpassword").hide();
                $("#test_tc").hide();
            } else if(!result.result && result.message == "token过期，重新登录!"){
                clearSession();
                window.location.href = "/login";
                return;
            } else if(!result.result && result.message == "密码错误"){
                alert("密码错误!");
            } else{
                alert("网络暂时异常￣へ￣!");
                return;
            }
        })
    });
};

index.renderSite = function () {
    var siteListHtml = '';
    $("#renderSiteList").html(siteListHtml);
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    $.get('/v1/sitelist-logs/search?token='+token,function (result) {
        console.log(result);
        if(result.result == true) {
            if (result.data.length > 0) {
                $.each(result.data, function (key, val) {
                    if(!result.data[key].logs_reptime){
                        result.data[key].logs_reptime = '';
                    }
                    var sitelist_add = result.data[key].sitelist_address.slice(0,109);
                    if(result.data[key].isNormal == '正常'){
                        siteListHtml = "<tr><td class='index_font_size1' style='cursor: pointer;' onClick=index.onsiteDetailsItemClick(" + result.data[key].sitelist_id + ")>" + result.data[key].sitelist_name + "</td><td class='index_font_size'>" + sitelist_add + "</td> " +
                            "<td>HTTP</td> <td>" + result.data[key].sitelist_time + "<span>(min)</span></td> <td> " +
                            " <div style='color: #163eff'><span id='"+result.data[key].sitelist_id+"'>"+result.data[key].isNormal+"<span></div> </td> <td> " +
                            " </a> <a class='icon-box' onClick=index.onsiteUpdItemClick(" + result.data[key].sitelist_id + ")> <i class='icon icon-write'></i> <span >更新</span> </a> " +
                            " </a> <a class='icon-box' onClick=index.onsiteXigaiItemClick(" + result.data[key].sitelist_id + ")> <i class='icon icon-write'></i> <span >修改</span> </a> " +
                            "<a class='icon-box'  onClick=index.onsiteDelItemClick(" + result.data[key].sitelist_id + ")> <i class='icon icon-del'></i> <span >删除</span> </a> </td> </tr>";
                    } else {
                        siteListHtml = "<tr><td class='index_font_size1' style='cursor: pointer;' onClick=index.onsiteDetailsItemClick(" + result.data[key].sitelist_id + ")>" + result.data[key].sitelist_name + "</td><td class='index_font_size'>" + sitelist_add + "</td> " +
                            "<td>HTTP</td> <td>" + result.data[key].sitelist_time + "<span>(min)</span></td> <td> " +
                            " <div style='color: red'><span id='"+result.data[key].sitelist_id+"'>"+result.data[key].isNormal+"<span></div> </td> <td> " +
                            " </a> <a class='icon-box' onClick=index.onsiteUpdItemClick(" + result.data[key].sitelist_id + ")> <i class='icon icon-write'></i> <span >更新</span> </a> " +
                            " </a> <a class='icon-box' onClick=index.onsiteXigaiItemClick(" + result.data[key].sitelist_id + ")> <i class='icon icon-write'></i> <span >修改</span> </a> " +
                            "<a class='icon-box'  onClick=index.onsiteDelItemClick(" + result.data[key].sitelist_id + ")> <i class='icon icon-del'></i> <span >删除</span> </a> </td> </tr>";
                    }
                    $("#renderSiteList").append(siteListHtml);
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

index.onsiteDelItemClick = function (sitelist_id) {
    console.log(sitelist_id);
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    var param = {sitelist_id:sitelist_id,token:token};
    $.post('/v1/sitelist/sitedel',param,function (result) {
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

index.onsiteUpdItemClick = function (sitelist_id) {
    console.log(sitelist_id);
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
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

index.onsiteXigaiItemClick = function (sitelist_id) {
    console.log(sitelist_id);
    var token = sessionStorage.getItem("token");
    if(!token){
        clearSession();
        window.location.href = "/login";
        return;
    }
    window.location.href = '/site-xiugai?sitelist_id='+sitelist_id;
};

index.onsiteDetailsItemClick = function (sitelist_id) {
    console.log(sitelist_id);
    window.location.href = '/site-details?sitelist_id='+sitelist_id;
};

$(function(){
    index.init();
});
