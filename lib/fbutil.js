var Fbutil = function (firebase) {
    this.firebase = firebase;
};

Fbutil.prototype = {
    fbRef: function(path) {
        return this.firebase.database().ref().child(path);
    },

    pathName: function(ref) {
        var p = ref.parent.key;
        return (p? p+'/' : '')+ref.key;
    },

    isString: function(s) {
        return typeof s === 'string';
    },

    isObject: function(o) {
        return o && typeof o === 'object';
    },

    unwrapError: function(err) {
        if( err && typeof err === 'object' ) {
            return err.toString();
        }
        return err;
    },

    isFunction: function(f) {
        return typeof f === 'function';
    }
};


module.exports = Fbutil;
