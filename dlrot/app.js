var Browser = require('zombie');
Browser.ignoreDroppedRequests = true;
Browser.waitDuration = '5s';
var browser = new Browser({waitDuration: 5*1000})
  , http = require('http')
  , fs = require('fs')
  , divWord = '?title=[kat.cr]'
  , saveLocation='dl/'
  , selector = 'a[data-download]'
  //, url = 'http://kat.cr/user/YIFY/uploads/?page='
  , url = 'https://kickass.unblocked.la/user/YIFY/uploads/?page='
  , promise = Promise.resolve()
  , i = 118
  , max=243
  , counter = 0
  , errFile = 'err.txt'
;

fs.appendFile(errFile, '\n\n\n new \n', fd);

deleteFolderRecursive(saveLocation);


function save(node){
  var url = node.attributes.href._nodeValue;
  return (new Promise((r, r1) =>{
    var file, fl = saveLocation + url.split(divWord)[1] + '.torrent', ul = 'http:' + url.split(divWord)[0];    
    http.get(ul, function(response) {
      clearTimeout(t);
      file = fs.createWriteStream(fl);
      response.pipe(file);
      r();
    }).on('error', r1);  
    var t = setTimeout(r1, 10000);
  })).catch(e => {fs.appendFile(errFile, url+' \n', fd);console.error(url, e)});
}

function visit(url){
  return new Promise( (r, re) => {
    console.log('trying: ', url);
    browser.visit(url, {
                          runScripts: false,
                          loadCSS: false,
                          silent: false,
                          headers: {
                            bot: true
                          }
      },  err => {
        console.log('gpt errpr: ...', err);
      //if(err) return re(err);
      r();
    });
  }).then(onSite);
}

function fe(e){ fd(e); process.exit();}
function fd(e){ if(e) console.error(e)}


function fs(s){ console.log('all done...'); process.exit(); }

function onSite(){ 
  var p = Promise.resolve();

  function fn(url){
    p=p
      //.then(()=> t(500))
      .then( () => save(url))
      .then(() => {counter++;console.log('counter: ', counter)});
  }

  browser.body.querySelectorAll(selector)._toArray().forEach(fn);
  p.catch(fd);
  return p; 
 }

function chain(i){
  promise = promise 
    .then(() => console.log('trying page no: ', i))
    .then(() => visit(url+i))
    .catch(fd)
    .then(() => console.log('finished ', i, 'out of ', max, ' ...'))
    .then(() => t(5000))
  ;  
}

function t(s){return new Promise(r=>setTimeout(r, s))}

while(i<=max)  chain(i++);
promise.catch(fe).then(fs);




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