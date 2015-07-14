/**
 * @module database
 * @desc currently, it is connected to redis database, later based on design change, this can be made to point at any desired database and no other modules needs to be changed.
 */

var redis = require('then-redis').createClient(),
  path = require('path')
  ;  

/**
 * @func 
 * @alias module:database.key.get
 * @desc for retriving value for the given key.
 * @returns {Promise} - A promise resolving to .
 */
function keyGet(key){
  return redis.get(key);
}

function keySet(key, val){
  return redis.set(key, val);
}

function keyIncr(key){
  return redis.incr(key);
}

function keyDelete(key){
  return redis.del(key);
}

function keyExists(key){
  return redis.exists(key);
}

function keyExpire(key, time){
  return redis.expire(key, time);
}

function setAdd(setName, key){
  return redis.sadd(setName, key);
}

function setExists(setName, key){
  return redis.sismember(setName, key);
}

function setRemove(setName, key){
  return redis.srem(setName, key);
}

function setGetAll(setName){
  return redis.smembers(setName);
}

function setGetSize(setName){
  return redis.scard(setName);
}

function setClear(setName){
  return redis.del(setName);
}

/**
 * @memberOf module:database
 * @desc for handling operations relating to "KEY" type
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
 * @memberOf module:database
 * @desc for handling operations relating to "SET" type
 */
var key = {
  set: keySet,
  get: keyGet,
  incr: keyIncr,
  del: keyDelete,
  expire: keyExpire,
  exists: keyExists
}


module.exports = {
  key: key,
  set: set
};  

