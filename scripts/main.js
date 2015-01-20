namespace.module('bot.main', function (exports, require) {

    var log = namespace.bot.log;
    var inv = namespace.bot.inv;
    var menu = namespace.bot.menu;
    var entity = namespace.bot.entity;
    var zone = namespace.bot.zone;
    //var views = namespace.bot.views;

    var DT = 10;

    function onReady() {
        //window.msgs = new namespace.bot.messages.MessageCollection();

        localStorage.clear();

        log.info('onReady');

        var gameModel = new GameModel();

        // var gameView = new namespace.bot.window.GameView({gameModel: gameModel, messageCollection: window.msgs});
        //var m = new menu.TabView();

        $(window).on('keypress', function(event) {
            var SPACE = 32;
            var EKEY = 101;
            //var DKEY = 100;
            var SKEY = 115;
            if (event.keyCode == SPACE) {
                gameModel.toggle();
            } else if (event.keyCode == EKEY) {
                //Cheat for adding 1000xp (for easier testing)
                log.warning("XP Cheat!");                
                gameModel.hero.applyXp(1000);
            } else if (event.keyCode == SKEY) {
                log.warning("Time Cheat!");
                gameModel.lastTime -= 100000;
            }
        });
    }

    var GameModel = window.Model.extend({

        initialize: function() {
            this.running = false;
            this.inZone = false;

            window.msgs = new namespace.bot.messages.MessageCollection();
            //this.inv = new inv.InvModel();
            //this.inv = new inv.ItemCollection({}, []);

            //this.recipes = new inv.RecipeCollection();

            this.inv = new inv.ItemCollection();
            this.hero = new entity.newHero(this.inv);
            this.zone = new zone.ZoneManager(this.hero);

            // TODO remove recipes
            //this.recipesView = new inv.CraftItemCollectionView({collection: this.inv.recipes});

            //this.invView = new inv.InvItemCollectionView({collection: this.inv});
            //this.headerView = views.newHeaderView(this.hero, this.inv, this.zone);

            this.lastTime = new Date().getTime();
            this.zonesCleared = 0;
            this.deaths = 0;
        },

        start: function() {
            log.info('start');
            this.lastTime = new Date().getTime();
            this.running = true;
            requestAnimFrame(this.tick.bind(this));
        },

        pause: function() {
            log.info('pause');
            this.running = false;
        },

        toggle: function() {
            log.info('toggle');
            if (this.running) {
                this.pause();
            } else {
                this.start();
            }
        },

        stop: function() {
            this.running = false;
            this.hero.revive();
            //this.zone = undefined;  // this.zone.destroy();
            this.inZone = false;
        },

        ensureRoom: function() {
            if (!this.inZone || !this.hero.hp || this.hero.hp <= 0 || this.zone.done()) {
                log.info('Getting new zone, recomputing hero attrs');
                this.hero.computeAttrs();
                this.hero.revive();
                this.zone.newZone('spooky dungeon', this.hero.level);
                this.inZone = true;
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
                this.hero.update(DT);
                room.monsters.update(DT);

                this.hero.tryDoStuff(room);

                if (this.zone.done()) {
                    this.zonesCleared++;
                    this.inZone = false;
                    room = this.ensureRoom();
                    continue;
                }

                if (this.zone.nextRoom()) {
                    room = this.zone.getCurrentRoom();
                }

                // TODO: trydostuff is called once per monster regardless of if hero is alive
                //   not really a bug, but imperfect behavior
                room.monsters.tryDoStuff(room);

                if (!this.hero.isAlive()) {
                    this.deaths++;
                    this.inZone = false;
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

            window.DirtyQueue.mark('vis');

            window.DirtyQueue.triggerAll(window.DirtyListener);

            if (this.running) {
                requestAnimFrame(this.tick.bind(this));
            }
        },
    });

    exports.extend({
        onReady: onReady,
        GameModel: GameModel
    });

});
