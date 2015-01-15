namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;

    var HeaderView = Backbone.View.extend({
        tagName: 'div',

        template: _.template($('#header-stats-template').html()),

        initialize: function(options, hero, inv, zoneManager) {
            heroView = new HeaderHeroView({model: hero});
            this.$el.append(heroView.render().el);

            zoneView = new HeaderZoneView({model: zoneManager});
            this.$el.append(zoneView.render().el);

            invView = new HeaderInvView({model: inv}, hero.get('equipped'));
            this.$el.append(invView.render().el);

            skillchainView = new HeaderSkillchainView({collection: hero.get('skillchain')});
            this.$el.append(skillchainView.render().el);

            $('.header').append(this.$el);
        }
    });

    var HeaderHeroView = Backbone.View.extend({
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
            this.listenTo(window.DirtyListener, 'monsters:death zone:newZone zone:nextRoom', this.render);
        },

        render: function() {
            var monsters = this.model.getCurrentRoom().monsters;
            var data = _.extend({}, this.model.toJSON(), {
                livingCount: monsters.living().length,
                totalCount: monsters.length
            });
            this.$el.html(this.template(data));
            return this;
        }
    });

    var HeaderInvView = Backbone.View.extend({
        template: _.template($('#header-equipped-template').html()),

        tagName: 'div',

        initialize: function(options, equipped) {
            this.equipped = equipped;
            this.listenTo(this.equipped, 'equipSuccess', this.render);
            this.rendered = false;
        },

        render: function() {
            var items = this.equipped.toDict();

            if (this.rendered) {
                _.each(items, function(item, slot) {
                    var $img = this.slotImages[slot];
                    if (item) {
                        $img.removeClass('empty');
                        $img.attr('src', 'assets/' + item.get('name') + '.svg');
                    } else {
                        $img.addClass('empty');
                    }
                }, this);

            } else {
                this.$el.html(this.template({items: items}));
                this.$el.addClass('equipped');

                var slots = this.equipped.slots;
                this.slotImages = _.object(slots,
                                           _.map(slots, function(slot) {
                                               return this.$('.' + slot + ' .slot-img');
                                           }, this)
                                          );
            }
            this.rendered = true;
            return this;
        }
    });

    function newHeaderView(hero, inv, zoneManager) {
        var view = new HeaderView({el: $('.header')}, hero, inv, zoneManager);
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
            log.info('rendering header skillchain view');
            console.log(arguments);
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
        }
    });

    var HeaderSkillView = Backbone.View.extend({
        tagName: 'div',
        className: 'skill-slot',

        template: _.template($('#header-skill-template').html()),

        initialize: function() {
            this.HEIGHT = 80;
            this.lastCd = 0;
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$veil = this.$('.veil');

            this.lastCd = -1;
            this.renderState();
            this.listenTo(window.DirtyListener, 'skill:change', this.renderState);
            return this;
        },

        renderState: function() {
            var cd, css;

            cd = Math.floor(this.model.cooldown / this.model.get('cooldownTime') * this.HEIGHT);
            if (cd > this.HEIGHT) {
                cd = 1;
            } else if (cd < 0) {
                cd = 0;
            }

            if (cd === this.lastCd) {
                return;
            }

            if (cd === 0) {
                css = {top: 0, 'opacity': 0, height: this.HEIGHT};
            } else if (cd === 1) {
                css = {
                    top: 0,
                    opacity: 0.4,
                    'background-color': 'red',
                    'border-color': 'red',
                    height: this.HEIGHT
                };
            } else {
                css = {
                    top: this.HEIGHT - cd,
                    opacity: 0.4,
                    'background-color': 'red',
                    'border-color': 'red',
                    height: cd
                };
            }
            this.$veil.css(css);
        }
    });

    exports.extend({
        newHeaderView: newHeaderView
    });
});
