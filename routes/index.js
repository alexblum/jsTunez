var lib_func = require(__dirname + '/../library_functions.js');
var Player = require('player');

var app = null;
var player = null;
var status = null;
var queue = [];

exports.createRoutes = function (app_ref) {
  app = app_ref;

  lib_func.setApp(app);

  app.get('/scan', function (req, res) {
    lib_func.scanLibrary(false);
    res.send('ok');
  });
  app.get('/hard_scan', function (req, res) {
    lib_func.scanLibrary(true);
    res.send('ok');
  });
  app.get('/stop_scan', function (req, res) {
    lib_func.stopScan();
    res.send('ok');
  });

  app.get('/player/:cmd', commandPlayer);

  app.get('/song/:id', getSong);
  app.get('/song/', findRandomSongs);
  app.get('/song/search/:query', findSongs);

  app.get('/queue/list', listQueue);
  app.get('/queue/add/:id', addToQueue);
  app.get('/queue/remove/:id', removeFromQueue);

};

function commandPlayer(req, res) {
  var cmd = req.params.cmd;
  if (cmd === 'start') {
    startDeamon();
    res.send('player started');
  } else if (cmd === 'stop') {
    stopDeamon();
    res.send('player stopped');
  } else if (cmd === 'status') {
    res.send(status);
  } else if (cmd === 'skip') {
    nextSong();
    res.send('song skipped');
  } else {
    res.status(404).send('command not found');
  }
}

function getSong(req, res) {
  app.db.songs.findOne({_id: req.params.id}, function (err, song) {
    if (err || !song) {
      res.status(404).send('song not found');
    } else {
      res.send(song);
    }
  });
}

function findSongs(req, res) {
  var re = new RegExp('.*' + req.params.query + '.*', 'i');
  app.db.songs.find({$or: [{title: {$regex: re}}, {album: {$regex: re}}, {display_artist: {$regex: re}}]}, function (err, songs) {
    if (err || !songs) {
      res.status(404).send('song not found');
    } else {
      res.send(songs);
    }
  });
}

function findRandomSongs(req, res) {
  _findRandomSong(req.query.count, function (err, song) {
    if (err) {
      res.status(404).send('song not found');
    } else {
      res.send(song);
    }
  });
}

function _findRandomSong(amount, callback) {
  app.db.songs.count({}, function (err, count) {
    if (err) {
      return callback(err);
    }

    app.db.songs.find({}, function (err, songs) {
      if (err) {
        return callback(err);
      }

      var fetchAmount = amount || 1;
      var result = [];
      while (result.length < fetchAmount || result.length == count) {
        var rnd = Math.floor(Math.random() * count);
        result.push(songs[rnd]);
        songs.splice(rnd, 1);
      }
      return callback(null, result);
    });
  });
}


function startDeamon() {
  _fetchNextSong(function (err, song) {
    if (err) {
      status = 'error';
      return err;
    }

    player = new Player([].concat(song));
    player.on('playing', function (item) {
      console.log('im playing... src:' + item.src);
    }).on('playend', function(item){
      nextSong(true);
    });

    player.play();

    status = 'started';
  });
}

function stopDeamon() {
  if (!player) {
    return;
  }

  player.stop();
  status = 'stopped';
}

function nextSong(val) {
  if (!player) {
    return;
  }

  _fetchNextSong(function (err, song) {
    if (err) {
      status = 'error';
      return err;
    }

    player.add(song[0] || song);
    if (!val) {
      player.next();
    }
  });
}

function listQueue(req, res) {
  res.send(queue);
}

function addToQueue(req, res) {
  app.db.songs.findOne({_id: req.params.id}, function (err, song) {
    if (err || !song) {
      res.status(404).send('song not found');
    } else {
      removeFromQueue(req);
      queue.push(song);
      res.send('added to queue: ' + song.src);
    }
  });
}

function removeFromQueue(req, res) {
  var song_src = '';
  for (var i = queue.length - 1; i >= 0; i--) {
    if (queue[i]._id === req.params.id) {
      song_src = queue[i].src;
      queue.splice(i, 1);
    }
  }
  if (res) {
    res.send('remove from queue: ' + song_src);
  }
}

function _fetchNextSong(callback) {
  if (queue.length > 0) {
    return callback(null, queue.shift());
  }

  _findRandomSong(1, function (err, songs) {
    if (err) {
      status = 'error';
      return callback(err);
    }
    return callback(null, songs);
  });

}