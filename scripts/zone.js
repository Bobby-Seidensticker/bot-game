namespace.module('bot.zone', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var entity = namespace.bot.entity;
    var prob = namespace.bot.prob;

    var ZoneModel = Backbone.Model.extend({
        defaults: {
            rooms: [],
            charPos: 0,
            roomCount: 3, //20,
            monsterChoices: ['skeleton'],

            monsterQuantity: 2,
            level: 1,
        },

        initialize: function() {
            var i, j, rooms, monsters, count, names, choices, level;
            log.debug('ZoneModel initialize');

            rooms = [];

            for (i = 0; i < this.get('roomCount'); i++) {
                count = 1 + prob.pProb(this.get('monsterQuantity'));
                choices = this.get('monsterChoices');
                level = this.get('level');

                monsters = new MonsterCollection(_.map(_.range(count), function() {
                    return {
                        name: choices[prob.pyRand(0, choices.length)],
                        level: level
                    };
                }));

                rooms[i] = {
                    monsters: monsters
                };
            }
            this.set({
                rooms: rooms,
                curMonsters: rooms[this.get('charPos')]
            });
        },

        getCurrentRoom: function() {
            return this.get('rooms')[this.get('charPos')];
        },

        roomCleared: function() {
            var room = this.getCurrentRoom()
            return room.monsters.cleared();
        },

        nextRoom: function() {
            if (this.roomCleared() && !this.done()) {
                log.debug('Zone.nextRoom() success, pos: %d', this.get('charPos'));
                this.set({
                    'charPos': this.get('charPos') + 1
                });
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

        update: function(t) {
            this.each(function(monster) { monster.update(t) });
        },

        tryDoStuff: function() {
            this.invoke('tryDoStuff');
        },

        cleared: function() {
            return !(this.find(function(monster) { return monster.isAlive(); }));
        }
    });

    function newZoneModel(char) {
        return new ZoneModel({char: char});
    }

    exports.extend({
        newZoneModel: newZoneModel
    });

    (function() {
        var currentZone = new ZoneModel();
    })();
});
