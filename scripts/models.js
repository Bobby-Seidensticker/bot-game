namespace.module('bot.models', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var prob = namespace.bot.prob;
    var log = namespace.bot.log;
    var views = namespace.bot.views;
    var itemref = namespace.bot.itemref;

    var data;

    exports.extend({
        'init': init
    });

    function init(rawData) {
        data = rawData;
    }

});