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
	    weapon: {"baseDamage": 1, "attackSpeed":1}, //"fists" weapon auto equipped when unarmed.
	    affixes: []
	},

        initialize: function() {
            console.log(this.get('fuckyou'));  // prints 'hey'
        },

	applyAffixMods: function(startVal, mods) {
	    var moreAffs = [];
	    var addedAffs = [];
	    for(var i = 0; i < mods.length; i++) {
		var splits = mods[i].split(' ');
		var modtype = splits[0];
		var amount = splits[1];
		if (modtype == "added") {
		    addedAffs.append(amount);
		} else if (modtype == "more") {
		    moreAffs.append(amount);
		}
	    }
	    var flat = addedAffs.reduce(function(a,b) {return a+b;});
	    var mult = moreAffs.reduce(function(a,b) {return a*b;});
	    return (startVal + flat) * mult;
		
	},

        computeAttrs: function() {
            var t = {}; //temp values
	    t.strength = this.get('strength');
	    t.dexterity = this.get('dexterity');
	    t.wisdom = this.get('wisdom');
	    t.vitality = this.get('vitality');
	    t.level = this.get('level');
	    
	    //Add affix bonuses
	    //Affix format is "stat modtype amount"
	    var affixDict = {};
	    for (var i = 0; i < affixes.length; i++) {
		var stat = affixes[i].split(' ')[0];
		var mod = affixes[i].split(" ").slice(1).join(" ");
		if (affixDict[stat]) {
		    affixDict[stat].append(mod);
		} else {
		    affixDict[stat] = [mod];
		}
	    }

	    var statsToAffix = ["strength", "dexterity", "wisdom", "vitality"];
	    for (i = 0; i < statsToAffix.length; i++) {
		var stat = statsToAffix[i];
		if(affixDict[stat]) {
		    t[stat] = this.ApplyAffixMods(t[stat], affixDict[stat]);
		}
	    }


	    // Todo? should we pull these constants out and give them easily manipulable names 
	    // so we can balance away from crucial code? 
	    // eg
	    // HP_PER_LVL = 10;
	    // HP_PER_VIT = 2;

            t.hp = t.level * 10 + t.vitality * 2 ;
	    t.mana = t.level * 5 + t.wis * 2;
	    t.armor = t.strength * 1;
	    t.dodge = t.dexterity * 1;
	    t.eleResistAll = 1 - Math.pow(0.997, t.wisdom); //temp var only

	    var statsToAffix = ["hp","mana", "armor", "dodge", "eleResistAll"];
            for(i = 0; i < statsToAffix.length; i++) {
		var stat = statsToAffix[i];
                if(affixDict[stat]) {
                    t[stat] = this.ApplyAffixMods(t[stat], affixDict[stat]);
		}
            }

	    t.fireResist = t.eleResistAll;
	    t.coldResist = t.eleResistAll;
	    t.lightResist = t.eleResistAll;
	    t.poisResist = t.eleResistAll;
	    
	    var statsToAffix = ["fireResist","coldResist", "lightResist", "poisResist"];
            for(i = 0; i < statsToAffix.length; i++) {
		var stat = statsToAffix[i];
                if(affixDict[stat]) {
                    t[stat] = this.ApplyAffixMods(t[stat], affixDict[stat]);
		}
            }
	    console.log(["charmade with stats ", t]);
            this.set({
	        strength: t.strength,
		dexterity: t.dexterity,
		wisdom: t.wisdom,
		vitality: t.vitality,
                hp: t.hp,
                maxHp: t.hp,
                mana: t.mana,
		maxMana: t.mana,
	      	armor: t.armor,
	       	dodge: t.dodge,
	       	fireResist: t.fireResist,
	       	coldResist: t.coldResist,
	       	lightResist: t.lightResist,
	       	poisResist: t.poisResist 
            });
        },
        
    });

    var c = new CharModel({ strength: 10, wisdom: 20, fuckyou: 'hey' });


    exports.extend({
        CharModel: CharModel
    });
});