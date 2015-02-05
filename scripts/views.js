namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;
    var entity = namespace.bot.entity;
    var VisView = namespace.bot.vis.VisView;

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options, game) {
            this.statsTab = new StatsTab({}, game);
            this.statsTab.onResize();
            this.itemTab = new ItemTab({}, game);
            this.cardTab = new CardTab({}, game);
            this.visView = new VisView({}, game);
            this.mapView = new MapView({}, game);
            this.footerView = new FooterView({}, game);

            this.infoBox = new InfoBox();

            this.$el.append(this.statsTab.render().el);
            this.$el.append(this.mapView.render().el);
            this.$el.append(this.itemTab.render().el);
            this.$el.append(this.cardTab.render().el);
            this.$el.append(this.infoBox.el);
            this.$el.append(this.visView.render().el);
            this.$el.append(this.footerView.render().el);
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
            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);
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
                var coolIn = Math.max(0, skill.coolAt - gl.time);
                arr.push(['cool in', coolIn]);
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

            this.hide();
            this.listenTo(gl.DirtyListener, 'tick', this.render);
            this.listenTo(gl.DirtyListener, 'footer:buttons:stats', this.toggleVisible);
            this.listenTo(gl.DirtyListener, 'footer:buttons:map', this.hide);

            $(window).on('resize', this.onResize.bind(this));

            //var zone = new ZoneView({model: this.game.zone});
            /*
            this.headerView = new HeaderView();
            this.menuView = new MenuView();
            this.visView = new VisView({}, options.gameModel);
            this.messagesView = new MessagesView({collection: options.messageCollection});*/
        },

        show: function() {
            log.info('Showing StatsTab');
            this.visible = true;
            this.$el.removeClass('hidden');
            this.render();
        },

        hide: function() {
            log.info('Hiding ItemTab');
            this.visible = false;
            this.$el.addClass('hidden');
        },

        toggleVisible: function() {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
        },

        onResize: function() {
            this.$el.css({width: gl.innerWidth / 3});
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
            if (!this.visible) {
                return this;
            }
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

        initialize: function() {
            this.listenTo(gl.UIEvents, 'mouseover', this.show);
            this.listenTo(gl.UIEvents, 'mouseout', this.hide);

            this.listenTo(gl.DirtyListener, 'footer:buttons', this.hide);
        },

        show: function(view) {
            this.$el.css('display', 'block');
            this.$el.html(this.template(_.extend({}, {model: undefined, level: 'hngg'}, view)));
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
            gl.UIEvents.trigger('mouseover', this);
        },

        onMouseout: function() {
            gl.UIEvents.trigger('mouseout');
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
            if (this.model) {
                if (this.model.disabled) {
                    this.$el.addClass('disabled');
                } else {
                    this.$el.removeClass('disabled');
                }
            }
            return this;
        }
    });

    // TODO: fix all of this

    var ItemTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#item-tab-template').html()),

        initialize: function(options, game) {  // itemCollection, equippedGearModel, skillchain) {
            this.equipped = game.hero.equipped;  // equippedGearModel;
            this.skillchain = game.hero.skillchain;  // skillchain;
            this.inventory = game.inv; // itemCollection;

            this.subs = {
                equipped: [],
                skillchain: [],
                inventory: []
            };

            this.hide();
            this.listenTo(gl.DirtyListener, 'inventory:new', this.render);
            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);
            this.listenTo(gl.DirtyListener, 'skillComputeAttrs', this.render);
            this.listenTo(gl.DirtyListener, 'footer:buttons:inv', this.toggleVisible);
            this.listenTo(gl.DirtyListener, 'footer:buttons:cards', this.hide);
        },

        show: function() {
            log.info('Showing ItemTab');
            this.visible = true;
            this.$el.removeClass('hidden');
            this.render();
        },

        hide: function() {
            log.info('Hiding ItemTab');
            this.visible = false;
            this.$el.addClass('hidden');
        },

        toggleVisible: function() {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
        },

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
                        gl.DirtyQueue.mark('equipChange');
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
                    gl.DirtyQueue.mark('equipChange');
                    var unequippingModel = itemSlot.model;
                    itemSlot.empty();
                    this.addItemSlot(unequippingModel, 'inventory');
                }
            }

            this.rerenderInv();
        },

        rerenderInv: function() {
            var views = _.filter(this.subs.inventory, function(view) { return view.model !== undefined && view.model.equipped === false; });
            var i = 0;
            for (; i < views.length; i++) {
                this.subs.inventory[i].fill(views[i].model);
            }
            for (; i < this.subs.inventory.length; i++) {
                this.stopListening(this.subs.inventory[i]);
                this.subs.inventory[i].remove();
            }
            this.subs.inventory = this.subs.inventory.slice(0, views.length);
        },

        newItemSlot: function(model, loc, slot) {
            var view = new ItemSlot({model: model}, loc, slot);
            this.listenTo(view, 'click', this.onClick);
            this.subs[loc].push(view);
            return view;
        },

        addItemSlot: function(model, loc, slot) {
            log.error('adding item slot');
            var el = this.newItemSlot(model, loc).el;
            this.$('.' + loc).append(el);
        },

        render: function() {
            if (!this.visible) {
                return this;
            }
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

        initialize: function(options, level, loc, slot) {
            this.level = level;
            this.loc = loc;                //this.loc = 'card-inventory';
            this.slot = slot;
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
            gl.UIEvents.trigger('mouseover', this);
        },

        onMouseout: function() {
            gl.UIEvents.trigger('mouseout');
        },

        select: function() { this.$el.addClass('selected'); },

        render: function() {
            this.$el.html(this.template(_.extend({model: this.model}, this)));
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
            this.cardInv = game.cardInv; // cardTypeCollection;

            this.views = [];
            this.listenTo(gl.DirtyListener, 'cards:new', this.render);

            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);  // should this be more specific?
            this.listenTo(gl.DirtyListener, 'skillComputeAttrs', this.render);  // should this be more specific?
            this.listenTo(gl.DirtyListener, 'equipChange', this.hardRender);

            this.hide();
            this.listenTo(gl.DirtyListener, 'footer:buttons:cards', this.toggleVisible);
            this.listenTo(gl.DirtyListener, 'footer:buttons:inv', this.hide);
        },

        show: function() {
            log.info('Showing CardTab');
            this.visible = true;
            this.$el.removeClass('hidden');
            this.render();
        },

        hide: function() {
            log.info('Hiding CardTab');
            this.visible = false;
            this.$el.addClass('hidden');
        },

        toggleVisible: function() {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
        },

        onClick: function(clickedView) {
            if (clickedView.loc === 'skillchain' || clickedView.loc === 'equipped') {
                if (clickedView.model) {
                    if (this.selectedSlot) {
                        if (this.selectedSlot.model.id === clickedView.model.id) {
                            this.hardRender();
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
                    this.hardRender();
                    return;
                }
            } else if (clickedView.loc === 'equipped-cards') {
                if (this.selectedCard) {
                    this.selectedSlot.model.equipCard({model: this.selectedCard.model, level: this.selectedCard.level}, clickedView.slot);
                } else {
                    this.selectedSlot.model.equipCard(undefined, clickedView.slot);
                }
                this.selectedCard = undefined;
                this.render();
                return;
            } else if (clickedView.loc === 'card-inventory') {
                if (this.selectedSlot) {
                    this.selectedCard = clickedView;
                    this.render();
                    return;
                }
            } else {
                throw('shit');
            }
        },

        hardRender: function() {
            this.selectedCard = undefined;
            this.selectedSlot = undefined;
            return this.render();
        },

        render: function() {
            if (!this.visible) {
                return this;
            }
            // call remove() on all views, and stopListening on all views
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
                    if (card) {
                        var view = new CardSlot({model: card.model}, card.level, 'equipped-cards', slot);
                    } else {
                        var view = new CardSlot({}, undefined, 'equipped-cards', slot);
                    }
                    this.views.push(view);
                    frag.appendChild(view.el);
                }, this);

                this.$('.equipped-cards').append(frag);
            }


            if (this.selectedSlot) {
                var ctmtr = this.cardInv.getSlotCTMs(this.selectedSlot.slot);
            } else {
                var ctmtr = this.cardInv.models;
            }

            frag = document.createDocumentFragment();
            _.each(ctmtr, function(ctm, i) {
                for (var level = 1; level <= ctm.levels; level++) {
                    if (ctm.amts[level] > 0 && ctm.equipped[level] === 0) {
                        var view = new CardSlot({model: ctm}, level, 'card-inventory');
                        this.views.push(view);
                        frag.appendChild(view.el);
                    }
                }
            }, this);

            this.$('.card-inventory').append(frag);

            // selected slot is an ItemSlot holding a equippedGear or skill model
            if (this.selectedSlot) {
                for (var i = 0; i < this.views.length; i++) {
                    var v = this.views[i];
                    if (v.model && v.model.id === this.selectedSlot.model.id) {
                        this.selectedSlot = v;
                        this.selectedSlot.select();
                        break;
                    }
                }
            }
            // selected card is a CardSlot holding a CardTypeModel and has a level
            if (this.selectedCard) {
                for (var i = 0; i < this.views.length; i++) {
                    var v = this.views[i];
                    if (v.model && v.model.id === this.selectedCard.model.id && v.level === this.selectedCard.level) {
                        this.selectedCard = v;
                        this.selectedCard.select();
                        break;
                    }
                }
            }

            _.each(this.views, function(view) {
                this.listenTo(view, 'click', this.onClick);
            }, this);

            return this;
        },
    });

    var HeroFooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'hero',
        template: _.template($('#hero-footer-template').html()),

        initialize: function() {
            this.listenTo(gl.DirtyListener, 'hero:hp', this.hpChange);
            this.listenTo(gl.DirtyListener, 'hero:mana', this.manaChange);
            this.listenTo(gl.DirtyListener, 'hero:xp', this.xpChange);
            this.listenTo(gl.DirtyListener, 'hero:levelup', this.render);
            this.listenTo(gl.DirtyListener, 'revive', this.render);
        },

        hpChange: function() {
            this.$hp.html(Math.ceil(this.model.hp));
        },

        manaChange: function() {
            this.$mana.html(Math.ceil(this.model.mana));
        },

        xpChange: function() {
            this.$xp.html(Math.floor(this.model.spec.xp));
        },

        render: function() {
            this.$el.html(this.template(this.model));
            this.$hp = this.$('.hp');
            this.$mana = this.$('.mana');
            this.$xp = this.$('.xp');
            return this;
        },
    });

    var SkillchainFooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'skillchain',
        template: _.template($('#skillchain-footer-template').html()),

        initialize: function(options, hero) {
            this.hero = hero;
            this.listenTo(gl.DirtyListener, 'bodySkillchainUpdated', this.render);
            this.listenTo(gl.DirtyListener, 'tick', this.adjust);
        },

        getSkills: function() {
            this.data = _.compact(this.hero.skills);
            for (var i = 0; i < this.data.length; i++) {
                var s = this.data[i];
                this.data[i] = {
                    name: s.spec.name,
                    skill: s,
                    cdHeight: 0,
                    useWidth: 0,
                    $cd: undefined,
                    $use: undefined
                };
            }
        },

        getEls: function() {
            var $cds = this.$('.cooldown');
            var $uses = this.$('.use-bar');
            for (var i = 0; i < this.data.length; i++) {
                this.data[i].$cd = $($cds[i]);
                this.data[i].$use = $($uses[i]);
            }
        },

        calc: function() {
            var SIZE = 90;
            var useWidth = 0;

            for (var i = 0; i < this.data.length; i++) {
                var d = this.data[i];
                d.useWidth = 0;

                if (d.skill.coolAt <= gl.time) {
                    d.cdHeight = 0;
                    d.useWidth = 0;
                } else {
                    var durPct = (this.hero.nextAction - gl.time) / this.hero.lastDuration;

                    // cooling down but doesn't have cooldown, must be last used
                    if (d.skill.spec.cooldownTime === 0) {
                        d.useWidth = durPct;  // grep in use wipe while being in use
                        d.cdHeight = 0;       // red no cooldown wipe
                    } else {
                        d.cdHeight = (d.skill.coolAt - gl.time) / d.skill.spec.cooldownTime;
                        if (d.cdHeight > 1) {  // if in use and has cooldown, cap cooldown wipe height, grey in use wipe
                            d.useWidth = durPct;
                            d.cdHeight = 1;
                        } else {
                            d.useWidth = 0;  // if just cooling down, no in use wipe
                        }
                    }
                    d.useWidth *= SIZE;
                    d.cdHeight *= SIZE;
                }
            }
        },

        adjust: function() {
            this.calc();

            _.each(this.data, function(d) {
                d.$cd.css('height', d.cdHeight);
                d.$use.css('width', d.useWidth);
            });
        },

        render: function() {
            this.getSkills();

            this.$el.html(this.template(this));

            this.getEls();

            this.adjust();
            return this;
        },
    });

    var ZoneFooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'zone',
        template: _.template($('#zone-footer-template').html()),

        initialize: function(options, zone) {
            this.zone = zone;
            this.listenTo(gl.DirtyListener, 'zone', this.render);
            this.listenTo(gl.DirtyListener, 'monsters:death', this.render);
        },

        render: function() {
            this.$el.html(this.template(this.zone));
            return this;
        },
    });

    var FooterButtonsView = Backbone.View.extend({
        tagName: 'div',
        className: 'buttons',
        template: _.template($('#buttons-footer-template').html()),

        events: {
            'click .stats-button': 'clickStats',
            'click .map-button': 'clickMap',
            'click .inv-button': 'clickInv',
            'click .cards-button': 'clickCards'
        },

        clickStats: function() { gl.DirtyQueue.mark('footer:buttons:stats'); console.log('stat click'); },
        clickMap: function() { gl.DirtyQueue.mark('footer:buttons:map'); console.log('map click'); },
        clickInv: function() { gl.DirtyQueue.mark('footer:buttons:inv'); console.log('inv click'); },
        clickCards: function() { gl.DirtyQueue.mark('footer:buttons:cards'); console.log('cards click'); },

        initialize: function(options) {},

        render: function() {
            this.$el.html(this.template(this.zone));
            return this;
        },
    });

    var FooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'footer',

        initialize: function(options, game) {
            this.resize();
            $(window).on('resize', this.resize.bind(this));

            this.zone = game.zone;
            this.hero = this.zone.hero;

            this.heroBodyView = new HeroFooterView({model: this.hero});
            this.zoneView = new ZoneFooterView({}, this.zone);
            this.skillchainView = new SkillchainFooterView({}, this.hero);
            this.buttons = new FooterButtonsView({});
        },

        resize: function() {
            var s = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: s[0],
                top: s[1] - 150 - 5
            });
        },

        render: function() {
            var frag = document.createDocumentFragment();
            frag.appendChild(this.heroBodyView.render().el);
            frag.appendChild(this.zoneView.render().el);
            frag.appendChild(this.skillchainView.render().el);
            frag.appendChild(this.buttons.render().el);
            this.$el.html(frag);
            return this;
        },
    });

    var ZoneMapView = Backbone.View.extend({
        tagName: 'div',
        className: 'zone noselect',
        template: _.template($('#zone-map-tab-template').html()),

        events: {
            'click': 'onClick',
        },

        onClick: function() {
            this.trigger('click', this.model.name);
        },

        render: function() {
            if (this.model.running) {
                this.$el.addClass('running');
            }
            this.$el.html(this.template(this.model));
            return this;
        },
    });

    var MapView = Backbone.View.extend({
        tagName: 'div',
        className: 'map',

        initialize: function(options, game) {
            this.zone = game.zone;
            this.hide();
            this.listenTo(gl.DirtyListener, 'footer:buttons:stats', this.hide);
            this.listenTo(gl.DirtyListener, 'footer:buttons:map', this.toggleVisible);
        },

        show: function() {
            log.info('Showing MapView');
            this.visible = true;
            this.$el.removeClass('hidden');
            this.render();
        },

        hide: function() {
            log.info('Hiding MapView');
            this.visible = false;
            this.$el.addClass('hidden');
        },

        toggleVisible: function() {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
        },

        zoneClick: function(zoneName) {
            this.zone.nextZone = zoneName;
            this.zone.newZone(zoneName);
            this.render();
        },

        render: function() {
            if (!this.visible) {
                return this;
            }
            _.each(this.subs, function(sub) {
                sub.remove();
                this.stopListening(sub);
            }, this);
            this.subs = [];

            var frag = document.createDocumentFragment();
            var data, sub;

            _.each(this.zone.allZones, function(zoneRef, name) {
                data = _.extend({name: name, running: name === this.zone.nextZone}, zoneRef);
                sub = new ZoneMapView({model: data});
                this.listenTo(sub, 'click', this.zoneClick);
                this.subs.push(sub);
                frag.appendChild(sub.render().el);
            }, this);

            this.$el.html(frag);
            return this;
        }
    });

    exports.extend({
        GameView: GameView,
        StatsTab: StatsTab,
        ItemTab: ItemTab
    });
});
