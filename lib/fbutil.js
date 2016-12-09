'use strict';

var admin = require('firebase-admin'),
	colors = require('colors');

exports.init = function (databaseURL, serviceAccount) {
	var config = {
		databaseURL: databaseURL,
		credential: admin.credential.cert(serviceAccount)
	};
	admin.initializeApp(config);
};

exports.fbRef = function (path) {
	return admin.database()
		.ref()
		.child(path);
};
exports.fbFullRef = function (path) {
	console.log('fullref', path.replace(admin.database()
		.ref()
		.toString(), ''));
	return admin.database()
		.ref(path.replace(admin.database()
			.ref()
			.toString(), ''));
};

exports.pathName = function (ref) {
	var p = ref.parent.key;
	return (p ? p + '/' : '') + ref.key;
};

exports.isString = function (s) {
	return typeof s === 'string';
};

exports.isObject = function (o) {
	return o && typeof o === 'object';
};

exports.unwrapError = function (err) {
	if (err && typeof err === 'object') {
		return err.toString();
	}
	return err;
};

exports.isFunction = function (f) {
	return typeof f === 'function';
};
