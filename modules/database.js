var redis = require('node-redis').createClient(),
	path = require('path');  


function incrKey(key){
	redis.incr('usage:'+key);
}

function set(key, val){
	redis.set(key, val);
}

function get(key, cb){
	redis.get(key, cb);
}

function del(key){
	redis.del(key);
}

module.exports = {
	incrKey: incrKey,
	set: set,
	get: get,
	del: del
}