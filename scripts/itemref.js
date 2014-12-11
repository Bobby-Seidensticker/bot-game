namespace.module('bot.itemref', function (exports, require) {
    var log = namespace.bot.log;

    var ref = {
        "weapon": {
            "weapon": {
                "speed": 1,
                "damage": 1,
                "range": 1
            },
            "wooden sword": {
                "prototype": ["weapon"],
                "type": "melee",
                "damage": 2,
            },
            "shitty bow": {
                "prototype": ["weapon"],
                "type": "range",
                "damage": 2,
                "range": 4
            },
            "magic stick": {
                "prototype": ["weapon"],
                "type": "spell",
                "range": 6
            },

            "knobby club": {
                "prototype": ["weapon"],
                "type": "melee",
                "speed": 1.2,
                "damage": 4,
            },
            "wooden bow": {
                "prototype": ["weapon"],
                "type": "range",
                "damage": 4,
                "range": 5
            },
            "crap wand": {
                "prototype": ["weapon"],
                "type": "spell",
                "damage": 3,
                "range": 6
            },
        },
        "armor": {
            "armor": {
                "affixes": ["armor 1"],
                "weight": 1
            },
            "balsa helmet": {
                "prototype": ["armor"],
                "type": "head",
            },
            "smelly cod piece": {
                "prototype": ["armor"],
                "type": "body",
                "weight": 2
            },
            "cardboard kneepads": {
                "prototype": ["armor"],
                "type": "legs",
            }
        },
        "skill": {
            "basic": {
            },
            "basic melee": {
                "prototype": ["basic"],
                "class": "melee",
                "types": ["melee"],
            },
            "basic range": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj"],
            },
            "basic spell": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj"],
            },

            "fireball": {
                "prototype": ["basic spell"],
                "affixes": ["fireDmg added 10"],
                "manaCost": 5
            },
            "poison ball": {
                "prototype": ["basic spell"],
                "types": ["proj", "DOT"],
                "affixes": ["poisDmg added 5"],
                "manaCost": 5
            },

            "super smash": {
                "prototype": ["basic melee"],
                "affixes": ["PhysDmg more 1.4"],
                "manaCost": 5
            },
            "flame strike": {
                "prototype": ["basic melee"],
                "affixes": ["fireDmg more 1.25"],
                "manaCost": 5
            },

            "fire arrow": {
                "prototype": ["basic range"],
                "affixes": ["fireDmg more 1.3"],
                "manaCost": 5
            },
            "lightning arrow": {
                "prototype": ["basic range"],
                "affixes": ["lightDmg more 1.3"],
                "manaCost": 5
            }
        },
        "affix": {
            "list of all valid affixes": [
	        "strength",
		"dexterity",
		"widsom",
		"vitality",
		"hp",
		"mana",
		"armor",
		"dodge",
		"eleResistAll",
		"fireResist",
		"coldResist",
		"lightResist",
		"poisResist",
		"meleeDmg",
		"rangeDmg",
		"spellDmg",
		"physDmg",
		"fireDmg",
		"coldDmg",
		"lightDmg",
		"poisDmg",
		"attSpd",
		"range",
		"manaCost"
	    ]
        },
	"recipe": {
	    "smelly cod piece" : {
		"type": "armor",
		"cost": "4 poops"
	    },
	    "balsa helmet" : {
		"type": "armor",
		"cost": "9 poops"
	    },
	    "lightning arrow": {
		"type": "skill",
		"cost": "10 sparks"
	    }
	},
	"monster": {
	    "skelleton" : {
		"skillChain": ["basic melee"],
		"weapon" : ["wooden sword"],
		"armor": ["smelly cod piece"],
		"affixes": ["physDmg added 5", "hp added 20", "fireResist added -20"]
	    },
	    "skelleton archer" : {
                "prototype" : ["skelleton"],
		"skillChain": ["basic range"],
                "armor": ["smelly cod piece"],
		"weapon": "shitty bow",
		"affixes": ["physDmg added 2", "hp added 10", "fireResist added -20"]
	    },
	    "skelleton mage" : {
                "prototype" : ["skelleton"],
		"skillChain": ["basic spell"],
                "armor": ["smelly cod piece"],
		"weapon": "magic stick",
                "affixes": ["spellDmg more 2", "fireResist added -20"]
            },
	    "skelleton king" : {
                "prototype" : ["skelleton"],
		"skillChain": ["fire slash", "basic melee"],
                "affixes": ["physDmg added 10", "hp added 50", "fireResist added -20"]
            },
        },
        "test": {
            "hngg": {"a": 10},
            "fwah": {"b": 10},
            "buh": {"a": 12},
            "hi": {
                "prototype": ["hngg", "fwah"],
                "b": 12
            },
            "foo": {
                "prototype": ["hngg", "buh"],
                "a": 15
            },
            "harf": {
                "prototype": ["hi", "foo"],
                "c": 10
            }
        }
        // it goes: [hngg, fwah, hi, hngg, buh, foo, harf]: c: 10, b: 12, a: 15
    };

    /*
    fuck: a = 1
    fwah: a = 3
    shit: a = 2

    asdf: [fuck(2), shit(3)]

    fdsa: [fwah(5)]

    buh: [asdf(1), fdsa(4)]

    [asdf, fuck, shit, fdsa, fwah]
    */

    function recExtend(name, r, names) {
        if ('prototype' in r[name] && r[name]['prototype'].length > 0) {
            for (var i = 0; i < r[name]['prototype'].length; i++) {
                names = recExtend(r[name]['prototype'][i], r, names);
            }
        }
        names[names.length] = name;
        log.info("recExtend, name %s, names now %s", name, JSON.stringify(names));
        return names;
    }

    function expand(type, name) {
        if (!(type in ref) || !(name in ref[type])) {
            log.error('Could not find reference for a %s named %s', type, name);
            throw('fuck');
            return;
        }

        var names = recExtend(name, ref[type], []);
        var item = $.extend(true, {}, ref[type][name]);
        for (var i = 0; i < names.length; i++) {
            item = $.extend(true, item, ref[type][names[i]]);
        }
        if ('itemType' in item) {
            throw(sprintf('Found a "itemType" key in item %s. No item is allowed to have "itemType" as it it set in expand', JSON.stringify(item)))
        }
        item['itemType'] = type;
        if ('name' in item) {
            throw(sprintf('Found a "name" key in item %s. No item is allowed to have "name" as it it set in expand', JSON.stringify(item)))
        }
        item['name'] = name;

        log.info("Final item: %s", JSON.stringify(item));

        return item;
    }

    exports.extend({
        'ref': ref,
        'expand': expand
    });

});