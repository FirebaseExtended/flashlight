/**
 * This config file is provided as a convenience for development. You can either
 * set the environment variables on your server or modify the values here.
 *
 * At a minimum, you must set FB_URL and Paths to Monitor. Everything else is optional, assuming your
 * ElasticSearch server is at localhost:9200.
 */

var S = require('string');
var _ = require('lodash');

/** Firebase Settings
 ***************************************************/

// The path in your Firebase where clients will write search requests
exports.FB_REQ   = process.env.FB_REQ || 'search/request';

// The path in your Firebase where this app will write the results
exports.FB_RES   = process.env.FB_RES || 'search/response';

/** ElasticSearch Settings
 *********************************************/

exports.ELASTICSEARCH_URL = ( process.env.BONSAI_URL ? process.env.BONSAI_URL : "http://localhost:9200" );


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
    index: "firebase",
    type:  "users",
    omit: ["email", "welcomeEmailSent"]
  },
  {  
    path:  "annotations",
    index: "firebase",
    type:  "annotations"
  },
  { 
    path:  "communities",
    index: "firebase",
    type:  "communities",
    omit: ["featuredFollowers", "followers"]
  },
  {
    path:  "posts",
    index: "firebase",
    type:  "posts",
    omit: ["users"]
  },
  {
    path: "links",
    index: "firebase",
    type: "links"
  },
  {
    path: "wecite",
    index: "casetext",
    type: "wecites",
    nested: { 
      parentType: "document", 
      parentField: "wecites",
      parentOmit: "text",
      childIdField: "destinationDocId"
    },
    parser: function(data) {
      return Object.keys(data).map( function(d) {
        var retval = data[d];
        if (retval.edits) {
          delete retval.edits;
        }

        retval.destinationDocId = d;
        retval.description = retval.description ? S(retval.description).stripTags().s : null;
        
        return retval;
      });
    }
  }
];

// Paths can also be stored in Firebase and loaded using FB_PATHS!
exports.FB_PATH = process.env.FB_PATHS || null;


/** Config Options
 ***************************************************/

// How often should the script remove unclaimed search results? probably just leave this alone
exports.CLEANUP_INTERVAL =
   process.env.NODE_ENV === 'production'?
      3600*1000 /* once an hour */ :
      60*1000 /* once a minute */;

function processBonsaiUrl(exports, url) {
   var matches = url.match(/^https?:\/\/([^:]+):([^@]+)@([^:]+):([^/]+)\/?$/);
   exports.ES_HOST = matches[3];
   exports.ES_PORT = matches[4];
   exports.ES_USER = matches[1];
   exports.ES_PASS = matches[2];
   console.log('Configured using BONSAI_URL environment variable', url, exports);
}
