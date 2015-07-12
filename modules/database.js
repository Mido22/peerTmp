var redis = require('then-redis').createClient(),
	path = require('path'),
  EXPIRY_TIME = 15*60 // expire key in 15 minutes
  ;  


function incrKey(key){
	redis.incr('usage:'+key).then(function(value){
    console.log('incr key : ', value);
    return value;
  });
}

function set(key, val){
	redis.set(key, val).then(function(value){
    console.log('set key : ', value);
    return value;
  });
}

function get(key){
	return redis.get(key).then(function(value){
    console.log('got key : ', value);
    return value;
  });
}

function del(key){
	redis.del(key);
}

function removeExpiredTokens(user){

}


module.exports = {
	incrKey: incrKey,
	set: set,
	get: get,
	del: del
};