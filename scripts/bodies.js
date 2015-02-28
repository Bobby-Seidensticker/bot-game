namespace.module('bot.bodies', function(exports, require) {

    var TEAM_HERO = 0;
    var TEAM_MONSTER = 1;

    var vu, Point, MonsterSpec, prob, log, Damage, attacksLib;

    $(function() {
        vu = namespace.bot.vectorutils;
        Point = vu.Point;
        MonsterSpec = namespace.bot.entity.MonsterSpec;
        prob = namespace.bot.prob;
        log = namespace.bot.log;
        Damage = namespace.bot.damage.Damage;
        attacksLib = namespace.bot.attacks;
    });

    var EntityBody = gl.Model.extend({
        initialize: function(spec) {
            this.spec = spec;

            this.createSkillchain();
            this.revive();
            this.pos = new Point(0, 0);
            this.nextAction = 0;
        },

        createSkillchain: function() {
            this.skills = _.map(_.compact(this.spec.skillchain.skills), function(skill) {
                return {spec: skill, coolAt: gl.time + skill.cooldownTime};
            });
        },

        revive: function() {
            this.hasMoved = false;

            this.takeAction(0);
            this.hp = this.spec.maxHp;
            this.mana = this.spec.maxMana;
            this.lastHpFullTime = gl.time;
            this.hpRegened = 0;
            this.lastManaFullTime = gl.time;
            this.manaRegened = 0;
        },

        initPos: function(room) {
            if (this.isHero()) {
                this.pos = room.ent.clone();
                gl.DirtyQueue.mark('hero:move');
            } else if (this.isMonster()) {
                this.pos = new Point(prob.rand(0, room.size.x), prob.rand(0, room.size.y));
            }
        },

        isHero: function() { return this.spec.team === TEAM_HERO; },

        isMonster: function() { return this.spec.team === TEAM_MONSTER; },

        teamString: function() { if (this.isHero()) { return 'Hero'; } else { return 'Monster'; } },

        isAlive: function() { return this.hp > 0; },

        modifyHp: function(added) {
            this.hp += added;
            if (this.hp >= this.spec.maxHp) {
                this.hp = this.spec.maxHp;
                this.lastHpFullTime = gl.time;
                this.hpRegened = 0;
            }
        },

        modifyMana: function(added) {
            this.mana += added;
            if (this.mana >= this.spec.maxMana) {
                this.mana = this.spec.maxMana;
                this.lastManaFullTime = gl.time;
                this.manaRegened = 0;
            }
        },

        regen: function() {
            if (gl.time > this.lastHpFullTime) {
                var total = this.spec.hpRegen * (gl.time - this.lastHpFullTime) / 1000;
                var toAdd = total - this.hpRegened;
                this.hpRegened = total;
                this.modifyHp(toAdd);
            }
            if (gl.time > this.lastManaFullTime) {
                var total = this.spec.manaRegen * (gl.time - this.lastManaFullTime) / 1000;
                var toAdd = total - this.manaRegened;
                this.manaRegened = total;
                this.modifyMana(toAdd);
            }
        },

        tryDoStuff: function(room, enemies) {
            this.regen();
            this.hasMoved = false;

            if (!this.isAlive() || this.busy()) {
                return;
            }

            if (enemies.length === 0) {
                if (this.isHero()) {
                    this.tryMove(enemies, distances, room);
                }
                return;
            }

            var distances = vu.getDistances(this.pos, _.pluck(enemies, 'pos'));

            this.tryAttack(enemies, distances, room);
            this.tryMove(enemies, distances, room);
        },

        tryAttack: function(enemies, distances, room) {
            var minIndex = distances.minIndex();
            var minDist = distances[minIndex];

            for (var si = 0; si < this.skills.length; si++) {      // use first skill that:
                if (this.skills[si] && 
                    this.skills[si].coolAt <= gl.time &&           // is cool
                    this.skills[si].spec.manaCost <= this.mana &&  // has enough mana
                    this.skills[si].spec.range >= minDist) {       // is in range
                        this.attackTarget(enemies[minIndex], this.skills[si], room);
                    return;
                }
            }
        },

        takeAction: function(duration) {
            this.nextAction = gl.time + duration;
            this.lastDuration = duration;
        },

        tryMove: function(enemies, distances, room) {
            if (this.busy()) { return; }
            this.hasMoved = true;

            // Need some way of determining what range you move until

            var dist = this.spec.moveSpeed * gl.lastTimeIncr;
            var range = 1000;  // TODO range needs to come from somewhere
            var newPos;
            if (enemies.length === 0) {
                newPos = this.pos.closer(room.exit, dist, 0);
            } else {
                var target = enemies[distances.minIndex()];
                newPos = this.pos.closer(target.pos, dist, range);
            }
            this.pos = newPos;

            if (this.isHero()) {
                gl.DirtyQueue.mark('hero:move');
            }
        },

        attackTarget: function(target, skill, room) {
            skill.coolAt = gl.time + skill.spec.speed + skill.spec.cooldownTime;
            this.takeAction(skill.spec.speed);
            this.mana -= skill.spec.manaCost;
            gl.addAttack(skill, this, target);
        },

        handleHit: function(target, leech) {
            this.handleLeech(leech);
            if (!target.isAlive()) {
                this.onKill(target);
                target.onDeath();
            }
        },

        handleLeech: function(leech) {
            if (leech.hp) {
                this.modifyHp(leech.hp);
            }
            if (leech.mana) {
                this.modifyMana(leech.mana);
            }
        },

        takeDamage: function(attack) {
            var dodgeChance = Math.pow(0.998, this.spec.dodge);

            if (Math.random() > dodgeChance) {
                log.debug('Dodged, chance was: %.2f%%', (1 - dodgeChance) * 100);
                gl.MessageEvents.trigger('message', newZoneMessage('dodged!', 'dodge', this.pos, 'rgba(230, 230, 10, 0.4)', 1000));
                return 0;
            }

            var dmg = attack.dmg;
            var physDmg = dmg.physDmg;

            var totalDmg = physDmg * physDmg / (physDmg + this.spec.armor) +
                dmg.lightDmg * this.spec.lightResist +
                dmg.coldDmg * this.spec.coldResist +
                dmg.fireDmg * this.spec.fireResist +
                dmg.poisDmg * this.spec.poisResist;

            if (this.spec.team === TEAM_HERO) {
                log.debug('Team Hero taking %.2f damage', -totalDmg);
            }
            this.modifyHp(-totalDmg);

            log.debug('Team %s taking damage, hit for %s, now has %.2f hp', this.teamString(), totalDmg, this.hp);
            // TODO: Add rolling for dodge in here so we can sometimes return 0;

            gl.MessageEvents.trigger(
                'message',
                newDamageMessage(attack, Math.ceil(totalDmg), 'rgba(230, 0, 0, 1)')
            );
            return totalDmg;
        },

        busy: function() {
            return this.nextAction >= gl.time;
        },

        onKill: function() {},
        onDeath: function() {},

        fireHeight: function() {
            return this.spec.height / 2;
        },
    });

    var HeroBody = EntityBody.extend({
        initialize: function(spec) {
            this.potionCoolAt = gl.time;
            this.listenTo(spec.skillchain, 'skillComputeAttrs', this.updateSkillchain);
            this.listenTo(spec, 'computeAttrs', this.updateSkillchain);
            EntityBody.prototype.initialize.call(this, spec);
        },

        updateSkillchain: function() {
            log.warning('updateSkillchain');
            var s = this.spec.skillchain;

            var lookup = {};
            for (var i = 0; i < this.skills.length; i++) {
                lookup[this.skills[i].spec.name] = this.skills[i];
            }

            var skills = _.filter(s.skills, function (skill) { return skill && !skill.disabled; });

            this.skills = _.map(
                skills,
                function(skill) {
                    if (skill.name in lookup) {
                        return {spec: skill, coolAt: lookup[skill.name].coolAt};
                    } else {
                        return {spec: skill, coolAt: gl.time + skill.cooldownTime};
                    }
                }
            );
            gl.DirtyQueue.mark('bodySkillchainUpdated');
        },

        onKill: function(target) {
            var xpGained = target.spec.xpOnKill();
            this.spec.applyXp(xpGained);
            var allDrops = target.spec.getDrops();
            if (allDrops.any) {
                var invMessages = this.spec.inv.addDrops(allDrops.gearDrops);
                var cardMessages = this.spec.cardInv.addDrops(allDrops.cardDrops);
                var messages = invMessages.concat(cardMessages);

                _.each(messages, function(message, index) {
                    var color = (message.slice(0,3) == "New" || message.slice(0,7) == "Leveled") ? 'rgba(255, 140, 0, 0.8)' : 'rgba(255, 100, 0, 0.6)';
                    gl.MessageEvents.trigger(
                        'message',
                        newZoneMessage(message, 'drop', target.pos, color, 1000, target.spec.height / 2 + index * 30000)
                    );
                }, this);
            }
            gl.DirtyQueue.mark('monsters:death');
        },

        onDeath: function() {
            log.warning('your hero died');
        },

        modifyHp: function(added) {
            EntityBody.prototype.modifyHp.call(this, added);
            gl.DirtyQueue.mark('hero:hp');
        },

        modifyMana: function(added) {
            EntityBody.prototype.modifyMana.call(this, added);
            gl.DirtyQueue.mark('hero:mana');
        },

        revive: function() {
            this.potionCoolAt = gl.time;
            EntityBody.prototype.revive.call(this);
            gl.DirtyQueue.mark('revive');
        },

        tryUsePotion: function() {
            if(this.hp == this.spec.maxHp) {
                return;
            }
            if(this.potionCoolAt <= gl.time) {
                this.potionCoolAt = gl.time + 5000; //5 second cooldown
                var addAmount = this.spec.level * 10; 
                this.hp = Math.min(this.spec.maxHp, this.hp + addAmount);
                gl.MessageEvents.trigger('message', newZoneMessage('potion worked!', 'potion', this.pos, 'rgba(230, 230, 230, 0.7)', 1000));
            } else {
                gl.MessageEvents.trigger('message', newZoneMessage('potion still cooling down!', 'potion', this.pos, 'rgba(230, 230, 230, 0.4)', 500));                
            }
        }
    });

    gl.monsterSpecs = {};

    var MonsterBody = EntityBody.extend({
        initialize: function(name, level) {
            var uid = name + '_' + level;
            var spec;
            if (uid in gl.monsterSpecs) {
                spec = gl.monsterSpecs[uid]
            } else {
                spec = new MonsterSpec(name, level);
                gl.monsterSpecs[uid] = spec;
            }
            EntityBody.prototype.initialize.call(this, spec);
        }
    });

    function newZoneMessage(text, type, pos, color, lifespan, verticalOffset) {
        return {
            text: text,
            type: type,
            pos: pos,
            color: color,
            lifespan: lifespan,
            verticalOffset: verticalOffset,
            time: gl.time,
            expires: gl.time + lifespan
        };
    }

    function newDamageMessage(attack, text, color) {
        var dmg = new Damage(attack.start, attack.pos, attack.hitHeight);  // target.spec.height);
        return {
            type: 'dmg',
            text: text,
            dmg: dmg,
            color: color,
            expires: gl.time + 10000
        };
    }

    exports.extend({
        MonsterBody: MonsterBody,
        HeroBody: HeroBody
    });
});