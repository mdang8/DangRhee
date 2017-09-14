'use strict';

const config = require(__dirname + '/../config.js');
const weather = require(__dirname + '/weather.js');
const rp = require('request-promise');

function handleMessage(entry, callback) {
    // entry typically only contains one object
    for (let i = 0; i < entry.length; i++) {
        let eventTime = entry[i].time;
        let events = entry[i].messaging;

        // there can be multiple events
        for (let j = 0; j < events.length; j++) {
            let reply = {
                senderId: '',
                text: ''
            };
            let senderId = events[j].sender.id;
            let recipientId = events[j].recipient.id;

            if (events[j].message && events[j].message.text) {
                // NLP properties of the message
                let messageNLP = events[j].message.nlp;

                this.analyzeMessage(messageNLP, (replyText) => {
                    // @TODO send weather info in reply
                    reply.senderId = senderId;
                    reply.text = replyText;

                    this.sendReply(reply, (res) => {
                        callback(res);
                    });
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
                text: reply.text
            }
        }
    };

    console.log('Sender ID: ' + reply.senderId);
    console.log('Reply text: ' + reply.text);

    rp(options)
        .then((res) => {
            console.log('Response received.');
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
                callback(reply);
            } else if (value === 'weather') {
                if (entities.location && entities.location[0].value) {
                    let location = entities.location[0].value;

                    weather.getWeatherLocation(location, (weatherInfo) => {
                        reply = weatherInfo;
                        callback(reply);
                    });
                } else {
                    reply = 'Looks like you didn\'t provide a location in your inquiry. Please resend your message with a location.';
                    callback(reply);
                }
            }
        }
    } else {
        // @TODO handle intent not defined
        console.log(messageNLP);
        console.error('No intent defined.');
        callback('Sorry, I don\'t understand your message.');
    }
}

module.exports.handleMessage = handleMessage;
module.exports.sendReply = sendReply;
module.exports.analyzeMessage = analyzeMessage;
