namespace.module('bot.itemref', function (exports, require) {
    var log = namespace.bot.log;
    var prob = namespace.bot.prob;

    var BASE_MELEE_RANGE = 40000
    var BASE_RANGE_RANGE = 500000
    var BASE_SPELL_RANGE = 400000

    var PHYS_COLOR = "#777";    
    var FIRE_COLOR = 'rgba(255, 130, 0, 0.6)';
    var COLD_COLOR = 'rgba(0, 255, 255, 0.6)';
    var LIGHT_COLOR = 'rgba(173, 7, 194, 0.6)';
    var POIS_COLOR = 'rgba(85, 255, 139, 0.6)';    

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
                "weaponType": "melee",
            },
            "hand axe": {
                "mods": [
                    {def: 'physDmg more 2 perLevel', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "melee",
            },
            "stone hammer": {
                "mods": [
                    {def: 'speed more 20', type: 'dmg'},
                    {def: 'physDmg added 10', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "melee",
            },
            "falchion": {
                "mods": [
                    {def: 'speed more -20', type: 'dmg'},
                    {def: 'physDmg added 8', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "melee",
            },
            "morning star": {
                "mods": [
                    {def: 'speed more 20', type: 'dmg'},
                    {def: 'physDmg added 14', type: 'dmg'},
                    {def: 'physDmg more 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "melee",
            },
            "long sword": {
                "mods": [
                    {def: 'speed more -1 perLevel', type: 'dmg'},                    
                    {def: 'physDmg added 16', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "weaponType": "melee",
            },
            "spikey mace": {
                "mods": [
                    {def: 'speed more 40', type: 'dmg'},
                    {def: 'physDmg added 16', type: 'dmg'},                    
                    {def: 'physDmg added 4 perLevel', type: 'dmg'}
                ],
                "weaponType": "melee",
            },
            "spiked battle axe": {
                "mods": [
                    {def: 'speed more -1 perLevel', type: 'dmg'},                    
                    {def: 'physDmg added 20', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "weaponType": "melee",
            },
            "winged axe": {
                "mods": [
                    {def: 'range more 2 perLevel', type: 'dmg'},
                    {def: 'speed more 20', type: 'dmg'},                    
                    {def: 'physDmg added 19', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "weaponType": "melee",
            },
            ////////////////////
            ///// RANGED ///////
            ////////////////////
            "wooden bow": {
                "mods": [
                    {def: 'physDmg added 5', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "range",
            },
            "hand crossbow": {
                "mods": [
                    {def: 'physDmg added 7', type: 'dmg'},
                    {def: 'speed more -30', type: 'dmg'},                    
                    {def: 'physDmg added 1 perLevel', type: 'dmg'}
                ],
                "weaponType": "range",
            },
            "crossbow": {
                "mods": [
                    {def: 'speed more 20', type: 'dmg'},                    
                    {def: 'physDmg added 9', type: 'dmg'},
                    {def: 'physDmg added 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "range",
            },
            "composite bow": {
                "mods": [
                    {def: 'range more 20', type: 'dmg'},                    
                    {def: 'physDmg added 10', type: 'dmg'},
                    {def: 'physDmg added 3 perLevel', type: 'dmg'}
                ],
                "weaponType": "range",
            },
            ////////////////////
            ////// SPELL ///////
            ////////////////////
            "simple wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "spell",
            },
            "knobby wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 3 perLevel', type: 'dmg'}
                ],
                "weaponType": "spell",
            },
            "pewter wand": {
                "mods": [
                    {def: 'spellDmg more 15', type: 'dmg'},
                    {def: 'spellDmg more 5 perLevel', type: 'dmg'}
                ],
                "weaponType": "spell",
            },
            "delicate wand": {
                "mods": [
                    {def: 'spellDmg more 25', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "spell",
            },
            "dragonstone wand": {
                "mods": [
                    {def: 'fireDmg more 15', type: 'dmg'},
                    {def: 'fireDmg more 3 perLevel', type: 'dmg'}
                ],
                "weaponType": "spell",
            },
            "fairy wand": {
                "mods": [
                    {def: 'spellDmg more 25', type: 'dmg'},
                    {def: 'spellDmg more 4 perLevel', type: 'dmg'}
                ],
                "weaponType": "spell",
            },
            "star wand": {
                "mods": [
                    {def: 'spellDmg more 25', type: 'dmg'},
                    {def: 'spellDmg more 3 perLevel', type: 'dmg'}
                ],
                "weaponType": "spell",
            },
            "demon wand": {
                "mods": [
                    {def: 'spellDmg more 50', type: 'dmg'},
                    {def: 'spellDmg more 2 perLevel', type: 'dmg'}
                ],
                "weaponType": "spell",
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
                "slot": "head",
            },
            "collander": {
                "mods": [
                    {def: 'armor added 7', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "slot": "head",
            },
            "conquistador helm": {
                "mods": [
                    {def: 'armor added 9', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "slot": "head",
            },
            "crusader helm": {
                "mods": [
                    {def: 'armor added 15', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "slot": "head",
            },
            "gladiator helm": {
                "mods": [
                    {def: 'armor added 22', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "slot": "head",
            },
            "apollo helmet": {
                "mods": [
                    {def: 'armor added 30', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "slot": "head",
            },
            "plague doctor": {
                "mods": [
                    {def: 'poisResist more -10', type: 'eleResist'},
                    {def: 'poisDmg gainedas 1 hpLeech', type: 'dmg'},
                    {def: 'poisResist more -0.5 perLevel', type: 'eleResist'}
                ],
                "slot": "head",
            },
            ////////////////////
            ///// CHEST ////////
            ////////////////////
            "t-shirt": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "leather armor": {
                "mods": [
                    {def: 'armor added 8', type: 'def'},
                    {def: 'armor added 3 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "goblin leather": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 4 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "leatherscale armor": {
                "mods": [
                    {def: 'armor more 20', type: 'def'},
                    {def: 'armor added 5 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "leatherplate armor": {
                "mods": [
                    {def: 'armor added 20', type: 'def'},
                    {def: 'armor added 3 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "hammered chestplate": {
                "mods": [
                    {def: 'armor added 50', type: 'def'},
                    {def: 'armor added 5 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "iron chestplate": {
                "mods": [
                    {def: 'armor added 50', type: 'def'},
                    {def: 'armor more 2 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "copper chestplate": {
                "mods": [
                    {def: 'armor added 50', type: 'def'},
                    {def: 'armor more 3 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "muscle plate": {
                "mods": [
                    {def: 'armor added 50', type: 'def'},
                    {def: 'armor more 4 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "elegant plate": {
                "mods": [
                    {def: 'armor added 55', type: 'def'},
                    {def: 'armor more 5 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "raider armor": {
                "mods": [
                    {def: 'physDmg more 5 perLevel', type: 'dmg'}
                ],
                "slot": "chest",
            },
            "shadow armor": {
                "mods": [
                    {def: 'dodge added 50', type: 'def'},
                    {def: 'dodge added 5 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "scout leather": {
                "mods": [
                    {def: 'dodge added 20', type: 'def'},
                    {def: 'dodge more 2 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "studded leather": {
                "mods": [
                    {def: 'dodge added 50', type: 'def'},
                    {def: 'dodge more 4 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "velvet tunic": {
                "mods": [
                    {def: 'manaRegen added 5', type: 'def'},
                    {def: 'manaRegen more 5 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "war robe": {
                "mods": [
                    {def: 'manaRegen added 10', type: 'def'},
                    {def: 'armor added 5 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "winged leather": {
                "mods": [
                    {def: 'armor added 100', type: 'def'},
                    {def: 'armor added 10 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "cultist robe": {
                "mods": [
                    {def: 'spellDmg more 20', type: 'dmg'},
                    {def: 'manaRegen more 5 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "embroidered silks": {
                "mods": [
                    {def: 'manaRegen added 20', type: 'def'},
                    {def: 'manaRegen more 5 perLevel', type: 'def'}
                ],
                "slot": "chest",
            },
            "batsuit": {
                "mods": [
                    {def: 'speed more -20', type: 'dmg'},
                    {def: 'physDmg more 2 perLevel', type: 'dmg'},
                ],
                "slot": "chest",
            },
            ////////////////////
            ///// LEGS /////////
            ////////////////////
            "jeans": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 1 perLevel', type: 'def'}
                ],
                "slot": "legs",
            },
            "leather boots": {
                "mods": [
                    {def: 'armor added 10', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "slot": "legs",
            },
            "elf boots": {
                "mods": [
                    {def: 'dodge added 5', type: 'def'},
                    {def: 'dodge added 2 perLevel', type: 'def'}
                ],
                "slot": "legs",
            },
            "mage boots": {
                "mods": [
                    {def: 'manaRegen added 3', type: 'def'},
                    {def: 'manaRegen added 1 perLevel', type: 'def'}
                ],
                "slot": "legs",
            },
            "arcane boots": {
                "mods": [
                    {def: 'manaRegen added 5', type: 'def'},
                    {def: 'manaRegen added 2 perLevel', type: 'def'}
                ],
                "slot": "legs",
            },
            "buckaneer boots": {
                "mods": [
                    {def: 'armor added 25', type: 'def'},
                    {def: 'armor added 5 perLevel', type: 'def'}
                ],
                "slot": "legs",
            },
            "suess boots": {
                "mods": [
                    {def: 'armor added 500', type: 'def'},
                    {def: 'armor added 20 perLevel', type: 'def'}
                ],
                "slot": "legs",
            },
            ////////////////////
            ///// GLOVES ///////
            ////////////////////
            "latex gloves": {
                "mods": [
                    {def: 'armor added 5', type: 'def'},
                    {def: 'armor added 1 perLevel', type: 'def'}
                ],
                "slot": "hands",
            },
            "gardening gloves": {
                "mods": [
                    {def: 'armor added 7', type: 'def'},
                    {def: 'armor added 2 perLevel', type: 'def'}
                ],
                "slot": "hands",
            },
            "leather gloves": {
                "mods": [
                    {def: 'armor added 10', type: 'def'},
                    {def: 'armor added 3 perLevel', type: 'def'}
                ],
                "slot": "hands",
            },
            "velvet gloves": {
                "mods": [
                    {def: 'manaRegen added 2', type: 'def'},
                    {def: 'manaRegen added 1 perLevel', type: 'def'}
                ],
                "slot": "hands",
            },
            "handmail": {
                "mods": [
                    {def: 'armor added 15', type: 'def'},
                    {def: 'armor added 3 perLevel', type: 'def'}
                ],
                "slot": "hands",
            },
            "fancy gauntlets": {
                "mods": [
                    {def: 'armor added 25', type: 'def'},
                    {def: 'armor added 4 perLevel', type: 'def'}
                ],
                "slot": "hands",
            },
            "polished gauntlets": {
                "mods": [
                    {def: 'armor added 30', type: 'def'},
                    {def: 'armor added 4 perLevel', type: 'def'}
                ],
                "slot": "hands",
            },
            "goldenscale gauntlets": {
                "mods": [
                    {def: 'armor added 50', type: 'def'},
                    {def: 'armor added 5 perLevel', type: 'def'}
                ],
                "slot": "hands",
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

        "skill": {
            "basic": {
            },
            "basic melee": {
                "prototype": ["basic"],
                "skillType": "melee",
                "types": ["melee"],
                "specs": [{ type: 'melee', color: PHYS_COLOR, quals: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE, type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                ]
            },
            "basic range": {
                "prototype": ["basic"],
                "skillType": "range",
                "types": ["proj"],
                "specs": [{ type: 'proj', color: PHYS_COLOR, quals: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                ]
            },
            "basic spell": {
                "prototype": ["basic"],
                "skillType": "spell",
                "types": ["proj"],
                "specs": [{ type: 'proj', color: PHYS_COLOR, quals: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'physDmg added 9', type: 'dmg'},
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
                    {def: 'manaCost added 3', type: 'dmg'},
                    {def: 'speed added 250', type: 'dmg'},
                    {def: 'physDmg more 2 perLevel', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},
                ]
            },
            "fire slash": {
                "prototype": ["basic melee"],
                "types": ["melee", "fire"],
                "anim": ["#f00"],
                "specs": [{ type: 'melee', color: FIRE_COLOR}],
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
            "flaming debris": {
                "prototype": ["basic melee"],
                "types": ["melee", "fire"],
                "specs": [{ type: 'melee', quals: [],
                            onHit: [{ type: 'proj', color: FIRE_COLOR,
                                      quals: ['projCount added 2', 'dmg more -20'],
                                      onKill: [], onRemove: []}],
                            onKill: [],
                            onRemove: []
                          }],
                "baseMods": [
                    {def: 'manaCost added 3', type: 'dmg'},
                    {def: 'cooldownTime added 600', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE, type: 'dmg'},
                    {def: 'projRange added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'fireDmg more 1 perLevel', type: 'dmg'},
                    {def: 'fireDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},      
                    {def: 'physDmg converted 60 fireDmg', type: 'dmg'},
                    {def: 'projSpeed more -80', type: 'dmg'},
                ]
            },
            "exploding strike": {
                "prototype": ["basic melee"],
                "types": ["melee", "fire"],
                "specs": [{ type: 'melee', quals: [], color: FIRE_COLOR,
                            onHit: [],
                            onKill: [{ type: 'circle', color: FIRE_COLOR, quals: ['dmg more 200'], onHit: [], onKill: [], onRemove: []}],
                            onRemove: []
                          }],
                "baseMods": [
                    {def: 'manaCost added 4', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},
                    {def: 'fireDmg more 1 perLevel', type: 'dmg'},
                    {def: 'fireDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg converted 60 fireDmg', type: 'dmg'},
                    {def: 'aoeRadius more -40', type: 'dmg'},
                ],
                "flavor": "Creates fiery AoE explosions on kill dealing double damage",
            },
            "splashing hit": {
                "prototype": ["basic melee"],
                "types": ["melee"],
                "specs": [{ type: 'melee', quals: [], color: PHYS_COLOR,
                            onHit: [{ type: 'circle', color: PHYS_COLOR, quals: ['dmg more -20'], onHit: [], onKill: [], onRemove: []}],
                            onKill: [],
                            onRemove: []
                          }],
                "baseMods": [
                    {def: 'manaCost added 10', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE * 1.5, type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg more 2 perLevel', type: 'dmg'},
                    {def: 'physDmg more -40', type: 'dmg'},
                    {def: 'aoeRadius more -60', type: 'dmg'},
                ],
                "flavor": "Creates small AoE explosions on hit",
            },
            "blast arrow": {
                "prototype": ["basic range"],
                "types": ["range"],
                "specs": [{ type: 'proj', quals: [], color: PHYS_COLOR,
                            onHit: [{ type: 'circle', color: PHYS_COLOR, quals: ['dmg more -20'], onHit: [], onKill: [], onRemove: []}],
                            onKill: [],
                            onRemove: []
                          }],
                "baseMods": [
                    {def: 'manaCost added 12', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE * 1.5, type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg more 2 perLevel', type: 'dmg'},
                    {def: 'physDmg more -40', type: 'dmg'},
                    {def: 'aoeRadius more -60', type: 'dmg'},
                ],
                "flavor": "Creates small AoE explosions on hit",
            },
            "ground smash": {
                "prototype": ["basic melee"],
                "types": ["melee", "fire"],
                "specs": [{ type: 'melee', quals: [],
                            onHit: [{ type: 'cone', color: FIRE_COLOR, quals: ['dmg more -20'], onHit: [], onKill: [], onRemove: []}],
                            onKill: [],
                            onRemove: []
                          }],
                "baseMods": [
                    //{def: 'manaCost added 3', type: 'dmg'},
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
                "specs": [{ type: 'melee', color: COLD_COLOR}],
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
                "specs": [{ type: 'melee', color: LIGHT_COLOR}],
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
                "specs": [{ type: 'melee', color: POIS_COLOR}],
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
                "skillType": "range",
                "types": ["proj"],
                "baseMods": [
                    {def: 'manaCost added 3', type: 'dmg'},
                    {def: 'manaCost more 10 perLevel', type: 'dmg'},
                    {def: 'physDmg more -30', type: 'dmg'},
                    {def: 'physDmg more 2 perLevel', type: 'dmg'},                    
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                ]
            },
            "fire arrow": {
                "prototype": ["basic range"],
                "skillType": "range",
                "types": ["proj", "fire"],
                "anim": ["#f00"],
                "specs": [{ type: 'proj', color: FIRE_COLOR}],
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
                "skillType": "range",
                "types": ["proj", "cold"],
                "anim": ["#00f"],
                "specs": [{ type: 'proj', color: COLD_COLOR}],
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
                "skillType": "range",
                "types": ["proj", "lightning"],
                "anim": ["#ff0"],
                "specs": [{ type: 'proj', color: LIGHT_COLOR}],
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
                "skillType": "range",
                "types": ["proj", "poison"],
                "anim": ["#0f0"],
                "specs": [{ type: 'proj', color: POIS_COLOR}],
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
                "skillType": "range",
                "types": ["proj"],
                "specs": [{ type: 'proj', color: '#FFF', quals: [], onHit: [], onKill: [], onRemove: [] }],                
                "baseMods": [
                    {def: 'manaCost added 6', type: 'dmg'},
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'physDmg more 10 perLevel', type: 'dmg'},
                    {def: 'projSpeed more 200', type: 'dmg'},
                    {def: 'cooldownTime added 1000', type: 'dmg'},
                ]
            },
            "incinerate": {                
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "fire", "spell"],
                "anim": ["#f00"],
                "specs": [{ type: 'cone', color: FIRE_COLOR}],
                "baseMods": [
                    {def: 'manaCost added 7', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE / 4, type: 'dmg'},
                    {def: 'fireDmg added 2', type: 'dmg'},
                    {def: 'fireDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg converted 100 fireDmg', type: 'dmg'}
                ]
            },
            "poison spray": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["cone", "pois", "spell"],
                "specs": [{type: "cone", color: POIS_COLOR}],
                "baseMods": [
                    {def: 'manaCost added 9', type: 'dmg'},
                    {def: 'speed added 350', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE * 0.3, type: 'dmg'},
                    {def: 'aoeRadius more -20', type: 'dmg'},
                    {def: 'poisDmg added 4', type: 'dmg'},
                    {def: 'poisDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg converted 100 poisDmg', type: 'dmg'}
                ]
            },
            "fire ball": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "fire", "spell"],
                "anim": ["#f00"],
                "specs": [{ type: "proj", color: FIRE_COLOR}],
                "baseMods": [
                    {def: 'manaCost added 9', type: 'dmg'},
                    {def: 'speed added 600', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'fireDmg added 3 perLevel', type: 'dmg'},
                    {def: 'fireDmg added 3', type: 'dmg'},
                    {def: 'projRadius more 200', type: 'dmg'},
                ],
                "flavor": "Goodness gracious, these balls are great!"
            },
            "ice ball": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "cold", "spell"],
                "anim": ["#00f"],
                "specs": [{type: "proj", color: COLD_COLOR}],
                "baseMods": [
                    {def: 'manaCost added 9', type: 'dmg'},
                    {def: 'speed added 600', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'coldDmg added 3 perLevel', type: 'dmg'},
                    {def: 'coldDmg added 3', type: 'dmg'},
                    {def: 'projRadius more 200', type: 'dmg'},                    
                ]
            },
            "lightning ball": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "lightning", "spell"],
                "anim": ["#ff0"],
                "specs": [{type: "proj", color: LIGHT_COLOR}],
                "baseMods": [
                    {def: 'manaCost added 9', type: 'dmg'},
                    {def: 'speed added 600', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'lightDmg added 3 perLevel', type: 'dmg'},
                    {def: 'lightDmg added 3', type: 'dmg'},
                    {def: 'projRadius more 200', type: 'dmg'},                    
                ]
            },
            "poison ball": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "poison", "spell"],
                "anim": ["#0f0"],
                "specs": [{ type: 'proj', color: POIS_COLOR }],
                "baseMods": [
                    {def: 'manaCost added 16', type: 'dmg'},
                    {def: 'speed added 1000', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE * 0.7, type: 'dmg'},
                    {def: 'poisDmg added 5 perLevel', type: 'dmg'},
                    {def: 'poisDmg added 5', type: 'dmg'},
                    {def: 'projRadius more 200', type: 'dmg'},                    
                ]
            },
            "ice blast": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["cone", "cold", "spell"],
                "specs": [{ type: 'cone', color: COLD_COLOR, quals: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'manaCost added 4', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE / 4, type: 'dmg'},
                    {def: 'coldDmg added 6', type: 'dmg'},
                    {def: 'coldDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "pressure wave": {
                "prototype": ["basic spell"],
                "skillType": "spell",
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
                "skillType": "spell",
                "types": ["proj", "spell"],
                "specs": [{type: "proj", color: '#000'}],
                "baseMods": [
                    {def: 'manaCost added 10', type: 'dmg'},
                    {def: 'cooldownTime added 2000', type: 'dmg'},
                    {def: 'speed added 100', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'physDmg added 10 perLevel', type: 'dmg'},
                ]
            },
            "health suck": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "spell"],
                "baseMods": [
                    {def: 'manaCost added 25', type: 'dmg'},
                    {def: 'speed added 300', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE, type: 'dmg'},
                    {def: 'physDmg added 9', type:'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'physDmg gainedas 50 hpLeech', type: 'dmg'}
                ]
            },
            "nova": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "circle" , "spell"],
                "specs": [{ type: 'circle', color: LIGHT_COLOR, quals: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'manaCost added 12', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'cooldownTime added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_SPELL_RANGE / 5, type: 'dmg'},
                    {def: 'aoeRadius more -50', type: 'dmg'},
                    {def: 'lightDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "fire nova": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "aoecircle" , "spell"],
                "specs": [{ type: 'circle', color: FIRE_COLOR}],
                "baseMods": [
                    {def: 'manaCost added 12', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'cooldownTime added 200', type: 'dmg'},                    
                    {def: 'range added ' + BASE_SPELL_RANGE/5, type: 'dmg'},
                    {def: 'fireDmg added 3 perLevel', type: 'dmg'},
                    {def: 'aoeRadius more -50', type: 'dmg'},                    
                ]
            },
            "ice nova": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "aoecircle" , "spell"],
                "specs": [{ type: 'circle', color: COLD_COLOR}],
                "baseMods": [
                    {def: 'manaCost added 12', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'cooldownTime added 200', type: 'dmg'},                    
                    {def: 'range added ' + BASE_SPELL_RANGE/5, type: 'dmg'},
                    {def: 'coldDmg added 3 perLevel', type: 'dmg'},
                    {def: 'aoeRadius more -50', type: 'dmg'},                    
                ]
            },
            "poison nova": {
                "prototype": ["basic spell"],
                "skillType": "spell",
                "types": ["proj", "aoecircle" , "spell"],
                "specs": [{ type: 'circle', color: POIS_COLOR}],
                "baseMods": [
                    {def: 'manaCost added 12', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'cooldownTime added 200', type: 'dmg'},                    
                    {def: 'range added ' + BASE_SPELL_RANGE/5, type: 'dmg'},
                    {def: 'poisDmg added 3 perLevel', type: 'dmg'},
                    {def: 'aoeRadius more -50', type: 'dmg'},                    
                ]
            },
            "flame cone": {
                "prototype": ["basic"],
                "skillType": "melee",
                "types": ["cone" , "melee"],
                "specs": [{ type: 'cone', color: FIRE_COLOR, quals: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'manaCost added 5', type: 'dmg'},
                    {def: 'speed added 200', type: 'dmg'},
                    {def: 'range added ' + BASE_MELEE_RANGE, type: 'dmg'},
                    {def: 'aoeRadius more 50', type: 'dmg'},
                    {def: 'fireDmg added 3 perLevel', type: 'dmg'},
                ]
            },
            "lethal strike": {
                "prototype": ["basic melee"],
                "skillType": "melee",
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
            "deadly volley": {
                "prototype": ["basic"],
                "skillType": "range",
                "types": ["proj"],
                "specs": [{ type: 'proj', color: '#FFF', quals: [], onHit: [], onKill: [], onRemove: [] }],
                "baseMods": [
                    {def: 'speed added 500', type: 'dmg'},
                    {def: 'range added ' + BASE_RANGE_RANGE, type: 'dmg'},
                    {def: 'manaCost added 20', type: 'dmg'},
                    {def: 'physDmg added 1 perLevel', type: 'dmg'},
                    {def: 'projCount added 16', type: 'dmg'},
                    {def: 'physDmg more -50', type:'dmg'},
                    {def: 'angle more -70', type: 'dmg'},                    
                    {def: 'cooldownTime added 5000', type: 'dmg'}
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
                    {"def": "lineWidth added 1", "type": "vis"},
                    {"def": "width more 100", "type": "vis"},
                    {"def": "height more 100", "type": "vis"},                                        
                    {"def": "physDmg more 100", "type": "dmg"},
                    {"def": "maxHp more 1000", "type": "def"}
                ],
            },
            "proto-bat": {
                "mods": [
                    {"def": "height more -80", "type": "vis"},
                ]
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
                    {"def": "dexterity added 10 perLevel", "type": "def"},
                    {"def": "physDmg more 10 perLevel", "type": "dmg"},
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
            "honed blade": {
                "mods": [
                    {"def": "physDmg added 2 perLevel", "type": "dmg"}
                ],
                "slot": "weapon",
            },
            "breadhat": {
                "mods": [
                    {"def": "armor added 10 perLevel", "type": "def"}
                ],
                "slot": "head",
            },            
            "six pack": {
                "mods": [
                    {"def": "lineWidth added 1", "type": "vis"},                                        
                    {"def": "armor added 10 perLevel", "type": "def"}
                ],
                "slot": "chest",
            },
            "steel toed": {
                "mods": [
                    {"def": "armor added 4 perLevel", "type": "def"}
                ],
                "slot": "legs",
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
                    {"def": "physDmg gainedas 5 hpLeech", "type": "dmg"},
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
            "more projectiles": {
                "mods": [
                    {"def": "projCount added 2", "type": "dmg"},
                    {"def": "angle more 20", "type": "dmg"},
                    {"def": "speed more -1 perLevel", "type": "dmg"},
                    {"def": "manaCost added 2", "type": "dmg"}
                ],
                "slot": "skill",
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
                "slot": "skill",
            },
            "frosted": {
                "mods": [
                    {"def": "physDmg converted 20 coldDmg", "type": "dmg"},
                    {"def": "coldDmg more 2 perLevel", "type": "dmg"},                    
                ],
                "slot": "skill",
            },
            "charged": {
                "mods": [
                    {"def": "physDmg converted 20 lightDmg", "type": "dmg"},
                    {"def": "lightDmg more 2 perLevel", "type": "dmg"},                    
                ],
                "slot": "skill",
            },
            "putrefied": {
                "mods": [
                    {"def": "physDmg converted 20 poisDmg", "type": "dmg"},
                    {"def": "poisDmg more 2 perLevel", "type": "dmg"},
                ],
                "slot": "skill",
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
                    {"def": "armor more -20", "type": "def"},
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
                    {"def": "spellDmg more -30", "type": "dmg"},
                    {"def": "strength more 2 perLevel", "type": "def"},
                    {"def": "meleeDmg more 5 perLevel", "type": "dmg"},
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
                    {"def": "poisResist more -5 perLevel", "type": "eleResist"},
                    {"def": "poisResist more -10", "type": "eleResist"},                    
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
                "slot": "hands",
                "rarity": "rare",
                "flavor": "I am not in danger, I am the danger.",
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
                    {"def": "fireDmg gainedas 5 hpLeech", "type": "dmg"},
                    {"def": "fireResist more 50", "type": "eleResist"},
                ],
                "slot": "head",
                "rarity": "rare"
            },
            "life on hit": {
                "mods": [
                    {"def": "hpOnHit added 1 perLevel", "type": "dmg"},
                    {"def": "manaCost added 1", "type": "dmg"},
                    {"def": "aoeRadius more -30", "type":"dmg"},
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
            "telescoping handle": {
                "mods":[
                    {"def": "range more 5 perLevel", "type": "dmg"},
                    {"def": "range more 20", "type": "dmg"},                    
                ],
                "slot": "weapon",
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
            "bloodfingers": {
                "mods":[
                    {"def": "maxHp added 10 perLevel", "type": "def"},
                ],
                "slot":"hands",
            },
            "bloodbath": {
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
            "healing charm": {
                "mods": [
                    {"def": "manaRegen added -5 perLevel", "type": "def"},
                    {"def": "hpRegen added 10 perLevel", "type": "def"},
                ],
                "slot": "chest",
            },
            "blood pact": {
                "mods": [
                    {"def": "manaRegen added 10 perLevel", "type": "def"},
                    {"def": "hpRegen added -5 perLevel", "type": "def"},                    
                ],
                "slot": "head",
            },
            "jet pack": {
                "mods": [
                    {"def": "moveSpeed more 50", "type": "def"},
                    {"def": "moveSpeed more 10 perLevel", "type": "def"},                    
                    {"def": "dodge more -50", "type": "def"},
                    {"def": "armor more -50", "type": "def"},                    
                ],
                "slot": "chest",
                "flavor": "Burning out his fuse up here alone",
            },
            "cold blooded": {
                "mods": [
                    {"def": "coldDmg more 30", "type": "dmg"},
                    {"def": "fireDmg more -30", "type": "dmg"},
                    {"def": "coldResist more -20", "type": "eleResist"},
                    {"def": "fireResist more 20", "type": "eleResist"},                    
                    {"def": "coldResist more -2 perLevel", "type": "eleResist"},
                    {"def": "coldDmg more 3 perLevel", "type": "dmg"},                    
                ],
                "slot": "chest",
                "flavor": "Ice-water in his veins...",
            },
            "hot blooded": {
                "mods": [
                    {"def": "coldDmg more -30", "type": "dmg"},
                    {"def": "fireDmg more 30", "type": "dmg"},
                    {"def": "coldResist more 20", "type": "eleResist"},
                    {"def": "fireResist more -20", "type": "eleResist"},
                    {"def": "fireResist more -2 perLevel", "type": "eleResist"},
                    {"def": "fireDmg more 3 perLevel", "type": "dmg"},
                ],
                "slot": "chest",
                "flavor": "Magma in his veins...",
            },
            "semi automatic": {
                "mods": [
                    {"def": "cooldownTime more -20", "type": "dmg"},
                    {"def": "cooldownTime more -2 perLevel", "type": "dmg"},                    
                ],
                "slot": "weapon",
                "flavor": "NOW I HAVE A MACHINE GUN HO-HO-HO",
            },
            "careful aim": {
                "mods": [
                    {"def": "physDmg more 100", "type": "dmg"},
                    {"def": "cooldownTime added 2000", "type": "dmg"},
                    {"def": "physDmg more 4 perLevel", "type": "dmg"},                    
                ],
                "slot": "skill",
                "flavor": "Ready... Aim... FIRE!",
            },
            "conductive suit": {
                "mods": [
                    {"def": "lightDmg more 20", "type": "dmg"},
                    {"def": "lightResist more -20", "type": "eleResist"},
                    {"def": "lightResist more -2 perLevel", "type": "eleResist"},
                    {"def": "lightDmg more 2 perLevel", "type": "dmg"},
                ],
                "slot": "chest",
                "flavor": "Fortunately the path of least resistance is no longer through your heart.",
            },
            "antibiotics": {
                "mods": [
                    {"def": "poisResist more -20", "type": "eleResist"},
                    {"def": "poisResist more -2 perLevel", "type": "eleResist"},
                ],
                "slot": "hands",
            },
            "forest spirit": {
                "mods": [
                    {"def": "maxHp gainedas 2 hpRegen", "type": "def"},
                    {"def": "maxHp more 1 perLevel", "type": "def"}
                ],
                "slot": "head"
            },
            "armor plating": {
                "mods": [
                    {"def": "armor added 10 perLevel", "type": "def"},
                    {"def": "armor more 2 perLevel", "type": "def"}
                ],
                "slot": "hands"
            },
            "mind expansion": {
                "mods": [
                    {"def": "wisdom added 10 perLevel", "type": "def"},
                    {"def": "wisdom gainedas 100 maxMana", "type": "def"}
                ],
                "slot": "head"
            },
            "roller skates": {
                "mods": [
                    {"def": "moveSpeed more 5 perLevel", "type": "def"},
                ],
                "slot": "legs"
            },
            "prismatic toe ring": {
                "mods": [
                    {"def": "eleResistAll more -10", "type": "def"},
                    {"def": "eleResistAll more -0.5 perLevel", "type": "def"}
                ],
                "slot": "legs"
            },
            "hobbit foot": {
                "mods": [
                    {"def": "maxHp more 10", "type": "def"},
                    {"def": "maxHp more 1 perLevel", "type": "def"}
                ],
                "slot": "legs"
            },
            "clown shoes": {
                "mods": [
                    {"def": "maxHp added 20 perLevel", "type": "def"},
                    {"def": "moveSpeed more -30", "type": "def"}
                ],
                "slot": "legs"
            },
            "happy feet": {
                "mods": [
                    {"def": "maxHp added 10 perLevel", "type": "def"},
                    {"def": "maxHp more 20", "type": "def"},                    
                ],
                "slot": "legs"
            },
            "ice spikes": {
                "mods": [
                    {"def": "physDmg added 5", "type": "dmg"},
                    {"def": "coldResist more -10", "type": "eleResist"},                    
                    {"def": "coldResist more -0.5 perLevel", "type": "eleResist"}
                ],
                "slot": "legs"
            },
            "knee pads": {
                "mods": [
                    {"def": "armor more 10", "type": "def"},
                    {"def": "armor more 0.5 perLevel", "type": "def"},
                ],
                "slot": "legs"
            },
            "hazmat boots": {
                "mods": [
                    {"def": "eleResistAll more -15", "type": "def"},
                    {"def": "eleResistAll more -0.3 perLevel", "type": "def"}
                ],
                "slot": "legs"
            },
            "rubber boots": {
                "mods": [
                    {"def": "lightResist more -10", "type": "eleResist"},
                    {"def": "lightResist more -0.5 perLevel", "type": "eleResist"}
                ],
                "slot": "legs"
            },
            "good circulation": {
                "mods": [
                    {"def": "maxHp more 20", "type": "def"},
                    {"def": "maxHp added 5 perLevel", "type": "def"}
                ],
                "slot": "legs"
            },
            "reduced radius": {
                "mods": [
                    {"def": "aoeRadius more -50", "type": "dmg"},
                    {"def": "speed more -10", "type": "dmg"},                                        
                    {"def": "speed more -1 perLevel", "type": "dmg"},                    
                ],
                "slot": "skill"
            },
            "increased radius": {
                "mods": [
                    {"def": "aoeRadius more 50", "type": "dmg"},
                    {"def": "aoeRadius more 5 perLevel", "type": "dmg"},
                ],
                "slot": "skill"
            },
            "potion holster": {
                "mods": [
                    {"def": "vitality added 5 perLevel", "type": "def"},
                    {"def": "vitality more 20", "type": "def"},
                ],
                "slot": "hands"
            },
            "flame ritual": {
                "mods": [
                    {"def": "fireDmg gainedas 1 hpLeech", "type": "dmg"},
                    {"def": "fireDmg more 1 perLevel", "type": "dmg"},
                ],
                "slot": "skill"
            },
            "frost ritual": {
                "mods": [
                    {"def": "coldDmg gainedas 1 hpLeech", "type": "dmg"},
                    {"def": "coldDmg more 1 perLevel", "type": "dmg"},
                ],
                "slot": "skill"
            },
            "shock ritual": {
                "mods": [
                    {"def": "lightDmg gainedas 1 hpLeech", "type": "dmg"},
                    {"def": "lightDmg more 1 perLevel", "type": "dmg"},
                ],
                "slot": "skill"
            },
            "plague ritual": {
                "mods": [
                    {"def": "poisDmg gainedas 1 hpLeech", "type": "dmg"},
                    {"def": "poisDmg more 1 perLevel", "type": "dmg"},
                ],
                "slot": "skill"
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
                    ["bloodbath", 1]
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
                    ["bloodfingers", 1],
                    ["mana on hit", 1],
                    ["telescoping handle", 1],
                    ["sharpened", 1],
                    ["stinging", 1]
                ]
            },
            "skeleton mage" : {
                "items": [["weapon", "simple wand"], ["armor", "velvet tunic"]],
                "skills": ["fire ball", "basic spell"],
                "sourceCards": [
                    ["proto-skeleton", 0],
                    ["brain juice", 1],
                    ["heart juice", 1],
                    ["life on hit", 1]
                ]
            },
            "skeleton embermage" : {
                "items": [["weapon", "simple wand"], ["armor", "velvet tunic"]],
                "skills": ["incinerate", "fire ball", "basic spell"],
                "sourceCards": [
                    ["proto-skeleton", 0],
                    ["life on hit", 2],
                    ["mana on hit", 2],
                    ["pyromania", 1]
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
                    ["life on hit", 4],
                    ["telescoping handle", 2],
                    ["stinging", 4]
                ]
            },
            "wood nymph" : {
                "items": [["weapon", "cardboard sword"]],
                "skills": ["basic melee"],
                "sourceCards": [
                    ["small stature", 1],
                    ["nimble", 1],
                    ["compression shorts", 3],
                    ["life on hit", 2],
                    ["hobbit foot", 1],
                ]
            },
            "bat" : {
                "items": [["weapon", "cardboard sword"], ["armor", "batsuit"]],
                "skills": ["quick hit", "basic melee"],
                "sourceCards": [
                    ["proto-bat", 1],
                    ["nimble", 1],
                    ["bloodsucker", 1],
                    ["life on hit", 1],
                    ["clawed", 1],
                    ["good circulation", 1],
                ]
            },
            "ent" : {
                "items": [["weapon", "cardboard sword"], ["armor", "conquistador helm"], ["armor", "leatherplate armor"], ["armor", "arcane boots"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["strong back", 2],
                    ["thwomping", 2],
                    ["forest spirit", 1],
                    ["hobbit foot", 1],
                ]
            },
            "elf" : {
                "items": [["weapon", "composite bow"], ["armor", "scout leather"], ["armor", "elf boots"], ["armor", "gardening gloves"]],
                "skills": ["poison arrow", "speed shot", "basic range"],
                "sourceCards": [
                    ["dexterous hands", 1],
                    ["proto-elf", 0],
                    ["practiced", 2],
                    ["sharpened", 2],
                    ["clown shoes", 1],
                ]
            },
            "elf king" : {
                "items": [["weapon", "composite bow"], ["armor", "scout leather"], ["armor", "elf boots"]],
                "skills": ["deadly volley", "speed shot", "poison arrow", "basic range"],
                "sourceCards": [
                    ["proto-boss", 0],
                    ["proto-elf", 0],
                    ["dexterous hands", 2],
                    ["practiced", 2],                    
                    ["sharpened", 2],
                    ["forest spirit", 1],
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
                "skills": ["ground smash", "exploding strike", "super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["ignited", 1],
                    ["flame ritual", 1],
                ],
            },
            "ice golem" : {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["frosted", 1],
                    ["frost ritual", 1],
                ],
            },
            "shock golem" : {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["charged", 1],
                    ["shock ritual", 1]
                ],
            },
            "toxic golem" : {
                "items": [["weapon", "long sword"]],
                "skills": ["poison spray"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["plague ritual", 1],
                    ["putrefied", 1],
                ],
            },
            "gnome" : {
                "items": [["weapon", "long sword"]],
                "skills": ["lightning slash", "quick hit", "basic melee"],
                "sourceCards": [
                    ["small stature", 1],
                    ["keen wit", 1],
                    ["conductive suit", 1],
                    ["shock ritual", 1]
                ],
            },
            "gnome electrician" : {
                "items": [["weapon", "simple wand"], ["armor", "velvet tunic"]],
                "skills": ["lightning ball", "nova", "basic spell"],
                "sourceCards": [
                    ["small stature", 1],
                    ["keen wit", 1],
                    ["electrified", 1],
                    ["healing charm", 3],
                    ["blood pact", 3],
                    ["conductive suit", 1],
                    ["shock ritual", 1],
                    ["rubber boots", 1]
                
                ],
            },
            "roflcopter" : {
                "items": [["weapon", "hand axe"]],
                "skills": ["pressure wave", "quick hit", "basic melee"],
                "sourceCards": [
                    ["flying", 1],
                    ["nimble", 1],
                    ["proto-rofl", 1],
                    ["clown shoes", 1],
                    ["happy feet", 1],
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
                    ["jet pack", 1],
                    ["flame ritual", 1],
                    ["roller skates", 1],
                    
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
                    ["steam powered", 1],
                    ["frost ritual", 1],
                    ["roller skates", 1]
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
                    ["steam powered", 1],
                    ["conductive suit", 1],
                    ["shock ritual", 1],
                    ["roller skates", 1]
                ],
            },
            "sir mechs-a-lot" : {
                "items": [["weapon", "long sword"]],
                "skills": ["ground smash", "lightning ball", "ice nova", "basic melee"],
                "sourceCards": [
                    ["proto-boss", 1],
                    ["riveted", 1],
                    ["clockwork", 1],
                    ["mecha heart", 1],
                    ["charged", 1],
                    ["steam powered", 4],
                    ["frosted", 1],
                    ["ignited", 1],
                    ["shock ritual", 1],
                    ["roller skates", 1]
                ],
            },
            "goblin" : {
                "items": [["weapon", "spikey mace"], ["armor", "goblin leather"]],
                "skills": ["ground smash", "flaming debris", "basic melee"],
                "sourceCards": [
                    ["goblin toe", 1],
                    ["berserking", 1],
                    ["simple minded", 1],
                    ["armor plating", 1],
                    ["knee pads", 1]                    
                ],
            },
            "goblin priest" : {
                "items": [["weapon", "knobby wand"], ["armor", "goblin leather"]],
                "skills": ["fire ball", "incinerate", "basic spell"],
                "sourceCards": [
                    ["goblin toe", 1],
                    ["berserking", 1],
                    ["simple minded", 1],
                    ["pyromania", 1],
                    ["hot blooded", 1],
                    ["flame ritual", 1]
                ],
            },
            "goblin artillery" : {
                "items": [["weapon", "crossbow"], ["armor", "goblin leather"], ["armor", "conquistador helm"]],
                "skills": ["blast arrow", "fire arrow", "basic range"],
                "sourceCards": [
                    ["goblin toe", 1],
                    ["berserking", 1],
                    ["simple minded", 1],
                    ["ignited", 2],
                    ["hot blooded", 1]
                ],
            },
            "flame dragon" : {
                "items": [["weapon", "dragonstone wand"], ["armor", "fancy gauntlets"], ["armor", "iron chestplate"], ["armor", "buckaneer boots"], ["armor", "handmail"]],
                "skills": ["fire ball", "incinerate", "basic spell"],
                "sourceCards": [
                    ["ignited", 3],
                    ["proto-boss", 1],
                    ["pyromania", 2],
                    ["keen wit", 3],
                    ["brain juice", 3],
                    ["mana on hit", 3],
                    ["telescoping handle", 3],
                    ["hot blooded", 1],
                    ["flame ritual", 1],
                    ["increased radius", 1],
                ],
            },
            
            "zombie" : {
                "items": [["weapon", "long sword"], ["armor", "gladiator helm"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["poison slash", "basic melee"],
                "sourceCards": [
                    ["unwashed hands", 1],
                    ["shambling", 1],
                    ["simple minded", 1],
                    ["knee pads", 1],
                    ["hazmat boots", 1],
                ],
            },
            "angry imp" : {
                "items": [["weapon", "long sword"], ["armor", "gladiator helm"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["poison slash", "quick hit", "basic melee"],
                "sourceCards": [
                    ["berserking", 1],
                    ["small stature", 1],
                    ["simple minded", 1],
                    ["indigenous toxins", 1],
                    ["antibiotics", 1],
                    ["happy feet", 1]
                ],
            },
            "dart imp" : {
                "items": [["weapon", "hand crossbow"], ["armor", "plague doctor"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["poison arrow", "speed shot", "basic range"],
                "sourceCards": [
                    ["berserking", 1],
                    ["small stature", 1],
                    ["simple minded", 1],
                    ["indigenous toxins", 1],
                    ["putrefied", 1],
                    ["more projectiles", 1],
                    ["antibiotics", 1],
                    ["plague ritual", 1],
                ],
            },
            "imp shaman": {
                "items": [["weapon", "star wand"], ["armor", "plague doctor"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["poison ball", "poison spray", "poison nova", "basic spell"],
                "sourceCards": [
                    ["berserking", 1],
                    ["small stature", 1],
                    ["simple minded", 1],
                    ["indigenous toxins", 1],
                    ["antibiotics", 1],
                    ["plague ritual", 1],
                    ["potion holster", 1],
                    ["increased radius", 1]
                ],
            },
            "marshwalker": {
                "items": [["weapon", "long sword"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["poison slash", "poison nova", "basic melee"],
                "sourceCards": [
                    ["indigenous toxins", 1],
                    ["swamp armor", 1],
                    ["good circulation", 1],
                    ["happy feet", 1],
                    ["plague ritual", 1],
                    ["hazmat boots", 1],
                    ["potion holster", 1],
                    ["hobbit foot", 1],
                    ["reduced radius", 1],
                    ["putrefied", 1],
                ],
            },
            "mad ape": {
                "items": [["weapon", "long sword"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["big", 1],
                    ["berserking", 1],
                    ["buff", 1],
                    ["clown shoes", 1],
                    ["happy feet", 1],
                    ["good circulation", 1],
                    ["potion holster", 1],
                ],
            },
            "scalp collector": {
                "items": [["weapon", "composite bow"], ["armor", "plague doctor"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["headshot", "basic range"],
                "sourceCards": [
                    ["indigenous toxins", 1],
                    ["putrefied", 1],
                    ["precise", 1],
                    ["vest pockets", 1],
                    ["semi automatic", 1],
                    ["antibiotics", 1],
                    ["bloodsucker", 1],
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
                    ["fleece lining", 1],
                    ["ice spikes", 1]
                ]
            },
            "frost mage": {
                "items": [["weapon", "knobby wand"], ["armor", "gladiator helm"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["ice blast", "ice nova", "ice ball", "basic spell"],
                "sourceCards": [
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["keen wit", 1],
                    ["fur hat", 1],
                    ["cold blooded", 1],
                    ["frost ritual", 1]
                ],
            },
            "frozen warrior": {
                "items": [["weapon", "long sword"], ["armor", "gladiator helm"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["ice slash", "basic melee"],
                "sourceCards": [
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["chinchilla lining", 1],
                    ["ice plating", 1],
                    ["good circulation", 1],
                    ["frost ritual", 1]
                ],
            },
            "yeti": {
                "items": [["weapon", "long sword"], ["armor", "gladiator helm"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["big", 1],
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["chinchilla lining", 1],
                    ["clawed", 1],
                    ["yeti fur", 1],
                    ["cold blooded", 1],
                    ["happy feet", 1],
                    ["good circulation", 1],
                    ["hobbit foot", 1],
                    ["prismatic toe ring", 1]
                ],
            },
            "wight": {
                "items": [["weapon", "long sword"], ["armor", "gladiator helm"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["ice blast", "ice nova", "ice ball", "basic melee"],
                "sourceCards": [
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["fur hat", 1],
                    ["ethereal", 1],
                    ["shadow walker", 1],
                    ["mind expansion", 1],
                    ["frost ritual", 1]
                ],
            },
            "walter wight": {
                "items": [["weapon", "star wand"], ["armor", "gladiator helm"], ["armor", "iron chestplate"], ["armor", "leather boots"], ["armor", "handmail"]],
                "skills": ["ice blast", "ice nova", "ice ball", "basic spell"],
                "sourceCards": [
                    ["proto-boss", 0],
                    ["fleece lining", 1],
                    ["frosted", 1],
                    ["blue ice", 3],
                    ["fur hat", 1],
                    ["ethereal", 1],
                    ["shadow walker", 1],
                    ["keen wit", 4],
                    ["mana on hit", 3],
                    ["frost ritual", 1],
                    ["prismatic toe ring", 1],
                    ["increased radius", 1]
                ],
            },
            "shadow knight": {
                "items": [["weapon", "long sword"], ["armor", "apollo helmet"], ["armor", "polished gauntlets"], ["armor", "shadow armor"], ["armor", "buckaneer boots"]],
                "skills": ["masterful strike", "basic melee", "shadow dagger"],
                "sourceCards": [
                    ["shadow walker", 1],
                    ["full plating", 1],
                    ["sharpened", 1],
                    ["hateful blade", 1],
                    ["ethereal", 1],
                    ["armor plating", 1],
                    ["steel toed", 1],
                    ["good circulation", 1],
                    ["prismatic toe ring", 1],
                ],
            },
            "ghoul": {
                "items": [["weapon", "long sword"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["shambling", 1],
                    ["simple minded", 1],
                    ["bloodsucker", 1],
                    ["careful aim", 1]
                ],
            },
            "vampire": {
                "items": [["weapon", "demon wand"], ["armor", "apollo helmet"], ["armor", "polished gauntlets"], ["armor", "shadow armor"], ["armor",  "buckaneer boots"]],
                "skills": ["health suck", "basic spell"],
                "sourceCards": [
                    ["vampyric touch", 1],
                    ["vampyric embrace", 1],
                    ["bloodsucker", 1],
                    ["soulsucker", 1],
                    ["shadow walker", 1],
                    ["flying", 1],
                    ["mind expansion", 1],
                    ["practiced", 1],
                    ["bloodfingers", 1]
                ],
            },
            "living statue": {
                "items": [["weapon", "long sword"], ["armor", "apollo helmet"], ["armor", "polished gauntlets"], ["armor", "shadow armor"], ["armor",  "buckaneer boots"]],
                "skills": ["super smash", "basic melee"],
                "sourceCards": [
                    ["heart of granite", 1],
                    ["simple minded", 1],
                    ["alabaster", 1],
                ],
            },
            "gargoyle": {
                "items": [["weapon", "long sword"], ["armor", "apollo helmet"], ["armor", "polished gauntlets"], ["armor", "shadow armor"], ["armor",  "buckaneer boots"]],
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
                "items": [["weapon", "long sword"], ["armor", "apollo helmet"], ["armor", "polished gauntlets"], ["armor", "shadow armor"], ["armor",  "buckaneer boots"]],
                "skills": ["splashing hit", "super smash", "basic melee"],
                "sourceCards": [
                    ["simple minded", 1],
                    ["big", 1],
                    ["buff", 1],
                    ["hobbit foot", 1],
                    ["good circulation", 1],
                    ["potion holster", 1],
                    ["happy feet", 1],
                ],
            },
            "wraith": {
                "items": [["weapon", "long sword"], ["armor", "apollo helmet"], ["armor", "polished gauntlets"], ["armor", "shadow armor"], ["armor",  "buckaneer boots"]],
                "skills": ["ice slash", "basic melee"],
                "sourceCards": [
                    ["berserking", 1],
                    ["flying", 1],
                    ["ethereal", 1],
                ],
            },
        },
        "zoneOrder": {
            "order": ["spooky dungeon", "dark forest", "clockwork ruins", "aggro crag", "hostile marsh", "icy tunnel", "gothic castle", "spookier dungeon", "darker forest", "clockworkier ruins", "even-more-aggro crag", "even-more-hostile marsh", "really icy tunnel", "gothicker castle", "spookiest dungeon", "darkest forest", "clockworkiest ruins", "overly aggro crag", "excessively hostile marsh", "iciest tunnel", "gothickest castle", "hordecave"] 
        },
        "zone": {
            "spooky dungeon": {
                "choices": ["skeleton", "skeleton archer", "skeleton mage", "fire skeleton", "skeleton embermage"],
                "weights": [20, 10, 5, 5, 3],
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
                "quantity": [4,2,4],
                "level": 20,
            },
            "icy tunnel": {
                "choices": ["frost skeleton", "ice golem", "frost mage", "frozen warrior", "yeti", "wight", "frow djinn"],
                "weights": [20, 10, 10, 10 ,10, 0],
                "boss": "walter wight",
                "roomCount": 20,
                "quantity": [2,3,4],
                "level": 25,
            },
            "gothic castle": {
                "choices": ["shadow knight", "ghoul", "vampire", "living statue", "gargoyle", "minotaur", "wraith"],
                "weights": [20, 10, 10, 10, 10, 10, 10],
                "boss": "shadow knight",
                "roomCount": 20,
                "quantity": [3,3,6],
                "level": 30,
            },
            "spookier dungeon": {
                "choices": ["skeleton", "skeleton archer", "skeleton mage", "fire skeleton", "skeleton embermage"],
                "weights": [20, 10, 5, 5, 3],
                "boss": "skeleton king",
                "roomCount": 20,
                "quantity": [5, 5, 20],
                "level": 35
            },
            "darker forest": {
                "choices": ["wood nymph", "bat", "elf", "ent", "dahd djinn"],
                "weights": [20, 15, 15, 5],
                "boss": "elf king",
                "roomCount": 20,
                "quantity": [5, 5, 20],
                "level": 40,
            },
            "clockworkier ruins": {
                "choices": ["gnome", "gnome electrician", "roflcopter", "harpy", "mechcinerator", "mechfridgerator", "mecha watt", "ser djinn"],
                "weights": [20, 10, 10, 10, 5, 5, 5, 0],
                "boss": "sir mechs-a-lot",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 45,
            },
            "even-more-aggro crag": {
                "choices": ["goblin", "goblin priest", "goblin artillery", "fire skeleton", "fire golem", "kei djinn"],
                "weights": [20, 10, 10, 10, 10, 0],
                "boss":"flame dragon",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 50,
            },
            "even-more-hostile marsh": {
                "choices": ["zombie", "angry imp", "dart imp", "imp shaman", "marshwalker", "mad ape", "al-err djinn", "scalp collector", "toxic golem"],
                "weights": [20, 10, 10, 10, 10, 10, 0, 10 ,10],
                "boss":"scalp collector",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 55,
            },
            "really icy tunnel": {
                "choices": ["frost skeleton", "ice golem", "frost mage", "frozen warrior", "yeti", "wight", "frow djinn"],
                "weights": [20, 10, 10, 10 ,10, 0],
                "boss": "walter wight",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 60,
            },
            "gothicker castle": {
                "choices": ["shadow knight", "ghoul", "vampire", "living statue", "gargoyle", "minotaur", "wraith"],
                "weights": [20, 10, 10, 10, 10, 10, 10],
                "boss": "shadow knight",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 65,
            },
            "spookiest dungeon": {
                "choices": ["skeleton", "skeleton archer", "skeleton mage", "fire skeleton", "skeleton embermage"],
                "weights": [20, 10, 5, 5, 3],
                "boss": "skeleton king",
                "roomCount": 20,
                "quantity": [5, 5, 20],
                "level": 70,
            },
            "darkest forest": {
                "choices": ["wood nymph", "bat", "elf", "ent", "dahd djinn"],
                "weights": [20, 15, 15, 5],
                "boss": "elf king",
                "roomCount": 20,
                "quantity": [5, 5, 20],
                "level": 75,
            },
            "clockworkiest ruins": {
                "choices": ["gnome", "gnome electrician", "roflcopter", "harpy", "mechcinerator", "mechfridgerator", "mecha watt", "ser djinn"],
                "weights": [20, 10, 10, 10, 5, 5, 5, 0],
                "boss": "sir mechs-a-lot",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 80,
            },
            "overly aggro crag": {
                "choices": ["goblin", "goblin priest", "goblin artillery", "fire skeleton", "fire golem", "kei djinn"],
                "weights": [20, 10, 10, 10, 10, 0],
                "boss":"flame dragon",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 85,
            },
            "excessively hostile marsh": {
                "choices": ["zombie", "angry imp", "dart imp", "imp shaman", "marshwalker", "mad ape", "al-err djinn", "scalp collector", "toxic golem"],
                "weights": [20, 10, 10, 10, 10, 10, 0, 10 ,10],
                "boss":"scalp collector",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 90,
            },
            "iciest tunnel": {
                "choices": ["frost skeleton", "ice golem", "frost mage", "frozen warrior", "yeti", "wight", "frow djinn"],
                "weights": [20, 10, 10, 10 ,10, 0],
                "boss": "walter wight",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 95,
            },
            "gothickest castle": {
                "choices": ["shadow knight", "ghoul", "vampire", "living statue", "gargoyle", "minotaur", "wraith"],
                "weights": [20, 10, 10, 10, 10, 10, 10],
                "boss": "shadow knight",
                "roomCount": 20,
                "quantity": [5,5,20],
                "level": 99,
            },
            "hordecave": {
                "choices": ["vampire", "shadow knight"],
                "weights": [1,1],
                "boss": "bat",
                "roomCount": 20,
                "quantity": [20, 500, 5000],
                "level": 99
            },
            "demonic laboroatory": {
                "choices": ["stitchling", "mad scientist", "minotaur", "blood golem"],
                "weights": [20, 10, 10],
                "boss": "pigbearman",
                "roomCount": 20,
                "quantity": [2,3,4],
                "level": 35,
            },
            "scarred plains": {
                "choices": ["troll", "cyclops", "harpy", "bandit", "giant", "frost giant"],
                "weights": [20, 10, 10],
                "boss": "pigbearman",
                "roomCount": 20,
                "quantity": [3,3,6],
                "level": 40,
            },
            
            "dojo": {
                "choices": ["fire golem"],
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
            "aoeRadius": "AOE Radius",
            "aoeSpeed": "AOE Speed",
            "angle": "Angle",
            "projRange": "Projectile Range",
            "projRadius": "Projectile Radius",
            "projSpeed": "Projectile Speed",
            "projCount": "Additional Projectiles"
        }

    };

    /*
      fudge: a = 1
      fwah: a = 3
      sherbet: a = 2

      asdf: [fudge(2), sherbet(3)]

      fdsa: [fwah(5)]

      buh: [asdf(1), fdsa(4)]

      [asdf, fudge, sherbet, fdsa, fwah]
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
            throw('fudge');
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
