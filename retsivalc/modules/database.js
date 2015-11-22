var Datastore = require('nedb')
;


function MyDatabase(config){

  config = config || {};

  var db
    , statKeys= {  // the properties to be returned when stats are requested
        received: 1,
        malformed: 1,
        first: 1,
        last: 1
      }
    , sortOrder = {createdAt: -1}
    , logKeys = {
        time: 1,
        action: 1,
        event: 1,
        cat: 1,
        message: 1,
        ip: 1
      }
    , state = 'STOPPED'
    , defaultStatId = 'statKey'
    , statFilter = {_id: {$ne: defaultStatId}}
    , stats = {
        _id: defaultStatId,
        received: 0,
        malformed: 0
      }
    , updateStatsInterval
  ;

  config.autoload = false;    // we are hard-coding the autoload param to false, as we listen to database starting event.
  //config.timestampData = true;  // helps in querying records
  db = new Datastore(config);

  function updateStatsFromDB(){
    return new Promise(function(resolve, reject){
      db.findOne({_id:defaultStatId}, function(err, _stats){  // checking if stat record is present in database.
        if(err) return reject(err);
        if(_stats)  stats = _stats;
        db.count(statFilter, function(err, count){   // for retriving the no. of received logs
          if(err) return reject(err);
          if(!count) return resolve();
          stats.received = count;
          db.findOne(statFilter).sort({createdAt: 1}).exec(function(err, record){
            if(err) return reject(err);
            stats.first = record.time;
            db.findOne(statFilter).sort({createdAt: -1}).exec(function(err, _record){
              stats.last = _record.time;
              resolve();
            });
          });
        });
      });
    });    
  }

  this.start = function(){
    isRunning(false);
    return new Promise(function(resolve, reject){
      db.loadDatabase(function(err){
        if(err) return reject(err);
        resolve();
      });
    })
    .then(updateStatsFromDB)
    .then(function(){
      state = 'RUNNING';
      console.log('The Database has started, storing data in ', config.filename|| ' memory');
      updateStatsInterval = setInterval(function(){
        updateStatsToDB().catch(function(){ // if database has stopped running.
          if(updateStatsInterval) clearInterval(updateStatsInterval);
        });
      }, 10000);  // sync stats record value to database every 10 seconds.
     });
  };

  function updateStats(record){
    if(record.malformed) stats.malformed += 1;
    else stats.received += 1;
    if(!stats.first)  stats.first = record.time;
    stats.last = record.time;
  }

  function isRunning(mustBeRunning){
    if(mustBeRunning && state==='STOPPED') return Promise.reject('database is not running.');
    if(!mustBeRunning && state==='RUNNING') return Promise.reject('database is already stopped.');
  }

  function updateStatsToDB(){
    isRunning(true);
    return new Promise(function(resolve, reject){
      db.update({_id:defaultStatId}, stats, { upsert: true }, function(err, numReplaced){
        if(err) return reject(err);
        if(numReplaced!==1) return reject('Database is not updated');
        resolve();
      });
    });
  }

  this.getStats = function(){
    isRunning(true);
    var result = {}, key;
    for(key in stats){
      if(!statKeys[key]) continue;    // if the property is not meant to be exposed.      
      result[key] = stats[key];
    }
    return Promise.resolve(result); // for sake of consistancy, this method also returns a promise though it can directly return the result
  };

  this.insert = function(record){
    isRunning(true);
    if(record.malformed)  return Promise.resolve(updateStats(record));
    return new Promise(function(resolve, reject){
      record.createdAt = new Date();
      record.time = record.createdAt.toISOString();
      db.insert(record, function(err){
        if(err) return reject(err);
        updateStats(record);
        resolve();
      });
    });
  };

  this.find = function(query){
    isRunning(true);
    var searchCount = query.num;
    delete query.num;
    return new Promise(function(resolve, reject){
      db.find(query).projection(logKeys).sort(sortOrder).limit(searchCount).exec(function(err, records){
        if(err) return reject(err);
        if(records.length===1)  return resolve(records[0]);
        resolve(records);
      });
    });
  };

  this.stop = function(){
    isRunning(true);
    return updateStatsToDB()
      .then(function(){
        console.log('\nThe Database has been stopped.\n');
        if(updateStatsInterval) clearInterval(updateStatsInterval);
        state = 'STOPPED';
      });
  };

}

module.exports = MyDatabase;