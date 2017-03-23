var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var moment = require('moment');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/downloadGCalEvents-nodejs.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
	process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'downloadGCalEvents-nodejs.json';

//var allEvents = [];

exports.downloadEvents = function(startDateTime, endDateTime, doneFn) {

	//let allEvents = [];
	// Load client secrets from a local file.
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
		if (err) {
			console.log('Error loading client secret file: ' + err);
			return;
		}
		console.log(startDateTime,endDateTime);
		//createCalendarTable();
		//truncateCalendarTable();
		console.log('about to downloadAndPostEvents');
		// Authorize a client with the loaded credentials, then call the Google Calendar API.
		authorize(JSON.parse(content), storeEventsInObject, startDateTime, endDateTime, doneFn);
	});

}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, startDateTime, endDateTime, doneFn) {
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
			callback(oauth2Client, startDateTime, endDateTime, doneFn);
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

function storeEventsInObject(auth, startDateTime, endDateTime, doneFn) {

	var data = [];

	//make sure args are valid, correct # of args, startdate before enddate, args are actually valid dates
	// display usage hints if any of this is not true
	console.log("inside post events...");
	var calendar = google.calendar('v3');

	calendar.calendarList.list({
		auth: auth
	}, function (err, response) {
		if (err) {
			console.log("API Returned Error --> ", err);
			return;
		}

		var myCalendars = response.items;

		var returned = 0;
		var size = myCalendars.length - 1;

		function markDone() {
			returned++;
			if(returned === size) doneFn(data);
		}

		myCalendars.forEach(function (cal) {
			getCalendarEvents(auth, cal.id, startDateTime, endDateTime, data, markDone);
		});
	});

}

function getCalendarEvents(auth, calID, startDateTime, endDateTime, data, markDone) {
	let eventCount = 0;
	let calendar = google.calendar('v3');
	let myRow = {};
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
			markDone();
			return;
		}

		var myEvents = response;

		if (myEvents != 'Not Found'){

			if (myEvents.hasOwnProperty('items')){

				eventCount = myEvents.items.length;
				console.log(`Grabbed ${eventCount} items from ${calID}.`);

				for (event in myEvents.items){

					var start = moment(myEvents.items[event].start.dateTime);
					var end = moment(myEvents.items[event].end.dateTime);
					var diff = end.diff(start);
					var durationHours = moment.duration(diff).asHours().toFixed(2);

					myRow = {};

					myRow.ID = myEvents.items[event].id;
					myRow.ICalUID = myEvents.items[event].iCalUID;
					myRow.CalSum = myEvents.summary.replace(/'/g, "''");
					myRow.EventItemSum = myEvents.items[event].summary.replace(/'/g, "''");
					myRow.EventItemStartTime = moment(myEvents.items[event].start.dateTime).format('YYYY-MM-DD[T]HH:mm:ss') || null;
					myRow.EventItemEndTime = moment(myEvents.items[event].end.dateTime).format('YYYY-MM-DD[T]HH:mm:ss') || null;
					myRow.EventItemDuration = durationHours;


					data.push(myRow);
					// insertRow(myRow);
					//console.log(data.length);

				}

				markDone();
				return;
			}

			markDone();
			return;

		}



	});

};
