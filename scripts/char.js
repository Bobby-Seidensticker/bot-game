namespace.module('bot.char', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var CharModel = Backbone.Model.extend({
        
    });


    exports.extend({
        CharModel: CharModel
    });
});