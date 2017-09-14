'use strict';

const config = require(__dirname + '/config.js');
const messages = require(__dirname + '/lib/messages.js');
const express = require('express');
const bodyParser = require('body-parser');

const verify_token = process.env.FB_WEBHOOK_VERIFY_TOKEN || config.FB_WEBHOOK_VERIFY_TOKEN;
const page_access_token = process.env.FB_PAGE_ACCESS_TOKEN || config.FB_PAGE_ACCESS_TOKEN;

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

app.get('/', function (req, res) {
    res.send('Welcome to DangRhee!');
});

/**
 * Verifies token with Facebook
 */
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === verify_token) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).send('Wrong validation token.');
    }
});

/**
 * Provides privacy policy endpoint for Facebook
 */
app.get('/privacy-policy', function (req, res) {
    res.sendStatus(200).send('Privacy policy for DangRhee.');
});

app.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});

/**
 * Receives message
 */
app.post('/webhook', function (req, res) {
    if (req.body.object === 'page') {
        console.log('Received message.');
        messages.handleMessage(req.body.entry, (sendResponse) => {
            if (sendResponse.recipient_id !== '' && sendResponse.message_id !== '') {
                res.sendStatus(200);
            } else {
                // @TODO handle bad response
                res.sendStatus(200);
            }
        });
    } else {
        throw new Error('Request to /webhook not a page object.');
    }
});
