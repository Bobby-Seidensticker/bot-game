namespace.module('bot.window', function (exports, require) {

    var log = namespace.bot.log;

    var HeaderView = Backbone.View.extend({
        el: $('.header'),

        initialize: function() {
            log.warning('headerview init');
            $(window).on('resize', this.resize.bind(this));
            this.resize();
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: ss[0] - 400 - 10,
                height: 150 - 10,
                left: 0,
                top: 0
            });
        }
    });

    var MenuView = Backbone.View.extend({
        el: $('.menu'),

        initialize: function() {
            log.warning('menuview init');
            $(window).on('resize', this.resize.bind(this));
            this.resize();
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: 400 - 10,
                height: ss[1] - 10,
                left: ss[0] - 400,
                top: 0
            });
            this.$('.menu-holder').css({
                height: ss[1] - 55
            });
        }
    });

    var VisView = Backbone.View.extend({
        el: $('.vis'),

        // this needs to get all zones, when game model changes, probably shoudl get all of gameModel
        initialize: function(options, gameModel) {
            log.warning('visview init');
            this.m = gameModel;

            this.$canvas = $('<canvas width=100 height=100></canvas>');
            this.$el.append(this.$canvas);

            $(window).on('resize', this.resize.bind(this));
            this.resize();
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: ss[0] - 400 - 10,
                height: ss[1] - 150 - 10,
                left: 0,
                top: 150
            });
            this.clear();
            this.redraw();
        },

        clear: function() {
            this.$canvas.attr({
                width: 300,
                height: 300
            });
            this.$canvas.css({
                top: this.$el.height() / 2 - 300 / 2 - 1,
                left: this.$el.width() / 2 - 300 / 2 - 1
            });
        },

        redraw: function() {
            
        },
    });

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(gameModel) {
            console.log('GameView initialize');

            this.headerView = new HeaderView();
            this.menuView = new MenuView();
            this.visView = new VisView({}, gameModel);
        },
    });

    exports.extend({
        GameView: GameView
    });
});
