namespace.module('bot.views', function (exports, require) {

    var HeaderView = Backbone.View.extend({
        template: _.template($('#header-stats-tmpl').html()),

        initialize: function(options, char, inv) {
            this.char = char;
            this.inv = inv;

            console.log('right here');

            this.$el.html(this.template(this.char.toJSON()));
            this.setElement(this.$('.stats'));

            this.char.on('change', this.render, this);
        },

        render: function() {
            this.$('#hp').html(Math.ceil(this.char.get('hp')) + ' / ' + this.char.get('maxHp'));
            this.$('#mana').html(Math.floor(this.char.get('mana')) + ' / ' + this.char.get('maxMana'));
            this.$('#xp').html(Math.floor(this.char.get('xp')) + ' / ' + this.char.get('nextLevelXp'));
        },
    });

    function newHeaderView(char, inv) {
        var view = new HeaderView({el: $('.header')}, char, inv);

        return view;
    }

    exports.extend({
        newHeaderView: newHeaderView
    });
});
