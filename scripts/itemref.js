namespace.module('bot.itemref', function (exports, require) {
    var log = namespace.bot.log;
    var prob = namespace.bot.prob;

    var ref = {
        "weapon": {
            "weapon": {
                "speed": 1,
                "damage": 1,
                "range": 1
            },
            "fists" : {
                'damage': 0.1, 
                'range':1, 
                'speed': 1, 
                'affixes': []
            },
            "wooden sword": {
                "prototype": ["weapon"],
                "type": "melee",
                "damage": 2,
                "craftCost": "2 planks",
            },
            "bowie knife": {
                "prototype": ["weapon"],
                "type": "melee",
                "damage": 3,
                "craftCost": "3 nuggets",
            },
            "shitty bow": {
                "prototype": ["weapon"],
                "type": "range",
                "damage": 2,
                "range": 4,
                "craftCost": "3 poops",
            },
            "crappy wand": {
                "prototype": ["weapon"],
                "type": "spell",
                "range": 6,
                "craftCost": "3 poops",
            },

            "knobby club": {
                "prototype": ["weapon"],
                "type": "melee",
                "speed": 1.2,
                "damage": 4,
                "craftCost": "2 planks",
            },
            "wooden bow": {
                "prototype": ["weapon"],
                "type": "range",
                "damage": 4,
                "range": 5,
                "craftCost": "2 planks",
            },
            "decent wand": {
                "prototype": ["weapon"],
                "type": "spell",
                "damage": 3,
                "range": 6,
                "craftCost": "10 planks",
            },
        },
        "armor": {
            "armor": {
                "affixes": ["armor added 1"],
                "weight": 1
            },
            "balsa helmet": {
                "prototype": ["armor"],
                "type": "head",
                "craftCost": "4 planks",
            },
            "smelly cod piece": {
                "prototype": ["armor"],
                "type": "chest",
                "weight": 2,
                "craftCost": "4 poops",
            },
            "cardboard kneepads": {
                "prototype": ["armor"],
                "affixes": ["armor added 500"],
                "type": "legs",
                "craftCost": "2 poops"
            },
            "latex gloves": {
                "prototype": ["armor"],
                "affixes": ["poisDmg added 2"],
                "type": "hands",
                "craftCost": "2 poops"
            },
            "wood shield": {
                "prototype": ["armor"],
                "type": "offHand",
                "craftCost": "4 planks"
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
            "super smash": {
                "prototype": ["basic melee"],
                "affixes": ["physDmg more 40"],
                "manaCost": 5,
                "craftCost": "2 skulls",
            },        
            "fire slash": {
                "prototype": ["basic melee"],
                "affixes": ["fireDmg added 10"],
                "manaCost": 3,
                "craftCost": "3 embers",
            },
            "ice slash": {
                "prototype": ["basic melee"],
                "affixes": ["coldDmg added 11"],
                "manaCost": 5,
                "craftCost": "3 mints",
            },
            "lightning slash": {
                "prototype": ["basic melee"],
                "affixes": ["lightDmg added 12"],
                "manaCost": 6,
                "craftCost": "3 sparks",
            },
            "poison slash": {
                "prototype": ["basic melee"],
                "affixes": ["poisDmg added 13"],
                "manaCost": 7,
                "craftCost": "3 tumors",
            },
            "fire arrow": {
                "prototype": ["basic range"],
                "affixes": ["fireDmg added 8"],
                "manaCost": 3,
                "craftCost": "3 embers",
            },
            "ice arrow": {
                "prototype": ["basic range"],
                "affixes": ["coldDmg added 9"],
                "manaCost": 4,
                "craftCost": "3 mints"
            },
            "lightning arrow": {
                "prototype": ["basic range"],
                "affixes": ["lightDmg added 10"],
                "manaCost": 5,
                "craftCost": "3 sparks",
            },
            "poison arrow": {
                "prototype": ["basic range"],
                "affixes": ["poisDmg added 11"],
                "manaCost": 5,
                "craftCost": "3 tumors",
            },
            "fire ball": {
                "prototype": ["basic spell"],
                "affixes": ["fireDmg added 10"],
                "manaCost": 5,
                "craftCost": "3 embers",
            },
            "ice ball": {
                "prototype": ["basic spell"],
                "affixes": ["coldDmg added 10"],
                "manaCost": 5,
                "craftCost": "3 mints",
            },
            "lightning ball": {
                "prototype": ["basic spell"],
                "affixes": ["lightDmg added 10"],
                "manaCost": 5,
                "craftCost": "3 sparks",
            },
            "poison ball": {
                "prototype": ["basic spell"],
                "types": ["proj", "DOT"],
                "affixes": ["poisDmg added 15"],
                "manaCost": 5,
                "craftCost": "3 tumors",
            },

        },
        "affix": {
            "rollable": [
                "strength",
                "dexterity",
                "wisdom",
                "vitality",
                "maxHp",
                "maxMana",
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
                //"attSpd",
                //"range",
                "manaCost",
                "bloodthirst",
                "waterlogged",
            ],
            "basicStat": {
                "weight": 10,
                "validTypes": ["armor", "weapon"],
                "modifier": {
                    "added": {
                        "weight": 70,
                        "min": 5,
                        "max": 50
                    },
                    "more": {
                        "weight":30,
                        "min": 1,
                        "max": 5
                    }
                }
            },
            "strength": {
                "prototype": ["basicStat"]
            },
            "dexterity": {
                "prototype": ["basicStat"]
            },
            "wisdom": {
                "prototype": ["basicStat"]
            },
            "vitality": {
                "prototype": ["basicStat"]
            },
            "maxHp": {
                "weight": 50,
                "validTypes": ["armor", "weapon"],
                "modifier": {
                    "added": {
                        "weight": 10,
                        "min": 10,
                        "max": 100
                    },
                    "more": {
                        "weight": 10,
                        "min": 1,
                        "max": 10
                    }
                }
            },
            "maxMana": {
                "weight": 10,
                "validTypes": ["armor", "weapon"],
                "modifier": {
                    "added": {
                        "weight": 90,
                        "min": 10,
                        "max": 100
                    },
                    "more": {
                        "weight": 10,
                        "min": 3,
                        "max": 15
                    }
                }
            },
            "armor": {
                "weight": 8,
                "validTypes": ["armor"],
                "modifier": {
                    "added": {
                        "weight": 90,
                        "min": 10,
                        "max": 100
                    },
                    "more": {
                        "weight": 10,
                        "min": 3,
                        "max": 15
                    }
                }
            },
            "dodge": {
                "weight": 8,
                "validTypes": ["armor"],
                "modifier": {
                    "added": {
                        "weight": 90,
                        "min": 10,
                        "max": 100
                    },
                    "more": {
                        "weight": 10,
                        "min": 3,
                        "max": 15
                    }
                }
            },
            "eleResistAll": {
                "weight": 5,
                "validTypes": ["weapon", "armor"],
                "modifier": {
                    "added": {
                        "weight": 1,
                        "min": 3,
                        "max": 20
                    },
                }
            },
            "basicResist" : {
                "weight": 10,
                "validTypes": ["weapon", "armor"],
                "modifier": {
                    "added": {
                        "weight": 90,
                        "min": 5,
                        "max": 25
                    },
                }
            },
            "fireResist": {
                "prototype": ["basicResist"]
            },
            "coldResist": {
                "prototype": ["basicResist"]
            },
            "lightResist": {
                "prototype": ["basicResist"]
            },
            "poisResist": {
                "prototype": ["basicResist"]
            },
            "meleeDmg": {
                "weight": 20,
                "validTypes": ["weapon", "skill"],
                "modifier": {
                    "added": {
                        "weight": 50,
                        "min": 3,
                        "max": 100
                    },
                    "more": {
                        "weight": 50,
                        "min": 3,
                        "max": 10
                    }
                }
            },
            "rangeDmg": {
                "weight": 15,
                "validTypes": ["weapon", "skill"],                
                "modifier": {
                    "added": {
                        "weight": 60,
                        "min": 3,
                        "max": 100
                    },
                    "more": {
                        "weight": 40,
                        "min": 3,
                        "max": 15
                    }
                }
            },
            "spellDmg": {
                "weight": 15,
                "validTypes": ["weapon", "skill"],                
                "modifier": {
                    "added": {
                        "weight": 10,
                        "min": 3,
                        "max": 100
                    },
                    "more": {
                        "weight": 90,
                        "min": 2,
                        "max": 20
                    }
                }
            },
            "physDmg": {
                "weight": 25,
                "validTypes": ["weapon", "skill"],
                "modifier": {
                    "added": {
                        "weight": 70,
                        "min": 3,
                        "max": 100,
                    },
                    "more": {
                        "weight": 30,
                        "min": 3,
                        "max": 15
                    }
                }
            },
            "fireDmg" : {
                "weight": 150,
                "validTypes": ["weapon", "skill"],                
                "modifier": {
                    "added": {
                        "weight": 90,
                        "min": 5,
                        "max": 100
                    },
                    "more": {
                        "weight": 10,
                        "min": 2,
                        "max": 10
                    }
                }
            },
            "coldDmg" : {
                "weight": 15,
                "validTypes": ["weapon", "skill"],                
                "modifier": {
                    "added": {
                        "weight": 20,
                        "min": 3,
                        "max": 60
                    },
                    "more": {
                        "weight": 80,
                        "min": 3,
                        "max": 15
                    }
                }
            },
            "lightDmg": {
                "weight": 15,
                "validTypes": ["weapon", "skill"],                
                "modifier": {
                    "added": {
                        "weight": 50,
                        "min": 1,
                        "max": 300
                    },
                    "more": {
                        "weight": 50,
                        "min": 3,
                        "max": 10
                    }
                }
            },
            "poisDmg": {
                "weight": 5,
                "validTypes": ["weapon", "skill"],
                "modifier": {
                    "added": {
                        "weight": 87,
                        "min": 5,
                        "max": 50
                    },
                    "more": {
                        "weight": 13,
                        "min": 1,
                        "max": 13
                    }
                }
            },
            //TODO - add attSpd and range once we know how they'll work
            "manaCost": {
                "weight": 5,
                "validTypes": ["skill"],
                "modifier": {
                    "reduced": {
                        "weight": 10,
                        "min": 1,
                        "max": 10
                    },
                    "less": {
                        "weight": 90,
                        "min": 3,
                        "max": 25
                    }
                }
            },
            "bloodthirst": {
                "weight": 1,
                "unique": true,
                "validTypes": ["weapon", "skill"],
                "affixes": ["manaCost more 100", "physDmg more 100"],
            },
            "waterlogged": {
                "weight": 1,
                "unique": true,
                "validTypes": ["armor"],
                "affixes": ["fireRes added 30", "coldRes reduced 20"],
            }
                  
        },
        "materials": [
            "embers",
            "mints",
            "planks",
            "poops",
            "skulls",
            "sparks",
            "tumors"
        ],
        "recipe": {
            "smelly cod piece" : {
                "type": "armor",
                "cost": "4 poops"
            },
            "balsa helmet" : {
                "type": "armor",
                "cost": "9 poops"
            },
            "fire slice": {
                "type": "skill",
                "cost": "10 embers"
            },
            "ice slice": {
                "type": "skill",
                "cost": "10 ice cubes"
            },
            "lightning slice": {
                "type": "skill",
                "cost": "10 sparks"
            },
            "poison slice": {
                "type": "skill",
                "cost": "10 tumors"
            },
            "fire arrow": {
                "type": "skill",
                "cost": "10 embers"
            },
            "ice arrow": {
                "type": "skill",
                "cost": "10 ice cubes"
            },
            "lightning arrow": {
                "type": "skill",
                "cost": "10 sparks"
            },
            "poison arrow": {
                "type": "skill",
                "cost": "10 tumors"
            },
            "fire ball": {
                "type": "skill",
                "cost": "10 embers"
            },
            "ice ball": {
                "type": "skill",
                "cost": "10 ice cubes"
            },
            "lightning ball": {
                "type": "skill",
                "cost": "10 sparks"
            },
            "poison ball": {
                "type": "skill",
                "cost": "10 tumors"
            },
        },
        "monster": {
            "skeleton" : {
                "skillchain": ["basic melee"],
                "weapon" : ["wooden sword"],
                "armor": ["smelly cod piece"],
                "affixes": ["physDmg added 1", "maxHp added 1", "fireResist added -20"],
                "drops": ['planks', 'poops']

            },
            "skeleton archer" : {
                "prototype" : ["skeleton"],
                "skillchain": ["basic range"],
                "armor": ["smelly cod piece"],
                "weapon": "shitty bow",
                "affixes": ["physDmg added 2", "maxHp added 10", "fireResist added -20"]
            },
            "skeleton mage" : {
                "prototype" : ["skeleton"],
                "skillchain": ["basic spell"],
                "armor": ["smelly cod piece"],
                "weapon": "crappy wand",
                "affixes": ["spellDmg more 2", "fireResist added -20"]
            },
            "skeleton king" : {
                "prototype" : ["skeleton"],
                "skillchain": ["fire slash", "basic melee"],
                "affixes": ["physDmg added 10", "maxHp added 50", "fireResist added -20"]
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
        // log.debug("recExtend, name %s, names now %s", name, JSON.stringify(names));
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

        log.debug("itemref.expand(%s, %s), Final item: %s", type, name, JSON.stringify(item));

        return item;
    }
    
    
    exports.extend({
        'ref': ref,
        'expand': expand
    });

});
