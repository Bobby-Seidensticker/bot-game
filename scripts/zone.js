namespace.module('bot.zone', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var ZoneModel = Backbone.Model.extend({
        defaults: {
            
	},

        initialize: function() {
            log.debug('ZoneModel initialize');
	},

    });

});