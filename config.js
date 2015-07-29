module.exports = function(app, callback){
  return new Config(app);
};

function Config(app){
    this.music_dir = '/mp3/';
}