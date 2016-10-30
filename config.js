/**
 * This config file is provided as a convenience for development. You can either
 * set the environment variables on your server or modify the values here.
 *
 * At a minimum, you must set FB_URL and Paths to Monitor. Everything else is optional, assuming your
 * ElasticSearch server is at localhost:9200.
 */

/** Firebase Settings
 ***************************************************/

// Your Firebase instance where we will listen and write search results
exports.FB_URL   = 'https://sat2-prod.firebaseio.com/';

// The path in your Firebase where clients will write search requests
exports.FB_REQ   = process.env.FB_REQ || 'search/request';

// The path in your Firebase where this app will write the results
exports.FB_RES   = process.env.FB_RES || 'search/response';

// See https://firebase.google.com/docs/server/setup. for how to
// auto-generate this config json ...
exports.FB_SERVICEACCOUNT = 'sat2-prod-827018bef8b8.json';

/** ElasticSearch Settings
 *********************************************/

if( process.env.BONSAI_URL ) {
   processBonsaiUrl(exports, process.env.BONSAI_URL);
}
else {
   // ElasticSearch server's host URL
   // exports.ES_HOST  = process.env.ES_HOST || 'banyan-9927252.us-east-1.bonsai.io';
   exports.ES_HOST  = process.env.ES_HOST || 'znk-dev-6994146845.us-east-1.bonsai.io';
   // https://4ycuwepq0x:ppu4kc3yfl@znk-dev-6994146845.us-east-1.bonsai.io

   // ElasticSearch server's host port
   exports.ES_PORT  = process.env.ES_PORT || '9200';

   // ElasticSearch username for http auth
   exports.ES_USER  = process.env.ES_USER || '4ycuwepq0x';

   // ElasticSearch password for http auth
   exports.ES_PASS  = process.env.ES_PASS || 'ppu4kc3yfl';
}


/** Paths to Monitor
 *
 * Each path can have these keys:
 * {string}   path:    [required] the Firebase path to be monitored, for example, `users/profiles`
 *                     would monitor https://<instance>.firebaseio.com/users/profiles
 * {string}   index:   [required] the name of the ES index to write data into
 * {string}   type:    [required] name of the ES object type this document will be stored as
 * {Array}    fields:  list of fields to be monitored and indexed (defaults to all fields, ignored if "parser" is specified)
 * {Array}    omit:    list of fields that should not be indexed in ES (ignored if "parser" is specified)
 * {Function} filter:  if provided, only records that return true are indexed
 * {Function} parser:  if provided, the results of this function are passed to ES, rather than the raw data (fields is ignored if this is used)
 *
 * To store your paths dynamically, rather than specifying them all here, you can store them in Firebase.
 * Format each path object with the same keys described above, and store the array of paths at whatever
 * location you specified in the FB_PATHS variable. Be sure to restrict that data in your Security Rules.
 ****************************************************/

exports.paths = [
   {
      path:  "users",
      index: "userprofile",
      type:  "user",
      fields: ["profile.email","profile.nickname"]
   }
   // {
   //    path:  "invitations",
   //    index: "firebase",
   //    type:  "invitation",
   //    fields: ['receiverAppName', 'senderAppName', 'senderUid', 'invitationId']
   // }
];

// Paths can also be stored in Firebase and loaded using FB_PATHS!
exports.FB_PATH = process.env.FB_PATHS || null;


/** Config Options
 ***************************************************/

// How often should the script remove unclaimed search results? probably just leave this alone
exports.CLEANUP_INTERVAL = 3600*1000;
   // process.env.NODE_ENV === 'production'?
   //    3600*1000 /* once an hour */ :
   //    60*1000 /* once a minute */;

function processBonsaiUrl(exports, url) {
   var matches = url.match(/^https?:\/\/([^:]+):([^@]+)@([^/]+)\/?$/);
   exports.ES_HOST = matches[3];
   exports.ES_PORT = 80;
   exports.ES_USER = matches[1];
   exports.ES_PASS = matches[2];
   console.log('Configured using BONSAI_URL environment variable', url, exports);
}
