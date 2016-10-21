var fs = require('fs');
var path = require('path');

// walk the file tree
var walk = function (currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach(function(name) {
    var filePath = path.join(currentDirPath, name);
    if (path.existsSync(filePath)) {
      var stat = fs.statSync(filePath);
      if (stat.isFile()) {
        callback(filePath, stat);
      } else if (stat.isDirectory()) {
        //walk(filePath, callback);
      }
    }
  });
};
exports.walk = walk;

var shuffle = function(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
exports.shuffle = shuffle;

var contains = function(a, obj){
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}
exports.contains = contains;
