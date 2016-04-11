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
                    // Needs rendering
                    _.each(currentFrameData.needs, function (needSpec, needName) {
                        // TODO: Handle weights
                        var urgeRgb = urgeColor.clone().desaturate(100 * (1 - needSpec.urge)).toRgbString();
                        _.each(urgeColorSvgElementIdSuffixes, function (suffix) {
                            var element = document.getElementById(needName + suffix);
                            if (!element) {
                                return;
                            }
                            element.style.stroke = urgeRgb;
                        })
                    });


                    // Handle net urges


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