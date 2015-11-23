var Crawler = require("crawler");
//https://github.com/sylvinus/node-crawler

var c = new Crawler({
  maxConnections : 31,
  rateLimits : 31,
  skipDuplicates: true,
  // This will be called for each crawled page
  callback : function (error, result, $) {
    // $ is Cheerio by default
    //a lean implementation of core jQuery designed specifically for the server
    /*$('a').each(function(index, a) {
      var toQueueUrl = $(a).attr('href');
      c.queue(toQueueUrl);
    });*/
    console.log('got results...');
    var a=[];
    $('a').each((i, v)=> a.push(v));
    console.log(a.slice(0, 4));
    process.exit(0);
  }
});

function enQueue(link, level){
  c.queue([{
    uri: link,
    callback: (err, res, $)=>{
      
    }
  }]);
}

c.queue('https://en.wikipedia.org/wiki/Catalogues_of_classical_compositions');
