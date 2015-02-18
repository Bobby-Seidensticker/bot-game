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

            this.attacks = new namespace.bot.attacks.AttackManager();

            this.nextZone = 'spooky dungeon';
            this.newZone(this.nextZone);

            this.messages = new ZoneMessages();
        },

        newZone: function(name) {
            this.iuid = _.uniqueId('inst');

            var i, j, rooms, monsters, count, data;

            this.name = name;
            _.extend(this, this.allZones[this.name]);

            this.rooms = this.generator();
            for (i = 0; i < this.rooms.length; i++) {
                monsters = [];
                if (i % 2 === 0) {  // if this is not a corridor
                    count = this.quantity[0] + prob.pProb(this.quantity[1], this.quantity[2]);
                    for (var j = 0; j < count; j++) {
                        monsters.push(new MonsterBody(this.choices[prob.pick(this.weights)], this.level));
                    }
                    if (i === this.rooms.length - 1) {
                        monsters.push(new MonsterBody(this.boss, this.level));
                    }
                }
                _.extend(this.rooms[i], {monsters: monsters, hero: undefined, attacks: []});
                _.each(this.rooms[i].monsters, function(mon) { mon.initPos(this.rooms[i]); }, this);
            }

            this.heroPos = 0;
            this.rooms[0].hero = this.hero;
            this.initialized = true;
            this.hero.revive();
            this.hero.initPos(this.rooms[0]);
            this.attacks.nextRoom(this.rooms[0]);
            gl.DirtyQueue.mark('zone:new');
        },

        generator: function() {
            // windyness
            // lrange
            // hrange
            // scale

            var lrange = [10, 20];
            var hrange = [7, 10];
            var scale = 100000;
            var weights;
            var dir = 1;  // [up, right, down, left], just like margins/padding in css
            var width, height;

            var rooms = [];
            var room;

            var size, pos, ent, exit, absEnt;

            size = [prob.rand(lrange[0], lrange[1]), prob.rand(hrange[0], hrange[1])];
            pos = [0, 0];
            ent = [0, prob.middle50(size[1])];

            room = {
                size: size,
                pos: pos,
                ent: ent
            };

            rooms.push(room);

            while (rooms.length < this.roomCount * 2 - 1) {
                // Pick a new direction
                dir = prob.rand(0, 1);

                // get a width + height, swap height and len ranges if we aren't going right, so the l/w ranges
                //   stay the same wrt the player
                // set the abs exit for the old room 
                if (dir === 0) {
                    room.exit = [prob.middle50(room.size[0]), 0];
                } else {
                    room.exit = [room.size[0], prob.middle50(room.size[1])];
                }
                // old room is done
                // make corridor in the dir chosen

                absEnt = vector.sum(room.pos, room.exit);
                if (dir === 0) {
                    size = [2, 5];
                    ent = [1, 5];
                    pos = vector.sub(absEnt, ent);
                    exit = [1, 0];
                } else {
                    size = [5, 2];
                    ent = [0, 1];
                    pos = vector.sub(absEnt, ent);
                    exit = [5, 1];
                }
                room = {
                    size: size,
                    pos: pos,
                    ent: ent,
                    exit: exit
                };
                rooms.push(room);

                size = [prob.rand(lrange[0], lrange[1]), prob.rand(hrange[0], hrange[1])];
                absEnt = vector.sum(room.pos, room.exit);

                if (dir === 0) {
                    size.reverse();
                    ent = [prob.middle50(size[0]), size[1]];
                    pos = vector.sub(absEnt, ent);
                } else {
                    ent = [0, prob.middle50(size[1])];
                    pos = vector.sub(absEnt, ent);
                }
                room = {
                    size: size,
                    pos: pos,
                    ent: ent
                };
                rooms.push(room);
            }

            for (var i = 0; i < rooms.length; i++) {
                rooms[i].size[0] *= scale;
                rooms[i].size[1] *= scale;
                rooms[i].pos[0] *= scale;
                rooms[i].pos[1] *= scale;
                rooms[i].ent[0] *= scale;
                rooms[i].ent[1] *= scale;
                if (rooms[i].exit) {
                    rooms[i].exit[0] *= scale;
                    rooms[i].exit[1] *= scale;
                }
            }

            return rooms;
        },

        ensureRoom: function() {
            if (!this.hero.isAlive() || this.done()) {
                log.info('Getting new zone');
                this.hero.revive();
                this.newZone(this.nextZone);
            }
            if (this.roomCleared() && this.atExit()) {
                var room = this.rooms[this.heroPos];
                room.hero = undefined;
                this.heroPos += 1;
                room = this.rooms[this.heroPos];
                room.hero = this.hero;
                this.hero.initPos(room);
                _.each(room.monsters, function(mon) { mon.initPos(room); });
                this.attacks.nextRoom(this.rooms[this.heroPos]);
                gl.DirtyQueue.mark('zone:nextRoom');
                log.debug('now in room %d', this.heroPos);
            }
            var room = this.rooms[this.heroPos];
            room.attacks = this.attacks;
            return room;
        },

        atExit: function() {
            var room = this.rooms[this.heroPos];
            return this.hero.x === room.exit[0] && this.hero.y === room.exit[1];
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

            this.attacks.tick([this.livingEnemies(1), this.livingEnemies(0)]);

            gl.DirtyQueue.mark('zoneTick');
        },

        maxStep: function() {
            var room, mons, min, i;
            room = this.ensureRoom();
            mons = room.monsters;

            min = this.hero.nextAction;
            for (i = mons.length; i--;) {
                ml = Math.min(mons[i].nextAction, min);
            }
            return min - gl.time;
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
        },
    });

    var EntityBody = gl.Model.extend({
        initialize: function(spec) {
            this.spec = spec;

            this.height = this.spec.height ? this.spec.height : 50;
            this.width = this.spec.width ? this.spec.width : 15;

            this.createSkillchain();
            this.revive();
            this.x = 0;
            this.y = 0;
            this.nextAction = 0;
        },

        createSkillchain: function() {
            this.skills = _.map(_.compact(this.spec.skillchain.skills), function(skill) {
                return {spec: skill, coolAt: gl.time + skill.cooldownTime};
            });
        },

        revive: function() {
            this.hasMoved = false;

            this.hp = this.spec.maxHp;
            this.mana = this.spec.maxMana;
            this.lastHpFullTime = gl.time;
            this.hpRegened = 0;
            this.lastManaFullTime = gl.time;
            this.manaRegened = 0;
        },

        initPos: function(room) {
            if (this.isHero()) {
                this.x = room.ent[0];
                this.y = room.ent[1];
                gl.DirtyQueue.mark('hero:move');
            } else if (this.isMonster()) {
                this.x = prob.rand(0, room.size[0]);
                this.y = prob.rand(0, room.size[1]);
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
            this.hasMoved = false;

            if (!this.isAlive() || this.busy()) {
                return;
            }
            //var livingEnemies = zone.getEnemies(this.spec.team);
            //var room = zone.getCurrentRoom();

            if (livingEnemies.length === 0) {
                if (this.isHero()) {
                    this.tryMove(livingEnemies, distances, room);
                }
                return;
            }

            var distances = vector.getDistances(
                [this.x, this.y],
                _.map(livingEnemies, function(e) { return [e.x, e.y]; })
            );

            this.tryAttack(livingEnemies, distances, room);
            this.tryMove(livingEnemies, distances, room);
        },

        tryAttack: function(enemies, distances, room) {
            var minIndex = distances.minIndex();
            var minDist = distances[minIndex];
            // TODO: make this work:
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
            var newPos;
            var curPos = [this.x, this.y];

            var dist = this.spec.moveSpeed * gl.lastTimeIncr;
            var range = 1000;  // range needs to come from somewhere

            if (enemies.length === 0) {
                newPos = vector.closer(curPos, room.exit, dist, 0);
            } else {
                var target = enemies[distances.minIndex()];
                newPos = vector.closer(curPos, [target.x, target.y], dist, range);
            }

            this.x = newPos[0];
            this.y = newPos[1];

            if (this.isHero()) {
                gl.DirtyQueue.mark('hero:move');
            }
        },

        attackTarget: function(target, skill, room) {
            skill.coolAt = gl.time + skill.spec.speed + skill.spec.cooldownTime;
            this.takeAction(skill.spec.speed);
            this.mana -= skill.spec.manaCost;
            room.attacks.addAttack(skill, this, target);
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
                gl.MessageEvents.trigger('message', newZoneMessage('dodged!', 'dmg', [this.x, this.y], 'rgba(230, 230, 10, 0.7)', 1000));
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
            //this.hp -= totalDmg;

            log.debug('Team %s taking damage, hit for %s, now has %.2f hp', this.teamString(), totalDmg, this.hp);
            // TODO: Add rolling for dodge in here so we can sometimes return 0;

            gl.MessageEvents.trigger(
                'message',
                newZoneMessage(Math.ceil(totalDmg).toString(), 'dmg', [this.x, this.y], 'rgba(96, 0, 0, 0.7)', 500, this.height)
            );
            return totalDmg;
        },

        busy: function() {
            return this.nextAction >= gl.time;
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
            var drops =target.spec.getDrops();
            if (drops.length) {
                drops = _.filter(drops, function(drop, index) {
                    // get names and remove duplicate item drops
                    if(drop.dropType == "card") {
                        drop.name = drop.data[0] + " " + drop.data[1];
                    } else if (drop.dropType == "skill") {
                        drop.name = drop.data;
                    } else {
                        drop.name = itemref.ref[drop.dropType][drop.data[1]].names[drop.data[2]];
                    }
                    var ownedItems = _.find(this.spec.inv.models, function(model) {
                        return (model.name == drop.name);
                    });
                    if (ownedItems) {
                        return false;
                    } else {
                        // trigger drop messages for each non-dupe item
                        var dropStr = "";
                        dropStr = drop.dropType + ": " + drop.name;
                        gl.MessageEvents.trigger(
                            'message',
                            newZoneMessage(dropStr, 'dmg', [target.x, target.y], 'rgba(255, 100, 0, 0.8)', 1000, target.height/2 + index*20)
                        );
                        return true;
                    }                        
                }, this);
            }
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
