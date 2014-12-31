
var Firebase = require('firebase'),
   Fireproof = require('fireproof'),
   FirebaseTokenGenerator = require('firebase-token-generator'),
   Q = require('q'),
   logger = require('./logging').logger;

Fireproof.bless(Q);

var lastFBStats = null;

exports.auth = function(superuserMode) {
  var authToken = null;

  if (superuserMode && process.env.FIREBASE_AUTH_SECRET) {
    logger.info('Running in superuser mode: using FIREBASE_AUTH_SECRET directly.');
    authToken = process.env.FIREBASE_AUTH_SECRET;
  }
  else if (process.env.FIREBASE_AUTH_SECRET) {
    logger.info('Acquiring Firebase auth token');
    authToken = new FirebaseTokenGenerator(process.env.FIREBASE_AUTH_SECRET)
      .createToken({ 'uid': 'machine', 'machine': true });
  }
  else {
    logger.info('FIREBASE_AUTH_SECRET not set.  Attempting writes without authentication.');
  }

  setInterval(function() {
    var stats = Fireproof.stats.getCounts();
    logger.info('Firebase loading stats: ' + JSON.stringify(stats) + ' since restart.');

    if (lastFBStats !== null) {
      var delta = {};
      Object.keys(stats).forEach( function(k) {
        delta[k] = stats[k] - lastFBStats[k];
      });

      logger.info('Firebase loading stats: ' + JSON.stringify(delta) + ' per minute.');
    }

    lastFBStats = stats;
  }, 60000);

  return new Fireproof(new Firebase(process.env.FIREBASE_URL)).authWithCustomToken(authToken);
};  

exports.fbRef = function(path) {
  var url = process.env.FIREBASE_URL;
  var s = url.match(/\/$/) ? '' : '/';

  return new Fireproof(new Firebase(url + s + path));
};

exports.pathName = function(ref) {
   var p = ref.parent().name();
   return (p ? p + '/' : '')+ref.name();
};

exports.getListenerCount = function() {
  return Fireproof.stats.getListenerCount();
};
