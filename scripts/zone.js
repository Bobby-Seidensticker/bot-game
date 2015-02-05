namespace.module('bot.zone', function (exports, require) {

    var TEAM_HERO = 0;
    var TEAM_MONSTER = 1;

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var entity = namespace.bot.entity;
    var prob = namespace.bot.prob;
    var itemref = namespace.bot.itemref;
    var vector = namespace.bot.vector;

    var ZoneManager = gl.Model.extend({
        initialize: function(hero) {
            this.allZones = itemref.ref.zone;
            this.zoneProgression = itemref.ref.zoneProgression;  // to be used later for rank increases

            this.initialize = false;
            this.hero = new HeroBody(hero);

            this.nextZone = 'spooky dungeon';
            this.newZone(this.nextZone);
            this.messages = new ZoneMessages();
        },

        newZone: function(name) {
            this.iuid = _.uniqueId('inst');

            var i, j, rooms, monsters, count, data;

            this.name = name;
            _.extend(this, this.allZones[this.name]);

            rooms = [];
            for (i = 0; i < this.roomCount; i++) {
                count = this.quantity[0] + prob.pProb(this.quantity[1], this.quantity[2]);

                monsters = [];
                for (var j = 0; j < count; j++) {
                    monsters.push(new MonsterBody(this.choices[prob.pick(this.weights)], this.level));
                }

                if (i === this.roomCount - 1) {
                    monsters.push(new MonsterBody(this.boss, this.level));
                }

                rooms[i] = {
                    monsters: monsters,
                    door: [1000000, 500000],
                    hero: undefined
                };
            }

            this.heroPos = 0;
            this.rooms = rooms;
            this.rooms[0].hero = this.hero;
            this.initialized = true;
            gl.DirtyQueue.mark('zone:new');
        },

        ensureRoom: function() {
            if (!this.hero.isAlive() || this.done()) {
                log.info('Getting new zone');
                this.hero.revive();
                this.newZone(this.nextZone);
            }
            if (this.roomCleared() && this.atDoor()) {
                var room = this.rooms[this.heroPos];
                room.hero = undefined;
                this.heroPos += 1;
                room = this.rooms[this.heroPos];
                room.hero = this.hero;
                this.hero.initPos();
                gl.DirtyQueue.mark('zone:nextRoom');
                log.info('now in room %d', this.heroPos);
            }
            return this.rooms[this.heroPos];
        },

        atDoor: function() {
            var room = this.rooms[this.heroPos];
            return this.hero.x === room.door[0] && this.hero.y === room.door[1];
        },

        zoneTick: function() {
            var room = this.ensureRoom();

            var mons = this.livingEnemies(TEAM_HERO)
            this.hero.tryDoStuff(room, mons);

            if (this.done()) {
                return;
            }

            room = this.ensureRoom();

            mons = this.livingEnemies(TEAM_HERO)
            
            var mons = this.livingEnemies(TEAM_HERO);
            var enemies = this.livingEnemies(TEAM_MONSTER);
            for (var i = 0; i < mons.length; i++) {
                mons[i].tryDoStuff(room, enemies);
                if (!this.hero.isAlive()) {
                    return;
                }
            }
            gl.DirtyQueue.mark('tick');
        },

        liveMons: function() {
            return _.filter(this.rooms[this.heroPos].monsters, function(mon) { return mon.isAlive(); });
        },

        livingEnemies: function(team) {
            if (team === TEAM_HERO) {
                return _.filter(this.rooms[this.heroPos].monsters, function(mon) { return mon.isAlive(); });
            } else {
                if (this.hero.isAlive()) {
                    return [this.hero];
                } else {
                    return [];
                }
            }
        },

        getCurrentRoom: function() {
            return this.rooms[this.heroPos];
        },

        roomCleared: function() {
            return this.liveMons().length === 0;
        },

        done: function() {
            return this.roomCleared() && this.heroPos === this.rooms.length - 1;
        }
    });

    var EntityBody = gl.Model.extend({
        initialize: function(spec) {
            this.spec = spec;

            this.createSkillchain();
            this.revive();
        },

        createSkillchain: function() {
            this.skills = _.map(_.compact(this.spec.skillchain.skills), function(skill) {
                return {spec: skill, coolAt: gl.time + skill.cooldownTime};
            });
        },

        revive: function() {
            this.hp = this.spec.maxHp;
            this.mana = this.spec.maxMana;
            this.lastHpFullTime = gl.time;
            this.hpRegened = 0;
            this.lastManaFullTime = gl.time;
            this.manaRegened = 0;
            this.initPos();
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

        tryDoStuff: function(room, livingEnemies) {
            this.regen();

            if (!this.isAlive() || this.busy()) {
                return;
            }
            //var livingEnemies = zone.getEnemies(this.spec.team);
            //var room = zone.getCurrentRoom();

            if (livingEnemies.length === 0) {
                if (this.isHero()) {
                    this.tryMove(livingEnemies, distances, room.door);
                }
                return;
            }

            var distances = vector.getDistances(
                [this.x, this.y],
                _.map(livingEnemies, function(e) { return [e.x, e.y]; })
            );

            this.tryAttack(livingEnemies, distances);
            this.tryMove(livingEnemies, distances, room.door);
        },

        tryAttack: function(enemies, distances) {
            var minIndex = distances.minIndex();
            var minDist = distances[minIndex];
            // TODO: make this work:
            for (var si = 0; si < this.skills.length; si++) {      // use first skill that:
                if (this.skills[si] && 
                    this.skills[si].coolAt <= gl.time &&           // is cool
                    this.skills[si].spec.manaCost <= this.mana &&  // has enough mana
                    this.skills[si].spec.range >= minDist) {       // is in range
                    this.attackTarget(enemies[minIndex], this.skills[si]);
                    return;
                }
            }
        },

        takeAction: function(duration) {
            this.nextAction = gl.time + duration;
            this.lastDuration = duration;
        },

        tryMove: function(enemies, distances, door) {
            if (this.busy()) { return; }
            var newPos;
            var curPos = [this.x, this.y];

            var dist = this.spec.moveSpeed * gl.lastTimeIncr;
            var range = 1000;  // range needs to come from somewhere

            if (enemies.length === 0) {
                newPos = vector.closer(curPos, door, dist, 0);
            } else {
                var target = enemies[distances.minIndex()];
                newPos = vector.closer(curPos, [target.x, target.y], dist, range);
            }

            this.x = newPos[0];
            this.y = newPos[1];
        },

        attackTarget: function(target, skill) {
            skill.coolAt = gl.time + skill.spec.speed + skill.spec.cooldownTime;
            this.takeAction(skill.spec.speed);
            var dmgDealt = target.takeDamage(skill.spec);

            if (dmgDealt) {
                log.debug('dmg dealt, hponhit: %.2f, hpLeech: %.2f', skill.spec.hpOnHit, skill.spec.hpLeech);
                var hpGain = skill.spec.hpOnHit + skill.spec.hpLeech;
                var manaGain = skill.spec.manaOnHit + skill.spec.manaLeech;
                if (hpGain) {
                    log.info('hp on hit: %.2f, hpleech: %.2f', skill.spec.hpOnHit, skill.spec.hpLeech);
                    this.modifyHp(hpGain);
                }
                if (manaGain) {
                    log.info('mana on hit: %.2f, manaleech: %.2f', skill.spec.manaOnHit, skill.spec.manaLeech);
                    this.modifyMana(manaGain);
                }
            }

            if (!target.isAlive()) {
                this.onKill(target, skill);
                target.onDeath();
            }

            this.mana -= skill.spec.manaCost;
        },

        takeDamage: function(skill) {
            var dodgeChance = Math.pow(0.998, this.spec.dodge);

            if (Math.random() > dodgeChance) {
                log.debug('Dodged, chance was: %.2f%%', (1 - dodgeChance) * 100);
                gl.MessageEvents.trigger('message', newZoneMessage('dodged!', 'dmg', [this.x, this.y], 'rgba(230, 230, 10, 0.5)', 1000));
                return 0;
            }

            var physDmg = skill.physDmg;

            var totalDmg = physDmg * physDmg / (physDmg + this.spec.armor) +
                skill.lightDmg * this.spec.lightResist +
                skill.coldDmg * this.spec.coldResist +
                skill.fireDmg * this.spec.fireResist +
                skill.poisDmg * this.spec.poisResist;

            if (this.spec.team === TEAM_HERO) {
                log.debug('Team Hero taking %.2f damage', -totalDmg);
            }
            this.modifyHp(-totalDmg);
            //this.hp -= totalDmg;

            log.debug('Team %s taking damage, hit for %s, now has %.2f hp', this.teamString(), totalDmg, this.hp);
            // TODO: Add rolling for dodge in here so we can sometimes return 0;

            gl.MessageEvents.trigger(
                'message',
                newZoneMessage(Math.ceil(totalDmg).toString(), 'dmg', [this.x, this.y], 'rgba(96, 0, 0, 0.5)', 500)
            );
            return totalDmg;
        },

        busy: function() {
            return this.nextAction > gl.time;
        },

        onKill: function() {},
        onDeath: function() {}
    });

    var HeroBody = EntityBody.extend({
        initialize: function(spec) {
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
                    // TODO do the gl.time (fake time) stuff
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
            // TODO ensure this works:
            var drops = target.spec.getDrops();
            this.spec.inv.addDrops(drops);
            this.spec.cardInv.addDrops(drops);
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
            EntityBody.prototype.revive.call(this);
            gl.DirtyQueue.mark('revive');
        },
    });

    gl.monsterSpecs = {};

    var MonsterBody = EntityBody.extend({
        initialize: function(name, level) {
            var uid = name + '_' + level;
            var spec;
            if (uid in gl.monsterSpecs) {
                spec = gl.monsterSpecs[uid]
            } else {
                spec = new entity.MonsterSpec(name, level);
                gl.monsterSpecs[uid] = spec;
            }
            EntityBody.prototype.initialize.call(this, spec);
        }
    });

    function newZoneMessage(text, type, pos, color, lifespan) {
        return {
            text: text,
            type: type,
            pos: pos,
            color: color,
            lifespan: lifespan,
            time: gl.time,
            expires: gl.time + lifespan
        };
    }

    var ZoneMessages = gl.Model.extend({
        initialize: function() {
            this.listenTo(gl.MessageEvents, 'message', this.addMessage);
            this.msgs = [];
        },

        addMessage: function(msgObj) {
            this.msgs.push(msgObj);
            this.prune();
        },

        prune: function() {
            this.msgs = _.filter(this.msgs, function(msg) { return msg.expires > gl.time });
        },
    });

    exports.extend({
        ZoneManager: ZoneManager,
        MonsterBody: MonsterBody, //extended for use in test.js
        HeroBody: HeroBody
    });
});
