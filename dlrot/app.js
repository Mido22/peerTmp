var Browser = require('zombie')
  , browser = new Browser()
  , http = require('http')
  , fs = require('fs')
  , divWord = '?title=[kat.cr]'
  , saveLocation='dl/'
  , selector = 'a[data-download]'
  //, url = 'http://kat.cr/user/YIFY/uploads/?page='
  , url = 'http://kickass.unblocked.la/user/YIFY/uploads/?page='
  , promise = Promise.resolve()
  , i = 1
  , max=3
;

function save(node){
  var url = node.attributes.href._nodeValue;
  return new Promise((r, r1) =>{
    var file, request, fl = saveLocation + url.split(divWord)[1] + '.torrent', ul = 'http:' + url.split(divWord)[0];    
    request = http.get(ul, function(response) {
      file = fs.createWriteStream(fl);
      response.pipe(file);
      r();
    });
  });
}

function visit(url){
  return new Promise( (r, re) => {
    console.log('trying: ', url);
    browser.visit(url, err =>{
      if(err) return re(err);
      r();
    });
  }).then(onSite);
}

function fe(e){ console.error(e); }

function fs(s){ console.log('all done...'); process.exit(); }

function onSite(){ return Promise.all(browser.body.querySelectorAll(selector)._toArray().map(save));  }

function chain(i){
  promise = promise 
    .then(() => console.log('trying page no: ', i))
    .then(() => {return visit(url+i)})
    .then(() => console.log('finished ', i, 'out of ', max-1, ' ...'))
    .then(() => t(2000))
  ;  
}

function t(s){return new Promise(r=>setTimeout(r, s || 5000))}

while(i<max)  chain(i++);
promise.catch(fe).then(fs);