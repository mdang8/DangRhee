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

/**
 * Verifies token with Facebook
 */
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === verify_token) {
        res.send(req.query['hub.challenge']);
    }

    res.send('Wrong token.');
});

/**
 * Provides privacy policy endpoint for Facebook
 */
app.get('/privacy-policy/', function (req, res) {
    res.sendStatus(200);
});

app.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});

/**
 * Receives message
 */
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
    let lowerMessage = message.toLowerCase();
    let splitMsg, splitDate = [];
    let location, date, formattedDate, zipCode = '';
    let reply, queryStr = '';
    let tempHigh, tempLow, humidity = 0;
    let precipitation = '';
    let readStr = "what was the weather in";
    let updateStr = "update weather in";
    let deleteStr = "remove weather in";

    // sets up the database credentials
    let databaseConnection = mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: 'DangRhee'
    });

    // read operation
    if (lowerMessage.includes(readStr)) {
        // makes the database connection
        databaseConnection.connect();

        location = message.substring(readStr.length + 1, message.lastIndexOf('on') - 1);
        date = message.substring(message.lastIndexOf('on') + 3);
        splitDate = [];

        if (date.includes('-')) {
            splitDate = date.split('-');
        } else if (date.includes('/')) {
            splitDate = date.split('/');
        }

        // formats the date string
        formattedDate = splitDate[2] + '-' + splitDate[0] + '-' + splitDate[1];

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

        // makes the select query
        databaseConnection.query(queryStr, function(err, results, fields) {
            if (err) {
                // ends the database connection
                databaseConnection.end();
                // sends an error message as the reply
                sendReply(sender, "There was an error processing your read request.\n" + err);
                console.error(err);
            }

            // no rows returned for the query
            if (results.length === 0) {
                reply = "Sorry, there doesn't seem to be any data for that date and location.";
            } else {
                let jsonResults = JSON.parse(JSON.stringify(results[0]));
                tempHigh = jsonResults.tempHigh;
                tempLow = jsonResults.tempLow;
                humidity = jsonResults.humidity;
                precipitation = jsonResults.precipitation;

                // precipitation field is an empty string
                if (precipitation === '') {
                    precipitation = 'None';
                }

                // the reply string
                reply = 'The weather for ' + location + ' on ' + date + ' is as follows:\n' + 'High Temperature = ' +
                    tempHigh + ' °F\n' + 'Low Temperature = ' + tempLow + ' °F\n' + 'Humidity = ' + humidity + '%\n' +
                    'Precipitation = ' + precipitation;
            }

            // URL for getting Facebook user info
            let url = 'https://graph.facebook.com/v2.6/' + sender.id + '?fields=first_name,last_name&access_token=' +
                page_access_token;

            // makes the GET request to retrieve Facebook user name info
            request(url, function(error, response, body) {
                if (error || response.statusCode !== 200) {
                    console.error(error);
                }

                console.log("Sender id: " + sender.id);

                // parses the response body as JSON
                let jsonBody = JSON.parse(body);

                // SQL insert statement to Users table
                let insertStr = "CALL add_user('" + sender.id + "', '" + jsonBody.first_name + "', '" + jsonBody.last_name + "')";

                // makes the insert query
                databaseConnection.query(insertStr, function(err, results) {
                    if (err) {
                        // ends the database connection
                        databaseConnection.end();
                        // sends an error message as the reply
                        sendReply(sender, "There was an error processing your insert request.\n" + err);
                        console.error(err);
                    }

                    // ends the database connection
                    databaseConnection.end();
                    // sends the weather info reply
                    sendReply(sender, reply);
                });
            });
        });
    } else if (lowerMessage.includes(updateStr)) {  // update operation
        // makes the database connection
        databaseConnection.connect();

        location = message.substring(updateStr.length + 1, message.lastIndexOf('on') - 1);
        date = message.substring(message.lastIndexOf('on') + 3);
        splitDate = [];

        if (date.includes('-')) {
            splitDate = date.split('-');
        } else if (date.includes('/')) {
            splitDate = date.split('/');
        }

        // formats the date string
        formattedDate = splitDate[2] + '-' + splitDate[0] + '-' + splitDate[1];

        zipCode = determineZipCode(location.toLowerCase());

        queryStr = "UPDATE WeatherData SET tempHigh = " + tempHigh + ", tempLow = " + tempLow + ", humidity = " + humidity + ". precipitation = '" + precipitation + "' WHERE zipcode = '" + zipCode + "'";

        databaseConnection.query(queryStr, function (err, results) {
            if (err) {
                // ends the database connection
                databaseConnection.end();
                // sends an error message as the reply
                sendReply(sender, "There was an error processing your update request.\n" + err);
                console.error(err);
            } else {
                sendReply(sender, "Updated the weather data for " + location + " on " + date + ".");
            }
        });
    } else if (lowerMessage.includes(deleteStr)) {
        // makes the database connection
        databaseConnection.connect();

        location = message.substring(deleteStr.length + 1, message.lastIndexOf('on') - 1);
        date = message.substring(message.lastIndexOf('on') + 3);
        splitDate = [];

        if (date.includes('-')) {
            splitDate = date.split('-');
        } else if (date.includes('/')) {
            splitDate = date.split('/');
        }

        // formats the date string
        formattedDate = splitDate[2] + '-' + splitDate[0] + '-' + splitDate[1];

        zipCode = determineZipCode(location.toLowerCase());

        queryStr = "DELETE FROM WeatherData WHERE zipcode = '" + zipCode + "' AND date = '" + formattedDate + "'";

        databaseConnection.query(queryStr, function (err, results) {
            if (err) {
                // ends the database connection
                databaseConnection.end();
                // sends an error message as the reply
                sendReply(sender, "There was an error processing your delete request.\n" + err);
                console.error(err);
            }

            sendReply(sender, "Removed the weather data for " + location + " on " + date + ".");
        });
    } else {
        sendReply(sender, 'Not a valid request.');
    }
}

function determineZipCode(location) {
    let zipCode = '';

    switch (location) {
        case 'boston':
            zipCode = '02115';
            break;
        case 'new york city':
            zipCode = '10001';
            break;
        case 'san francisco':
            zipCode = '94016';
            break;
        default:
            return 'Invalid location';
    }

    return zipCode;
}

function sendReply(sender, text) {
    let messageData = {
        text: text
    };

    // makes the POST request to send the message
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
