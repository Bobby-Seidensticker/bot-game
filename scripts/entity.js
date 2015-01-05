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
                affixes: [],
                xp: 0,
                team: 1
            };
        },

        initialize: function() {
            throw('Entity is an abstract class');
        },

        computeAttrs: function() {
            log.debug('Computing Attrs for Entity on team %s', this.teamString());
            var t = {};  // temp values

            t.strength = this.defaults.strength;
            t.dexterity = this.defaults.dexterity;
            t.wisdom = this.defaults.wisdom;
            t.vitality = this.defaults.vitality;
            t.level = this.get('level');
            
            t.equipped = this.get('equipped');
            t.affixes = t.equipped.getAffixes();
            if (this.get('team') === 1) {
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

            t.maxHp = t.level * 10 + t.vitality * 2;
            t.maxMana = t.level * 5 + t.wisdom * 2;
            t.armor = t.strength * 0.5;
            t.dodge = t.dexterity * 0.5;
            t.eleResistAll = 1 - Math.pow(0.997, t.wisdom); //temp var only

            utils.applyAllAffixes(t, ['maxHp', 'maxMana', 'armor', 'dodge', 'eleResistAll'], affixDict);

            t.fireResist = t.eleResistAll;
            t.coldResist = t.eleResistAll;
            t.lightResist = t.eleResistAll;
            t.poisResist = t.eleResistAll;

            utils.applyAllAffixes(t, ['fireResist','coldResist', 'lightResist', 'poisResist'], affixDict);

            t.skillchain.computeAttrs(t.equipped.getWeapon(), affixDict);

            delete t.eleResistAll;
            this.set(t);

            this.set('nextLevelXp', this.getNextLevelXp());
        },

        revive: function() {
            this.set({
                hp: this.get('maxHp'),
                mana: this.get('maxMana')
            });
            this.initPos();
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
            //console.log("takedmg called with", damage, this.get('name'), this);
            var physDmg = damage.physDmg;
            var armorReductionMult = physDmg / (physDmg + this.get('armor'));
            physDmg = physDmg * armorReductionMult;

            var fireResist = this.get('fireResist');
            var coldResist = this.get('coldResist');
            var lightResist = this.get('lightResist');
            var poisResist = this.get('poisResist');            

            var fireDmg = damage.fireDmg * (1 - fireResist * 0.01);
            var coldDmg = damage.coldDmg * (1 - coldResist * 0.01);
            var lightDmg = damage.lightDmg * (1 - lightResist * 0.01);
            var poisDmg = damage.poisDmg * (1 - poisResist * 0.01);            
            
            var totalDmg = physDmg + fireDmg + coldDmg + lightDmg + poisDmg;
            this.set('hp', this.get('hp') - totalDmg);

            if (this.get('hp') <= 0) {
                window.gevents.trigger('monsters:death', this);
                this.trigger('death');
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
                if (this.isChar()) {
                    this.onKill(target, skill);
                } else {
                    log.info('Character has died!');
                    target.onDeath();
                }
            }
        },

        getNextLevelXp: function() {
            return Math.floor(100 * Math.exp((this.get('level') - 1) / Math.PI));
        },

        xpOnKill: function() {
            return Math.ceil(10 * Math.pow(1.15, this.get('level')-1));
        },

        getDamage: function(skill) {
            skill.use();
            return {
                'physDmg': skill.get('physDmg'),
                'fireDmg': skill.get('fireDmg'),
                'coldDmg': skill.get('coldDmg'),
                'lightDmg': skill.get('lightDmg'),
                'poisDmg': skill.get('poisDmg')
            };
        },

        inRange: function(target) {
            return true;
        },

        getCoords: function() {
            return [this.get('x'), this.get('y')];
        },

        initPos: function() {
            if (this.isChar()) {
                this.set({
                    x: 1,
                    y: 10
                });
            } else if (this.isMonster()) {
                this.set({
                    x: 17 + prob.rand(-2, 3),
                    y: 10 + prob.pyRand(-3, 3)
                });
            }
        },

        tryDoStuff: function(enemies) {
            if (!this.isAlive() || this.get('nextAction') > 0) {
                return;
            }

            var distances = vector.getDistances(
                this.getCoords(),
                _.map(enemies, function(e) { return e.getCoords(); })
            );

            var skill = this.get('skillchain').bestSkill(this.get('mana'), distances);
            if (skill) {
                var targetIndex = _.find(_.range(enemies.length), function(i) { return skill.get('range') >= distances[i]; });
                var target = enemies[targetIndex];
                this.attackTarget(target, skill);
            } else {
                log.debug('No best skill for %s, mana: %.2f, distances: %s', this.get('name'), this.get('mana'), JSON.stringify(distances));

                var skills = this.get('skillchain');

                var minDist = distances.min();
                var closestEnemy = enemies[distances.minIndex()];
                var closestPos = closestEnemy.getCoords();

                //console.log(skills.shortest, minDist);
                //if (skills.shortest < minDist) {
                if (1 < minDist) {
                    this.tryMoveTo(closestPos, minDist);
                }
            }
        },

        tryMoveTo: function(dest, distance) {
            if (!this.busy()) {
                var pos = this.getCoords();
                var distance = vector.dist(pos, dest);
                var diff = [dest[0] - pos[0], dest[1] - pos[1]];
                var moveSpeed = 0.1;
                var ratio = 1 - (distance - moveSpeed) / distance;
                this.set('x', pos[0] + diff[0] * ratio);
                this.set('y', pos[1] + diff[1] * ratio);

                log.debug('%s moving closer', this.get('name'));
                this.set('nextAction', 30);
            }
        },

        busy: function() {
            return this.get('nextAction') > 0;
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

            this.revive();
            this.listenTo(this.get('inv'), 'equipClick', this.equipClick);
            this.listenTo(this.get('equipped'), 'change', this.computeAttrs);

            this.set({
                x: 1,
                y: 10
            });
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
            this.get('inv').addDrops(drops);
            var xp = target.xpOnKill();
            this.get('equipped').applyXp(xp);
            this.set('xp', this.get('xp') + xp);
            while (this.get('xp') >= this.get('nextLevelXp')) {
                this.set('level', this.get('level') + 1);
                this.set('xp', this.get('xp') - this.get('nextLevelXp'));
                this.set('nextLevelXp', this.getNextLevelXp());
            }
        },

        onDeath: function() {
            //TODO write this
            log.warning('you dead');
        }
        
    });

    var MonsterModel = EntityModel.extend({
        defaults: _.extend({}, EntityModel.prototype.defaults(), {
            team: TEAM_MONSTER,
        }),

        initialize: function() {
            //fetchMonsterConstants(name, level);
            // lookup given name and level
            log.debug('MonsterModel initialize, attrs: %s', JSON.stringify(this.toJSON()));

            this.set(itemref.expand('monster', this.get('name')));

            var skillchain = new inventory.Skillchain();
            skillchain.add(_.map(this.get('skillchain'), function(name) {
                return new inventory.SkillModel({name: name});
            }));

            var equipped = new inventory.EquippedGearModel()
            equipped.equip(new inventory.WeaponModel({name: this.get('weapon')}), 'mainHand');

            _.each(this.get('armor'), function(name) {
                var armor = new inventory.ArmorModel({name: name});
                equipped.equip(armor, armor.get('type'));
            });

            this.set({
                skillchain: skillchain,
                equipped: equipped
            });
            this.initPos();

            this.computeAttrs();
            this.revive();
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
                drops.push(this.getRandItem());
            }

            log.info(this.get('name') + ' dropped: ' + JSON.stringify(drops));
            return drops;
        },

        getRandItem: function() {
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

            if (roll < weapcount) {
                return new inventory.WeaponModel({'name': Object.keys(ref.weapon)[roll]});
            } else if (roll < weapcount + armorcount) {
                return new inventory.ArmorModel({'name': Object.keys(ref.armor)[roll - weapcount]});
            } else if (roll < weapcount + armorcount + skillcount) {
                return new inventory.SkillModel({'name': Object.keys(ref.skill)[roll - weapcount - armorcount]});
            } else {
                log.warning("wtf: dropRand rolled higher number than it should have");
            }

            //console.log(ref, weapcount);
            
        }
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
