namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;
    var entity = namespace.bot.entity;

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options, game) {
            this.statsTab = new StatsTab({}, game);
            this.itemTab = new ItemTab({}, game);
            this.cardTab = new CardTab({}, game);

            this.infoBox = new InfoBox();

            this.$el.append(this.statsTab.render().el);
            this.$el.append(this.itemTab.render().el);
            this.$el.append(this.cardTab.render().el);
            this.$el.append(this.infoBox.el);
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

    var InfoBox = Backbone.View.extend({
        tagName: 'div',
        className: 'infoBox',
        template: _.template($('#info-box-template').html()),
        citemplate: _.template($('#card-inventory-info-box-template').html()),

        initialize: function() {
            this.listenTo(window.UIEvents, 'hoverover', this.show);
            this.listenTo(window.UIEvents, 'hoverout', this.hide);
        },

        show: function(view) {
            if (view.model) {
                this.$el.css('display', 'block');
                console.log(view);
                if (view.loc === 'equipped-cards') {
                    this.$el.html(this.citemplate(view));
                } else {
                    this.$el.html(this.template(view.model));
                }
            } else {
                this.hide();
            }
        },

        hide: function() {
            this.$el.css('display', 'none');
            this.$el.empty();
        },

        /*
        render: function(view) {
            if (model) {
                this.$el.css('display', 'block');
                this.$el.html(this.template(model));
            } else {
                this.$el.css('display', 'none');
                this.$el.empty();
            }
            return this;
        },*/
    });

    var ItemSlot = Backbone.View.extend({
        tagName: 'div',
        className: 'itemSlot',

        events: {
            'click': 'onClick',
            'mouseover': 'onMouseover',
            'mouseout': 'onMouseout',
        },

        onClick: function() {
            this.trigger('click', this);
        },

        onMouseover: function() {
            window.UIEvents.trigger('hoverover', this);
        },

        onMouseout: function() {
            window.UIEvents.trigger('hoverout');
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

        lookup: function() {
            return {model: this.model, loc: this.loc, slot: this.slot};
        },

        render: function() {
            this.$el.html(this.template(this));
            return this;
        }
    });

    // TODO: fix all of this

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
                    this.addItemSlot(unequippingModel, 'inventory');
                }
            }

            this.rerenderInv();
        },

        rerenderInv: function() {
            var views = _.filter(this.subs.inventory, function(view) { return view.model !== undefined && view.model.equipped === false; });
            log.error('rerendering inv, len views: %d', views.length);
            var i = 0;
            for (; i < views.length; i++) {
                this.subs.inventory[i].fill(views[i].model);
            }
            for (; i < this.subs.inventory.length; i++) {
                this.stopListening(this.subs.inventory[i]);
                this.subs.inventory[i].remove();
            }
            log.error('len: %d', this.subs.inventory.length);
            this.subs.inventory = this.subs.inventory.slice(0, views.length);
            log.error('len after: %d', this.subs.inventory.length);
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

            this.listenTo(window.DirtyListener, 'inventory:new', this.render.bind(this));
        },

        newItemSlot: function(model, loc, slot) {
            var view = new ItemSlot({model: model}, loc, slot);
            this.listenTo(view, 'click', this.onClick);
            log.error('sub len bef: %d', this.subs[loc].length);
            this.subs[loc].push(view);
            log.error('sub len aft: %d', this.subs[loc].length);
            return view;
        },

        addItemSlot: function(model, loc, slot) {
            log.error('adding item slot');
            var el = this.newItemSlot(model, loc).el;
            this.$('.' + loc).append(el);
        },

        render: function() {
            this.$el.html(this.template());

            _.each(this.subs, function(arr, key) {
                _.each(arr, function(subView) {
                    this.stopListening(subView);
                    subView.remove();
                }, this);
                this.subs[key] = [];
            }, this);

            _.each(this.equipped.slots, function(slot) {
                this.newItemSlot(this.equipped[slot], 'equipped', slot);
            }, this);
            _.each(this.skillchain.skills, function(skill, i) {
                this.newItemSlot(skill, 'skillchain', i);
            }, this);
            var invOnly = _.filter(this.inventory.models, function(model) {
                return model.equipped === false;
            });
            _.each(invOnly, function(model) {
                this.newItemSlot(model, 'inventory');
            }, this);
            this.rerenderInv();

            this.selected = undefined;
            this.rendered = true;

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

            return this;
        },
    });

    var CardSlot = Backbone.View.extend({
        tagName: 'div',
        className: 'itemSlot',
        template: _.template($('#card-slot-template').html()),

        initialize: function(options, level) {
            this.loc = 'card-inventory';
            this.level = level;
            this.render();
        },

        events: {
            'click': 'onClick',
            'mouseover': 'onMouseover',
            'mouseout': 'onMouseout',
        },

        onClick: function() {
            this.trigger('click', this);
        },

        onMouseover: function() {
            window.UIEvents.trigger('hoverover', this.model);
        },

        onMouseout: function() {
            window.UIEvents.trigger('hoverout');
        },

        select: function() { this.$el.addClass('selected'); },

        lookup: function() {
            return {name: this.model.name, level: this.level};
        },

        render: function() {
            this.$el.html(this.template(this));
            return this;
        }
    });

    var CardTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#card-tab-template').html()),

        initialize: function(options, game) {
            this.equipped = game.hero.equipped;  // equippedGearModel;
            this.skillchain = game.hero.skillchain;  // skillchain;
            this.cards = game.cards; // cardTypeCollection;

            this.views = [];
            this.listenTo(window.DirtyListener, 'cards:new', this.render.bind(this));
        },

        onClick: function(clickedView) {
            if (clickedView.loc === 'skillchain' || clickedView.loc === 'equipped') {
                if (clickedView.model) {
                    if (this.selectedSlot) {
                        if (this.selectedSlot.model.id === clickedView.model.id) {
                            this.selectedCard = undefined;
                            this.selectedSlot = undefined;
                            this.render();
                            return;
                        } else {
                            this.selectedCard = undefined;
                            this.selectedSlot = clickedView;
                            this.render();
                            return;
                        }
                    } else {
                        this.selectedCard = undefined;
                        this.selectedSlot = clickedView;
                        this.render();
                        return;
                    }
                } else {
                    this.selectedCard = undefined;
                    this.selectedSlot = undefined;
                    this.render();
                    return;
                }
            } else if (clickedView.loc === 'equipped-cards') {
                if (clickedView.model) {
                    // unequip the card you clicked
                    // clickedView.slot make sure that equipped cards tab slots have a slot, should be index
                    this.selectedSlot.model.equipCard(undefined, undefined, clickedView.slot);
                }
                if (this.selectedCard) {
                    // equip the selected card in this.selected
                    // clickedView.slot make sure that equipped cards tab slots have a slot, should be index
                    this.selectedSlot.model.equipCard(this.selectedCard.model, this.selectedCard.level, clickedView.slot);
                }
                this.selectedCard = undefined;
                this.render();
                return;
            } else if (clickedView.loc === 'card-inventory') {
                if (this.selectedSlot) {
                    this.selectedCard = clickedView;
                    this.render();
                    return;
                } else {
                    // nothing, you hover
                }
            } else {
                throw('shit');
            }
        },

        render: function() {
            // call remove() on all views, and stopListening on all views

            var ssmi, scmi;
            if (this.selectedSlot) {
                ssmi = this.selectedSlot.model.id;
                this.selectedSlot = this.selectedSlot.lookup();
            }
            if (this.selectedCard) {
                scmi = this.selectedCard.model.id;
                this.selectedCard = this.selectedCard.lookup();
            }

            _.each(this.views, function(view) {
                this.stopListening(view);
                view.remove();
            }, this);
            this.views = [];

            this.$el.html(this.template({}));

            var frag = document.createDocumentFragment();

            _.each(this.equipped.slots, function(slot) {
                var view = new ItemSlot({model: this.equipped[slot]}, 'equipped', slot);
                this.views.push(view);
                frag.appendChild(view.el);
            }, this);

            this.$('.equipped').append(frag);

            frag = document.createDocumentFragment();

            _.each(this.skillchain.skills, function(skill, i) {
                var view = new ItemSlot({model: skill}, 'skillchain', i);
                this.views.push(view);
                frag.appendChild(view.el);
            }, this);

            this.$('.skillchain').append(frag);

            if (this.selectedSlot) {
                var frag = document.createDocumentFragment();

                _.each(this.selectedSlot.model.cards, function(card, slot) {
                    var view = new ItemSlot({model: card}, 'equipped-cards', slot);
                    this.views.push(view);
                    frag.appendChild(view.el);
                }, this);

                this.$('.equipped-cards').append(frag);
            }


            if (this.selectedSlot) {
                var ctmtr = this.cards.getSlotCards(this.selectedSlot.slot);
            } else {
                var ctmtr = this.cards.models;
            }

            frag = document.createDocumentFragment();
            log.error('rendering, gonna try and render %d card type models', ctmtr.length);
            _.each(ctmtr, function(ctm, i) {
                for (var level = 1; level <= ctm.levels; level++) {
                    if (ctm.amts[level] > 0 && ctm.equipped[level] === 0) {
                        var view = new CardSlot({model: ctm}, level);
                        this.views.push(view);
                        frag.appendChild(view.el);
                    }
                }
            }, this);

            this.$('.card-inventory').append(frag);

            if (this.selectedSlot) {
                //this.selectedSlot = this.selectedSlot.lookup();
                this.selectedSlot = _.findWhere(this.views, this.selectedSlot);
                this.selectedSlot.select();
                if (this.selectedSlot.model.id !== ssmi) {
                    throw('fuck');
                }
            }
            if (this.selectedCard) {
                //this.selectedCard = this.selectedCard.lookup();
                var name = this.selectedCard.name;
                var level = this.selectedCard.level;
                log.info('resetting selected card, now:');
                console.log(this.selectedCard);
                for (var i = this.views.length - 1; i >= 0; i--) {
                    if (this.views[i].loc === 'card-inventory' && this.views[i].model.name === name && this.views[i].level === level) {
                        this.selectedCard = this.views[i];
                        this.selectedCard.select();
                        break;
                    }
                }
                log.info('after:');
                console.log(this.selectedCard);
                if (this.selectedCard.model.id !== scmi) {
                    throw('fuck you');
                }
            }

            _.each(this.views, function(view) {
                this.listenTo(view, 'click', this.onClick);
            }, this);

            // for each slot in equipped, make cardslot view
            // for each slot in skillchain, make cardslot view
            // for each cardtypemodel in cards:
            //     for (var i = 0; i < ctm.amts.length; i++):
            //         if (ctm.amts[i] > 0 && ctm.equipped[i] === 0) { make cardslot view }
            // when making, listen to click events triggered on views
            // this.selectedCard
            // this.selectedSlot

            // click handler
            return this;
        },
    });


    exports.extend({
        GameView: GameView,
        StatsTab: StatsTab,
        ItemTab: ItemTab
    });
});
