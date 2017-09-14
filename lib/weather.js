'use strict';

const messages = require(__dirname + '/weather.js');
const config = require(__dirname + '/../config.js');
const rp = require('request-promise');

function requestWeatherByLocation(location, callback) {
    let uri = 'https://query.yahooapis.com/v1/public/yql';
    // columns in the table containing the relevant info needed for the weather
    let tableColumns = 'units, location, item';
    let yqlQuery = 'select ' + tableColumns + ' from weather.forecast where woeid in (select woeid from geo.places(1) where text="';
    yqlQuery += location + '")';

    let options = {
        uri: uri,
        method: 'GET',
        qs: {
            q: yqlQuery
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true
    };

    rp(options)
        .then((data) => {
            callback(data.query.results.channel);
        })
        .catch((err) => {
            console.log(err);
        });
}

function parseWeatherInfo(weather) {
    // unit of measurements used for weather info
    let units = weather.units;
    // an object containing: city, country, and region
    let location = weather.location;
    // the forecast for the current day - object containing: code, date, day, high, low, and text
    let forecast = weather.item.forecast[0];

    return `The forecast today for ${location.city},${location.region} is as follows:\nHigh temp: ${forecast.high} °${units.temperature},\nLow temp: ${forecast.low} °${units.temperature}`;
}

module.exports.requestWeatherByLocation = requestWeatherByLocation;
module.exports.parseWeatherInfo = parseWeatherInfo;
