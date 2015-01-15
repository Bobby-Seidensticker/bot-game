namespace.module('bot.main', function (exports, require) {

    var log = namespace.bot.log;
    var inv = namespace.bot.inv;
    var menu = namespace.bot.menu;
    var entity = namespace.bot.entity;
    var zone = namespace.bot.zone;
    var views = namespace.bot.views;

    var DT = 10;

    function onReady() {
        // TODO: put this in events.js and name it properly
        window.gevents = _.extend({}, Backbone.Events);
        window.msgs = new namespace.bot.messages.MessageCollection();

        localStorage.clear();

        log.info('onReady');

        var gameModel = new GameModel();

        var gameView = new namespace.bot.window.GameView({gameModel: gameModel, messageCollection: window.msgs});
        var m = new menu.TabView();

        $(window).on('keypress', function(event) {
            var SPACE = 32;
            var EKEY = 101;
            var DKEY = 100;
            var SKEY = 115;
            if (event.keyCode == SPACE) {
                gameModel.toggle();
            } else if (event.keyCode == EKEY) {
                //Cheat for adding 1000xp (for easier testing)
                log.warning("XP Cheat!");                
                gameModel.char.applyXp(1000);
            } else if (event.keyCode == DKEY) {
                //Cheat for dropping 50 of each currency
                log.warning("Currency Cheat!");
                var matTypes = ["embers", "mints", "planks", "poops", "skulls", "sparks", "tumors"];
                _.each(matTypes, function(mat) {
                    gameModel.char.get('inv').addDrops(['50 ' + mat]);
                });
            } else if (event.keyCode == SKEY) {
                log.warning("Time Cheat!");
                gameModel.lastTime -= 100000;
            }
        });
    }

    var GameModel = Backbone.Model.extend({
        defaults: function() {
            return {
                running: false,
                inZone: false
            }
        },

        initialize: function() {
            //this.inv = new inv.InvModel();
            //this.inv = new inv.ItemCollection({}, []);

            //this.recipes = new inv.RecipeCollection();

            this.inv = new inv.ItemCollection();
            this.char = new entity.newChar(this.inv);
            this.zone = new zone.ZoneManager({char: this.char});

            // TODO remove recipes
            this.recipesView = new inv.CraftItemCollectionView({collection: this.inv.recipes});

            this.invView = new inv.InvItemCollectionView({collection: this.inv});
            this.headerView = views.newHeaderView(this.char, this.inv, this.zone);

            this.lastTime = new Date().getTime();
            this.zonesCleared = 0;
            this.deaths = 0;
        },

        start: function() {
            log.info('start');
            this.lastTime = new Date().getTime();
            this.set({running: true});
            requestAnimFrame(this.tick.bind(this));
        },

        pause: function() {
            log.info('pause');
            this.set({running: false});
        },

        toggle: function() {
            log.info('toggle');
            if (this.get('running')) {
                this.pause();
            } else {
                this.start();
            }
        },

        stop: function() {
            this.set({running: false});
            this.char.revive();
            //this.zone = undefined;  // this.zone.destroy();
            this.set('inZone', false);
        },

        ensureRoom: function() {
            if (!this.get('inZone') || !this.char.get('hp') || this.char.get('hp') <= 0 || this.zone.done()) {
                log.info('Getting new zone, recomputing char attrs');
                this.char.computeAttrs();
                this.char.revive();
                this.zone.newZone('spooky dungeon', this.char.get('level'));
                this.set('inZone', true);
            }
            return this.zone.getCurrentRoom();
        },

        updateModels: function() {
            var room = this.ensureRoom();

            // TODO No more 'actual' time, only fake time that is incremented whenever seen fit, should be a global
            var thisTime = new Date().getTime();
            var steps = Math.floor((thisTime - this.lastTime) / DT);

            for (var i = steps; i--;) {
                // TODO: Change update to "check if you have anything to do"
                window.msgs.update(DT);
                this.char.update(DT);
                room.monsters.update(DT);

                this.char.tryDoStuff(room);

                if (this.zone.done()) {
                    this.zonesCleared++;
                    this.set('inZone', false);
                    room = this.ensureRoom();
                    continue;
                }

                if (this.zone.nextRoom()) {
                    room = this.zone.getCurrentRoom();
                }

                // TODO: trydostuff is called once per monster regardless of if char is alive
                //   not really a bug, but imperfect behavior
                room.monsters.tryDoStuff(room);

                if (!this.char.isAlive()) {
                    this.deaths++;
                    this.set('inZone', false);
                    room = this.ensureRoom();
                    continue;
                }
            }

            this.lastTime += steps * DT;

            if (steps > 1000) {
                var dt = (new Date().getTime() - thisTime) / 1000;
                log.warning('Took a big jump forward, ran %d loops in %.3f seconds, %.2f X real time',
                            steps,
                            dt,
                            (steps / (1000 / DT)) / dt);
            }
        },

        tick: function() {
            log.debug('begin tick');

            this.updateModels();

            window.Events.mark('vis');

            window.Events.triggerAll(window.gevents);

            if (this.get('running')) {
                requestAnimFrame(this.tick.bind(this));
            }
        },
    });

    exports.extend({
        onReady: onReady,
        GameModel: GameModel
    });

});
