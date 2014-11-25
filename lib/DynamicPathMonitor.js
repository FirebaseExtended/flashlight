var logger = require('./logging').logger;

function DynamicPathMonitor(ref, factory) {
  this.factory = factory;
  this.paths = {}; // store instance of monitor, so we can unset it if the value changes
  ref.on('child_added', this._add.bind(this));
  ref.on('child_changed', this._change.bind(this));
  ref.on('child_removed', this._remove.bind(this));
}

DynamicPathMonitor.prototype = {
  _add: function(snap) {
    var name = snap.name();
    var pathProps = snap.val();
    if ( isValidPath(pathProps) ) {
      this.paths[name] = this.factory(pathProps);
      logger.info('Monitoring dynamic index'.green, name, pathProps);
    }
  },
  _remove: function(snap) {
    var name = snap.name();
    var pathProps = snap.val();
    // kill old monitor
    if (this.paths[name]) {
      this.paths[name]._stop();
      this.paths[name] = null;
      logger.info('Stopped monitoring dynamic index'.red, name, pathProps);
    }
  },
  _change: function(snap) {
    var name = snap.name();
    var pathProps = snap.val();
    // kill old monitor
    if (this.paths[name]) {
      this.paths[name]._stop();
      this.paths[name] = null;
      logger.info('Stopped monitoring dynamic index'.red, name, pathProps);
    }
    // create new monitor
    if ( pathProps !== null && pathProps.index && pathProps.path && pathProps.type ) {
      this.paths[name] = this.factory(pathProps);
      logger.info('Monitoring dynamic index'.green, name, pathProps);
    }
  }
};

function isValidPath(props) {
  return props && typeof(props) === 'object' && props.index && props.path && props.type;
}

module.exports = DynamicPathMonitor;
