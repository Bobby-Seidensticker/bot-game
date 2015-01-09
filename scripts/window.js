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

    var REAL_SIZE = 200;
    var SIZE = 1000 * 1000;
    var RATIO = REAL_SIZE / SIZE;

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

            this.listenTo(window.gevents, 'vis', this.redraw.bind(this));
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
                width: REAL_SIZE,
                height: REAL_SIZE
            });
            this.$canvas.css({
                top: this.$el.height() / 2 - REAL_SIZE / 2 - 1,
                left: this.$el.width() / 2 - REAL_SIZE / 2 - 1
            });
        },

        transpose: function(coords) {
            return [coords[0] * RATIO, coords[1] * RATIO];
        },

        redraw: function() {
            this.clear();
            var ctx = this.$canvas[0].getContext('2d');

            var cpos = this.transpose(this.m.char.getCoords());

            circle(ctx, cpos, '#32E');

            var zone = this.m.zone;
            if (zone && zone.getCurrentRoom) {
                var monsters = zone.getCurrentRoom().monsters;
                monsters.each(function(mon, i) {
                    if (mon.isAlive()) {
                        var pos = this.transpose(mon.getCoords());
                        if (mon.get('color') === undefined) {
                            mon.set('color', prob.randColor('#E12', 60));
                        }
                        circle(ctx, pos, mon.get('color'));
                    }
                }, this);
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

    var MessagesView = Backbone.View.extend({
        el: $('.messages'),

        initialize: function() {
            log.error('MessagesView init, this.collection === undefined = %s', (this.collection === undefined).toString());
            $(window).on('resize', this.resize.bind(this));
            this.resize();
            this.listenTo(this.collection, 'pruned', this.render);
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: 300,
                height: ss[1] - 150 - 10,
                left: ss[0] - 400 - 10 - 300,
                top: 150,
                'z-index': 10
            });
            this.render();
        },

        render: function() {
            var html = '<p>' + this.collection.pluck('message').join('</p>\n<p>') + '</p>'
            log.info('messagesView html: %s', html);
            this.$el.html(html);
        }
    });


    // could make a library that wraps a canvas context.
    // Need to probably get drawing into non-dom canvases for speedup.  At very least for projectiles

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options) {
            console.log('GameView initialize');

            this.headerView = new HeaderView();
            this.menuView = new MenuView();
            this.visView = new VisView({}, options.gameModel);
            this.messagesView = new MessagesView({collection: options.messageCollection});
        },
    });

    exports.extend({
        GameView: GameView
    });
});
