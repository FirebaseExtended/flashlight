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
exports.FB_URL   = 'https://' + process.env.FB_NAME + '.firebaseio.com/';

// Either your Firebase secret or a token you create with no expiry, used to authenticate
// To Firebase and access search data.
exports.FB_TOKEN = process.env.FB_TOKEN || null;

// The path in your Firebase where clients will write search requests
exports.FB_REQ   = process.env.FB_REQ || 'search/request';

// The path in your Firebase where this app will write the results
exports.FB_RES   = process.env.FB_RES || 'search/response';

/** ElasticSearch Settings
 *********************************************/

if( process.env.BONSAI_URL ) {
   processBonsaiUrl(exports, process.env.BONSAI_URL);
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
 * {Array}    fields:  list of fields to be monitored (defaults to all fields)
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
    type:  "user",
    parse: function(data) {
      return { // Importantly, leave OUT the user's email
        firstName: data.firstName,
        lastName: data.lastName,
        slug: data.slug,
        biography: data.biography ? S(data.biography).stripTags().s : null,
        organization: data.organization,
        position: data.position,
        profileImage: data.profileImage,
        followers: _.keys(data.followers),
        usersFollowing: _.keys(data.usersFollowing),
        communitiesFollowing: _.keys(data.communitiesFollowing)
      }
    }
  },
  {  path:  "annotations",
     index: "firebase",
     type:  "annotation",
     parse: function(data) {
       return {
	 text: data.text,
	 created: data.created,
	 selectedLength: data.selection.length,
	 selectedContent: data.selection.quotation,
	 document: data.document,
	 author: data.author,
	 communities: _.keys(data.communities)
       }
     }
  },
  { 
    path:  "communities",
    index: "firebase",
    type:  "community",
    parse: function(data) {
      return {
        name: data.name,
        slug: data.slug,
        summary: data.summary ? S(data.summary).stripTags().s : null,
        followers: _.keys(data.followers),
        followersCount: _.keys(data.followers).length
      }
    }
  },
  {
    path:  "posts",
    index: "firebase",
    type:  "post",
    parse: function(data) {
      return {
        title: data.title ? S(data.title).stripTags().s : null,
        body: data.body ? S(data.body).stripTags().s : null,
        author: data.author,
        created: data.created,
        upvotes: _.keys(data.upvotes),
        upvotesCount: _.keys(data.upvotes).length,
        communities: _.keys(data.communities),
        slug: data.slug
      }
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
