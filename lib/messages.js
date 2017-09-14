'use strict';

const config = require(__dirname + '/../config.js');
const weather = require(__dirname + '/weather.js');
const rp = require('request-promise');

function handleMessage(entry, callback) {
    for (let i = 0; i < entry.length; i++) {
        let eventTime = entry[i].time;
        console.log('Event time: ' + eventTime);
        let events = entry[i].messaging;

        for (let j = 0; j < events.length; j++) {
            if (events[j].message.nlp) {
                console.log(JSON.stringify(events[j].message.nlp));
            }

            let reply = {
                senderId: '',
                text: ''
            };
            let senderId = events[j].sender.id;
            let recipientId = events[j].recipient.id;

            if (events[j].message && events[j].message.text) {
                let messageText = events[j].message.text;
                this.analyzeMessage(messageText, (analysis) => {
                    // @TODO send weather info in reply
                });
                reply.senderId = senderId;
                reply.text = messageText;
                this.sendReply(reply, (res) => {
                    callback(res);
                });
            }
        }
    }
}

function sendReply(reply, callback) {
    let uri = 'https://graph.facebook.com/v2.6/me/messages';
    let options = {
        uri: uri,
        method: 'POST',
        qs: {
            access_token: config.FB_PAGE_ACCESS_TOKEN
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true,
        body: {
            recipient: {
                id: reply.senderId
            },
            message: {
                text: 'Hello World!'
            }
        }
    };

    console.log('Sender ID: ' + reply.senderId);
    console.log('Text: ' + reply.text);

    rp(options)
        .then((res) => {
            console.log('Response: ' + JSON.stringify(res));
            callback(res);
        })
        .catch((err) => {
            // @TODO error handling
            let errorResponse = {
                recipient_id: '',
                message_id: ''
            };
            callback(errorResponse);
        });
}

function analyzeMessage(messageNLP, callback) {
    let reply = '';
    let entities = messageNLP.entities;
    if (entities.intent) {
        for (let i = 0; i < entities.intent.length; i++) {
            let value = entities.intent[i].value;

            // determines action/reply based on the intent of the received message
            if (value === 'greeting') {
                reply = 'Hello.';
            } else if (value === 'weather') {
                if (entities.location && entities.location.value) {
                    let location = entities.location.value;
                    // @TODO get weather info
                } else {
                    reply = 'Looks like you didn\'t provide a location in your inquiry. Please resend your message with a location.';
                }
            }
        }
    }
}

module.exports.handleMessage = handleMessage;
module.exports.sendReply = sendReply;
module.exports.analyzeMessage = analyzeMessage;
