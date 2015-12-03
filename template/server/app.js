var express = require('express'),
  bodyParser = require('body-parser'),
  multer  = require('multer'),
  favicon = require('serve-favicon'),
  morgan = require('morgan'),
  methodOverride = require('method-override'),
  timeout = require('connect-timeout'),
  serveStatic = require('serve-static'),
  errorhandler = require('errorhandler'),
  https = require('https'),
  path = require('path'),
  fs = require('fs'),
  config = require('../settings/config'),
  env = process.env.NODE_ENV || 'development',
  server
;

var app = express();
app.set('views', path.join(__dirname, '../client/views'));
app.set('view engine', 'jade');
//app.use(favicon(PATH_TO_FAV_ICON));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(methodOverride());  
app.use(timeout(1000*60*30));  
app.use(express.Router());
app.use(serveStatic(path.join(__dirname, '../client/dist')));
app.use(serveStatic(path.join(__dirname, '../client/js')));
app.use(serveStatic(path.join(__dirname, '../client/css')));
app.use(function(err, req, res, next){
  console.log(err.stack);
});

if(env === 'development'){
	app.use(errorhandler());
}


// path to partial pages
app.get('/partials/:name', function(req, res){
  res.render('partials/' + req.params.name);
});


///// run express server /////
if(config.server.useHTTPS){
  app.set('port', config.server.https.port);
  server = require('https').createServer({
    key: fs.readFileSync(config.server.https.key),
    cert: fs.readFileSync(config.server.https.cert)
  }, app)
}else{
  app.set('port', config.server.http.port);
  server = require('http').createServer();
}

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
