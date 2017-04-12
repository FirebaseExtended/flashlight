
var fbutil = require('./fbutil');
var DynamicPathMonitor = require('./DynamicPathMonitor');
require('colors');

function PathMonitor(esc, path) {
   this.ref = fbutil.fbRef(path.path);

   console.log('Indexing %s/%s from DB "%s"'.grey, path.index, path.type, fbutil.pathName(this.ref));

   if( fbutil.isFunction(path.refBuilder) ) {
     this.ref = path.refBuilder(this.ref, path);
   }
 
   this.esc = esc;

   this.index = path.index;
   this.type  = path.type;
   this.filter = path.filter || function() { return true; };
   this.parse  = path.parser || function(data) { return parseKeys(data, path.fields, path.omit) };
   this.resolve = path.resolver || function(data, key) { return key; };

   this._init();
}

PathMonitor.prototype = {
   _init: function() {
      this.addMonitor = this.ref.on('child_added', this._process.bind(this, this._childAdded));
      this.changeMonitor = this.ref.on('child_changed', this._process.bind(this, this._childChanged));
      this.removeMonitor = this.ref.on('child_removed', this._process.bind(this, this._childRemoved));
   },

   _stop: function() {
      this.ref.off('child_added', this.addMonitor);
      this.ref.off('child_changed', this.changeMonitor);
      this.ref.off('child_removed', this.removeMonitor);
   },

   _process: function(fn, snap) {
      var dat = snap.val(),
        key = snap.key;
      if( this.filter(dat) ) {
         fn.call(this, this.resolve(dat, key), this.parse(dat, key));
      }
   },
   
   _index: function (key, data, callback) {
     this.esc.update({
      index: this.index,
      type: this.type,
      id: key,
      body: {
        doc: data,
        doc_as_upsert: true
      }
    }, function (error, response) {
      if (callback) {
        callback(error, response);
      }
    }.bind(this));
  },

   _childAdded: function(key, data) {
      var name = nameFor(this, key);
      this._index(key, data, function (error, response) {
        if (error) {
          console.error('failed to index %s: %s'.red, name, error);
        } else {
          console.log('indexed'.green, name);
        }
      }.bind(this));
   },

   _childChanged: function(key, data) {
      var name = nameFor(this, key);
      this._index(key, data, function (error, response) {
        if (error) {
          console.error('failed to update %s: %s'.red, name, error);
        } else {
          console.log('updated'.green, name);
        }
      }.bind(this));
   },

   _childRemoved: function(key, data) {
      var name = nameFor(this, key);
      this.esc.delete({
        index: this.index, 
        type: this.type, 
        id: key
      }, function(error, data) {
         if( error ) {
            console.error('failed to delete %s: %s'.red, name, error);
         }
         else {
            console.log('deleted'.cyan, name);
         }
      }.bind(this));
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
    })
  }
  // remove omitted fields
  if( Array.isArray(omit) && omit.length) {
    omit.forEach(function(f) {
      if( out.hasOwnProperty(f) ) {
        delete out[f];
      }
    })
  }
  return out;
}

exports.process = function(esc, paths) {
  if( fbutil.isString(paths) ) {
    new DynamicPathMonitor(fbutil.fbRef(paths), function(pathProps) {
      return new PathMonitor(esc, pathProps);
    });
  }
  else if( fbutil.isObject(paths) && paths.length ) {
    paths.forEach(function(pathProps) {
      new PathMonitor(esc, pathProps);
    });
  }
  else {
    console.warn("No paths have been specified to index".yellow);
  }
};
