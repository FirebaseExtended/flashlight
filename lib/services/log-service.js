// PreparedHealth
// Create Date: 2015-02-16
// Copyright PreparedHealth 2015
// Purpose: Contains code for abstracting logging -- will allow for easy porting to framework in future
var bunyan = require('bunyan');
var sentryClient ;
var raven = require('raven');
var sentry = require('bunyan-sentry');
var RSVP = require('rsvp');
var src = false;
var streams = [{ 
					stream: process.stdout,
					type: 'stream',
					level: bunyan.DEBUG
				}];

function init(logConfig, onGlobalError){
	src = logConfig.src;
	if (logConfig.sentry){
		sentryClient = new raven.Client(logConfig.sentry);
		sentryClient.patchGlobal(function() {
			onGlobalError();
		});
		streams[1] = { 
										stream: sentry(sentryClient),
										type: 'stream',
										level: 'error'
									};
	} 
	streams[0].level = logConfig.level;
}

var getLogger = function (className) {
	return bunyan.createLogger(
		{
			'name': className,
			'src': src,
			'streams': streams
		}
	);
};
module.exports = {
	init: init,
	getLogger: getLogger
};