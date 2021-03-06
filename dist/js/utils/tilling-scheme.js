'use strict';

var Cesium = require('./cesium');
var gibs = gibs || {};

gibs.GeographicTilingScheme = function (options) {

    var self = new Cesium.GeographicTilingScheme(options);
    var Math = Cesium.Math;

    var tilePixels = 512;
    var rectangle = Cesium.Rectangle.MAX_VALUE;

    // Resolution: radians per pixel
    var levels = [{ width: 2, height: 1, resolution: 0.009817477042468103 }, { width: 3, height: 2, resolution: 0.004908738521234052 }, { width: 5, height: 3, resolution: 0.002454369260617026 }, { width: 10, height: 5, resolution: 0.001227184630308513 }, { width: 20, height: 10, resolution: 0.0006135923151542565 }, { width: 40, height: 20, resolution: 0.00030679615757712823 }, { width: 80, height: 40, resolution: 0.00015339807878856412 }, { width: 160, height: 80, resolution: 0.00007669903939428206 }, { width: 320, height: 160, resolution: 0.00003834951969714103 }, { width: 640, height: 320, resolution: 0.000019175
        /*    { width: 1280, height: 640, resolution: 0.000009587 },
            { width: 2560, height: 1280, resolution: 0.000004794 },
            { width: 5120, height: 2560, resolution: 0.000002397 }*/
    }];

    self.getNumberOfXTilesAtLevel = function (level) {
        return levels[level].width;
    };

    self.getNumberOfYTilesAtLevel = function (level) {
        return levels[level].height;
    };

    self.tileXYToRectangle = function (x, y, level, result) {
        var xTiles = levels[level].width;
        var yTiles = levels[level].height;
        var resolution = levels[level].resolution;

        var xTileWidth = resolution * tilePixels;
        var west = x * xTileWidth + rectangle.west;
        var east = (x + 1) * xTileWidth + rectangle.west;

        var yTileHeight = resolution * tilePixels;
        var north = rectangle.north - y * yTileHeight;
        var south = rectangle.north - (y + 1) * yTileHeight;

        if (!result) {
            result = new Cesium.Rectangle(0, 0, 0, 0);
        }
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    self.positionToTileXY = function (position, level, result) {
        if (!Cesium.Rectangle.contains(rectangle, position)) {
            return undefined;
        }

        if (levels[level] == undefined) {
            return undefined;
        }
        var xTiles = levels[level].width;
        var yTiles = levels[level].height;
        var resolution = levels[level].resolution;

        var xTileWidth = resolution * tilePixels;
        var yTileHeight = resolution * tilePixels;

        var longitude = position.longitude;
        if (rectangle.east < rectangle.west) {
            longitude += Math.TWO_PI;
        }

        var xTileCoordinate = (longitude - rectangle.west) / xTileWidth | 0;
        if (xTileCoordinate >= xTiles) {
            xTileCoordinate = xTiles - 1;
        }

        var latitude = position.latitude;
        var yTileCoordinate = (rectangle.north - latitude) / yTileHeight | 0;
        if (yTileCoordinate > yTiles) {
            yTileCoordinate = yTiles - 1;
        }

        if (!result) {
            result = new Cesium.Cartesian2(0, 0);
        }
        result.x = xTileCoordinate;
        result.y = yTileCoordinate;
        return result;
    };

    return self;
};

module.exports = gibs;