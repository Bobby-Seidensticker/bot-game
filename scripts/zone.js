namespace.module('bot.zone', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var entity = namespace.bot.entity;
    var prob = namespace.bot.prob;
    var itemref = namespace.bot.itemref;
    var vector = namespace.bot.vector;

    var ZoneManager = window.Model.extend({
        initialize: function(hero) {
            this.initialize = false;
            this.level = 1;
            this.hero = hero;
            this.newZone('spooky dungeon', 1);
        },

        newZone: function(name, level) {
            var i, j, rooms, monsters, count, data;

            _.extend(this, itemref.expand('zone', name));
            rooms = [];
            for (i = 0; i < this.roomCount; i++) {
                count = 1 + prob.pProb(this.quantity);

                monsters = new MonsterCollection(_.map(_.range(count), function() {
                    return {
                        name: this.choices[prob.pick(this.weights)],
                        level: level
                    };
                }, this));

                rooms[i] = {
                    monsters: monsters,
                    door: [1000000, 500000],
                    hero: undefined
                };
            }
            //log.info('ZoneManager newZone %s', monsters.reduce(function(m, n) {
            //    return m + n.get('name') + ", "}, ""));

            this.heroPos = 0;
            this.rooms = rooms;
            this.rooms[0].hero = this.hero;
            this.initialized = true;
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

    var MonsterCollection = window.Model.extend({
        initialize: function(models) {
            this.models = _.map(models, function(model) { return new entity.MonsterModel(model); });
        },

        update: function(t) {
            _.each(this.models, function(monster) { monster.update(t) }, this);
        },

        tryDoStuff: function(room) {
            _.invoke(this.models, 'tryDoStuff', room);
        },

        living: function() {
            return _.filter(this.models, function(m) { return m.isAlive(); });
        },

        cleared: function() {
            return !(_.find(this.models, function(monster) { return monster.isAlive(); }));
        }
    });

    exports.extend({
        ZoneManager: ZoneManager
    });
});
