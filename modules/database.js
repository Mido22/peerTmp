//var redis = require('then-redis').createClient(),
var redis = require('then-redis').createClient({host: '13.198.103.81', password:'WebRTC_Redis_Password'}),
  path = require('path')
  ;  

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

var set = {
  add: setAdd,
  del: setRemove,
  exists: setExists,
  get: setGetAll,
  size: setGetSize, 
  clear: setClear
};


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