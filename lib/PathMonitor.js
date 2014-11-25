
'use strict';

var S = require('string');
var _ = require('lodash');

var fbutil = require('./fbutil');
var DynamicPathMonitor = require('./DynamicPathMonitor');
var NestedPathMonitor = require('./NestedPathMonitor');
var logger = require('./logging').logger;

function PathMonitor(esc, path) {
  this.ref = fbutil.fbRef(path.path);
  logger.info('Indexing %s/%s using path "%s"'.grey, path.index, path.type, fbutil.pathName(this.ref));
  this.esc = esc;
  
  this.index = path.index;
  this.type  = path.type;
  this.filter = path.filter || function() { return true; };
  this.parse  = path.parser || function(data) { return parseKeys(data, path.fields, path.omit); };
  
  this._init();
}

PathMonitor.prototype = {
  _init: function() {
    this.addListener = this.ref.on('child_added', this._process.bind(this, this._childAdded));
    this.changeListener = this.ref.on('child_changed', this._process.bind(this, this._childChanged));
    this.removeListener = this.ref.on('child_removed', this._process.bind(this, this._childRemoved));
    
    logger.info("Flashlight initialized type " + this.type + "; " + fbutil.getListenerCount() + " listeners.");
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
      logger.debug('indexed'.green, name);
    }).catch( function(err) {
      logger.error('failed to index %s: %s'.red, name, err);
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
      logger.debug('updated'.cyan, name);
    }).catch( function(err) {
      logger.error('failed to update %s: %s'.red, name, err);
    });
  },
  
  _childRemoved: function(key, data) {
    var name = nameFor(this, key);
    this.esc.delete({
      index: this.index, 
      type: this.type, 
      id: key, 
    }).then( function(rsp) {
      logger.debug('deleted'.cyan, name);
    }).catch( function(err) {
      logger.error('failed to delete %s: %s'.red, name, err);
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
