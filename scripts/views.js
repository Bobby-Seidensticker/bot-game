namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;
    var entity = namespace.bot.entity;

    /*var HeaderView = Backbone.View.extend({
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
    });*/

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options, game) {
            this.$el.empty();
            this.statsTab = new StatsTab({}, game);
            this.itemTab = new ItemTab({}, game);

            this.$el.append(this.statsTab.render().el);
            this.$el.append(this.itemTab.render().el);
        }
    });

    function ceilRatio(a, b) {
        return Math.ceil(a) + ' / ' + Math.ceil(b);
    }

    function twoRatio(a, b) {
        return a.toFixed(2) + ' / ' + b.toFixed(2);
    }

    function two(a) {
        return a.toFixed(2);
    }

    var EntityView = Backbone.View.extend({
        tagName: 'table',

        template: _.template($('#kv-table-template').html()),

        initialize: function(options) {
            
        },

        render: function() {
            var skill;
            var data = {};
            var body = this.model;
            var spec = body.spec;

            data.body = [
                ['name', spec.name],
                ['level', spec.level],
                ['hp', twoRatio(body.hp, spec.maxHp)],
                ['mana', twoRatio(body.mana, spec.maxMana)],
                ['xp', twoRatio(spec.xp, spec.nextLevelXp)],
                ['pos/10k', '[' + Math.round(body.x / 10000) + ', ' + Math.round(body.y / 10000) + ']']
            ];

            for (var i = 0; i < this.model.skills.length; i++) {
                var arr = [];
                skill = this.model.skills[i];
                _.each(entity.dmgKeys, function(key) {
                    arr.push([key, skill.spec[key].toFixed(2)]);
                });
                arr.push(['cool in', skill.coolAt - window.time]);
                data[skill.spec.name] = arr;
            }

            data.spec = [];
            var specKeys = entity.defKeys.concat(entity.eleResistKeys);
            var key;
            for (var i = 0; i < specKeys.length; i++) {
                key = specKeys[i];
                  data.spec.push([key, this.model.spec[key].toFixed(2)]);
            }

            this.$el.html(this.template({data: data}));
            return this;
        },
    });

    var StatsTab = Backbone.View.extend({
        tagName: 'div',
        className: 'stats',

        initialize: function(options, game) {
            log.info('GameView initialize');

            //var specKeys = entity.attrKeys.concat(entity.defKeys).concat(entity.eleResistKeys).concat(entity.dmgKeys);
            //specKeys = ['name', 'level', 'team', 'xp', 'nextLevelXp'].concat(specKeys);

            this.zone = game.zone;
            this.last = {};
            this.heroView = new EntityView({model: this.zone.hero});
            this.render();

            this.listenTo(window.DirtyListener, 'tick', this.render);

            $(window).on('resize', this.onResize.bind(this));
            
            //var zone = new ZoneView({model: this.game.zone});
            /*
            this.headerView = new HeaderView();
            this.menuView = new MenuView();
            this.visView = new VisView({}, options.gameModel);
            this.messagesView = new MessagesView({collection: options.messageCollection});*/
        },

        onResize: function() {
            this.$el.css({width: window.innerWidth / 4});
            this.render();
        },

        diffs: function() {
            return {
                inst_uid: this.zone.iuid,
                heroPos: this.zone.heroPos,
                liveMonsCount: this.zone.liveMons().length
            };
        },

        render: function() {
            var diffs = this.diffs();
            var sameEntities = _.every(diffs, function(value, key) { return this.last[key] === value; }, this);

            if (sameEntities) {
                this.heroView.render();
                _.invoke(this.monsterViews, 'render');
            } else {
                var frag = document.createDocumentFragment();
                frag.appendChild(this.heroView.render().el);

                this.monsterViews = [];
                var livingMons = this.zone.liveMons();
                for (var i = 0; i < livingMons.length; i++) {
                    this.monsterViews.push(new EntityView({model: livingMons[i]}));
                    frag.appendChild(this.monsterViews[i].render().el);
                }
                this.$el.html(frag);
            }
            return this;
        },
    });

    /*var ItemSlotView = Backbone.View.extend({
        tadName: 'div',
        className: 'itemSlot',
        template: _.template($('#item-slot-template').html()),

        events: {
            'click': 'onClick',
        },

        initialize: function(options, location) {
            this.location = location;  // 'inventory', 'equipped', or 'skillchain'
            this.selected = false;
        },

        onClick: function() {
            this.selected = !this.selected;
            this.$el.toggleClass('selected');
        },

        render: function() {
            //if (this.model === undefined) {
                // render slot
            //} else if (
            this.$el.html(this.template({model: this.model, location: this.location}));
            return this;
        }
    });*/

    var ItemTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#item-tab-template').html()),

        events: {
            'click .itemSlot': 'onClick',
        },

        onClick: function(event) {
            log.info('itemSlot on click');
            var $target = $(event.currentTarget);
            var split = $target.attr('data').split('-');
            var location = split[0];

            if (location === 'equipped') {
                log.info('equipped itemSlot on click');
                var slot = split[1];
                if (this.curId) {
                    this.equipped.equip(_.findWhere(this.items, {id: this.curId}), slot);
                } else {
                    this.equipped.equip(undefined, slot);
                }
                this.unselect();
            } else if (location === 'skillchain') {
                log.info('skillchain itemSlot on click');
                var slot = split[1];
                if (this.curId) {
                    this.skillchain.equip(_.findWhere(this.items, {id: this.curId}), slot);
                } else {
                    this.skillchain.equip(undefined, slot);
                }
                this.unselect();
            } else {
                log.info('inventory itemSlot on click');
                var itemId = split[1];
                if (this.curId) {
                    this.curId = undefined;
                    this.unselect();
                } else {
                    this.select($target, itemId);
                }
            }
            this.render();
        },

        unselect: function() {
            if (this.curTarget !== undefined) {
                log.info('unselecting');
                this.curTarget.removeClass('selected');
                this.curTarget = undefined;
                this.curId = undefined;
            }
        },

        select: function($target, itemId) {
            this.unselect();
            log.info('selecting');
            this.curTarget = $target;
            this.curTarget.addClass('selected');
            this.curId = itemId;
        },

        ensureSelection: function() {
            if (this.curTarget !== undefined) {
                this.curTarget.addClass('selected');
            }
        },

        initialize: function(options, game) {  // itemCollection, equippedGearModel, skillchain) {
            this.equipped = game.hero.equipped;  // equippedGearModel;
            this.skillchain = game.hero.skillchain;  // skillchain;
            this.items = game.inv; // itemCollection;
            this.curId = undefined;

            this.listenTo(window.DirtyListener, 'inventory:new', this.render);
        },

        render: function() {
            /*
              Render template
              for each slot in equipped.itemslots render equipped[slot]
              for each item in skillchain render it
              for each item in itemCollection.models
             */
            this.$el.html(this.template(this));
            this.ensureSelection();
            return this;
        },
    });

    exports.extend({
        GameView: GameView,
        StatsTab: StatsTab,
        ItemTab: ItemTab
    });
});
