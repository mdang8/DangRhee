'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
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

function sendReply(sender, messageReceived) {
    let replyMessage = 'Message received: ' + messageReceived;

    let data = {
        message: replyMessage
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
            message: data
        }
    }, function(err, res, body) {
        if (err) {
            console.error('Error with sending messages: ' + err);
        } else if (res.body.error) {
            console.error('Error with response body: ' + res.body.error);
        }
    });
}
