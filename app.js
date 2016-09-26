#!/usr/bin/env node

/*
 * @version 0.3, 3 June 2014
 */

var ElasticSearch = require('elasticsearch'),
   conf          = require('./config'),
   fbutil        = require('./lib/fbutil'),
   PathMonitor   = require('./lib/PathMonitor'),
   SearchQueue   = require('./lib/SearchQueue');

// connect to ElasticSearch
var esc = new ElasticSearch.Client({
  hosts: [
    {
      host: conf.ES_HOST,
      port: conf.ES_PORT,
      auth: (conf.ES_USER && conf.ES_PASS) ? conf.ES_USER + ':' + conf.ES_PASS : null
    }  
  ],
  requestTimeout: conf.ES_REQUEST_TIMEOUT,
});

console.log('Connected to ElasticSearch host %s:%s'.grey, conf.ES_HOST, conf.ES_PORT);

fbutil.init(conf.FB_URL, conf.FB_SERVICEACCOUNT);
PathMonitor.process(esc, conf.paths, conf.FB_PATH);
SearchQueue.init(esc, conf.FB_REQ, conf.FB_RES, conf.CLEANUP_INTERVAL);
