var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var sql = require('mssql');
var db = require('./dbCreds');
var moment = require('moment');
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

//var calID = "austinbmiles.com_isc8j69dhqij1sncqefgd9b02o@group.calendar.google.com";

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/downloadGCalEvents-nodejs.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
	process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'downloadGCalEvents-nodejs.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
	if (err) {
		console.log('Error loading client secret file: ' + err);
		return;
	}
	// Authorize a client with the loaded credentials, then call the
	// Google Calendar API.
	// authorize(JSON.parse(content), listEvents);
	createCalendarTable();
});

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

// Posts Data to Specified MSSQL DB
// function postEventsToDB(auth) {
//
// 	//make sure args are correct, correct # of args, startdate before enddate, args are actually valid dates
// 	// display usage hints if any of this is not true
//
//
// 	//connect to db
// 	// wipe table clean ( SQL Truncate Table )
//
// 	// for each calendar in calendarslist
// 	//  allEvents = calendar.GetAllEvents, max req limit in 9999, should be plenty
// 	//
// 	//  for each event in allEvents
// 	//    extract relevant data for each event into obj
//
// 	//calculate time difference
// 	var calEventStartTime = moment(eventItem.Start.DateTime);
// 	var calEventEndTime = moment(eventItem.End.DateTime);
// 	var timeDiff = (calEventEndTime - calEventStartTime);
// 	var timeDiffHours = timeDiff.toFixed(2);
//
//
// 	var queryObj.data {
// 		'ID': eventItem.Id,
// 		'ICalUID': eventItem.ICalUID,
// 		'CalSum': calendar.Summary,
// 		'EventItemSum': eventItem.Summary,
// 		'EventItemStartTime': eventItem.Start.DateTime,
// 		'EventItemDuration': hours
// 	};
//
//
// }

function createCalendarTable() {

	// var queryObj = new sql.Query({
	//
	// })

	//queryObj.table('dbo.z_Calendar');


	sql.connect(config).then(function () {
		new sql.Request().query('select * from tbl_Topics').then(function (recordset) {
			console.log(recordset);
		}).catch(function (err) {
			console.log(err);
		})
	}).catch(function (err) {
		console.log('Promise err: ',err);
	})
	

	// sql.connect(config).then(function () {
	// 		var table = new sql.Table('z_Calendar'); // or temporary table, e.g. #temptable
	// 		table.create = true;
	// 		table.columns.add('ID', sql.NVarChar(sql.MAX), {nullable: false});
	// 		table.columns.add('ICalUID', sql.VarChar(sql.MAX), {nullable: false});
	// 		table.columns.add('CalSum', sql.VarChar(sql.MAX), {nullable: true});
	// 		table.columns.add('EventItemSum', sql.VarChar(sql.MAX), {nullable: true});
	// 		table.columns.add('EventItemStartTime', sql.DateTime, {nullable: true});
	// 		table.columns.add('EventItemDuration', sql.Decimal(4,2), {nullable: true});
	//
	// 		var request = new sql.Request();
	// 		request.bulk(table, function(err, rowCount) {
	// 			console.log(err);
	// 		});
	//
	//
	// }).catch(function (err) {
	// 	console.log(err);
	// })



	// sql.connect(config, function (err) {
	// 	var table = new sql.Table('z_Calendar'); // or temporary table, e.g. #temptable
	// 	table.create = true;
	// 	table.columns.add('ID', sql.NVarChar(sql.MAX), {nullable: false});
	// 	table.columns.add('ICalUID', sql.VarChar(sql.MAX), {nullable: false});
	// 	table.columns.add('CalSum', sql.VarChar(sql.MAX), {nullable: true});
	// 	table.columns.add('EventItemSum', sql.VarChar(sql.MAX), {nullable: true});
	// 	table.columns.add('EventItemStartTime', sql.DateTime, {nullable: true});
	// 	table.columns.add('EventItemDuration', sql.Decimal(4,2), {nullable: true});
	// 	//table.columns.add('GUID', sql.VarChar(MAX), {nullable: false});
	// 	//table.rows.add(777, 'test');
	//
	// 	var request = new sql.Request();
	// 	request.bulk(table, function(err, rowCount) {
	// 		// ... error checks
	// 	});
	//
	// 	if(err){console.log(err)};
	// });




}


// sql.connect("mssql://username:password@localhost/database").then(function() {
// 	// Query
//
// 	new sql.Request().query('select * from mytable').then(function(recordset) {
// 		console.dir(recordset);
// 	}).catch(function(err) {
// 		// ... query error checks
// 	});
//
// 	// Stored Procedure
//
// 	new sql.Request()
// 		.input('input_parameter', sql.Int, value)
// 		.output('output_parameter', sql.VarChar(50))
// 		.execute('procedure_name').then(function(recordsets) {
// 		console.dir(recordsets);
// 	}).catch(function(err) {
// 		// ... execute error checks
// 	});
//
// 	// ES6 Tagged template literals (experimental)
//
// 	sql.query`select * from mytable where id = ${value}`.then(function(recordset) {
// 		console.dir(recordset);
// 	}).catch(function(err) {
// 		// ... query error checks
// 	});
// }).catch(function(err) {
// 	// ... connect error checks
// });

function displayUsageHints() {
	console.log('--------------------------- USAGE HINTS -------------------------------');
	console.log('node downloadGCalEvents.js startDatetime endDatetime');
	console.log('** Datetime must be in ISO format: "2016-12-07T20:30:00-05:00" **');
	console.log('-----------------------------------------------------------------------');
}