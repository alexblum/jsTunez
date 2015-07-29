var Datastore = require('nedb');

module.exports = function(app){
    app.db = {};
    app.db.songs = new Datastore({ filename: __dirname + '/dbs/songs.db', autoload: true });
};
