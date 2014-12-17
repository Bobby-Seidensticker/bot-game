namespace.module('bot.views', function (exports, require) {

    var HeaderView = Backbone.View.extend({
        template: _.template($('#header-stats-tmpl').html()),

        initialize: function(options, char, inv) {
            this.char = char;
            this.inv = inv;

            console.log('right here views');

            console.log(_.extend({ items: this.char.get('equipped').toDict() }, this.char.toJSON()));

            this.$el.html(this.template(_.extend({ items: this.char.get('equipped').toDict() }, this.char.toJSON())));

            //this.setElement(this.$('.stats'));

            this.char.on('change', this.render, this);

            var slots = this.char.get('equipped').slots;
            this.slotImages = _.object(slots,
                                         _.map(slots, function(slot) {
                                             return this.$('.' + slot + ' .slot-img');
                                         }, this)
                                        );
        },

        render: function() {
            this.$('#hp').html(Math.ceil(this.char.get('hp')) + ' / ' + this.char.get('maxHp'));
            this.$('#mana').html(Math.floor(this.char.get('mana')) + ' / ' + this.char.get('maxMana'));
            this.$('#xp').html(Math.floor(this.char.get('xp')) + ' / ' + this.char.get('nextLevelXp'));

            var items = this.char.get('equipped').toDict();

            _.each(items, function(item, slot) {
                var $img = this.slotImages[slot];
                if (item) {
                    $img.removeClass('empty');
                    $img.attr('src', 'assets/' + item.get('name') + '.svg');
                } else {
                    $img.addClass('empty');
                }
            }, this);
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
