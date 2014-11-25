
'use strict';

var S = require('string'),
_ = require('lodash'),
Fireproof = require('fireproof');

var fbutil = require('./fbutil');
var DynamicPathMonitor = require('./DynamicPathMonitor');
var NestedPathMonitor = require('./NestedPathMonitor');

var PAGE_SIZE = 500;

function PathMonitor(esc, path) {
  this.ref = fbutil.fbRef(path.path);
  console.log('Indexing %s/%s using path "%s"'.grey, path.index, path.type, fbutil.pathName(this.ref));
  this.esc = esc;
  
  this.index = path.index;
  this.type  = path.type;
  this.filter = path.filter || function() { return true; };
  this.parse  = path.parser || function(data) { return parseKeys(data, path.fields, path.omit); };
  
  this._init();
}
                           
PathMonitor.prototype = {
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
        console.log('got ' + snaps.length + ' snaps.');
        if (snaps.length > 0) {
          
          return self.esc.bulk({
            body: snaps.filter(function(s) { return self.filter(s.val()); })
              .map(function(snap) {
                lastKey = snap.name();
                lastPriority = snap.getPriority();
                return [
                  {
                    index: {
                      _index: self.index, 
                      _type: self.type, 
                      _id: snap.name(),
                      _source: true
                    }
                  },
                  self.parse(snap.val())
                ]
              })
              .reduce(function(a,b) { return a.concat(b); })
          })
          .then(function() {
            return nextPage();
          });

        }
        else {
          return { key: lastKey, priority: lastPriority };
        }

      });

    })();

  },

  _init: function() {
    var self = this;

    this._preloadExisting().then(function(cursor) {

      self.addListener = self.ref.startAt(cursor.priority, cursor.key)
        .on('child_added', self._process.bind(self, self._childAdded));
      self.changeListener = self.ref.startAt(cursor.priority, cursor.key)
        .on('child_changed', self._process.bind(self, self._childChanged));
      self.removeListener = self.ref.startAt(cursor.priority, cursor.key)
        .on('child_removed', self._process.bind(self, self._childRemoved));
      
      console.log("Flashlight initialized type " + self.type + "; " + fbutil.getListenerCount() + " listeners.");

    })
    .catch(function(err) {
      console.log("Could not preload existing data in firebase: " + err);
    });
  },

  _stop: function() {
    this.ref.off('child_added', this.addListener);
    this.ref.off('child_changed', this.changeListener);
    this.ref.off('child_removed', this.removeListener);
  },
  
  _process: function(fn, snap) {
    var dat = snap.val();
    if( this.filter(dat) ) {
      fn.call(this, snap.name(), this.parse(dat));
    }
  },
  
  _childAdded: function(key, data) {
    var name = nameFor(this, key);
    this.esc.index({
      index: this.index, 
      type: this.type, 
      id: key,
      body: data
    }).then( function(rsp) {
      console.log('indexed'.green, name);
    }).catch( function(err) {
      console.error('failed to index %s: %s'.red, name, err);
    });
  },
  
  _childChanged: function(key, data) {
    var name = nameFor(this, key);
    this.esc.index({
      index: this.index, 
      type: this.type, 
      id: key,
      body: data
    }).then( function(rsp) {
      console.log('updated'.cyan, name);
    }).catch( function(err) {
      console.error('failed to update %s: %s'.red, name, err);
    });
  },
  
  _childRemoved: function(key, data) {
    var name = nameFor(this, key);
    this.esc.delete({
      index: this.index, 
      type: this.type, 
      id: key, 
    }).then( function(rsp) {
      console.log('deleted'.cyan, name);
    }).catch( function(err) {
      console.error('failed to delete %s: %s'.red, name, err);
    });
  }
};



function nameFor(path, key) {
  return path.index + '/' + path.type + '/' + key;
}

function parseKeys(data, fields, omit) {
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
  };

  // restrict to specified fields list if supplied
  var outFields = ( Array.isArray(fields) && fields.length ? fields : Object.keys(data) );

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
}

exports.process = function(esc, paths, dynamicPathUrl) {
  paths && paths.forEach(function(pathProps) {
    if (pathProps.nested) {
      return new NestedPathMonitor(esc, pathProps);
    }
    else {
      return new PathMonitor(esc, pathProps);
    }
  });
  if (dynamicPathUrl) {
    new DynamicPathMonitor(fbutil.fbRef(dynamicPathUrl), function(pathProps) {
      return new PathMonitor(esc, pathProps);
    });
  }
};
