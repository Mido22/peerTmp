
// checking if Proise is found, uses the global shim.
require('es6-promise').polyfill();


var request = require('request'),
  path = require('path'),
  crypto = require(path.join(__dirname, '..', 'lib', 'peerio_crypto_mod')),
  nacl = require('tweetnacl/nacl-fast'),
  host = "http://localhost:"+(process.env.PORT || 3333),
  API = {
    gen: host + '/api/generate/',
    token: host + '/api/tokens/'
  };


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

function pRequest(uri){
	return new Promise(function(resolve, reject){
		request(uri, function(err, response){
			if(err)	return reject(err);
			resolve(response);
		});
	});
}

describe("Generating tokens", function() {

	var myKeyPair =  nacl.box.keyPair(),
	  myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);

  it("should respond with 10 encrypted tokens", function(done) {

    pRequest( formURL('generate', myPublicKeyString))
    .then(function(response){
      var tokens = JSON.parse(response.body).tokens; 
      expect(response.statusCode).toEqual(200);
      expect(tokens.length).toEqual(10);

    }).then(done.bind(null, null), done);
  });


});

describe("Validating tokens", function() {

	var tokens, serverPublicKey, myKeyPair, myPublicKeyString;

	beforeEach(function(done){

		myKeyPair =  nacl.box.keyPair();
	  myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);
    pRequest( formURL('generate', myPublicKeyString))
    .then(function(response){
      tokens = JSON.parse(response.body).tokens; 

    }).then(done.bind(null, null), done);
	});

	afterEach(function(done){
		done();
	});

  it("should return an error for an unknown token", function(done) {

    pRequest(formURL('token', 'garbage'))
    .then(function(response){
      expect(response.statusCode).toEqual(500);

    }).then(done.bind(null, null), done);
  });

  it("should return an error for a known token and incorrect user", function(done) {

    var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);
    pRequest(formURL('token', validDecryptedToken, 'garbage'))
    .then(function(response){
      expect(response.statusCode).toEqual(500);

    }).then(done.bind(null, null), done);
  });

  it("should return an error for an unknown token", function(done) {

    pRequest(formURL('token', 'garbage', myPublicKeyString))
    .then(function(response){
      expect(response.statusCode).toEqual(500);

    }).then(done.bind(null, null), done);  
  });
});