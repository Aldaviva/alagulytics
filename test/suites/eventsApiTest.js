var mongo       = require('mongodb');
var testConfig  = require('../config');
var testCommons = require('../testCommons');

// require('../../lib/common/logger')().level("warn");

var config      = require('../../lib/common/config').init(testConfig);
var app         = require('../..');
var request     = require('request');
var chai        = require('chai');

var expect      = chai.expect;
chai.use(require('chai-fuzzy'));

var db;
var eventsCollection;

describe('Events API:', function(){

	before(function(done){
		app.startedPromise
			.then(function(){
				db = new mongo.Db(config.db.name, new mongo.Server(config.db.host, config.db.port), {
					journal: true
				});
				db.open(function(){
					db.collection('events', function(err, coll){
						eventsCollection = coll;
						eventsCollection.remove({}, function(err){
							done(err);
						});
					});
				});
			});
	});

	describe("createEvents", function(){
		var myEvent = {
			topic: 'activityState',
			value: 0,
			time: 1389312559118,
			myCustomField: "foo"
		};

		it('returns successfully', function(done){
			request.post({
				url: testCommons.baseUrl + '/events',
				json: [myEvent]
			}, function(err, res, body){
				expect(err).to.be.null;
				expect(res.statusCode).to.equal(204);
				done(err);
			});
		});

		it("updates the database", function(done){
			eventsCollection.find().toArray(function(err, docs){
				expect(docs).to.have.length(1);
				var doc = docs[0];
				expect(doc).to.have.property("topic", myEvent.activityState);
				expect(doc).to.have.property("value", myEvent.value);
				expect(doc).to.have.property("time", myEvent.time);
				expect(doc).to.have.property("myCustomField", myEvent.myCustomField);
				done(err);
			});
		});
	});

	describe("getEventsByTopic", function(){
		before(function(done){
			eventsCollection.insert([
				{
					topic : "stepsTaken",
					value : 50,
					time  : 1389312587342,
				},{
					topic : "stepsTaken",
					value : 100,
					time  : 1389312559119
				}
			], function(err){
				done(err);
			});
		});

		describe("filters", function(){
			it("by topic", function(done){
				request({
					url: testCommons.baseUrl + '/events/stepsTaken',
					json: true
				}, function(err, res, body){
					expect(err).to.be.null;
					expect(res).to.have.property('statusCode', 200);
					expect(res).to.have.deep.property('headers.content-type', 'application/json');
					expect(body).to.be.instanceOf(Array);
					expect(body).to.have.length(2);
					expect(body).to.have.deep.property('[0].topic', 'stepsTaken');
					done(err);
				});
			});

			it("by startTime only", function(){
				request({
					url: testCommons.baseUrl + '/events/stepsTaken?startTime=1389312559120',
					json: true
				}, function(err, res, body){
					expect(err).to.be.null;
					expect(res).to.have.property('statusCode', 200);
					expect(body).to.have.length(1);
					expect(body).to.have.deep.property('[0].time', 1389312587342);
					done(err);
				});
			});

			it("by endTime only", function(){
				request({
					url: testCommons.baseUrl + '/events/stepsTaken?endTime=1389312587341',
					json: true
				}, function(err, res, body){
					expect(err).to.be.null;
					expect(res).to.have.property('statusCode', 200);
					expect(body).to.have.length(1);
					expect(body).to.have.deep.property('[0].time', 1389312559119);
					done(err);
				});
			});

			it("by startTime and endTime", function(){
				request({
					url: testCommons.baseUrl + '/events/stepsTaken?startTime=1389312559120&endTime=1389312559120',
					json: true
				}, function(err, res, body){
					expect(err).to.be.null;
					expect(res).to.have.property('statusCode', 200);
					expect(body).to.be.instanceOf(Array);
					expect(body).to.have.length(0);
					done(err);
				});
			});
		});

		describe("sorts", function(){
			it("by time ascending by default", function(done){
				request({
					url: testCommons.baseUrl + '/events/stepsTaken',
					json: true
				}, function(err, res, body){
					expect(err).to.be.null;
					expect(res).to.have.property('statusCode', 200);
					expect(body).to.have.length(2);
					var expectedSmaller = body[0].time;
					var expectedLarger = body[1].time;
					expect(expectedSmaller).to.be.lessThan(expectedLarger);
					done(err);
				});
			});

			it("by value ascending", function(done){
				request({
					url: testCommons.baseUrl + '/events/stepsTaken?sort=value',
					json: true
				}, function(err, res, body){
					expect(err).to.be.null;
					expect(res).to.have.property('statusCode', 200);
					expect(body).to.have.length(2);
					var expectedSmaller = body[0].value;
					var expectedLarger = body[1].value;
					expect(expectedSmaller).to.be.lessThan(expectedLarger);
					done(err);
				});
			});

			it("by value descending", function(done){
				request({
					url: testCommons.baseUrl + '/events/stepsTaken?sort=-value',
					json: true
				}, function(err, res, body){
					expect(err).to.be.null;
					expect(res).to.have.property('statusCode', 200);
					expect(body).to.have.length(2);
					var expectedSmaller = body[1].value;
					var expectedLarger = body[0].value;
					expect(expectedSmaller).to.be.lessThan(expectedLarger);
					done(err);
				});
			});
		});
	});

	after(function(done){
		db.close(function(err){
			done(err);
		});
	});
});