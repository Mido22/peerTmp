var CronJob = require('cron').CronJob
  , fs = require('fs')
  , open = require('open')
  , srcDir='/media/Genji/documents/dl/'
  , cp1='/media/Genji/documents/dl/o/'
  , cp2='/media/Genji/documents/dl/o/downloading/'
  , textFile = '/media/Genji/documents/dl/o/searchTerm.txt'
  , urls = [
    ['https://thepiratebay.vg/search/', '/0/8/0'],
    ['https://kat.cr/usearch/', '%20category%3Amovies/?field=seeders&sorder=desc']
  ]
  , pb = 'firefox' //prefferedBrowser
;


function cronFn(){
  fs.readFile(textFile, 'utf8', (e, s)=>{
    if(e) return console.error(e);
    if(!(s && s.length))  return;
    fs.writeFileSync(textFile, '', 'utf8');
    s.split('\n').forEach(term=>{
      if(!term) return;
      term = term.trim().replace(' ', '%20');
      if(!term.length)  return;
      urls.forEach(u=>{
        open(u[0]+term+u[1]);
      });
    })
  });
}

function cronFn2(){
  fs.readdir(srcDir, (e, files)=>{
    if(e) return console.error(e);
    files.forEach(f=>{
      if(f.indexOf('.torrent')<0) return;
      if(!fs.lstatSync(srcDir+f).isFile()) return;
      fs.createReadStream(srcDir+f).pipe(fs.createWriteStream(cp1+f));
      setTimeout(()=>{
        fs.rename(srcDir+f, cp2+f, ()=>{});
      }, 1000);
    });
  });
}

new CronJob({
  cronTime: '31 * * * * *',
  onTick: cronFn2,
  start: true
});


new CronJob({
  cronTime: '00 * * * * *',
  onTick: cronFn,
  start: true
});

cronFn();
cronFn2();