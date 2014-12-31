#!/usr/bin/env node

/*
 * @version 0.3, 3 June 2014
 */

var es = require('elasticsearch'),
   optometrist   = require('optometrist'),
   fbutil        = require('./lib/fbutil'),
   PathMonitor   = require('./lib/PathMonitor'),
   SearchQueue   = require('./lib/SearchQueue'),
   logger        = require('./lib/logging').logger;

var launchService = function(conf) {
  var paths, fbPath;
  try {
    paths = require( conf.pathsConfig ).paths;
  }
  catch (err) {
    logger.warn("Could not parse " + conf.pathsConfig
                + ", treating as Firebase location!");
    fbPath = conf.pathsConfig;
  }
  
  fbutil.auth().then(function() {
    // connect to ElasticSearch
    var esc = new es.Client({
      host: conf.elasticsearchUrl,
      log: 'error'
    });
    
    logger.info('Connected to ElasticSearch host %s', conf.elasticsearchUrl);

    PathMonitor.process(esc, paths, fbPath);
    if (!conf.disableSearchProxy) {
      SearchQueue.init(esc, conf.fbReq, conf.fbRes, conf.cleanupInterval);
    }
  })
  .catch(function(err) {
    logger.error('Could not initialize flashlight: ' + err);
    return; 
  });
}

var confSchema = {
  firebaseUrl: {
    description: 'URL where the Firebase instance lives.',
    required: true 
  },
  pathsConfig: {
    description: 'Location where configuration of listeners is stored.',
    required: true,
  },
  disableSearchProxy: {
    description: 'Turn off the search-path functionality that proxies search requests through Firebase.',
    'default': false
  },
  elasticsearchUrl: { 
    description: 'URL of the Elasticsearch server to connect to.',
    'default': process.env.BONSAI_URL || 'http://localhost:9200'
  },
  fbReq: {
    description: 'The Firebase path on which to listen for search requests.',
    'default': 'search/request'
  },
  fbRes: {
    description: 'The Firebase path to which search responses should be written',
    'default': 'search/response'
  },
  cleanupInterval: {
    /* 1 hour in production, 1 minute else */
    description: 'The frequency with which we should eviscerate search responses to limit clutter (milliseconds).',
    'default': ( process.env.NODE_ENV === 'production' ? 3600*1000 : 60*1000 )
  }
};

try {
  var settings = optometrist.get(confSchema);
  launchService(settings);
}
catch (err) {
  console.log(optometrist.usage('app.js', 'Run Flashlight Firebase/ES sync daemon.', confSchema));
  process.exit(1);
}
