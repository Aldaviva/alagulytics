var _ = require('lodash');
var logger = require('./logger')(module);

// var userConfig;
// try {
// 	userConfig = require('../../config');
// } catch(err){
// 	if(err.code == 'MODULE_NOT_FOUND'){
// 		logger.debug("Missing config.json, using default configuration.");
// 		userConfig = {};
// 	} else {
// 		logger.error(err);
// 		throw err;
// 	}
// }

var defaults = require('../../config.example');

var isInitialized = false;

module.exports = {};
//_.merge({}, defaults, userConfig);

module.exports.init = function(userConfig){
	if(!isInitialized){
		isInitialized = true;
		return _.merge(module.exports, defaults, userConfig);
	} else {
		return module.exports;
	}
};