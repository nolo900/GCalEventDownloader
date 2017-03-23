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

exports.bulkInsert = function(tableName, dataArray) {

	truncateCalendarTable(tableName)
		.then(buildSQLstring(tableName,dataArray))
		.then(sqlString => executeSql(sqlString))
		.catch(err => {console.log(err)});
};

function buildSQLstring(tableName, dataArray) {

	// return new Promise(function (resolve,reject) {
	// 	function resolve() {
			let sqlString = `INSERT into ${tableName}(ID,ICalUID,CalSum,EventItemSum,EventItemStartTime,EventItemEndTime,EventItemDuration) values`;
			dataArray.forEach(function (rowObj) {
				sqlString += `('${rowObj.ID}','${rowObj.ICalUID}','${rowObj.CalSum}','${rowObj.EventItemSum}','${rowObj.EventItemStartTime}','${rowObj.EventItemEndTime}','${rowObj.EventItemDuration}'),`
			})
			console.log(sqlString);
			return sqlString;
	// 	}
	// })

}

function executeSql(sqlString) {

	sql.connect(config).then(function () {
		var transaction = new sql.Transaction();

		transaction.begin().then(function () {
			var request = new sql.Request(transaction);

			request.query(sqlString).then(function () {
				transaction.commit().then(function (recordset) {
					console.log("Finished Trying to Post Data... I think...");
					sql.close();
				})
			})
		})

	}).catch(err => {console.log('MSSQL Posting Error: ',err)});
}
//
//
// function insertRow(rowObj) {
// 	var dbConn = new sql.Connection(config);
// 	dbConn.connect().then(function () {
//
// 		var transaction = new sql.Transaction(dbConn);
//
// 		transaction.begin().then(function () {
//
// 			var request = new sql.Request(transaction);
//
// 			request.query(`INSERT into z_Calendar(ID,ICalUID,CalSum,EventItemSum,EventItemStartTime,EventItemEndTime,EventItemDuration) values
// 			('${rowObj.ID}','${rowObj.ICalUID}','${rowObj.CalSum}','${rowObj.EventItemSum}','${rowObj.EventItemStartTime}','${rowObj.EventItemEndTime}','${rowObj.EventItemDuration}')
// 			`).then(function () {
// 				transaction.commit().then(function (recordSet) {
// 					console.log(recordSet);
// 					dbConn.close();
// 				}).catch(function (err) {
//
// 					console.log("Error in Transaction Commit " + err + " -> " + rowObj.CalSum + rowObj.EventItemSum);
// 					dbConn.close();
// 				});
// 			}).catch(function (err) {
//
// 				console.log("Error in Transaction Begin " + err + " -> " + rowObj.CalSum + rowObj.EventItemSum);
// 				dbConn.close();
// 			});
//
// 		}).catch(function (err) {
//
// 			console.log(err);
// 			dbConn.close();
// 		});
// 	}).catch(function (err) {
//
// 		console.log(err);
// 		dbConn.close();
// 	});
//
// 	dbConn.close();
// }

function truncateCalendarTable(tableName) {
	return new Promise(function(resolve, reject) {
		sql.connect(config).then(function () {
			var request = new sql.Request();
			request.query(`TRUNCATE TABLE ${tableName}`);
			sql.close();
			resolve();
		}).catch(function (err) {
			console.log(err);
			reject(err);
		})
	});
}

// function createCalendarTable() {
// 	sql.connect(config).then(function () {
// 		var table = new sql.Table('z_Calendar'); // or temporary table, e.g. #temptable
// 		table.create = true;
// 		table.columns.add('ID', sql.NVarChar(sql.MAX), {nullable: false});
// 		table.columns.add('ICalUID', sql.VarChar(sql.MAX), {nullable: false});
// 		table.columns.add('CalSum', sql.VarChar(sql.MAX), {nullable: true});
// 		table.columns.add('EventItemSum', sql.VarChar(sql.MAX), {nullable: true});
// 		table.columns.add('EventItemStartTime', sql.DateTime, {nullable: true});
// 		table.columns.add('EventItemEndTime', sql.DateTime, {nullable: true});
// 		table.columns.add('EventItemDuration', sql.Decimal(8,2), {nullable: true});
//
// 		var request = new sql.Request();
// 		request.bulk(table, function(err, rowCount) {
// 			console.log(err);
// 		});
// 	}).catch(function (err) {
// 		console.log(err);
// 	});
// }