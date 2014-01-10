var assert = require('assert-plus');
var db     = require('../data/db');
var Q      = require('q');
var logger = require('../common/logger')(module);

var eventsCollection = db.collection('events');

var DEFAULT_SORT = [["time", 1]];

module.exports.createEvents = function(events){
	var sanitizedEvents = events.map(function(event){
		// event._id = undefined;

		assert.string(event.topic, 'topic must be a string');
		assert.notDeepEqual(event.value, null, 'value is required');
		assert.notDeepEqual(event.value, undefined, 'value is required');
		assert.number(event.time, 'time must be the number of milliseconds since unix epoch');
		event.time = Math.floor(event.time);

		logger.trace(event, "persisting event");

		return event;
	});

	var insertPromise = Q.ninvoke(eventsCollection, "insert", sanitizedEvents);
	
	insertPromise.then(function(){
		logger.debug("persisted "+sanitizedEvents.length+" events");
	});
	return insertPromise;
};

module.exports.findEvents = function(opts){
	assert.optionalNumber(opts.limit);

	var filter = opts.filter || {};
	var sort = opts.sort || DEFAULT_SORT;
	var limit = opts.limit || 0;

	return Q.ninvoke(eventsCollection, "find", filter, { limit: limit, sort: sort })
		.then(function(cursor){
			return Q.ninvoke(cursor, "toArray");
		});
};