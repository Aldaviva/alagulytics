var assert = require('assert-plus');
var db     = require('../data/db');
var Q      = require('q');
var logger = require('../common/logger')(module);

var eventsCollection = db.collection('events');

module.exports.createEvents = function(events){
	var sanitizedEvents = events.map(function(event){
		delete event._id;

		assert.number(event.name, 'name enum must be an int');
		assert.number(event.time, 'time must be the number of milliseconds since unix epoch');
		event.time = Math.floor(event.time);
	});

	var insertPromise = Q.ninvoke(eventsCollection, "insert", sanitizedEvents)
	
	insertPromise.then(function(){
		logger.debug("persisted "+sanitizedEvents.length+" events");
	});
	return insertPromise;
};