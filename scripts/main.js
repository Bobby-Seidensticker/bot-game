namespace.module('bot.main', function (exports, require) {

    var log = namespace.bot.log;
    var inv = namespace.bot.inv;
    var menu = namespace.bot.menu;
    var entity = namespace.bot.entity;
    var zone = namespace.bot.zone;
    var views = namespace.bot.views;
    var dropsLib = namespace.bot.drops

    var STEP_SIZE = 10;

    var globalStart = new Date().getTime();

    function onReady() {

        gl.VERSION_NUMBER_ORDER = ['v0-1-1b', '0-1-2', '0-1-3', '0-1-4'];
        gl.VERSION_NUMBER = '0-1-5';
        $('title').html('Dungeons of Derp v' + gl.VERSION_NUMBER.replace(/\-/g, '.') + ' ALPHA');
        
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
            this.lastSave = 0;

            this.running = false;
            this.inZone = false;

            gl.messages = new namespace.bot.messages.Messages();
            gl.builds = [];
            
            
            this.inv = new inv.ItemCollection();
            this.cardInv = new inv.CardCollection();
            this.hero = new entity.newHeroSpec(this.inv, this.cardInv);
            this.cardInv.equipped = this.hero.equipped;
            this.cardInv.skillchain = this.hero.skillchain;
            this.zone = new zone.ZoneManager(this.hero);
            this.settings = this.defaultSettings();
            
            var loadSuccess = this.load();
            if (!loadSuccess) {
                this.noobGear();
            }
            this.zone.newZone(this.zone.nextZone);

            this.lastTime = new Date().getTime();
            this.zonesCleared = 0;
            this.deaths = 0;

            this.mspf = 1000 / 30;

            this.listenTo(gl.GameEvents, 'unpause', this.start);
            this.listenTo(gl.GameEvents, 'pause', this.pause);
            this.listenTo(gl.GameEvents, 'togglePause', this.toggle);
            this.listenTo(gl.GameEvents, 'reportData', this.reportData);
            this.listenTo(gl.GameEvents, 'beatgame', this.beatGame);
            this.start();
            setInterval(this.intervalTick.bind(this), 1000);
        },

        defaultSettings: function() {
            return {
                "enableBuildHotkeys": false,
            }
        },

        trySave: function() {
            var now = new Date().getTime();
            if (now - this.lastSave < 1000) {
                return;
            }
            this.lastSave = now;
            localStorage.setItem('data', JSON.stringify(this.toJSON()));
        },

        toJSON: function() {
            var data = {
                settings: this.settings,
                version: gl.VERSION_NUMBER,
                cardInv: this.cardInv.toJSON(),
                inv: this.inv.toJSON(),
                zone: this.zone.toJSON(),
                hero: this.hero.toJSON(),
                skillchain: this.hero.skillchain.toJSON(),
                equipped: this.hero.equipped.toJSON(),
            };
            return data;
        },

        reportData: function() {
            gl.FBL.child('name').set(this.hero.name);
            gl.FBL.child('level').set(this.hero.level);
            var data = this.toJSON();
            gl.FBL.child('equipped').set(data.equipped);
            _.each(data.equipped, function(name, slot) {
                var cards = _.findWhere(data.inv, {"name": name});
                gl.FBL.child('cards').child(slot+"cards").set(cards.cardNames.join(', '));
            }, this);
            gl.FBL.child('skillchain').set(data.skillchain);
            _.each(data.skillchain, function(name, slot) {
                var cards = _.findWhere(data.inv, {"name": name});
                gl.FBL.child('cards').child("s"+slot+"cards").set(cards.cardNames.join(', '));
            }, this);            
            gl.FBL.child('zone').set(data.zone.nextZone);
            gl.FBL.child('unlockedZones').set(data.zone.unlockedZones);            
            gl.FBL.child('strdata').set(JSON.stringify(data));
        },

        saveBuild: function(buildSlot) {
            var build = {};
            var data = this.toJSON();
            build.equipped = data.equipped;
            build.skillchain = data.skillchain;
            build.inv = _.filter(data.inv, function(m) {return m.cardNames.length});
            gl.builds[buildSlot] = build;
            log.warning('Build saved to slot %d', buildSlot);            
        },

        loadBuild: function(buildSlot) {            
            var items, invItem
            var build = gl.builds[buildSlot];
            if (build !== undefined) {
                _.each(this.hero.equipped.slots, function(slot) {
                    this.hero.equipped.unequip(slot);
                }, this);
                _.each(_.range(5), function(i) {
                    this.hero.skillchain.equip(undefined, i);
                }, this);
                       
                this.hero.skillchain.fromJSON(build.skillchain, this.inv);
                this.hero.equipped.fromJSON(build.equipped, this.inv);
                _.each(build.inv, function(loadItem) {
                    var invItem = _.findWhere(this.inv.models, {name: loadItem.name});
                    invItem.loadCards(loadItem.cardNames, this.cardInv);
                },this);
            }
            log.warning('Build loaded from slot %d', buildSlot);
        },

        beatGame: function() {
            var uid = localStorage.getItem('uid');
            var tempdate = new Date();
            gl.FB.child(gl.VERSION_NUMBER).child('winners').child(uid).set(tempdate.toString());;
        },
        
        load: function() {
            log.warning('loading');
            var data = JSON.parse(localStorage.getItem('data'));
            if (data) {
                this.settings = (data.settings !== undefined) ? data.settings : this.defaultSettings();
                data = this.upgradeData(data);
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

        upgradeData: function(data) {
            switch (data.version) {
            case undefined:
                log.error('Upgrading data from v0-1-1b to 0-1-2');
                data = JSON.parse(JSON.stringify(data).replace(/putrified/g, 'putrefied'));
                data.version = '0-1-2';
                _.each(data.cardInv, function(card) { card.qp = 0; });

                break;
            case '0-1-2':
            case '0-1-3':
            case '0-1-4':
                data.version = '0-1-5'
                var order = namespace.bot.itemref.ref.zoneOrder.order;
                var fromNextZone = order.indexOf(data.zone.nextZone);
                var ul = Math.max(fromNextZone, data.zone.unlockedZones);
                if (ul >= order.length) {
                    ul = order.length - 1;
                }
                data.zone.unlockedZones = ul;

                break;
            default:
                log.error('No data upgrade required');
            }
            return data;
        },

        noobGear: function() {
            log.warning('noob gear');
            this.inv.noobGear();
            this.hero.equipped.equip(_.findWhere(this.inv.models, {name: 'cardboard sword'}), 'weapon');
            this.hero.equipped.equip(_.findWhere(this.inv.models, {name: 'balsa helmet'}), 'head');
            this.hero.skillchain.equip(_.findWhere(this.inv.models, {name: 'basic melee'}), 0);
        },

        start: function() {
            log.info('start');
            this.lastTime = new Date().getTime();
            this.running = true;
            requestAnimFrame(this.onFrame.bind(this));
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

        intervalTick: function() {
            var thisTime = new Date().getTime();
            if (thisTime - this.lastTime > 10000) {
                this.modelTick();
            }
        },

        onFrame: function() {
            if (new Date().getTime() - this.lastTime > this.mspf) {
                this.modelTick();
                this.visTick();
            }

            this.trySave();
            requestAnimFrame(this.onFrame.bind(this));
        },

        modelTick: function() {
            log.info('modelTick, %d', (new Date().getTime() - globalStart) / 1000);
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
        },

        visTick: function() {
            gl.DirtyQueue.mark('tick');
            gl.DirtyQueue.triggerAll(gl.DirtyListener);
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

    KeyHandler.prototype.liveKeys = function(event, godmode) {
        key = event.keyCode;
        var SPACE = 32, UP = 38, DN = 40;
        if (key == SPACE) {
            gl.GameEvents.trigger('togglePause');
        } else if (key === UP) {
            this.gameModel.timeCoefficient *= 2;
            if(!godmode) {
                this.gameModel.timeCoefficient = Math.min(1, this.gameModel.timeCoefficient);
            }
            log.error('Time coefficient now %.2f', this.gameModel.timeCoefficient);
        } else if (key === DN) {
            this.gameModel.timeCoefficient /= 2;
            if(!godmode) {
                this.gameModel.timeCoefficient = Math.max(0.25, this.gameModel.timeCoefficient);
            }
            log.error('Time coefficient now %.2f', this.gameModel.timeCoefficient);
        } else if (key >= 48 && key <= 57 && this.gameModel.settings.enableBuildHotkeys) {
            var buildSlot = key - 48;
            console.log(buildSlot, event.shiftKey);
            if (event.shiftKey) {
                this.gameModel.saveBuild(buildSlot);
            } else {
                this.gameModel.loadBuild(buildSlot);
            }
        }
        
            
    }

    KeyHandler.prototype.onKeydown = function(event) {
        var godmode = isNaN(parseInt(localStorage.getItem('uid')))
        this.liveKeys(event, godmode);
        
        if (!godmode) {
            return;
        }
        
        var gameModel = this.gameModel;
        
        var SPACE = 32, EKEY = 69, TKEY = 84, UP = 38, DN = 40, CKEY = 67, PKEY = 80, HKEY = 72, XKEY = 88, VKEY = 86;
        var key = event.keyCode;

        log.info('keydown, key: %d', event.keyCode);

        
        if (key == EKEY) {
            //Cheat for adding 1000xp (for easier testing)
            log.warning("XP Cheat!");                
            this.gameModel.hero.applyXp(this.gameModel.hero.getNextLevelXp());
        } else if (key == HKEY) {
            log.warning("Health Potion");
            this.gameModel.zone.hero.tryUsePotion();
        } else if (key == TKEY) {
            log.warning("Time Cheat!");
            this.gameModel.lastTime -= 1000 * 60 * 5;
        } else if (key === CKEY || key === XKEY || key === VKEY) {
            log.error('Melee Equipment cheat');
            var items = this.gameModel.inv.models;
            var egm = this.gameModel.hero.equipped;
            var sc = this.gameModel.hero.skillchain;

            if (key === CKEY) {
                this.gameModel.inv.addDrops([
                    dropsLib.dropFactory('item', ['weapon', 'spikey mace']),                
                    dropsLib.dropFactory('skill', 'lethal strike'),
                    dropsLib.dropFactory('skill', 'flaming debris'),
                    dropsLib.dropFactory('skill', 'ground smash'),
                ]);
                egm.equip(_.findWhere(items, {name: 'spikey mace'}), 'weapon');
                sc.equip(_.findWhere(items, {name: 'ground smash'}), 0);
                sc.equip(_.findWhere(items, {name: 'lethal strike'}), 1);
                sc.equip(_.findWhere(items, {name: 'flaming debris'}), 2);
                sc.equip(_.findWhere(items, {name: 'basic melee'}), 4);
            } else if (key === XKEY) {
                this.gameModel.inv.addDrops([
                    dropsLib.dropFactory('item', ['weapon', 'composite bow']),
                    dropsLib.dropFactory('skill', 'headshot'),
                    dropsLib.dropFactory('skill', 'speed shot'),
                ]);
                this.gameModel.cardInv.addDrops([
                    dropsLib.dropFactory('card', ['more projectiles', 2]),
                ]);
                egm.equip(_.findWhere(items, {name: 'composite bow'}), 'weapon');
                sc.equip(_.findWhere(items, {name: 'headshot'}), 0);
                sc.equip(_.findWhere(items, {name: 'speed shot'}), 1);
                sc.equip(_.findWhere(items, {name: 'basic range'}), 4);
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
                egm.equip(_.findWhere(items, {name: 'star wand'}), 'weapon');
                sc.equip(_.findWhere(items, {name: 'nova'}), 0);
                sc.equip(_.findWhere(items, {name: 'poison ball'}), 1);
                sc.equip(_.findWhere(items, {name: 'ice ball'}), 2);
                sc.equip(_.findWhere(items, {name: 'lightning ball'}), 3);
                sc.equip(_.findWhere(items, {name: 'basic spell'}), 4);
            }

            this.gameModel.inv.addDrops([
                dropsLib.dropFactory('item', ['armor', 'crusader helm']),
                dropsLib.dropFactory('item', ['armor', 'leatherplate armor']),
                dropsLib.dropFactory('item', ['armor', 'buckaneer boots']),
                dropsLib.dropFactory('item', ['armor', 'goldenscale gauntlets']),
            ]);

            egm.equip(_.findWhere(items, {name: 'crusader helm'}), 'head');
            egm.equip(_.findWhere(items, {name: 'leatherplate armor'}), 'chest');
            egm.equip(_.findWhere(items, {name: 'buckaneer boots'}), 'legs');
            egm.equip(_.findWhere(items, {name: 'goldenscale gauntlets'}), 'hands');

            this.gameModel.cardInv.addDrops([
                dropsLib.dropFactory('card', ['heart juice', 4]),
                dropsLib.dropFactory('card', ['brain juice', 4]),
                dropsLib.dropFactory('card', ['hot sword', 4])
            ]);
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
