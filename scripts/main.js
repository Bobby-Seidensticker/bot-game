namespace.module('bot.main', function (exports, require) {

    var log = namespace.bot.log;
    var inv = namespace.bot.inv;
    var menu = namespace.bot.menu;
    var entity = namespace.bot.entity;
    var zone = namespace.bot.zone;
    var views = namespace.bot.views;
    var dropsLib = namespace.bot.drops

    var STEP_SIZE = 10;

    function onReady() {

        localStorage.clear();

        log.info('onReady');

        var gameModel = new GameModel();
        gl.game = gameModel;

        var gameView = new views.GameView({}, gameModel);

        var keyHandler = new KeyHandler(gameModel);
        $(window).on('keydown', keyHandler.onKeydown.bind(keyHandler));
    }

    var GameModel = gl.Model.extend({
        initialize: function() {
            gl.time = 0;
            this.timeCoefficient = 1;

            this.running = false;
            this.inZone = false;

            gl.messages = new namespace.bot.messages.Messages();

            this.inv = new inv.ItemCollection();
            this.cardInv = new inv.CardCollection();
            this.hero = new entity.newHeroSpec(this.inv, this.cardInv);
            this.zone = new zone.ZoneManager(this.hero);

            this.lastTime = new Date().getTime();
            this.zonesCleared = 0;
            this.deaths = 0;

            this.listenTo(gl.GameEvents, 'unpause', this.start);
            this.listenTo(gl.GameEvents, 'pause', this.pause);
            this.listenTo(gl.GameEvents, 'togglePause', this.toggle);

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
            this.inZone = false;
        },

        tick: function() {
            log.debug('begin tick');
            var thisTime = new Date().getTime();

            var dt = (thisTime - this.lastTime) * this.timeCoefficient;
            this.lastTime = thisTime;

            if (this.running) {
                var incBy;
                while (dt > 0) {
                    incBy = dt > 10 ? 10 : dt;
                    gl.time += incBy;
                    gl.lastTimeIncr = incBy;
                    dt -= incBy;
                    this.zone.zoneTick();
                }
            }

            gl.DirtyQueue.mark('tick');

            gl.DirtyQueue.triggerAll(gl.DirtyListener);

            requestAnimFrame(this.tick.bind(this));
        },

        bestGear: function(itemType, type) {
            var items = _.where(gl.game.inv.models, {itemType: itemType});
            items = _.where(items, {type: type});
            items = _.sortBy(items, function(item) { return item.classLevel; });
            if (items.length > 0) {
                return items.pop();
            }
            return undefined;
        },

        autoEquip: function() {
            this.hero.equipped.equip(this.bestGear('weapon', 'melee'), 'weapon');
            this.hero.equipped.equip(this.bestGear('armor', 'head'), 'head');
            this.hero.equipped.equip(this.bestGear('armor', 'chest'), 'chest');
            this.hero.equipped.equip(this.bestGear('armor', 'hands'), 'hands');
            this.hero.equipped.equip(this.bestGear('armor', 'legs'), 'legs');

            var skills = _.where(gl.game.inv.models, {itemType: 'skill'});
            skills = _.sortBy(skills, function(skill) { return -skill.cooldownTime; });
            log.error('skill names: %s', _.pluck(skills, 'name').join(', '));
            log.error('skill cooldownTimes: %s', _.pluck(skills, 'cooldownTime').join(', '));
            _.each(skills.slice(0, 5), function(skill, i) {
                this.hero.skillchain.equip(skill, i);
            }, this);
        },
    });

    function KeyHandler(gameModel) {
        this.gameModel = gameModel;
    }

    KeyHandler.prototype.onKeydown = function(event) {
        var gameModel = this.gameModel;

        var SPACE = 32, EKEY = 69, TKEY = 84, UP = 38, DN = 40, CKEY = 67, PKEY = 80, HKEY = 72;
        var key = event.keyCode;

        log.info('keydown, key: %d', event.keyCode);

        if (key == SPACE) {
            gl.GameEvents.trigger('togglePause');
        } else if (key == EKEY) {
            //Cheat for adding 1000xp (for easier testing)
            log.warning("XP Cheat!");                
            this.gameModel.hero.applyXp(1000);
        } else if (key == HKEY) {
            //Cheat for adding 1000xp (for easier testing)
            log.warning("Health Potion");
            this.gameModel.zone.hero.tryUsePotion();
        } else if (key == TKEY) {
            log.warning("Time Cheat!");
            this.gameModel.lastTime -= 1000 * 60 * 5;
        } else if (key === UP) {
            this.gameModel.timeCoefficient *= 2;
            log.error('Time coefficient now %.2f', this.gameModel.timeCoefficient);
        } else if (key === DN) {
            this.gameModel.timeCoefficient /= 2;
            log.error('Time coefficient now %.2f', this.gameModel.timeCoefficient);
        } else if (key === CKEY) {
            log.error('Equipment cheat');

            this.gameModel.inv.addDrops([
                dropsLib.dropFactory('item', ['weapon', 'melee', 1]),
                dropsLib.dropFactory('item', ['weapon', 'range', 1]),
                dropsLib.dropFactory('item', ['armor', 'head', 1]),
                dropsLib.dropFactory('item', ['armor', 'chest', 1]),
                dropsLib.dropFactory('item', ['armor', 'legs', 1]),
                dropsLib.dropFactory('item', ['armor', 'hands', 1]),
            ]);

            this.gameModel.inv.addDrops([
                dropsLib.dropFactory('skill', 'super smash'),
                dropsLib.dropFactory('skill', 'fire slash'),
                dropsLib.dropFactory('skill', 'basic range'),
                dropsLib.dropFactory('skill', 'fire ball'),
                dropsLib.dropFactory('skill', 'molten strike'),
            ]);

            this.gameModel.cardInv.addDrops([
                dropsLib.dropFactory('card', ['heart juice', 4]),
                dropsLib.dropFactory('card', ['brain juice', 4]),
                dropsLib.dropFactory('card', ['hot sword', 4])
            ]);

            this.gameModel.autoEquip();
            this.gameModel.autoEquip();
        } else if (key === PKEY) {
            log.warning('Time Test / Cheat!');
            var start = new Date().getTime();
            this.gameModel.lastTime -= 1000 * 60 * 20;
            setTimeout(function() {
                var elapsed = new Date().getTime() - start;
                console.log('20 mins of game time took ' + elapsed + ' ms ');
                console.log((1000 * 60 * 20 / elapsed).toFixed(3), 'x speed');
            }, 100);
        }
    }

    exports.extend({
        onReady: onReady,
        GameModel: GameModel
    });

});
