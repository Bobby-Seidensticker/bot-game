namespace.module('bot.entity', function (exports, require) {

    var TEAM_CHAR = 0;
    var TEAM_MONSTER = 1;

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var vector = namespace.bot.vector;
    var inventory = namespace.bot.inv;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;

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

            t.skillChain = this.get('skillChain');

            //Add affix bonuses
            //Affix format is 'stat modtype amount'
            var affixDict = utils.affixesToAffDict(t.affixes);

            utils.applyAllAffixes(t, ['strength', 'dexterity', 'wisdom', 'vitality'], affixDict);

            // Todo? should we pull these constants out and give them easily manipulable names 
            // so we can balance away from crucial code? 
            // eg
            // HP_PER_LVL = 10;
            // HP_PER_VIT = 2;

            t.hp = t.level * 10 + t.vitality * 2 ;
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

            t.skillChain.computeAttrs(t.equipped.getWeapon(), affixDict);

            t.maxHp = t.hp;
            t.maxMana = t.mana;
            delete t.eleResistAll;
            this.set(t);
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
            log.debug('Team %s attacking target', this.teamString());
            target.takeDamage(this.getDamage(skill));
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

            var skills = this.get('skillChain');

            var distances = vector.getDistances(
                this.getCoords(),
                _.map(enemies, function(e) { return e.getCoords(); })
            );

            var skill = this.get('skillChain').bestSkill(this.get('mana'), distances);
            if (!skill) {
                log.debug('No best skill, mana: %.2f, distances: %s', this.get('mana'), JSON.stringify(distances));
                return;
            }

            var targetIndex = _.find(_.range(enemies.length), function(i) { return skill.get('range') >= distances[i]; });
            var target = enemies[targetIndex];

            this.attackTarget(target, skill);
        },

        update: function(dt) {
            var skills = this.get('skillChain');
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

            this.set({
                skillChain: inventory.newSkillChain(),
                equipped: new inventory.EquippedGearModel()
            });

            this.computeAttrs();
        }
    });

    function newChar(inv) {
        // stopgap measures: basic equipped stuff
        var equipped = new inventory.EquippedGearModel();
        equipped.equip(inv.weapons.findWhere({name: 'wooden sword'}), 'mainHand');
        equipped.equip(inv.armor.findWhere({name: 'cardboard kneepads'}), 'legs');

        var skillChain = inventory.newSkillChain()

        var char = new CharModel({
            skillChain: skillChain,
            inv: inv,
            equipped: equipped
        });
        return char;
    }

    /*var CharSkillChain = inv.SkillChain.extend({
      localStorage: new Backbone.LocalStorage('char-skillchain'),

      initialize: function() {
      this.fetch();
      log.info('Initialize character skill chain, after fetch has %d elements', this.length);
      if (this.length === 0) {
      this.loadDefaults();
      //this.sync();
      log.info('Had no skills so added some defaults, now has %d elements', this.length);
      }
      },

      loadDefaults: function() {
      // this needs access to inv model
      //this.add(invModel.skills.findWhere({'name': 'basic melee'}));
      }
      });*/

    exports.extend({
        newChar: newChar,
        MonsterModel: MonsterModel,
    });

    // testing
    /*(function() {
      var x;
      x = new EntityModel({ strength: 10, wisdom: 20 });
      x = newMonster('hurr', 10);
      x = newChar();
      })();*/
});