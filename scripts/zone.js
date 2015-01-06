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
            if (!options.char) {
                throw('no char given to zone manager');
            }
            this.char = options.char;
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
                    monsters: monsters,
                    door: [1000000, 500000],
                    char: undefined
                };
            }
            data.charPos = 0;
            data.rooms = rooms;
            data.rooms[0].char = this.char;
            data.initialized = true;
            this.set(data);
            window.gevents.trigger('zone:newZone');
        },

        getCurrentRoom: function() {
            return this.get('rooms')[this.get('charPos')];
        },

        roomCleared: function() {
            return this.getCurrentRoom().monsters.cleared();
        },

        nextRoom: function() {
            var rval = false;
            if (this.done()) {
                rval = true;
            } else if (this.roomCleared() &&
                       vector.equal(this.char.getCoords(), this.getCurrentRoom().door)) {
                this.getCurrentRoom().char = undefined;
                this.set({
                    'charPos': this.get('charPos') + 1
                });
                var curRoom = this.getCurrentRoom();
                curRoom.char = this.char;
                this.char.initPos();
                window.gevents.trigger('zone:nextRoom', curRoom);
                rval = true;
            }
            return rval;
        },

        done: function() {
            if (this.roomCleared() &&
                this.get('charPos') === this.get('rooms').length - 1) {
                return true;
            }
            return false;
        }
    });

    var MonsterCollection = Backbone.Collection.extend({
        model: entity.MonsterModel,

        initialize: function(models) {
            //this.livingCount = models.length;
            this.listenTo(window.gevents, 'monsters:death', this.onDeath);
        },

        onDeath: function() {
            //this.livingCount--;
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
