var dgram = require("dgram")
  , messagePattern=/^\<(\w+)\>\[(.*)\] EFW: (\w+): prio\=(\d+) id=(\d+) rev\=(\d+) event\=(\w+) (.*)$/
  , actionPattern = /^action\=(\w+) (.*)$/
;


function SyslogListener(port, database){

  var socket = dgram.createSocket("udp4");

  this.start = function(){
    return new Promise(function(resolve, reject){
      var promiseResolved = false;
      socket.bind(port);
      socket.on('listening', function(){
        console.log('listening to syslog messages at port: ', port);
        promiseResolved = true;
        resolve();
      });
      socket.on('error', function(err){
        console.error('syslog error', err);
        if(!promiseResolved) reject(err);
      });
      socket.on('message', function(buffer, rinfo){
        var result = parseMessage(buffer);
        result.ip = rinfo.address;
        database.insert(result).catch(console.error.bind(console));
      });
    });
  };

}

// for transforming the input buffer into the 
function parseMessage(buffer){
  var result={malformed:true}
    , actionMatch
    , str = buffer.toString()
    , match = messagePattern.exec(str)     
  ;
  
  if(!match || isNaN(Date.parse(match[2]))) return result;

  //result.pri = match[1];
  result.time = new Date(match[2]);
  result.cat = match[3].toUpperCase();
  //result.severity = match[4];
  //result.logId = match[5];
  //result.revision = match[6];
  // I have not removed these commented properties for later they might be used, and one could just uncomment them.
  result.event = match[7].toUpperCase();
  if(actionPattern.test(match[8])){
    actionMatch = actionPattern.exec(match[8]);
    result.action = actionMatch[1].toUpperCase();
    result.message = actionMatch[2];
  }else{
    result.message = match[8];
  }  
  delete result.malformed;
  result.message = match[0]; // complete message is requested in requirements.
  return result;
}

module.exports = SyslogListener;