Some notes about the code:

  * only external npm module used other than nedb is `es6-promise`, to provide Promise support for older versions of( pre `4.x.x`), tested the application in both v4.2.2 and v0.10.4 in linux environment.
  * The reason for using promise is, though the code  would still be asynchrous, now it is more stream-lined. On hindsight the code would have been even cleaner if I had resorted to Promise library like `bluebird` instead of wrapping all async methods of `nedb` manually.
  * The log messages are persisted in db file; the stats details are persisted in memory and periodically updated in db.
 