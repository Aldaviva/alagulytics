var _            = require('lodash');
var apiServer    = require('./apiServer');
var assert       = require('assert-plus');
var eventManager = require('../services/eventManager');
var logger       = require('../common/logger')(module);

apiServer.post({ path: '/cgi-bin/events', name: 'createEvents' }, function(req, res, next){
	var events = req.body;
	assert.arrayOfObject(events, "request body should be an array of objects");
	
	eventManager.createEvents(events)
		.then(function(){
			res.send(204);
		})
		.done();
});

apiServer.get({ path: '/cgi-bin/events/:topic', name: 'getEventsByTopic' }, function(req, res, next){
	var filter = {
		topic: req.params.topic
	};
	_.extend(filter, parseTimeFilter(req.query.startTime, req.query.endTime));

	eventManager.findEvents({
		filter: filter,
		sort: parseSortString(req.query.sort),
		limit: _.parseInt(req.query.limit)
	}).then(function(events){
		res.send(events);
	})
	.done();
});

function parseSortString(sortString){
	if(sortString){
		return sortString.split(/,/g).map(function(rawSortField){
			var isAscending = (rawSortField.charAt(0) != '-');
			return [rawSortField.replace(/^[-+]/, ''), isAscending ? 1 : -1];
		});
	} else {
		return null;
	}
}

function parseTimeFilter(startTime, endTime){
	var timeFilter = {};
	if(startTime && endTime){
		timeFilter.$and = [
			{ time: { $gte: _.parseInt(startTime) }},
			{ time: { $lte: _.parseInt(endTime) }}
		];
	} else if(startTime){
		timeFilter.time = { $gte: _.parseInt(startTime) };
	} else if(endTime){
		timeFilter.time = { $lte: _.parseInt(endTime) };
	}
	return timeFilter;
}