namespace.module('bot.itemref', function (exports, require) {
    var log = namespace.bot.log;
    var prob = namespace.bot.prob;

    function gearSlotFormula(classLevel, itemLevel) {
        return Math.min(Math.floor(1 + classLevel + itemLevel / 10), 10);
    }

    var ref = {
        "weapon": {
            "melee": {
                "mods": [
                    {def: 'physDmg added 3', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg more 5 perLevel', type: 'dmg'}
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'physDmg added ' + Math.floor(Math.pow(2 + classLevel, 2)), type: 'dmg'}];
                },
                "slotFormula": gearSlotFormula,
                "names": ["cardboard sword", "ass axe", "master sword"]
            },
            "range": {
                "mods": [
                    {def: 'physDmg added 3', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg more 5 perLevel', type: 'dmg'}
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'physDmg added ' + Math.floor(Math.pow(2 + classLevel, 2)), type: 'dmg'}];
                },
                "slotFormula": gearSlotFormula,
                "names": ["shitty bow", "crappy bow", "compound bow"]
            },
            "spell": {
                "mods": [
                    {def: 'physDmg added 3', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg more 5 perLevel', type: 'dmg'}
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'physDmg added ' + Math.floor(Math.pow(2 + classLevel, 2)), type: 'dmg'}];
                },
                "slotFormula": gearSlotFormula,
                "names": ["shitty bow", "crappy bow", "compound bow"]
            }
        },
        "armor": {
            "head": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor more 5 perLevel', type: 'def'},
                    {def: 'armor added 1 perLevel', type: 'def'},
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'armor added ' + Math.floor(Math.pow(1 + classLevel, 2)), type: 'def'}];
                },
                "slotFormula": gearSlotFormula,
                "weight": 1,
                "names": ["balsa helmet", "oak helmet", "steel helmet"]
            },
            "chest": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor more 5 perLevel', type: 'def'},
                    {def: 'armor added 1 perLevel', type: 'def'},
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'armor added ' + Math.floor(Math.pow(1 + classLevel, 2)), type: 'def'}];
                },
                "slotFormula": gearSlotFormula,
                "weight": 2,
                "names": ["smelly cod piece", "foamcore tunic", "steel breastplate"]
            },
            "legs": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor more 5 perLevel', type: 'def'},
                    {def: 'armor added 1 perLevel', type: 'def'},
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'armor added ' + Math.floor(Math.pow(1 + classLevel, 2)), type: 'def'}];
                },
                "slotFormula": gearSlotFormula,
                "weight": 2,
                "names": ["cardboard kneepads", "jeans", "platemail leggings"]
            },
            "hands": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor more 5 perLevel', type: 'def'},
                    {def: 'armor added 1 perLevel', type: 'def'},
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'armor added ' + Math.floor(Math.pow(1 + classLevel, 2)), type: 'def'}];
                },
                "slotFormula": gearSlotFormula,
                "weight": 1,
                "names": ["latex gloves", "gardening gloves", "chainmail gloves"]
            }
        },
        /*
            "hot sword": {
                "slot": "weapon",
                "levels": 10,
                "modType": "added",
                "stat": "fireDmg",
                "perLevel": 2
            },
            "surprisingly hot sword": {
                "slot": "weapon",
                "levels": 10,
                "modType": "more",
                "stat": "fireDmg",
                "perLevel": 1
            },
            {base: [], perLevel: 'fireDmg more 1'}

          added
          converted increased % of other
          converted decreased % of max
          more

          hatred 50% phys as cold
          phys to light 50% physical converted to light
          cold to fire 50%  cold converted to fire

          100 phys (after added and more), 0 of else

          phys to light:
          100 (-50) phys
          50 light


          hatred:
          phys is 50
          cold 25

          cold to fire:
          25 - 12.5 cold
          12.5 fire

          50 phys
          50 light
          12.5 cold
          12.5 fire
          0 pois

            "hot sword": {
                "slot": "weapon",
                "levels": 10,
                "mods": [
                {def: 'fireDmg added 2 perLevel', type: 'dmg'},
                {def: 'fireDmg more 1 perLevel', type: 'dmg'}
                ]
            },

          itemref has this format:
          mods: [
          ['fireDmg more 100', 'dmg'],
          ['physDmg converted 50 fireDmg', 'dmg'],
          ['fireDmg more 1 perLevel', 'dmg']
          ]

          [
          ['physDmg more 100', 'dmg'],
          ['physDmg added 5 perLevel', 'dmg']
          ]

          compileCards converts to this:

          primary verb amt special(perLevel / element inc ase of converted and gainedas)

          

          hatred:

          {base: ['physDmg gainedas coldDmg 50'], perLevel: 'physDmg gainedas 2 coldDmg'}
          
         */
        "skill": {
            "basic": {
            },
            "basic melee": {
                "prototype": ["basic"],
                "class": "melee",
                "types": ["melee"],
                "mods": [
                    {def: 'speed added 1000', type: 'dmg'},
                    {def: 'range added 100000', type: 'dmg'},
                ]
            },
            "basic range": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj"],
                "mods": [
                    {def: 'speed added 1000', type: 'dmg'},
                    {def: 'range added 500000', type: 'dmg'},
                ]
            },
            "basic spell": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj"],
                "mods": [
                    {def: 'speed added 1000', type: 'dmg'},
                    {def: 'range added 700000', type: 'dmg'},
                ]
            },
            "super smash": {
                "prototype": ["basic melee"],
                "manaCost": 3,
                "mods": [
                    {def: 'speed added 1000', type: 'dmg'},
                    {def: 'range added 150000', type: 'dmg'},
                    {def: 'physDmg more 100', type: 'dmg'},
                    {def: 'physDmg added 5 perLevel', type: 'dmg'}
                ]
            },
            "fire slash": {
                "prototype": ["basic melee"],
                "manaCost": 3,
                "mods": [
                    {def: 'speed added 1000', type: 'dmg'},
                    {def: 'range added 150000', type: 'dmg'},
                    {def: 'fireDmg more 100', type: 'dmg'},
                    {def: 'physDmg converted 60 fireDmg', type: 'dmg'}
                ]
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
        "card": {
            "hot sword": {
                "slot": "weapon",
                "levels": 10,
                "modType": "added",
                "stat": "fireDmg",
                "perLevel": 2
            },
            "surprisingly hot sword": {
                "slot": "weapon",
                "levels": 10,
                "modType": "more",
                "stat": "fireDmg",
                "perLevel": 1
            },
            "hard head": {
                "slot": "head",
                "levels": 10,
                "modType": "added",
                "stat": "armor",
                "perLevel": 4
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
                "affixes": ["physDmg added 1", "maxHp added 10", "fireResist added -20"],
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
                "affixes": ["fireDmg added 10", "fireResist added -20"]
            },
            "skeleton king" : {
                "prototype" : ["skeleton"],
                "skillchain": ["fire slash", "basic melee"],
                "affixes": ["physDmg added 10", "maxHp added 5", "fireResist added -20"]
            },
        },
        "zone": {
            "spooky dungeon": {
                "choices": ["skeleton", "skeleton archer", "skeleton mage", "skeleton king"],
                "weights": [20, 10, 5, 1],
                "roomCount": 20,
                "quantity": 1
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
