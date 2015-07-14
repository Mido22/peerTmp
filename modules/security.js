/**
 * security module.
 * @module security
 * @desc the main application logic is written here( kinda like the business class).
 */

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

/**
 * @func encryptToken
 * @private
 * @memberOf module:security
 * @desc method for encrypting token
 * @param {String} token - the generated authentication token
 * @param {String} userPublicKeyString - Public Key of the user.
 * @returns {Object} - has three attributes: token, nonce, ephemeralServerPublicKey.
 */
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

/**
 * @func generateToken
 * @private
 * @memberOf module:security
 * @desc method for generating authentication token
 * @returns {Object} - the generated authentication token.
 */
function generateToken() {
  var token = new Uint8Array(32);
  token[0] = 0x41;
  token[1] = 0x54;
  token.set(nacl.randomBytes(30), 2);
  return nacl.util.encodeBase64(token);
}

/**
 * @func generatesTokens
 * @memberOf module:security
 * @param {String} pk - Public Key of the user.
 * @param {String} count - number of auth tokens to be generated.
 * @desc method for generating authentication token for a given Public Key
 * @returns {Promise} - A promise resolving to give array of encrypted tokens.
 */
function generatesTokens(pk, count){
  if(!pk)  return Promise.reject(new Error('Public Key Missing'));
  
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
    while(activeTokenCount + i <  activeTokensLimit && i < count){
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

/**
 * @func addToken
 * @private
 * @memberOf module:security
 * @param {String} pk - Public Key of the user.
 * @desc method for adding the auth token to the database and returning a single authentication token.
 * @returns {Promise} - A promise resolving to give a single encrypted token.
 */
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

/**
 * @func removeExpiredToken
 * @private
 * @memberOf module:security
 * @param {String} user - user set name in the database.
 * @param {String} key - the authenication token to be checked.
 * @desc method for removing a single autentication token from user set in database if it is expired.
 * @returns {Promise}
 */
function removeExpiredToken(user, key){
  return db.key.exists(key).then(function(bool){
    if(bool){
      return;
    }else{
      return db.set.del(user, key);
    }
  });
}

/**
 * @func removeExpiredTokens
 * @private
 * @memberOf module:security
 * @param {String} user - user set name in the database.
 * @desc method for removing all the expired tokens in a given user set.
 * @returns {Promise}
 */
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

/**
 * @func clearUsers
 * @private
 * @memberOf module:security
 * @param {Array} users - array of user stings for whom expired tokens have be removed.
 * @desc method which removes expired tokens from a given array of user sets.
 * @returns {Promise}
 */
function clearUsers(users){
  var promise = Promise.resolve();
  users.forEach(function(user){
    promise = promise.then(function(){
      return removeExpiredTokens(user);
    });
  });
  return promise;
}

/**
 * @func checkToken
 * @memberOf module:security
 * @param {String} user - user set name in the database.
 * @param {String} key - the authenication token to be checked.
 * @desc method the checks the validity of given pair, if true, removes the token from database
 * @returns {Promise}  - A promise that resolves to boolean value.
 */
function checkToken(user, key){

  if(!user || !key)  return Promise.resolve(false);

  var publicKey, redUser = CONST.prepend + user, bool;
  return db.key.get(key).then(function(pk){
    publicKey = pk;
    bool = (user === publicKey);
    if(bool){
      return db.key.del(key).then(function(){
        return db.set.del(redUser, key);
      });
    };
  }).then(function(){
    return bool;
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
  checkToken: checkToken,
  generatesTokens: generatesTokens
};