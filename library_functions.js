var fs = require('fs');
var path = require('path');
var mm = require('musicmetadata');
var util = require(path.join(__dirname, 'util.js'));

var running = false;
var hard_rescan = false;
var app = null;
var cnt = 0;
var song_list = [];
var now_milli = 0;
var song_extentions = ['mp3'];

// must be called before anything else
exports.setApp = function(appRef) {
  app = appRef;
};

// scan the library
exports.scanLibrary = function(hard) {
  hard_rescan = hard;
  now_milli = Date.now();
  running = true;
  util.walk(app.get('config').music_dir, function(filePath, stat) {
    var ext = '';
    if(filePath.lastIndexOf('.') > 0) {
      ext = filePath.substr(filePath.lastIndexOf('.')+1, filePath.length);
    }
    if (util.contains(song_extentions, ext)) {
      console.log(filePath);
      song_list.push(filePath);
    }
  });
  console.log('found songs: ' + song_list.length);

  clearNotIn(song_list);

  console.log('start import...');
  findNextSong();
};

exports.stopScan = function(app){
  running = false;
};

function findNextSong(){
  if(cnt < song_list.length && running){
    console.log("parsing " + song_list[cnt]);
    findSong(song_list[cnt], function(err){
      if(err){
        console.log({error: err, file: song_list[cnt]});
      }
      console.log("parsed");
      cnt++;
      setTimeout(findNextSong, 0);
    });
  } else {
    console.log("finished!");
    //broadcast("scan_update", {type: "finish", count: song_list.length, completed: song_list.length, details: "Finished"});
    // run check for any missing durations in 5 seconds (in case there are a few still running)
    setTimeout(checkDurationMissing, 5000);
    // reset for next scan
    cnt = 0;
    song_list = [];
    running = false;
  }
}

function findSong(location, callback){
  app.db.songs.findOne({src: location}, function(err, doc){
    // only scan if we haven't scanned before, or we are scanning every document again
    if(doc === null || hard_rescan){
      var parser = new mm(fs.createReadStream(location), function(err, result){
        var rel_location = location.replace(app.get('config').music_dir, '');
        var fallback_title = rel_location.substr(rel_location.lastIndexOf(path.sep) + 1, rel_location.lastIndexOf('.') + 1);
        var fallback_artist = rel_location.substr(rel_location.lastIndexOf(path.sep) + 1, rel_location.length);
        var song = null;
        if(err) {
          console.log("Could not find metadata. Adding the song by filename - " + location);
          song = {
              title: fallback_title,
              album: "Unknown (no tags)",
              artist: fallback_artist,
              albumartist: "Unknown (no tags)",
              display_artist: "Unknown (no tags)",
              genre: "Unknown",
              year: "Unknown",
              duration: -1,
              play_count: (doc === null) ? 0 : doc.play_count || 0,
              location: rel_location,
              src: location,
              date_added: now_milli,
              date_modified: now_milli
            };
        } else {
          song = {
            title: (!result.title || result.title.trim() === '') ? fallback_title : result.title,
            album: result.album,
            artist: (!result.artist) ? fallback_artist : result.artist,
            albumartist: result.albumartist,
            genre: result.genre,
            year: result.year,
            duration: -1,
            play_count: (doc === null) ? 0 : doc.play_count || 0,
            location: rel_location,
            src: location,
            date_added: now_milli,
            date_modified: now_milli
          };
          song.display_artist = normaliseArtist(song.albumartist, song.artist);
        }

        if (hard_rescan && doc) {
          if(doc.date_added){
            song.date_added = doc.date_added;
          }
        }

        app.db.songs.update({src: location}, song, {upsert:true}, function(err, numRplaced, newDoc){
          var id = newDoc ? newDoc._id : doc._id;
          duration_fetch(location, id);
          callback(err ? err : null);
        });

      });
    }
  });
}

function duration_fetch(path, id){
  // use musicmetadata with duration flag to fetch duration
  var parser = new mm(fs.createReadStream(path), { duration: true }, function(err, result){
    if(!err){
      app.db.songs.update({ _id: id }, { $set: { duration: result.duration} });
    }
  });
}

function checkDurationMissing(){
  app.db.songs.find({duration: -1}, function(err, docs){
    console.log(docs);
    for(var i in docs){
      duration_fetch(docs[i].location, docs[i]._id);
    }
  });
}

// clear all the songs with `location` not in the dbs
function clearNotIn(list){
  app.db.songs.remove({src: { $nin: list }}, {multi: true}, function(err, numRemoved){
    console.log(numRemoved + " tracks deleted");
  });
}

function normaliseArtist(albumartist, artist){
  if(typeof(albumartist) != 'string'){
    if(albumartist.length === 0){
      albumartist = '';
    } else {
      albumartist = albumartist.join('/');
    }
  }
  if(typeof(artist) != 'string'){
    if(artist.length === 0){
      artist = '';
    } else {
      artist = artist.join('/');
    }
  }
  return (artist.length > albumartist.length) ? artist : albumartist;
}
