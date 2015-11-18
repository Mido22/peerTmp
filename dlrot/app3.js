var saveLocation='dl/'
  , fs = require('fs')
;



function rename(path) {
    /*var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
    fs.mkdirSync(path);*/
    var i=0;
    fs.readdirSync(path).forEach( file => {
      if(file.indexOf(' ')> -1){
        fs.renameSync(path+file, path+file.replace(' ', ''));
        i++;
        console.log(i);
      }
    });


    /*
    var p;
    if( fs.existsSync(path) ) {
      p = path.split('/');
      if(p[p.length-1].length){
        p[p.length-1] = p[p.length-1] + Math.floor(10000*Math.random());
      }else{
        p[p.length-2] = p[p.length-2] + Math.floor(10000*Math.random());
      }      
      fs.renameSync(path, p.join('/'));
    }
    fs.mkdirSync(path);*/
};
rename(saveLocation)