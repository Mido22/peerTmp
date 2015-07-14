var path = require('path'), 
  security = require(path.join('..', 'modules', 'security')),
  tokenGenCount = 10; 

function Router(express){

  var router = express.Router(); 

  router.get('/generate/:publicKey', function(req, res) {
    security.generatesTokens(req.params.publicKey, tokenGenCount)
      .then(function(encryptedTokens){    
        if(!encryptedTokens || !encryptedTokens.length) throw new Error('No Tokens Generated.');

        res.status(200).json({ 
          tokens: encryptedTokens
        }); 
      }).catch(function(err){
        res.status(500).json({ error: 'error' });
      });
  });

  // check validity of a token
  router.post('/tokens/:token', function(req, res) {
      var token  = decodeURIComponent(req.params.token);
      security.checkToken(req.body.publicKey, token)
        .then(function(bool){
          if (bool) {
            res.status(200).json({ status: 'ok' });
          } else {
            throw new Error('Invalid Token Pair');
          }
        }).catch(function(err){
          res.status(500).json({ error: 'error' });
        });
  });  
  
  return router;
}

module.exports = Router;