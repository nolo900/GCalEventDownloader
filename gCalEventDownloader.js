var mssql = require('./src/mssql/mssql.js');
var gCal = require('./src/google_calendar/google-calendar.js');
var moment = require('moment');
var schedule = require('node-schedule');
var startDateTime = process.argv[2];
var endDateTime = process.argv[3];

// lots of functions above me
// 3 files:
//  - google calendar (get all events, connect to google calendar, get all calendars, get all events for calendar)
//  - mssql (connection, execute sql, build insert string)
//  - index (call other files, handle command-line)

// main()
//  connect to google
//  get all events
//  turn events into sql
//  connect to db
//  send sql
//  show success

main();

function main() {
	var startDateTime = moment('2017-01-01');
	var endDateTime = moment('2017-03-01');
	gCal.downloadEvents(startDateTime, endDateTime, insertIntoDb);
}

function insertIntoDb(data) {
	// build sql strings (it's sync)
	console.log(data);
	console.log(data.length);
}

// if (process.argv.length === 2){
// 	// setup scheduler
// 	console.log("Setting up scheduler...");
//
// 	setupScheduler();
// } else {
//
// 	if (process.argv.length !== 4){
// 		console.log('Must use two arguments...see below..');
// 		displayUsageHints();
// 		return;
// 	}
// 	console.log("about to run main..");
// 	main();
// }
//
//
// function setupScheduler() {
//
// 	var job = schedule.scheduleJob({hour: 2, minute: 30}, function(){
// 		main();
// 	});
//
// 	console.log("GCal Event Downloader :: Scheduled to run every morning @ 2:30AM EST...");
// }
//
// function hasValidArguments() {
//
// 	startDateTime = moment(startDateTime);
// 	endDateTime = moment(endDateTime);
//
// 	if(!startDateTime.isValid() || !endDateTime.isValid()){
// 		console.log('Must Use Valid Dates...see below..');
// 		displayUsageHints();
// 		return false;
// 	}
//
// 	if (startDateTime.isAfter(endDateTime)){
// 		console.log("StartDateTime cannot be before EndDateTime");
// 		displayUsageHints();
// 		return false;
// 	}
// 	return true;
// }
//
// function displayUsageHints() {
// 	console.log('--------------------------- USAGE HINTS -------------------------------');
// 	console.log('node downloadGCalEvents.js [startDatetime endDatetime]');
// 	console.log('** Datetime can be in many formats but ISO is most accurate....');
// 	console.log('** "2016-12-07T20:30:00-05:00" **');
// 	console.log('---------------------------------');
// 	console.log('** To Initiate the Scheduler, run without arguments like this....')
// 	console.log('node downloadGCalEvents.js');
// 	console.log('** The scheduler is currently setup to run every morning at 2:30AM **');
// 	console.log('-----------------------------------------------------------------------');
// }