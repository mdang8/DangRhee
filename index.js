'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const mysql = require('mysql');
const app = express();

const verify_token = process.env.FB_WEBHOOK_VERIFY_TOKEN;
const page_access_token = process.env.FB_PAGE_ACCESS_TOKEN;

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Welcome to DangRhee!');
});

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === verify_token) {
        res.send(req.query['hub.challenge']);
    }

    res.send('Wrong token.');
});

app.get('/privacy-policy/', function (req, res) {
    res.sendStatus(200);
});

app.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});

app.post('/webhook/', function (req, res) {
    let messagingEvents = req.body.entry[0].messaging;

    for (let i = 0; i < messagingEvents.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender;

        if (event.message && event.message.text) {
            let messageText = event.message.text;
            chooseReply(sender, messageText.substring(0, 200));
        }
    }

    res.sendStatus(200);
});

app.post('/privacy-policy/', function (req, res) {
    res.sendStatus(200);
});

function chooseReply(sender, message) {
    message = message.replace('?', '');
    let splitMsg, splitDate = [];
    let location, date = '';
    let reply, queryStr = '';
    let tempHigh, tempLow, humidity = 0;
    let precipitation = '';

    if (message.toLowerCase().includes("what was the weather in")) {
        let databaseConnection = mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
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
            sendReply(sender, reply);
            return;
        }

        databaseConnection.query(queryStr, function(err, results, fields) {
            if (err) {
                sendReply(sender, 'ERROR: ' + err);
                databaseConnection.end();
                return;
                //throw err;
            }

            if (results.length === 0) {
                reply = "Sorry, there doesn't seem to be any data for that date and location.";
            } else {
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
            }

            sendReply(sender, reply);
        });

        databaseConnection.end();
    } else {
        sendReply(sender, 'Not a valid request.');
    }
}

function sendReply(sender, text) {
    let messageData = {
        text: text
    };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: page_access_token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender.id
            },
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}
