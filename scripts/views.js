namespace.module('bot.views', function (exports, require) {

    var HeaderView = Backbone.View.extend({
        template: _.template($('#header-stats-tmpl').html()),

        initialize: function(options, char, inv) {
            this.char = char;
            this.inv = inv;

            console.log('right here');

            this.$el.html(this.template(this.char.toJSON()));
        }
    });

    function newHeaderView(char, inv) {
        var view = new HeaderView({el: $('.header')}, char, inv);

        return view;
    }

    exports.extend({
        newHeaderView: newHeaderView
    });
});
