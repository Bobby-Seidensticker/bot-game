namespace.module('bot.main', function (exports, require) {

    exports.extend({
        onReady: onReady
    });

    var log = namespace.bot.log;

    function onReady() {
        log.info('onReady');
        window.game = new GameView();
    }

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
        initialize: function() {
            console.log('HolderView init ', this.el);
            this.listenTo(this.model, 'change', this.resize);
            this.resize();
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
        }
    });

    var VisView = HolderView.extend({
        el: $('.vis'),

        resize: function(asdf, ss, fdsa) {
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

            this.windowModel = new WindowModel;
            this.headerView = new HeaderView({model: this.windowModel});
            this.menuView = new MenuView({model: this.windowModel});
            this.visView = new VisView({model: this.windowModel});

            $(window).on('resize', this.windowModel.resize.bind(this.windowModel));
        },
    });
});