var path = require('path'),
  db = require(path.join('..', 'modules', 'database')),  
  security = require(path.join('..', 'modules', 'security')); 

function Router(express){

  var router = express.Router(); 

  router.get('/generate/:publicKey', function(req, res) {
    security.generatesTokens(req.params.publicKey, 10)
      .then(function(encryptedTokens){        
        res.status(200).json({ 
          tokens: encryptedTokens
        }); 
      }).catch(function(err){
        res.status(500).json({ error: 'error' });
      });
  });


  // check validity of a token
  router.post('/tokens/:token', function(req, res) {
      security.checkToken(req.body.publicKey, req.params.token)
        .then(function(bool){
          if (bool) {
            res.status(200).json({ status: 'ok' });
          } else {
            res.status(500).json({ error: 'error' });
          }
        }).catch(function(err){
          res.status(500).json({ error: 'error' });
        });
  });  
  
  return router;
}

module.exports = Router;