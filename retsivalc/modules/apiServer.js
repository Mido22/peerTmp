var http = require('http')
  , filterPrameterArray = ['num', 'startDate', 'endDate', 'ip', 'event', 'action', 'cat'] // list of allowed filter parameters
;

function Server(port, database){

  var server = http.createServer(handleRequest);
  
  this.start = function(){
    return new Promise(function(resolve, reject){
      server.listen(port, function(err){
        if(err) return reject(err);
        console.log('REST api server is started at port: ', port);
        resolve();
      });
    });
  }

  function handleRequest( request, response){
    if(request.method !=='GET') return errorResponse(response, 'Only GET is allowed');

    var promise;

    switch(request.url.split('?')[0]){     // repond differently for different uri, basically a request dispatcher.
      case '/logs'  :
                      promise = database.find(parseQueryParams(request.url));
                      break;
      case '/stats' :
                      promise = database.getStats();                        
                      break;
      default       : 
                      return errorResponse(response, 'Invalid request path');
    }
    promise.then(function(result){
      response.writeHead(200, {"Content-Type": "application/json"});
      response.end(JSON.stringify(result));
    }).catch(errorResponse.bind(null, response));
  }

}



function errorResponse(response, message){
  message = message || 'Error Occured.';
  response.writeHead(404, {'Content-Type': 'text/html'});
  response.write('<!doctype html><html><head><title>404</title></head><body>404: '+message+'</body></html>');
  response.end();
}

function parseQueryParams(requestUrl){

  var query = {}
    , paramStr = requestUrl.split('?')[1];

  if(!paramStr) return query;

  paramStr.split('&').forEach(function(str){
    str = str.split('=');        
    if(filterPrameterArray.indexOf(str[0]) > -1)
      query[str[0]] = str[1].toUpperCase();
  });
  query.num = parseInt(query.num, 10) || 20;  // default result count
  if(query.startDate && query.endDate && !isNaN(Date.parse(query.startDate)) && !isNaN(Date.parse(query.endDate))){
    query.createdAt = {};
    query.createdAt.$lte = new Date(query.startDate);
    query.createdAt.$gte = new Date(query.endDate);
  }    
  delete query.startDate;
  delete query.endDate;
  return query;
}


module.exports = Server;
