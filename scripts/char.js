namespace.module('bot.char', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var CharModel = Backbone.Model.extend({
        defaults: {
            strength: 1,
            dexterity: 1,
	    wisdom: 1,
	    vitality: 1,
	    level: 1,
	    weapon: {"baseDamage": 1, "attackSpeed":1} //"fists" weapon auto equipped when unarmed.
        },

        initialize: function() {
            console.log(this.get('fuckyou'));  // prints 'hey'
        },

        computeAttrs: function() {
	    var strength = this.get('strength');
	    var dexterity = this.get('dexterity');
	    var wisdom = this.get('wisdom');
	    var vitality = this.get('vitality');
	    var level = this.get('level');
	    

	    // Todo? should we pull these constants out and give them easily manipulable names 
	    // so we can balance away from crucial code? 
	    // eg
	    // HP_PER_LVL = 10;
	    // HP_PER_VIT = 2;

            var hp = level * 10 + vitality * 2 ;
            var mana = level * 5 + wis * 2;
	    var armor = strength * 1;
	    var dodge = dexterity * 1;
	    var eleResistAll = 1 - Math.pow(0.997, wisdom); //temp var only
	    var fireResist = eleResistAll;
	    var coldResist = eleResistAll;
	    var lightResist = eleResistAll;
	    var poisResist = eleResistAll;
	    

            this.set({
                hp: hp,
                maxHp: hp,
                mana: mana,
		maxMana: mana,
	      	armor: armor,
	       	dodge: dodge,
	       	fireResist = fireResist,
	       	coldResist = coldResist,
	       	lightResist = lightResist,
	       	poisResist = poisResist 
            });
        },
        
    });

    var c = new CharModel({ strength: 10, wisdom: 20, fuckyou: 'hey' });


    exports.extend({
        CharModel: CharModel
    });
});