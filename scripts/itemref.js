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
                    {def: 'physDmg more 1 perLevel', type: 'dmg'}
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
                    {def: 'physDmg more 1 perLevel', type: 'dmg'}
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'physDmg added ' + Math.floor(Math.pow(2 + classLevel, 2)), type: 'dmg'}];
                },
                "slotFormula": gearSlotFormula,
                "names": ["shitty bow", "crappy bow", "compound bow"]
            },
            "spell": {
                "mods": [
                    {def: 'spellDmg added 10', type: 'dmg'},
                    {def: 'spellDmg added 3 perLevel', type: 'dmg'},
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'spellDmg added ' + Math.floor(Math.pow(3 + classLevel, 2)), type: 'dmg'}];
                },
                "slotFormula": gearSlotFormula,
                "names": ["shitty wand", "crappy wand", "compound wand"]
            }
        },
        "armor": {
            "head": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    //{def: 'armor more 1 perLevel', type: 'def'},
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
                    //{def: 'armor more 1 perLevel', type: 'def'},
                    {def: 'armor added 1 perLevel', type: 'def'},
                ],
                "getClassMods": function(classLevel) {
                    return [{def: 'armor added ' + Math.floor(Math.pow(1 + classLevel, 2)), type: 'def'}];
                },
                "slotFormula": gearSlotFormula,
                "weight": 2,
                "names": ["t-shirt", "foamcore tunic", "steel breastplate"]
            },
            "legs": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    //{def: 'armor more 1 perLevel', type: 'def'},
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
                    //{def: 'armor more 1 perLevel', type: 'def'},
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
                    {def: 'physDmg added 3', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
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
                    {def: 'physDmg more 1 perLevel', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ]
            },
            "quick hit": {
                "prototype": ["basic melee"],
                "baseMods": [
                    {def: 'manaCost added 5', type: 'dmg'},
                    {def: 'speed added 250', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 0.6, type: 'dmg'},
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
                    {def: 'fireDmg more 1 perLevel', type: 'dmg'},
                    {def: 'fireDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},                    
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
                    {def: 'coldDmg more 1 perLevel', type: 'dmg'},
                    {def: 'coldDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},                                        
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
                    {def: 'lightDmg more 1 perLevel', type: 'dmg'},
                    {def: 'lightDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},                                        
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
                    {def: 'poisDmg more 1 perLevel', type: 'dmg'},
                    {def: 'poisDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},                                        
                    {def: 'physDmg converted 60 poisDmg', type: 'dmg'}
                ]
            },
            "speed shot": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj"],
                "baseMods": [
                    {def: 'manaCost added 10', type: 'dmg'},
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
                    {def: 'fireDmg more 1 perLevel', type: 'dmg'},
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
                    {def: 'coldDmg more 1 perLevel', type: 'dmg'},
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
                    {def: 'lightDmg more 1 perLevel', type: 'dmg'},
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
                    {def: 'poisDmg more 1 perLevel', type: 'dmg'},
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
                    {def: 'speed added 50', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE * 0.3, type: 'dmg'},
                    {def: 'fireDmg added 2', type: 'dmg'},
                    {def: 'fireDmg added 2 perLevel', type: 'dmg'},
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
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'fireDmg added 3 perLevel', type: 'dmg'},
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'fireDmg added 3', type: 'dmg'},
                    {def: 'fireDmg more 1 perLevel', type: 'dmg'},
                ],
                "flavor": "goodness gracious, these balls are great"
            },
            "ice ball": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj", "cold", "spell"],
                "baseMods": [
                    {def: 'manaCost added 7', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'coldDmg added 3 perLevel', type: 'dmg'},
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'coldDmg added 3', type: 'dmg'},
                    {def: 'coldDmg more 1 perLevel', type: 'dmg'},

                ]
            },
            "lighting ball": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj", "lightning", "spell"],
                "baseMods": [
                    {def: 'manaCost added 7', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'lightDmg added 3 perLevel', type: 'dmg'},
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'lightDmg added 3', type: 'dmg'},
                    {def: 'lightDmg more 1 perLevel', type: 'dmg'},
                ]
            },
            "poison ball": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj", "poison", "spell"],
                "baseMods": [
                    {def: 'manaCost added 7', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'poisDmg added 3 perLevel', type: 'dmg'},
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'poisDmg added 3', type: 'dmg'},
                    {def: 'poisDmg more 1 perLevel', type: 'dmg'},
                ]
            },
        },
        "card": {
            "proto-skeleton": {
                "mods": [
                    {"def": "fireResist more -20", "type": "eleResist"},
                    {"def": "physDmg more -30", "type": "dmg"},
                    
                ],
            },
            "proto-grunt": {
                "mods": [
                    {"def": "maxHp more -50", "type": "def"},
                    {"def": "physDmg more -30", "type": "dmg"},                    
                ],
            }, 
            "proto-boss": {
                "mods": [
                    {"def": "physDmg more 100", "type": "dmg"},
                    {"def": "maxHp more 1000", "type": "def"}
                ],
            },
            "proto-elf": {
                "mods": [
                    {"def": "speed more -20", "type": "dmg"},
                    {"def": "dexterity added 50", "type": "def"}
                ],
            },
            "sharpened": {
                "mods": [
                    {"def": "physDmg added 1 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
                "levels": 10
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
                "slot": "chest",
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
            "compression shorts": {
                "mods": [
                    {"def": "moveSpeed added 50", "type": "def"},
                    {"def": "moveSpeed added 20 perLevel", "type": "def"},
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
                "slot": "chest",
                "levels": 10
            },

            "brain juice": {
                "mods": [
                    {"def": "manaRegen added 2 perLevel", "type": "def"}
                ],
                "slot": "head",
                "levels": 10
            },
            "heart juice": {
                "mods": [
                    {"def": "hpRegen added 1 perLevel", "type": "def"}
                ],
                "slot": "head",
                "levels": 10
            },
            "head of vigor": {
                "mods": [
                    {"def": "maxHp added 5 perLevel", "type": "def"}
                ],
                "slot": "head",
                "levels": 10
            },
            "nimble": {
                "mods": [
                    {"def": "dodge added 5 perLevel", "type": "def"},
                    {"def": "dodge added 20", "type": "def"}
                ],
                "slot": "chest",
                "levels": 10
            },
            "bloodsucker": {
                "mods": [
                    {"def": "physDmg gainedas 10 hpLeech", "type": "dmg"},
                    {"def": "physDmg added 1 perLevel", "type": "dmg"}
                ],
                "slot": "head",
                "levels": 10
            },
            "strong back": {
                "mods": [
                    {"def": "strength added 5 perLevel", "type": "def"},
                ],
                "slot": "chest",
                "levels": 10
            },
            "thwomping": {
                "mods": [
                    {"def": "physDmg more 5 perLevel", "type": "dmg"},
                    {"def": "moveSpeed more -5 perLevel", "type": "def"},
                    {"def": "moveSpeed added -100", "type": "def"},
                ],
                "slot": "legs",
                "levels": 10
            },
            "dexterous hands": {
                "mods": [
                    {"def": "dexterity added 5 perLevel", "type": "def"},
                ],
                "slot": "hands",
                "levels": 10
            },
            "dummy" : {
                "mods": [
                    {"def": "moveSpeed added -300", "type": "def"},
                ],
                "slot": "head",
                "levels": 1
            }
        },
        "monster": {
            "skeleton" : {
                "items": [["weapon", "melee", 0], ["armor", "head", 0], ["armor", "chest", 0], ["armor", "legs", 0]],
                "skills": ["basic melee"],
                "sourceCards": [
                    ["proto-skeleton", 0],
                    ["proto-grunt", 0],
                    ["sharpened", 1],
                    ["hard head", 1],
                    ["compression shorts", 1],
                ]
            },
            "fire skeleton": {
                "items": [["weapon", "melee", 0], ["armor", "head", 0], ["armor", "chest", 0], ["armor", "legs", 0]],
                "skills": ["fire slash", "super smash"],
                "sourceCards": [
                    ["hot sword", 1],
                    ["proto-skeleton", 0],
                    ["six pack", 1]
                ]
            },
            "skeleton archer" : {
                "items": [["weapon", "range", 0], ["armor", "chest", 0], ["armor", "hands", 0]],
                "skills": ["speed shot", "basic range"],
                "sourceCards": [
                    ["proto-skeleton", 0],
                    ["head of vigor", 1]
                ]
            },
            "skeleton mage" : {
                "items": [["weapon", "spell", 0], ["armor", "legs", 0], ["armor", "hands", 0]],
                "skills": ["fire ball", "basic spell"],
                "sourceCards": [
                    ["proto-skeleton", 0],
                    ["brain juice", 1],
                    ["heart juice", 1],
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
            "wolf" : {
                "items": [["weapon", "melee", 0], ["armor", "head", 0], ["armor", "chest", 0], ["armor", "legs", 0]],
                "skills": ["basic melee"],
                "sourceCards": [
                    ["nimble", 1],
                    ["compression shorts", 3]
                ]
            },
            "bat" : {
                "items": [["weapon", "melee", 0]],
                "skills": ["quick hit", "basic melee"],
                "sourceCards": [
                    ["nimble", 1],
                    ["bloodsucker", 1]
                ]
            },
            "ent" : {
                "items": [["weapon", "melee", 0]],
                "skills": ["quick hit", "basic melee"],
                "sourceCards": [
                    ["strong back", 2],
                    ["thwomping", 2]
                ]
            },
            "elf" : {
                "items": [["weapon", "range", 1]],
                "skills": ["poison arrow", "basic range"],
                "sourceCards": [
                    ["dexterous hands", 1],
                    ["proto-elf", 0]
                ]
            },
            "elf king" : {
                "items": [["weapon", "range", 2]],
                "skills": ["quick hit", "basic range"],
                "sourceCards": [
                    ["proto-boss", 0],
                    ["proto-elf", 0],
                    ["dexterous hands", 2]
                ],
                "flavor": "He knows you've been naughty, and he's killing you twice"
            },
            "dummy": {
                "items": [],
                "skills": [],
                "sourceCards": [
                    ["dummy", 0]
                ]
            }
        },
        "zone": {
            "spooky dungeon": {
                "choices": ["skeleton", "skeleton archer", "skeleton mage", "fire skeleton"],
                "weights": [20, 10, 5, 5],
                "boss": "skeleton king",
                "roomCount": 20,
                "quantity": [1, 1, 3]
            },
            "dark forest": {
                "choices": ["wolf", "bat", "elf", "ent"],
                "weights": [20, 15, 15, 5],
                "boss": "elf king",
                "roomCount": 20,
                "quantity": [2,2,3]
            },
            "dojo": {
                "choices": ["dummy"],
                "weights": [1],
                "boss": "dummy",
                "roomCount": 10,
                "quantity": [1,0,0]
            },
            "empty dojo": {
                "choices": [],
                "weights": [],
                "boss": "dummy",
                "roomCount": 10,
                "quantity": 1// not sure about the logic, but this escapes adding any monsters to rooms
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
