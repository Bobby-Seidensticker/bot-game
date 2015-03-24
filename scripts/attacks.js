namespace.module('bot.attacks', function(exports, require) {

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
                    log.error('Attackmanager tick: no enemies %d', attack.targetTeam);
                }
                attack.tick(enemies);
            }, this);
            var atk;
            var newAttacks;
            for (var i = 0; i < this.attacks.length; i++) {
                atk = this.attacks[i];
                newAttacks = atk.getNewAttacks();
                if (newAttacks.length) {
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
                    this.attacks.push(newConeFromBody(spec, attacker, target));
                    // new cone from body
                } else if (spec.type === 'circle') {
                    this.attacks.push(newCircleFromBody(spec, attacker, target));
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
            var arr = eventToArr(this, eventType);
            if (arr === undefined || arr.length < 1) {
                return;
            }
            _.each(arr, function(spec) {
                if (spec.type === 'proj') {
                    this.newAttacks.push.apply(this.newAttacks, newChildProjs(spec, this, enemy));
                    log.info('Added new child projs to new attacks, len: %d', this.newAttacks.length);
                } else if (spec.type === 'cone') {
                    this.newAttacks.push(newChildCone(spec, this, enemy));
                } else if (spec.type === 'circle') {
                    this.newAttacks.push(newChildCircle(spec, this, enemy));
                }
            }, this);
        },

        hit: function(enemy) {
            this.hitHeight = enemy.fireHeight();

            if (enemy.rollHit(this)) {
                var result = enemy.takeDamage(this);
                this.attacker.handleHit(enemy, this, result);
                this.handle('hit', enemy);
                if (!enemy.isAlive()) {
                    this.handle('kill', enemy);
                }
            }
        },

        remove: function() {
            this.handle('remove');
            this.done = true;
        }
    });

    function eventToArr(atk, eventType) {
        return atk['on' + eventType[0].toUpperCase() + eventType.slice(1)];
    }

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
            return new ProjAttack(spec, atk.attacker, atk.targetTeam, atk.pos, atk.vector.rotate(angle), gl.time, enemy);
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

            this.vector = vector.unitVector().mult(this.projSpeed);
            this.z = attacker.spec.height / 2;
            if (!this.color) { this.color = '#fff'; }
            if (!this.projRadius) { this.projRadius = Math.pow(2, 16); }

            log.debug('projectile created, pos: %s, vector: %s', this.pos, this.vector);
        },

        tick: function(enemies) {
            if (gl.time <= this.fireTime) {
                return;
            }
            var elapsedTime = gl.time - this.fireTime;
            var nextPos = this.start.add(this.vector.mult(elapsedTime));

            for (var i = 0; i < enemies.length; i++) {
                if (enemies[i].id === this.immuneTargetId) {
                    log.debug('Intentionally avoiding immune target');
                    continue;
                }
                if (vu.hit(this.pos, nextPos, enemies[i].pos, enemies[i].spec.width, this.projRadius)) {
                    log.debug('projectile hit!, traveled %s to %s, enemy at %s', this.pos, nextPos, enemies[i].pos);
                    this.hit(enemies[i]);
                    this.remove();
                    break;
                }
            }
            log.debug('proj moving from %s to %s', this.pos, nextPos);
            this.pos = nextPos;

            if (this.pos.sub(this.start).len2() > this.projRange * this.projRange) {
                this.remove();
            }
        },
    });

    function newConeFromBody(spec, attacker, target) {
        var vector = target.pos.sub(attacker.pos);
        var fireTime = gl.time + spec.speed / 2;
        return new ConeAttack(spec, attacker, target.spec.team, attacker.pos, vector, fireTime);
    }

    function newChildCone(spec, atk, enemy) {
        return new ConeAttack(spec, atk.attacker, atk.targetTeam, enemy.pos, atk.vector, gl.time);
    }

    var ConeAttack = Attack.extend({
        initialize: function(spec, attacker, targetTeam, start, vector, fireTime, immuneTarget) {
            this.newAttacks = [];
            _.extend(this, spec);

            this.attacker = attacker;
            this.targetTeam = targetTeam;
            this.start = start.clone();
            this.pos = start.clone();
            this.startTime = gl.time;
            this.fireTime = fireTime;

            this.immuneTargetIds = {};
            if (immuneTarget !== undefined) {
                this.immuneTargetIds[immuneTarget.id] = true;
            }

            this.vector = vector.unitVector().mult(this.aoeSpeed);
            this.z = 0;
            if (!this.color) { this.color = '#fff'; }
        },

        tick: function(enemies) {
            if (gl.time <= this.fireTime) {
                return;
            }
            var elapsedTime = gl.time - this.fireTime;
            var diff = this.vector.mult(elapsedTime);
            var nextPos = this.start.add(diff);
            log.debug('cone moving from %s to %s', this.pos, nextPos);
            this.pos = nextPos;

            for (var i = 0; i < enemies.length; i++) {
                if (this.immuneTargetIds[enemies[i].id]) {
                    log.debug('Intentionally avoiding immune target');
                    continue;
                }
                if (vu.coneHit(this.start, diff, this.angle, enemies[i].pos, enemies[i].spec.width)) {
                    this.hit(enemies[i]);
                    this.immuneTargetIds[enemies[i].id] = true;
                    break;
                }
            }

            if (this.pos.sub(this.start).len2() > this.aoeRadius * this.aoeRadius) {
                this.remove();
            }
        },
    });


    function newCircleFromBody(spec, attacker, target) {
        var vector = target.pos.sub(attacker.pos);
        var fireTime = gl.time + spec.speed / 2;
        return new CircleAttack(spec, attacker, target.spec.team, attacker.pos, vector, fireTime);
    }

    function newChildCircle(spec, atk, enemy) {
        return new CircleAttack(spec, atk.attacker, atk.targetTeam, enemy.pos, atk.vector, gl.time);
    }

    var CircleAttack = Attack.extend({
        initialize: function(spec, attacker, targetTeam, start, vector, fireTime, immuneTarget) {
            this.newAttacks = [];
            _.extend(this, spec);

            this.attacker = attacker;
            this.targetTeam = targetTeam;
            this.start = start.clone();
            this.pos = start.clone();
            this.startTime = gl.time;
            this.fireTime = fireTime;

            this.immuneTargetIds = {};
            if (immuneTarget !== undefined) {
                this.immuneTargetIds[immuneTarget.id] = true;
            }

            this.vector = vector.unitVector().mult(this.aoeSpeed);
            this.z = 0;
            if (!this.color) { this.color = '#fff'; }
        },

        tick: function(enemies) {
            if (gl.time <= this.fireTime) {
                return;
            }
            var elapsedTime = gl.time - this.fireTime;
            var diff = this.vector.mult(elapsedTime);
            var nextPos = this.start.add(diff);
            log.debug('circle moving from %s to %s', this.pos, nextPos);
            this.pos = nextPos;

            var radius = this.pos.sub(this.start).len();

            for (var i = 0; i < enemies.length; i++) {
                if (this.immuneTargetIds[enemies[i].id]) {
                    log.debug('Intentionally avoiding immune target');
                    continue;
                }
                if (enemies[i].pos.sub(this.start).len() < radius + enemies[i].spec.width) {
                    //if (vu.circleHit(this.start, diff, this.angle, enemies[i].pos, enemies[i].spec.width)) {
                    this.hit(enemies[i]);
                    this.immuneTargetIds[enemies[i].id] = true;
                    break;
                }
            }

            if (this.pos.sub(this.start).len2() > this.aoeRadius * this.aoeRadius) {
                this.remove();
            }
        },
    });

    var MeleeAttack = Attack.extend({
        initialize: function(spec, attacker, target) {
            this.newAttacks = [];
            _.extend(this, spec);
            this.attacker = attacker;
            this.target = target;
            this.targetTeam = target.spec.team;

            this.vector = this.target.pos.sub(this.attacker.pos);

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
                this.remove();
            }
        },
    });

    exports.extend({
        AttackManager: AttackManager
    });
});
