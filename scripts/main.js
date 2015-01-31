namespace.module('bot.main', function (exports, require) {

    var log = namespace.bot.log;
    var inv = namespace.bot.inv;
    var menu = namespace.bot.menu;
    var entity = namespace.bot.entity;
    var zone = namespace.bot.zone;
    var views = namespace.bot.views;

    var STEP_SIZE = 10;

    function onReady() {

        localStorage.clear();

        log.info('onReady');

        var gameModel = new GameModel();

        var gameView = new views.GameView({}, gameModel);
        //        var gameView = new namespace.bot.window.GameView(gameModel);
        //$('body').html(gameView.el);
        //var m = new menu.TabView();

        $(window).on('keydown', function(event) {
            log.info('keydown, key: %d', event.keyCode);
            var SPACE = 32;
            var EKEY = 69;
            //var DKEY = 68;
            var SKEY = 84;
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
                gameModel.lastTime -= 1000 * 60;
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
            this.cardInv = new inv.CardTypeCollection();
            this.hero = new entity.newHeroSpec(this.inv, this.cardInv);
            this.zone = new zone.ZoneManager(this.hero);

            this.lastTime = new Date().getTime();
            this.zonesCleared = 0;
            this.deaths = 0;

            this.listenTo(window.GameEvents, 'unpause', this.start);
            this.listenTo(window.GameEvents, 'pause', this.pause);
            this.listenTo(window.GameEvents, 'togglePause', this.toggle);

            this.start();
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

        tick: function() {
            log.debug('begin tick');
            var thisTime = new Date().getTime();
            var dt = (thisTime - this.lastTime) * this.timeCoefficient;
            this.lastTime = thisTime;

            var steps = Math.floor(dt / STEP_SIZE);
            var extra = dt % STEP_SIZE;

            if (this.running) {
                for (var i = 0; i < steps; i++) {
                    window.time += STEP_SIZE;
                    this.zone.zoneTick();
                }
                if (extra > 0) {
                    window.time += extra;
                    this.zone.zoneTick();
                }
            }

            window.DirtyQueue.mark('vis');

            window.DirtyQueue.triggerAll(window.DirtyListener);

            requestAnimFrame(this.tick.bind(this));
        },
    });

    exports.extend({
        onReady: onReady,
        GameModel: GameModel
    });

});
