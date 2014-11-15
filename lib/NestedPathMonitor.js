
var fbutil = require('./fbutil');

function NestedPathMonitor(esc, path) {
  this.ref = fbutil.fbRef(path.path);
  console.log('Indexing %s/%s using path "%s"'.grey, path.index, path.type, fbutil.pathName(this.ref));
  this.esc = esc;
  
  this.index = path.index;
  this.type = path.type;
  this.parentType = path.nested.parentType;
  this.parentField = path.nested.parentField;
  this.childIdField = path.nested.childIdField || "id";
  this.filter = path.filter || function() { return true; };
  this.parse  = path.parser;// || function(data) { return parseKeys(data, path.fields, path.omit); };
  
  this._init();
}

NestedPathMonitor.prototype = {
  _init: function() {
    this.addListener = this.ref.on('child_added', this._process.bind(this, this._childUpsert));
    this.changeListener = this.ref.on('child_changed', this._process.bind(this, this._childUpsert));
    
    console.log("Flashlight initialized type " + this.type + "; " + fbutil.getListenerCount() + " listeners.");
  },

  _stop: function() {
    this.ref.off('child_added', this.addListener);
    this.ref.off('child_changed', this.changeListener);
  },

  _process: function(fn, snap) {
    var dat = snap.exportVal();
    if( this.filter(dat) ) {
      fn.call(this, snap.name(), this.parse(dat));
    }
  },

  _childUpsert: function(key, data) {
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
        console.log('updated'.cyan, nameFor(self, key));
      }).catch( function(err) {
        console.error('failed to update %s: %s'.red, nameFor(self, key), err);
      });
    }).catch( function(err) {
      console.log("Could not index " + self.type + ": " + err);
    });
  }
};  

function nameFor(path, key) {
  return path.index + '/' + path.type + '/' + key;
}

module.exports = NestedPathMonitor;
