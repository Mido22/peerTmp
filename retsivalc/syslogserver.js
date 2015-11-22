
var SyslogListener = require('./modules/sysloglistener')
  , myUtils = require('./modules/utils')
  , Database = require('./modules/database')
  , logListener
  , db
  , restListener
;


function start(syslogPort, restPort, callback){

  if(!syslogPort || !restPort)  return callback("Missing Parameters in syslogserver.start() method");

  logListener = new SyslogListener();
  db = new Database();

  logListener.start(syslogPort, m => console.log(m))
    .then(callback)
    .catch(callback);

}


function stop(callback){
  callback();
}



module.exports = {
  start: start,
  stop: stop
}