namespace.module('bot.itemref', function (exports, require) {
    var log = namespace.bot.log;
    var prob = namespace.bot.prob;

    function gearSlotFormula(classLevel, itemLevel) {
        return Math.min(Math.floor(1 + classLevel + itemLevel / 10), 10);
    }

    var BASE_MELEE_RANGE = 100000
    var BASE_RANGE_RANGE = 700000
    var BASE_SPELL_RANGE = 500000
    
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
                "names": ["shitty wand", "crappy wand", "compound wand"]
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
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE, type: 'dmg'},
                ]
            },
            "basic range": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj"],
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                ]
            },
            "basic spell": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj"],
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                ]
            },
            "super smash": {
                "prototype": ["basic melee"],
                "baseMods": [
                    {def: 'manaCost added 3', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},                    
                    {def: 'physDmg more 10', type: 'dmg'},
                    {def: 'physDmg added 5 perLevel', type: 'dmg'}
                ]
            },
            "fire slash": {
                "prototype": ["basic melee"],
                "types": ["melee", "fire"],
                "baseMods": [
                    {def: 'manaCost added 3', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},                    
                    {def: 'fireDmg more 100', type: 'dmg'},
                    {def: 'physDmg converted 60 fireDmg', type: 'dmg'}
                ]
            },
            "ice slash": {
                "prototype": ["basic melee"],
                "types": ["melee", "cold"],
                "baseMods": [
                    {def: 'manaCost added 5', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},                    
                    {def: 'coldDmg more 100', type: 'dmg'},
                    {def: 'physDmg converted 60 coldDmg', type: 'dmg'}
                ]
            },
            "lightning slash": {
                "prototype": ["basic melee"],
                "types": ["melee", "lightning"],
                "baseMods": [
                    {def: 'manaCost added 5', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},                    
                    {def: 'lightDmg more 100', type: 'dmg'},
                    {def: 'physDmg converted 60 lightDmg', type: 'dmg'}
                ]
            },
            "poison slash": {
                "prototype": ["basic melee"],
                "types": ["melee", "poison"],                
                "baseMods": [
                    {def: 'manaCost added 5', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},                    
                    {def: 'poisDmg more 100', type: 'dmg'},
                    {def: 'physDmg converted 60 poisDmg', type: 'dmg'}
                ]
            },
            "speed shot": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj"],
                "baseMods": [
                    {def: 'manaCost added 3', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                ]
            },
            "fire arrow": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj", "fire"],
                "baseMods": [
                    {def: 'manaCost added 6', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'fireDmg more 50', type: 'dmg'},
                    {def: 'physDmg converted 50 fireDmg', type: 'dmg'}
                ]
            },
            "cold arrow": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj", "cold"],
                "baseMods": [
                    {def: 'manaCost added 6', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'coldDmg more 50', type: 'dmg'},
                    {def: 'physDmg converted 50 coldDmg', type: 'dmg'}
                ]
            },
            "lightning arrow": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj", "lightning"],
                "baseMods": [
                    {def: 'manaCost added 6', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'lightDmg more 50', type: 'dmg'},
                    {def: 'physDmg converted 50 lightDmg', type: 'dmg'}
                ]
            },
            "poison arrow": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj", "poison"],
                "baseMods": [
                    {def: 'manaCost added 6', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'poisDmg more 50', type: 'dmg'},
                    {def: 'physDmg converted 50 poisDmg', type: 'dmg'}
                ]
            },
            "incinerate": {                
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj", "fire", "spell"],
                "baseMods": [
                    {def: 'manaCost added 1', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 100', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE * 0.3, type: 'dmg'},
                    {def: 'fireDmg more -50', type: 'dmg'},
                    {def: 'physDmg converted 100 fireDmg', type: 'dmg'}
                ]
            },
            "fire ball": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj", "fire", "spell"],
                "baseMods": [
                    {def: 'manaCost added 7', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'fireDmg more 50', type: 'dmg'},
                    {def: 'physDmg converted 100 fireDmg', type: 'dmg'}
                ]
            },
            "ice ball": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj", "cold", "spell"],
                "baseMods": [
                    {def: 'manaCost added 7', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'coldDmg more 50', type: 'dmg'},
                    {def: 'physDmg converted 100 coldDmg', type: 'dmg'}
                ]
            },
            "lighting ball": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj", "lightning", "spell"],
                "baseMods": [
                    {def: 'manaCost added 7', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'lightDmg more 50', type: 'dmg'},
                    {def: 'physDmg converted 100 lightDmg', type: 'dmg'}
                ]
            },
            "poison ball": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj", "poison", "spell"],
                "baseMods": [
                    {def: 'manaCost added 7', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'poisDmg more 50', type: 'dmg'},
                    {def: 'physDmg converted 100 poisDmg', type: 'dmg'}
                ]
            },
        },
        "card": {
            "proto-skeleton": {
                "mods": [
                    {"def": "fireResist more -20", "type": "eleResist"}
                ],
            },
            "proto-boss": {
                "mods": [
                    //{"def": "physDmg more 10", "type": "dmg"},
                    {"def": "maxHp more 100", "type": "def"}
                ],
            },

            "hot sword": {
                "mods": [
                    {"def": "fireDmg added 2 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
                "levels": 10
            },
            "surprisingly hot sword": {
                "mods": [
                    {"def": "fireDmg more 1 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
                "levels": 10
            },
            "honed blade": {
                "mods": [
                    {"def": "physDmg added 2 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
                "levels": 10
            },

            "hard head": {
                "mods": [
                    {"def": "armor added 4 perLevel", "type": "def"}
                ],
                "slot": "head",
                "levels": 10
            },            
            "six pack": {
                "mods": [
                    {"def": "armor added 8 perLevel", "type": "def"}
                ],
                "slot": "body",
                "levels": 10
            },
            "steel toed": {
                "mods": [
                    {"def": "armor added 4 perLevel", "type": "def"}
                ],
                "slot": "legs",
                "levels": 10
            },
            "extra plating": {
                "mods": [
                    {"def": "armor added 3 perLevel", "type": "def"}
                ],
                "slot": "hands",
                "levels": 10
            },
            
            "quenching blade": {
                "mods": [
                    {"def": "fireResist more -5 perLevel", "type": "eleResist"}
                ],
                "slot": "weapon",
                "levels": 10
            },
            "cool shoes": {
                "mods": [
                    {"def": "fireResist more -5 perLevel", "type": "eleResist"}
                ],
                "slot": "legs",
                "levels": 10
            },
            "asbestos lining": {
                "mods": [
                    {"def": "fireResist more -5 perLevel", "type": "eleResist"}
                ],
                "slot": "hands",
                "levels": 10
            },
            "sopping underclothes": {
                "mods": [
                    {"def": "fireResist more -5 perLevel", "type": "eleResist"}
                ],
                "slot": "body",
                "levels": 10
            },            
        },
        "monster": {
            "skeleton" : {
                "items": [["weapon", "melee", 0], ["armor", "head", 0]],
                "skills": ["basic melee"],
                "sourceCards": [
                    ["proto-skeleton", 0]
                ]
            },
            "fire skeleton": {
                "items": [["weapon", "melee", 0], ["armor", "head", 0]],
                "skills": ["fire slash"],
                "sourceCards": [
                    ["hot sword", 1],
                    ["proto-skeleton", 0]
                ]
            },
            "skeleton archer" : {
                "items": [["weapon", "range", 0], ["armor", "chest", 0]],
                "skills": ["basic range"],
                "sourceCards": [
                    ["proto-skeleton", 0]
                ]
            },
            "skeleton mage" : {
                "items": [["weapon", "spell", 0], ["armor", "legs", 0]],
                "skills": ["fire ball", "basic spell"],
                "sourceCards": [
                    ["proto-skeleton", 0]
                ]
            },
            "skeleton king" : {
                "items": [["weapon", "melee", 1], ["armor", "head", 1], ["armor", "chest", 1], ["armor", "hands", 1], ["armor", "legs", 1]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["proto-skeleton", 1],
                    ["proto-boss", 1],
                    ["hot sword", 1]
                ]
            },
        },
        "zone": {
            "spooky dungeon": {
                "choices": ["skeleton", "skeleton archer", "skeleton mage"],
                "weights": [20, 10, 5],
                "boss": "skeleton king",
                "roomCount": 3,
                "quantity": [1, 2, 4]
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
