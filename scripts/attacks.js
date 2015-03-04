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
            _.each(this.attacks, function(attack, i) {
                var enemies = livingBodies[attack.targetTeam];
                if (enemies === undefined) {
                    console.log('fuck');
                }
                attack.tick(enemies);
            }, this);
            var atk;
            var newAttacks;
            for (var i = 0; i < this.attacks.length; i++) {
                atk = this.attacks[i];
                newAttacks = atk.getNewAttacks();
                if (newAttacks.length) {
                    log.warning('Adding %d child attacks!', newAttacks.length);
                    this.attacks.push.apply(this.attacks, newAttacks);
                }
                if (atk.done) {
                    this.attacks.splice(i, 1);
                    i--;
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
                    this.attacks.push(new MeleeAttack(spec, attacker, target));
                } else if (spec.type === 'proj') {
                    this.attacks.push.apply(this.attacks, newProjsFromBody(spec, attacker, target));
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

        handle: function(eventType, enemy) {
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
                    log.info(eventType);
                    if (spec.type === 'proj') {
                        this.newAttacks.push.apply(this.newAttacks, newChildProjs(spec, this, enemy));
                        log.warning('Added new child projs to new attacks, len: %d', this.newAttacks.length);
                        //gl.addProjectileAttack(spec, this.attacker, this.pos, this.velocity, this.targetTeam, true);
                    } else if (spec.type === 'cone') {
                        // new cone from attack
                    } else if (spec.type === 'circle') {
                        // new circle from attack
                    }
                }, this);
            }
        },

        hit: function(enemy) {
            this.hitHeight = enemy.fireHeight();

            var dmgDealt = enemy.takeDamage(this);

            this.attacker.handleHit(enemy, this);
            this.handle('hit', enemy);
            if (!enemy.isAlive()) {
                this.handle('kill', enemy);
            }
            this.handle('remove');
            this.done = true;
        },
    });

    function newProjsFromBody(spec, attacker, target) {
        var vector = target.pos.sub(attacker.pos);
        var fireTime = gl.time + spec.speed / 2;
        var angles = getProjAngles(spec.projCount, spec.angle);
        return _.map(angles, function(angle) {
            return new ProjAttack(spec, attacker, target.spec.team, attacker.pos, vector.rotate(angle), fireTime);
        });
    }

    function newChildProjs(spec, atk, enemy) {
        var angles = getProjAngles(spec.projCount, spec.angle);

        return _.map(angles, function(angle) {
            return new ProjAttack(spec, atk.attacker, atk.targetTeam, atk.pos, atk.velocity.rotate(angle), gl.time, enemy);
        });
    }

    function getProjAngles(projCount, angle) {
        var angles = [];

        if (projCount === 1) {
            angles.push(0);
        } else {
            var s, e;
            if (projCount % 2 === 0) {
                e = angle * (0.5 + (projCount - 2) / 2);
                s = -e;
            } else {
                e = angle * (projCount - 1) / 2;
                s = -e;
            }
            for (var a = s; a <= e; a += angle) {
                angles.push(a);
            }
        }
        return angles;
    }

    var ProjAttack = Attack.extend({
        initialize: function(spec, attacker, targetTeam, start, vector, fireTime, immuneTarget) {
            this.newAttacks = [];
            _.extend(this, spec);

            this.attacker = attacker;
            this.targetTeam = targetTeam;
            this.start = start.clone();
            this.pos = start.clone();
            this.fireTime = fireTime;

            if (immuneTarget) {
                this.immuneTargetId = immuneTarget.id;
            }

            this.radius = spec.radius ? spec.radius : Math.pow(2, 16);
            this.velocity = vector.unitVector().mult(spec.rate);
            this.z = attacker.spec.height / 2;
            this.color = spec.color ? spec.color : '#fff';

            log.debug('projectile created, pos: %s, velocity: %s', this.pos, this.velocity);
        },

        tick: function(enemies) {
            if (gl.time <= this.fireTime) {
                return;
            }
            var elapsedTime = gl.time - this.fireTime;
            var nextPos = this.start.add(this.velocity.mult(elapsedTime));

            for (var i = 0; i < enemies.length; i++) {
                if (enemies[i].id === this.immuneTargetId) {
                    log.debug('Intentionally avoiding immune target');
                    continue;
                }
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
            this.targetTeam = target.spec.team;

            this.velocity = this.target.pos.sub(this.attacker.pos);

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