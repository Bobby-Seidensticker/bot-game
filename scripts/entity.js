namespace.module('bot.entity', function (exports, require) {

    var TEAM_HERO = 0;
    var TEAM_MONSTER = 1;

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var vector = namespace.bot.vector;
    var inventory = namespace.bot.inv;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;
    var prob = namespace.bot.prob;

    var attrKeys = ['strength', 'vitality', 'wisdom', 'dexterity',];
    var defKeys = ['maxHp', 'maxMana', 'armor', 'dodge', 'eleResistAll',];
    var eleResistKeys = ['fireResist', 'coldResist', 'lightResist', 'poisResist'];
    var dmgKeys = ['physDmg', 'lightDmg', 'coldDmg', 'fireDmg', 'poisDmg', 'range', 'speed'];

    var EntitySpec = window.Model.extend({
        initialize: function() {
            this.level = 1;
            this.mods = [];
            this.xp = 0;
        },

        computeAttrs: function() {
            var all = {};

            all.attr = utils.newBaseStatsDict(attrKeys);
            all.def = utils.newBaseStatsDict(defKeys);
            all.eleResist = utils.newBaseStatsDict(eleResistKeys);

            all.dmg = utils.newDmgStatsDict();

            utils.addAllCards(all, this.getCards());
            // Now 'all' has the expanded trie structured mod data
            // Do final multiplication and put on the entity

            // factor this out
            _.each(attrKeys, function(stat) {
                this[stat] = (all.attr[stat].added) * all.attr[stat].more;
            }, this);
            all.def.maxHp.added += this.vitality * 2;
            if (this.team === TEAM_HERO) {
                all.def.maxHp.added += this.vitality * 200;
            }
            all.def.maxMana.added += this.wisdom * 2;
            all.def.armor.added += this.strength * 0.5;
            all.def.dodge.added += this.dexterity * 0.5;
            all.def.eleResistAll.added = 1;
            all.def.eleResistAll.more *= Math.pow(0.997, this.wisdom); //temp var only

            _.each(defKeys, function(stat) {
                this[stat] = (all.def[stat].added) * all.def[stat].more;
            }, this);

            // note that eleResistAll is on the def keys because of the ordering
            // added must be one, this is janky
            all.eleResist.lightResist.added = 1;
            all.eleResist.coldResist.added = 1;
            all.eleResist.fireResist.added = 1;
            all.eleResist.poisResist.added = 1;

            all.eleResist.lightResist.more *= all.def.eleResistAll.more;
            all.eleResist.coldResist.more *= all.def.eleResistAll.more;
            all.eleResist.fireResist.more *= all.def.eleResistAll.more;
            all.eleResist.poisResist.more *= all.def.eleResistAll.more;

            _.each(eleResistKeys, function(stat) {
                this[stat] = (all.eleResist[stat].added) * all.eleResist[stat].more;
            }, this);

            // Damage is left uncombined, handled in skills

            this.baseDmg = all.dmg;
            if (this.team === TEAM_HERO) {
                this.baseDmg.physDmg.more *= 2;
            }
            this.computeSkillAttrs();

            this.nextLevelXp = this.getNextLevelXp();
        },

        computeSkillAttrs: function() {
            this.skillchain.computeAttrs(this.baseDmg, dmgKeys);
        },

        getCards: function() {
            return [
                {mods: [
                    {def: 'strength added 10', type: 'attr'},
                    {def: 'dexterity added 10', type: 'attr'},
                    {def: 'wisdom added 10', type: 'attr'},
                    {def: 'vitality added 10', type: 'attr'},
                    {def: 'maxHp added 10 perLevel', type: 'def'},
                    {def: 'maxMana added 5 perLevel', type: 'def'},
                ], level: this.level}
            ];
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
        initialize: function(name, skillchain, inv, equipped) {
            this.name = name;
            this.skillchain = skillchain;
            this.inv = inv;
            this.equipped = equipped;

            EntitySpec.prototype.initialize.call(this);
            this.team = TEAM_HERO;

            log.info('HeroSpec initialize');
            this.nextAction = window.time;
            this.computeAttrs();

            // TODO, should be listening to window.ItemEvents
            // this.listenTo(window.ItemEvents, 'equipSuccess', this.computeAttrs);
            //this.listenTo(this.inv, 'equipClick', this.equipClick);
            this.listenTo(this.equipped, 'change', this.computeAttrs);
            this.listenTo(this.skillchain, 'change', this.computeSkillAttrs);
        },

        getCards: function() {
            var cards = EntitySpec.prototype.getCards.call(this);
            return cards.concat(this.equipped.getCards());
        },

        applyXp: function(xp) {
            // TODO needs to do this to the skillchain as well
            this.equipped.applyXp(xp);
            this.xp += xp;
            while (this.xp >= this.nextLevelXp) {
                this.level += 1;
                this.xp -= this.nextLevelXp;
                this.nextLevelXp = this.getNextLevelXp();
            }
        },

        /*
        equipClick: function(item) {
            var itemType = item.itemType;
            if (itemType === 'armor') {
                this.equipped.equip(item, item.type);
            } else if (itemType === 'weapon') {
                this.equipped.equip(item, 'mainHand');
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

            this.cards = _.map(this.items, function(item) { return utils.expandSourceItem(item[0], item[1], this.level, item[2]);}, this);

            this.cards = this.cards.concat(utils.expandSourceCards(this.sourceCards));

            this.skillchain = new inventory.Skillchain();
            for (var i = 0; i < this.skills.length; i++) {
                this.skillchain.equip(new inventory.SkillModel(this.skills[i]), i);
            }

            this.computeAttrs();
        },

        getCards: function() {
            return this.cards.concat(EntitySpec.prototype.getCards.call(this));
        },

        getDrops: function() {
            var drops = [];
            if (Math.random() < 0.03) {
                var cards = _.filter(this.sourceCards, function(card) { if (card[0].slice(0, 5) !== 'proto') { return true; }});
                if (cards.length) {
                    drops.push(cards[prob.pyRand(0, cards.length)]);
                }
            }
            if (Math.random() < 0.001) {
                if (this.items.length) {
                    drops.push(this.items[prob.pyRand(0, this.items.length)]);
                }
            }
            if (Math.random() < 0.001) {
                if (this.skills.length) {
                    drops.push(this.skills[prob.pyRand(0, this.skills.length)]);
                }
            }
            if (drops.length > 0) {
                log.info('%s is dropping %s', this.name, JSON.stringify(drops));
            }
            return drops;

            

            //  Monster uses internal model to roll one or more drops, returns array of drops
            // string items in array are materials, objects are full items
            /*
              var drops = [];
              var dropRef = this.drops;
              //console.log(dropRef);

              var matCount = prob.pProb(1,10);
              if (matCount > 0) {
              var drop = matCount + " " + dropRef[prob.pyRand(0, dropRef.length)];
              drops.push(drop);
              }

              //var recipeDropChance = 0.05;
              
              //   if(prob.binProb(recipeDropChance)) {
              //  drops.push(this.getRandItem());
              //   }

              log.info(this.name + ' dropped: ' + JSON.stringify(drops));
              return drops;*/
        },

        getRandItem: function() {
            // TODO major overhaul
            /*
            // helper function for getDrops
            //selects a random weapon, armor or skill
            //console.log('HERERERE');
            var ref = namespace.bot.itemref.ref;
            var weapcount = Object.keys(ref.weapon).length;
            var armorcount = Object.keys(ref.armor).length;
            var skillcount = Object.keys(ref.skill).length;
            var allcount = weapcount + armorcount + skillcount;

            //console.log(prob);
            var roll = prob.pyRand(0, allcount);

            var newItem;
            
            if (roll < weapcount) {
            newItem =  new inventory.WeaponModel({'name': Object.keys(ref.weapon)[roll]});
            } else if (roll < weapcount + armorcount) {
            newItem =  new inventory.ArmorModel({'name': Object.keys(ref.armor)[roll - weapcount]});
            } else if (roll < weapcount + armorcount + skillcount) {
            newItem = new inventory.SkillModel({'name': Object.keys(ref.skill)[roll - weapcount - armorcount]});
            } else {
            log.warning("wtf: dropRand rolled higher number than it should have");
            }

            //janky recursive way of escaping invalid items - potentially infinite
            if (newItem.get('craftCost')) {
            return newItem;
            } else {
            return this.getRandItem();
            }
            //console.log(ref, weapcount);
            */
        }
    });

    function newHeroSpec(inv) {
        // stopgap measures: basic equipped stuff
        var heroName = 'bobbeh';
        var equipped = new inventory.EquippedGearModel();
        // this needs to change, don't have find where anymore
        equipped.equip(_.findWhere(inv.models, {name: 'cardboard sword'}), 'mainHand');
        equipped.equip(_.findWhere(inv.models, {name: 'balsa helmet'}), 'head');

        var skillchain = new inventory.Skillchain()
        skillchain.equip(_.findWhere(inv.models, {name: 'basic melee'}), 0);

        var hero = new HeroSpec(heroName, skillchain, inv, equipped);

        return hero;
    }

    exports.extend({
        newHeroSpec: newHeroSpec,
        MonsterSpec: MonsterSpec,
        attrKeys: attrKeys,
        defKeys: defKeys,
        eleResistKeys: eleResistKeys,
        dmgKeys: dmgKeys
    });

});
