function setSession(loginResp){
    sessionStorage.setItem("token", loginResp.token);
    sessionStorage.setItem("user_name", loginResp.user_name);
    sessionStorage.setItem("user_id", loginResp.user_id);
}

function clearSession(){
    sessionStorage.clear();
}

function getCurToken(){
    return sessionStorage.getItem("token");
}
