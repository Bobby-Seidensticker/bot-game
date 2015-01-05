namespace.module('bot.zone', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var entity = namespace.bot.entity;
    var prob = namespace.bot.prob;
    var itemref = namespace.bot.itemref;

    var ZoneManager = Backbone.Model.extend({
        defaults: {
            initialized: false,
            level: 1
        },

        initialize: function() {
            this.newZone('spooky dungeon', 1);
        },

        newZone: function(name, level) {
            var i, j, rooms, monsters, count, data;

            log.info('ZoneManager newZone');

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
                    monsters: monsters
                };
            }
            data.charPos = 0;
            data.rooms = rooms;
            data.initialized = true;
            this.set(data);
            window.gevents.trigger('zone:newZone');
        },

        getCurrentRoom: function() {
            return this.get('rooms')[this.get('charPos')];
        },

        roomCleared: function() {
            var room = this.getCurrentRoom()

            return room.monsters.livingCount === 0;
        },

        nextRoom: function() {
            if (this.roomCleared() && !this.done()) {
                this.set({
                    'charPos': this.get('charPos') + 1
                });
                window.gevents.trigger('zone:nextRoom');

                return true;
            }
            log.debug('Zone.nextRoom() fail');
            return false;
        },

        done: function() {
            if (this.get('charPos') === this.get('rooms').length - 1 &&
                this.roomCleared()) {
                return true;
            }
            return false;
        }
    });

    var MonsterCollection = Backbone.Collection.extend({
        model: entity.MonsterModel,

        initialize: function(models) {
            this.livingCount = models.length;
            this.on('death', this.onDeath);
        },

        onDeath: function() {
            this.livingCount--;
        },

        update: function(t) {
            this.each(function(monster) { monster.update(t) });
        },

        tryDoStuff: function(enemies) {
            this.invoke('tryDoStuff', enemies);
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
