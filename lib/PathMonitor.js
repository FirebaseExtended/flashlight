var fbutil = require('./fbutil');
var DynamicPathMonitor = require('./DynamicPathMonitor');
require('colors');

function PathMonitor(esc, path) {
	this.ref = fbutil.fbFullRef(path.endpoint);
	if (fbutil.isFunction(path.refBuilder)) {
		this.ref = path.refBuilder(this.ref, path);
	}
	console.log('Indexing %s/%s from DB "%s"'.green, path.index, path.type, fbutil.pathName(this.ref));
	this.esc = esc;

	this.index = path.index || path.key.toLowerCase();
	this.type = path.type || path.connectorId.toLowerCase();
	this.filter = path.filter || function () {
		return true;
	};
	this.parse = path.parser || function (data) {
		return parseKeys(data, path.fields, path.omit);
	};

	//create not existent indexes
	var idx = {
		index: this.index,
		type: this.type,
		path: this.type
	};
	esc.indices.exists(idx, function (err, exists) {
		console.log('index exists? ', exists);

		if (!exists) {
			console.log('creating missing indexes....', idx);
			esc.indices.create(idx, function (err, success) {
				console.error(err);
				console.log(success);
			});
		}
	});

	this._init();
}

PathMonitor.prototype = {
	_init: function () {
		this.addMonitor = this.ref.on('child_added', this._process.bind(this, this._childAdded));
		this.changeMonitor = this.ref.on('child_changed', this._process.bind(this, this._childChanged));
		this.removeMonitor = this.ref.on('child_removed', this._process.bind(this, this._childRemoved));
	},

	_stop: function () {
		this.ref.off('child_added', this.addMonitor);
		this.ref.off('child_changed', this.changeMonitor);
		this.ref.off('child_removed', this.removeMonitor);
	},

	_process: function (fn, snap) {
		var dat = snap.val();
		if (this.filter(dat)) {
			fn.call(this, snap.key, this.parse(dat));
		}
	},

	_index: function (key, data, callback) {
		this.esc.index({
			index: this.index,
			type: this.type,
			id: key,
			body: data
		}, function (error, response) {
			if (callback) {
				callback(error, response);
			}
		}.bind(this));
	},

	_childAdded: function (key, data) {
		var name = nameFor(this, key);
		this._index(key, data, function (error, response) {
			if (error) {
				console.error('failed to index %s: %s'.red, name, error);
			} else {
				console.log('indexed'.green, name);
			}
		}.bind(this));
	},

	_childChanged: function (key, data) {
		var name = nameFor(this, key);
		this._index(key, data, function (error, response) {
			if (error) {
				console.error('failed to update %s: %s'.red, name, error);
			} else {
				console.log('updated'.green, name);
			}
		}.bind(this));
	},

	_childRemoved: function (key, data) {
		var name = nameFor(this, key);
		this.esc.delete({
			index: this.index,
			type: this.type,
			id: key
		}, function (error, data) {
			if (error) {
				console.error('failed to delete %s: %s'.red, name, error);
			} else {
				console.log('deleted'.cyan, name);
			}
		}.bind(this));
	}
};

function nameFor(path, key) {
	return path.index + '/' + path.type + '/' + key;
}

function parseKeys(data, fields, omit) {
	if (!data || typeof (data) !== 'object') {
		return data;
	}
	var out = data;
	// restrict to specified fields list
	if (Array.isArray(fields) && fields.length) {
		out = {};
		fields.forEach(function (f) {
			if (data.hasOwnProperty(f)) {
				out[f] = data[f];
			}
		});
	}
	// remove omitted fields
	if (Array.isArray(omit) && omit.length) {
		omit.forEach(function (f) {
			if (out.hasOwnProperty(f)) {
				delete out[f];
			}
		});
	}
	return out;
}

exports.process = function (esc, paths) {
	if (fbutil.isString(paths)) {
		var ref = fbutil.fbRef(paths);
		ref.on('child_added', dispatchDynamicPaths);

		// ref.on('child_added', function (snap) {
		// 	console.log('looking for integration for user: ' + snap.key);
		// 	ref.child(snap.key)
		// 		.on('child_added', dispatchDynamicPaths);
		// });

	} else if (fbutil.isObject(paths) && paths.length) {
		paths.forEach(function (pathProps) {
			new PathMonitor(esc, pathProps);
		});
	} else {
		console.warn("No paths have been specified to index".yellow);
	}

	function dispatchDynamicPaths(snap) {
		console.log('trying to monitor', snap.key);
		new DynamicPathMonitor(snap.ref, function (pathProps) {
			return new PathMonitor(esc, pathProps);
		});
	}
};
