var mongo       = require('mongodb');
var testConfig  = require('../config');
var testCommons = require('../testCommons');

require('../../lib/common/logger')().level("warn");

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
							done();
						});
					});
				});
			});
	});

	describe("POST /events", function(){
		var myEvent = {
			name: 0,
			time: 1389312559118,
			myCustomField: "foo"
		};

		it('returns successfully', function(done){
			request({
				url: testCommons.baseUrl + '/events',
				method: 'POST',
				json: [myEvent]
			}, function(err, res, body){
				expect(err).to.be.null;
				expect(res.statusCode).to.equal(204);
				done();
			});
		});

		it("updates the database", function(done){
			eventsCollection.find().toArray(function(err, docs){
				expect(docs).to.have.length(1);
				var doc = docs[0];
				expect(doc).to.have.property("name", myEvent.name);
				expect(doc).to.have.property("time", myEvent.time);
				expect(doc).to.have.property("myCustomField", myEvent.myCustomField);
				done();
			});
		});
	});

	after(function(done){
		db.close(function(err){
			done();
		});
	});
});