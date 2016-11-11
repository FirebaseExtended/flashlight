#!/usr/bin/env node

/*
 * @version 0.3, 3 June 2014
 */
require('./env.js');

function onGlobalError(details){ 
  if ( details ) {
    console.error('Global Error:', details);
    console.error('STACK', details.stack);
  }
  process.exit(1);
}

process.on('SIGINT', onGlobalError);
process.on('uncaughtException',onGlobalError);

var elasticsearch = require('elasticsearch'),
  conf = require('./config'),
  fbutil = require('./lib/fbutil'),
  PathMonitor = require('./lib/PathMonitor'),
  SearchQueue = require('./lib/SearchQueue');


console.log('CONF');
console.log(conf);
console.log('CONF');

var escOptions = {
  hosts: [{
    host: conf.ES_HOST,
    port: conf.ES_PORT,
    auth: (conf.ES_USER && conf.ES_PASS) ? conf.ES_USER + ':' + conf.ES_PASS : null
  }]
};

for (var attrname in conf.ES_OPTS) {
  if( conf.ES_OPTS.hasOwnProperty(attrname) ) {
    escOptions[attrname] = conf.ES_OPTS[attrname];
  }
}

// connect to ElasticSearch
var esc = new elasticsearch.Client(escOptions);

console.log('Connecting to ElasticSearch host %s:%s'.grey, conf.ES_HOST, conf.ES_PORT);

var timeoutObj = setInterval(function() {
  esc.ping()
    .then(function() {
      console.log('Connected to ElasticSearch host %s:%s'.grey, conf.ES_HOST, conf.ES_PORT);
      clearInterval(timeoutObj);
      initFlashlight();
    });
}, 5000);

function initFlashlight() {
  console.log('FB_URL: ', conf.FB_URL);
  console.log('FB_REQ: ', conf.FB_REQ);
  console.log('FB_RES: ', conf.FB_RES);
  fbutil.init(conf.FB_URL, conf.FB_SERVICEACCOUNT);
  PathMonitor.process(esc, conf.paths, conf.FB_PATH);
  SearchQueue.init(esc, conf.FB_REQ, conf.FB_RES, conf.CLEANUP_INTERVAL);
}

