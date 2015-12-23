/* eslint no-process-exit: 0 */

'use strict';
var fs   = require('fs');
var util = require('util');
var url  = require('url');
var http = require('http');

// Ensure we get right number of args
if (process.argv.length < 4) {
  console.error("node server.js <rest data.json> <server 1 port> [<server 2 port>] ...");
  process.exit(1);
}

// Get arguments
var restFile   = process.argv[2];

// Process arguments
var restData   = fs.readFileSync(restFile);
restData = JSON.parse(restData);

// Startup all servers
var serverList = [];
(function(){
  function serverStarted(item) {
    console.log("Server listening on: http://localhost:%s", item.port);
  }

  var serverItem;
  var i;
  for (i = 3; i < process.argv.length; i++) {
    serverItem = {
      index: i - 3,
      port: parseInt(process.argv[i], 10)
    };

    serverItem.server = http.createServer(handleRequest.bind(null, serverItem));
    serverItem.server.listen(serverItem.port, serverStarted.bind(null, serverItem));
    serverList.push(serverList);
  }
}());


// Create filter to search for logs
function buildFilter(query) {
  // Test regexp
  function validateRegexp(regexp, data) {
    return regexp.test(data);
  }

  // Test date
  function validateDateString(data) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(data))
      return false;
    if (isNaN(Date.parse(data)))
      return false;
    return true;
  }

  function validatePrio(data) {
    if (!/^\d+$/.test(data))
      return false;
    var tmp = parseInt(data, 10);
    if (isNaN(tmp) || tmp < 0 || tmp > 7)
      return false;
    return true;
  }

  // Used to validate input arguments
  var argumentValidation = {
    startTime:  validateDateString,
    endTime:    validateDateString,
    prio:       validatePrio,
    num:    validateRegexp.bind(null, /^\d+$/),
    ip:     validateRegexp.bind(null, /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/),
    cat:    validateRegexp.bind(null, /.+/),
    event:  validateRegexp.bind(null, /.+/),
    action: validateRegexp.bind(null, /.+/)
  };

  // Create case insensitive regexp from input
  function createRegExp(data) {
    return new RegExp(data, "i");
  }

  // Convert string to date withouth milliseconds
  function createDateString(data) {
    function pad(number) {
      return '' + (number < 10 ? '0' : '') + number;
    }

    var date = new Date(data);
    return date.getUTCFullYear() +
      '-' + pad(date.getUTCMonth() + 1) +
      '-' + pad(date.getUTCDate()) +
      'T' + pad(date.getUTCHours()) +
      ':' + pad(date.getUTCMinutes()) +
      ':' + pad(date.getUTCSeconds()) +
      'Z';
  }

  // Convert argument to filter value
  var argumentParser = {
    startTime: createDateString,
    endTime:  createDateString,
    num: function(data) {
      return parseInt(data, 10);
    },
    prio: function(data) {
      return parseInt(data, 10);
    },
    cat:    createRegExp,
    event:  createRegExp,
    action: createRegExp
  };

  // Default values
  var newFilter = {
    num:    20,
    startTime:  null,
    endTime:    null,
    prio:   null,
    ip:     null,
    cat:    null,
    event:  null,
    action: null
  };

  // Parse suplied property values
  var prop, propVal;
  var propVal;
  for (prop in query) {
    if (!query.hasOwnProperty(prop)) continue;

    // Check that we only have allowed property
    if (!argumentValidation.hasOwnProperty(prop)) {
      return new Error(util.format('Unhandled argument "%s"', prop));
    }

    // Get value
    propVal = query[prop];

    // Validate value
    if (!argumentValidation[prop](propVal)) {
      return new Error(util.format('Invalid argument %s: "%s"', prop, propVal));
    }

    // Convert value if needed
    if (argumentParser.hasOwnProperty(prop)) {
      propVal = argumentParser[prop](propVal);
    }

    // Update our filter
    newFilter[prop] = propVal;
  }

  return newFilter;
}


// Process request
function handleRequest(serverHandle, req, res) {
  var urlData = url.parse(req.url, true);

  // Set response
  function respond(code, data) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = code;
    res.end(JSON.stringify(data));
  }

  // Only answer to '/log'
  if (urlData.pathname !== '/log') {
    return respond(404, {message: '404 not found'});
  }

  var filter = buildFilter(urlData.query);
  if (util.isError(filter)) {
    return respond(400, {message: filter.message });
  }

  var result = [];
  var index, log;

  // Each server process equal part of the list
  for (index = serverHandle.index; index < restData.length && result.length < filter.num; index += serverList.length) {
    log = restData[index];
    if (filter.startTime != null && filter.startTime.localeCompare(log.time) > 0)
      continue;
    if (filter.endTime != null && filter.endTime.localeCompare(log.time) < 0)
      continue;
    if (filter.prio != null && filter.prio !== log.prio)
      continue;
    if (filter.ip != null && (log.ip == null || !filter.ip.test(log.ip)))
      continue;
    if (filter.cat != null && (log.cat == null || !filter.cat.test(log.cat)))
      continue;
    if (filter.event != null && (log.event == null || !filter.event.test(log.event)))
      continue;
    if (filter.action != null && (log.action == null || !filter.action.test(log.action)))
      continue;
    //console.log("%d:  %d %s %s %s", serverHandle.port, index, log.time, log.cat, log.event);
    result.push(log);
  }

  respond(200, result);
}
