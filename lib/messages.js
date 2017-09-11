'use strict';

const config = require(__dirname + '/../config.js');
const Wit = require('node-wit').Wit;
const rp = require('request-promise');

const WIT_TOKEN = process.env.WIT_TOKEN || config.WIT_TOKEN;
const client = new Wit({
    accessToken: WIT_TOKEN
});

module.exports = {
    handleMessage: function (entry, callback) {
        for (let i = 0; i < entry.length; i++) {
            let eventTime = entry[i].time;
            console.log('Event time: ' + eventTime);
            let events = entry[i].messaging;

            for (let j = 0; j < events.length; j++) {
                let reply = {
                    senderId: '',
                    text: ''
                };
                let senderId = events[i].sender.id;
                let recipientId = events[i].recipient.id;

                if (events[i].message && events[i].message.text) {
                    let messageText = events[i].message.text;
                    reply.senderId = senderId;
                    reply.text = messageText;
                    this.sendReply(reply, (res) => {
                        callback(res);
                    });
                }
            }
        }
    },

    sendReply: function (reply, callback) {
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
                    text: "Hello World!"
                }
            }
        };

        console.log('Sender ID: ' + reply.senderId);

        rp(options)
            .then((res) => {
                console.log('Response: ' + JSON.stringify(res));
                callback(res);
            })
            .catch((err) => {
                console.error(err);
            });
    },

    analyzeMessage: function (msg, callback) {
        client.message(msg, {})
            .then((data) => {
                callback(data);
            })
            .catch((err) => {
                throw err;
            });
    }
};
