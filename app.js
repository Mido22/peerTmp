var express = require('express'),
  http = require('http'),
  port = process.env.PORT || 3333,
  app = express(),
  bodyParser = require('body-parser'),
  httpServer = http.createServer(app),
  path = require('path'),
  router = require(path.join(__dirname, 'modules', 'routes'))(express);

app.listen(port);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api', router);