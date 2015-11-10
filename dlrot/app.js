var Browser = require('zombie')
  , browser = new Browser()
  , http = require('http')
  , fs = require('fs')
  , divWord = '?title=[kat.cr]'
  , saveLocation='dl/'
  , selector = 'a[data-download]'
  , url = 'https://kat.cr/user/YIFY/uploads/'
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
    browser.visit(url, err =>{
      if(err) return re(err);
      r();
    });
  });
}

function fe(e){
  console.error(e);
}

function fs(s){
  console.log(s);
}

function onSite(s){
  console.log("page loaded... ");
  var promises = browser.body.querySelectorAll(selector)._toArray().map(save);  
  Promise.all(promises).catch(fe).then(()=> {
    console.log('done... ');
    process.exit();
  });
}


visit(url).then(onSite).catch(fe);