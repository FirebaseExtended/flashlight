
var fbutil = require('./fbutil'),
   logger = require('./logging').logger;

function SearchQueue(esc, reqRef, resRef, cleanupInterval) {
  this.esc = esc;
  this.inRef = reqRef;
  this.outRef = resRef;
  this.cleanupInterval = cleanupInterval;
  logger.info('Queue started, IN: "%s", OUT: "%s"'.grey, fbutil.pathName(this.inRef), fbutil.pathName(this.outRef));
  setTimeout(function() {
    this.inRef.on('child_added', this._process.bind(this), this);
  }.bind(this), 1000);
  this._nextInterval();
}

SearchQueue.prototype = {
  _process: function(snap) {
    var dat = snap.val();
    var self = this;
    if( this._assertValidSearch(snap.name(), snap.val()) ) {
      // structure jquery into JSON object format expected by elasticsearch
      var queryObj = typeof(dat.query)=='string' ? JSON.parse(dat.query) : dat.query;
      queryObj = queryObj.hasOwnProperty('query') ? queryObj : { "query": queryObj };

      this.esc.search({
        index: dat.index, 
        type: dat.type, 
        body: queryObj
      }).then( function(rsp) {
        logger.debug('search result', rsp);
        self._reply(snap.name(), rsp);
      }).catch( function(err) {
        logger.error(err);
        self._reply(snap.name(), {error: err, total: 0});
      });
    }
  },
  
  _reply: function(key, results) {
    if( results.error ) {
      this._replyError(key, results.error);
    }
    else {
      logger.debug('result %s: %d hits'.yellow, key, results.hits.total);
      this._send(key, results);
    }
  },
  
  _assertValidSearch: function(key, props) {
    var res = true;
    if( typeof(props) !== 'object' || !props.index || !props.type || !props.query ) {
      this._replyError(key, 'search request must be a valid object with keys index, type, and query');
    }
    return res;
  },
  
  _replyError: function(key, err) {
    this._send(key, { total: 0, error: err });
  },
  
  _send: function(key, data) {
    this.inRef.child(key).remove(this._abortOnWriteError.bind(this));
    this.outRef.child(key).setWithPriority(data, new Date().valueOf());
  },
  
  _abortOnWriteError: function(err) {
    if( err ) {
      logger.warning((err+'').red);
      throw new Error('Unable to remove queue item, probably a security error? '+err);
    }
  },
  
  _housekeeping: function() {
    var self = this;
    // remove all responses which are older than CHECK_INTERVAL
    //this.outRef.endAt(new Date().valueOf() - self.cleanupInterval)
    this.outRef.set(null).then(function(err) {
      if (err) {
        logger.error("housekeeping: Mainenance failed: " + err);
      }
      else {
        logger.info("housekeeping: Performed maintenance, nuking all stale responses older than " 
                    + self.cleanupInterval/1000 + " seconds.");
      }
      
      self._nextInterval();
    });
  },
  
  _nextInterval: function() {
    var interval = this.cleanupInterval > 60000? 'minutes' : 'seconds';
    logger.info('Next cleanup in %d %s'.grey, Math.round(this.cleanupInterval/(interval==='seconds'? 1000 : 60000)), interval);
    setTimeout(this._housekeeping.bind(this), this.cleanupInterval);
  }
};

exports.init = function(esc, reqPath, resPath, cleanupInterval) {
  new SearchQueue(esc, fbutil.fbRef(reqPath), fbutil.fbRef(resPath), cleanupInterval);
};
