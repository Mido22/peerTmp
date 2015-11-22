require('es6-promise').polyfill();

var dgram = require("dgram")
  , logListener = new SyslogListener()
;


function start(syslogPort, restPort, callback){

  if(!syslogPort || !restPort)  return callback("Missing Parameters in syslogserver.start() method");

  logListener.start(syslogPort)
    .then(callback)
    .catch(callback);

  logListener.setMessageHandler(function(){});

}


function stop(callback){
  callback();
}


function SyslogListener(){

  var socket = dgram.createSocket("udp4");

  this.start = function(port){
    return new Promise(function(resolve, reject){
      socket.bind(port);
      socket.on('listening', resolve);
      socket.on('error', function(err){
        console.error('syslog error', err);
        reject(err);
      });
    });
  };

  this.setMessageHandler = function(fn){
    socket.on('message', function (buffer, rinfo) {
      //sanitise the data by replacing single quotes with two single-quotes
      //var message = msg.toString().replace(/'/g, "''") 
      //var src = rinfo.address.toString().replace(/'/g, "''");
      //console.log('rinfo address', rinfo.address);
      //console.log('got message', message, src);
      var result = parseMessage(buffer);
      result.ip = rinfo.address;
      console.log('result: ', result);
    });
  };
    
}

var messagePattern=/^\<(\d+)\>\[(.*)\] EFW: (\w+): prio\=(\d+) id=(\d+) rev\=(\d+) event\=(\w+) (.*)$/
  , actionPattern = /^action\=(\w+) (.*)$/
;

function parseMessage(buffer){
  var result={malformed:true}
    , actionMatch
    , str = buffer.toString()
    , match = messagePattern.exec(str)     
  ;
  
  if(!match || isNaN(Date.parse(match[2]))) return result;

  //result.pri = match[1];
  result.time = new Date(match[2]).toISOString();
  result.cat = match[3];
  //result.severity = match[4];
  //result.logId = match[5];
  //result.revision = match[6];
  result.event = match[7];
  if(actionPattern.test(match[8])){
    actionMatch = actionPattern.exec(match);
    result.action = actionMatch[1];
    result.message = actionMatch[2];
  }else{
    result.message = match[8];
  }  
  delete result.malformed;
  result.message = match[0]; // complete message is requested in requirements.
  return result;
}

module.exports = {
  start: start,
  stop: stop
}