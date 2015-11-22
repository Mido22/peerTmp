
var SyslogListener = require('./modules/sysloglistener')
  , Database = require('./modules/database')
  , ApiServer = require('./modules/apiServer')
  , logListener   // syslog listener instance
  , db            // database instance
  , apiServer     // rest server instance
  , dbFileLocation = './logdb.json' // location of the database file
;


/**
 * for starting the application
 * syslogPort {Number}  - UDP port for listening to syslog messages.
 * restPort {Number} - port in for running REST API server
 * callback {Function} - function to be called after the start of the application.
 * @return {void}
 */
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


/**
 * for shutting down the application
 * callback {Function} - function to be called after the stopping the application.
 * @return {void}
 */
function stop(callback){
  db.stop()
    .then(callback)     // success callback
    .catch(callback);   // failure callback
}

module.exports = {
  start: start,
  stop: stop
}