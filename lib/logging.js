var bunyan = require('bunyan')
  , bformat = require('bunyan-format')
  , formatOut = bformat({ outputMode: 'short' });

exports.logger = bunyan.createLogger({
  name: 'flashlight',
  streams: [{
    level: ( process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : 'info' ),
    stream: formatOut
  }]
});
