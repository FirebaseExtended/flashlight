var bunyan = require('bunyan');

exports.logger = bunyan.createLogger({
  name: 'flashlight',
  streams: [{
    level: ( process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : 'debug' ),
    stream: process.stdout
  }]
});
