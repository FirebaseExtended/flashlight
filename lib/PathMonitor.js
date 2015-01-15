
'use strict';

var fbutil = require('./fbutil'),
   AbstractPathMonitor = require('./AbstractPathMonitor'),
   DynamicPathMonitor = require('./DynamicPathMonitor'),
   NestedPathMonitor = require('./NestedPathMonitor'),
   logger = require('./logging').logger;

function PathMonitor(esc, path) {
  AbstractPathMonitor.call(this, esc, path);
}

PathMonitor.prototype = Object.create(AbstractPathMonitor.prototype);
PathMonitor.prototype.constructor = PathMonitor;

PathMonitor.prototype._init = function() {
  var self = this;
  
  this._preloadExisting().then(function(cursor) {
    
    self.addListener = self.ref.startAt(cursor.priority, cursor.key)
      .on('child_added', self._process.bind(self, self._childAdded));
    self.changeListener = self.ref.on('child_changed', self._process.bind(self, self._childChanged));
    self.removeListener = self.ref.on('child_removed', self._process.bind(self, self._childRemoved));
    
    logger.info("flue initialized type " + self.type + "; " + fbutil.getListenerCount() + " listeners.");
    
  })
  .catch(function(err) {
    logger.error("Could not preload existing data in firebase: " + err);
  });
};

PathMonitor.prototype._stop = function() {
  this.ref.off('child_added', this.addListener);
  this.ref.off('child_changed', this.changeListener);
  this.ref.off('child_removed', this.removeListener);
};

PathMonitor.prototype._childAdded = function(key, data) {
  var name = this.nameFor(key);
  this.esc.index({
    index: this.index, 
    type: this.type, 
    id: key,
    body: data
  }).then( function(rsp) {
    logger.debug('indexed', name);
  }).catch( function(err) {
    logger.error('failed to index %s: %s', name, err);
  });
};
  
PathMonitor.prototype._childChanged = function(key, data) {
  var name = this.nameFor(key);
  this.esc.index({
    index: this.index, 
    type: this.type, 
    id: key,
    body: data
  }).then( function(rsp) {
    logger.debug('updated', name);
  }).catch( function(err) {
    logger.error('failed to update %s: %s', name, err);
  });
};
  
PathMonitor.prototype._childRemoved = function(key, data) {
  var name = this.nameFor(key);
  this.esc.delete({
    index: this.index, 
    type: this.type, 
    id: key, 
  }).then( function(rsp) {
    logger.debug('deleted', name);
  }).catch( function(err) {
    logger.error('failed to delete %s: %s', name, err);
  });
};

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
