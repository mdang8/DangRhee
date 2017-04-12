'use strict';

const databaseConfig = require('./config.js');
const mysql = require('mysql');

chooseReply('What was the weather in Boston on 01/01/2016?');

function chooseReply(message) {
    message = message.replace('?', '');
    let splitMsg, splitDate = [];
    let location, date = '';
    let reply, queryStr = '';
    let tempHigh, tempLow, humidity = 0;
    let precipitation = '';

    if (message.toLowerCase().includes("what was the weather in")) {
        let databaseConnection = mysql.createConnection({
            host: 'cs3200.chcuwkw6vl9p.us-west-2.rds.amazonaws.com',
            user: 'mdang',
            password: 'mattadmin',
            database: 'DangRhee'
        });

        databaseConnection.connect();

        location = message.substring(24, message.lastIndexOf('on') - 1);
        date = message.substring(message.lastIndexOf('on') + 3);
        splitDate = [];

        if (date.includes('-')) {
            splitDate = date.split('-');
        } else if (date.includes('/')) {
            splitDate = date.split('/');
        }

        let formattedDate = splitDate[2] + '-' + splitDate[0] + '-' + splitDate[1];

        if (location.toLowerCase() === 'boston') {
            queryStr = 'SELECT * FROM WeatherData WHERE zipcode = "02115" AND date = "' + formattedDate + '"';
        } else if (location.toLowerCase() === 'new york city') {
            queryStr = 'SELECT * FROM WeatherData WHERE zipcode = "10001" AND date = "' + formattedDate + '"';
        } else if (location.toLowerCase() === 'san francisco') {
            queryStr = 'SELECT * FROM WeatherData WHERE zipcode = "94016" AND date = "' + formattedDate + '"';
        } else {
            reply = 'Not a valid location.';
            console.log(reply);
            return;
        }

        databaseConnection.query(queryStr, function(err, results, fields) {
            if (err) {
                console.log('error');
                databaseConnection.end();
                return;
                //throw err;
            }

            let jsonResults = JSON.parse(JSON.stringify(results[0]));
            tempHigh = jsonResults.tempHigh;
            tempLow = jsonResults.tempLow;
            humidity = jsonResults.humidity;
            precipitation = jsonResults.precipitation;

            if (precipitation === '') {
                precipitation = 'None';
            }

            reply = 'The weather for ' + location + ' on ' + date + ' is as follows:\n' + 'High Temperature = ' +
                tempHigh + ' °F\n' + 'Low Temperature = ' + tempLow + ' °F\n' + 'Humidity = ' + humidity + '%\n' +
                'Precipitation = ' + precipitation;

            console.log(reply);
        });

        databaseConnection.end();
    } else {
        console.log('Not a valid request.');
    }
}
