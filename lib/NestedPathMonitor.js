
'use strict';

var fbutil = require('./fbutil'),
  logger = require('./logging').logger,
  AbstractPathMonitor = require('./AbstractPathMonitor');

function NestedPathMonitor(esc, path) {
  this.parentType = path.nested.parentType;
  this.parentField = path.nested.parentField;
  this.childIdField = path.nested.childIdField || "id";

  AbstractPathMonitor.call(this, esc, path);
}

NestedPathMonitor.prototype = Object.create(AbstractPathMonitor.prototype);
NestedPathMonitor.prototype.constructor = NestedPathMonitor;

NestedPathMonitor.prototype._init = function() {
  var self = this;

  this._preloadExisting().then(function(cursor) {

    self.addListener = self.ref.on('child_added', self._process.bind(self, self._childUpsert));
    self.changeListener = self.ref.on('child_changed', self._process.bind(self, self._childUpsert));
  
    logger.info("Flashlight initialized type " + self.type + "; " + fbutil.getListenerCount() + " listeners.");
  })
  .catch(function(err) {
    logger.error("could not preload existing data in firebase: " + err);
  });
};

NestedPathMonitor.prototype._stop = function() {
  this.ref.off('child_added', this.addListener);
  this.ref.off('child_changed', this.changeListener);
};

NestedPathMonitor.prototype._childUpsert = function(key, data) {
  var self = this;
  self.esc.get({
    index: self.index,
    type: self.parentType,
    id: key,
    _source_include: [ self.parentField ]
  }).then( function(rsp) {
    // Because we have to re-index the parent doc, we want to include
    // any existing nested elements.
    var refreshed = rsp._source[self.parentField];
    var allIds = refreshed.map( function(c) { 
      return c[self.childIdField];
    });
    // Overwrite the returned result set with any changed contents
    // of the snap.  Add any new additions.  There is not presently
    // a way to identify deletions.
    data.forEach( function(d) {
      var idx = allIds.indexOf( d[self.childIdField] );
      if (idx >= 0) {
        refreshed[idx] = d;
      }
      else {
        refreshed.push( d );
      }
    });
    // Then write the refreshed list of nested elements into the parent
    // doc as an "update".
    var updateObj = {
      index: self.index, 
      type: self.parentType, 
      id: key,
      body: {
        doc: { }
      }
    };
    updateObj.body.doc[self.parentField] = refreshed;
    self.esc.update(updateObj).then( function(rsp) {
      logger.debug('updated', self._nameFor(key));
    }).catch( function(err) {
      logger.error('failed to update %s: %s', self._nameFor(key), err);
    });
  }).catch( function(err) {
    logger.error("Could not index " + self.type + ": " + err);
  });
};

module.exports = NestedPathMonitor;
