var path = require('path'),
  db = require(path.join('..', 'modules', 'database')),  
  security = require(path.join('..', 'modules', 'security')); 

function Router(express){

	var router = express.Router(); 

	// track
	router.use(function(req, res, next) {
	    if (req.params.publicKey) {
	    	db.incrKey(publicKey)
	    }
	    next(); 
	});

	router.get('/generate/:publicKey', function(req, res) {
		var publicKey = req.params.publicKey,
			tokens = [], 
			encryptedTokens = [];

		for (var i=0; i<10; i++) {
			var token = security.generateToken();
			tokens.push(token);
			db.set(token, publicKey);
			encryptedTokens.push(security.encryptToken(token, publicKey));
		}
		res.status(200).json({ 
			tokens: encryptedTokens
		});
	});


	// check validity of a token
	router.post('/tokens/:token', function(req, res) {
    	decryptedToken = req.params.token;  
    	publicKey = req.body.publicKey;

      db.get(decryptedToken, function(err, val) {
      	if (val && val.toString() === publicKey) {
      		res.status(200).json({ status: 'ok' });
      	} else {
      		res.status(500).json({ error: 'error' });
      	}
      	db.del(decryptedToken);
      });
  });	


}

module.exports = Router;