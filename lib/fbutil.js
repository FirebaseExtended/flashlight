
var Firebase = require('firebase'),
   Fireproof = require('fireproof'),
   FirebaseTokenGenerator = require('firebase-token-generator'),
   Q = require('q'),
   logger = require('./logging').logger;

require('colors');

Fireproof.bless(Q);

exports.auth = function() {
  var authToken = null;

  if (process.env.SUPERUSER_MODE && process.env.FIREBASE_AUTH_SECRET) {
    logger.info('Running in superuser mode: using FIREBASE_AUTH_SECRET directly.');
    authToken = process.env.FIREBASE_AUTH_SECRET;
  }
  else if (process.env.FIREBASE_AUTH_SECRET) {
    logger.info('Acquiring Firebase auth token'.grey);
    authToken = new FirebaseTokenGenerator(process.env.FIREBASE_AUTH_SECRET)
      .createToken({ 'uid': 'machine', 'machine': true });
  }
  else {
    logger.info('FIREBASE_AUTH_SECRET not set.  Attempting writes without authentication.');
  }

  return new Firebase(process.env.FIREBASE_URL).auth(authToken);
};  

exports.fbRef = function(path) {
  var url = process.env.FIREBASE_URL;
  var s = url.match(/\/$/) ? '' : '/';

  var fb = new Firebase(url + s + path);
  var fp = new Fireproof(fb);

  return fp;
};

exports.pathName = function(ref) {
   var p = ref.parent().name();
   return (p ? p + '/' : '')+ref.name();
};

exports.getListenerCount = function(ref) {
  return Fireproof.stats.getListenerCount();
};
