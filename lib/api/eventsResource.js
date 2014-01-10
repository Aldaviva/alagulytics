var apiServer    = require('./apiServer');
var assert       = require('assert-plus');
var eventManager = require('../services/eventManager');
var logger = require('../common/logger')(module);

apiServer.post({ path: '/cgi-bin/events', name: 'createEvents' }, function(req, res, next){
	var events = req.body;
	assert.arrayOfObject(events, "request body should be an array of objects");
	
	eventManager.createEvents(events)
		.then(function(){
			res.send(204);
		})
		.done();
});

// apiServer.get({ path: '/cgi-bin/events', name: 'getEvents' }, function(req, res, next){
// 	res.send({ events: [] });
// 	return next();
// });