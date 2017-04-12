'use strict';

const databaseConfig = require('./config.js');
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
        let sender = event.sender.id;

        if (event.message && event.message.text) {
            let messageText = event.message.text;
            sendReply(sender, messageText);
        }
    }

    res.sendStatus(200);
});

app.post('/privacy-policy/', function (req, res) {
    res.sendStatus(200);
});

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

        databaseConnection.query(queryStr, function(err, results, fields) {
            if (err) {
                throw err;
            }

            let jsonResults = JSON.parse(JSON.stringify(results[0]));
            tempHigh = jsonResults.tempHigh;
            tempLow = jsonResults.tempLow;
            humidity = jsonResults.humidity;
            precipitation = jsonResults.precipitation;
        });
    }
}

function sendReply(sender, text) {
    let messageData = {
        text:text
    };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: page_access_token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
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
