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
            // TODO add selective updating
            this.listenTo(window.DirtyListener, 'equipChange', this.render);
            this.listenTo(window.DirtyListener, 'skillchainChange', this.render);
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
            this.monsterViews = [];
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

                _.invoke(this.monsterViews, 'remove');
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

    var ItemSlot = Backbone.View.extend({
        tagName: 'div',
        className: 'itemSlot',

        events: {
            'click': 'onClick',
        },

        onClick: function() {
            this.trigger('click', this);
        },

        initialize: function(options, loc, slot) {
            this.loc = loc;
            this.slot = slot;
            this.template = _.template($('#' + loc + '-item-slot-template').html());
            this.render();
        },
        select: function() { this.$el.addClass('selected'); },
        unselect: function() { this.$el.removeClass('selected'); },
        toggleSelect: function() { this.$el.toggleClass('selected'); },
        empty: function() { this.model = undefined; this.render(); },
        fill: function(model) { this.model = model; this.render(); },

        render: function() {
            this.$el.html(this.template(this));
            return this;
        }
    });

    var ItemTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#item-tab-template').html()),

        onClick: function(itemSlot) {
            log.info('itemSlot on click');

            if (itemSlot.loc === 'inventory') {
                log.info('inventory itemSlot on click');
                if (this.selected) {
                    this.selected.unselect();
                    this.selected = undefined;
                } else {
                    if (itemSlot.model !== undefined) {
                        itemSlot.select();
                        this.selected = itemSlot;
                    }
                }
            } else {
                if (this.selected) {
                    this.selected.unselect();
                    if (this[itemSlot.loc].equip(this.selected.model, itemSlot.slot)) {
                        log.info('Successfully equipped item %s', this.selected.name);
                        // selected is always from the inventory
                        itemSlot.fill(this.selected.model);
                        this.selected.empty();
                    } else {
                        log.info('Failed to equip item %s', this.selected.name);
                    }
                    this.selected = undefined;
                } else {
                    this[itemSlot.loc].equip(undefined, itemSlot.slot);
                    var unequippingModel = itemSlot.model;
                    itemSlot.empty();
                    console.log(this.itemsInInv);
                    this.subs.inventory[this.itemsInInv].fill(unequippingModel);
                    this.itemsInInv++;
                }

            }
            this.fillInvGaps();
        },

        fillInvGaps: function() {
            var views = _.filter(this.subs.inventory, function(view) { return view.model !== undefined; });
            var i = 0;
            for (; i < views.length; i++) {
                this.subs.inventory[i].fill(views[i].model);
            }
            for (; i < this.subs.inventory.length; i++) {
                this.subs.inventory[i].empty();
            }
        },

        initialize: function(options, game) {  // itemCollection, equippedGearModel, skillchain) {
            this.equipped = game.hero.equipped;  // equippedGearModel;
            this.skillchain = game.hero.skillchain;  // skillchain;
            this.inventory = game.inv; // itemCollection;

            this.subs = {
                equipped: [],
                skillchain: [],
                inventory: []
            };
            _.each(this.equipped.slots, function(slot) {
                this.addItemSlot(this.equipped[slot], 'equipped', slot);
            }, this);
            _.each(this.skillchain.skills, function(skill, i) {
                this.addItemSlot(skill, 'skillchain', i);
            }, this);
            this.itemsInInv = 0;
            _.each(this.inventory.models, function(model) {
                this.addItemSlot(model, 'inventory');
            }, this);
            for (var i = 0; i < 10; i++) {
                this.addItemSlot(undefined, 'inventory');
            }

            this.selected = undefined;
            this.rendered = false;

            this.listenTo(window.DirtyListener, 'inventory:new', this.render);
        },

        addItemSlot: function(model, loc, slot) {
            // needs more here
            if (loc === 'inventory' && model !== undefined) {
                if (model.name === 'cardboard sword' || model.name === 'basic melee' || model.name === 'balsa helmet') {
                    model = undefined;
                }
            }

            var view = new ItemSlot({model: model}, loc, slot);
            this.listenTo(view, 'click', this.onClick);
            this.subs[loc].push(view);
            if (loc === 'inventory' && model !== undefined) {
                this.itemsInInv++;
            }
        },


        render: function() {
            if (this.rendered) {
                _.invoke(this.subs.equipped, 'render');
                _.invoke(this.subs.skillchain, 'render');
                _.invoke(this.subs.inventory, 'render');
            } else {
                this.$el.html(this.template());
                var $eq = this.$('.equipped');
                var frag = document.createDocumentFragment();
                _.each(this.subs.equipped, function(subView, slot) {
                    frag.appendChild(subView.el);
                });
                $eq.append(frag);

                var $sk = this.$('.skillchain');
                var frag = document.createDocumentFragment();
                _.each(this.subs.skillchain, function(subView, i) {
                    frag.appendChild(subView.el);
                });
                $sk.append(frag);

                var $inv = this.$('.inventory');
                var frag = document.createDocumentFragment();
                _.each(this.subs.inventory, function(subView) {
                    frag.appendChild(subView.el);
                });
                $inv.append(frag);
            }
            return this;
        },
    });

    exports.extend({
        GameView: GameView,
        StatsTab: StatsTab,
        ItemTab: ItemTab
    });
});
