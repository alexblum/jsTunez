var lib_func = require(__dirname + '/../library_functions.js');

var app = null;

exports.createRoutes = function(app_ref) {
  app = app_ref;

  lib_func.setApp(app);

  app.get('/scan', function(req, res){ lib_func.scanLibrary(false); res.send('ok');});
  app.get('/hard_scan', function(req, res){ lib_func.scanLibrary(true); res.send('ok');});
  app.get('/stop_scan', function(req, res){ lib_func.stopScan(); res.send('ok');});

  app.get('/deamon/:cmd', commandDeamon);

  app.get('/song/:id', getSong);
  app.get('/song/', findRandomSongs);
  app.get('/song/search/:query', findSongs)

};

function commandDeamon(req, res) {
  var cmd = req.params.cmd;
  if (cmd === 'start') {

  } else if (cmd === 'stop') {

  } else {
    res.status(404).send('command not found');
  }
}

function getSong(req, res) {
  app.db.songs.findOne({_id: req.params.id}, function(err, song){
    if (err || !song) {
      res.status(404).send('song not found');
    } else {
      res.send(song);
    }
  });
}

function findSongs(req, res) {
  var re = new RegExp('.*' + req.params.query + '.*', 'i');
  app.db.songs.find({$or: [{title : {$regex: re}},{album : {$regex: re}},{display_artist : {$regex: re}}]}, function(err, songs){
    if (err || !songs) {
      res.status(404).send('song not found');
    } else {
      res.send(songs);
    }
  });
}

function findRandomSongs(req, res) {
  app.db.songs.count({}, function(err, count){
    if (err) {
      res.status(404).send('song not found');
    } else {
      app.db.songs.find({}, function(err, songs){
        if (err) {
          res.status(404).send('song not found');
        } else {
          var amount = req.query.count || 1;
          var result = [];
          while(result.length < amount || result.length == count) {
            var rnd = Math.floor(Math.random() * count);
            result.push(songs[rnd]);
            songs.splice(rnd, 1);
          }
          res.send(result);
        }
      });
    }
  });
}
