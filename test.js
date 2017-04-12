'use strict';

const databaseConfig = require('./config.js');
const mysql = require('mysql');

chooseReply('What was the weather in Boston on 01/01/2016');

function chooseReply(message) {
    let databaseConnection = mysql.createConnection({
        host: databaseConfig.host,
        user: databaseConfig.user,
        password: databaseConfig.password,
        database: databaseConfig.database
    });

    databaseConnection.connect();
    message = message.toLowerCase();
    let reply, queryStr = '';
    let tempHigh, tempLow, humidity = 0;
    let precipitation = '';

    if (message.includes("what was the weather in")) {
        let splitMsg = message.split(' ');
        let location = splitMsg[5];
        let date = splitMsg[7];
        let splitDate = [];

        if (date.includes('-')) {
            splitDate = date.split('-');
        } else if (date.includes('/')) {
            splitDate = date.split('/');
        }

        let formattedDate = splitDate[2] + '-' + splitDate[0] + '-' + splitDate[1];

        if (location === 'boston') {
            queryStr = 'SELECT * FROM WeatherData WHERE zipcode = "02115" AND date = "' + formattedDate + '"';
        } else if (location === 'new york city') {
            queryStr = 'SELECT * FROM WeatherData WHERE zipcode = "10001" AND date = "' + formattedDate + '"';
        } else if (location === 'san francisco') {
            queryStr = 'SELECT * FROM WeatherData WHERE zipcode = "94016" AND date = "' + formattedDate + '"';
        } else {
            reply = 'Not a valid location.';
        }

        console.log(queryStr);

        databaseConnection.query(queryStr, function(err, results, fields) {
            if (err) {
                throw err;
            }

            let jsonResults = JSON.parse(JSON.stringify(results[0]));
            tempHigh = jsonResults.tempHigh;
            tempLow = jsonResults.tempLow;
            humidity = jsonResults.humidity;
            precipitation = jsonResults.precipitation;

            console.log(tempHigh);
        });
    }

    databaseConnection.end();
}

function createDatabaseConnection() {
    let connection = mysql.createConnection({
        host: databaseConfig.host,
        user: databaseConfig.user,
        password: databaseConfig.password,
        database: databaseConfig.database
    });

    console.log('database connected');
    return connection.connect();
}
