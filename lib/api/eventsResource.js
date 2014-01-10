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
	eventManager.findEvents({
		filter: {
			time: parseTimeFilter(req.query.startTime, req.query.endTime),
			topic: req.params.topic
		},
		sort: parseSortString(req.query.sort),
		limit: req.query.limit
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
	var timeFilter;
	if(startTime && endTime){
		timeFilter = { $and: [
			{ $gte: startTime },
			{ $lte: endTime }
		]};
	} else if(startTime){
		timeFilter = { $gte: startTime };
	} else if(endTime){
		timeFilter = { $lte: endTime };
	}
	return timeFilter;
}