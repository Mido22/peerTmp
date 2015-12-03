var path = require('path');
exports.server = {
  useHTTPS: false,
  http: {
    port: 80
  },
  https: {
    port: 443,
    key: path.join(__dirname, '../settings/key.pem'),
    cert: path.join(__dirname, '../settings/certificate.pem')
  }
}
exports.database = {
  url: 'mongodb://127.0.0.0',           // place in which mongodb database is running
  logging: true                         // where to log the text and voice chats.
};