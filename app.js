var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
var log4js = require('log4js');
log4js.configure({

    appenders: [
        {
            type: 'console'

        }, //控制台输出
        {
            type: "dateFile",
            filename: ''+__dirname+'/console-logs/',
            pattern: "yyyyMMddhh.txt",
            alwaysIncludePattern: true,
            maxLogSize: 20480,
            category: 'console'

        }//日期文件格式
    ],
    replaceConsole: true,   //替换console.log
    levels:{
        console: 'debug'
    }
});


var consoleLog = log4js.getLogger('console');

app.use(log4js.connectLogger(consoleLog, {level:'INFO', format:':method :url'}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
