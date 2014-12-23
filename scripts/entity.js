namespace.module('bot.entity', function (exports, require) {

    var TEAM_CHAR = 0;
    var TEAM_MONSTER = 1;

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var vector = namespace.bot.vector;
    var inventory = namespace.bot.inv;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;
    var prob = namespace.bot.prob;
    
    var EntityModel = Backbone.Model.extend({
        defaults: function () { 
            return {
                strength: 10,
                dexterity: 10,
                wisdom: 10,
                vitality: 10,
                level: 1,
                //weapon: {'damage': 1, 'range':1, 'speed': 1, 'affixes': ['strength more 1.1']}, //'fists' weapon auto equipped when unarmed.
                //armor: [],
                affixes: ['strength more 1.5', 'strength more 2', 'strength added 10'],
                xp: 0,
                team: 1
            };
        },

        initialize: function() {
            log.debug('EntityModel initialize');
            this.computeAttrs();
        },

        computeAttrs: function() {
            log.info('Computing Attrs for Entity on team %s', this.teamString());
            var t = {};  // temp values
            t.strength = this.get('strength');
            t.dexterity = this.get('dexterity');
            t.wisdom = this.get('wisdom');
            t.vitality = this.get('vitality');
            t.level = this.get('level');
            
            t.equipped = this.get('equipped');
            t.affixes = t.equipped.getAffixes();
            if(this.get('team') === 1) {
                t.affixes = t.affixes.concat(this.get('affixes'));
            }

            t.skillchain = this.get('skillchain');

            //Add affix bonuses
            //Affix format is 'stat modtype amount'
            var affixDict = utils.affixesToAffDict(t.affixes);

            utils.applyAllAffixes(t, ['strength', 'dexterity', 'wisdom', 'vitality'], affixDict);

            // Todo? should we pull these constants out and give them easily manipulable names 
            // so we can balance away from crucial code? 
            // eg
            // HP_PER_LVL = 10;
            // HP_PER_VIT = 2;

            t.hp = t.level * 10 + t.vitality * 2;
            t.mana = t.level * 5 + t.wisdom * 2;
            t.armor = t.strength * 0.5;
            t.dodge = t.dexterity * 0.5;
            t.eleResistAll = 1 - Math.pow(0.997, t.wisdom); //temp var only

            utils.applyAllAffixes(t, ['hp', 'mana', 'armor', 'dodge', 'eleResistAll'], affixDict);

            t.fireResist = t.eleResistAll;
            t.coldResist = t.eleResistAll;
            t.lightResist = t.eleResistAll;
            t.poisResist = t.eleResistAll;

            utils.applyAllAffixes(t, ['fireResist','coldResist', 'lightResist', 'poisResist'], affixDict);

            t.skillchain.computeAttrs(t.equipped.getWeapon(), affixDict);

            t.maxHp = t.hp;
            t.maxMana = t.mana;
            delete t.eleResistAll;
            this.set(t);

            this.set('nextLevelXp', this.getNextLevelXp());
        },

        isMonster: function() {
            return this.get('team') === TEAM_MONSTER;
        },

        isChar: function() {
            return this.get('team') === TEAM_CHAR;
        },

        teamString: function() {
            if (this.get('team') === TEAM_CHAR) {
                return 'Character';
            }
            return 'Monster';
        },

        isAlive: function() {
            return this.get('hp') > 0;
        },

        takeDamage: function(damage) {
            var physDmg = damage.physDmg;
            var armorReductionMult = physDmg / (physDmg + this.get('armor'));
            physDmg = physDmg * armorReductionMult;

            // TODO: apply elemental damage and mitigation
            this.set('hp', this.get('hp') - physDmg);

            if (this.get('hp') < 0) {
                log.info('An entity from team %s DEAD, hit for %s', this.teamString(), JSON.stringify(damage));
            } else {
                log.debug('Team %s taking damage, hit for %s, now has %.2f hp', this.teamString(), JSON.stringify(damage), this.get('hp'));
            }
            // modify own health
        },

        attackTarget: function(target, skill) {
            //var skillToUse = this.skillchain[skillIndex];
            /*var dodged = this.rollDodge(this.get('accuracy'), target.get('dodge'));
              if (dodged) {
              // clean up cooldowns for 'this'
              return;
              }*/
            // TODO: use duration value on skillToUse to set nextAction value on entity
            this.set({
                mana: this.get('mana') - skill.get('manaCost'),
            });
            var dmg = this.getDamage(skill);
            log.debug('%s attacking target %s for %s dmg', this.get('name'),  target.get('name'), JSON.stringify(dmg));
            target.takeDamage(dmg);
            if (!target.isAlive()) {
                if (this.get('team') == 0) {
                    this.onKill(target, skill);
                } else {
                    log.info("Character has died!");
                    target.onDeath();
                }
            }
        },



        getNextLevelXp: function() {
            return Math.floor(100 * Math.exp((this.get('level') - 1) / Math.PI));
        },

        getDamage: function(skill) {
            skill.use();
            return {'physDmg': skill.get('physDmg')};
        },

        ready: function() {
            // STUB
            // TODO: 
            // check skill chain to see when next cooldown done
            // check mana
            // if have mana and cool skill, return true, else false
            // check if in range
            return true;
        },

        inRange: function(target) {
            return true;
        },

        getCoords: function() {
            //return [this.get('x'), this.get('y')];
            return [0, 0];
        },

        tryDoStuff: function(enemies) {
            if (!this.ready() || !this.isAlive()) {
                return;
            }

            var skills = this.get('skillchain');

            var distances = vector.getDistances(
                this.getCoords(),
                _.map(enemies, function(e) { return e.getCoords(); })
            );

            var skill = this.get('skillchain').bestSkill(this.get('mana'), distances);
            if (!skill) {
                log.debug('No best skill, mana: %.2f, distances: %s', this.get('mana'), JSON.stringify(distances));
                return;
            }

            var targetIndex = _.find(_.range(enemies.length), function(i) { return skill.get('range') >= distances[i]; });
            var target = enemies[targetIndex];

            this.attackTarget(target, skill);
        },

        update: function(dt) {
            var skills = this.get('skillchain');
            skills.each(function(skill) { skill.set('cooldown', skill.get('cooldown') - dt); });

            this.set('nextAction', this.get('nextAction') - dt);
        }
    });
 
   var CharModel = EntityModel.extend({
        defaults: _.extend({}, EntityModel.prototype.defaults(), {
            team: TEAM_CHAR,
        }),

        localStorage: new Backbone.LocalStorage('char'),

        initialize: function() {
            log.info('CharModel initialize');
            this.fetch();
            this.computeAttrs();
            this.listenTo(this.get('inv'), 'equipClick', this.equipClick)
        },

       equipClick: function(item) {
           var itemType = item.get('itemType');
            if (itemType === 'armor') {
                this.get('equipped').equip(item, item.get('type'));
            } else if (itemType === 'weapon') {
                this.get('equipped').equip(item, 'mainHand');
            } else if (itemType === 'skill') {
                this.get('skillchain').add(item);
            }
       },

        onKill: function(target, skill) {
            //console.log(target);
            var drops = target.getDrops();
            this.get('inv').materials.addDrops(drops);
            this.set('xp', this.get('xp') + target.get('level'));
            while (this.get('xp') >= this.get('nextLevelXp')) {
                this.set('level', this.get('level') + 1);
                this.set('xp', this.get('xp') - this.get('nextLevelXp'));
                this.set('nextLevelXp', this.getNextLevelXp());
            }
        },

       onDeath: function() {
           //TODO write this
           console.log("you dead");
       }
       
    });

    var MonsterModel = EntityModel.extend({
        defaults: _.extend({}, EntityModel.prototype.defaults(), {
            team: TEAM_MONSTER,
        }),

        initialize: function() {
            //fetchMonsterConstants(name, level);
            // lookup given name and level
            log.debug('MonsterModel initialize');

            this.set(itemref.expand('monster', this.get('name')));

            var skillchain = new inventory.Skillchain();
            skillchain.add(_.map(this.get('skillchain'), function(name) {
                return new inventory.SkillModel({name: name});
            }));

            var equipped = new inventory.EquippedGearModel()
            _.each(this.get('weapon'), function(name) {
                equipped.equip(new inventory.WeaponModel({name: name}), 'mainHand');
            });

            _.each(this.get('armor'), function(name) {
                var armor = new inventory.ArmorModel({name: name});
                equipped.equip(armor, armor.get('type'));
            });

            this.set({
                skillchain: skillchain,
                equipped: equipped
            });

            this.computeAttrs();
        },

        getDrops: function() {
            //  Monster uses internal model to roll one or more drops, returns array of drops
            // string items in array are materials, objects are full items
            var drops = [];
            var dropRef = this.get('drops');
            //console.log(dropRef);

            var matCount = prob.pProb(1,10);
            if (matCount > 0) {
                var drop = matCount + " " + dropRef[prob.pyRand(0, dropRef.length)];
                drops.push(drop);
            }

            var recipeDropChance = 0.05;
            
            if(prob.binProb(recipeDropChance)) {
                drops.push(this.get('weapon')[0]);
            }
            
            log.info(this.get('name') + ' dropped: ' + JSON.stringify(drops));
            return drops;
        },
        
    });

    function newChar(inv) {
        // stopgap measures: basic equipped stuff
        var charName = 'bobbeh';
        var equipped = new inventory.EquippedGearModel({'charName': charName});
        equipped.equip(inv.findWhere({name: 'wooden sword'}), 'mainHand');
        equipped.equip(inv.findWhere({name: 'cardboard kneepads'}), 'legs');

        var skillchain = inventory.newSkillchain()
        skillchain.add(inv.findWhere({name: 'basic melee'}));

        var char = new CharModel({
            name: charName,
            skillchain: skillchain,
            inv: inv,
            equipped: equipped
        });

        return char;
    }

    exports.extend({
        newChar: newChar,
        MonsterModel: MonsterModel,
    });

});
