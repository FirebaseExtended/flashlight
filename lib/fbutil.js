
var Firebase = require('firebase'),
Fireproof = require('fireproof'),
FirebaseTokenGenerator = require('firebase-token-generator'),
Q = require('q');
require('colors');

Fireproof.bless(Q);

exports.auth = function() {
  var deferred = Q.defer();

  var authToken = process.env.FIREBASE_AUTH_SECRET; //null;
  /*if (process.env.FIREBASE_AUTH_SECRET) {
    console.log('Acquiring Firebase auth token'.grey);
    authToken = new FirebaseTokenGenerator(process.env.FIREBASE_AUTH_SECRET)
      .createToken({ 'uid': 'machine', 'machine': true });
  }
  else {
    console.log('FIREBASE_AUTH_SECRET not set.  Attempting writes without authentication.');
  }*/

  new Firebase(process.env.FIREBASE_URL).auth(authToken, function(err) {
    if (err) {
      deferred.reject("Auth failed: " + err);
    }
    else {
      deferred.resolve();
    }
  });

  return deferred.promise;
};  

exports.fbRef = function(path) {
  var url = process.env.FIREBASE_URL;
  var s = url.match(/\/$/)? '' : '/';

  var fb = new Firebase(url + s + path);
  var fp = new Fireproof(fb);

  return fp;
};

exports.pathName = function(ref) {
   var p = ref.parent().name();
   return (p? p+'/' : '')+ref.name();
};

exports.getListenerCount = function(ref) {
  return Fireproof.stats.getListenerCount();
};
