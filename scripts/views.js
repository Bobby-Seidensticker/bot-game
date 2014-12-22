namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;

    var HeaderView = Backbone.View.extend({
        tagName: 'div',

        template: _.template($('#header-stats-tmpl').html()),

        initialize: function(options, char, inv) {
            charView = new HeaderCharView({model: char});
            this.$el.append(charView.render().el);

            invView = new HeaderInvView({model: inv}, char.get('equipped'));
            this.$el.append(invView.render().el);

            $('.header').append(this.$el);
        }
    });

    var HeaderCharView = Backbone.View.extend({
        template: _.template($('#header-stats-tmpl').html()),

        tagName: 'div',

        initialize: function() {
            this.listenTo(this.model, 'change', this.update);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.addClass('stats');
            return this;
        },

        update: function() {
            this.$('#hp').html(Math.ceil(this.model.get('hp')) + ' / ' + this.model.get('maxHp'));
            this.$('#mana').html(Math.floor(this.model.get('mana')) + ' / ' + this.model.get('maxMana'));
            this.$('#xp').html(Math.floor(this.model.get('xp')) + ' / ' + this.model.get('nextLevelXp'));
        },
    });

    var HeaderInvView = Backbone.View.extend({
        template: _.template($('#header-equipped-tmpl').html()),

        tagName: 'div',

        initialize: function(options, equipped, slotImages) {
            this.equipped = equipped;
            this.listenTo(this.equipped, 'equipSuccess', this.update);
        },

        render: function() {
            this.$el.html(this.template({items: this.equipped.toDict()}));
            this.$el.addClass('equipped');

            var slots = this.equipped.slots;
            this.slotImages = _.object(slots,
                                       _.map(slots, function(slot) {
                                           return this.$('.' + slot + ' .slot-img');
                                       }, this)
                                      );

            return this;
        },

        update: function() {
            log.info('header inv view change');
            var items = this.equipped.toDict();

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

    var HeaderSkillChainView = Backbone.View.extend({
        tagName: 'div',

        template: $('#header-skillchain-tmpl'),

        initialize: function(options, collection) {
            this.collection = collection;
            this.$el.addClass('skillchain');
            
            $('.header').append(this.$el);
        },

        render: function() {
            

            return this;
        },
    });

    var HeaderSkillView = Backbone.View.extend({
        
    });

    exports.extend({
        newHeaderView: newHeaderView
    });
});
