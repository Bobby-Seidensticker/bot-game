namespace.module('bot.entity', function (exports, require) {

    var TEAM_HERO = 0;
    var TEAM_MONSTER = 1;

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var inventory = namespace.bot.inv;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;
    var prob = namespace.bot.prob;
    var dropLib = namespace.bot.drops;

    var defKeys = ['strength', 'vitality', 'wisdom', 'dexterity', 'maxHp', 'maxMana', 'armor',
                   'dodge', 'eleResistAll', 'hpRegen', 'manaRegen', 'moveSpeed'];
    var eleResistKeys = ['fireResist', 'coldResist', 'lightResist', 'poisResist'];
    var visKeys = ['height', 'width', 'lineWidth'];
    var dmgKeys = ['meleeDmg', 'rangeDmg', 'spellDmg',
                   'physDmg', 'lightDmg', 'coldDmg', 'fireDmg', 'poisDmg',
                   'hpOnHit', 'hpLeech', 'manaOnHit', 'manaLeech',
                   'speed', 'cooldownTime', 'accuracy',
                   'range', 'projRange', 'projRadius', 'aoeRadius', 'manaCost', 'projCount',
                   'angle', 'projSpeed', 'aoeSpeed'];
    var actualDmgKeys = ['physDmg', 'lightDmg', 'coldDmg', 'fireDmg', 'poisDmg'];

    var attackSpecKeys = [//'meleeDmg', 'rangeDmg', 'spellDmg',
        'physDmg', 'lightDmg', 'coldDmg', 'fireDmg', 'poisDmg',
        'hpOnHit', 'hpLeech', 'manaOnHit', 'manaLeech',
        // 'cooldownTime', 'manaCost',
        'speed', 'range', 'projRange', 'projRadius', 'aoeRadius', 'projCount', 'accuracy',
        'angle', 'projSpeed', 'aoeSpeed'];
    var attackSpecDmgKeys = ['physDmg', 'lightDmg', 'coldDmg', 'fireDmg', 'poisDmg', 'hpLeech', 'manaLeech'];

    var EntitySpec = gl.Model.extend({
        initialize: function() {
            this.level = 1;
            this.xp = 0;
        },

        computeAttrs: function() {
            log.info('compute attrs on: %s', this.name);

            if (this.team === TEAM_HERO) {
                this.weaponType = this.equipped.weapon === undefined ? 'melee' : this.equipped.weapon.weaponType;
            }
            var all = {};

            all.def = utils.newBaseStatsDict(defKeys);
            all.eleResist = utils.newBaseStatsDict(eleResistKeys);
            all.dmg = utils.newBaseStatsDict(dmgKeys); // utils.newDmgStatsDict();
            all.vis = utils.newBaseStatsDict(visKeys);
            
            utils.addAllMods(all, this.getMods());
            // Now 'all' has the expanded trie structured mod data
            // Do final multiplication and put on the entity

            _.each(defKeys, function(stat) {
                this[stat] = utils.computeStat(all.def, stat);
            }, this);

            //janky - can't gainedas across keys in all so, putting that stuff here.
            all.dmg.accuracy.added += this.dexterity * 2;
            all.dmg.meleeDmg.more *= 1 + (this.strength * 0.001);
            all.dmg.rangeDmg.more *= 1 + (this.dexterity * 0.001);
            all.dmg.spellDmg.more *= 1 + (this.wisdom * 0.001);            
            
            this.eleResistAll *= Math.pow(0.997, this.wisdom);

            // note that eleResistAll is on the def keys because of the ordering
            // added must be one, this is janky
            all.eleResist.lightResist.added = 1;
            all.eleResist.coldResist.added = 1;
            all.eleResist.fireResist.added = 1;
            all.eleResist.poisResist.added = 1;

            all.eleResist.lightResist.more *= this.eleResistAll;
            all.eleResist.coldResist.more *= this.eleResistAll;
            all.eleResist.fireResist.more *= this.eleResistAll;
            all.eleResist.poisResist.more *= this.eleResistAll;

            _.each(eleResistKeys, function(stat) {
                this[stat] = utils.computeStat(all.eleResist, stat);
            }, this);

            _.each(visKeys, function(stat) {
                this[stat] = utils.computeStat(all.vis, stat);
            }, this);
            
            // Damage is left uncombined, handled in skills

            this.baseDmg = all.dmg;
            this.computeSkillAttrs();

            this.nextLevelXp = this.getNextLevelXp();

            gl.DirtyQueue.mark('computeAttrs');
        },

        computeSkillAttrs: function() {
            log.info('entity computeSkillAttrs, weaponType: %s', this.weaponType);
            this.skillchain.computeAttrs(this.baseDmg, this.weaponType);
        },

        getMods: function() {
            var mods = [
                {def: 'strength added 9', type: 'def'},
                {def: 'strength added 1 perLevel', type: 'def'},
                {def: 'dexterity added 9', type: 'def'},
                {def: 'dexterity added 1 perLevel', type: 'def'},
                {def: 'wisdom added 9', type: 'def'},
                {def: 'wisdom added 1 perLevel', type: 'def'},
                {def: 'vitality added 9', type: 'def'},
                {def: 'vitality added 1 perLevel', type: 'def'},

                {def: 'vitality gainedas 100 maxHp', type: 'def'},
                {def: 'vitality gainedas 25 maxMana', type: 'def'},                
                {def: 'wisdom gainedas 100 maxMana', type: 'def'},

                {def: 'strength gainedas 200 armor', type: 'def'},
                {def: 'dexterity gainedas 300 dodge', type: 'def'},
                //{def: 'dexterity gainedas 200 accuracy', type: 'def'},

                {def: 'moveSpeed added 300', type: 'def'},

                {def: 'height added 100000', type: 'vis'},
                {def: 'width added 30000', type: 'vis'},
                {def: 'lineWidth added 3000', type: 'vis'},
                
                //TODO - add str/dex/wis attacktype bonuses here once impemented
                //{def: 'strength gainedas 1 meleeDmg', type: 'dmg'},
                //{def: 'dexterity gainedas 1 rangeDmg', type: 'dmg'},
                //{def: 'wisdom gainedas 1 spellDmg', type: 'dmg'},                

                {def: 'meleeDmg added 1', type: 'dmg'},
                {def: 'rangeDmg added 1', type: 'dmg'},
                {def: 'spellDmg added 1', type: 'dmg'},                

                
                {def: 'eleResistAll added 1', type: 'def'},

                {def: 'maxHp added 20 perLevel', type: 'def'},
                {def: 'maxMana added 5 perLevel', type: 'def'},
                {def: 'maxHp more 2 perLevel', type:'def'},

                {def: 'maxMana gainedas 2 manaRegen', type: 'def'},

                {def: 'projCount added 1', type: 'dmg'},

                {def: 'angle added 15', type: 'dmg'},
                {def: 'range gainedas 125 projRange', type: 'dmg'},
                //{def: 'rate added 1000', type: 'dmg'},
                {def: 'projSpeed added 1000', type: 'dmg'},
                {def: 'aoeSpeed added 300', type: 'dmg'},
                {def: 'projRadius added 5000', type: 'dmg'},
                {def: 'aoeRadius added 300000', type: 'dmg'},
            ];
            return _.map(mods, function(mod) { return utils.applyPerLevel(mod, this.level); }, this);
        },

        getNextLevelXp: function() {
            return Math.floor(100 * Math.pow(1.3, (this.level - 1)));
        }
    });

    var HeroSpec = EntitySpec.extend({
        initialize: function(name, skillchain, inv, equipped, cardInv) {
            this.name = name;
            this.skillchain = skillchain;
            this.inv = inv;
            this.cardInv = cardInv;
            this.equipped = equipped;

            EntitySpec.prototype.initialize.call(this);
            this.team = TEAM_HERO;

            log.info('HeroSpec initialize');
            this.computeAttrs();

            this.listenTo(this.skillchain, 'change', this.computeSkillAttrs);
            this.listenTo(this.equipped, 'change', this.computeAttrs);
        },

        toJSON: function() {
            return {
                name: this.name,
                level: this.level,
                xp: this.xp
            };
        },

        fromJSON: function(data) {
            _.extend(this, data);
        },

        getMods: function() {
            var mods = EntitySpec.prototype.getMods.call(this);
            return mods.concat(this.equipped.getMods());
        },

        applyXp: function(xp) {
            // TODO needs to do this to the skillchain as well
            gl.DirtyQueue.mark('hero:xp');
            var levels = 0;
            levels += this.equipped.applyXp(xp);
            levels += this.skillchain.applyXp(xp);
            this.xp += xp;
            while (this.xp >= this.nextLevelXp) {
                this.level += 1;
                this.xp -= this.nextLevelXp;
                this.nextLevelXp = this.getNextLevelXp();
                gl.DirtyQueue.mark('hero:levelup');
                levels++;
            }
            if (levels > 0) {
                this.computeAttrs();
            }
            return levels;
        }
    });

    var MonsterSpec = EntitySpec.extend({
        // TODO: fn signature needs to be (name, level)
        initialize: function(name, level) {
            // All you need is a name
            EntitySpec.prototype.initialize.call(this);
            this.team = TEAM_MONSTER;
            this.name = name;
            this.level = level;

            _.extend(this, itemref.expand('monster', this.name));

            this.weaponType = 'melee';
            
            this.mods = _.map(this.items, function(item) {
                var expanded = itemref.expand(item[0], item[1]);
                if (item[0] === "weapon") {
                    this.weaponType = expanded.weaponType;
                }
                return expanded.mods;
            }, this);
            this.mods = _.flatten(this.mods);
            try {
                this.mods = this.mods.concat(utils.expandSourceCards(this.sourceCards, Math.floor(this.level / 10)));
            } catch(e) {
                console.log('asdf');
            }

            this.droppableCards = _.filter(this.sourceCards, function(card) { return card[0].slice(0, 5) !== 'proto'; }, this);
            
            this.skillchain = new inventory.Skillchain();
            _.each(this.skills, function(skill, i) {
                var skill = new inventory.SkillModel(skill);
                skill.level = this.level;
                this.skillchain.equip(skill, i, true);
            }, this);

            this.computeAttrs();
        },

        getMods: function() {
            return this.mods.concat(EntitySpec.prototype.getMods.call(this));
        },

        getDrops: function() {
            var cardDrops = [];
            var gearDrops = [];
            var any = false;
            if (Math.random() < 1) { // 0.03 * 10) {
                if (this.droppableCards.length) {
                    var card = this.droppableCards[prob.pyRand(0, this.droppableCards.length)];
                    card = [card[0], card[1] + Math.floor(this.level / 10)];
                    cardDrops.push(
                        dropLib.dropFactory('card', card)
                    );
                    any = true;
                }
            }
            if (Math.random() < 0.1) { // 0.001 * 50) {
                if (this.items.length) {
                    gearDrops.push(
                        dropLib.dropFactory('item', this.items[prob.pyRand(0, this.items.length)])
                    );
                    any = true;
                }
            }
            if (Math.random() < 0.5) { // 0.001 * 50) {
                if (this.skills.length) {
                    gearDrops.push(
                        dropLib.dropFactory('skill', this.skills[prob.pyRand(0, this.skills.length)])
                    );
                    any = true;
                }
            }
            return {cardDrops: cardDrops, gearDrops: gearDrops, any: any};
        },

        // TODO: memoize this
        xpOnKill: function(playerLevel) {
            var pen = this.xpPenalty(playerLevel, this.level);
            return Math.ceil(pen * 20 * Math.pow(1.18, (this.level - 1)));
        },

        xpPenalty: function(pl, ml) {
            if (pl > ml) {
                return 1;
            }
            var sb = 5 + Math.floor(pl / 16);
            var diff = ml - pl;
            if (diff <= sb) {
                return 1;
            }
            var ed = diff - sb;
            return Math.pow(
                (pl + 5) / (pl + 5 + Math.pow(ed, 2.5)),
                1.5);
        }
    });

    function newHeroSpec(inv, cardInv) {
        // stopgap measures: basic equipped stuff
        var heroName = 'some newbie';
        var equipped = new inventory.EquippedGearModel();
        //equipped.equip(_.findWhere(inv.models, {name: 'cardboard sword'}), 'weapon');
        //equipped.equip(_.findWhere(inv.models, {name: 'balsa helmet'}), 'head');

        var skillchain = new inventory.Skillchain()
        //skillchain.equip(_.findWhere(inv.models, {name: 'basic melee'}), 0);

        var hero = new HeroSpec(heroName, skillchain, inv, equipped, cardInv);

        return hero;
    }

    exports.extend({
        newHeroSpec: newHeroSpec,
        MonsterSpec: MonsterSpec,
        defKeys: defKeys,
        eleResistKeys: eleResistKeys,
        dmgKeys: dmgKeys,
        actualDmgKeys: actualDmgKeys,
        attackSpecKeys: attackSpecKeys,
        attackSpecDmgKeys: attackSpecDmgKeys
    });

});
