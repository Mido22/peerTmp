
var SyslogListener = require('./modules/sysloglistener')
  , myUtils = require('./modules/utils')
  , Database = require('./modules/database')
  , ApiServer = require('./modules/apiServer')
  , logListener
  , db
  , restListener
  , apiServer,
  , dbFileLocation = './logdb.json'
;


function start(syslogPort, restPort, callback){

  if(!syslogPort || !restPort)  return callback("Missing Parameters in syslogserver.start() method");


  db = new Database({filename: dbFileLocation});
  logListener = new SyslogListener(syslogPort, db);
  apiServer = new ApiServer(restPort, db);

  db.start()    // start database server
    .then(logListener.start.bind(logListener))  // start listening to syslogs
    .then(apiServer.start.bind(apiServer))      // start rest api server
    .then(callback)     // success callback
    .catch(callback);   // failure callback

}


function stop(callback){
  db.stop()
    .then(callback)     // success callback
    .catch(callback);   // failure callback
}

module.exports = {
  start: start,
  stop: stop
}