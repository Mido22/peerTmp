

var fs = require('fs')
  , path = require('path');

function getSize(dirPath){      
  return getStat(dirPath).then(function(stat){  
    if(stat.isFile()){  // if file return size directly
      return stat.size;
    }else{
      return getFiles(dirPath).then(function(files){    // getting list of inner files
        var promises = files.map(function(file){
          return path.join(dirPath, file);  
        }).map(getSize);    // recursively getting size of each file
        return Promise.all(promises);   
      }).then(function(childElementSizes){  // success callback once all the promise are fullfiled i. e size is collected 
          var dirSize = 0;
          childElementSizes.forEach(function(size){ // iterate through array and sum
              dirSize+=size;
          });
          return dirSize;
      });
    }    
  });
}

// promisified get stats method
function getStat(filePath){
  return new Promise(function(resolve, reject){
    fs.lstat(filePath, function(err, stat){
      if(err) return reject(err);
      resolve(stat);
    });
  });
}

// promisified get files method
function getFiles(dir){
  return new Promise(function(resolve, reject){
    fs.readdir(dir, function(err, stat){
      if(err) return reject(err);
      resolve(stat);
    });
  });  
}

// example usage
getSize('example dir').then(function(size){
    console.log('dir size: ', size);
}).catch(console.error.bind(console));