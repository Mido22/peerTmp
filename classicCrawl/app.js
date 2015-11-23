var Crawler = require("crawler")
  , Datastore = require('nedb')
  , host ='https://en.wikipedia.org'
  , maxLevel = 13
  , dbFile = './db.json'
  , db = new Datastore({filename: dbFile})
  , crawler
  , count = 0
  , pageCount = 0
;

db.loadDatabase(e=> console.log('db started...', e));

function insert(link, name, nextTime){
  db.update({_id:link}, {_id:link, name: name, next: !!nextTime}, {upsert: true}, e => {
    if(e) return console.error(e);
    count++;
    console.log(name, 'data count: ', count);
  });
}



//https://github.com/sylvinus/node-crawler

crawler = new Crawler({
  maxConnections : 13,
  rateLimits : 13,
  skipDuplicates: true
});

function enQueue(link, level){
  if(level>maxLevel)  return insert(link, undefined, true);
  crawler.queue([{
    uri: host+link,
    callback: (err, res, $)=>{
      pageCount+=1;
      console.log('pageCount: ', pageCount);
      level = level+1;
      $('a').each((i, v)=>{
        switch(classifyLink(v.attribs.href)){
          case 'file': insert(v.attribs.href, v.attribs.title);break;
          case 'next': enQueue(v.attribs.href, level);break;
          case 'fileLink': enQueueFileLink(v.attribs.href);break;
          default: break;
        }  
      });      
    }
  }]);
}

function enQueueFileLink(link){
  crawler.queue([{
    uri: host+link,
    callback: (err, res, $)=>{
      pageCount+=1;
      console.log('pageCount: ', pageCount);
      $('a').each((i, v)=>{
        if(classifyLink(v.attribs.href)==='file')  insert(v.attribs.href, v.attribs.name);
      });
    }
  }]);  
}

function classifyLink(link){
  if(!link || !link.indexOf('#'))  return 'ignore';
  if(!link.indexOf('//upload.wikimedia.org')){
    var ext = /\.([^\.]*)$/.exec(link)[1].toLowerCase();
    if(!ext)  return 'ignore';
    if(['ogg', 'oga', 'mp3', 'wav', 'm4a', 'opus', 'aac', 'wma', 'aiff', 'webm'].indexOf(ext)>-1) return 'file';
    return 'ignore';
  }
  if(link.indexOf('File:')>-1)  return 'fileLink';
  if(!link.indexOf('/wiki/')) return 'next';
  return 'ignore';
}

enQueue('/wiki/Catalogues_of_classical_compositions', 0);
