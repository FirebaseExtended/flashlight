
var Firebase = require('firebase');
var D = require('JQDeferred');
require('colors');

exports.auth = function(url, token) {
   return D(function(def) {
      console.log('Connecting to Firebase %s'.grey, url);
      if( token ) {
         console.log('Authenticating with token %s...%s'.grey, token.substr(0,2), token.substr(token.length-2, 2));
         new Firebase(url).authWithCustomToken(token, function(err) {
            if( err ) {
               console.error('Invalid token, cannot auth to Firebase'.red);
               throw new Error('Invalid token, cannot auth to Firebase');
            }
            else {
               console.log('Authenticated'.grey);
               def.resolve();
            }
         })
      }
      else {
         console.log('No authentication token provided, skipping auth'.grey);
         def.resolve();
      }
   });
};

exports.fbRef = function(url, path) {
   var s = url.match(/\/$/)? '' : '/';
   return new Firebase(url + s + path);
};

exports.pathName = function(ref) {
   var p = ref.parent().key();
   return (p? p+'/' : '')+ref.key();
};
