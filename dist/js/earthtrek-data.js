'use strict';

/**
 * @class EarthTrekData
 * @module EarthTrek
 * @author SATrek
 * @author Alejandro Sanchez <alejandro.sanchez.trek@gmail.com>
 * @description EarthTrek - NASA Space Apps 2017 23 APR 2017.
 */
var earthTrekData = earthTrekData || {};
var rp = require('request-promise');

'use strict';
var _ = require('underscore');
var satelliteIds = [];
/**
 * Get Satellites Ids
 */
earthTrekData.getSatelliteIds = function () {
    if (satelliteIds != null) {
        return satelliteIds;
    }
    earthTrekData.getSatellites().then(function (satellites) {
        var satIds = [];
        satellites.data.forEach(function (satellite) {
            satIds.push(satellite.satId);
        });
        satelliteIds = satIds;
        return satIds;
    });
};

/**
 *
 */
earthTrekData.getSatellites = function () {
    var config = earthTrekData.getConfig();
    var options = {
        uri: config.api.url + config.api.satellites.endpoint,
        json: true
    };
    return rp(options);
};

/**
 * Get TLE from Satellites IDs
 * @param ids
 * @param options
 * @returns {*}
 */
earthTrekData.getTLEs = function (ids, options) {
    var config = earthTrekData.getConfig();
    var params = [];
    var qs = {};
    params.push('ids=' + ids.join(','));
    qs.ids = ids.join(',');
    if (options.startDate) {
        var startDate = options.startDate;

        if (!(startDate instanceof Date)) {
            var startDate = new Date(startDate);
            startDate.setDate(startDate.getDate());
        }

        if (startDate instanceof Date) {
            startDate = startDate.getUTCFullYear() + '-' + (startDate.getUTCMonth() + 1) + '-' + startDate.getUTCDate();
        }
        qs.startDate = startDate;
        params.push('startDate=' + startDate);
        if (options.endDate) {
            var endDate = options.endDate;
            if (endDate instanceof Date) {
                endDate = endDate.getUTCFullYear() + '-' + (endDate.getUTCMonth() + 1) + '-' + endDate.getUTCDate();
            }
            params.push('endDate=' + endDate);
        }
        qs.endDate = endDate;
    }
    var fields = !options.fields ? config.api.tle.fields : options.fields;
    params.push("fields=" + fields);
    qs.fields = fields;
    params.push("extended=true");
    qs.extended = true;
    var options = {
        uri: config.api.url + config.api.tle.endpoint,
        qs: qs,
        json: true
    };
    return rp(options);
    //return $.ajax(config.api.url + config.api.tle.endpoint + "?" + params.join('&'));
};

/**
 *
 */
earthTrekData.getConfig = function () {
    return {
        api: {
            url: "http://api.orbitaldesign.tk/",
            satellites: {
                endpoint: "satellites"
            },
            tle: {
                endpoint: "tles",
                fields: "tle,satId"
            }
        }
    };
};

/**
 *
 */
earthTrekData.getFullData = function (options, callback) {
    if (!options.getCache) {
        options.getCache = false;
    }
    if (options.getCache == true) {
        return earthTrekData.getCache().then(function (data) {
            return callback(data);
        });
    }
    var promise = earthTrekData.getSatellites();
    var tlePromise = promise.then(function (satellites) {
        var satIds = [];
        satellites.data.forEach(function (satellite) {
            satIds.push(satellite.satId);
        });
        satelliteIds = satIds;
        return earthTrekData.getTLEs(satIds, options);
    });
    Promise.all([promise, tlePromise]).then(function (tles) {
        /**
         * @TODO -TEMPORAL
         */
        var finalJson = [];
        tles[0].data.forEach(function (satellite) {
            if (satellite.color == undefined) {
                satellite.color = '#8FBC8F';
            }
            tles[1].data.forEach(function (satTle) {
                if (satellite.satId == satTle.satId) {
                    satellite.data = _.extend({
                        'mass': satellite.mass,
                        'agency': satellite.agency,
                        'program': satellite.program,
                        'launchDate': satellite.launchDate
                    }, satTle.data);
                    var dataMerge = _.extend(satTle, satellite);
                    finalJson.push(dataMerge);
                }
            });
        });
        callback(finalJson);
    });
};

/**
 *
 * @returns {*}
 */
earthTrekData.getCache = function () {
    /* var options = {
         uri: 'data/satellites.json',
         json: true
     };
     return rp(options);*/
    return $.ajax('data/satellites.json');
};

/**
 *
 */
earthTrekData.getFeatures = function () {
    var config = earthTrekData.getConfig();
    return $.ajax('data/features.json');
};
module.exports = earthTrekData;