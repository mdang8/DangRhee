'use strict';

const config = require(__dirname + '/../config.js');
const Wit = require('node-wit').Wit;

const WIT_TOKEN = process.env.WIT_TOKEN || config.WIT_TOKEN;
const client = new Wit({
    accessToken: WIT_TOKEN
});

module.exports = {
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
