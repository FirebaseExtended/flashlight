'use strict';

var admin = require('firebase-admin');
require('colors');

exports.init = function(databaseURL, serviceAccount) {
   var config = {
     databaseURL: databaseURL,
     credential: admin.credential.cert(serviceAccount)
   };
   admin.initializeApp(config)
};

exports.fbRef = function(path) {
   return admin.database().ref().child(path);
};

exports.pathName = function(ref) {
   var p = ref.parent;
   return (p? p.key+'/' : '')+ref.key;
};

exports.isString = function(s) {
  return typeof s === 'string';
};

exports.isObject = function(o) {
  return o && typeof o === 'object';
};

exports.unwrapError = function(err) {
  if( err && typeof err === 'object' ) {
    return err.toString();
  }
  return err;
};

exports.isFunction = function(f) {
  return typeof f === 'function';
};
