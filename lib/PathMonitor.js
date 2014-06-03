
var D = require('JQDeferred');
var fbutil = require('./fbutil');
var _ = require('underscore');

function PathMonitor(esc, firebaseUrl, path) {
   this.ref = fbutil.fbRef(firebaseUrl, path.path);
   console.log('Indexing %s/%s using path "%s"'.grey, path.index, path.type, fbutil.pathName(this.ref));
   this.esc = esc;

   this.index = path.index;
   this.type  = path.type;
   this.fields = path.fields;
   this.filter = path.filter || function() { return true; };
   this.parse  = path.parse || function(data) { return data; };

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
      var dat = snap.val();
      if (this.fields && typeof dat === 'object') {
         dat = _.pick.call(_, dat, this.fields);
      }
      if( this.filter(dat) ) {
         fn.call(this, snap.name(), this.parse(dat));
      }
   },

   _childAdded: function(key, data) {
      var name = nameFor(this, key);
      this.esc.index(this.index, this.type, data, key)
         .on('data', function(data) {
            console.log('indexed'.green, name);
         })
         .on('error', function(err) {
            console.error('failed to index %s: %s'.red, name, err);
         })
         .exec();
   },

   _childChanged: function(key, data) {
      var name = nameFor(this, key);
      this.esc.index(this.index, this.type, data, key)
         .on('data', function(data) {
            console.log('updated'.cyan, name);
         })
         .on('error', function(err) {
            console.error('failed to update %s: %s'.red, name, err);
         })
         .exec();
   },

   _childRemoved: function(key, data) {
      var name = nameFor(this, key);
      this.esc.deleteDocument(this.index, this.type, key, function(error, data) {
         if( error ) {
            console.error('failed to delete %s: %s'.red, name, error);
         }
         else {
            console.log('deleted'.cyan, name);
         }
      })
   }
};

function nameFor(path, key) {
   return path.index + '/' + path.type + '/' + key;
}

exports.process = function(esc, firebaseUrl, paths, dynamicPaths) {
   paths && paths.forEach(function(pathProps) {
      new PathMonitor(esc, firebaseUrl, pathProps);
   });
   if (dynamicPaths) {
      var dynPaths = {}; // store instance of monitor, so we can unset it if the value changes
      var dynRef = fbutil.fbRef(firebaseUrl, dynamicPaths);
         dynRef.on('child_added', function(snap) {
            var name = snap.name();
            var pathProps = snap.val();
            if ( pathProps !== null && pathProps.index && pathProps.path && pathProps.type ) {
               dynPaths[name] = new PathMonitor(esc, firebaseUrl, pathProps);
               console.log('Monitoring dynamic index'.green, name, pathProps); 
            }
         });
         dynRef.on('child_changed', function(snap) {
            var name = snap.name();
            var pathProps = snap.val();
            // kill old monitor
            if (dynPaths[name]) {
               dynPaths[name]._stop();
               dynPaths[name] = null;
               console.log('Stopped monitoring dynamic index'.red, name, pathProps); 
            }
            // create new monitor
            if ( pathProps !== null && pathProps.index && pathProps.path && pathProps.type ) {
               dynPaths[name] = new PathMonitor(esc, firebaseUrl, pathProps);
               console.log('Monitoring dynamic index'.green, name, pathProps); 
            }
         });
         dynRef.on('child_removed', function(snap) {
            var name = snap.name();
            var pathProps = snap.val();
            // kill old monitor
            if (dynPaths[name]) {
               dynPaths[name]._stop();
               dynPaths[name] = null;
               console.log('Stopped monitoring dynamic index'.red, name, pathProps); 
            }
         });
   }
};
