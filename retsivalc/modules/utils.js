
'use strict';

var Path = require('path')
  , Util = require('util')
;

// Parse arguments and build config
function formArgumentConfig(){

  var arg, flag, param, option, config = {}
    ,  argumentDefines = {
    's': {
      desc: 'Port that is used to receive syslog messages. (Mandatory)',
      param: 'dest port',
      prop: 'receivePort',
      type: 'number',
      mandatory: true
    },
    'r': {
      desc: 'Port that is used to access the REST API. (Mandatory)',
      param: 'send port',
      prop: 'sendPort',
      type: 'number',
      mandatory: true
    }
  };

  //Print help text
  function printHelp() {
    var i, tmp, argOption, minText, maxText;
    var indent = "                    ";

    console.log('');
    console.log('%s %s',
                Path.basename(process.argv[1]),
                '...');

    tmp = '-h, --help';
    console.log('    %s:%s %s', tmp, indent.substring(tmp.length), 'Display help text');

    for (i in argumentDefines) {
      if (!argumentDefines.hasOwnProperty(i)) continue;
      argOption = argumentDefines[i];
      minText = (argOption.min !== undefined) ? Util.format(" (min: %d)", argOption.min) : '';
      maxText = (argOption.max !== undefined) ? Util.format(" (max: %d)", argOption.max) : '';

      tmp = Util.format('-%s <%s>', i, argOption.param);
      console.log('    %s:%s %s%s%s', tmp, indent.substring(tmp.length), argOption.desc, minText, maxText);
    }
  }

  // Validate number
  function validateNum(flag, param, val, min, max) {
    var doExit = false;
    if (isNaN(val)) {
      console.error('ERROR: Invalid argument %j to %j', param, flag);
      doExit = true;
    }
    if (min !== undefined && min > val) {
      console.error('ERROR: %d is less than min value %d for %j', val, min, flag);
      doExit = true;
    }
    if (max !== undefined && val > max) {
      console.error('ERROR: %d is more than max value %d for %j', val, max, flag);
      doExit = true;
    }

    if (doExit) {
      printHelp();
      process.exit(1);
    }
  }

  // incorrect argument handler
  function onError(){
    printHelp();
    process.exit(1);
  }

  // Setup default values
  for (flag in argumentDefines) {
    if (!argumentDefines.hasOwnProperty(flag)) continue;
    option = argumentDefines[flag];
    if(option.default) config[option.prop] = option.default;
  }

  // Parse arguments
  for (arg = 2; arg < process.argv.length; arg += 2) {
    flag = process.argv[arg + 0];
    param = process.argv[arg + 1];

    // Print help text and exit
    if (flag === '-h' || flag === '--help') {
      printHelp();
      process.exit(0);
    }

    // Need both flag and param
    if (flag === undefined || param === undefined) {
      console.error('ERROR: Missing argument for "%j"', flag);
      onError();
    }

    if (flag[0] === '-' && argumentDefines.hasOwnProperty(flag.substring(1))) {
      option = argumentDefines[flag.substring(1)];

      if (option.type === 'number') {
        config[option.prop] = parseInt(param, 10);
        validateNum(flag, param, config[option.prop], option.min, option.max);
        continue;

      } else if (option.type === 'string') {
        config[option.prop] = param;

      } else {
        throw new Error('Unknown type "' + option.type + '"');
      }
    } else {
      console.error('ERROR: Unknown flag %j with argument %j', flag, param);
      onError();
    }
  }

  // check if any of the manadatory arguments are not passed;
  for(flag in argumentDefines){
    if(!argumentDefines[flag].mandatory)  continue;
    if(!config[argumentDefines[flag].prop]){
      console.error('ERROR: Missing flag %j', flag);
      onError();
    }
  }

  return config;
};


module.exports ={
  formArgumentConfig
}