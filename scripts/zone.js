namespace.module('bot.zone', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var entity = namespace.bot.entity;
    var prob = namespace.bot.prob;
    var itemref = namespace.bot.itemref;
    var vector = namespace.bot.vector;

    var ZoneManager = Backbone.Model.extend({
        defaults: {
            initialized: false,
            level: 1
        },

        initialize: function(options) {
            options = options || {};
            if (!options.hero) {
                throw('no hero given to zone manager');
            }
            this.hero = options.hero;
            this.newZone('spooky dungeon', 1);
        },

        newZone: function(name, level) {
            var i, j, rooms, monsters, count, data;



            data = itemref.expand('zone', name);
            rooms = [];
            for (i = 0; i < data.roomCount; i++) {
                count = 1 + prob.pProb(data.quantity);
                
                monsters = new MonsterCollection(_.map(_.range(count), function() {
                    return {
                        name: data.choices[prob.pick(data.weights)],
                        level: level
                    };
                }));

                rooms[i] = {
                    monsters: monsters,
                    door: [1000000, 500000],
                    hero: undefined
                };
            }
            log.info('ZoneManager newZone%s', monsters.reduce(function(m, n) {
                return m + n.get('name') + ", "}, ""));
            
            data.heroPos = 0;
            data.rooms = rooms;
            data.rooms[0].hero = this.hero;
            data.initialized = true;
            this.set(data);
            window.DirtyQueue.mark('zone:newZone');
        },

        getCurrentRoom: function() {
            return this.get('rooms')[this.get('heroPos')];
        },

        roomCleared: function() {
            return this.getCurrentRoom().monsters.cleared();
        },

        nextRoom: function() {
            var rval = false;
            if (this.done()) {
                rval = true;
            } else if (this.roomCleared() &&
                       vector.equal(this.hero.getCoords(), this.getCurrentRoom().door)) {
                this.getCurrentRoom().hero = undefined;
                this.set({
                    'heroPos': this.get('heroPos') + 1
                });
                var curRoom = this.getCurrentRoom();
                curRoom.hero = this.hero;
                this.hero.initPos();
                window.DirtyQueue.mark('zone:nextRoom');
                rval = true;
            }
            return rval;
        },

        done: function() {
            if (this.roomCleared() &&
                this.get('heroPos') === this.get('rooms').length - 1) {
                return true;
            }
            return false;
        }
    });

    var MonsterCollection = Backbone.Collection.extend({
        model: entity.MonsterModel,

        initialize: function(models) {
        },

        update: function(t) {
            this.each(function(monster) { monster.update(t) });
        },

        tryDoStuff: function(room) {
            this.invoke('tryDoStuff', room);
        },

        living: function() {
            return this.filter(function(m) { return m.isAlive(); });
        },

        cleared: function() {
            return !(this.find(function(monster) { return monster.isAlive(); }));
        }
    });

    exports.extend({
        ZoneManager: ZoneManager
    });
});
