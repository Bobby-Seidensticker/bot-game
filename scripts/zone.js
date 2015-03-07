namespace.module('bot.zone', function (exports, require) {

    var TEAM_HERO = 0;
    var TEAM_MONSTER = 1;

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var entity = namespace.bot.entity;
    var prob = namespace.bot.prob;
    var itemref = namespace.bot.itemref;
    var vu = namespace.bot.vectorutils;
    var Point = vu.Point;
    var Damage = namespace.bot.damage.Damage;
    var HeroBody = namespace.bot.bodies.HeroBody;
    var MonsterBody = namespace.bot.bodies.MonsterBody;

    var ZoneManager = gl.Model.extend({
        initialize: function(hero) {
            this.allZones = itemref.ref.zone;
            this.zoneOrder = itemref.ref.zoneOrder.order;  // to be used later for rank increases

            this.hero = new HeroBody(hero);
            this.attackManager = new namespace.bot.attacks.AttackManager();

            // Expose attack manager functions for EntityBodies and chaining projectiles
            gl.addAttack = this.attackManager.addAttack.bind(this.attackManager);
            this.messages = new ZoneMessages();

            this.nextZone = 'spooky dungeon';
            this.unlockedZones = 0;
            this.newZone(this.nextZone);
        },

        toJSON: function() {
            return {
                nextZone: this.nextZone
            };
        },

        fromJSON: function(data) {
            _.extend(this, data);
            this.newZone(this.nextZone);  // this is redundent
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
                    //max room pop is i+1 (first room always only one monster)
                    count = Math.min((i / 2 + 1) * this.quantity[0], count);
                    for (var j = 0; j < count; j++) {
                        monsters.push(new MonsterBody(this.choices[prob.pick(this.weights)], this.level));
                    }
                    if (i === this.rooms.length - 1) {
                        monsters.push(new MonsterBody(this.boss, this.level));
                    }
                }
                _.extend(this.rooms[i], {monsters: monsters, hero: undefined, attackManager: undefined});
                _.each(this.rooms[i].monsters, function(mon) { mon.initPos(this.rooms[i]); }, this);
            }

            this.heroPos = 0;
            this.rooms[0].hero = this.hero;
            this.hero.revive();
            this.hero.initPos(this.rooms[0]);
            this.attackManager.nextRoom(this.rooms[0]);
            this.messages.nextRoom();
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

            size = new Point(prob.rand(lrange[0], lrange[1]), prob.rand(hrange[0], hrange[1]));
            pos = new Point(0, 0);
            ent = new Point(0, prob.middle50(size.y));

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
                    room.exit = new Point(prob.middle50(room.size.x), 0);
                } else {
                    room.exit = new Point(room.size.x, prob.middle50(room.size.y));
                }
                // old room is done
                // make corridor in the dir chosen

                absEnt = room.pos.add(room.exit);
                if (dir === 0) {
                    size = new Point(2, 5);
                    ent = new Point(1, 5);
                    pos = absEnt.sub(ent);
                    exit = new Point(1, 0);
                } else {
                    size = new Point(5, 2);
                    ent = new Point(0, 1);
                    pos = absEnt.sub(ent);
                    exit = new Point(5, 1);
                }
                room = {
                    size: size,
                    pos: pos,
                    ent: ent,
                    exit: exit
                };
                rooms.push(room);

                size = new Point(prob.rand(lrange[0], lrange[1]), prob.rand(hrange[0], hrange[1]));
                absEnt = room.pos.add(room.exit);

                if (dir === 0) {
                    size = size.flip();
                    ent = new Point(prob.middle50(size.x), size.y);
                    pos = absEnt.sub(ent);
                } else {
                    ent = new Point(0, prob.middle50(size.y));
                    pos = absEnt.sub(ent);
                }
                room = {
                    size: size,
                    pos: pos,
                    ent: ent
                };
                rooms.push(room);
            }

            for (var i = 0; i < rooms.length; i++) {
                rooms[i].size = rooms[i].size.mult(scale);
                rooms[i].pos = rooms[i].pos.mult(scale);
                rooms[i].ent = rooms[i].ent.mult(scale);
                if (rooms[i].exit) {
                    rooms[i].exit = rooms[i].exit.mult(scale);
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
                room.attackManager = undefined;
                this.heroPos += 1;

                room = this.rooms[this.heroPos];
                this.hero.initPos(room);
                room.hero = this.hero;
                this.attackManager.nextRoom(this.rooms[this.heroPos]);
                room.attackManager = this.attackManager;
                this.tryUnlockNextZone();
                gl.DirtyQueue.mark('zone:nextRoom');
            }
            var room = this.rooms[this.heroPos];
            return room;
        },

        tryUnlockNextZone: function() {
            if( this.zoneOrder.indexOf(this.nextZone) == this.unlockedZones &&
                this.heroPos == 29) {
                this.unlockedZones += 1;
                this.messages.addMessage({
                    text: "New Map Unlocked!",
                    type: "newlevel",
                    pos: this.hero.pos,
                    color: "#FFF",
                    lifespan: 5000,
                    verticalOffset: 0,
                    time: gl.time,
                    expires: gl.time + 5000});
                gl.DirtyQueue.mark('zone:unlocked');                
            } 
        },

        atExit: function() {
            var room = this.rooms[this.heroPos];
            return this.hero.pos.equal(room.exit);
        },

        zoneTick: function() {
            var room, mons, heroes;

            room = this.ensureRoom();
            mons = this.liveMons();
            this.hero.tryDoStuff(room, mons);

            if (this.done()) {
                return;
            }

            room = this.ensureRoom();

            mons = this.liveMons();
            _.each(mons, function(mon, i) {
                mon.tryDoStuff(room, this.liveHeroes());
            }, this);

            this.attackManager.tick([this.liveHeroes(), this.liveMons()]);

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

        liveHeroes: function() {
            if (this.hero.isAlive()) {
                return [this.hero];
            } else {
                return [];
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

        getAttacks: function() {
            return this.attackManager.getAttacks();
        },
    });

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
            // TODO: when messages die, make them pool on the ground, in iso fmt
            this.msgs = _.filter(this.msgs, function(msg) { return msg.expires > gl.time && (!(msg.type === 'dmg') || msg.dmg.getY() > 0) });
        },

        nextRoom: function() {
            this.msgs = [];
        }
    });

    exports.extend({
        ZoneManager: ZoneManager,
        MonsterBody: MonsterBody, //extended for use in test.js
        HeroBody: HeroBody
    });
});
