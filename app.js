var express = require('express');
var path = require('path');
var mkdirp = require('mkdirp');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// make sure the dbs directory is present
mkdirp(__dirname + '/dbs/covers', function(){
  // attach the db to the app
  require(__dirname + '/db.js')(app);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('config', require(__dirname + '/config')(app));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

require(__dirname + '/routes').createRoutes(app);

module.exports = app;
