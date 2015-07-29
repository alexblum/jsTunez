var lib_func = require(__dirname + '/../library_functions.js');

var app = null;

exports.createRoutes = function(app_ref) {
  app = app_ref;

  lib_func.setApp(app);

  app.get('/scan', function(req, res){ lib_func.scanLibrary(false); res.send('ok');});
  app.get('/hard_scan', function(req, res){ lib_func.scanLibrary(true); res.send('ok');});
  app.get('/stop_scan', function(req, res){ lib_func.stopScan(); res.send('ok');});

};

