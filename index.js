var express = require('express'),
	http = require('http'),
	port = process.env.PORT || 3333,
	app = express(),
  bodyParser = require('body-parser'),
	httpServer = http.createServer(app),
	path = require('path'),
  Router = require(path.join(__dirname, 'modules', 'routes')),
	//router =  new Router(express);  
	router =  's';  

console.log('router: ', Router);
app.listen(port);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use('/api', router);