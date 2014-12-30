namespace.module('bot.window', function (exports, require) {

    var log = namespace.bot.log;
    var prob = namespace.bot.prob;

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

        SIZE: 200,

        // this needs to get all zones, when game model changes, probably shoudl get all of gameModel
        initialize: function(options, gameModel) {
            log.warning('visview init');
            this.m = gameModel;

            this.$canvas = $('<canvas width=100 height=100></canvas>');
            this.$el.append(this.$canvas);

            $(window).on('resize', this.resize.bind(this));
            this.resize();

            this.listenTo(this.m, 'change:dirty', function() {
                if (this.m.get('dirty')) {
                    this.redraw();
                }
            });
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
            if (this.m.get('running')) {
                this.redraw();
            }
        },

        clear: function() {
            this.$canvas.attr({
                width: this.SIZE,
                height: this.SIZE
            });
            this.$canvas.css({
                top: this.$el.height() / 2 - this.SIZE / 2 - 1,
                left: this.$el.width() / 2 - this.SIZE / 2 - 1
            });
        },

        redraw: function() {
            this.clear();
            var ctx = this.$canvas[0].getContext('2d');

            var cpos = this.m.char.getCoords();

            circle(ctx, [cpos[0] * 10, cpos[1] * 10], '#32E');

            var zone = this.m.zone;
            if (zone && zone.getCurrentRoom) {
                var monsters = zone.getCurrentRoom().monsters;
                monsters.each(function(mon, i) {
                    if (mon.isAlive()) {
                        var pos = mon.getCoords();
                        if (mon.get('color') === undefined) {
                            mon.set('color', prob.randColor('#E12', 60));
                        }
                        circle(ctx, [pos[0] * 10, pos[1] * 10], mon.get('color'));
                    }
                });
            }
            this.m.set('dirty', false);
        },
    });

    function circle(ctx, pos, color) {
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }

    // could make a library that wraps a canvas context.
    // Need to probably get drawing into non-dom canvases for speedup.  At very least for projectiles

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options, gameModel) {
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
