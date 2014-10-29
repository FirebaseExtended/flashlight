
var Firebase = require('firebase'),
Fireproof = require('fireproof'),
FirebaseTokenGenerator = require('firebase-token-generator'),
Q = require('q');
require('colors');

Fireproof.bless(Q);

exports.auth = function(url) {
  var deferred = Q.defer();
  console.log('Connecting to Firebase %s'.grey, url);

  var authToken = null;
  if (process.env.FIREBASE_AUTH_SECRET) {
    authToken = new FirebaseTokenGenerator(process.env.FIREBASE_AUTH_SECRET)
      .createToken({ 'uid': 'machine', 'machine': true }, function(err) {
        if (err) {
          deferred.reject('Could not authenticate: ' + err + '.  Check FIREBASE_AUTH_SECRET.');
        }
        else {
          console.log('Auth token granted based on valid firebase secret.');
          deferred.resolve(authToken);
        }
      });
  }
  else {
    console.log('FIREBASE_AUTH_SECRET not set.  Attempting writes without authentication.');
    deferred.resolve(authToken);
  }
};  

exports.fbRef = function(authToken, path) {
  var url = process.env.FIREBASE_URL;
  var s = url.match(/\/$/)? '' : '/';

  var fb = new Firebase(url + s + path);
  var fp = new Fireproof(fb);

  return fireproof.auth(authToken);
};

exports.pathName = function(ref) {
   var p = ref.parent().name();
   return (p? p+'/' : '')+ref.name();
};
