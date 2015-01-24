namespace.module('bot.main', function (exports, require) {

    var log = namespace.bot.log;
    var inv = namespace.bot.inv;
    var menu = namespace.bot.menu;
    var entity = namespace.bot.entity;
    var zone = namespace.bot.zone;
    //var views = namespace.bot.views;

    var STEP_SIZE = 10;

    function onReady() {

        localStorage.clear();

        log.info('onReady');

        var gameModel = new GameModel();

        var gameView = new namespace.bot.window.GameView(gameModel);
        //var m = new menu.TabView();

        $(window).on('keydown', function(event) {
            var SPACE = 32;
            var EKEY = 101;
            //var DKEY = 100;
            var SKEY = 115;
            var UP = 38;
            var DN = 40;
            var key = event.keyCode;
            if (key == SPACE) {
                window.GameEvents.trigger('togglePause');
            } else if (key == EKEY) {
                //Cheat for adding 1000xp (for easier testing)
                log.warning("XP Cheat!");                
                gameModel.hero.applyXp(1000);
            } else if (key == SKEY) {
                log.warning("Time Cheat!");
                gameModel.lastTime -= 100000;
            } else if (key === UP) {
                gameModel.timeCoefficient *= 2;
                log.error('Time coefficient now %.2f', gameModel.timeCoefficient);
            } else if (key === DN) {
                gameModel.timeCoefficient /= 2;
                log.error('Time coefficient now %.2f', gameModel.timeCoefficient);
            }
        });
    }

    var GameModel = window.Model.extend({

        initialize: function() {
            window.time = 0;
            this.timeCoefficient = 1;

            this.running = false;
            this.inZone = false;

            window.messages = new namespace.bot.messages.Messages();

            this.inv = new inv.ItemCollection();
            this.hero = new entity.newHeroSpec(this.inv);
            this.zone = new zone.ZoneManager(this.hero);

            this.lastTime = new Date().getTime();
            this.zonesCleared = 0;
            this.deaths = 0;

            this.listenTo(window.GameEvents, 'unpause', this.start);
            this.listenTo(window.GameEvents, 'pause', this.pause);
            this.listenTo(window.GameEvents, 'togglePause', this.toggle);
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

        /*ensureRoom: function() {
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
        },*/

        tick: function() {
            log.debug('begin tick');

            var thisTime = new Date().getTime();
            var dt = (thisTime - this.lastTime) * this.timeCoefficient;
            this.lastTime = thisTime;

            var steps = Math.floor(dt / STEP_SIZE);
            var extra = dt * STEP_SIZE;
            for (var i = 0; i < steps; i++) {
                window.time += STEP_SIZE;
                this.zone.zoneTick();
            }
            window.time += extra;
            this.zone.zoneTick();

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
