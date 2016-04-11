/**
 * @author Benjamin Berman
 * © 2014 All Rights Reserved
 **/


// Consumptors
const aversiveTinycolor = tinycolor('#E42326');
const appetitiveTinycolor = tinycolor('#0F763C');
const inactiveAversiveColorRgb = aversiveTinycolor.clone().greyscale().toRgbString();
const activeAversiveColorRgb = aversiveTinycolor.clone().toRgbString();
const inactiveAppetitiveColorRgb = appetitiveTinycolor.clone().greyscale().toRgbString();
const activeAppetitiveColorRgb = appetitiveTinycolor.clone().toRgbString();

// Urges
const urgeColor = tinycolor('#27AAE1');

// Urgencies
const urgencyColor = tinycolor('#F15A29');

// Utilities
var setElementProperties = function ({prefix = '', suffixes= [], properties= '', value= ''} = {}) {
    _.each(suffixes, function (suffix) {
        var element = document.getElementById(prefix + suffix);
        if (!element) {
            return;
        }
        if (!_.isArray(properties)) {
            properties = [properties];
        }
        _.each(properties, function (property) {
            element.style[property] = value;
        });
    })
};

Template.visualizationView.onRendered(function () {
    // TODO: Set up the frames for the visualization. For now, just save it to a far
    var self = this;
    self.autorun(function () {
        var data = Template.currentData() || {};
        var framesId = data.framesId || 'data.json';
        var startFrame = data.startFrame || 0;
        var loop = _.isUndefined(data.loop) ? true : data.loop;

        // Current frame starts at the specified start frame
        self.currentFrame = startFrame;

        self.subscribe('frames', framesId, {
            onReady: function () {
                var framesRecord = Frames.findOne(framesId);
                self.frames = framesRecord.frames;

                if (self.timer) {
                    self.timer.stop();
                }

                // TODO: Refactor into requestAnimationFrame with accumulated time to keep synchronized with video better
                self.timer = Meteor.setInterval(function () {
                    var currentFrameData = self.frames[self.currentFrame];

                    // Consumptors rendering
                    const consumptorSvgElementIdSuffix = 'Consumptor_1_';
                    const gainSvgElementIdSuffix = 'Gain_1_';

                    _.each(currentFrameData.consumptions, function (consumptionSpec, consumptionName) {
                        // Use most efficient find

                        var consumptorElement = document.getElementById(consumptionName + consumptorSvgElementIdSuffix);
                        var gainElement = document.getElementById(consumptionName + gainSvgElementIdSuffix);
                        if (!consumptorElement) {
                            // The diagram doesn't have the right names for these things
                            return;
                        }
                        // Use most efficient style change
                        var colorRgb = inactiveAppetitiveColorRgb;

                        switch (consumptionSpec.type) {
                            case 'aversive':
                                if (consumptionSpec.value == 0) {
                                    colorRgb = inactiveAversiveColorRgb;
                                } else {
                                    colorRgb = activeAversiveColorRgb;
                                }
                                break;
                            case 'appetitive':
                                if (consumptionSpec.value == 0) {
                                    colorRgb = inactiveAppetitiveColorRgb;
                                } else {
                                    colorRgb = activeAppetitiveColorRgb;
                                }
                                break;
                        }

                        consumptorElement.style.fill = colorRgb;
                        gainElement.style.stroke = colorRgb;
                    });


                    // These elements all share the same urge color
                    const urgeColorSvgElementIdSuffixes = ['Urge', 'UrgeCircle'];
                    const urgencyColorSvgElementIdSuffix = 'UrgencyWire';
                    const urgencyCircleColorSvgElementIdSuffixes = ['Urgency_1_', 'Urgency'];
                    const transformSvgElementIdSuffixes = ['Need', 'UrgeCircle', 'Urgency'];

                    // Needs rendering
                    _.each(currentFrameData.needs, function (needSpec, needName) {
                        // Lerp weight
                        var sx;
                        var sy;
                        sx = sy = (needSpec.weight / 11) * 0.5 + 0.5;

                        _.each(transformSvgElementIdSuffixes, function (suffix) {
                            var element = document.getElementById(needName + suffix);
                            if (!element) {
                                return;
                            }
                            var bbox = element.getBBox();
                            var cx = bbox.x + bbox.width / 2.0;
                            var cy = bbox.y + bbox.height / 2.0;
                            var transform = 'matrix(' + sx + ', 0, 0, ' + sy + ', ' + (cx - sx * cx) + ', ' + (cy - sy * cy) + ')';
                            element.style.transform = transform;
                        });

                        var urgeRgb = urgeColor.clone().desaturate(100 * (1 - needSpec.urge)).toRgbString();

                        setElementProperties({
                            prefix: needName,
                            suffixes: urgeColorSvgElementIdSuffixes,
                            properties: 'stroke',
                            value: urgeRgb
                        });

                        var urgencyRgb = urgencyColor.clone().desaturate(100 * (1 - needSpec.urgency)).toRgbString();

                        setElementProperties({
                            prefix: needName,
                            suffixes: [urgencyColorSvgElementIdSuffix],
                            properties: 'stroke',
                            value: urgencyRgb
                        });

                        setElementProperties({
                            prefix: needName,
                            suffixes: urgencyCircleColorSvgElementIdSuffixes,
                            properties: ['stroke', 'fill'],
                            value: urgencyRgb
                        });
                    });


                    // Handle net urges
                    var netUrgeColorRgb = urgeColor.clone().desaturate(100 * (1 - currentFrameData.aggregates.combined_urge.value)).toRgbString();
                    setElementProperties({
                        prefix: 'netUrge',
                        suffixes: _.range(0, 6),
                        properties: 'stroke',
                        value: netUrgeColorRgb
                    });
                    setElementProperties({
                        prefix: 'netUrge',
                        suffixes: [''],
                        properties: 'fill',
                        value: netUrgeColorRgb
                    });

                    // Net urgency
                    var netUrgencyColorRgb = urgencyColor.clone().desaturate(100 * (1 - currentFrameData.aggregates.combined_urgency.value)).toRgbString();
                    setElementProperties({
                        prefix: 'netUrgency',
                        suffixes: _.range(0, 7),
                        properties: 'stroke',
                        value: netUrgencyColorRgb
                    });
                    setElementProperties({
                        prefix: 'netUrgency',
                        suffixes: [''],
                        properties: 'fill',
                        value: netUrgencyColorRgb
                    });

                    // Increment the current frame
                    self.currentFrame++;
                    // If the current frame is greater than the frame count, loop
                    if (self.currentFrame >= self.frames.length) {
                        if (loop) {
                            self.currentFrame = startFrame;
                        } else {
                            self.currentFrame = self.frames.length - 1;
                        }
                    }
                }, framesRecord.interval);
            }
        });
    });
});

Template.visualizationView.onDestroyed(function () {
    this.timer.stop();
});