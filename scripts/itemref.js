namespace.module('bot.itemref', function (exports, require) {
    var log = namespace.bot.log;

    var ref = {
        "weapon": {
            "weapon": {
                "exp": 0,
                "affixes": [],
                "level": 0,
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
                "exp": 0,
                "level": 0,
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
                "type": "leg",
            }
        },
        "skill": {
            "basic": {
                "exp": 0,
                "level": 0,
                "affixes": [],
                "mana": 0
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
                "affixes": ["added fire damage 3"],
                "mana": 5
            },
            "poison ball": {
                "prototype": ["basic spell"],
                "types": ["proj", "DOT"],
                "affixes": ["added poison damage 3"],
                "mana": 5
            },

            "super smash": {
                "prototype": ["basic melee"],
                "affixes": ["added melee damage 3"],
                "mana": 5
            },
            "flame strike": {
                "prototype": ["basic melee"],
                "affixes": ["added fire damage 3"],
                "mana": 5
            },

            "fire arrow": {
                "prototype": ["basic range"],
                "affixes": ["added fire damage 3"],
                "mana": 5
            },
            "lightning arrow": {
                "prototype": ["basic range"],
                "affixes": ["added elec damage 3"],
                "mana": 5
            }
        },
        "affix": {
            "basic stat": {
                "exp": 0,
                "level": 1,
                "mod": [1, "flat"],
                "type": "stat",
            },

            "str": {
                "prototype": ["basic stat"],
                "target": "str"
            },
            "dex": {
                "prototype": ["basic stat"],
                "target": "dex"
            },
            "int": {
                "prototype": ["basic stat"],
                "target": "int"
            },
            "vit": {
                "prototype": ["basic stat"],
                "target": "vit"
            },

            "basic dmg": {
                "level": 1,
                "mod": [1.1, "pct"],
                "type": "dmg"
            },
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
	    },
            "poison ball": {
                "type": "skill",
                "cost": "10 tumors"
            }
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

    /*
    "weapon": {
        "name": "buh",
        "level": 0,
        "type": ["melee", "range", "spell"],
        "affixes": [],
        "speed": 1,
        "damage": 1,
        "range": 1
    },

    "armor": {
        "name": "buh",
        "level": 0,
        "type": ["head", "body", "legs", "feet", "hands"],
        "affixes": [],
        "al": 1, // armor level
        "weight": 1 // v2?
    },

    "skill": {
        "name": "buh",
        "level": 0,
        "class": ["melee", "range", "spell"],
        "type": ["circle", "cone", "melee", "proj", "DOT"], // can have multiple ie: circle DOT
        "affixes": [],
        "mana": 1
    },

    "affix": {
        "name": "herpderp",
        "kinds": [
        "strength up",
        "int up",
        "dexterity up",
        "vitality up",
        "hp up",
        "mana up",
        "armor/cold/fire/elec/poison resist up",
        "added spell/melee/range/cold/fire/elec/poison damage",
        "attack speed up"
        ],
        "modType": ["pct", "flat"],
        "mod": 1,
    }
    */

});