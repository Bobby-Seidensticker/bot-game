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
        log.info('onReady');
        var gameModel = new GameModel();

        var gameView = new GameView();
        var m = new menu.TabView();

        var invModel = new inv.InvModel();
        var invMenuView = new inv.InvMenuView({model: invModel});
        //var craftMenuView = new inv.CraftMenuView({model: invModel});
        //var lvlupMenuView = new inv.LvlupMenuView({model: invModel});
        var char = new entity.newChar();
	
        window.invMenuView = invMenuView;
        window.game = gameView;

        //gameModel.start();
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

            this.char = new entity.newChar();

            this.lastTime = new Date().getTime();
        },

        start: function() {
            this.set({running: true});
            requestAnimFrame(this.tick.bind(this));
        },

        stop: function() {
            this.set({running: false});
        },

        tick: function() {
            if (!this.get('inZone')) {
                this.zone = zone.newZoneModel(this.char);
            }
            if (!this.char.hp || this.char.hp <= 0 || this.zone.done()) {
                log.info('Getting new zone, recomputing char attrs');
                this.char.computeAttrs();
                this.zone = zone.newZoneModel(this.char);
            }

            var thisTime = new Date().getTime();
            var monsters = this.zone.getCurrentRoom().monsters;  // type MonsterCollection
            for (var t = this.lastTime; t < thisTime; t++) {
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

            if (this.get('running')) {
                requestAnimFrame(this.tick.bind(this));
            }
        },
    });



    var WindowModel = Backbone.Model.extend({
        initialize: function() {
            this.resize();
        },

        resize: function() {
            console.log('resize, this: ', this);
            this.set({ss: [window.innerWidth, window.innerHeight]});
        }
    });

    var HolderView = Backbone.View.extend({
        initialize: function(a) {
            console.log('a: ', a);
            this.listenTo(this.model, 'change', this.resize);
            this.resize();

            //this.$el.html(this.template(
        }
    });

    var HeaderView = HolderView.extend({
        el: $('.header'),

        resize: function() {
            var ss = this.model.get('ss');
            this.$el.css({
                width: ss[0] - 400 - 10,
                height: 150 - 10,
                left: 0,
                top: 0
            });
        }
    });

    var MenuView = HolderView.extend({
        el: $('.menu'),

        resize: function() {
            var ss = this.model.get('ss');
            this.$el.css({
                width: 400 - 10,
                height: ss[1] - 10,
                left: ss[0] - 400,
                top: 0
            });
            this.$('.menu-holder').css({
                height: ss[1] - 10 - 60
            });
        }
    });

    var VisView = HolderView.extend({
        el: $('.vis'),

        resize: function() {
            var ss = this.model.get('ss');
            this.$el.css({
                width: ss[0] - 400 - 10,
                height: ss[1] - 150 - 10,
                left: 0,
                top: 150
            });
        }
    });

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function() {
            console.log('GameView initialize');

            this.windowModel = new WindowModel();
            this.headerView = new HeaderView({model: this.windowModel});
            this.menuView = new MenuView({model: this.windowModel});
            this.visView = new VisView({model: this.windowModel});

            $(window).on('resize', this.windowModel.resize.bind(this.windowModel));
        },
    });
});
