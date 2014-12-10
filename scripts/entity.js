namespace.module('bot.entity', function (exports, require) {

    var TEAM_CHAR = 0;
    var TEAM_MONSTER = 1;

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var EntityModel = Backbone.Model.extend({
        defaults: function () { 
            return {
                strength: 10,
                dexterity: 10,
	        wisdom: 10,
	        vitality: 10,
	        level: 1,
	        weapon: {'damage': 1, 'range':1, 'speed': 1, "affixes": ["strength more 1.1"]}, //'fists' weapon auto equipped when unarmed.
		armor: [],
	        affixes: ['strength more 1.5', 'strength more 2', 'strength added 10'],
		skillChainDef: [{"name":"basic melee", "affixes": ['meleeDmg more 1.5']}],  
                team: 1
	    };
        },

        initialize: function() {
            log.debug('EntityModel initialize');
	    this.computeAttrs();
	},

	applyAffixes: function(startVal, mods) {
	    var moreAffs = [];
	    var addedAffs = [];
	    for(var i = 0; i < mods.length; i++) {
		var splits = mods[i].split(' ');
		var modtype = splits[0];
                var amount = parseFloat(splits[1]);
		if (modtype == 'added') {
		    addedAffs.push(amount);
		} else if (modtype == 'more') {
		    moreAffs.push(amount);
		}
	    }
	    var flat = addedAffs.reduce(function(a,b) {return a+b;}, startVal);
	    var mult = moreAffs.reduce(function(a,b) {return a*b;}, flat);
	    return mult;
	},

        applyAllAffixes: function(t, stats, affixDict) {
	    for (i = 0; i < stats.length; i++) {
		var stat = stats[i];
		if(affixDict[stat]) {
		    t[stat] = this.applyAffixes(t[stat], affixDict[stat]);
		}
	    }
        },

        computeAttrs: function() {
            var t = {}; //temp values
	    t.strength = this.get('strength');
	    t.dexterity = this.get('dexterity');
	    t.wisdom = this.get('wisdom');
	    t.vitality = this.get('vitality');
	    t.level = this.get('level');
	    
	    t.weapon = this.get('weapon');
	    t.armor = this.get('armor');
	    t.skillChainDef = this.get('skillChainDef');
	    t.affixes = t.weapon.affixes;
	    for (var i = 0; i < t.armor.length; i++) {
		if(t.armor[i].affixes) {
		    t.affixes = t.affixes.concat(t.armor[i].affixes);
		}
	    }
	    console.log(t.affixes);

	    //Add affix bonuses
	    //Affix format is 'stat modtype amount'
	    var affixDict = {};
            if (t.affixes === undefined) {
                log.debug('right here');
            }
	    for (var i = 0; i < t.affixes.length; i++) {
		var stat = t.affixes[i].split(' ')[0];
		var mod = t.affixes[i].split(' ').slice(1).join(' ');
		if (affixDict[stat]) {
		    affixDict[stat].push(mod);
		} else {
		    affixDict[stat] = [mod];
		}
	    }

            this.applyAllAffixes(t, ['strength', 'dexterity', 'wisdom', 'vitality'], affixDict);

	    // Todo? should we pull these constants out and give them easily manipulable names 
	    // so we can balance away from crucial code? 
	    // eg
	    // HP_PER_LVL = 10;
	    // HP_PER_VIT = 2;

            t.hp = t.level * 10 + t.vitality * 2 ;
	    t.mana = t.level * 5 + t.wisdom * 2;
	    t.armor = t.strength * 0.5;
	    t.dodge = t.dexterity * 0.5;
	    t.eleResistAll = 1 - Math.pow(0.997, t.wisdom); //temp var only

            this.applyAllAffixes(t, ['hp', 'mana', 'armor', 'dodge', 'eleResistAll'], affixDict);

	    t.fireResist = t.eleResistAll;
	    t.coldResist = t.eleResistAll;
	    t.lightResist = t.eleResistAll;
	    t.poisResist = t.eleResistAll;
	    
            this.applyAllAffixes(t, ['fireResist','coldResist', 'lightResist', 'poisResist'], affixDict);

	    t.skillChain = [];
	    for(var i = 0; i < t.skillChainDef.length; i++) {
		var tskill = t.skillChainDef[i];
		var wholeSkill = namespace.bot.itemref.expand("skill", tskill.name);
		wholeSkill.physDmg = t.weapon.damage;
		wholeSkill.range = t.weapon.range;
	        wholeSkill.speed = t.weapon.speed;
		//TODO calculate damage affix bonuses
		console.log(wholeSkill);
		t.skillChain.push(wholeSkill);
	    }
	    


	    console.log('entitymade with stats ', t);
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
       		poisResist: t.poisResist,
	       	skillChain: t.skillChain
            });
        },

        isMonster: function() {
            return this.get('team') === TEAM_MONSTER;
        },

        isChar: function() {
            return this.get('team') === TEAM_CHAR;
        },
    });

    var CharModel = EntityModel.extend({
        defaults: _.extend({}, EntityModel.prototype.defaults(), {
            team: TEAM_CHAR,
        }),

        localStorage: new Backbone.LocalStorage('char'),

        initialize: function() {
            log.debug('CharModel initialize');
            this.fetch();
            this.computeAttrs();
        }
    });

    var MonsterModel = EntityModel.extend({
        defaults: _.extend({}, EntityModel.prototype.defaults(), {
            team: TEAM_MONSTER,
        }),

        initialize: function() {
            //fetchMonsterConstants(name, level);
            // lookup given name and level
            log.debug('MonsterModel initialize');
            this.computeAttrs();
        }
    });

    function newMonster(name, level) {
        //return new MonsterModel({name: name, level: level});
        return new MonsterModel();
    }

    function newChar() {
        return new CharModel();
    }

    exports.extend({
        newChar: newChar,
        newMonster: newMonster,
    });

    // testing
    (function() {
        var x;
        x = new EntityModel({ strength: 10, wisdom: 20 });
        x = newMonster('hurr', 10);
        x = newChar();
    })();
});