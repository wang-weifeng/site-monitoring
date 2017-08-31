var login = {};

login.init = function () {
    login.bindEvent();
};

login.bindEvent = function () {
    // $("#headerUrlCreate").on('click',function () {
    //     window.location.href = "/";
    // });
    $("#loginDetermine").on('click',function () {
        var user_name = $("#login_name").val();
        var user_password = $("#login_password").val();
        if(!user_name || !user_password ){
            alert("账号密码填写完整");
            return;
        }
        var param = {
            user_name: user_name,
            user_password: user_password
        };
        $.post('/v1/sitelist/login',param,function (result) {
            if(result.result == true){
                setSession(result.data);
                window.location.href = '/';
            } else if(!result.result && result.message == "用户名或密码错误!"){
                alert("用户名或密码错误!");
                return;
            } else {
                alert("网络暂时异常￣へ￣!");
                return;
            }
        });
    });
};

$(function(){
    login.init();
});
