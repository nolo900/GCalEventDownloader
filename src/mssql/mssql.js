var sql = require('mssql');
var db = require('../../dbCreds.js');
var moment = require('moment');

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

exports.bulkInsert = function(tableName, sqlString) {

	truncateCalendarTable(tableName)
		.then(() => executeSql(sqlString))
		.catch(err => {console.log(err)});

};

function executeSql(sqlString) {

	sql.connect(config).then(function () {
		new sql.Request()
			.query(sqlString).then(function(recordset) {
			//console.dir(recordset);
			console.log('Events Posted to database at ' + moment().format());
			sql.close();
		}).catch(function(err) {
			console.log("Shit went wrong...",err);
			sql.close();
		});
	})

}

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