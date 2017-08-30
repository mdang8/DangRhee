'use strict';

const messages = require(__dirname + '/weather.js');
const config = require(__dirname + '/../config.js');
const rp = require('request-promise');
const fs = require('fs');

const OWM_API_KEY = process.env.OWM_API_KEY || config.OWM_API_KEY;

module.exports = {
    requestWeatherByLocation: function (location, callback) {
        this.lookupLocationID(location, (locationID) => {
            let uri = 'http://api.openweathermap.org/data/2.5/forecast';
            let options = {
                uri: uri,
                qs: {
                    id: locationID,
                    APPID: OWM_API_KEY
                },
                headers: {
                    'User-Agent': 'Request-Promise'
                },
                json: true
            };

            rp(options)
                .then((data) => {
                    callback(data);
                })
                .catch((err) => {
                    throw err;
                });
        });
    },

    lookupLocationID: function (location, callback) {
        let file = __dirname + '/../city.list.json';
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
                throw err;
            }

            let parsedData = JSON.parse(data);
            let locationID = '';

            for (let i = 0; i < parsedData.length; i++) {
                if (parsedData[i].name === location) {
                    locationID = parsedData[i].id;
                    break;
                }
            }

            callback(locationID);
        });
    }
};
