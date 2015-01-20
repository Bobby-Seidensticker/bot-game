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
    
    var EntityModel = window.Model.extend({
        initialize: function() {
            this.level = 1;
            this.mods = [];
            this.xp = 0;
        },

        computeAttrs: function() {
            log.debug('Computing Attrs for Entity on team %s', this.teamString());

            var attrKeys = [
                'strength',
                'vitality',
                'wisdom',
                'dexterity',
            ];
            var defKeys = [
                'maxHp',
                'maxMana',
                'armor',
                'dodge',
                'eleResistAll',
            ];
            var eleResistKeys = [
                'fireResist',
                'coldResist',
                'lightResist',
                'poisResist'
            ];
            var dmgKeys = [
                'physDmg',
                'lightDmg',
                'coldDmg',
                'fireDmg',
                'poisDmg',
                'range',
                'speed'
            ];

            var all = {};

            all.attr = utils.newBaseStatsDict(attrKeys);
            all.def = utils.newBaseStatsDict(defKeys);
            all.eleResist = utils.newBaseStatsDict(eleResistKeys);

            all.dmg = utils.newDmgStatsDict();

            var cards = this.equipped.getCards();
            cards = cards.concat(this.getCards());

            utils.addAllCards(all, cards);
            // Now 'all' has the expanded trie structured mod data
            // Do final multiplication and put on the entity

            _.each(attrKeys, function(stat) {
                this[stat] = (all.attr[stat].added) * all.attr[stat].more;
            }, this);

            all.def.maxHp.added += this.vitality * 2;
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

            this.skillchain.computeAttrs(all.dmg, dmgKeys);

            this.nextLevelXp = this.getNextLevelXp();
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

        revive: function() {
            this.hp = this.maxHp;
            this.mana = this.maxMana;
            this.initPos();
        },

        isMonster: function() {
            return this.team === TEAM_MONSTER;
        },

        isHero: function() {
            return this.team === TEAM_HERO;
        },

        teamString: function() {
            if (this.team === TEAM_HERO) {
                return 'Hero';
            }
            return 'Monster';
        },

        isAlive: function() {
            return this.hp > 0;
        },

        takeDamage: function(damage) {
            var physDmg = damage.physDmg;
            var armorReductionMult = physDmg / (physDmg + this.armor);
            physDmg = physDmg * armorReductionMult;

            var lightDmg = damage.lightDmg * this.lightResist;
            var coldDmg = damage.coldDmg * this.coldResist;
            var fireDmg = damage.fireDmg * this.fireResist;
            var poisDmg = damage.poisDmg * this.poisResist;

            var totalDmg = physDmg + fireDmg + coldDmg + lightDmg + poisDmg;
            this.hp -= totalDmg;

            if (this.hp <= 0) {
                if (this.isMonster()) {
                    window.DirtyQueue.mark('monsters:death');
                } else {
                    window.DirtyQueue.mark('hero:death');
                }
                log.info('Lvl %d - %s from team %s DEAD, hit for %s', this.level, this.name, this.teamString(), JSON.stringify(damage));
            } else {
                log.debug('Team %s taking damage, hit for %s, now has %.2f hp', this.teamString(), JSON.stringify(damage), this.hp);
            }
            // modify own health
        },

        attackTarget: function(target, skill) {
            skill.use();
            this.nextAction = skill.speed;
            //log.debug('%s attacking target %s for %s dmg with %s', this.name,
            //          target.name, JSON.stringify(dmg), skill.name);
            target.takeDamage(skill);
            if (!target.isAlive()) {
                if (this.isHero()) {
                    window.DirtyQueue.mark('monsters:death');
                    this.onKill(target, skill);
                } else {
                    target.onDeath();
                }
            }

            this.mana -= skill.manaCost;
        },

        getNextLevelXp: function() {
            return Math.floor(100 * Math.exp((this.level - 1) / Math.PI));
        },

        xpOnKill: function() {
            return Math.ceil(10 * Math.pow(1.15, this.level - 1));
        },

        inRange: function(target) {
            return true;
        },

        getCoords: function() {
            return [this.x, this.y];
        },

        initPos: function() {
            if (this.isHero()) {
                this.x = 0;
                this.y = 500000;
            } else if (this.isMonster()) {
                this.x = 800000 + prob.rand(0, 100000);
                this.y = 500000 + prob.rand(-100000, 100000);
            }
        },

        tryDoStuff: function(room) {
            if (!this.isAlive() || this.busy()) {
                return;
            }
            var enemies;

            if (this.isMonster()) {
                if (!room.hero.isAlive()) {
                    return;
                }
                enemies = [room.hero];
            } else {
                enemies = room.monsters.living();
            }

            var distances = vector.getDistances(
                this.getCoords(),
                _.map(enemies, function(e) { return e.getCoords(); })
            );

            this.tryAttack(enemies, distances);
            this.tryMove(enemies, distances, room.door);
        },

        tryAttack: function(enemies, distances) {
            var skill = this.skillchain.bestSkill(this.mana, distances);
            if (skill) {
                var targetIndex = _.find(_.range(enemies.length), function(i) { return skill.range >= distances[i]; });
                var target = enemies[targetIndex];
                this.attackTarget(target, skill);
            }
        },

        tryMove: function(enemies, distances, door) {
            if (this.busy()) { return; }
            var newPos;
            var curPos = this.getCoords();
            var rate = 10000;
            var range = 100000;

            if (enemies.length === 0) {
                newPos = vector.closer(curPos, door, rate, 0);
            } else {
                var minDist = distances.min();
                var closestPos = enemies[distances.minIndex()].getCoords();
                newPos = vector.closer(curPos, closestPos, rate, range);
            }

            if (!vector.equal(curPos, newPos)) {
                this.x = newPos[0];
                this.y = newPos[1];
                log.debug('%s moving closer', this.name);
                this.nextAction = 30;
            }
        },

        busy: function() {
            return this.nextAction > 0;
        },

        update: function(dt) {
            var skills = this.skillchain;
            _.each(skills, function(skill) { skill.cooldown -= dt; }, this);
            this.nextAction -= dt;
            if (this.isHero()) {
                window.DirtyQueue.mark('skill:change');
            }
        }
    });
    
    var HeroModel = EntityModel.extend({

        localStorage: new Backbone.LocalStorage('hero'),

        initialize: function(name, skillchain, inv, equipped) {
            this.name = name;
            this.skillchain = skillchain;
            this.inv = inv;
            this.equipped = equipped;

            EntityModel.prototype.initialize.call(this);
            this.team = TEAM_HERO;

            log.info('HeroModel initialize');
            this.nextAction = 0;
            this.computeAttrs();

            this.revive();
            // TODO, should be listening to window.ItemEvents
            // this.listenTo(window.ItemEvents, 'equipSuccess', this.computeAttrs);
            this.listenTo(this.inv, 'equipClick', this.equipClick);
            this.listenTo(this.equipped, 'change', this.computeAttrs);

            this.initPos();
        },

        applyXp: function(xp) {
            this.equipped.applyXp(xp);
            this.xp += xp;
            while (this.xp >= this.nextLevelXp) {
                this.level += 1;
                this.xp -= this.nextLevelXp;
                this.nextLevelXp = this.getNextLevelXp();
            }            
        },
        
        equipClick: function(item) {
            var itemType = item.itemType;
            if (itemType === 'armor') {
                this.equipped.equip(item, item.type);
            } else if (itemType === 'weapon') {
                this.equipped.equip(item, 'mainHand');
            } else if (itemType === 'skill') {
                this.skillchain.add(item);
            }
        },

        onKill: function(target, skill) {
            //console.log(target);
            var drops = target.getDrops();
            // this.get('inv').addDrops(drops);
            var xp = target.xpOnKill();
            this.applyXp(xp);
            window.msgs.send('Killed ' + (Math.floor(new Date().getTime() % 100000)));
        },

        onDeath: function() {
            //TODO write this
            log.warning('Hero has died');
        }
        
    });

    var MonsterModel = EntityModel.extend({

        initialize: function(data) {
            // All you need is a name
            EntityModel.prototype.initialize.call(this);
            this.team = TEAM_MONSTER;
            _.extend(this, data);

            //fetchMonsterConstants(name, level);
            // lookup given name and level
            log.debug('MonsterModel initialize, attrs: %s', JSON.stringify(this));

            _.extend(this, itemref.expand('monster', this.name));

            // TODO: allow monsters to equip more than 1 skill
            var skillName = this.skillchain[0]
            this.skillchain = new inventory.Skillchain();
            this.skillchain.equip(new inventory.SkillModel(skillName), 0);

            var equipped = new inventory.EquippedGearModel()
            equipped.equip(new inventory.WeaponModel(this.classLevel, this.type), 'mainHand');

            // TODO: allow monsters to equip other pieces
            equipped.equip(new inventory.ArmorModel(this.classLevel, 'chest'), 'chest');

            this.equipped = equipped;
            this.initPos();

            this.computeAttrs();
            this.revive();
        },

        getDrops: function() {
            //  Monster uses internal model to roll one or more drops, returns array of drops
            // string items in array are materials, objects are full items
            var drops = [];
            var dropRef = this.drops;
            //console.log(dropRef);

            var matCount = prob.pProb(1,10);
            if (matCount > 0) {
                var drop = matCount + " " + dropRef[prob.pyRand(0, dropRef.length)];
                drops.push(drop);
            }

            /*var recipeDropChance = 0.05;
              
              if(prob.binProb(recipeDropChance)) {
              drops.push(this.getRandItem());
              }*/

            log.info(this.name + ' dropped: ' + JSON.stringify(drops));
            return drops;
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

    function newHero(inv) {
        // stopgap measures: basic equipped stuff
        var heroName = 'bobbeh';
        var equipped = new inventory.EquippedGearModel();
        // this needs to change, don't have find where anymore
        equipped.equip(_.findWhere(inv.models, {name: 'cardboard sword'}), 'mainHand');
        equipped.equip(_.findWhere(inv.models, {name: 'balsa helmet'}), 'head');

        var skillchain = new inventory.Skillchain()
        skillchain.equip(_.findWhere(inv.models, {name: 'basic melee'}), 0);

        var hero = new HeroModel(heroName, skillchain, inv, equipped);

        return hero;
    }

    exports.extend({
        newHero: newHero,
        MonsterModel: MonsterModel,
    });

});
