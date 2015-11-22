var Datastore = require('nedb')
;


function MyDatabase(config){

  config = config || {};

  var db
    , stats={
        received: 0,
        malformed: 0
      }
    , statKeys= {  // the properties to be returned when stats are requested
        received: true,
        malformed: true,
        first: true,
        last: true
      }
  ;

  config.autoload = false;    // we are hard-coding the autoload param to false, as we listen to database starting event.
  config.timestampData = true;  // helps in querying records
  db = new Datastore(config);


  this.start = function(){
    return new Promise(function(resolve, reject){
      db.loadDatabase(function(err){
        if(err) return reject(err);
        resolve();
      });
    });
  };

  function updateStats(record){
    if(record.malformed) stats.malformed += 1;
    else stats.received += 1;
    if(!stats.first)  stats.first = new Date().toISOString();
    stats.last = new Date();
  }

  this.getStats = function(){
    var result = {}, key;
    for(key in stats){
      if(!statKeys[key]) continue;    // if the property is not meant to be exposed.
      if(['number', 'string'].indexOf(typeof stats[key])>-1)  // if datatype is number or 
        result[key] = stats[key];
      else if(stats[key] instanceof Date)
        result[key] = stats[key].toISOString();
    }
    return Promise.resolve(result); // for sake of consistancy, this method also returns a promise though it can directly return the result
  };

  this.insert = function(record){
    if(record.malformed)  return updateStats(record);
    return new Promise(function(resolve, reject){
      db.insert(record, function(err){
        if(err) return reject(err);
        updateStats(record);
        resolve();
      });
    });
  };

  this.find = function(query){
    var searchCount = query.num;
    delete query.num;
    return new Promise(function(resolve, reject){
      db..find(query).limit(searchCount).exec(function(err, records){
        if(err) return reject(err);
        if(records.length===1)  return resolve(records[1]);
        resolve(records);
      });
    });
  };
}

module.exports = MyDatabase;