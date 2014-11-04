
var fbutil = require('./fbutil');
var DynamicPathMonitor = require('./DynamicPathMonitor');

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
  _init: function() {
    this.addMonitor = this.ref.on('child_added', this._process.bind(this, this._childAdded));
    this.changeMonitor = this.ref.on('child_changed', this._process.bind(this, this._childChanged));
    this.removeMonitor = this.ref.on('child_removed', this._process.bind(this, this._childRemoved));
    
    console.log("Flashlight initialized with " + fbutil.getListenerCount());
  },

  _stop: function() {
    this.ref.off('child_added', this.addMonitor);
    this.ref.off('child_changed', this.changeMonitor);
    this.ref.off('child_removed', this.removeMonitor);
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
  var out = data;
  // restrict to specified fields list
  if( Array.isArray(fields) && fields.length) {
    out = {};
    fields.forEach(function(f) {
      if( data.hasOwnProperty(f) ) {
        out[f] = data[f];
      }
    });
  } 
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
    return new PathMonitor(esc, pathProps);
  });
  if (dynamicPathUrl) {
    new DynamicPathMonitor(fbutil.fbRef(dynamicPathUrl), function(pathProps) {
      return new PathMonitor(esc, pathProps);
    });
  }
};
