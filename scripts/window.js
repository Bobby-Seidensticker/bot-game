namespace.module('bot.window', function (exports, require) {

    var WindowModel = Backbone.Model.extend({
        initialize: function() {
            this.resize();
        },

        resize: function() {
            //console.log('resize, this: ', this);
            this.set({ss: [window.innerWidth, window.innerHeight]});
        }
    });

    var HolderView = Backbone.View.extend({
        initialize: function(a) {
            //console.log('a: ', a);
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

    exports.extend({
        GameView: GameView
    });
});
