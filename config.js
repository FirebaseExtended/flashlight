/**
 * This config file is provided as a convenience for development. You can either
 * set the environment variables on your server or modify the values here.
 *
 * At a minimum, you must set FB_URL and Paths to Monitor. Everything else is optional, assuming your
 * ElasticSearch server is at localhost:9200.
 */

var cipher = require('./lib/services/cipher.services.js');

/** Firebase Settings
 ***************************************************/
var cipher = require('./lib/services/cipher-service.js');
// Your Firebase instance where we will listen and write search results
exports.FB_URL = 'https://' + process.env.FB_NAME + '.firebaseio.com';

// The path in your Firebase where clients will write search requests
exports.FB_REQ = process.env.FB_REQ || 'chandler/search/request';
console.log('FB_REQ: ', exports.FB_REQ);

// The path in your Firebase where this app will write the results
exports.FB_RES = process.env.FB_RES || 'chandler/search/response';
console.log('*********************************');
console.log('FB_RES: ', exports.FB_RES);


// See https://firebase.google.com/docs/server/setup. for how to
// auto-generate this config json ...
//exports.FB_SERVICEACCOUNT = {
//   projectId: 'preparedhealth',
//   clientEmail: 'erin@preparedhealth.com',
//   privateKey: 'VpqQh0Cno900OY2aW0GUD64vfoUCFNAWOGnue1OW'
//};

exports.FB_SERVICEACCOUNT =
{
    "type": "service_account",
    "project_id": "preparedhealth",
    "private_key_id": "b3981b8ef4de01d46378cc961c264c65c69134e9",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDOIXwhAJrn1uco\nuetXLD1U8hnSP71ksHURQZGNB9mh2xdUbwROscYIx0bPXeXp+D4G9o404LuRMdGf\nHrb5q3nysX5hJIhZqv/ANo5ONsBKy1qL0AYTeL49cilGe0yj703YvS9igeuORMBx\nn/RrY7uwF87kvWZddQT/l6rT40Pt16/65O0QTkHc5GXtwZqBHexUTXN1Qj6I71uv\nyiSRt5hiTATtAtYGclD4zyhjkDNpZXg64d9RZT+Gxmtug3wh13hCujm9fyBvjw/H\nsKKlEOvULSilu2S0JPZoyZZGkumbTSKcZOG2LnIuf+gtdY9CMQw+pIanvDbTtUVm\noAzob6x5AgMBAAECggEBALo0oW8mnsiD53lwydmLizPrJ8w37BzDEl2uP4+I4d5G\njkKlrtxv1xci/SJiDklXCKE9pKS7xnSY7mWxV1UexCCqmiGi4NEvmazHG7In33kx\nTfAy0OpSDnhvYj3bMBZ/HHGIJP/1oRZ5oOaDukYwZ+Hg//K97XTLOuKw3Y5fJIP6\nzds0OQo0zP43Ia0nUAbyH6/6vh1r09dpjNGu1Con81wbBJWakkVHLfqd65lYMZzW\nik8y44l/pjyjNE2m/uzd2i6Nc/66V6hbFMgiafL6Rkhm/CwP7habpbA2JWYHdU7Q\nONdID4XTjx7gnuhw6g3LfXm8xW3zl6Qi78r/5TDR3ekCgYEA8bPnCM8QpnvDX6FN\npMi1PcmVRYvJQ3IEBkbafD2wBPOiJwPAAuIOgVlHVXP5QP/KlLGgaKqMImjmeb8g\n1y8SMQd9m+oL1BYXb88NGGy5pajzEOcZjQ6nszaxYM9xMJf4rdIWAsO1FsRiaxfM\nIy0wHqd0tg7cC6iO+6B6/Daqne8CgYEA2lLq4aiSaFUZPdZP6Iw7gjos6hl61+lL\nDXnn3+pl59cJ9uKLf1lPwjpNTunLz2h9Hb/WxjBi7StBlq7ygdqYWHLSQ+q4vi0W\n4SPXQbk59ZkMAwb+F/8dBbTbwi6YIVZC0t6GKAa5TIdfqrEDVA//ifKSqRaeS71L\nrxkyQM1YRBcCgYBu3bNSshAUHV7fhZCkzj98KPPkY5sc6bZ43pUnOfB8RPiS5sBz\nUhePM1FqG/kv3GSi0dsfR2NiATX+kDHTIk842BPAqZllXgDAE3wRQQXiu91KWoa4\n0gkQRj0Uh/KGdJ7ntB7Og9CTsd7m+pJzbC3PUcZSH/zFCDsVpmXjPHwEVwKBgQDC\n7nPfZdbLJugxqS+Rz9u2S+EcaAGh1B/5+VWKPMweM4cnE2FAJGstXUb3ZZJfLsk/\njbDjJgK+Bfg65RuLy7RojKSmlWW8D6A1Bv5EJXDVk4ABF/Y5UMQF+1SXzWhxo4Zo\nptyb0l0SMnC9g+0X2mzsK1S9en992pc/0Lxo1a+wowKBgQDJ5+zG3+j2M7DkY8+O\n307ZaxZUjDG9RfquHSW70KHjcY14P6UBAP501XskdE0wkd/mjII7asFMnyKn3YLz\nqJwhgwt9JUnmChq5nzpF9M22Y5m3LzWv9vpRQF54m/X67VC3TFUgZopPvewFLXzy\nNhO/HrVQEGI/xmn6rSQpCWxoyQ==\n-----END PRIVATE KEY-----\n",
    "client_email": "726528133324-compute@developer.gserviceaccount.com",
    "client_id": "109325899321568778506",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/726528133324-compute%40developer.gserviceaccount.com"
 }
 

//process.env.FB_SERVICEJSONPATH;

/** ElasticSearch Settings
 *********************************************/

if (process.env.BONSAI_URL) {
  processBonsaiUrl(exports, process.env.BONSAI_URL);
}
else {
  // ElasticSearch server's host URL
  exports.ES_HOST = process.env.ES_HOST || 'localhost';

  // ElasticSearch server's host port
  exports.ES_PORT = process.env.ES_PORT || '9200';

  // ElasticSearch username for http auth
  exports.ES_USER = process.env.ES_USER || null;

  // ElasticSearch password for http auth
  exports.ES_PASS = process.env.ES_PASS || null;
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
  // {
  //   path: "organizations",
  //   index: "places",
  //   type: "organization",
  //   parser: function (data) {
  //     return data.details;
  //   }
  // },
  // {
  //   path: "patients",
  //   index: "people",
  //   type: "patient"
  // },
  
  // {
  //   path: "orginbox",
  //   index: "referrals",
  //   type: "referral",
  //   // fields: ['details'],
  //   parser: function(data){
  //     var contents = cipher.decryptPayload(data.details.id, data.details.contents);
  //     var referral = data;

  //     contents.patient.cause.id = contents.patient.cause.$id;
  //     contents.patient.cause.priority = contents.patient.cause.$priority;
  //     contents.patient.cause.hashKey = contents.patient.cause.$$hashKey;
  //     delete contents.patient.cause.$id;
  //     delete contents.patient.cause.$priority;
  //     delete contents.patient.cause.$$hashKey;
      
  //     referral.details.contents = contents;
      
  //     console.log('Parser ORGINBOX: ');
  //     console.log('****************************');
  //     console.log(referral.details.fromEntity);
  //     console.log('****************************');
  //     console.log('Parser ORGINBOX: ');

  //     return referral.details;
  //   }
  // }
  {
   path: "orgInbox",
   index: "inbox",
   type: "item",
   // fields: ['details'],
   parser: function(data){
    if ( !data.details ) return {} ;
    if ( !data.details.contents ) return {};
    var contents = cipher.decryptPayload(data.details.id, data.details.contents);
    strip$(contents,'');
    data.details.contents = contents;
    return data.details;
   }
 }
];

function strip$(obj, stack) {
  for (var property in obj) {
    if ( obj[property] === null ){ 
      delete obj[property];  
    } else if (obj[property] && typeof obj[property] == "object") {
        strip$(obj[property], stack + '.' + property);
    } else {
        console.log(property + "   " + obj[property]);
        if ( property.startsWith('$')){ 
          console.log('deleted', property);
          delete obj[property];
        }
    } 
  }
}



// Paths can also be stored in Firebase and loaded using FB_PATHS!
exports.FB_PATH = process.env.FB_PATHS || null;

// Additional options for ElasticSearch client
exports.ES_OPTS = {
   //requestTimeout: 60000, maxSockets: 100, log: 'error'
};

/** Config Options
 ***************************************************/

// How often should the script remove unclaimed search results? probably just leave this alone
exports.CLEANUP_INTERVAL =
  process.env.NODE_ENV === 'production' ?
    3600 * 1000 /* once an hour */ :
    60 * 1000 /* once a minute */;
    
function processBonsaiUrl(exports, url) {
  var matches = url.match(/^https?:\/\/([^:]+):([^@]+)@([^/]+)\/?$/);
  exports.ES_HOST = matches[3];
  exports.ES_PORT = 80;
  exports.ES_USER = matches[1];
  exports.ES_PASS = matches[2];
  console.log('Configured using BONSAI_URL environment variable', url, exports);
}
