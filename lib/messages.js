'use strict';

const weather = require(__dirname + '/weather.js');
const rp = require('request-promise');
const fs = require('fs');

const config = fs.existsSync(__dirname + '/../config.js')
    ? require(__dirname + '/../config.js')
    : {};

function handleMessage(entries, callback) {
    // entry typically only contains one object
    entries.forEach((entry) => {
        let events = entry.messaging;

        // there can be multiple events
        events.forEach((event) => {
            let message = event.message;
            let reply = {
                senderId: '',
                text: ''
            };
            let senderId = event.sender.id;
            let recipientId = event.recipient.id;

            // handle messages with attachments
            if (message.attachments && message.attachments.length > 0) {
                reply.senderId = senderId;
                reply.text = 'Sorry, I can\'t currently reply to messages with attachments, e.g. images, stickers,' +
                    ' audio, etc.';

                this.sendReply(reply, (res) => {
                    callback(res);
                });

                return;
            }

            // handle messages with text that isn't empty
            if (message.text && (message.text !== null || message.text !== '')) {
                // NLP properties of the message
                let messageNLP = message.nlp;

                this.analyzeMessage(messageNLP, (replyText) => {
                    reply.senderId = senderId;
                    reply.text = replyText;

                    this.sendReply(reply, (res) => {
                        callback(res);
                    });
                });
            }
        });
    });
}

function sendReply(reply, callback) {
    let uri = 'https://graph.facebook.com/v2.6/me/messages';
    let options = {
        uri: uri,
        method: 'POST',
        qs: {
            access_token: process.env.FB_PAGE_ACCESS_TOKEN || config.FB_PAGE_ACCESS_TOKEN
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
    if (messageNLP.entities) {
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
    } else {
        console.error('Error with no entities.');
        callback('Sorry, there was an error.');
    }
}

module.exports.handleMessage = handleMessage;
module.exports.sendReply = sendReply;
module.exports.analyzeMessage = analyzeMessage;
