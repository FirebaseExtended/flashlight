var DynamicPathMonitor = require('./DynamicPathMonitor');
require('colors');

function PathMonitor(path, fbutil, workerClient) {
    this.fbutil = fbutil;
    this.workerClient = workerClient;
    this.ref = fbutil.fbRef(path.path);
    this.index = path.index;
    this.type = path.type;
    this.filter = path.filter || function () { return true; };
    this.parse = path.parser || function (data) { return parseKeys(data, path.fields, path.omit) };

    if (fbutil.isFunction(path.refBuilder)) {
        this.ref = path.refBuilder(this.ref, path);
    }

    this._init();
}

PathMonitor.prototype = {
    _init: function () {
        this.addMonitor = this.ref.on('child_added', this._process.bind(this, this._childAdded, 'add'));
        this.changeMonitor = this.ref.on('child_changed', this._process.bind(this, this._childChanged, 'update'));
        this.removeMonitor = this.ref.on('child_removed', this._process.bind(this, this._childRemoved, 'remove'));
    },

    _stop: function () {
        this.ref.off('child_added', this.addMonitor);
        this.ref.off('child_changed', this.changeMonitor);
        this.ref.off('child_removed', this.removeMonitor);
    },

    _process: function(fn, type, snap) {
        var data = snap.val();

        if (this.filter(data)) {
            this.parse(data, type)
                .then(function (parsedData) {
                    fn.call(this, parsedData.id, parsedData);
                }.bind(this));
        }
    },

    _index: function (key, data, callback) {
        this.workerClient.addToQueue('jobs.index', {
            action: 'add',
            data: {
                index: this.index,
                type: this.type,
                id: key,
                body: data
            }
        });

        if (callback) {
            callback();
        }
    },

    _childAdded: function (key, data) {
        var name = nameFor(this, key);
        this._index(key, data, function (error, response) {
            if (error) {
                console.error('failed to index %s: %s'.red, name, error);
            }
        }.bind(this));
    },

    _childChanged: function (key, data) {
        var name = nameFor(this, key);
        this._index(key, data, function (error, response) {
            if (error) {
                console.error('failed to update %s: %s'.red, name, error);
            }
        }.bind(this));
    },

    _childRemoved: function (key, data) {
        this.workerClient.addToQueue('jobs.index', {
            action: 'remove',
            data: {
                index: this.index,
                type: this.type,
                id: key
            }
        });
    }
};

function nameFor(path, key) {
    return path.index + '/' + path.type + '/' + key;
}

function parseKeys(data, fields, omit) {
    if (!data || typeof(data) !== 'object') {
        return Promise.resolve(data);
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

    return Promise.resolve(out);
}

exports.process = function (paths, fbutil, workerClient) {
    if (fbutil.isObject(paths) && paths.length) {
        paths.forEach(function (pathProps) {
            new PathMonitor(pathProps, fbutil, workerClient);
        });
    } else {
        console.warn("No paths have been specified to index".yellow);
    }
};
