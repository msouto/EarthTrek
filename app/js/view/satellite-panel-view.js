/**
 * @class SatellitePanelView
 * @module EarthTrek
 * @author SATrek
 * @author Alejandro Sanchez <alejandro.sanchez.trek@gmail.com>
 * @description EarthTrek - NASA Space Apps 2017 13 APR 2017.
 */
//require("amd-loader");
define([
    'jquery',
    'bootstrap',
    'slick',
    '../provider',
    '../earthtrek-layer'
], function () {

    function SatellitePanelView(viewer, options) {
        this.viewer = viewer;
        this.mainContainerId = this.viewer.container.id;
        if (!options.container) {
            throw new Error('Invalid  Container');
        }
        if (options.satelliteInfoContainer) {
            this.satelliteInfoContainer = '#' + options.satelliteInfoContainer;
        } else {
            this.satelliteInfoContainer = '#satellite-info';
        }
        this.satellitePanel = $('#' + options.container);
        this.instrumentsContainer = $("#satellite-instruments");
    }

    SatellitePanelView.prototype.show = function (entity) {
        this.instrumentsContainer.empty();
        $(this.satelliteInfoContainer).empty();
        $('#satellite-instrument-layers').empty();
        if (entity.properties == undefined) {
            this.satellitePanel.hide();
            return false;
        }

        this.entity = entity;
        $('#satellite-name').html(entity.properties.name.getValue());

        var tle = this.entity.properties.getValue().tle.join("\n");
     //   var parsedTLE = TLE.parse( tle );
      //  console.log(parsedTLE);
    //    this.showOrbitalData(entity.properties.orbitalData.getValue());

        if (entity.properties.instruments !== undefined) {
            this.addInstruments(entity)
        }
        this.satellitePanel.show();
    }

    SatellitePanelView.prototype.showOrbitalData = function (data) {
        var that = this;
        var orbitalDataKeys = document.createElement('div');
        $(orbitalDataKeys).addClass("orbital-data-keys");
        var orbitalDataValues = document.createElement('div');
        $.each(data, function(key, value) {
            var orbitalDataKey = document.createElement('div');
            $(orbitalDataKey).append(key);
            $(orbitalDataKeys).append(orbitalDataKey);

            var orbitalDataValue = document.createElement('div');

            $(orbitalDataValue).append(that.magnitudesToOrbitalData(key, value));
            $(orbitalDataValues).append(orbitalDataValue);
        });

        $(this.satelliteInfoContainer).append(orbitalDataKeys);
        $(this.satelliteInfoContainer).append(orbitalDataValues);
    }

    SatellitePanelView.prototype.hide = function () {
        this.satellitePanel.hide();
    }

    SatellitePanelView.prototype.addInstruments = function (entity) {
        var that = this;
        var instruments = entity.properties.instruments.getValue();
        if (instruments.length === 0) {
            return false;
        }
        instruments.forEach(function(instrument) {
            if (instrument == null) {
                return false;
            }
            var instrumentElement = document.createElement('div');
            $(instrumentElement).id = "satellite-instrument-" + entity.id + "-" + instrument.name;
            $(instrumentElement).addClass("satellite-instrument");
            $(instrumentElement).html("<div>" + instrument.name + "</div>");
            $(instrumentElement).data('instrument', instrument.name);

            var layerButton = document.createElement("button");
            $(layerButton).click({entity: that.entity, panel: that, instrument: instrument}, that.showLayers);
            $(instrumentElement).append(layerButton);

            that.instrumentsContainer.append(instrumentElement);
        });
    }

    SatellitePanelView.prototype.updateLayers = function (event) {
        var today = this.isoDate(this.viewer.clock.currentTime.toString());
        var entity = event.data.entity;
        var selectedInstrument = $($('.selected-instrument')[0].parentElement).data('instrument');

        $.each(entity.properties.instruments.getValue(), function(key, instrument) {
            if (instrument.name == selectedInstrument) {
                $.each(instrument.layers, function(key, layer) {
                    if (layer.startDate <= today && layer.endDate >= today) {
                        $('#layer-view-' + layer.id).removeAttr('disabled');
                    } else {
                        $('#layer-view-' + layer.id).attr('disabled', 'disabled');
                    }
                });
            }
        });
    }


    SatellitePanelView.prototype.showLayers = function (event) {
        var entity = event.data.entity;
        var panel = event.data.panel;
        $('.satellite-instrument .selected-instrument').removeClass('selected-instrument');

        $(this).addClass("selected-instrument");
        $("#satellite-instrument-layers").empty();
        $.each(entity.properties.instruments.getValue(), function(key, instrument) {
            if (instrument.name == event.data.instrument.name) {
                $.each(instrument.layers, function(key, layer) {
                    var instrumentLayer = panel.createLayer(layer);
                    $("#satellite-instrument-layers").append(instrumentLayer).show();
                });
            }
        });

        /*
        $("#accept-date").click(function () {
            if ($('#compare-date').val()) {
                var layer = {};
                layer.id = $('.compare-selected').parent().data("id");
                layer.firstDate = $('#compare-date').val();
                layer.secondDate = clock.currentTime.toString();
                layer.format = $('.compare-selected').parent().data("format");
                layer.resolution = $('.compare-selected').parent().data("resolution");

                compare(layer);
                $('#compare-modal').hide();
            }
        });*/
    }

    SatellitePanelView.prototype.createLayer = function(layer) {
        var that = this;
        var today = this.isoDate(this.viewer.clock.currentTime.toString());
        var instrumentLayer = document.createElement('div');
        $(instrumentLayer).addClass("instrument-layer");
        $(instrumentLayer).data("id", layer.id);
        $(instrumentLayer).data("startDate", layer.startDate);
        $(instrumentLayer).data("format", layer.format);
        $(instrumentLayer).data("resolution", layer.resolution);


        var endDate = (layer.endDate == null) ? 'Present' : layer.endDate;

        var startDateButton = document.createElement('button');
        $(startDateButton).html(layer.startDate);
        $(startDateButton).click(function() {
            that.viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(layer.startDate));
        });
        var endDateButton = document.createElement('button');
        $(endDateButton).html(endDate);
        $(endDateButton).click(function() {
            var endDateObj = new Date(layer.endDate);
            if (layer.endDate == null) {
                endDateObj = new Date();
            }
            that.viewer.clock.currentTime = Cesium.JulianDate.fromDate(endDateObj);
        });

        var layerAvailable = document.createElement('div');
        $(layerAvailable).addClass("layer-available");
        $(layerAvailable).html('<span>Available:</span>');
        $(layerAvailable).append(startDateButton);
        $(layerAvailable).append(' - ');
        $(layerAvailable).append(endDateButton);

        $(instrumentLayer).html("<div>" + layer.title + "</div>");
        $(instrumentLayer).append(layerAvailable);

        var instrumentButtons = document.createElement("div");
        $(instrumentButtons).addClass('fixed-buttons');
        $(instrumentLayer).append(instrumentButtons);
        /**
         * SHOW LAYER
         * @type {Element}
         */
        var objToday = new Date(today);
        objToday.setDate(objToday.getDate());
        var toggleLayerButton = document.createElement("button");
        $(toggleLayerButton).attr('id', 'layer-view-' + layer.id);
        $(toggleLayerButton).on('click', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                for (var i = 0; i <= that.viewer.scene.imageryLayers.length - 1; i++) {
                    var imageryLayer = that.viewer.scene.imageryLayers.get(i);
                    if (imageryLayer.imageryProvider._layer == layer.id) {
                        that.viewer.scene.imageryLayers.remove(imageryLayer);
                    }
                }
            } else {
                $(this).addClass('selected');
                for (var i = 0; i <= that.viewer.scene.imageryLayers.length - 1; i++) {
                    var imageryLayer = that.viewer.scene.imageryLayers.get(i);
                    if (layer.format == 'image/jpeg' && imageryLayer.imageryProvider.format == 'image/jpeg') {
                        imageryLayer.show = false;
                    }
                }
                var maximumLevel = (layer.format == 'image/png') ? 2 : 12;
                var newLayer = provider.getProvider({
                    layer: layer.id,
                    time: that.isoDate(objToday.toISOString()),
                    format: layer.format,
                    tileMatrixSetID: "epsg4326",
                    resolution: layer.resolution,
                    maximumLevel: maximumLevel
                });
                //  earthTrekLayer.addLayer(newLayer);
                that.viewer.scene.imageryLayers.addImageryProvider(newLayer);
            }

        });

        $(toggleLayerButton).addClass("view");
        $(instrumentButtons).append(toggleLayerButton);

        /**
         * COMPARE
         * @type {Element}
         */
        var compareButton = document.createElement("button");
        $(compareButton).html("C");
        $(compareButton).click(function () {
            $('.compare-selected').removeClass('compare-selected');
            $(this).addClass("compare-selected");
            $('#compare-modal').show();
        });
        $(instrumentButtons).append(compareButton);

        if (layer.endDate < today || layer.startDate > today) {
            $(toggleLayerButton).attr('disabled', 'disabled');
            $(compareButton).attr('disabled', 'disabled');
        }
        return instrumentLayer;
    }

    SatellitePanelView.prototype.isoDate = function(isoDateTime) {
        return isoDateTime.split("T")[0];
    };

    SatellitePanelView.prototype.magnitudesToOrbitalData = function (key, value) {

        var data = {
            perigee: 'KM',
            apogee: 'KM',
            inclination: '�',
            period: 'mins'
        }
        if (data[key] == undefined) {
            return value;
        }
        return value + ' ' + data[key];
    }

    SatellitePanelView.prototype.render = function () {

    }

    return SatellitePanelView;
});