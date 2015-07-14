var schedule = require('node-schedule'),
  path = require('path'),
  crypto = require(path.join('..', 'lib', 'peerio_crypto_mod')),
  Base58 = require(path.join('..', 'lib', 'base58')),
  db = require(path.join('..', 'modules', 'database')), 
  nacl = require('tweetnacl/nacl-fast'),
  keys = {},
  keyPair = nacl.box.keyPair(),
  activeTokensLimit = 1024,      // limit of max number of active tokens per user
  defaultTokenGenCount = 10,    // default no. of tokens to be generated when count is not specified
  watchListEntryLength = 900,    // unused token count for user to be added to watch list
  watchListExitLength = 600,    // unused token count for user to be removed from watch list
  keyExpiryTime = 15*60*1000,    // time before authentication token key expires
  cleanUpInterval = 1*60*60*1000;  // time before checking and removing 

// set names in redis database, 
var CONST = {
  watchList: 'watchList',    // list of users who are about to be temporarily blocked.
  userList: 'userList',      // set containing all the users who has made request in past 24 hours
  prepend: 'auth:'           // string prepended to publicKey before it is used as key in redis db
}

keys.public = crypto.getPublicKeyString(keyPair.publicKey);
keys.private = nacl.util.encodeBase64(keyPair.secretKey);

function encryptToken(token, userPublicKeyString) {
  var nonce = nacl.randomBytes(24);
  var userBytes = new Uint8Array(Base58.decode(userPublicKeyString));
  var serverEphemeralSecret = nacl.util.decodeBase64(keys.private);
  var encrypted_token = nacl.box(
    nacl.util.decodeBase64(token),
    nonce,
    userBytes.subarray(0, 32),
    serverEphemeralSecret
  );
  return {
    token: nacl.util.encodeBase64(encrypted_token),
    nonce: nacl.util.encodeBase64(nonce),
    ephemeralServerPublicKey: keys.public
  }
}

function generateToken() {
  var token = new Uint8Array(32);
  token[0] = 0x41;
  token[1] = 0x54;
  token.set(nacl.randomBytes(30), 2);
  return nacl.util.encodeBase64(token);
}

function generatesTokens(pk, count){
  if(!pk){
    return Promise.reject(new Error('Public Key Missing'));
  }
  var user = CONST.prepend + pk,    
    activeTokenCount,
    tokens = [], 
    encryptedTokens = [];
  count = count || defaultTokenGenCount;

  return db.set.size(user).then(function(size){
    activeTokenCount = size;
    if(activeTokenCount > watchListEntryLength){
      return db.set.add(CONST.watchList, user)
    }
  }).then(function(){
    var i =0;
    var promises = [];
    while(activeTokenCount + i <=  activeTokensLimit && i < count){
      i++;
      var promise = addToken(pk).then(function(encryptedToken){
          encryptedTokens.push(encryptedToken);
      });
      promises.push(promise);
    }
    return Promise.all(promises);
  }).then(function(){
    return encryptedTokens;
  });
}

function addToken(pk){
  var user = CONST.prepend + pk,
    token = generateToken();

  return db.set.add(CONST.userList, user).then(function(){
    return db.set.add(user, token);
  }).then(function(){
    return db.key.set(token, pk);
  }).then(function(){
    return db.key.expire(token, keyExpiryTime);
  }).then(function(){
    return encryptToken(token, pk);
  });
}

function removeExpiredToken(user, key){
  return db.key.exists(key).then(function(bool){
    if(bool){
      return;
    }else{
      return db.set.del(user, key);
    }
  });
}

function removeExpiredTokens(user){

  var tokenCount, newCount;
  function mapKeyExpiry(key){
    return removeExpiredToken(user, key);
  }

  return db.set.get(user).then(function(keys){
    tokenCount = keys.length;
    return Promise.all(keys.map(removeExpiredToken));
  }).then(function(){
    return db.set.size(user);
  }).then(function(size){
    newCount = size;
    if(tokenCount > watchListEntryLength){      
      if(size < watchListExitLength){
        return db.set.del(CONST.watchList, user);
      }
    }
  }).then(function(){
    if(!newCount){
      return db.set.del(CONST.userList, user);
    }
  });
}

function clearUsers(users){
  var promise = Promise.resolve();
  users.forEach(function(user){
    promise = promise.then(function(){
      return removeExpiredTokens(user);
    });
  });
  return promise;
}

function checkToken(user, key){
  var publicKey, redUser = CONST.prepend + user;
  return db.key.get(key).then(function(pk){
    publicKey = pk;
    return db.key.del(key);
  }).then(function(){
    return db.set.del(redUser, key);
  }).then(function(){
    return user === publicKey;
  });

}

var cleanInterval = setInterval(function(){
  db.set.get(CONST.watchList).then(function(users){
    clearUsers(users);
  });
}, cleanUpInterval);

schedule.scheduleJob('* 3 * * *', function() {
  console.log('change server\'s ephemeral keypair')

  keys.public = crypto.getPublicKeyString(keyPair.publicKey);
  keys.private = nacl.util.encodeBase64(keyPair.secretKey);

  db.set.get(CONST.userList).then(function(users){
    clearUsers(users);
  });

});

module.exports = {
  encryptToken: encryptToken,
  generateToken: generateToken,
  checkToken: checkToken,
  generatesTokens: generatesTokens
};