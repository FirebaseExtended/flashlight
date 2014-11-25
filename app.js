#!/usr/bin/env node

/*
 * @version 0.3, 3 June 2014
 */

var es = require('elasticsearch'),
   conf          = require('./config'),
   fbutil        = require('./lib/fbutil'),
   PathMonitor   = require('./lib/PathMonitor'),
   SearchQueue   = require('./lib/SearchQueue'),
   logger        = require('./lib/logging').logger;

// connect to ElasticSearch
var esc = new es.Client({
  host: conf.ELASTICSEARCH_URL,
  log: 'error'
});
logger.info('Connected to ElasticSearch host %s'.grey, conf.ELASTICSEARCH_URL);

fbutil.auth().then(function() {
  PathMonitor.process(esc, conf.paths, conf.FB_PATH);
  SearchQueue.init(esc, conf.FB_REQ, conf.FB_RES, conf.CLEANUP_INTERVAL);
})
.catch(function(err) {
  logger.error('Could not authenticate to Firebase: ' + err);
  return; 
});
