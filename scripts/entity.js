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
    var dmgKeys = [
        'meleeDmg', 'rangeDmg', 'spellDmg',
        'physDmg', 'lightDmg', 'coldDmg', 'fireDmg', 'poisDmg', 'hpOnHit', 'hpLeech',
        'manaOnHit', 'manaLeech', 'cooldownTime', 'range', 'speed', 'manaCost'];
    var actualDmgKeys = ['physDmg', 'lightDmg', 'coldDmg', 'fireDmg', 'poisDmg'];

    var EntitySpec = gl.Model.extend({
        initialize: function() {
            this.level = 1;
            this.xp = 0;
        },

        computeAttrs: function() {
            log.error('compute attrs');

            if(this.team === TEAM_HERO) {
                this.weaponType = 'melee'
                if (this.team === TEAM_HERO && this.equipped.weapon) {
                    this.weaponType = this.equipped.weapon.type
                }
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
            log.info('entity computeSkillAttrs');
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
                {def: 'dexterity gainedas 200 dodge', type: 'def'},

                {def: 'moveSpeed added 300', type: 'def'},

                {def: 'height added 100000', type: 'vis'},
                {def: 'width added 30000', type: 'vis'},
                {def: 'lineWidth added 3000', type: 'vis'},
                
                //TODO - add str/dex/wis attacktype bonuses here once impemented
                //{def: 'strength gainedas 1 meleeDmg', type: 'dmg'},
                //{def: 'dexterity gainedas 1 rangeDmg', type: 'dmg'},
                //{def: 'wisdom gainedas 1 spellDmg', type: 'dmg'},                
                
                {def: 'eleResistAll added 1', type: 'def'},

                {def: 'maxHp added 20 perLevel', type: 'def'},
                {def: 'maxMana added 5 perLevel', type: 'def'},

                {def: 'maxMana gainedas 2 manaRegen', type: 'def'}
            ];
            return _.map(mods, function(mod) { return utils.applyPerLevel(mod, this.level); }, this);
        },

        getNextLevelXp: function() {
            return Math.floor(100 * Math.exp((this.level - 1) / Math.PI));
        },

        // TODO: memoize this
        xpOnKill: function() {
            return Math.ceil(10 * Math.pow(1.15, this.level - 1));
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
        },

        /*
        equipClick: function(item) {
            var itemType = item.itemType;
            if (itemType === 'armor') {
                this.equipped.equip(item, item.type);
            } else if (itemType === 'weapon') {
                this.equipped.equip(item, 'weapon');
            } else if (itemType === 'skill') {
                this.skillchain.add(item);
            }
        },*/
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

            this.mods = _.map(this.items, function(item) { return utils.expandSourceItem(item[0], item[1], this.level, item[2]); }, this);
            this.mods = _.flatten(this.mods);
            this.mods = this.mods.concat(utils.expandSourceCards(this.sourceCards));

            this.weaponType = 'melee'
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i][0] === 'weapon') {
                    this.weaponType = this.items[i][1];
                    break;
                }
            }

            this.droppableCards = _.filter(this.sourceCards, function(card) { return card[0].slice(0, 5) !== 'proto'; }, this);

            this.skillchain = new inventory.Skillchain();
            _.each(this.skills, function(skill, i) {
                var skill = new inventory.SkillModel(skill);
                skill.level = this.level;
                this.skillchain.equip(skill, i);
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
                    cardDrops.push(
                        dropLib.dropFactory('card', this.droppableCards[prob.pyRand(0, this.droppableCards.length)])
                    );
                    any = true;
                }
            }
            if (Math.random() < 1) { // 0.001 * 50) {
                if (this.items.length) {
                    gearDrops.push(
                        dropLib.dropFactory('item', this.items[prob.pyRand(0, this.items.length)])
                    );
                    any = true;
                }
            }
            if (Math.random() < 1) { // 0.001 * 50) {
                if (this.skills.length) {
                    gearDrops.push(
                        dropLib.dropFactory('skill', this.skills[prob.pyRand(0, this.skills.length)])
                    );
                    any = true;
                }
            }
            return {cardDrops: cardDrops, gearDrops: gearDrops, any: any};
        }
    });

    function newHeroSpec(inv, cardInv) {
        // stopgap measures: basic equipped stuff
        var heroName = 'bobbeh';
        var equipped = new inventory.EquippedGearModel();
        equipped.equip(_.findWhere(inv.models, {name: 'cardboard sword'}), 'weapon');
        equipped.equip(_.findWhere(inv.models, {name: 'balsa helmet'}), 'head');

        var skillchain = new inventory.Skillchain()
        skillchain.equip(_.findWhere(inv.models, {name: 'basic melee'}), 0);

        var hero = new HeroSpec(heroName, skillchain, inv, equipped, cardInv);

        return hero;
    }

    exports.extend({
        newHeroSpec: newHeroSpec,
        MonsterSpec: MonsterSpec,
        defKeys: defKeys,
        eleResistKeys: eleResistKeys,
        dmgKeys: dmgKeys,
        actualDmgKeys: actualDmgKeys
    });

});
