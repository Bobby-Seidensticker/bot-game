namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;

    var HeaderView = Backbone.View.extend({
        tagName: 'div',

        template: _.template($('#header-stats-template').html()),

        initialize: function(options, char, inv, zoneManager) {
            charView = new HeaderCharView({model: char});
            this.$el.append(charView.render().el);

            zoneView = new HeaderZoneView({model: zoneManager});
            this.$el.append(zoneView.render().el);

            invView = new HeaderInvView({model: inv}, char.get('equipped'));
            this.$el.append(invView.render().el);

            skillchainView = new HeaderSkillchainView({collection: char.get('skillchain')});
            this.$el.append(skillchainView.render().el);

            $('.header').append(this.$el);
        }
    });

    var HeaderCharView = Backbone.View.extend({
        template: _.template($('#header-stats-template').html()),

        className: 'stats',

        tagName: 'div',

        initialize: function() {
            this.listenTo(this.model, 'change', this.update);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        update: function() {
            this.$('#hp').html(Math.ceil(this.model.get('hp')) + ' / ' + Math.ceil(this.model.get('maxHp')));
            this.$('#mana').html(Math.floor(this.model.get('mana')) + ' / ' + Math.floor(this.model.get('maxMana')));
            this.$('#xp').html(Math.floor(this.model.get('xp')) + ' / ' + Math.ceil(this.model.get('nextLevelXp')));
            this.$('#level').html(this.model.get('level'));
        },
    });

    var HeaderZoneView = Backbone.View.extend({
        template: _.template($('#header-zone-stats-template').html()),
        className: 'stats',
        tagName: 'div',

        initialize: function() {
            this.listenTo(window.gevents, 'monsters:death zone:newZone zone:nextRoom', this.render);

            /*this.listenTo(this.model, 'change', this.update);
            this.listenTo(this.model, 'newZone', this.update);
            this.listenTo(this.model, 'nextRoom', this.update);
            this.listenTo(this.model, 'death', this.update);*/
        },

        render: function() {
            var curRoom = this.model.getCurrentRoom().monsters;
            var data = _.extend({}, this.model.toJSON(), {
                livingCount: curRoom.livingCount,
                totalCount: curRoom.length
            });
            this.$el.html(this.template(data));
            return this;
        },

        // right here, you are working towards getting the header-zone-stats-template rendering and updating on zone changes
        // Basically, all you need is to get an object that has all of the appropriate variables. name comes from the zone, but the liveCount
        //   and totalCount both come from the current room's mosnters collection

        // this header zone view most likely needs the entire gameModel so it can monitor for when the char goes into a new zone
        // having events about zone changes, next room, fire from the zoneModel to the gameModel so this view can update changes is a good idea
    });

    var HeaderInvView = Backbone.View.extend({
        template: _.template($('#header-equipped-template').html()),

        tagName: 'div',

        initialize: function(options, equipped) {
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

    function newHeaderView(char, inv, zoneManager) {
        var view = new HeaderView({el: $('.header')}, char, inv, zoneManager);

        return view;
    }

    var HeaderSkillchainView = Backbone.View.extend({
        tagName: 'div',
        className: 'skillchain',

        //template: _.template($('#header-skillchain-template').html()),

        initialize: function() {
            log.debug('New header skillchain view');

            this.$el.addClass('skillchain');
            this._views = [];

            this.listenTo(this.collection, 'add', this.render);
        },

        render: function() {
            log.debug('rendering header skillchain view');
            var frag = document.createDocumentFragment();

            if (this._views) {
                this.$el.empty();
            }

            this._views = [];

            this._views = this.collection.map(function(skill) {
                return new HeaderSkillView({model: skill});
            });

            _.each(this._views, function(view) {
                frag.appendChild(view.render().el);
            });

            this.$el.html(frag);
            return this;
        },
    });

    var HeaderSkillView = Backbone.View.extend({
        tagName: 'div',
        className: 'skill-slot',

        template: _.template($('#header-skill-template').html()),

        initialize: function() {
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    exports.extend({
        newHeaderView: newHeaderView
    });

});
