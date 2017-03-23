var sql = require('mssql');
var db = require('../../dbCreds.js');

const config = {
	user: db.user,
	password: db.password,
	server: db.server,

	options: {
		database: db.database,
		instancename: db.instancename,
		port: db.port
	}
};

function bulkInsert(listOfEvents) {
	truncateCalendarTable()
		.then();
	// build insert sql for all events
	// insert all events
}

function buildBulkInsertSql(listOfEvents) {
	// INSERT INTO MyTable (Field1, Field2) VALUES ('Value1','Value2'), ('ValueA', 'ValueB');
	var sql = "";

	return sql;
}

function executeSql(sql) {

}

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
					console.log(recordSet);
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

function truncateCalendarTable() {
	return new Promise(function(resolve, reject) {
		sql.connect(config).then(function () {
			var request = new sql.Request();
			request.query('TRUNCATE TABLE z_Calendar');
			resolve();
		}).catch(function (err) {
			console.log(err);
			reject(err);
		})
	});
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
	});
}

/*
 function insertSQL(obj) {
 var sqlStr = "";



 INSERT into z_Calendar(ID,ICalUID,CalSum,EventItemSum,EventItemStartTime,EventItemEndTime,EventItemDuration) values

 [    ]

 `
 }*/

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
					console.log(recordSet);
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