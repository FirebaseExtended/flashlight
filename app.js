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

var conf = optometrist.get({
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
    'default': ( process.env.BONSAI_URL ? process.env.BONSAI_URL : 'http://localhost:9200' )
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
    description: 'The frequency with which we should eviscerate search responses to limit clutter.',
    'default': ( process.env.NODE_ENV === 'production' ? 3600*1000 : 60*1000 )
  }
});

var launchService = function(siteConfig) {
  // connect to ElasticSearch
  var esc = new es.Client({
    host: conf.elasticsearchUrl,
    log: 'error'
  });

  logger.info('Connected to ElasticSearch host %s'.grey, conf.elasticsearchUrl);

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
    PathMonitor.process(esc, paths, fbPath);
    SearchQueue.init(esc, conf.fbReq, conf.fbRes, conf.cleanupInterval);
  })
  .catch(function(err) {
    logger.error('Could not authenticate to Firebase: ' + err);
    return; 
  });
}

if (require.main===module) {
  launchService();
}
else {
  exports.start = launchService;
}
