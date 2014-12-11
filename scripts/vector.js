namespace.module('bot.vector', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    function dist(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0]) + Math.pow(a[1] - b[1]));
    }

    function getDistances(base, targets) {
        return _.map(targets, function(target) { return dist(base, target); });
    }

});