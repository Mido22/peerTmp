require('es6-promise').polyfill();    // Not needed from node v4.*, this would patch the Promise object the to global variables.

var myUtils = require('./modules/utils') 
  , commandLineArgs
  , sysLogger
;

commandLineArgs = myUtils.formArguments();
sysLogger = require('./syslogserver');

myUtils.setGracefulExitFn(sysLogger.stop.bind(sysLogger, onApplicationEnd));
sysLogger.start(commandLineArgs.syslogPort, commandLineArgs.restPort, onApplicationStart);

function onApplicationStart(err){
  if(err) return onFatalError(err);
  console.log('The application has started, accepting log in port %s and REST API is listening in port %s ...', commandLineArgs.syslogPort, commandLineArgs.restPort);
}

function onApplicationEnd(err){
  if(err) return onFatalError(err);
  console.log('The application has stopped.');
  process.exit(0);
}

function onFatalError(err){
  console.error('Fatal Error', err, '\n closing application');
  process.exit(1);
}
