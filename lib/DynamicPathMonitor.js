var fbutil = require('./fbutil');

function DynamicPathMonitor(ref, factory) {
  console.log('Dynamic monitoring started', ref.toString());
  this.factory = factory;
  this.paths = {}; // store instance of monitor, so we can unset it if the value changes
  ref.on('child_added', this._add.bind(this));
  ref.on('child_changed', this._change.bind(this));
  ref.on('child_removed', this._remove.bind(this));
}

DynamicPathMonitor.prototype = {
  _add: function(snap) {
    var name = snap.key;
    var pathProps = snap.val();
    if ( isValidPath(pathProps) ) {
      this.paths[name] = this.factory(pathProps);
      console.log('Monitoring dynamic index %s (%s/%s at path %s)'.blue, name, pathProps.index, pathProps.type, pathProps.path);
    }
    else {
      console.error('Invalid dynamic path fetched from db. Most be an object with index, type, and path attributes.', name, pathProps);
    }
  },
  _remove: function(snap) {
    this._purge(snap.key);
  },
  _change: function(snap) {
    var name = snap.key;
    this._purge(name);
    this._add(snap);
  },
  _purge: function(name) {
    // kill old monitor
    if (this.paths[name]) {
      var path = this.paths[name];
      this.paths[name]._stop();
      this.paths[name] = null;
      console.log('Stopped monitoring dynamic index %s (%s/%s at path %s)'.blue, name, path.index, path.type, fbutil.pathName(path.ref));
    }
  }
};

function isValidPath(props) {
  return props && typeof(props) === 'object' && props.index && props.path && props.type;
}

module.exports = DynamicPathMonitor;
