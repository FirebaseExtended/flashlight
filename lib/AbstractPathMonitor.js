
'use strict';

var S = require('string'),
   _ = require('lodash'),
   Q = require('q'),
   Fireproof = require('fireproof'),
   fbutil = require('./fbutil'),
   logger = require('./logging').logger;

var PAGE_SIZE = 500;

function AbstractPathMonitor(esc, path) {
  this.ref = fbutil.fbRef(path.path);
  logger.info('Indexing %s/%s using path "%s"', path.index, path.type, fbutil.pathName(this.ref));
  this.esc = esc;
  
  this.index = path.index;
  this.type  = path.type;
  this.filter = path.filter || function() { return true; };
  this.parse  = path.parser || function(data) { return this._parseKeys(data, path.fields, path.omit); };
  
  this._init();
}

AbstractPathMonitor.prototype = {
  _preloadExisting: function() {
    var pager;
    var self = this;

    var lastKey = null;
    var lastPriority = null;

    return (function nextPage() {

      var promise;
      if (!pager) {
        pager = new Fireproof.Pager(self.ref, PAGE_SIZE);
        promise = pager;
      } else {
        promise = pager.next(PAGE_SIZE);
      }
      
      return promise.then(function(snaps) {
        logger.info('got ' + snaps.length + ' snaps.');
        if (snaps.length > 0) {

          // This is much gnarlier than I wish it were; we first resolve
          // the promises on parse() (requried for a use case involving
          // dereferencing blobs stored in s3), and then bundle all the 
          // parsed snaps into the elasticsearch.bulk() call.
          return Q.all(
            snaps.filter(function(s) { return self.filter(s.val()); })
              .map(function(snap) {
                lastKey = snap.name();
                lastPriority = snap.getPriority();
                return self.parse( snap.val() ).then( function(value) {
                  return { id: snap.name(), value: value };
                })
              })
          ).then( function(parsed) {
          
            return self.esc.bulk({
              body: parsed.map( function(p) {
                return [
                  {
                    index: {
                      _index: self.index, 
                      _type: self.type, 
                      _id: p.id, 
                      _source: true
                    }
                  },
                  p.value
                ]
              }).reduce(function(a,b) { return a.concat(b); })
            }).then(function() {
              return nextPage();
            });

          });

        }
        else {
          return { key: lastKey, priority: lastPriority };
        }

      });

    })();

  },

  _init: function() {
    // empty for abstract class.
  },

  _stop: function() {
    // empty because no listeners in abstract class.
  },
  
  _process: function(fn, snap) {
    var dat = snap.val();
    var self = this;

    if( self.filter(dat) ) {
      self.parse(dat).then( function(parsed) {
        fn.call(self, snap.name(), parsed);
      });
    }
  },
  
  _nameFor: function(key) {
    return this.index + '/' + this.type + '/' + key;
  },

  _parseKeys: function(data, fields, omit) {
    if (!data || typeof(data)!=='object') {
      return data;
    }
    
    var simpleSanitize = function(value) {
      if (typeof(value)==='object') {
        // Test to see if we have an "array" containing key: true refs
        var isPseudoArray = Object.keys(value).map(function(k) {
          return value[k];
        }).reduce(function(a,b) { return (a===true) && (b===true); }, true);
        
        return ( isPseudoArray ? _.keys(value) : value );
      }
      else if (typeof(value)==='string') {
        return S(value).stripTags().s;
      }
      else {
        return value;
      }
    }
    
    // restrict to specified fields list if supplied
    var outFields = ( Array.isArray(fields) && fields.length ? fields : Object.keys(data) );
    
    return Q.try( function() {
      var out = {};
      outFields.forEach(function(f) {
        if( data.hasOwnProperty(f) ) {
          out[f] = simpleSanitize(data[f]);
        }
      });
      // remove omitted fields
      if( Array.isArray(omit) && omit.length) {
        omit.forEach(function(f) {
          if( out.hasOwnProperty(f) ) {
            delete out[f];
          }
        });
      }
      return out;
    });
  }
};

module.exports = AbstractPathMonitor;
