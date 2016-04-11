/**
 * @author Benjamin Berman
 * © 2014 All Rights Reserved
 **/
Meteor.startup(function () {
    Frames.upsert('data.json', {_id: 'data.json', interval: 1000 / 25, frames: JSON.parse(Assets.getText('data.json'))});
});