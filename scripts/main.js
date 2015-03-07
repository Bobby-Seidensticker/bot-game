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


        /*gl.FB = new Firebase("https://fiery-heat-4226.firebaseio.com");

        gl.FB.authAnonymously(function(error, authData) {
            if(error) {
                console.log("anon login failed", error);
                gl.FBuid = "failedauth";
            } else {
                console.log("Good anon auth", authData);
                gl.FBuid = authData.uid.slice(11);
                console.log(gl.FBuid);
                gl.FBL = gl.FB.child(gl.FBuid);
                gl.FBL.push("page loading");
            }
        });*/
        
        //localStorage.clear();

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
            this.cardInv.equipped = this.hero.equipped;
            this.cardInv.skillchain = this.hero.skillchain;
            this.zone = new zone.ZoneManager(this.hero);

            // localStorage.removeItem('data');

            var loadSuccess = this.load();
            if (!loadSuccess) {
                this.noobGear();
            }

            this.lastTime = new Date().getTime();
            this.zonesCleared = 0;
            this.deaths = 0;

            this.listenTo(gl.GameEvents, 'unpause', this.start);
            this.listenTo(gl.GameEvents, 'pause', this.pause);
            this.listenTo(gl.GameEvents, 'togglePause', this.toggle);

            this.start();

            setInterval(this.save.bind(this), 1000);
        },

        save: function() {
            log.warning('saving');
            var data = {
                'cardInv': this.cardInv.toJSON(),
                'inv': this.inv.toJSON(),
                'zone': this.zone.toJSON(),
                'hero': this.hero.toJSON(),
                'skillchain': this.hero.skillchain.toJSON(),
                'equipped': this.hero.equipped.toJSON(),
            };
            localStorage.setItem('data', JSON.stringify(data));
            console.log(localStorage.getItem('data'));
            log.warning('saved');
        },

        load: function() {
            log.warning('loading');
            var data = JSON.parse(localStorage.getItem('data'));
            if (data) {
                this.cardInv.fromJSON(data.cardInv);
                this.inv.fromJSON(data.inv, this.cardInv);
                this.zone.fromJSON(data.zone);
                this.hero.fromJSON(data.hero);
                this.hero.skillchain.fromJSON(data.skillchain, this.inv);
                this.hero.equipped.fromJSON(data.equipped, this.inv);
                return true;
            }
            return false;
        },

        noobGear: function() {
            log.warning('noob gear');
            console.log(this.inv.models.length);
            this.inv.noobGear();
            console.log(this.inv.models.length);
            this.hero.equipped.equip(_.findWhere(this.inv.models, {name: 'cardboard sword'}), 'weapon');
            this.hero.equipped.equip(_.findWhere(this.inv.models, {name: 'balsa helmet'}), 'head');
            this.hero.skillchain.equip(_.findWhere(this.inv.models, {name: 'basic melee'}), 0);
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
            //WARNING - used to be sort by classlevel, dont have an easy indicator of quality anymore, so just using level
            items = _.sortBy(items, function(item) { return item.level; });
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
        if (! isNaN(parseInt(localStorage.getItem('uid')))) {
            return;
        }
        
        var gameModel = this.gameModel;
        
        var SPACE = 32, EKEY = 69, TKEY = 84, UP = 38, DN = 40, CKEY = 67, PKEY = 80, HKEY = 72, XKEY = 88, VKEY = 86;
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
        } else if (key === CKEY || key === XKEY || key === VKEY) {
            log.error('Melee Equipment cheat');
            var item;
            
            if (key === CKEY) {
                this.gameModel.inv.addDrops([                
                    dropsLib.dropFactory('item', ['weapon', 'spikey mace']),                
                    dropsLib.dropFactory('skill', 'lethal strike'),
                    dropsLib.dropFactory('skill', 'flaming debris'),
                    dropsLib.dropFactory('skill', 'ground smash'),
                ]);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "spikey mace"});
                this.gameModel.hero.equipped.equip(item, "weapon");
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "ground smash"});
                this.gameModel.hero.skillchain.equip(item, 0);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "lethal strike"});
                this.gameModel.hero.skillchain.equip(item, 1);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "flaming debris"});
                this.gameModel.hero.skillchain.equip(item, 2);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "basic melee"});
                this.gameModel.hero.skillchain.equip(item, 4);
            } else if (key === XKEY) {
                this.gameModel.inv.addDrops([
                    dropsLib.dropFactory('item', ['weapon', 'composite bow']),
                    dropsLib.dropFactory('skill', 'headshot'),
                    dropsLib.dropFactory('skill', 'speed shot'),
                ]);
                this.gameModel.cardInv.addDrops([
                    dropsLib.dropFactory('card', ['more projectiles', 2]),
                ]);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "composite bow"});
                this.gameModel.hero.equipped.equip(item, "weapon");
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "headshot"});
                this.gameModel.hero.skillchain.equip(item, 0);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "speed shot"});
                this.gameModel.hero.skillchain.equip(item, 1);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "basic range"});
                this.gameModel.hero.skillchain.equip(item, 4);
            } else if (key === VKEY) {
                this.gameModel.inv.addDrops([
                    dropsLib.dropFactory('item', ['weapon', 'star wand']),
                    dropsLib.dropFactory('skill', 'fire ball'),
                    dropsLib.dropFactory('skill', 'poison ball'),
                    dropsLib.dropFactory('skill', 'lightning ball'),
                    dropsLib.dropFactory('skill', 'ice ball'),
                    dropsLib.dropFactory('skill', 'ice blast'),
                    dropsLib.dropFactory('skill', 'nova'),
                ]);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "star wand"});
                this.gameModel.hero.equipped.equip(item, "weapon");
                //item = _.find(this.gameModel.inv.models, function(item) {return item.name == "fire ball"});
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "nova"});
                this.gameModel.hero.skillchain.equip(item, 0);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "poison ball"});
                this.gameModel.hero.skillchain.equip(item, 1);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "ice ball"});
                this.gameModel.hero.skillchain.equip(item, 2);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "lightning ball"});
                this.gameModel.hero.skillchain.equip(item, 3);
                item = _.find(this.gameModel.inv.models, function(item) {return item.name == "basic spell"});
                this.gameModel.hero.skillchain.equip(item, 4);
            }

            this.gameModel.inv.addDrops([

                dropsLib.dropFactory('item', ['armor', 'crusader helm']),
                dropsLib.dropFactory('item', ['armor', 'leatherplate armor']),
                dropsLib.dropFactory('item', ['armor', 'buckaneer boots']),
                dropsLib.dropFactory('item', ['armor', 'goldenscale gauntlets']),

            ]);

            item = _.find(this.gameModel.inv.models, function(item) {return item.name == "crusader helm"});
            this.gameModel.hero.equipped.equip(item, "head");
            item = _.find(this.gameModel.inv.models, function(item) {return item.name == "leatherplate armor"});
            this.gameModel.hero.equipped.equip(item, "chest");
            item = _.find(this.gameModel.inv.models, function(item) {return item.name == "buckaneer boots"});
            this.gameModel.hero.equipped.equip(item, "legs");
            item = _.find(this.gameModel.inv.models, function(item) {return item.name == "goldenscale gauntlets"});
            this.gameModel.hero.equipped.equip(item, "hands");


            
            this.gameModel.cardInv.addDrops([
                dropsLib.dropFactory('card', ['heart juice', 4]),
                dropsLib.dropFactory('card', ['brain juice', 4]),
                dropsLib.dropFactory('card', ['hot sword', 4])
            ]);

            //this.gameModel.autoEquip();
            //this.gameModel.autoEquip();
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
