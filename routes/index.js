var express = require('express');
var http = require('http');
var request = require("request");
var superagent = require('superagent'); 
var cheerio = require('cheerio');
var async = require('async');
var router = express.Router();
var dbhost = "hzzmdata.mysql.rds.aliyuncs.com";
var dbuser = "mm_root";
var dbdatabase = "mobile_monitor";
var dbpassword = "NBgiuDrKc9eXNjj0zllo";
// var dbhost = "127.0.0.1";
// var dbuser = "root";
// var dbdatabase = "mobile_monitor";
// var dbpassword = "";
var restport = 3000;
var redishost = "127.0.0.1";
var redisport = 6379;
var mysql = require('mysql');
var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : dbhost,
    user            : dbuser,
    password        : dbpassword,
    database        : dbdatabase
});

// Redis
var redis = require("redis");
var redisClient = redis.createClient({ host : redishost, port : redisport });
redisClient.on("error", function (err) {
    console.log("Redis connect with error " + err);
});

/**
 * 监控站点登陆
 * @param req
 * @param res
 */
router.get('/login', function(req, res, next) {
    res.render('login', { title: 'login' });
});


/**
 * 首页站点展示
 * @param req
 * @param res
 */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'site-monitoring' });
});

/**
 * 站点创建
 * @param req
 * @param res
 */
router.get('/create-site', function(req, res, next) {
    res.render('createsite', { title: 'site-create' });
});

/**
 * 详情页查看
 * @param req
 * @param res
 */
router.get('/site-details', function(req, res, next) {
    var sitelist_id = req.query.sitelist_id;
    res.render('details', { title: 'site-details' ,sitelist_id:sitelist_id});
});

/**
 * 监控点列表
 * @param req
 * @param res
 */
router.get('/monitoring-list', function(req, res, next) {
    res.render('monitoring', { title: 'monitoring-list'});
});

/**
 * 监控点创建
 * @param req
 * @param res
 */
router.get('/create-monitoring', function(req, res, next) {
    res.render('createmonitoring', { title: 'monitoring-list'});
});

/**
 * 单个错误监控点日志
 * @param req
 * @param res
 */
router.get('/single-errlogs', function(req, res, next) {
    var logs_monitoring_id = req.query.logs_monitoring_id;
    var sitelist_id = req.query.sitelist_id;
    var monitoring_id_name = req.query.monitoring_id_name;
    res.render('singleerrlogs', { title: 'single-errlogs'
        ,logs_monitoring_id:logs_monitoring_id
        ,sitelist_id:sitelist_id
        ,monitoring_id_name:monitoring_id_name});
});

/**
 * 错误监控点日志列表
 * @param req
 * @param res
 */
router.get('/more-errlogs', function(req, res, next) {
    var sitelist_id = req.query.sitelist_id;
    res.render('moreeerrlogs', { title: 'more-errlogs',sitelist_id:sitelist_id});
});

/**
 * 站点修改页面
 * @param req
 * @param res
 */
router.get('/site-xiugai', function(req, res, next) {
    var sitelist_id = req.query.sitelist_id;
    res.render('xiugaisite', { title: 'site-xiugai',sitelist_id:sitelist_id});
});

/**
 * 监控点登陆
 * @param req
 * @param res
 */
router.post('/v1/sitelist/login',function (req,res,next) {
    console.log("/v1/sitelist/login request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data: {}
    };
    var user_name = req.body.user_name;
    var user_password = req.body.user_password;
    var createIdSql = "select * from user where user_name='"+user_name+"' and user_password='"+user_password+"'";
    console.log(createIdSql);
    pool.query(createIdSql,  function(error, results, fields){
        if (error) {
            console.log("Database access error while retrieve operator!");
            retrieve_resp.result = false;
            retrieve_resp.message = "Internal Error!";
            res.send(retrieve_resp);
        } else {
            console.log(results.length);
            if(results.length == 0){
                retrieve_resp.result = false;
                retrieve_resp.message = "用户名或密码错误!";
                res.send(retrieve_resp);
            } else {
                var session_expiraton = 1800;
                var token =  require('crypto').randomBytes(16).toString('hex');
                var sessionContent = {
                    user_name : results[0].user_name,
                    user_id : results[0].user_id
                };
                redisClient.set(token,JSON.stringify(sessionContent));
                redisClient.expire(token,session_expiraton);
                retrieve_resp.data.user_id = results[0].user_id;
                retrieve_resp.data.user_name = results[0].user_name;
                retrieve_resp.data.token = token;
                console.log("登陆成功!");
                res.send( retrieve_resp );
            }
        }
    });
});

/**
 * 修改密码
 * @param req
 * @param res
 */
router.post('/v1/password/xiugai',function (req,res,next) {
    console.log("/v1/password/xiugai request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:{}
    };
    var oldpassword = req.body.oldpassword;
    var newpassword = req.body.newpassword;
    var user_id = req.body.user_id;
    var token = req.body.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            var createIdSql = "select * from user where user_id=" + user_id + " and user_password='" + oldpassword + "'";
            console.log(createIdSql);
            pool.query(createIdSql, function (error, results, fields) {
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log(results.length)
                    if (results.length == 0) {
                        retrieve_resp.result = false;
                        retrieve_resp.message = "密码错误";
                        res.send(retrieve_resp);
                    } else {
                        var updateSql = "update user set user_password='" + newpassword + "' where user_id=" + user_id;
                        console.log(updateSql);
                        pool.query(updateSql, function (error, results, fields) {
                            if (error) {
                                console.log("Database access error while retrieve operator!");
                                retrieve_resp.result = false;
                                retrieve_resp.message = "Internal Error!";
                                res.send(retrieve_resp);
                            } else {
                                console.log("密码修改成功");
                                res.send(retrieve_resp);
                            }
                        })
                    }

                }
            })
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    });
});



/**
 * 站点增加
 * @param req
 * @param res
 */
router.post('/v1/sitelist/add',function (req,res,next) {
    console.log("/v1/sitelist/add request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data: {}
    };
    var token = req.body.token;
    var siteUrl = req.body.sitelist_address;
    var sitelist_name = req.body.sitelist_name;
    var sitelist_address = req.body.sitelist_address;
    var sitelist_ip = req.body.sitelist_ip;
    var sitelist_choose = req.body.sitelist_choose;
    var sitelist_dns = req.body.sitelist_dns;
    var sitelist_time = req.body.sitelist_time;
    var sitelist_info = req.body.sitelist_info;
    var sitelist_monitoring_id = req.body.sitelist_monitoring_id;
    tokenValidation(token,function (result) {
        if (result != null) {
            async.waterfall([
                function (callback) {
                    // request(siteUrl, function(error, response, body) {
                    //     callback(null,body)
                    // });
                    var options = {
                        url: siteUrl,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
                        }
                    };

                    request(options,function (error, response, body) {
                        callback(null,body);
                    });
                },
                function (html,callback) {
                    var sitelist_html = html;
                    sitelist_html = sitelist_html.replace(/'/g,'&quot');
                    var createSql = "insert into sitelist (sitelist_name,sitelist_dns,sitelist_address,sitelist_ip,sitelist_choose,sitelist_time,sitelist_info,sitelist_html)";
                    createSql += " values ('"+sitelist_name+"','"+sitelist_dns+"','"+sitelist_address+"','"+sitelist_ip+"','"+sitelist_choose+"',"+sitelist_time+",'"+sitelist_info+"','"+sitelist_html+"')";
                    console.log(createSql);
                    pool.query(createSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(error);
                        } else {
                            console.log("站点新增成功");
                            callback(null)
                        }
                    });
                },
                function (callback) {
                    var createIdSql = "select max(sitelist_id) from sitelist";
                    console.log(createIdSql);
                    pool.query(createIdSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(error);
                        } else {
                            var siteId = results[0]['max(sitelist_id)'];
                            callback(null,siteId);
                        }
                    });
                },
                function (siteId,callback) {
                    console.log("siteId:"+siteId);
                    var site_id = siteId;
                    var monitoring_list_id = sitelist_monitoring_id.split("-");
                    var monitoring_listid = '';
                    var createSiteSql = "insert into sitemonitoring (site_id,monitoring_listid) values";
                    for(var i = 0; i < monitoring_list_id.length; i++){
                        if(i != monitoring_list_id.length-1){
                            createSiteSql += " ("+site_id+","+monitoring_list_id[i]+"),";
                        } else if(i == monitoring_list_id.length-1){
                            createSiteSql += " ("+site_id+","+monitoring_list_id[i]+")";
                        }

                    }
                    console.log(createSiteSql);
                    pool.query(createSiteSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(null,retrieve_resp);
                        } else {
                            console.log("站点-监控点对应关系新增成功");
                            callback(null,retrieve_resp);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    res.send(result);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});

/**
 * 站点更新
 * @param req
 * @param res
 */
router.post('/v1/sitelist/update',function (req,res,next) {
    console.log("/v1/sitelist/update request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data: {}
    };
    var sitelist_id = req.body.sitelist_id;
    var token = req.body.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            async.waterfall([
                function (callback) {
                    var updateSql = "select sitelist_address from sitelist where sitelist_id="+sitelist_id;
                    console.log(updateSql);
                    pool.query(updateSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(err);
                        } else {
                            console.log("站点查询成功");
                            var siteUrl = results[0].sitelist_address
                            callback(null,siteUrl);
                        }
                    });
                },
                function (siteUrl,callback) {
                    var options = {
                        url: siteUrl,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
                        }
                    };

                    request(options,function (error, response, body) {
                        callback(null,body);
                    });
                },
                function (html,callback) {
                    var sitelist_html = html;
                    sitelist_html = sitelist_html.replace(/'/g,'&quot');
                    var createSql = "update sitelist set sitelist_html='"+sitelist_html+"' where sitelist_id="+sitelist_id;
                    console.log(createSql);
                    pool.query(createSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(null,retrieve_resp);
                        } else {
                            console.log("站点新增成功");
                            callback(null,retrieve_resp);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    res.send(result);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});

/**
 * 站点修改
 * @param req
 * @param res
 */
router.post('/v1/sitelist/xiugai',function (req,res,next) {
    console.log("/v1/sitelist/xiugai request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data: {}
    };
    var token = req.body.token;
    var sitelist_id = req.body.sitelist_id;
    var siteUrl = req.body.sitelist_address;
    var sitelist_name = req.body.sitelist_name;
    var sitelist_address = req.body.sitelist_address;
    var sitelist_ip = req.body.sitelist_ip;
    var sitelist_choose = req.body.sitelist_choose;
    var sitelist_dns = req.body.sitelist_dns;
    var sitelist_time = req.body.sitelist_time;
    var sitelist_info = req.body.sitelist_info;
    var sitelist_monitoring_id = req.body.sitelist_monitoring_id;
    tokenValidation(token,function (result) {
        if (result != null) {
            async.waterfall([
                function (callback) {
                    request(siteUrl, function(error, response, body) {
                        callback(null,body)
                    });
                },
                function (html,callback) {
                    var sitelist_html = html;
                    sitelist_html = sitelist_html.replace(/'/g,'&quot');
                    var createSql = "update sitelist set sitelist_name='"+sitelist_name+"',sitelist_dns='"+sitelist_dns+"',sitelist_address='"+sitelist_address+"',sitelist_ip='"+sitelist_ip+"',sitelist_choose='"+sitelist_choose+"',sitelist_time='"+sitelist_time+"',sitelist_info='"+sitelist_info+"',sitelist_html='"+sitelist_html+"' where sitelist_id="+sitelist_id;
                    //console.log(createSql);
                    pool.query(createSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(error);
                        } else {
                            console.log("站点修改成功");
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var createIdSql = "delete from sitemonitoring where site_id="+sitelist_id;
                    console.log(createIdSql);
                    pool.query(createIdSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(error);
                        } else {
                            console.log("当修改站点时，站点对应的监控点删除");
                            callback(null)
                        }
                    });
                },
                function (callback) {
                    var monitoring_list_id = sitelist_monitoring_id.split("-");
                    var monitoring_listid = '';
                    var createSiteSql = "insert into sitemonitoring (site_id,monitoring_listid) values";
                    for(var i = 0; i < monitoring_list_id.length; i++){
                        if(i != monitoring_list_id.length-1){
                            createSiteSql += " ("+sitelist_id+","+monitoring_list_id[i]+"),";
                        } else if(i == monitoring_list_id.length-1){
                            createSiteSql += " ("+sitelist_id+","+monitoring_list_id[i]+")";
                        }

                    }
                    console.log(createSiteSql);
                    pool.query(createSiteSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(null,retrieve_resp);
                        } else {
                            console.log("站点-监控点对应关系修改后新增成功新增成功");
                            callback(null,retrieve_resp);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    res.send(result);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});

/**
 * 站点查询
 * @param req
 * @param res
 */
router.get('/v1/sitelist/search',function (req,res,next) {
    console.log("/v1/sitelist/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };

    var sitelist_id = req.query.sitelist_id;
    var sitelist_monitoring_id = req.query.sitelist_monitoring_id;
            var createSql = "select * from sitelist";
            if(sitelist_id && !sitelist_monitoring_id){
                createSql = "select * from sitelist where sitelist_id="+sitelist_id;
            }
            if(!sitelist_id && sitelist_monitoring_id){
                createSql = "select * from sitelist,sitemonitoring where sitelist.sitelist_id = sitemonitoring.site_id and monitoring_listid="+sitelist_monitoring_id;
            }
            if(sitelist_id && sitelist_monitoring_id ){
                createSql = "select * from sitelist,sitemonitoring where sitelist.sitelist_id = sitemonitoring.site_id and sitemonitoring.monitoring_listid="+sitelist_monitoring_id +" and sitemonitoring.site_id="+ sitelist_id ;
            }
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("站点查询成功");
                    results.forEach(function(item,index){
                        var dataItem = {};
                        dataItem.sitelist_id = item.sitelist_id;
                        dataItem.sitelist_name = item.sitelist_name;
                        dataItem.sitelist_address = item.sitelist_address;
                        dataItem.sitelist_ip = item.sitelist_ip;
                        dataItem.sitelist_choose = item.sitelist_choose;
                        dataItem.sitelist_dns = item.sitelist_dns;
                        dataItem.sitelist_time = item.sitelist_time;
                        dataItem.sitelist_info = item.sitelist_info;
                        dataItem.sitelist_html = item.sitelist_html;
                        retrieve_resp.data.push(dataItem);
                    });
                    res.send(retrieve_resp);
                }
            });
});

/**
 * 首页站点查询结合日志查询相应时间
 * @param req
 * @param res
 */
router.get('/v1/sitelist-logs/search',function (req,res,next) {
    console.log("/v1/sitelist-logs/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var token = req.query.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            //var createSql = "select a.sitelist_id,a.sitelist_name,a.sitelist_address,a.sitelist_choose,a.sitelist_time,a.monitoring_listid ,c.logs_reptime,c.logs_status,c.logs_process,c.logs_time from (select a.*,b.* from sitelist as a left join  sitemonitoring as b on a.sitelist_id = b.site_id) as a left join (select b.* from logs as b where b.logs_time > DATE_SUB(now(),INTERVAL 24 hour) ORDER BY b.logs_time DESC)as c on c.logs_site_id = a.sitelist_id and c.logs_monitoring_id = a.monitoring_listid  group by a.sitelist_id,a.monitoring_listid ";
            var createSql = "select a.sitelist_id,a.sitelist_name,a.sitelist_address,a.sitelist_choose,a.sitelist_time,b.logs_site_id,b.logs_monitoring_id,b.logs_reptime,b.logs_time,b.logs_process,b.logs_status from sitelist as a left join logs as b on a.sitelist_id=b.logs_site_id and b.logs_time > DATE_SUB(now(),INTERVAL 24 hour) ORDER BY b.logs_time DESC";
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("站点查询成功");
                    var existSiteList = [];
                    results.forEach(function(item,index){
                        if(existSiteList.indexOf(item.sitelist_id) == -1){
                            existSiteList.push(item.sitelist_id);
                            var dataItem = {};
                            dataItem = item;
                            if(item.logs_status != 0 && item.logs_process == 1){
                                dataItem.isNormal = "错误";
                            } else {
                                dataItem.isNormal = "正常";
                            }
                            retrieve_resp.data.push(dataItem);
                        } else {
                            var existSiteListWz = existSiteList.indexOf(item.sitelist_id);
                            if(retrieve_resp.data[existSiteListWz].isNormal == "正常"){
                                if(item.logs_status != 0 && item.logs_process == 1){
                                    retrieve_resp.data[existSiteListWz].isNormal = "错误";
                                } else {
                                    retrieve_resp.data[existSiteListWz].isNormal = "正常";
                                }
                            }
                        }
                    });
                    res.send(retrieve_resp);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    });
});

/**
 * 监控点增加
 * @param req
 * @param res
 */
router.post('/v1/monitoring/add',function (req,res,next) {
    console.log("/v1/monitoring/add request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var monitoring_name = req.body.monitoring_name
    var token = req.body.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            var createSql = "insert into monitoring (monitoring_name) values ('"+monitoring_name+"')";
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("监控点增加成功");
                    res.send(retrieve_resp);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});


/**
 * 监控点查询
 * @param req
 * @param res
 */
router.get('/v1/monitoring/search',function (req,res,next) {
    console.log("/v1/monitoring/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
            var createSql = "select * from monitoring ";
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("监控点查询成功");
                    results.forEach(function(item,index){
                        var dataItem = {};
                        dataItem.monitoring_id = item.monitoring_id;
                        dataItem.monitoring_name = item.monitoring_name;
                        dataItem.monitoring_info = item.monitoring_info;
                        retrieve_resp.data.push(dataItem);
                    });
                    res.send(retrieve_resp);
                }
            });
});

/**
 * 根据站点查询监控点
 * @param req
 * @param res
 */
router.get('/v1/site/search-monitoring',function (req,res,next) {
    console.log("/v1/site/search-monitoring request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var sitelist_id = req.query.sitelist_id;
    var createSql = "select a.*,b.* from sitemonitoring as a right join monitoring as b on a.monitoring_listid = b.monitoring_id and a.site_id="+sitelist_id;
    console.log(createSql);
    pool.query(createSql,  function(error, results, fields){
        if (error) {
            console.log("Database access error while retrieve operator!");
            retrieve_resp.result = false;
            retrieve_resp.message = "Internal Error!";
            res.send(retrieve_resp);
        } else {
            console.log("监控点查询成功");
            results.forEach(function(item,index){
                var dataItem = {};
                dataItem = item;
                retrieve_resp.data.push(dataItem);
            });
            res.send(retrieve_resp);
        }
    });
});


/**
 * 监控点删除
 * @param req
 * @param res
 */
router.post('/v1/monitoring/delmonitoring',function (req,res,next) {
    console.log("/v1/monitoring/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var monitoring_id = req.body.monitoring_id;
    var token = req.body.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            var createSql = "delete from monitoring where monitoring_id="+monitoring_id;
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("监控点删除成功");
                    res.send(retrieve_resp);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});


/**
 * 站点删除
 * @param req
 * @param res
 */
router.post('/v1/sitelist/sitedel',function (req,res,next) {
    console.log("/v1/sitelist/sitedel request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var sitelist_id = req.body.sitelist_id;
    var token = req.body.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            async.waterfall([
                function (callback) {
                    var createSql = "delete from sitelist where sitelist_id="+sitelist_id;
                    console.log(createSql);
                    pool.query(createSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(error);
                        } else {
                            console.log("站点删除成功");
                            callback(null)
                        }
                    });
                },
                function (callback) {
                    var createIdSql = "delete from sitemonitoring where site_id="+sitelist_id;
                    console.log(createIdSql);
                    pool.query(createIdSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(retrieve_resp);
                        } else {
                            console.log("当站点删除时，站点对应的监控点删除");
                            callback(retrieve_resp)
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    res.send(result);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});

/**
 * 升级查询版本号
 * @param req
 * @param res
 */
router.get('/v1/upgrade/search',function (req,res,next) {
    console.log("/v1/upgrade/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:{}
    };
    var createSql = "select * from upgrade";
    console.log(createSql);
    pool.query(createSql,  function(error, results, fields){
        if (error) {
            console.log("Database access error while retrieve operator!");
            retrieve_resp.result = false;
            retrieve_resp.message = "Internal Error!";
            res.send(retrieve_resp);
        } else {
            console.log("版本号查询成功");
            retrieve_resp.data.version_number = results[0].version_number;
            retrieve_resp.data.download_address = results[0].download_address;
            res.send(retrieve_resp);
        }
    });
});

/**
 * 根据站点查询监控点
 * @param req
 * @param res
 */
router.get('/v1/site/monitoring-search',function (req,res,next) {
    console.log("/v1/site/monitoring-search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var site_id = req.query.sitelist_id;
    var token = req.query.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            var createSql = "select a.*,b.* from logs as a right join (select a.*,b.* from sitemonitoring as a, monitoring as b where a.monitoring_listid = b.monitoring_id and a.site_id="+site_id+") as b on a.logs_site_id = b.site_id and a.logs_monitoring_id = b.monitoring_listid and a.logs_time > DATE_SUB(now(),INTERVAL 24 hour) ORDER BY a.logs_time DESC";
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("站点查询监控点");
                    var existMonitoring = [];
                    results.forEach(function(item,index){
                        if(existMonitoring.indexOf(item.monitoring_id) == -1){
                            existMonitoring.push(item.monitoring_id);
                            var dataItem = {};
                            dataItem = item;
                            retrieve_resp.data.push(dataItem);
                        } else {
                            var existSiteList = existMonitoring.indexOf(item.monitoring_id);
                            if(retrieve_resp.data[existSiteList].logs_status == 0 ||retrieve_resp.data[existSiteList].logs_process == 0){
                                if(item.logs_status != 0 && item.logs_process == 1){
                                    retrieve_resp.data[existSiteList]= item;
                                }
                            }
                        }
                    });
                    res.send(retrieve_resp);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});

/**
 * 根据站点制作表格
 * @param req
 * @param res
 */
router.get('/v1/site/monitoring-table',function (req,res,next) {
    console.log("/v1/site/monitoring-table request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var site_id = req.query.sitelist_id;
    var start_time = req.query.start_time;
    var end_time = req.query.end_time;
    var token = req.query.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            //var createSql = "select a.*,b.* from logs as a right join (select a.*,b.* from sitemonitoring as a, monitoring as b where a.monitoring_listid = b.monitoring_id and a.site_id="+site_id+") as b on a.logs_site_id = b.site_id and a.logs_monitoring_id = b.monitoring_listid and a.logs_time>=('"+start_time+"') and a.logs_time<=('"+end_time+"') ORDER BY a.logs_time DESC";
            var createSql = "select a.*,b.* from logs as a right join ( select c.*,b.sitelist_time from (select a.*,b.* from sitemonitoring as a, monitoring as b where a.monitoring_listid = b.monitoring_id and a.site_id="+site_id+") as c ,sitelist as b  where c.site_id=b.sitelist_id) as b on a.logs_site_id = b.site_id and a.logs_monitoring_id = b.monitoring_listid and a.logs_time>=('"+start_time+"') and a.logs_time<('"+end_time+"') ORDER BY a.logs_time DESC";
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("根据站点制作表格");
                    var existMonitoring = [];
                    results.forEach(function(item,index){
                        if(existMonitoring.indexOf(item.monitoring_id) == -1){
                            existMonitoring.push(item.monitoring_id);
                            var dataItem = {};
                            dataItem.logs_dnstime = Number(item.logs_dnstime);
                            dataItem.logs_reptime = Number(item.logs_reptime);
                            dataItem.peak =0;
                            dataItem.m =0;
                            dataItem.peak_rep_time_start =0;
                            dataItem.peak_rep_time_end =0;
                            dataItem.peak_start_time = 0;
                            dataItem.peak_end_time = 0;
                            dataItem.peak_dns =0;
                            dataItem.m_dns =0;
                            dataItem.peak_dns_time_start =0;
                            dataItem.peak_dns_time_end =0;
                            dataItem.peak_dns_start_time = 0;
                            dataItem.peak_dns_end_time = 0;
                            dataItem.logs_status_html_err_true = 0;
                            dataItem.logs_status_html_err_err = 0;
                            dataItem.sitelist_time = item.sitelist_time;
                            if(item.logs_status >= 2){
                                // var reg = new RegExp(item.sitelist_regex);
                                // var logs_res = item.logs_res;
                                if(item.logs_status == 3){
                                    dataItem.logs_status_html_err_true = 1;
                                } else {
                                    dataItem.logs_status_html_err_err = 1;
                                }
                                dataItem.logs_status_html_err = 1;
                                dataItem.peak = 1;
                                dataItem.peak_start_time = item.logs_time;
                                dataItem.peak_end_time = item.logs_time;
                                dataItem.peak_rep_time_start =item.logs_time;
                                dataItem.peak_rep_time_end =item.logs_time;
                                dataItem.m =1;
                            } else {
                                dataItem.logs_status_html_err = 0;
                            }
                            if(item.logs_status == 1){
                                dataItem.logs_status_dns_err = 1;
                                dataItem.peak_dns =1;
                                dataItem.m_dns =1;
                                dataItem.peak_dns_time_start =item.logs_time;
                                dataItem.peak_dns_time_end =item.logs_time;
                                dataItem.peak_dns_start_time = item.logs_time;
                                dataItem.peak_dns_end_time = item.logs_time;
                            } else {
                                dataItem.logs_status_dns_err = 0;
                            }
                            dataItem.logs_time = item.logs_time;
                            dataItem.monitoring_name = item.monitoring_name;
                            if(!dataItem.logs_time){
                                dataItem.sitemonitoringnum = 0;
                                dataItem.num_start = 0;
                                dataItem.num_end = 0;
                            } else {
                                dataItem.sitemonitoringnum = 1;
                                dataItem.num_start = item.logs_time;
                                dataItem.num_end = item.logs_time;
                            }
                            retrieve_resp.data.push(dataItem);
                        } else {
                            var existSiteList = existMonitoring.indexOf(item.monitoring_id);
                            if(item.logs_status >= 2){
                                if(item.logs_status == 3){
                                    retrieve_resp.data[existSiteList].logs_status_html_err_true ++;
                                } else {
                                    retrieve_resp.data[existSiteList].logs_status_html_err_err ++;
                                }
                                if(retrieve_resp.data[existSiteList].peak== 0){
                                    retrieve_resp.data[existSiteList].peak_start_time =item.logs_time;
                                }
                                retrieve_resp.data[existSiteList].logs_status_html_err ++;
                                retrieve_resp.data[existSiteList].peak ++;
                                retrieve_resp.data[existSiteList].peak_end_time =item.logs_time;
                                if(retrieve_resp.data[existSiteList].peak >= retrieve_resp.data[existSiteList].m){
                                    retrieve_resp.data[existSiteList].m = retrieve_resp.data[existSiteList].peak;
                                    retrieve_resp.data[existSiteList].peak_rep_time_start = retrieve_resp.data[existSiteList].peak_start_time;
                                    retrieve_resp.data[existSiteList].peak_rep_time_end = retrieve_resp.data[existSiteList].peak_end_time;
                                }
                            } else {
                                if(retrieve_resp.data[existSiteList].peak >= retrieve_resp.data[existSiteList].m){
                                    retrieve_resp.data[existSiteList].m = retrieve_resp.data[existSiteList].peak;
                                    retrieve_resp.data[existSiteList].peak_rep_time_start = retrieve_resp.data[existSiteList].peak_start_time;
                                    retrieve_resp.data[existSiteList].peak_rep_time_end = retrieve_resp.data[existSiteList].peak_end_time;
                                }
                                retrieve_resp.data[existSiteList].peak= 0;
                            }
                            if(item.logs_status == 1){
                                if(retrieve_resp.data[existSiteList].peak_dns== 0){
                                    retrieve_resp.data[existSiteList].peak_dns_start_time =item.logs_time;
                                }
                                retrieve_resp.data[existSiteList].logs_status_dns_err ++;
                                retrieve_resp.data[existSiteList].peak_dns ++;
                                retrieve_resp.data[existSiteList].peak_dns_end_time =item.logs_time;
                                if(retrieve_resp.data[existSiteList].peak_dns >= retrieve_resp.data[existSiteList].m_dns){
                                    retrieve_resp.data[existSiteList].m_dns = retrieve_resp.data[existSiteList].peak_dns;
                                    retrieve_resp.data[existSiteList].peak_dns_time_start = retrieve_resp.data[existSiteList].peak_dns_start_time;
                                    retrieve_resp.data[existSiteList].peak_dns_time_end = retrieve_resp.data[existSiteList].peak_dns_end_time;
                                }
                            } else {
                                if(retrieve_resp.data[existSiteList].peak_dns >= retrieve_resp.data[existSiteList].m_dns){
                                    retrieve_resp.data[existSiteList].m_dns = retrieve_resp.data[existSiteList].peak_dns;
                                    retrieve_resp.data[existSiteList].peak_dns_time_start = retrieve_resp.data[existSiteList].peak_dns_start_time;
                                    retrieve_resp.data[existSiteList].peak_dns_time_end = retrieve_resp.data[existSiteList].peak_dns_end_time;
                                }
                                retrieve_resp.data[existSiteList].peak_dns= 0;
                            }
                            // if(item.logs_status == 1){
                            //     retrieve_resp.data[existSiteList].logs_status_dns_err ++;
                            //
                            // } else {
                            //
                            // }
                            retrieve_resp.data[existSiteList].logs_dnstime = retrieve_resp.data[existSiteList].logs_dnstime + Number(item.logs_dnstime);
                            retrieve_resp.data[existSiteList].logs_reptime = retrieve_resp.data[existSiteList].logs_reptime + Number(item.logs_reptime);
                            retrieve_resp.data[existSiteList].sitemonitoringnum ++;
                            retrieve_resp.data[existSiteList].num_end = item.logs_time;
                        }
                    });
                    res.send(retrieve_resp);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});


/**
 * 根据站点和监控点查询时间
 * @param req
 * @param res
 */
router.get('/v1/site-monitoring/search',function (req,res,next) {
    console.log("/v1/site-monitoring/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var site_id = req.query.site_id;
    var logs_monitoring_id = req.query.logs_monitoring_id;
    var choosetime = req.query.choosetime;
    var start_time = req.query.start_time;
    var end_time = req.query.end_time;
    var token = req.query.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            var createSql = "SELECT logs_time,logs_monitoring_id,logs_dnstime,logs_reptime,logs_site_id from logs where logs_time>=('"+start_time+"') and logs_time<=('"+end_time+"') and logs_site_id ="+site_id+" and logs_monitoring_id ="+logs_monitoring_id;
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("站点查询监控点");
                    var existMonitoring = [];
                    results.forEach(function(item,index){
                            var dataItem = item;
                            retrieve_resp.data.push(dataItem);
                    });
                    res.send(retrieve_resp);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});

/**
 * 日志增加
 * @param req
 * @param res
 */
router.post('/v1/logs/add',function (req,res,next) {
    console.log("/v1/logs/add request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:[]
    };
    var logs_site_id = req.body.logs_site_id;
    var logs_monitoring_id = req.body.logs_monitoring_id;
    var logs_status = req.body.logs_status;
    var logs_res = req.body.logs_res;
    var logs_dnstime = req.body.logs_dnstime;
    var logs_reptime = req.body.logs_reptime;
    var logs_info = req.body.logs_info;
    var logs_process = 1;
    if(!logs_info){
        logs_info = '';
    }
    if(logs_status == 2){
        async.waterfall([
            function (callback) {
                var createSql = "select sitelist_address,sitelist_regex from sitelist where sitelist_id="+logs_site_id;
                console.log(createSql);
                pool.query(createSql,  function(error, results, fields){
                    if (error) {
                        console.log("Database access error while retrieve operator!");
                        retrieve_resp.result = false;
                        retrieve_resp.message = "Internal Error!";
                        callback(error);
                    } else {
                        console.log("正则查询成功");
                        var reg = new RegExp(results[0].sitelist_regex);
                        var siteAddress = results[0].sitelist_address;
                        if(reg.test(logs_res)){
                            logs_status = 3;
                            logs_process = 0;
                            callback(null,logs_status,logs_process,siteAddress)
                        } else {
                            siteAddress = "error_res";
                            callback(null,logs_status,logs_process,siteAddress)
                        }
                    }
                });
            },
            function (logs_status,logs_process,siteAddress,callback) {
                if(!logs_res){
                    logs_res = '';
                } else {
                    logs_res = logs_res.replace(/'/g,'&quot');
                }
                var createSql = "insert into logs (logs_site_id,logs_monitoring_id,logs_status,logs_res,logs_dnstime,logs_reptime,logs_info,logs_process)";
                createSql += " values ("+logs_site_id+",'"+logs_monitoring_id+"','"+logs_status+"','"+logs_res+"','"+logs_dnstime+"','"+logs_reptime+"','"+logs_info+"','"+logs_process+"')";
                console.log(createSql);
                pool.query(createSql,  function(error, results, fields){
                    if (error) {
                        console.log("Database access error while retrieve operator!");
                        retrieve_resp.result = false;
                        retrieve_resp.message = "Internal Error!";
                        callback(retrieve_resp);
                    } else {
                        console.log("错误是分析日志上报成功");
                        callback(null,siteAddress);
                    }
                });
            },
            function (siteAddress,callback) {
                if(siteAddress == "error_res"){
                    console.log("确实错误不需要更新");
                    callback(siteAddress);
                } else {
                var options = {
                    url: siteAddress,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
                    }
                };

                request(options,function (error, response, body) {
                    callback(null,body);
                });
            }
            },
            function (html,callback) {
                var sitelist_html = html;
                sitelist_html = sitelist_html.replace(/'/g,'&quot');
                var createSql = "update sitelist set sitelist_html='"+sitelist_html+"' where sitelist_id="+logs_site_id;
                console.log(createSql);
                pool.query(createSql,  function(error, results, fields){
                    if (error) {
                        console.log("Database access error while retrieve operator!");
                        retrieve_resp.result = false;
                        retrieve_resp.message = "Internal Error!";
                        callback(null,retrieve_resp);
                    } else {
                        console.log("站点确实需要更新了更新成功");
                        callback(null,retrieve_resp);
                    }
                });
            }
        ], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);
            }
        });
    } else {
        if(!logs_res){
            logs_res = '';
        } else {
            logs_res = logs_res.replace(/'/g,'&quot');
        }
        var createSql = "insert into logs (logs_site_id,logs_monitoring_id,logs_status,logs_res,logs_dnstime,logs_reptime,logs_info)";
            createSql += " values ("+logs_site_id+",'"+logs_monitoring_id+"','"+logs_status+"','"+logs_res+"','"+logs_dnstime+"','"+logs_reptime+"','"+logs_info+"')";
            console.log(createSql);
            pool.query(createSql,  function(error, results, fields){
                if (error) {
                    console.log("Database access error while retrieve operator!");
                    retrieve_resp.result = false;
                    retrieve_resp.message = "Internal Error!";
                    res.send(retrieve_resp);
                } else {
                    console.log("平时没错日志上报成功");
                    res.send(retrieve_resp);
                }
            });
        }
});

/**
 * 单个错误日志查询
 * @param req
 * @param res
 */
router.get('/v1/singleerrlogs/search',function (req,res,next) {
    console.log("/v1/singleerrlogs/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data: []
    };
    var sitelist_id = req.query.sitelist_id;
    var logs_monitoring_id = req.query.logs_monitoring_id;
    var monitoring_id_name = req.query.monitoring_id_name;
    console.log(monitoring_id_name);
    var token = req.query.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            async.waterfall([
                function (callback) {
                    var createSql = "select a.sitelist_id,a.sitelist_name,a.sitelist_address,b.logs_id,b.logs_status,b.logs_res,b.logs_process,b.logs_time from sitelist as a ,logs as b where a.sitelist_id=b.logs_site_id and b.logs_status>0 and b.logs_site_id="+sitelist_id +" and b.logs_monitoring_id="+logs_monitoring_id +" and b.logs_time > DATE_SUB(now(),INTERVAL 24 hour) ORDER BY b.logs_time DESC";
                    console.log(createSql);
                    pool.query(createSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(err);
                        } else {
                            console.log("单个日志错误查询成功");
                            results.forEach(function(item,index){
                                var lastSiteLogs={};
                                lastSiteLogs.sitelist_id = item.sitelist_id;
                                lastSiteLogs.sitelist_name = item.sitelist_name;
                                lastSiteLogs.sitelist_address = item.sitelist_address;
                                lastSiteLogs.logs_id = item.logs_id;
                                lastSiteLogs.logs_status = item.logs_status;
                                lastSiteLogs.logs_res = item.logs_res;
                                lastSiteLogs.logs_process = item.logs_process;
                                lastSiteLogs.logs_time = item.logs_time;
                                lastSiteLogs.monitoring_id_name = monitoring_id_name;
                                retrieve_resp.data.push(lastSiteLogs);
                            });
                            callback(null,retrieve_resp.data);
                        }
                    });
                },
                function (lastSiteLogs,callback) {
                    var siteLogs = lastSiteLogs[0];
                    // var logs_monitoringg_id = logs_monitoring_id;
                    // var sitelistt_id = sitelist_id;
                    // console.log(logs_monitoringg_id);
                    // console.log(sitelistt_id);
                    var updateSql = "update logs set logs_process='0' where logs_monitoring_id="+logs_monitoring_id+" and logs_site_id="+sitelist_id;
                    console.log(updateSql);
                    pool.query(updateSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(null,retrieve_resp);
                        } else {
                            console.log("日志查看后更新状态成功");
                            callback(null,retrieve_resp);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    res.send(result);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});

/**
 * 比较网页错误时
 * @param req
 * @param res
 */
router.get('/v1/errlogshtml/search',function (req,res,next) {
    console.log("/v1/errlogshtml/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data: []
    };
    var logs_id = req.query.logs_id;
    var token = req.query.token;
    tokenValidation(token,function (result) {
        if (result != null) {
                    var createSql = "select a.sitelist_html,b.logs_res from sitelist as a ,logs as b where a.sitelist_id=b.logs_site_id and b.logs_id="+logs_id;
                    console.log(createSql);
                    pool.query(createSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            res.send( retrieve_resp );
                        } else {
                            console.log("单个日志错误查询成功");
                            results.forEach(function(item,index){
                                var lastSiteLogs={};
                                lastSiteLogs.logs_res = item.logs_res;
                                lastSiteLogs.logs_id = item.logs_id;
                                lastSiteLogs.sitelist_html = item.sitelist_html;
                                retrieve_resp.data.push(lastSiteLogs);
                            });
                            res.send( retrieve_resp );
                        }
                    });

        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});


/**
 * 错误日志列表
 * @param req
 * @param res
 */
router.get('/v1/moreerrlogs/search',function (req,res,next) {
    console.log("/v1/moreerrlogs/search request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data: []
    };
    var sitelist_id = req.query.sitelist_id;
    var token = req.query.token;
    tokenValidation(token,function (result) {
        if (result != null) {
            async.waterfall([
                function (callback) {
                    var createSql = "select d.*,c.* from monitoring as d,(select a.sitelist_id,a.sitelist_name,a.sitelist_address,b.logs_id,b.logs_status,b.logs_res,b.logs_process,b.logs_monitoring_id,b.logs_time from sitelist as a ,logs as b where a.sitelist_id=b.logs_site_id and b.logs_site_id="+sitelist_id +" and b.logs_status>0 ORDER BY b.logs_time DESC) as c where c.logs_monitoring_id=d.monitoring_id";
                    //select c.*,d.logs_time from (select a.*,b.* from sitemonitoring as a,monitoring as b where a.monitoring_listid=b.monitoring_id and a.site_id=54) as c ,logs as d where  c.site_id=d.logs_site_id and c.monitoring_id = d.logs_monitoring_id and d.logs_site_id=54 and d.logs_status<>0 and d.logs_time > DATE_SUB(now(),INTERVAL 24 hour) ORDER BY d.logs_time DESC;
                    console.log(createSql);
                    pool.query(createSql,  function(error, results, fields){
                        if (error) {
                            console.log("Database access error while retrieve operator!");
                            retrieve_resp.result = false;
                            retrieve_resp.message = "Internal Error!";
                            callback(error);
                        } else {
                            console.log("日志错误列表查询成功");
                            var everyMoring = [];
                            results.forEach(function(item,index){
                                var lastSiteLogs={};
                                if(everyMoring.indexOf(item.logs_monitoring_id) == -1){
                                    everyMoring.push(item.logs_monitoring_id);
                                    lastSiteLogs.sitelist_id = item.sitelist_id;
                                    lastSiteLogs.sitelist_name = item.sitelist_name;
                                    lastSiteLogs.sitelist_address = item.sitelist_address;
                                    lastSiteLogs.logs_id = item.logs_id;
                                    lastSiteLogs.logs_status = item.logs_status;
                                    lastSiteLogs.logs_res = item.logs_res;
                                    lastSiteLogs.logs_process = item.logs_process;
                                    lastSiteLogs.monitoring_name = item.monitoring_name;
                                    lastSiteLogs.logs_monitoring_id = item.logs_monitoring_id;
                                    lastSiteLogs.logs_time = item.logs_time;
                                    lastSiteLogs.err_num = 1;
                                    retrieve_resp.data.push(lastSiteLogs);
                                } else {
                                    var num = everyMoring.indexOf(item.logs_monitoring_id);
                                    retrieve_resp.data[num].err_num++;
                                }

                            });

                            callback(null,retrieve_resp);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    res.send(result);
                }
            });
        } else {
            retrieve_resp.result = false;
            retrieve_resp.message = "token过期，重新登录!";
            console.log("token过期!");
            res.send( retrieve_resp );
        }
    })
});

/**
 * 点击异常被全部处理
 * @param req
 * @param res
 */
router.get('/v1/total/more',function (req,res,next) {
    console.log("/v1/total/more request received!");
    var retrieve_resp = {
        result: true,
        message: "ok",
        data:{}
    };
    var logs_site_id = req.query.sitelist_id;
    var updateSql = "update logs set logs_process='0' where logs_site_id="+logs_site_id;
    console.log(updateSql);
    pool.query(updateSql,  function(error, results, fields){
        if (error) {
            console.log("Database access error while retrieve operator!");
            retrieve_resp.result = false;
            retrieve_resp.message = "Internal Error!";
            res.send(retrieve_resp);
        } else {
            console.log("异常被全部处理");
            res.send(retrieve_resp);
        }
    });
});

//校验token
function tokenValidation( token, cb )
{
    redisClient.get( token, function(err,reply) {
        if( err || reply === null ) {
            cb(null);
        } else {
            redisClient.expire(token, 1800);
            cb(reply);
        }
    });
}

module.exports = router;
