namespace.module('bot.attacks', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();
    var log = namespace.bot.log;
    var vector = namespace.bot.vector;

    var AttackManager = gl.Model.extend({
        initialize: function(options) {
            this.attacks = [];
        },

        tick: function(livingBodies) {
            /*
              for attack in melee attacks:
                put at new place
                if should hit:
                  attack.target.takeDamage(attacker, attack.dmg);
                  "trigger" attack.onHit
                  "trigger" attack.onRemove
              for attack in ranged:
                if not moving, needs to start moving, start moving
                
                if hit anything:
                  attack.target.takeDamage(attacker, attack.dmg);
                  "trigger" attack.onHit
                  if killed something:
                    "trigger" attack.onKill
                  "trigger" attack.onRemove
                else:
                  put at new place
                  if expired:
                  "trigger" attack.onRemove
              for attack in aoe attacks:
                if should 'splode:
                  "trigger" attack.onHit
                  if killed something:
                    "trigger" attack.onKill
                  "trigger" attack.onRemove
            */
            var i;
            for (i = 0; i < this.attacks.length; i++) {
                var enemies = livingBodies[this.attacks[i].target.spec.team];
                this.attacks[i].tick(enemies);
            }
            i = 0;
            var atk;
            var newAttacks;
            while (i < this.attacks.length) {
                atk = this.attacks[i];
                newAttacks = atk.getNewAttacks();
                if (newAttacks.length) {
                    this.attacks.push.apply(this.attacks, newAttacks);
                }
                if (atk.done) {
                    this.attacks.splice(i, 1);
                } else {
                    i++;
                }
            }
        },

        nextRoom: function(room) {
            this.room = room;
            this.attacks = [];
        },

        addAttack: function(skill, attacker, target) {
            log.info('adding attacks for skill');
            _.each(skill.spec.specs, function(spec, i, specs) {
                if (spec.type === 'melee') {
                    // new melee from body
                    this.attacks.push(new MeleeAttack(spec, attacker, target));
                } else if (spec.type === 'proj') {
                    // new proj from body
                    this.attacks.push(new ProjAttack(spec, attacker, target));
                } else if (spec.type === 'cone') {
                    // new cone from body
                } else if (spec.type === 'circle') {
                    // new circle from body
                }
            }, this);
        },
    });

    var Attack = gl.Model.extend({
        getNewAttacks: function() {
            var temp = this.newAttacks;
            this.newAttacks = [];
            return temp;
        },

        handle: function(eventType) {
            var arr;
            if (eventType === 'hit') {
                arr = this.onHit;
            } else if (eventType === 'kill') {
                arr = this.onKill;
            } else if (eventType === 'remove') {
                arr = this.onRemove;
            }
            if (arr && arr.length) {
                _.each(arr, function(spec) {
                    if (spec.type === 'proj') {
                        // new proj from attack
                    } else if (spec.type === 'cone') {
                        // new cone from attack
                    } else if (spec.type === 'circle') {
                        // new cricle from attack
                    }
                }, this);
            }
        },

        hit: function(enemy) {
            var dmgDealt = enemy.takeDamage(this);
            this.attacker.handleHit(enemy, this.leech);
            this.handle('hit');
            if (!enemy.isAlive()) {
                this.handle('kill');
            }
            this.handle('remove');
            this.done = true;
        },
    });

    var ProjAttack = Attack.extend({
        initialize: function(spec, attacker, target) {
            this.newAttacks = [];
            log.info('Adding proj attack');
            _.extend(this, spec);
            this.attacker = attacker;
            this.target = target;

            this.start = [attacker.x, attacker.y];
            this.pos = [attacker.x, attacker.y];
            this.velocity = vector.velocity(this.start, [target.x, target.y], this.rate);

            this.curTime = gl.time;
            this.fireTime = gl.time + spec.speed / 2;
            log.warning('projectile created, pos: %d %d, velocity %d %d', this.pos[0], this.pos[1], this.velocity[0], this.velocity[1]);
        },

        tick: function(enemies) {
            if (gl.time <= this.fireTime) {
                this.curTime = gl.time;
                return;
            }
            var travelTime = gl.time - this.fireTime;
            var nextPos = [this.start[0] + this.velocity[0] * travelTime, this.start[1] + this.velocity[1] * travelTime];

            for (var i = 0; i < enemies.length; i++) {
                var didHit = vector.hit(this.pos, nextPos, [enemies[i].x, enemies[i].y], 200, 200);
                if (didHit && enemies[i].isAlive()) {
                    this.pos = nextPos;
                    this.hit(enemies[i]);
                    break;
                }
            }
            //log.info('projectile moving, from pos: %d %d to %d %d', this.pos[0], this.pos[1], nextPos[0], nextPos[1]);
            this.pos = nextPos;
            this.curTime = gl.time;
        },
    });

    var AOEAttack = Attack.extend({
        advance: function(enemies, room) {},
    });

    var MeleeAttack = Attack.extend({
        initialize: function(spec, attacker, target) {
            this.newAttacks = [];
            log.info('Adding melee attack');
            _.extend(this, spec);
            this.attacker = attacker;
            this.target = target;

            this.start = [attacker.x, attacker.y];
            this.pos = [attacker.x, attacker.y];
            this.startTime = gl.time;
            this.endTime = gl.time + spec.speed / 2;
            this.totalTime = spec.speed / 2;
        },

        tick: function() {
            var pct = (gl.time - this.startTime) / this.totalTime;
            if (pct < 1) {
                this.pos = vector.pctCloser(this.start, [this.target.x, this.target.y], pct);
            } else {
                this.pos = [this.target.x, this.target.y];
                this.hit(this.target);
            }
        },
    });

    exports.extend({
        AttackManager: AttackManager
    });
});