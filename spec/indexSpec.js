
// checking if Proise is found, uses the global shim.
require('es6-promise').polyfill();

var request = require('request'),
  path = require('path'),
  crypto = require(path.join(__dirname, '..', 'lib', 'peerio_crypto_mod')),
  db = require(path.join(__dirname, '..', 'modules', 'database')),
  nacl = require('tweetnacl/nacl-fast'),
  host = "http://localhost:"+(process.env.PORT || 3333),
  dummyPublicKey = 'garbage', 
  dummyToken = 'garbage',
  CONST = {
  	prepend: 'auth:', 
  	maxAllowedActiveKeys: 1024
	},
  API = {
    gen: host + '/api/generate/',
    token: host + '/api/tokens/'
  };

describe("Generating tokens", function() {

	var myKeyPair,
	  myPublicKeyString;

	beforeEach(function(){
		myKeyPair =  nacl.box.keyPair();
	  myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);
	});

	afterEach(function(done){
		clearSet(myPublicKeyString).then(function(){
			myKeyPair = myPublicKeyString =  null;
    }).catch(fail).then(done);
	});

  it("should respond with 10 encrypted tokens", function(done) {

    pRequest(formURL('generate', myPublicKeyString))
    .then(function(response){
      var tokens = JSON.parse(response.body).tokens; 
      expect(response.statusCode).toEqual(200);
      expect(tokens.length).toEqual(10);
      return clearTokens(tokens, myPublicKeyString, myKeyPair);
    }).catch(fail).then(done);
  });

  it("should respond with error when max amount of active tokens for that user reached", function(done) {

  	fakeActiveKeys(myPublicKeyString, CONST.maxAllowedActiveKeys)
  	.then(function(){
    	return pRequest(formURL('generate', myPublicKeyString));
    }).then(function(response){
      expect(response.statusCode).toEqual(500);
    }).catch(fail).then(done);
  });


  it("when active token limit is reaching, it should return tokens till limit is reached", function(done) {

  	var fakeActiveCount = CONST.maxAllowedActiveKeys  - (2 + Math.floor(Math.random()* 8)),
  			tokenCount = CONST.maxAllowedActiveKeys - fakeActiveCount,tokens;

  	fakeActiveKeys(myPublicKeyString, fakeActiveCount)
  	.then(function(){
    	return pRequest(formURL('generate', myPublicKeyString));
    }).then(function(response){
      tokens = JSON.parse(response.body).tokens; 
      expect(response.statusCode).toEqual(200);
      expect(tokens.length).toEqual(tokenCount);
    	return pRequest(formURL('generate', myPublicKeyString));
    }).then(function(response){
      expect(response.statusCode).toEqual(500);
      return clearTokens(tokens, myPublicKeyString, myKeyPair);
    }).catch(fail).then(done);
  });


  it("once active tokens are used, new tokens must be allowed to be created", function(done) {

  	var fakeActiveCount = CONST.maxAllowedActiveKeys  - (2 + Math.floor(Math.random()* 8)),
  			tokenCount = CONST.maxAllowedActiveKeys - fakeActiveCount,
  			tokens;

  	fakeActiveKeys(myPublicKeyString, fakeActiveCount)
  	.then(function(){
    	return pRequest(formURL('generate', myPublicKeyString));
    }).then(function(response){
      tokens = JSON.parse(response.body).tokens; 
      expect(response.statusCode).toEqual(200);
      expect(tokens.length).toEqual(tokenCount);
    	return pRequest(formURL('generate', myPublicKeyString));
    }).then(function(response){
      expect(response.statusCode).toEqual(500);
      return clearTokens(tokens, myPublicKeyString, myKeyPair);
  	}).then(function(){
    	return pRequest(formURL('generate', myPublicKeyString));
    }).then(function(response){
      tokens = JSON.parse(response.body).tokens; 
      expect(response.statusCode).toEqual(200);
      expect(tokens.length).toEqual(tokenCount);
    	return pRequest(formURL('generate', myPublicKeyString));
    }).then(function(response){
      expect(response.statusCode).toEqual(500);
      return clearTokens(tokens, myPublicKeyString, myKeyPair);
    }).catch(fail).then(done);
  });

});

describe("Validating tokens", function() {

	var tokens, myKeyPair, myPublicKeyString;

	beforeEach(function(done){

		myKeyPair =  nacl.box.keyPair();
	  myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);
    pRequest( formURL('generate', myPublicKeyString))
    .then(function(response){
      tokens = JSON.parse(response.body).tokens; 

    }).then(done.bind(null, null), done);
	});

	afterEach(function(done){
		clearSet(myPublicKeyString).then(function(){
			return clearTokensIgnoreError(tokens);
		}).then(function(){
			myKeyPair = myPublicKeyString = tokens =  null;
    }).catch(fail).then(done);
	});

  it("should return an error for an unknown token", function(done) {

    pRequest(formURL('token', dummyToken))
    .then(function(response){
      expect(response.statusCode).toEqual(500);

    }).catch(fail).then(done);
  });

  it("should return an error for an unknown token and correct user", function(done) {

    pRequest(formURL('token', dummyToken, myPublicKeyString))
    .then(function(response){
      expect(response.statusCode).toEqual(500);

    }).catch(fail).then(done);
  });

  it("should return an error for a known token and incorrect user", function(done) {
    var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);
    pRequest(formURL('token', validDecryptedToken, dummyPublicKey))
    .then(function(response){
      expect(response.statusCode).toEqual(500);

    }).catch(fail).then(done);
  });

  it("should return ok when token and user are valid and are correct pair", function(done) {

    var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);
    pRequest(formURL('token', validDecryptedToken, myPublicKeyString))
    .then(function(response){
      expect(response.statusCode).toEqual(200);

    }).catch(fail).then(done);
  });

  it("should return error when same token, user pair is used second time", function(done) {

    var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);
    pRequest(formURL('token', validDecryptedToken, myPublicKeyString))
    .then(function(response){
      expect(response.statusCode).toEqual(200);
      return pRequest(formURL('token', validDecryptedToken, myPublicKeyString));
    }).then(function(response){
      expect(response.statusCode).toEqual(500);
      return pRequest(formURL('token', validDecryptedToken, myPublicKeyString));
    }).then(function(response){
      expect(response.statusCode).toEqual(500);

    }).catch(fail).then(done);
  });

  it("should return ok if token was used in invalid pair previously but used with called with correct pair for the first time", function(done) {

    var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);
    pRequest(formURL('token', validDecryptedToken, dummyPublicKey))
    .then(function(response){
      expect(response.statusCode).toEqual(500);
      return pRequest(formURL('token', validDecryptedToken, myPublicKeyString));
    }).then(function(response){
      expect(response.statusCode).toEqual(200);
      return pRequest(formURL('token', validDecryptedToken, myPublicKeyString));
    }).then(function(response){
      expect(response.statusCode).toEqual(500);

    }).catch(fail).then(done);
  });

});


// wrapper for uri generation
function formURL(type, data){
  switch(type){
    case 'generate': return API.gen + arguments[1];
    case 'token':    return {
                              uri: API.token + encodeURIComponent(arguments[1]),
                              method: 'post',
                              json:  true,
                              body: {
                              	publicKey: arguments[2]
                              }
                            };
  }
}

// for promisifying request.
function pRequest(uri){
	return new Promise(function(resolve, reject){
		request(uri, function(err, response){
			if(err)	return reject(err);
			resolve(response);
		});
	});
}

// for faking active keys for that user.
function fakeActiveKeys(pk, count){
	var i, 
	  user = CONST.prepend + pk,
	  promises = [];

	for(i=0;i<count;i++){
		promises.push(db.set.add(user, i));
	}

	return Promise.all(promises);
}


// for clearing a set
function clearSet(pk){
	return db.set.clear(CONST.prepend + pk);
}

// for clearing active tokens
function clearTokens(tokens, pk, keyPair){
	if(!tokens || !tokens.length)	return Promise.resolve();

	var user = CONST.prepend + pk;
  tokens = tokens.map(function(token){
  	return crypto.decryptToken(token, keyPair);
  });

	var promises  = tokens.map(function(token){
			return db.set.del(user, token).then(function(bool){
				if(!bool)	throw new Error('Inactive key');
				return db.key.del(token);
			}).then(function(bool){
				if(!bool)	throw new Error('Inactive key');
			});
	});
	return Promise.all(promises).then(function(res){
			if(res.length!== tokens.length)	throw new Error('Inactive Token');
	});
}


// for clearing active tokens as keys, leaves the values in set( "auth:<public key>"") as it is
function clearTokensIgnoreError(tokens){
	if(!tokens || !tokens.length)	return Promise.resolve();
	return Promise.all(tokens.map(db.key.del));
}
