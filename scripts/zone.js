namespace.module('bot.zone', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var entity = namespace.bot.entity;
    var prob = namespace.bot.prob;

    var ZoneModel = Backbone.Model.extend({
        defaults: {
            rooms: [],
            charPos: 0,

            roomCount: 20,
            monsters: ['skeletons'],
            monsterQuantity: 2,
            level: 1,
	},

        initialize: function() {
            var i, j, trooms, monsters, monCount, monName;
            log.debug('ZoneModel initialize');

            trooms = [];

            for (i = 0; i < this.get('roomCount'); i++) {
                monsters = [];
                monCount = 1 + prob.pProb(this.get('monsterQuantity'));

                for (j = 0; j < monCount; j++) {
                    monName = this.get('monsters')[prob.pyRand(0, this.get('monsters').length)]
                    monsters[j] = entity.newMonster('monster', monName, this.get('level'));
                }

                trooms[i] = {
                    entities: monsters
                };
            }
            this.set({rooms: trooms});
	},

        // argument for using a backbone collection for each room:
        //   nicer syntax, maybe faster, filtering of submodels
        // in that world each room would be a Collection of entity models rather than an array, whatevs
        roomCleared: function() {
            var rooms, charPos, entities;

            rooms = this.get('rooms');
            charPos = this.get('charPos');

            var liveMons = _.filter(rooms[charPos], function(entity) {
                return entity.get('team') === 1 && entity.get('hp') > 0;
            });

            return liveMons === 0;
        },

        nextRoom: function() {
            var room;
            if (!this.done()) {
                return false;
            }
            room = this.get('rooms')[this.get('charPos')];
            
        },

        done: function() {
            if (this.get('charPos') === this.get('rooms').length - 1 &&
                this.roomCleared()) {
                return true;
            }
            return false;
        }
    });

    var zoneA = {
        roomCount: 20,
        monsters: ['skeletons'],
        monsterQuantity: 2,
        level: 1,

        // not in use
        tileset: 'forest',
        difficultyProgression: 2,  // starts at lvl - dp and goes to lvl + dp
        affixes: [],
    }

    var currentZone = new ZoneModel(zoneA);

    exports.extend({
        ZoneModel: ZoneModel,
    });
});

