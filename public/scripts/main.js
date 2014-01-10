var startDate = 1389382351818; //11:30 am
var endTime = +new Date();

var API_ROOT = '/cgi-bin/';

//main();

function main(){
	renderLocation();

	renderCalories();

	renderStepsGraph();

	renderActivityGraph();
}

function renderLocation(){
	var locationValueEl = $('.location .value');
	var titleValueEl = $('header .isInOffice');

	$.getJSON(API_ROOT+'/events/isInOffice?limit=1&sort=-time&'+getDateFilter())
		.done(function(events){
			var isInOffice = !!events[0].value;

			titleValueEl.text((isInOffice) ? 'in' : 'out');

			if(!isInOffice){
				locationValueEl.text("Not in office");
			} else {
				$.getJSON(API_ROOT+'/events/geofence?limit=1&sort=-time'+getDateFilter())
					.done(function(events){
						var geofence = events[0].value;
						locationValueEl.text(geofence;)
					});
			}
		});
}

function renderCalories(){
	var CALORIES_PER_STEP = 0.0475;
	var caloriesValueEl = $('.calories .value');
	
	$.getJSON(API_ROOT+'/events/stepsTaken?'+getDateFilter())
		.done(function(events){
			var totalSteps = _(events).map(function(event){
				return event.value;
			}).reduce(function(prev, curr){
				return prev + curr;
			}, 0)
			.value();

			var calories = totalSteps * CALORIES_PER_STEP;
			caloriesValueEl.text(calories);
		});
}

function renderStepsGraph(){

}

function renderActivityGraph(){
	var graphEl = $('.activityState .graph');

	$.getJSON(API_ROOT+'/events/activityState?sort=+time&'+getDateFilter())
		.done(function(events){
			var previousEventEl = null;
			_.each(events, function(event){
				var pixelOffset = (event.time - startTime)/(endTime - startTime)*graphEl.width();
				var eventEl = $('<div>').css({
					left: pixelOffset
				});

				if(previousEventEl){
					previousEventEl.css({
						right: pixelOffset
					});
				}

				graphEl.append(eventEl);

				previousEventEl = eventEl;
			});
		});
}

function getDateFilter(){
	return 'startDate='+startDate+'&endTime='+endTime;
}