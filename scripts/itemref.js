namespace.module('bot.itemref', function (exports, require) {
    var log = namespace.bot.log;
    var prob = namespace.bot.prob;

    var BASE_MELEE_RANGE = 30000
    var BASE_RANGE_RANGE = 500000
    var BASE_SPELL_RANGE = 400000
    
    var ref = {
        "weapon": {
            ////////////////////
            /// MELEE //////////
            ////////////////////
            "cardboard sword": {
                "mods": [
                    {def: 'physDmg added 6', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            "hand axe": {
                "mods": [
                    {def: 'physDmg added 8', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            "stone hammer": {
                "mods": [
                    {def: 'physDmg added 10', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            "falchion": {
                "mods": [
                    {def: 'physDmg added 12', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            "morning star": {
                "mods": [
                    {def: 'physDmg added 14', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            "long sword": {
                "mods": [
                    {def: 'physDmg added 16', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            "spikey mace": {
                "mods": [
                    {def: 'physDmg added 18', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            "spiked battle axe": {
                "mods": [
                    {def: 'physDmg added 20', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            "winged axe": {
                "mods": [
                    {def: 'physDmg added 22', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "type": "melee",
            },
            ////////////////////
            ///// RANGED ///////
            ////////////////////
            "wooden bow": {
                "mods": [
                    {def: 'physDmg added 5', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ],
                "type": "range",
            },
            "hand crossbow": {
                "mods": [
                    {def: 'physDmg added 7', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ],
                "type": "range",
            },
            "crossbow": {
                "mods": [
                    {def: 'physDmg added 9', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ],
                "type": "range",
            },
            "composite bow": {
                "mods": [
                    {def: 'physDmg added 10', type: 'dmg'},
                    {def: 'physDmg added 3 perLevel', type: 'dmg'}
                ],
                "type": "range",
            },
            ////////////////////
            ////// SPELL ///////
            ////////////////////
            "simple wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "type": "spell",
            },
            "knobby wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "type": "spell",
            },
            "pewter wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "type": "spell",
            },
            "delicate wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "type": "spell",
            },
            "dragonstone wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "type": "spell",
            },
            "fairy wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "type": "spell",
            },
            "star wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "type": "spell",
            },
            "demon wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "type": "spell",
            },
        },
        "armor": {
            ////////////////////
            ///// HEAD /////////
            ////////////////////
            "balsa helmet": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "head",
            },
            "collander": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "head",
            },
            "conquistador helm": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "head",
            },
            "crusader helm": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "head",
            },
            "gladiator helm": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "head",
            },
            "apollo helmet": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "head",
            },
            ////////////////////
            ///// CHEST ////////
            ////////////////////
            "t-shirt": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "leather armor": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "goblin leather": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "leatherscale armor": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "leatherplate armor": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "hammered chestplate": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "iron chestplate": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "copper chestplate": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "muscle plate": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "elegant plate": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "raider armor": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "shadow armor": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "scout leather": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "studded leather": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "velvet tunic": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "war robe": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "winged leather": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "cultist robe": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            "embroidered silks": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "chest",
            },
            ////////////////////
            ///// LEGS /////////
            ////////////////////
            "jeans": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "legs",
            },
            "leather boots": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "legs",
            },
            "elf boots": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "legs",
            },
            "mage boots": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "legs",
            },
            "arcane boots": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "legs",
            },
            "buckaneer boots": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "legs",
            },
            "suess boots": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "legs",
            },
            ////////////////////
            ///// GLOVES ///////
            ////////////////////
            "latex gloves": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "hands",
            },
            "gardening gloves": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "hands",
            },
            "leather gloves": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "hands",
            },
            "velvet gloves": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "hands",
            },
            "handmail": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "hands",
            },
            "fancy gauntlets": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "hands",
            },
            "polished gauntlets": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "hands",
            },
            "goldenscale gauntlets": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "type": "hands",
            },
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

        /*
          basic range skill:

          proj 1
          start 50

          lmp card:

          dmg -20
          proj 2


          basic melee skill:

          melee 1
          start 50

          melee splash:

          aoe 5000
          dmg -20
         */

        "attack": {
            "melee": {
                "type": "melee",
            },
            "range": {
                "type": "range",
                // int projSpeed, int count, int angle (if count > 1)
            },
            "cone": {
                "type": "cone",
                "angle": 30,
            },
            "circle": {
                "type": "circle",
            }
        },

        "skill": {
            "basic": {
            },
            "basic melee": {
                "prototype": ["basic"],
                "class": "melee",
                "types": ["melee"],
                "specs": [{ type: 'melee', radius: 10000, color: '#777', mods: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE, type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                ]
            },
            "basic range": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj"],
                "specs": [{ type: 'proj', radius: 5000, color: '#a52a2a', rate: 1000, mods: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},                    
                ]
            },
            "basic spell": {
                "prototype": ["basic"],
                "class": "spell",
                "types": ["proj"],
                "specs": [{ type: 'proj', radius: 5000, color: '#a52a2a', rate: 1000, mods: [], onHit: [], onKill: [], onRemove: [] }],
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
            "masterful strike": {
                "prototype": ["basic melee"],
                "baseMods": [
                    {def: 'manaCost added 12', type: 'dmg'},
                    {def: 'speed added 1000', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},
                    {def: 'physDmg more 20', type: 'dmg'},
                    {def: 'physDmg more 2 perLevel', type: 'dmg'},
                    {def: 'physDmg added 5 perLevel', type: 'dmg'}
                ]
            },
            "quick hit": {
                "prototype": ["basic melee"],
                "baseMods": [
                    {def: 'manaCost added 5', type: 'dmg'},
                    {def: 'speed added 250', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},
                ]
            },
            "fire slash": {
                "prototype": ["basic melee"],
                "types": ["melee", "fire"],
                "anim": ["#f00"],
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
            "molten strike": {
                "prototype": ["basic melee"],
                "types": ["melee", "fire"],
                "specs": [{ type: 'melee', mods: [],
                            onHit: [{ type: 'proj', angle: 30, count: 3, radius: 5000, color: '#a52a2a', rate: 300, mods: [{def: 'physDmg more -20', type: 'dmg'}], onKill: [], onRemove: []}],
                            onKill: [],
                            onRemove: []
                          }],
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
            "exploding strike": {
                "prototype": ["basic melee"],
                "types": ["melee", "fire"],
                "specs": [{ type: 'melee', mods: [],
                          onHit: [{ type: 'circle', mods: [{def: 'physDmg more -20', type: 'dmg'}], onHit: [], onKill: [], onRemove: []}],
                          onKill: [],
                          onRemove: []
                        }],
                "onHit": ["AOECircle -20 1000"],
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
                "anim": ["#00f"],
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
                "anim": ["#ff0"],
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
                "anim": ["#0f0"],
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
                "prototype": ["basic range"],
                "class": "range",
                "types": ["proj"],
                "baseMods": [
                    {def: 'manaCost added 3', type: 'dmg'},
                    {def: 'manaCost more 20 perLevel', type: 'dmg'},
                    {def: 'physDmg more -30', type: 'dmg'},
                    {def: 'physDmg more 2 perLevel', type: 'dmg'},                    
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                ]
            },
            "fire arrow": {
                "prototype": ["basic range"],
                "class": "range",
                "types": ["proj", "fire"],
                "anim": ["#f00"],
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
                "prototype": ["basic range"],
                "class": "range",
                "types": ["proj", "cold"],
                "anim": ["#00f"],
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
                "prototype": ["basic range"],
                "class": "range",
                "types": ["proj", "lightning"],
                "anim": ["#ff0"],
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
                "prototype": ["basic range"],
                "class": "range",
                "types": ["proj", "poison"],
                "anim": ["#0f0"],
                "baseMods": [
                    {def: 'manaCost added 6', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'poisDmg more 1 perLevel', type: 'dmg'},
                    {def: 'physDmg converted 50 poisDmg', type: 'dmg'}
                ]
            },
            "headshot": {
                "prototype": ["basic"],
                "class": "range",
                "types": ["proj"],
                "specs": [{ type: 'proj', radius: 5000, color: '#a52a2a', rate: 3000, mods: [], onHit: [], onKill: [], onRemove: [] }],                
                "baseMods": [
                    {def: 'manaCost added 6', type: 'dmg'},
                    {def: 'speed added 1000', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'physDmg more 10 perLevel', type: 'dmg'}
                ]
            },
            "incinerate": {                
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "fire", "spell"],
                "anim": ["#f00"],
                "baseMods": [
                    {def: 'manaCost added 3', type: 'dmg'},
                    {def: 'speed added 50', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE * 0.3, type: 'dmg'},
                    {def: 'fireDmg added 2', type: 'dmg'},
                    {def: 'fireDmg added 2 perLevel', type: 'dmg'},
                    {def: 'physDmg converted 100 fireDmg', type: 'dmg'}
                ]
            },
            "fire ball": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "fire", "spell"],
                "anim": ["#f00"],
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
                "flavor": "Goodness gracious, these balls are great!"
            },
            "ice ball": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "cold", "spell"],
                "anim": ["#00f"],
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

            "lightning ball": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "lightning", "spell"],
                "anim": ["#ff0"],
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
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "poison", "spell"],
                "anim": ["#0f0"],
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
            "ice blast": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "cold", "spell"],
                "anim": ["#00f"],
                "onTry": ["AOECone 0 5000 45"],
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
            "pressure wave": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "spell"],
                "baseMods": [
                    {def: 'manaCost added 10', type: 'dmg'},
                    {def: 'cooldownTime added 500', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'physDmg added 5 perLevel', type: 'dmg'},
                ]
            },
            "shadow dagger": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "spell"],
                "baseMods": [
                    {def: 'manaCost added 10', type: 'dmg'},
                    {def: 'cooldownTime added 500', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'physDmg added 5 perLevel', type: 'dmg'},
                ]
            },
            "health suck": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "spell"],
                "baseMods": [
                    {def: 'manaCost added 1', type: 'dmg'},
                    {def: 'manaCost more 25 perLevel', type: 'dmg'},
                    {def: 'speed added 150', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'physDmg added 9', type:'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg gainedas 100 hpLeech', type: 'dmg'}
                ]
            },
            "ice blast": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "aoecone" , "spell"],
                "baseMods": [
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'coldDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "nova": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "aoecircle" , "spell"],
                "baseMods": [
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE/2, type: 'dmg'},
                    {def: 'lightDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "fire nova": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "aoecircle" , "spell"],
                "baseMods": [
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE/2, type: 'dmg'},
                    {def: 'fireDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "ice nova": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "aoecircle" , "spell"],
                "baseMods": [
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE/2, type: 'dmg'},
                    {def: 'coldDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "poison nova": {
                "prototype": ["basic spell"],
                "class": "spell",
                "types": ["proj", "aoecircle" , "spell"],
                "baseMods": [
                    {def: 'manaCost added 1 perLevel', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE/2, type: 'dmg'},
                    {def: 'poisDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "flame cone": {
                "prototype": ["basic"],
                "class": "melee",
                "types": ["aoecone" , "melee"],
                "baseMods": [
                    {def: 'manaCost added 5', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE/2, type: 'dmg'},
                    {def: 'fireDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "lethal strike": {
                "prototype": ["basic melee"],
                "class": "melee",
                "types": ["melee"],
                "baseMods": [
                    {def: 'manaCost added 20', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE, type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg more 5 perLevel', type: 'dmg'},
                    {def: 'physDmg more 100', type: 'dmg'},
                    {def: 'cooldownTime added 2000', type: 'dmg'},                                        
                ]
            },
        },
        "card": {
            "proto-skeleton": {
                "mods": [
                    {"def": "fireResist more -20", "type": "eleResist"},
                    {"def": "physDmg more -10", "type": "dmg"},
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
                    {"def": "lineWidth added 1", "type": "vis"},
                    {"def": "width more 100", "type": "vis"},
                    {"def": "height more 100", "type": "vis"},                                        
                    {"def": "physDmg more 100", "type": "dmg"},
                    {"def": "maxHp more 1000", "type": "def"}
                ],
            },
            "proto-rofl": {
                "mods": [
                    {"def": "height more -50", "type": "vis"},                    
                    {"def": "width more 300", "type": "vis"},
                ]
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
            },
            "hot sword": {
                "mods": [
                    {"def": "fireDmg added 2 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
            },
            "cold sword": {
                "mods": [
                    {"def": "coldDmg added 2 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
            },
            "surprisingly hot sword": {
                "mods": [
                    {"def": "fireDmg more 1 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
            },
            "honed blade": {
                "mods": [
                    {"def": "physDmg added 2 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
            },

            "breadhat": {
                "mods": [
                    {"def": "armor added 4 perLevel", "type": "def"}
                ],
                "slot": "head",
            },            
            "six pack": {
                "mods": [
                    {"def": "lineWidth added 1", "type": "vis"},                                        
                    {"def": "armor added 8 perLevel", "type": "def"}
                ],
                "slot": "chest",
            },
            "steel toed": {
                "mods": [
                    {"def": "armor added 4 perLevel", "type": "def"}
                ],
                "slot": "legs",
            },
            "extra plating": {
                "mods": [
                    {"def": "armor added 3 perLevel", "type": "def"}
                ],
                "slot": "hands",
            },
            
            "quenching blade": {
                "mods": [
                    {"def": "fireResist more -5 perLevel", "type": "eleResist"}
                ],
                "slot": "weapon",
            },
            "cool shoes": {
                "mods": [
                    {"def": "fireResist more -5 perLevel", "type": "eleResist"}
                ],
                "slot": "legs",
            },
            "compression shorts": {
                "mods": [
                    {"def": "moveSpeed added 50", "type": "def"},
                    {"def": "moveSpeed added 20 perLevel", "type": "def"},
                ],
                "slot": "legs",
            },

            "asbestos lining": {
                "mods": [
                    {"def": "fireResist more -5 perLevel", "type": "eleResist"}
                ],
                "slot": "hands",
            },
            "sopping underclothes": {
                "mods": [
                    {"def": "fireResist more -5 perLevel", "type": "eleResist"}
                ],
                "slot": "chest",
            },

            "brain juice": {
                "mods": [
                    {"def": "manaRegen added 2 perLevel", "type": "def"}
                ],
                "slot": "head",
            },
            "heart juice": {
                "mods": [
                    {"def": "hpRegen added 1 perLevel", "type": "def"}
                ],
                "slot": "head",
            },
            "head of vigor": {
                "mods": [
                    {"def": "maxHp added 5 perLevel", "type": "def"}
                ],
                "slot": "head",
            },
            "nimble": {
                "mods": [
                    {"def": "dodge added 5 perLevel", "type": "def"},
                    {"def": "dodge added 20", "type": "def"}
                ],
                "slot": "chest",
            },
            "bloodsucker": {
                "mods": [
                    {"def": "physDmg gainedas 10 hpLeech", "type": "dmg"},
                    {"def": "physDmg added 1 perLevel", "type": "dmg"}
                ],
                "slot": "head",
            },
            "strong back": {
                "mods": [
                    {"def": "strength added 5 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "thwomping": {
                "mods": [
                    {"def": "physDmg more 5 perLevel", "type": "dmg"},
                    {"def": "physDmg more 25", "type": "dmg"},
                    {"def": "moveSpeed more -50", "type": "def"},
                ],
                "slot": "legs",
            },
            "dexterous hands": {
                "mods": [
                    {"def": "dexterity added 5 perLevel", "type": "def"},
                ],
                "slot": "hands",
            },
            "dummy" : {
                "mods": [
                    {"def": "moveSpeed added -300", "type": "def"},
                ],
                "slot": "head",
            },
            "fear" : {
                "mods": [
                    {"def": "moveSpeed added -400", "type": "def"},
                ],
                "slot": "legs",
            },
            "stinging": {
                "mods": [
                    {"def": "physDmg added 1 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
            },
            "ignited": {
                "mods": [
                    {"def": "physDmg converted 20 fireDmg", "type": "dmg"},
                    {"def": "fireDmg more 2 perLevel", "type": "dmg"},                    
                ],
                "slot": "weapon",
            },
            "frosted": {
                "mods": [
                    {"def": "physDmg converted 20 coldDmg", "type": "dmg"},
                    {"def": "coldDmg more 2 perLevel", "type": "dmg"},                    
                ],
                "slot": "weapon",
            },
            "charged": {
                "mods": [
                    {"def": "physDmg converted 20 lightDmg", "type": "dmg"},
                    {"def": "lightDmg more 2 perLevel", "type": "dmg"},                    
                ],
                "slot": "weapon",
            },
            "putrified": {
                "mods": [
                    {"def": "physDmg converted 20 poisDmg", "type": "dmg"},
                    {"def": "poisDmg more 2 perLevel", "type": "dmg"},
                ],
                "slot": "weapon",
            },
            "heart of granite": {
                "mods": [
                    {"def": "armor added 5 perLevel", "type": "def"},
                    {"def": "armor more 3 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "heart of granite": {
                "mods": [
                    {"def": "armor added 5 perLevel", "type": "def"},
                    {"def": "armor more 3 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "small stature": {
                "mods": [
                    {"def": "height more -30", "type": "vis"},
                    {"def": "width more -30", "type": "vis"},
                    {"def": "moveSpeed more 3 perLevel", "type": "def"},
                    {"def": "dodge more 3 perLevel", "type": "def"},                    
                ],
                "slot": "chest",
            },
            "keen wit": {
                "mods": [
                    {"def": "wisdom added 5 perLevel", "type": "def"},
                ],
                "slot": "head",
            },
            "electrified": {
                "mods": [
                    {"def": "lightDmg more 3 perLevel", "type": "dmg"},
                ],
                "slot": "weapon",
            },
            "flying": {
                "mods": [
                    {"def": "dodge added 95", "type": "def"},
                    {"def": "dodge added 5 perLevel", "type": "def"},
                    //TODO - flying vis stuff
                ],
                "slot": "chest",
            },
            "clawed": {
                "mods": [
                    {"def": "physDmg added 5 perLevel", "type": "dmg"},
                    {"def": "physDmg more 10", "type": "dmg"},
                ],
                "slot": "hands",
            },
            "riveted": {               
                "mods": [
                    {"def": "lineWidth added 1", "type": "vis"},                    
                    {"def": "armor more 5 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "clockwork": {
                "mods": [
                    {"def": "physDmg more 4 perLevel", "type": "dmg"},
                    {"def": "speed more -15", "type": "dmg"},
                ],
                "slot": "chest",
            },
            "mecha heart": {
                "mods": [
                    {"def": "lineWidth added 1", "type": "vis"},                    
                    {"def": "maxHp added 5 perLevel", "type": "def"},
                    {"def": "hpRegen added 2 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "steam powered": {
                "mods": [
                    {"def": "manaRegen added 5 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "goblin toe": {
                "mods": [
                    {"def": "armor added 10 perLevel", "type": "def"},
                    {"def": "physDmg more 25", "type":"dmg"},
                ],
                "slot": "legs",
            },
            "berserking": {
                "mods": [
                    {"def": "physDmg more 25", "type": "dmg"},
                    {"def": "speed more -1 perLevel", "type": "dmg"},                     
                    {"def": "maxHp more -50", "type": "def"},
                ],
                "slot": "head",
            },
            "simple minded": {
                "mods": [
                    {"def": "spellDmg added -30", "type": "dmg"},
                    {"def": "strength more 2 perLevel", "type": "def"},
                    {"def": "meleeDmg added 5 perLevel", "type": "dmg"},
                ],
                "slot": "head",
            },
            "explosive bolts": {
                "mods": [
                    {"def": "fireDmg more 3 perLevel", "type": "dmg"},
                    {"def": "physDmg converted 25 fireDmg", "type": "dmg"},
                ],
                "slot": "skill",
                "types": ["range"],
            },
            "shambling": {
                "mods": [
                    {"def": "moveSpeed more -20", "type": "def"},
                    {"def": "physDmg more 3 perLevel", "type": "dmg"},
                ],
                "slot": "chest",
            },
            "unwashed hands": {
                "mods": [
                    {"def": "physDmg converted 25 poisDmg", "type": "dmg"},
                    {"def": "poisDmg more 3 perLevel", "type": "dmg"},
                ],
                "slot": "hands",
            },
            "indigenous toxins": {
                "mods": [
                    {"def": "poisDmg added 5 perLevel", "type": "dmg"},
                    {"def": "poisDmg more 3 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
            },
            "swamp armor": {
                "mods": [
                    {"def": "armor added 10 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "big": {
                "mods": [
                    {"def": "height more 30", "type": "vis"},
                    {"def": "width more 30", "type": "vis"},                    
                    {"def": "maxHp added 10 perLevel", "type": "def"},
                    {"def": "maxHp more 2 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "buff": {
                "mods": [
                    {"def": "width more 30", "type": "vis"},
                    {"def": "lineWidth added 3", "type": "vis"},
                    {"def": "strength added 5 perLevel", "type": "def"},
                    {"def": "meleeDmg more 3 perLevel", "type": "dmg"},
                    {"def": "rangeDmg more 3 perLevel", "type": "dmg"},                    
                ],
                "slot": "chest",
            },
            "vampyric touch": {
                "mods": [
                    {"def": "physDmg gainedas 5 hpLeech", "type": "dmg"},
                    {"def": "physDmg more 2 perLevel", "type": "dmg"},
                ],
                "slot": "hands",
            },
            "vampyric embrace": {
                "mods": [
                    {"def": "physDmg gainedas 5 hpLeech", "type": "dmg"},
                    {"def": "physDmg more 2 perLevel", "type": "dmg"},
                ],
                "slot": "chest",
            },
            "soulsucker": {
                "mods": [
                    {"def": "physDmg gainedas 5 manaLeech", "type": "dmg"},
                    {"def": "physDmg more 2 perLevel", "type": "dmg"},
                ],
                "slot": "head",
            },
            "alabaster": {
                "mods": [
                    {"def": "armor more 5 perLevel", "type": "def"},
                    {"def": "armor added 100", "type": "def"},
                ],
                "slot": "chest",
            },
            "vest pockets": {
                "mods": [
                    {"def": "speed added -1 perLevel", "type": "dmg"},
                    {"def": "speed more -1 perLevel", "type": "dmg"},
                ],
                "slot": "chest",
            },
            "precise": {
                "mods": [
                    {"def": "speed more 20", "type": "dmg"},
                    {"def": "physDmg more 5 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
            },
            "fleece lining": {
                "mods": [
                    {"def": "coldResist more -10", "type": "eleResist"},
                    {"def": "coldResist more -1 perLevel", "type": "eleResist"},
                ],
                "slot": "hands",
            },
            "fur hat": {
                "mods": [
                    {"def": "coldResist more -10", "type": "eleResist"},
                    {"def": "coldResist more -1 perLevel", "type": "eleResist"},
                ],
                "slot": "head",
            },
            "chinchilla lining": {
                "mods": [
                    {"def": "coldResist more -10", "type": "eleResist"},
                    {"def": "coldResist more -1 perLevel", "type": "eleResist"},
                ],
                "slot": "legs",
            },
            "yeti fur": {
                "mods": [
                    {"def": "coldResist more -20", "type": "eleResist"},
                    {"def": "coldResist more -1 perLevel", "type": "eleResist"},
                ],
                "slot": "chest",
            },
            "ice plating": {
                "mods": [
                    {"def": "armor more 3 perLevel", "type": "def"},
                    {"def": "fireResist more -1 perLevel", "type": "eleResist"},
                ],
                "slot": "chest",
            },
            "blue ice": {
                "mods": [
                    {"def": "coldDmg gainedas 30 poisDmg", "type": "dmg"},
                    {"def": "coldDmg more 3 perLevel", "type": "dmg"}
                ],
                "slot": "gloves",
                "rarity": "rare",
            },
            "shadow walker": {
                "mods": [
                    {"def": "dodge added 20 perLevel", "type": "def"},
                ],
                "slot": "legs",
            },
            "full plating": {
                "mods": [
                    {"def": "armor added 20 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "hateful blade": {
                "mods": [
                    {"def": "physDmg gainedas -5 hpLeech", "type": "dmg"},
                    {"def": "physDmg more 5 perLevel", "type": "dmg"},
                ],
                "slot": "weapon",
            },
            "ethereal": {
                "mods": [
                    {"def": "dodge more 2 perLevel", "type": "def"},
                    {"def": "dodge added 100", "type": "def"},
                ],
                "slot": "hands",
            },
            "pyromania": {
                "mods": [
                    {"def": "fireDmg more 8", "type": "dmg"},
                    {"def": "fireDmg more 5 perLevel", "type": "dmg"},
                    {"def": "fireDmg gainedas 10 hpLeech", "type": "dmg"},
                    {"def": "fireResist more 50", "type": "eleResist"},
                ],
                "slot": "head",
                "rarity": "rare"
            },
            "life on hit": {
                "mods": [
                    {"def": "hpOnHit added 1 perLevel", "type": "dmg"},
                    {"def": "manaCost added 1", "type": "dmg"},
                ],
                "slot": "skill",
            },
            "gratifying blow": {
                "mods": [
                    {"def": "hpOnHit added 5 perLevel", "type": "dmg"},
                    {"def": "manaCost more 10", "type": "dmg"},
                ],
                "slot": "skill",
                "rarity": "rare",
            },
            "mana on hit": {
                "mods":[
                    {"def": "manaOnHit added 1 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
            },
            "mana drinker": {
                "mods":[
                    {"def": "manaOnHit added 3 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
                "rarity": "rare"
            },
            "faster attacks": {
                "mods":[
                    {"def": "speed more -17", "type": "dmg"},
                    {"def": "speed more -3 perLevel", "type": "dmg"}
                ],
                "slot": "skill",
            },
            "more physical damage": {
                "mods":[
                    {"def": "physDmg more 17", "type": "dmg"},
                    {"def": "physDmg more 3 perLevel", "type": "dmg"},                    
                ],
                "slot": "skill",
            },
            "longer cooldown": {
                "mods":[
                    {"def": "cooldownTime more 5 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
            },
            "shorter cooldown": {
                "mods":[
                    {"def": "cooldownTime more -5 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
            },
            "longer range": {
                "mods":[
                    {"def": "range more 5 perLevel", "type": "dmg"},
                    {"def": "range more 20", "type": "dmg"},                    
                ],
                "slot": "skill",
            },
            "shorter range": {
                "mods":[
                    {"def": "range more -5 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
            },
            "ab shocker belt": {
                "mods": [
                    {"def": "maxHp added 20 perLevel", "type": "def"},
                    {"def": "lightResist more 20", "type": "eleResist"}
                ],
                "slot": "chest",
            },
            "happy hands": {
                "mods":[
                    {"def": "maxHp added 10 perLevel", "type": "def"},
                ],
                "slot":"hands",
            },
            "hearty heart": {
                "mods": [
                    {"def": "maxHp more 3 perLevel", "type": "def"},
                ],
                "slot":"chest",
            },
            "side arm": {
                "mods": [
                    {"def": "cooldownTime added 250", "type": "dmg"},
                    {"def": "speed more -50", "type": "dmg"}
                ],
                "slot":"skill",
            },
            "practiced": {
                "mods": [
                    {"def": "physDmg more 10", "type": "dmg"},
                    {"def": "speed more -8", "type": "dmg"},
                    {"def": "speed more -2 perLevel", "type": "dmg"}                    
                ],
                "slot":"skill",
            },
            "honed": {
                "mods": [
                    {"def": "physDmg more 3 perLevel", "type": "dmg"},
                    {"def": "speed more -3 perLevel", "type": "dmg"},                   
                ],
                "slot":"skill",
            },
            "fatal blow": {
                "mods": [
                    {"def": "physDmg more 25 perLevel", "type": "dmg"},                                     {"def": "physDmg more 25", "type": "dmg"},   
                    {"def": "cooldownTime added 100", "type": "dmg"},
                    {"def": "cooldownTime more 100", "type": "dmg"},
                ],
                "slot":"skill",
            },
            "finishing move": {
                "mods": [
                    {"def": "physDmg more 200", "type": "dmg"},
                    {"def": "cooldownTime added 500", "type": "dmg"},
                    {"def": "speed more 100", "type": "dmg"},
                    {"def": "speed more -10 perLevel", "type": "dmg"},                    
                ],
                "slot":"skill",
            },
            "reach": {
                "mods": [
                    {"def": "range more 40", "type": "dmg"},
                    {"def": "range more 10 perLevel", "type": "dmg"},
                ],
                "slot":"skill",
            },
            "frugal": {
                "mods": [
                    {"def": "manaCost added -1 perLevel", "type": "dmg"},
                ],
                "slot":"skill",
            },
            "stingy": {
                "mods": [
                    {"def": "manaCost added -3 perLevel", "type": "dmg"},
                    {"def": "speed more 50", "type": "dmg"}
                ],
                "slot":"skill",
            },
            "short sighted": {
                "mods": [
                    {"def": "manaCost more -5 perLevel", "type": "dmg"},
                    {"def": "range more -60", "type": "dmg"}
                ],
                "slot":"skill",
            },
            "divine assistance": {
                "mods": [
                    {"def": "manaCost more -100", "type": "dmg"},
                    {"def": "speed more 100", "type": "dmg"},
                    {"def": "cooldownTime added 1000", "type": "dmg"},
                    {"def": "cooldownTime added -100 perLevel", "type": "dmg"}
                ],
                "slot":"skill",
            },
            "micronaps": {
                "mods": [
                    {"def": "cooldownTime more -5 perLevel", "type": "dmg"},
                    ],
                "slot":"skill",
            },
        },
        "monster": {
            "skeleton" : {
                "items": [["weapon", "cardboard sword"], ["armor", "balsa helmet"], ["armor", "t-shirt"], ["armor", "jeans"]],
                "skills": ["basic melee"],
                "sourceCards": [
                    ["proto-skeleton", 0],
                    //["proto-grunt", 0],
                    ["sharpened", 1],
                    ["breadhat", 1],
                    ["stinging", 1],
                    ["hearty heart", 1]
                ],
            },
            "fire skeleton": {
                "items": [["weapon", "cardboard sword"], ["armor", "balsa helmet"], ["armor", "t-shirt"], ["armor", "jeans"]],
                "skills": ["lethal strike", "fire slash", "super smash", "basic melee"],
                "sourceCards": [
                    ["hot sword", 1],
                    ["proto-skeleton", 0],
                    ["six pack", 1],
                    ["compression shorts", 1],
                    ["asbestos lining", 1]
                ]
            },
            "skeleton archer" : {
                "items": [["weapon", "wooden bow"], ["armor", "t-shirt"], ["armor", "latex gloves"]],
                "skills": ["speed shot", "basic range"],
                "sourceCards": [
                    ["proto-skeleton", 0],
                    ["head of vigor", 1],
                    ["happy hands", 1],
                    ["mana on hit", 1],
                    ["longer range", 1]
                ]
            },
            "skeleton mage" : {
                "items": [["weapon", "simple wand"]],
                "skills": ["fire ball", "basic spell"],
                "sourceCards": [
                    ["proto-skeleton", 0],
                    ["brain juice", 1],
                    ["heart juice", 1],
                    ["life on hit", 1]
                ]
            },
            "skeleton king" : {
                "items": [["weapon", "hand axe"], ["armor", "collander"], ["armor", "leather armor"], ["armor", "gardening gloves"], ["armor", "leather boots"]],
                "skills": ["lethal strike", "super smash", "basic melee"],
                "sourceCards": [
                    ["proto-skeleton", 1],
                    ["proto-boss", 1],
                    ["sharpened", 3],
                    ["hot sword", 3],
                    ["life on hit", 1]
                ]
            },
            "wood nymph" : {
                "items": [["weapon", "cardboard sword"]],
                "skills": ["basic melee"],
                "sourceCards": [
                    ["nimble", 1],
                    ["compression shorts", 3],
                    ["life on hit", 2]
                ]
            },
            "bat" : {
                "items": [["weapon", "cardboard sword"]],
                "skills": ["quick hit", "basic melee"],
                "sourceCards": [
                    ["nimble", 1],
                    ["bloodsucker", 1],
                    ["life on hit", 1],
                    ["clawed", 1]
                ]
            },
            "ent" : {
                "items": [["weapon", "cardboard sword"], ["armor", "conquistador helm"], ["armor", "leatherplate armor"], ["armor", "arcane boots"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["strong back", 2],
                    ["thwomping", 2]
                ]
            },
            "elf" : {
                "items": [["weapon", "composite bow"], ["armor", "scout leather"], ["armor", "elf boots"]],
                "skills": ["poison arrow", "basic range"],
                "sourceCards": [
                    ["dexterous hands", 1],
                    ["proto-elf", 0],
                    ["practiced", 2],
                    ["sharpened", 2]
                ]
            },
            "elf king" : {
                "items": [["weapon", "composite bow"], ["armor", "scout leather"], ["armor", "elf boots"]],
                "skills": ["speed shot", "poison arrow", "basic range"],
                "sourceCards": [
                    ["proto-boss", 0],
                    ["proto-elf", 0],
                    ["dexterous hands", 2],
                    ["practiced", 2],                    
                    ["sharpened", 2]
                ],
                "flavor": "He knows you've been naughty"
            },
            "dummy": {
                "items": [],
                "skills": [],
                "sourceCards": [
                    ["dummy", 0]
                ]
            },
            "fire golem" : {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["ignited", 1]
                ],
            },
            "ice golem" : {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["frosted", 1]
                ],
            },
            "shock golem" : {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["charged", 1]
                ],
            },
            "toxic golem" : {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["putrified", 1]
                ],
            },
            "gnome" : {
                "items": [["weapon", "long sword"]],
                "skills": ["quick hit", "basic melee"],
                "sourceCards": [
                    ["small stature", 1],
                    ["keen wit", 1]
                ],
            },
            "gnome electrician" : {
                "items": [["weapon", "simple wand"]],
                "skills": ["lightning ball", "nova", "basic spell"],
                "sourceCards": [
                    ["small stature", 1],
                    ["keen wit", 1],
                    ["electrified", 1],
                ],
            },
            "roflcopter" : {
                "items": [["weapon", "hand axe"]],
                "skills": ["pressure wave", "quick hit", "basic melee"],
                "sourceCards": [
                    ["flying", 1],
                    ["nimble", 1],
                    ["proto-rofl", 1]
                ],
            },
            "harpy" : {
                "items": [["weapon", "long sword"]],
                "skills": ["pressure wave", "quick hit", "basic melee"],
                "sourceCards": [
                    ["flying", 1],
                    ["nimble", 1],
                    ["clawed", 1],
                ],
            },
            "mechcinerator" : {
                "items": [["weapon", "pewter wand"]],
                "skills": ["incinerate", "fire nova", "basic spell"],
                "sourceCards": [
                    ["riveted", 1],
                    ["clockwork", 1],
                    ["mecha heart", 1],
                    ["ignited", 1],
                    ["steam powered", 1],
                ],
            },
            "mechfridgerator": {
                "items": [["weapon", "pewter wand"]],
                "skills": ["ice blast", "ice nova", "basic spell"],
                "sourceCards": [
                    ["riveted", 1],
                    ["clockwork", 1],
                    ["mecha heart", 1],
                    ["frosted", 1],
                    ["steam powered", 1]
                ],
            },
            "mecha watt" : {
                "items": [["weapon", "pewter wand"]],
                "skills": ["lightning ball", "nova", "basic spell"],
                "sourceCards": [
                    ["riveted", 1],
                    ["clockwork", 1],
                    ["mecha heart", 1],
                    ["charged", 1],
                    ["steam powered", 1]
                ],
            },
            "sir mechs-a-lot" : {
                "items": [["weapon", "long sword"]],
                "skills": ["flame cone", "lightning ball", "ice nova", "basic melee"],
                "sourceCards": [
                    ["proto-boss", 1],
                    ["riveted", 1],
                    ["clockwork", 1],
                    ["mecha heart", 1],
                    ["charged", 1],
                    ["steam powered", 1],
                    ["frosted", 1],
                    ["ignited", 1]
                ],
            },
            "goblin" : {
                "items": [["weapon", "spikey mace"], ["armor", "goblin leather"]],
                "skills": ["flame cone", "basic melee"],
                "sourceCards": [
                    ["goblin toe", 1],
                    ["berserking", 1],
                    ["simple minded", 1],
                ],
            },
            "goblin priest" : {
                "items": [["weapon", "knobby wand"], ["armor", "goblin leather"]],
                "skills": ["fire ball", "incinerate", "basic spell"],
                "sourceCards": [
                    ["goblin toe", 1],
                    ["berserking", 1],
                    ["simple minded", 1],
                    ["pyromania", 1]
                ],
            },
            "goblin artillery" : {
                "items": [["weapon", "crossbow"], ["armor", "goblin leather"]],
                "skills": ["basic range"],
                "sourceCards": [
                    ["goblin toe", 1],
                    ["berserking", 1],
                    ["simple minded", 1],
                    ["explosive bolts", 1]
                ],
            },
            "flame dragon" : {
                "items": [["weapon", "dragonstone wand"]],
                "skills": ["incinerate", "basic spell"],
                "sourceCards": [
                    ["ignited", 1],
                    ["proto-boss", 1],
                    ["pyromania", 1],
                    ["keen wit", 1],
                    ["brain juice", 1]
                ],
            },
            
            "zombie" : {
                "items": [["weapon", "long sword"]],
                "skills": ["poison slash", "basic melee"],
                "sourceCards": [
                    ["unwashed hands", 1],
                    ["shambling", 1],
                    ["simple minded", 1],
                ],
            },
            "angry imp" : {
                "items": [["weapon", "long sword"]],
                "skills": ["poison slash", "quick hit", "basic melee"],
                "sourceCards": [
                    ["berserking", 1],
                    ["small stature", 1],
                    ["simple minded", 1],
                    ["indigenous toxins", 1],
                ],
            },
            "dart imp" : {
                "items": [["weapon", "hand crossbow"]],
                "skills": ["poison arrow", "speed shot", "basic range"],
                "sourceCards": [
                    ["berserking", 1],
                    ["small stature", 1],
                    ["simple minded", 1],
                    ["indigenous toxins", 1],
                    ["putrified", 1]
                ],
            },
            "imp shaman": {
                "items": [["weapon", "star wand"]],
                "skills": ["poison ball", "poison nova", "basic spell"],
                "sourceCards": [
                    ["berserking", 1],
                    ["small stature", 1],
                    ["simple minded", 1],
                    ["indigenous toxins", 1],
                ],
            },
            "marshwalker": {
                "items": [["weapon", "long sword"]],
                "skills": ["poison slash", "poison nova", "basic melee"],
                "sourceCards": [
                    ["indigenous toxins", 1],
                    ["putrified", 1],
                    ["swamp armor", 1]
                ],
            },
            "mad ape": {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["big", 1],
                    ["berserking", 1],
                    ["buff", 1]
                ],
            },
            "scalp collector": {
                "items": [["weapon", "composite bow"]],
                "skills": ["headshot", "basic range"],
                "sourceCards": [
                    ["indigenous toxins", 1],
                    ["putrified", 1],
                    ["precise", 1],
                    ["vest pockets", 1],
                ],
            },
            "frost skeleton": {
                "items": [["weapon", "long sword"], ["armor", "balsa helmet"], ["armor", "iron chestplate"], ["armor", "jeans"]],
                "skills": ["ice slash", "basic melee"],
                "sourceCards": [
                    ["cold sword", 1],
                    ["proto-skeleton", 0],
                    ["six pack", 1],
                    ["compression shorts", 1],
                    ["fleece lining", 1]
                ]
            },
            "frost mage": {
                "items": [["weapon", "knobby wand"]],
                "skills": ["ice blast", "ice nova", "ice ball", "basic spell"],
                "sourceCards": [
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["keen wit", 1],
                    ["fur hat", 1],
                ],
            },
            "frozen warrior": {
                "items": [["weapon", "long sword"]],
                "skills": ["ice slash", "basic melee"],
                "sourceCards": [
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["chinchilla lining", 1],
                    ["ice plating", 1],
                ],
            },
            "yeti": {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["big", 1],
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["chinchilla lining", 1],
                    ["clawed", 1],
                    ["yeti fur", 1]
                ],
            },
            "wight": {
                "items": [["weapon", "long sword"]],
                "skills": ["ice blast", "ice nova", "ice ball", "basic melee"],
                "sourceCards": [
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["fur hat", 1],
                    ["ethereal", 1],
                    ["shadow walker", 1]
                ],
            },
            "walter wight": {
                "items": [["weapon", "long sword"]],
                "skills": ["ice blast", "ice nova", "ice ball", "basic melee"],
                "sourceCards": [
                    ["proto-boss", 0],
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["fur hat", 1],
                    ["ethereal", 1],
                    ["shadow walker", 1]
                ],
            },
            "shadow knight": {
                "items": [["weapon", "long sword"]],
                "skills": ["masterful strike", "basic melee", "shadow dagger"],
                "sourceCards": [
                    ["shadow walker", 1],
                    ["full plating", 1],
                    ["sharpened", 1],
                    ["hateful blade", 1],
                    ["ethereal", 1]
                ],
            },
            "ghoul": {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["shambling", 1],
                    ["simple minded", 1],
                    ["bloodsucker", 1],
                ],
            },
            "vampire": {
                "items": [["weapon", "long sword"]],
                "skills": ["health suck", "super smash", "basic melee"],
                "sourceCards": [
                    ["vampyric touch", 1],
                    ["vampyric embrace", 1],
                    ["bloodsucker", 1],
                    ["soulsucker", 1],
                    ["shadow walker", 1],
                    ["flying", 1]
                ],
            },
            "living statue": {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["simple minded", 1],
                    ["alabaster", 1],
                ],
            },
            "gargoyle": {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["simple minded", 1],
                    ["alabaster", 1],
                    ["clawed", 1],
                    ["flying", 1]                    
                ],
            },
            "minotaur": {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["simple minded", 1],
                    ["big", 1],
                    ["buff", 1]
                ],
            },
            "wraith": {
                "items": [["weapon", "long sword"]],
                "skills": ["ice slash", "basic melee"],
                "sourceCards": [
                    ["berserking", 1],
                    ["flying", 1],
                    ["ethereal", 1],
                ],
            },
        },
        "zone": {
            "spooky dungeon": {
                "choices": ["skeleton", "skeleton archer", "skeleton mage", "fire skeleton"],
                "weights": [20, 10, 5, 5],
                "boss": "skeleton king",
                "roomCount": 20,
                "quantity": [1, 1, 3],
                "level": 1
            },
            "dark forest": {
                "choices": ["wood nymph", "bat", "elf", "ent", "dahd djinn"],
                "weights": [20, 15, 15, 5],
                "boss": "elf king",
                "roomCount": 20,
                "quantity": [2, 2, 3],
                "level": 5,
            },
            "clockwork ruins": {
                "choices": ["gnome", "gnome electrician", "roflcopter", "harpy", "mechcinerator", "mechfridgerator", "mecha watt", "ser djinn"],
                "weights": [20, 10, 10, 10, 5, 5, 5, 0],
                "boss": "sir mechs-a-lot",
                "roomCount": 20,
                "quantity": [2,2,3],
                "level": 10,
            },
            "aggro crag": {
                "choices": ["goblin", "goblin priest", "goblin artillery", "fire skeleton", "fire golem", "kei djinn"],
                "weights": [20, 10, 10, 10, 10, 0],
                "boss":"flame dragon",
                "roomCount": 20,
                "quantity": [2,2,3],
                "level": 15,
            },
            "hostile marsh": {
                "choices": ["zombie", "angry imp", "dart imp", "imp shaman", "marshwalker", "mad ape", "al-err djinn", "scalp collector", "toxic golem"],
                "weights": [20, 10, 10, 10, 10, 10, 0, 10 ,10],
                "boss":"scalp collector",
                "roomCount": 20,
                "quantity": [2,2,3],
                "level": 20,
            },
            "icy tunnel": {
                "choices": ["frost skeleton", "ice golem", "frost mage", "frozen warrior", "yeti", "wight", "frow djinn"],
                "weights": [20, 10, 10, 10 ,10, 0],
                "boss": "walter wight",
                "roomCount": 20,
                "quantity": [2,2,3],
                "level": 25,
            },
            "gothic castle": {
                "choices": ["shadow knight", "ghoul", "vampire", "living statue", "gargoyle", "minotaur", "wraith"],
                "weights": [20, 10, 10, 10, 10, 10, 10],
                "boss": "shadow knight",
                "roomCount": 20,
                "quantity": [2,2,3],
                "level": 30,
            },
            "demonic laboroatory": {
                "choices": ["stitchling", "mad scientist", "minotaur", "blood golem"],
                "weights": [20, 10, 10],
                "boss": "pigbearman",
                "roomCount": 20,
                "quantity": [2,2,3],
                "level": 35,
            },
            "scarred plains": {
                "choices": ["troll", "cyclops", "harpy", "bandit", "giant", "frost giant"],
                "weights": [20, 10, 10],
                "boss": "pigbearman",
                "roomCount": 20,
                "quantity": [2,2,3],
                "level": 40,
            },
            "dojo": {
                "choices": ["dummy"],
                "weights": [1],
                "boss": "dummy",
                "roomCount": 10,
                "quantity": [1, 0, 0],
                "level": 1,
            },
            "empty dojo": {
                "choices": [],
                "weights": [],
                "boss": "dummy",
                "roomCount": 10,
                "quantity": [0, 0, 0],
                "level": 1,
            },
        },
        "zoneProgression": ["spooky dungeon", "dark forest"],
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
        },
        // it goes: [hngg, fwah, hi, hngg, buh, foo, harf]: c: 10, b: 12, a: 15
        "statnames": {
            "strength": "Strength",
            "dexterity": "Dexterity",
            "wisdom": "Wisdom",
            "vitality": "Vitality",
            "maxHp": "Maximum Health",
            "maxMana": "Maximum Mana",
            "armor": "Armor",
            "dodge": "Dodge",
            "eleResistAll": "Elemental Damage Taken",
            "hpRegen": "Health Regenerated per Second",
            "manaRegen": "Mana Regenerated per Second",
            "moveSpeed": "Movement Speed",
            "fireResist": "Fire Damage Taken",
            "coldResist": "Cold Damage Taken",
            "lightResist": "Lightning Damage Taken",
            "poisResist": "Poison Damage Taken",
            "meleeDmg": "Melee Damage",
            "rangeDmg": "Ranged Damage",
            "spellDmg": "Spell Damage",
            "physDmg": "Physical Damage",
            "fireDmg": "Fire Damage",
            "coldDmg": "Cold Damage",
            "lightDmg": "Lightning Damage",
            "poisDmg": "Poison Damange",
            "hpOnHit": "Health Gained on Hit",
            "manaOnHit": "Mana Gained on Hit",
            "cooldownTime": "Cooldown Length",
            "range": "Skill Range",
            "speed": "Skill Duration",
            "manaCost": "Mana Cost",
            "hpLeech": "Leeched Health",
            "manaLeech": "Leeched Mana",
            "lineWidth": "Line Width",
            "height": "Character Height",
            "width": "Character Width", 
        }

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
