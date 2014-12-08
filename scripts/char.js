namespace.module('bot.char', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var CharModel = Backbone.Model.extend({
        defaults: {
            str: 5,
            intel: 5
        },

        initialize: function() {
            console.log(this.get('fuckyou'));  // prints 'hey'
        },

        computeAttrs: function() {
            var hp = this.str * 10;
            var mana = this.intel * 10;
            this.set({
                hp: hp,
                maxHp: hp,
                mana: mana,
                maxMana: mana
            });
        },
        
    });

    var c = new CharModel({ str: 10, intel: 20, fuckyou: 'hey' });


    exports.extend({
        CharModel: CharModel
    });
});