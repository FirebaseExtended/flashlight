/**
 * This config file is provided as a convenience for development. You can either
 * set the environment variables on your server or modify the values here.
 *
 * At a minimum, you must set FB_URL and Paths to Monitor. Everything else is optional, assuming your
 * ElasticSearch server is at localhost:9200.
 */

/** Firebase Settings
 ***************************************************/

var _ = require('lodash')
  , normalizers = require('./lib/normalizers');

// Your Firebase instance where we will listen and write search results
exports.FB_URL   = process.env.FB_URL || 'https://bb-app-sandbox.firebaseio.com/';

// The path in your Firebase where clients will write search requests
exports.FB_REQ   = process.env.FB_REQ || 'search/request';

// The path in your Firebase where this app will write the results
exports.FB_RES   = process.env.FB_RES || 'search/response';

// See https://firebase.google.com/docs/server/setup for instructions
// to auto-generate the service-account.json file
exports.FB_SERVICEACCOUNT = process.env.FB_PROJECT_ID ? {
  projectId: process.env.FB_PROJECT_ID,
  clientEmail: process.env.FB_CLIENT_EMAIL,
  privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n')
} : 'service-account.json';

/** ElasticSearch Settings
 *********************************************/

if( process.env.ES_URL ) {
  processESUrl(exports, process.env.ES_URL);
}
else {
  // ElasticSearch server's host URL
  exports.ES_HOST  = process.env.ES_HOST || 'localhost';

  // ElasticSearch server's host port
  exports.ES_PORT  = process.env.ES_PORT || '9200';

  // ElasticSearch username for http auth
  exports.ES_USER  = process.env.ES_USER || null;

  // ElasticSearch password for http auth
  exports.ES_PASS  = process.env.ES_PASS || null;
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
 * {Function} refBuilder: see README
 *
 * To store your paths dynamically, rather than specifying them all here, you can store them in Firebase.
 * Format each path object with the same keys described above, and store the array of paths at whatever
 * location you specified in the FB_PATHS variable. Be sure to restrict that data in your Security Rules.
 ****************************************************/
var duration = (process.env.FL_DAYS || 30) * 1000 * 60 * 60 * 24;
var paths = [
  {
    name  : "response",
    path  : "queue/responses",
    index : "firebase",
    type  : "logs",
    parser: function(data) {
      return {
        response: {
          data: normalizers.responseData(data.data),
          status: data.status,
          time: data.time
        }
      };
    },
    refBuilder: function(ref) {
      return ref.orderByChild('time').startAt(Date.now() - duration);
    }
  },
  {
    name  : "request",
    path  : "logs/queue/requests",
    index : "firebase",
    type  : "logs",
    resolver: function(data, key) {
      return data.response;
    },
    parser: function(data, key) {
      return {
        request: {
          _id: key,
          action: data.action,
          data: normalizers.requestData(data.data),
          time: data.time
        },
        user: data.user,
        venue: data.venue
      };
    },
    refBuilder: function(ref) {
      return ref.orderByChild('time').startAt(Date.now() - duration);
    }
  },
  {
    name  : "error",
    path  : "logs/queue/errors",
    index : "firebase",
    type  : "logs",
    filter: function(data) {
      return !!data.task;
    },
    resolver: function(data, key) {
      return data.task.response;
    },
    parser: function(data, key) {
      return {
        error: {
          _id: key,
          _log: data.task._log,
          error: data.error,
          state: data.state,
          time: data.time
        }
      };
    },
    refBuilder: function(ref) {
      return ref.orderByChild('time').startAt(Date.now() - duration);
    }
  }
];

var allPaths = _.map(paths, 'name')
  , monitorPaths = process.env.FL_PATHS === 'all' ? allPaths : _.intersection(allPaths, (process.env.FL_PATHS || '').split(','));

if (monitorPaths.length) {
  paths = _.filter(paths, function(path) {
    return monitorPaths.indexOf(path.name) > -1;
  });
  if (process.env.FL_DAYS === '0') {
    paths = _.map(paths, _.partial(_.omit, _, 'refBuilder'));
  }
  exports.paths = paths;
}

// The flag to control whether the app will monitor & index firebase paths
exports.FL_INDEX = !!process.env.FL_PATHS;

// The flag to control whether the app will handle search requests
exports.FL_SEARCH = !!process.env.FL_SEARCH;

// Additional options for ElasticSearch client
exports.ES_OPTS = {
  requestTimeout: process.env.ES_TIMEOUT || 120000
  //requestTimeout: 60000, maxSockets: 100, log: 'error'
};

/** Config Options
 ***************************************************/

// How often should the script remove unclaimed search results? probably just leave this alone
exports.CLEANUP_INTERVAL =
  process.env.NODE_ENV === 'production' ?
  3600 * 1000 /* once an hour */ :
  60 * 1000 /* once a minute */;

function processESUrl(exports, url) {
  var matches = url.match(/^https?:\/\/([^:]+):([^@]+)@([^/]+)\/?$/);
  exports.ES_HOST = matches[3];
  exports.ES_PORT = 80;
  exports.ES_USER = matches[1];
  exports.ES_PASS = matches[2];
  console.log('Configured using ES_URL environment variable', url, exports);
}
