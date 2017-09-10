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
                console.log('Handling event ' + j);
                let reply = {
                    recipientId: '',
                    text: ''
                };
                let senderId = events[i].sender.id;
                let recipientId = events[i].recipient.id;

                if (events[i].message && events[i].message.text) {
                    let messageText = events[i].message.text;
                    reply.recipientId = recipientId;
                    reply.text = messageText;
                    this.sendReply(reply);
                }
            }
        }

        callback(null);
    },

    sendReply: function (reply) {
        console.log('Message text: ' + reply.text);
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
