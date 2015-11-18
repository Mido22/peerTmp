var http = require('http')
  , fs = require('fs')
  , divWord = '?title=[kat.cr]'
  , saveLocation='dl2/'
  , promise = Promise.resolve()
  , counter = 0
  , srcFile = 'missing13.txt'
  , errFile = 'missing14.txt'
;

fs.appendFile(errFile, '\n\n\n new \n', fd);

deleteFolderRecursive(saveLocation);


function save(url, i){
  return (new Promise((r, r1) =>{
    var file, fl = saveLocation + url.split(divWord)[1] + '.torrent', ul = 'http:' + url.split(divWord)[0];    
    http.get(ul, function(response) {
      clearTimeout(t);
      file = fs.createWriteStream(fl);
      response.pipe(file);
      r();
    }).on('error', r1);  
    var t = setTimeout(r1, 3000);
  })).catch(e => {fs.appendFile(errFile, url+' \n', fd);console.error(i, url, e)});
}

function fe(e){ fd(e); process.exit();}
function fd(e){ if(e) console.error(e)}


function fs(s){ console.log('all done...'); process.exit(); }

function chain(url, i){
  promise = promise 
    .then(() => {if(url.length>6) save(url, i)})
    .catch(fd)
    .then(() => t(1000))
  ;  
}

function t(s){return new Promise(r=>setTimeout(r, s))}

promise.then(()=>{
  fs.readFileSync(srcFile, 'utf8').split('\n').forEach(chain);  
}).catch(fe).then(fs);




function deleteFolderRecursive(path) {
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
    fs.mkdirSync(path);
};