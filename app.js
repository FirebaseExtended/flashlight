#!/usr/bin/env node

/*
 * @version 0.3, 3 June 2014
 */

var ElasticClient = require('elasticsearchclient'),
   conf          = require('./config'),
   fbutil        = require('./lib/fbutil'),
   PathMonitor   = require('./lib/PathMonitor'),
   SearchQueue   = require('./lib/SearchQueue');

// connect to ElasticSearch
var esc = new ElasticClient({
   host: conf.ES_HOST,
   port: conf.ES_PORT,
   secure: ( conf.ES_PORT=='443' ? true : false ),
   //Optional basic HTTP Auth
   auth: conf.ES_USER? {
      username: conf.ES_USER,
      password: conf.ES_PASS
   } : null
});
console.log('Connected to ElasticSearch host %s:%s'.grey, conf.ES_HOST, conf.ES_PORT);

fbutil.auth().then(function() {
  PathMonitor.process(esc, conf.paths, conf.FB_PATH);
  SearchQueue.init(esc, conf.FB_REQ, conf.FB_RES, conf.CLEANUP_INTERVAL);
})
.catch(function(err) {
  console.log(err);
  return; 
});
