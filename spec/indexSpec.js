var request = require('request'),
  path = require('path'),
  crypto = require(path.join(__dirname, '..', 'lib', 'peerio_crypto_mod')),
  nacl = require('tweetnacl/nacl-fast'),
  host = "http://localhost:"+(process.env.PORT || 3333),
  API = {
    gen: host + '/api/generate/',
    token: host + '/api/tokens/'
  };

var tokens, 
  serverPublicKey,
  myKeyPair = nacl.box.keyPair();

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

describe("Generating tokens", function() {
  it("should respond with 10 encrypted tokens", function(done) {
    var myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);
    request( formURL('generate', myPublicKeyString), function(error, response, body){
      var b = JSON.parse(response.body);
      tokens = b.tokens; 
      serverPublicKey = b.ephemeralServerPublicKey;
      expect(response.statusCode).toEqual(200);
      expect(tokens.length).toEqual(10);
      done();
    });
  });
})

describe("Validating tokens", function() {
  it("should return an error for an unknown token", function(done) {
    var myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);

    request(formURL('token', 'garbage'), function(error, response, body){
        expect(response.statusCode).toEqual(500);
        done();
      });
  })

  it("should return an error for a known token and incorrect user", function(done) {
    var validDecryptedToken = crypto.decryptToken(tokens[0], myKeyPair);

    request(formURL('token', validDecryptedToken, 'garbage'), function(error, response, body){
        expect(response.statusCode).toEqual(500);
        done();
      });  
  })

  it("should return an error for an unknown token", function(done) {
    var myPublicKeyString = crypto.getPublicKeyString(myKeyPair.publicKey);

    request(formURL('token', 'garbage', myPublicKeyString), function(error, response, body){
        expect(response.statusCode).toEqual(500);
        done();
      });  
  
  })
})