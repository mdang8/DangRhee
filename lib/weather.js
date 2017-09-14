'use strict';

const messages = require(__dirname + '/weather.js');
const config = require(__dirname + '/../config.js');
const rp = require('request-promise');
const fs = require('fs');
const ss = require('string-similarity');

const OWM_API_KEY = process.env.OWM_API_KEY || config.OWM_API_KEY;

module.exports = {
    requestWeatherByLocation: function (location, callback) {
        this.lookupLocation(location, (locationID) => {
            let uri = 'http://api.openweathermap.org/data/2.5/forecast';
            // options for request call
            let options = {
                uri: uri,
                qs: {  // query string parameters
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

    lookupLocation: function (locationName, callback) {
        // JSON file with an array of objects containing city/location data
        let file = __dirname + '/../city.list.json';
        // reads the JSON file
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
                throw err;
            }

            let parsedData = JSON.parse(data);
            let locationMatches = [];

            for (let i = 0; i < parsedData.length; i++) {
                // checks if the name string in the file contains the searched location string
                if (parsedData[i].name.indexOf(locationName) !== -1) {
                    // there can be multiple cities with the same name
                    locationMatches.push(parsedData[i]);
                }
            }

            callback(locationName, locationMatches);
        });
    },

    matchLocation: function (search, locations, callback) {
        if (locations.length > 0) {
            let similarities = {};
            for (let i = 0; i < locations.length; i++) {
                similarities[locations[i].id] = {
                    degree: ss.compareTwoStrings(search, locations[i]),
                    name: locations[i].name
                }
            }

            console.log(similarities);
        } else {
            callback('');
        }
    }
};
