var _          = require('lodash');
var config     = require('../common/config');
var db         = require('../data/db');
var Q          = require('q');
var restify    = require('restify');
var rootLogger = require('../common/logger');
var socketio   = require('socket.io');

var logger     = rootLogger(module);

var restifyLogger = rootLogger().child({ module: 'restify' });
restifyLogger.level("warn");
var server = module.exports = restify.createServer({
	name: "alagulytics",
	log: restifyLogger
});

server.pre(restify.pre.sanitizePath());
server.use(restify.bodyParser({ mapParams: false }));
server.use(errorLogger);

server.pre(function(req, res, next){
	panicDbg.set('alagulytics.api.last-request', {
		client  : req.connection.remoteAddress,
		time    : req.time(),
		method  : req.method,
		url     : req.url,
		headers : req.headers
	});
	if(req.url != '/ruok'){
		logger.trace({
			method: req.method
		}, req.url);
	}
	return next();
});

server.on('uncaughtException', function(req, res, route, err){
	logger.error("Uncaught exception: %s", err);
	logger.error(err.stack);
	logger.error({
		client  : req.connection.remoteAddress,
		time    : req.time(),
		method  : req.method,
		url     : req.url,
		headers : req.headers
	});
});

function errorLogger(req, res, next){
	var originalEnd = res.end.bind(res);

	res.end = function(){
		if(res.statusCode >= 500){
			logger.error(res.statusCode, (res._body.stack || res._body));
		}
		originalEnd.apply(arguments);
	};

	next();
}

server.get({ path: 'ruok', name: 'heartbeat' }, function(req, res, next){
	db.ping()
		.then(function(){
			res.send(204);
		})
		.fail(function(err){
			res.send(503, {
				message: "Database failed to respond to ping",
				code: "ENODB"
			});
		});
});

server.start = function(){
	var port = config.server.port;
	var deferred = Q.defer();
	var promise = deferred.promise;

	server.on('error', deferred.reject);

	server.listen(port, function(err){
		if(err != null){
			deferred.reject(err);
		} else {
			startSocketIO();
			deferred.resolve();
		}
	});

	promise.then(
		function(){
			logger.info("Listening on %s", server.url);
		},
		function(err){ 
			if(err.code == 'EACCES'){
				logger.error("No access to port "+port);
			} else if(err.code == 'EADDRINUSE'){
				logger.error("Port "+port+" already in use.");
			} else {
				logger.error("Error starting server: "+err.message); 
			}
			throw err;
		}
	);

	return promise;
};

function startSocketIO(){
	var io = server.io = socketio.listen(server, {
		'log level': 0 // 0 - error, 1 - warn, 2 - info, 3 - debug
	});
	io.enable('browser client minification');
	io.enable('browser client etag');
	io.enable('browser client gzip');

	server.emit('sockets_listening');
}

server.shutdown = function(){
	var deferred = Q.defer();
	try {
		// server.emit('destroyConnections');
		server.close(function(err){
			if(err != null){
				logger.error("Unable to close: %s", err);
				deferred.reject(err);
			} else {
				logger.info("Shut down.");
				deferred.resolve();
			}
		});
	} catch (e){
		if(e == 'Error: Not running'){
			logger.info("Shut down.");
			deferred.resolve();
		} else {
			logger.error(e);
			deferred.reject(e);
		}
	}
	return deferred.promise;
};