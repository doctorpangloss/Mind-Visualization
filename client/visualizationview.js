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

// Pain
const painColor = tinycolor('#BE1E2D');

// Pleasure
const pleasureColor = tinycolor('#8CC641');

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

                    // Modulators
                    // Fix names first
                    currentFrameData.modulators['securing_x5F_rate'] = currentFrameData.modulators.securing_rate;
                    currentFrameData.modulators['resolution_x5F_level'] = currentFrameData.modulators.resolution_level;
                    // Support epistemic competence in the future
                    if (!!currentFrameData.modulators.epistemic_competence) {
                        currentFrameData.modulators['epistemic_x5F_competence'] = currentFrameData.modulators.epistemic_competence;
                    }


                    _.each(currentFrameData.modulators, function (modulatorSpec, modulatorName) {
                        const inverseLerpedModulatorValue = (modulatorSpec.value - modulatorSpec.min) / (modulatorSpec.max - modulatorSpec.min);
                        var opacity = inverseLerpedModulatorValue * 0.5 + 0.5;
                        setElementProperties({
                            prefix: modulatorName,
                            suffixes: ['Modulator'],
                            properties: 'opacity',
                            value: opacity.toString()
                        });
                    });


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
                    const pleasureSvgElementIdSuffixes = ['Pleasure'];
                    const pleasureIndicatorSvgElementIdSuffixes = ['PleasureIndicator'];
                    const painSvgElementIdSuffixes = ['Pain'];
                    const painIndicatorSvgElementIdSuffixes = ['PainIndicator'];
                    // Needs rendering
                    _.each(currentFrameData.needs, function (needSpec, needName) {
                        // Weight
                        // Calculate SVG transform for size
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

                        // Urge
                        var urgeRgb = urgeColor.clone().desaturate(100 * (1 - needSpec.urge)).toRgbString();

                        setElementProperties({
                            prefix: needName,
                            suffixes: urgeColorSvgElementIdSuffixes,
                            properties: 'stroke',
                            value: urgeRgb
                        });

                        // Urgency
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

                        // Pleasure
                        var pleasureRgb = pleasureColor.clone().desaturate(100 * (1 - needSpec.pleasure)).toRgbString();
                        setElementProperties({
                            prefix: needName,
                            suffixes: pleasureSvgElementIdSuffixes,
                            properties: 'stroke',
                            value: pleasureRgb
                        });
                        setElementProperties({
                            prefix: needName,
                            suffixes: pleasureIndicatorSvgElementIdSuffixes,
                            properties: 'fill',
                            value: pleasureRgb
                        });

                        // Pain
                        var painRgb = painColor.clone().desaturate(100 * (1 - needSpec.pain)).toRgbString();
                        setElementProperties({
                            prefix: needName,
                            suffixes: painSvgElementIdSuffixes,
                            properties: 'stroke',
                            value: painRgb
                        });
                        setElementProperties({
                            prefix: needName,
                            suffixes: painIndicatorSvgElementIdSuffixes,
                            properties: 'fill',
                            value: painRgb
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

                    // Net pleasure and pain
                    var netPainColorRgb = painColor.clone().desaturate(100 * (1 - currentFrameData.aggregates.combined_pain.value)).toRgbString();
                    setElementProperties({
                        prefix: 'netPain',
                        suffixes: _.range(0, 3),
                        properties: 'stroke',
                        value: netPainColorRgb
                    });

                    var netPleasureColorRgb = pleasureColor.clone().desaturate(100 * (1 - currentFrameData.aggregates.combined_pleasure.value)).toRgbString();
                    setElementProperties({
                        prefix: 'netPleasure',
                        suffixes: _.range(0, 3),
                        properties: 'stroke',
                        value: netPleasureColorRgb
                    });

                    // Modulators


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