namespace.module('bot.main', function (exports, require) {

    exports.extend({
        onReady: onReady
    });

    var log = namespace.bot.log;
    var inv = namespace.bot.inv;
    var menu = namespace.bot.menu;
    var entity = namespace.bot.entity;
    var zone = namespace.bot.zone;

    function onReady() {
        localStorage.clear();

        log.info('onReady');
        var gameModel = new GameModel();

        var gameView = new namespace.bot.window.GameView();
        var m = new menu.TabView();

        //var invModel = new inv.InvModel();
        //var invMenuView = new inv.InvMenuView({model: invModel});
        //var craftMenuView = new inv.CraftMenuView({model: invModel});
        //var lvlupMenuView = new inv.LvlupMenuView({model: invModel});

        gameModel.start();
    }

    var GameModel = Backbone.Model.extend({
        defaults: function() {
            return {
                running: false,
                inZone: false
            }
        },

        initialize: function() {
            this.inv = new inv.InvModel();

            this.char = new entity.newChar(this.inv);

            this.lastTime = new Date().getTime();
        },

        start: function() {
            log.info('start');
            this.set({running: true});
            requestAnimFrame(this.tick.bind(this));
        },

        stop: function() {
            this.set({running: false});
        },

        tick: function() {
            log.info('begin tick');
            if (new Date().getTime() > window.STOP_AFTER) {
                console.log('done');
                this.stop();
                return;
            }

            if (!this.get('inZone')) {
                this.zone = zone.newZoneModel(this.char);
                this.set('inZone', true);
            }
            if (!this.char.get('hp') || this.char.get('hp') <= 0 || this.zone.done()) {
                log.info('Getting new zone, recomputing char attrs');
                this.char.computeAttrs();
                this.zone = zone.newZoneModel(this.char);
            }

            var thisTime = new Date().getTime();
            var monsters = this.zone.getCurrentRoom().monsters;  // type MonsterCollection
            //for (var t = this.lastTime; t < thisTime; t += 2) {
            for (var t = this.lastTime; t < thisTime; t += thisTime - this.lastTime) {
                log.debug('tick calling update functions');
                // pass new time to char and all monsters
                this.char.update(t);
                monsters.update(t);

                this.char.tryDoStuff(monsters.models);

                // Check if cleared / done, if so get out
                if (monsters.cleared()) {
                    if (this.zone.done()) {
                        break;
                    }
                    this.zone.nextRoom();
                    monsters = this.zone.getCurrentRoom().monsters;
                    continue;
                }

                monsters.tryDoStuff([this.char]);

                if (!this.char.isAlive()) {
                    break;
                }
            }

            this.lastTime = thisTime;

            if (this.get('running')) {
                requestAnimFrame(this.tick.bind(this));
            }
        },
    });

});


window.STOP_AFTER = new Date().getTime() + 3000;