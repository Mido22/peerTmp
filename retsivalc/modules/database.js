var Datastore = require('nedb')
;


function MyDatabase(config){

  config = config || {}; // set value if not present, this would mean that the database would be run on memory

  var db
    , statKeys= {  // the properties to be returned when stats are requested
        received: 1,
        malformed: 1,
        first: 1,
        last: 1
      }
    , sortOrder = {createdAt: -1} // sorting order when returning query results
    , logKeys = {
        time: 1,
        action: 1,
        event: 1,
        cat: 1,
        message: 1,
        ip: 1
      }
    , state = 'STOPPED' // the database state
    , defaultStatId = 'statKey' // key with which the stats record is stored in database
    , statFilter = {_id: {$ne: defaultStatId}}  // query filter for ignoring stat record when querying log records
    , stats = {
        _id: defaultStatId,
        received: 0,
        malformed: 0
      } // default stat record value
    , updateStatsInterval // variable for holding interval object which periodically updates the stat record in the database with the current one.
  ;

  config.autoload = false;    // we are hard-coding the autoload param to false, as we listen to database starting event.  
  db = new Datastore(config); // initialize the database

  // retrive stats record from the database, returns a Promise that resolves to void.
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

  /**
   * to start database, updates the stats variable
   * @return {Promise} - resolves to no value.
   */
  this.start = function(){
    return isRunning(false).then(function(){
      return new Promise(function(resolve, reject){ // load the database
        db.loadDatabase(function(err){
          if(err) return reject(err);
          resolve();
        });
      });
    })
    .then(updateStatsFromDB)  // update stats variable from database
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

  // for updating stats record in memory after insertion of record.
  function updateStats(record){
    if(record.malformed) stats.malformed += 1;
    else stats.received += 1;
    if(!stats.first)  stats.first = record.time;
    stats.last = record.time;
  }

  /**
   * to check database state, returns a promise that resolves to nothing if everything is ok.
   * mustBeRunning {Boolean} - what must the current state for operation to process, true - db must be running, false - db must be stopped
   */
  function isRunning(mustBeRunning){
    if(mustBeRunning && state==='STOPPED') return Promise.reject('database is not running.');
    if(!mustBeRunning && state==='RUNNING') return Promise.reject('database is already stopped.');
    return Promise.resolve();
  }

  // updates the stat record in db with one in memory, returns Promise that resolves to void is everything is ok.
  function updateStatsToDB(){
    return isRunning(true).then(function(){
      return new Promise(function(resolve, reject){
        db.update({_id:defaultStatId}, stats, { upsert: true }, function(err, numReplaced){
          if(err) return reject(err);
          if(numReplaced!==1) return reject('Database is not updated');
          resolve();
        });
      });  
    });
  }

  /**
   * for getting database stats.
   * @return {Promise} - resolves to stats data taken from memory.
   */
  this.getStats = function(){
    return isRunning(true).then(function(){
      var result = {}, key;
      for(key in stats){
        if(!statKeys[key]) continue;    // if the property is not meant to be exposed.      
        result[key] = stats[key];
      }
      return Promise.resolve(result); // for sake of consistancy, this method also returns a promise though it can directly return the result
    });
  };

  /**
   * for inserting record into database.
   * record - {Object} - the log record to be inserted.
   * @return {Promise} - resolves to nothing on success.
   */
  this.insert = function(record){
    return isRunning(true).then(function(){
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
    });
  };

  /**
   * for querying the database for log records.
   * query - {Object} - the query to be used.
   * @return {Promise} - resolves to the results object/ array( depending on count)
   */
  this.find = function(query){
    return isRunning(true).then(function(){
      var searchCount = query.num;
      delete query.num;
      if(query._id){  // if filter option for id already exists
        if(typeof query._id !== 'string' ){ // if we are not searching for particular id
          if(query._id.$ne){  // check if not equal filter already exists.
            query._id.$nin = query._id.$nin || [];  // create 'not in' filter if doesn't exist already.
            query._id.$nin.push(query._id.$ne);
            query._id.$nin.push(defaultStatId);
            delete query._id.$ne;
          }else{
            query._id.$ne = defaultStatId;
          }
        }
      }else{
        query._id = statFilter._id;
      }
      return new Promise(function(resolve, reject){
        db.find(query).projection(logKeys).sort(sortOrder).limit(searchCount).exec(function(err, records){
          if(err) return reject(err);
          if(records.length===1)  return resolve(records[0]);
          resolve(records);
        });
      });
    });
  };

  /**
   * for stopping the database
   * @return {Promise} - resolves to nothing on success.
   */
  this.stop = function(){
    return isRunning(true)
      .then(updateStatsToDB)
      .then(function(){
        console.log('\nThe Database has been stopped.\n');
        if(updateStatsInterval) clearInterval(updateStatsInterval);
        state = 'STOPPED';
      });
  };

}

module.exports = MyDatabase;