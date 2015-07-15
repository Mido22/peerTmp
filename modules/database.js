
var redis = require('then-redis').createClient(),
  path = require('path')
  ;  

/** 
 * @desc method to retrieve value for a given key
 * @memberof module:modules/database.key
 * @param {String} key - the key string
 * @function get
 * @returns {Promise} - returns a Promise that resolves to value of key in database.
 */
function keyGet(key){
  return redis.get(key);
}

/** 
 * @desc method for setting value for a given key
* @memberOf module:modules/database.key
 * @param {String} key - the key string
 * @param {String} val - the value string
 * @function set
 * @returns {Promise} - returns a Promise that resolves to database reply
 */
function keySet(key, val){
  return redis.set(key, val);
}

/** 
 * @desc increasing the value set in key by one.
* @memberOf module:modules/database.key
 * @param {String} key - the key string
 * @function incr
 * @returns {Promise} - returns a Promise that resolves to database reply
 */
function keyIncr(key){
  return redis.incr(key);
}

/** 
 * @desc method for deleting the given key.
* @memberOf module:modules/database.key
 * @param {String} key - the key string
 * @function del
 * @returns {Promise} - returns a Promise that resolves to database reply
 */
function keyDelete(key){
  return redis.del(key);
}

/** 
 * @desc method for checking if a key exists
* @memberOf module:modules/database.key
 * @param {String} key - the key string
 * @function exists
 * @returns {Promise} - returns a Promise that resolves to database reply( boolean value)
 */
function keyExists(key){
  return redis.exists(key);
}

/** 
 * @desc method for expiring a key after a given time
* @memberOf module:modules/database.key
 * @param {String} key - the key string
 * @param {integer} time - expiry time of the key in seconds
 * @function expire
 * @returns {Promise} - returns a Promise that resolves to database reply
 */
function keyExpire(key, time){
  return redis.expire(key, time);
}

/** 
 * @desc method for adding a member to a given set
* @memberOf module:modules/database.set
 * @param {String} setName - the name of the set
 * @param {String} key - the name of the set member
 * @function add
 * @returns {Promise} - returns a Promise that resolves to database reply
 */
function setAdd(setName, key){
  return redis.sadd(setName, key);
}

/** 
 * @desc method for checking if given key is member of set
* @memberOf module:modules/database.set
 * @param {String} setName - the name of the set
 * @param {String} key - the name of the set member
 * @function exists
 * @returns {Promise} - returns a Promise that resolves to database reply(boolean value)
 */
function setExists(setName, key){
  return redis.sismember(setName, key);
}

/** 
 * @desc method for removing given member from set
* @memberOf module:modules/database.set
 * @param {String} setName - the name of the set
 * @param {String} key - the name of the set member
 * @function del
 * @returns {Promise} - returns a Promise that resolves to database reply
 */
function setRemove(setName, key){
  return redis.srem(setName, key);
}

/** 
 * @desc method for retriving all the members of the set
* @memberOf module:modules/database.set
 * @param {String} setName - the name of the set
 * @function get
 * @returns {Promise} - returns a Promise that resolves to database reply( array pf strings)
 */
function setGetAll(setName){
  return redis.smembers(setName);
}

/** 
 * @desc method for getting the count of members in the set
* @memberOf module:modules/database.set
 * @param {String} setName - the name of the set
 * @function size
 * @returns {Promise} - returns a Promise that resolves to database reply( integer)
 */
function setGetSize(setName){
  return redis.scard(setName);
}

/** 
 * @desc method for deleting a set
* @memberOf module:modules/database.set
 * @param {String} setName - the name of the set
 * @function clear
 * @returns {Promise} - returns a Promise that resolves to database reply
 */
function setClear(setName){
  return redis.del(setName);
}


/** 
 * @desc for handling operations relating to "SET" type 
 * @namespace set
 * @memberof module:modules/database
 *
 */
var set = {
  add: setAdd,
  del: setRemove,
  exists: setExists,
  get: setGetAll,
  size: setGetSize, 
  clear: setClear
};




/** 
 * @desc for handling operations relating to "KEY" type 
 * @namespace key
 * @memberof module:modules/database
 *
 */
var key = {
  set: keySet,
  get: keyGet,
  incr: keyIncr,
  del: keyDelete,
  expire: keyExpire,
  exists: keyExists
}

/**
 * @desc currently, it is connected to redis database, later based on design change, this can be made to point at any desired database and no other modules needs to be changed.
 * @module modules/database
 */
module.exports = {
  key: key,
  set: set
};  

