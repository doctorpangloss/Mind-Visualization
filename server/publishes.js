/**
 * @author Benjamin Berman
 * © 2014 All Rights Reserved
 **/
Meteor.publish('frames', function (id) {
    return Frames.find(id);
});