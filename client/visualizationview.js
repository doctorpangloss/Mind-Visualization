/**
 * @author Benjamin Berman
 * © 2014 All Rights Reserved
 **/
Template.visualizationView.onRendered(function () {
    // TODO: Set up the frames for the visualization. For now, just save it to a far
    var self = this;
    self.autorun(function () {
        var framesId = Template.currentData().framesId;
        self.subscribe('frames', framesId, {
            onReady: function () {
                var framesRecord = Frames.findOne(framesId);
                self.frames = framesRecord.frames;

                if (self.timer) {
                    self.timer.stop();
                }

                self.timer = Meteor.setInterval(function () {
                    console.log('interval');
                }, framesRecord.interval);
            }
        });
    });
});

Template.visualizationView.onDestroyed(function () {
    this.timer.stop();
});