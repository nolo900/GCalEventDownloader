var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var sql = require('mssql');
var db = require('./dbCreds');
var moment = require('moment');
var schedule = require('node-schedule');
var startDateTime = process.argv[2];
var endDateTime = process.argv[3];

const config = {
	user: db.user,
	password: db.password,
	server: db.server,

	options:{
		database: db.database,
		instancename: db.instancename,
		port: db.port
	}
}

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/downloadGCalEvents-nodejs.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
	process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'downloadGCalEvents-nodejs.json';

if (process.argv.length === 2){
	// setup scheduler
	console.log("Setting up scheduler...");
	setupScheduler();

} else {

	if (process.argv.length !== 4){
		console.log('Must use two arguments...see below..');
		displayUsageHints();
		return;
	}
	console.log("about to run main..");
	main();
}

function setupScheduler() {

	var job = schedule.scheduleJob({minute: 6}, function(){
		main();
	});

	console.log("GCal Event Downloader :: Scheduled to run every morning @ 2:00AM EST...");
}

function main() {

	// Load client secrets from a local file.
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
		if (err) {
			console.log('Error loading client secret file: ' + err);
			return;
		}

		//createCalendarTable();
		//truncateCalendarTable();
		console.log('about to downloadAndPostEvents');
		// Authorize a client with the loaded credentials, then call the Google Calendar API.
		authorize(JSON.parse(content), downloadAndPostEvents);

	});

}



/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	var clientSecret = credentials.installed.client_secret;
	var clientId = credentials.installed.client_id;
	var redirectUrl = credentials.installed.redirect_uris[0];
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, function(err, token) {
		if (err) {
			getNewToken(oauth2Client, callback);
		} else {
			oauth2Client.credentials = JSON.parse(token);
			callback(oauth2Client);
		}
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	console.log('Authorize this app by visiting this url: ', authUrl);
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question('Enter the code from that page here: ', function(code) {
		rl.close();
		oauth2Client.getToken(code, function(err, token) {
			if (err) {
				console.log('Error while trying to retrieve access token', err);
				return;
			}
			oauth2Client.credentials = token;
			storeToken(token);
			callback(oauth2Client);
		});
	});
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
	try {
		fs.mkdirSync(TOKEN_DIR);
	} catch (err) {
		if (err.code != 'EEXIST') {
			throw err;
		}
	}
	fs.writeFile(TOKEN_PATH, JSON.stringify(token));
	console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
	var calendar = google.calendar('v3');
	calendar.events.list({
		auth: auth,
		calendarId: 'primary',
		timeMin: (new Date()).toISOString(),
		maxResults: 10,
		singleEvents: true,
		orderBy: 'startTime'
	}, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
		var events = response.items;
		if (events.length == 0) {
			console.log('No upcoming events found.');
		} else {
			console.log('Upcoming 10 events:');
			for (var i = 0; i < events.length; i++) {
				var event = events[i];
				var start = event.start.dateTime || event.start.date;
				console.log('%s - %s', start, event.summary);
			}
		}
	});
}

function hasValidArguments() {

	startDateTime = moment(startDateTime);
	endDateTime = moment(endDateTime);

	if(!startDateTime.isValid() || !endDateTime.isValid()){
		console.log('Must Use Valid Dates...see below..');
		displayUsageHints();
		return false;
	}

	if (startDateTime.isAfter(endDateTime)){
		console.log("StartDateTime cannot be before EndDateTime");
		displayUsageHints();
		return false;
	}
	return true;
}

function downloadAndPostEvents(auth) {

	//make sure args are valid, correct # of args, startdate before enddate, args are actually valid dates
	// display usage hints if any of this is not true
	if (!hasValidArguments()) {return};
	console.log("inside post events...");
	var calendar = google.calendar('v3');

	calendar.calendarList.list({
		auth: auth
	},
	function (err, response) {
		if (err)    {
			console.log("API Returned Error --> ", err);
			return;
		}

		var myCalendars = response.items;

		myCalendars.forEach(function (cal) {
			getCalendarEvents(auth,cal.id);
		});

		console.log('Program last run at ' + moment().format());
	});

}

function getCalendarEvents(auth, calID) {

		let myRow = {};
		console.log("CALENDAR: " + calID);
		let calendar = google.calendar('v3');

		calendar.events.list({
			auth: auth,
			calendarId: calID,
			timeMin: startDateTime.format(),
			timeMax: endDateTime.format(),
			maxResults: 9999,
			singleEvents: true,
			showDeleted: false
		},function (err,response) {
			if (err) {
				console.log("Calendar Event Request Error: " + calID + "->" + err.message);
				return;
			}

			var myEvents = response;

			if (myEvents != 'Not Found'){

				if (myEvents.hasOwnProperty('items')){
					for (event in myEvents.items){

						var start = moment(myEvents.items[event].start.dateTime);
						var end = moment(myEvents.items[event].end.dateTime);
						var diff = end.diff(start);
						var durationHours = moment.duration(diff).asHours().toFixed(2);

						myRow = {};

						myRow.ID = myEvents.items[event].id;
						myRow.ICalUID = myEvents.items[event].iCalUID;
						myRow.CalSum = myEvents.summary;
						myRow.EventItemSum = myEvents.items[event].summary;
						myRow.EventItemStartTime = moment(myEvents.items[event].start.dateTime).format('YYYY-MM-DD[T]HH:mm:ss') || null;
						myRow.EventItemEndTime = moment(myEvents.items[event].end.dateTime).format('YYYY-MM-DD[T]HH:mm:ss') || null;
						myRow.EventItemDuration = durationHours;

						insertRow(myRow);
						console.log(myRow);

					}
				}

			}

		});

};

function insertRow(rowObj) {
	var dbConn = new sql.Connection(config);
	dbConn.connect().then(function () {

		var transaction = new sql.Transaction(dbConn);

		transaction.begin().then(function () {

			var request = new sql.Request(transaction);

			request.query(`INSERT into z_Calendar(ID,ICalUID,CalSum,EventItemSum,EventItemStartTime,EventItemEndTime,EventItemDuration) values
			('${rowObj.ID}','${rowObj.ICalUID}','${rowObj.CalSum}','${rowObj.EventItemSum}','${rowObj.EventItemStartTime}','${rowObj.EventItemEndTime}','${rowObj.EventItemDuration}')
			`).then(function () {
					transaction.commit().then(function (recordSet) {
						//console.log(recordSet);
						dbConn.close();
					}).catch(function (err) {

						console.log("Error in Transaction Commit " + err + " -> " + rowObj.CalSum + rowObj.EventItemSum);
						dbConn.close();
					});
				}).catch(function (err) {

				console.log("Error in Transaction Begin " + err + " -> " + rowObj.CalSum + rowObj.EventItemSum);
				dbConn.close();
			});

		}).catch(function (err) {

			console.log(err);
			dbConn.close();
		});
	}).catch(function (err) {

		console.log(err);
		dbConn.close();
	});

	dbConn.close();
}

function displayUsageHints() {
	console.log('--------------------------- USAGE HINTS -------------------------------');
	console.log('node downloadGCalEvents.js startDatetime endDatetime');
	console.log('** Datetime can be in many formats but ISO is most accurate....');
	console.log('** "2016-12-07T20:30:00-05:00" **');
	console.log('---------------------------------');
	console.log('** To Initiate the Scheduler, run without arguments like this....')
	console.log('node downloadGCalEvents.js');
	console.log('** The scheduler is currently setup to run every morning at 2:30AM **');
	console.log('-----------------------------------------------------------------------');
}

function truncateCalendarTable() {
	sql.connect(config).then(function () {
		var request = new sql.Request();
		request.query('TRUNCATE TABLE z_Calendar');
	}).catch(function (err) {
		console.log(err);
	})
}
function createCalendarTable() {

	sql.connect(config).then(function () {
			var table = new sql.Table('z_Calendar'); // or temporary table, e.g. #temptable
			table.create = true;
			table.columns.add('ID', sql.NVarChar(sql.MAX), {nullable: false});
			table.columns.add('ICalUID', sql.VarChar(sql.MAX), {nullable: false});
			table.columns.add('CalSum', sql.VarChar(sql.MAX), {nullable: true});
			table.columns.add('EventItemSum', sql.VarChar(sql.MAX), {nullable: true});
			table.columns.add('EventItemStartTime', sql.DateTime, {nullable: true});
			table.columns.add('EventItemEndTime', sql.DateTime, {nullable: true});
			table.columns.add('EventItemDuration', sql.Decimal(8,2), {nullable: true});

			var request = new sql.Request();
			request.bulk(table, function(err, rowCount) {
				console.log(err);
			});


	}).catch(function (err) {
		console.log(err);
	})


}

