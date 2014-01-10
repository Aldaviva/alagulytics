var assert = require('assert-plus');
var db     = require('../data/db');
var Q      = require('q');
var logger = require('../common/logger')(module);

var eventsCollection = db.collection('events');

var DEFAULT_SORT = [["time", 1]];

module.exports.createEvents = function(events){
	var sanitizedEvents = events.map(function(event){
		event._id = undefined;

		assert.string(event.topic, 'topic must be a string');
		assert.notDeepEqual(event.value, null, 'value is required');
		assert.notDeepEqual(event.value, undefined, 'value is required');
		assert.number(event.time, 'time must be the number of milliseconds since unix epoch');
		event.time = Math.floor(event.time);

		logger.debug({ event: event }, "creating event");

		return event;
	});

	return Q.ninvoke(eventsCollection, "insert", sanitizedEvents);
};

module.exports.findEvents = function(opts){
	assert.optionalNumber(opts.limit);
	assert.optionalObject(opts.filter);

	var filter = opts.filter || {};
	var sort = opts.sort || DEFAULT_SORT;
	var limit = opts.limit || 0;

	return Q.ninvoke(eventsCollection, "find", filter, { limit: limit, sort: sort })
		.then(function(cursor){
			return Q.ninvoke(cursor, "toArray");
		});
};