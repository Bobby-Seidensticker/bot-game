namespace.module('bot.attacks', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();
    var log = namespace.bot.log;
    var vu = namespace.bot.vectorutils;
    var Point = vu.Point;

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

        getAttacks: function() {
            return this.attacks;
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
                        //if (spec.count 
                    } else if (spec.type === 'cone') {
                        // new cone from attack
                    } else if (spec.type === 'circle') {
                        // new circle from attack
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
            _.extend(this, spec);
            this.attacker = attacker;
            this.target = target;

            this.radius = spec.radius ? spec.radius : Math.pow(2, 16);

            this.start = attacker.pos.clone();
            this.pos = attacker.pos.clone();
            this.end = target.pos.clone();
            this.velocity = this.start.velocity(this.end, this.rate);

            this.fireTime = gl.time + spec.speed / 2;

            this.z = attacker.spec.height / 2;
            this.color = spec.color ? spec.color : '#fff';

            log.debug('projectile created, pos: %s, end: %s', this.pos, this.end);
        },

        tick: function(enemies) {
            if (gl.time <= this.fireTime) {
                return;
            }
            var elapsedTime = gl.time - this.fireTime;
            var nextPos = this.start.add(this.velocity.mult(elapsedTime));

            for (var i = 0; i < enemies.length; i++) {
                if (vu.hit(this.pos, nextPos, enemies[i].pos, enemies[i].spec.width, this.radius)) {
                    log.debug('projectile hit!, traveled %s to %s, enemy at %s', this.pos, nextPos, enemies[i].pos);
                    this.hit(enemies[i]);
                    break;
                }
            }
            log.debug('proj moving from %s to %s', this.pos, nextPos);
            this.pos = nextPos;
        },
    });

    var AOEAttack = Attack.extend({
        advance: function(enemies, room) {},
    });

    var MeleeAttack = Attack.extend({
        initialize: function(spec, attacker, target) {
            this.newAttacks = [];
            _.extend(this, spec);
            this.attacker = attacker;
            this.target = target;

            this.start = attacker.pos.clone();
            this.pos = attacker.pos.clone();
            this.startTime = gl.time;
            this.endTime = gl.time + spec.speed / 2;
            this.totalTime = spec.speed / 2;

            this.z = attacker.spec.height / 2;
            this.color = spec.color ? spec.color : '#fff';
        },

        tick: function() {
            var pct = (gl.time - this.startTime) / this.totalTime;
            if (pct < 1) {
                this.pos = this.start.pctCloser(this.target.pos, pct);
            } else {
                this.pos = this.target.pos;
                this.hit(this.target);
            }
        },
    });

    exports.extend({
        AttackManager: AttackManager
    });
});