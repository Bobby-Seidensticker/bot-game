namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;
    var entity = namespace.bot.entity;

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options, game) {
            this.statsTab = new StatsTab({}, game);
            this.statsTab.onResize();
            this.itemTab = new ItemTab({}, game);
            this.cardTab = new CardTab({}, game);
            this.visView = new VisView({}, game);
            this.footerView = new FooterView({}, game);

            this.infoBox = new InfoBox();

            this.$el.append(this.statsTab.render().el);
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
            this.listenTo(window.DirtyListener, 'computeAttrs', this.render);
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
                var coolIn = Math.max(0, skill.coolAt - window.time);
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
            this.$el.css({width: window.innerWidth / 3});
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

        initialize: function() {
            this.listenTo(window.UIEvents, 'mouseover', this.show);
            this.listenTo(window.UIEvents, 'mouseout', this.hide);
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
            window.UIEvents.trigger('mouseover', this);
        },

        onMouseout: function() {
            window.UIEvents.trigger('mouseout');
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

            this.listenTo(window.DirtyListener, 'inventory:new', this.render);

            this.listenTo(window.DirtyListener, 'computeAttrs', this.render);
            this.listenTo(window.DirtyListener, 'skillComputeAttrs', this.render);
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
                        window.DirtyQueue.mark('equipChange');
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
                    window.DirtyQueue.mark('equipChange');
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
            window.UIEvents.trigger('mouseover', this);
        },

        onMouseout: function() {
            window.UIEvents.trigger('mouseout');
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
            this.listenTo(window.DirtyListener, 'cards:new', this.render);

            this.listenTo(window.DirtyListener, 'computeAttrs', this.render);  // should this be more specific?
            this.listenTo(window.DirtyListener, 'skillComputeAttrs', this.render);  // should this be more specific?
            this.listenTo(window.DirtyListener, 'equipChange', this.hardRender);
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
            this.listenTo(window.DirtyListener, 'hero:hp', this.hpChange);
            this.listenTo(window.DirtyListener, 'hero:mana', this.manaChange);
            this.listenTo(window.DirtyListener, 'revive', this.render);
        },

        hpChange: function() {
            this.$hp.html(Math.ceil(this.model.hp));
        },

        manaChange: function() {
            this.$mana.html(Math.ceil(this.model.mana));
        },

        render: function() {
            this.$el.html(this.template(this.model));
            this.$hp = this.$('.hp');
            this.$mana = this.$('.mana');
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
            /*this.skillchainView = new SkillchainFooterView({}, this.hero.skills, this.hero.spec.skillchain);
            this.zoneView = new ZoneFooterView({}, this.zone);
            this.buttons = new FooterButtonsView({});*/
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
            /*frag.appendChild(this.skillchainView.render().el);
            frag.appendChild(this.zoneView.render().el);
            frag.appendChild(this.buttons.render().el);*/
            this.$el.html(frag);
            return this;
        },
    });

    function transpose(coords) {
        return [coords[0] * RATIO, coords[1] * RATIO];
    }

    var REAL_SIZE = 300;
    var SIZE = 1000 * 1000;
    var RATIO = REAL_SIZE / SIZE;

    var VisView = Backbone.View.extend({
        tagName: 'canvas',
        className: 'vis',

        // this needs to get all zones, when game model changes, probably shoudl get all of gameModel
        initialize: function(options, game) {
            log.warning('visview init');
            this.zone = game.zone;

            this.clear();
            this.listenTo(window.DirtyListener, 'tick', this.render);
        },

        clear: function() {
            this.$el.attr({
                width: REAL_SIZE,
                height: REAL_SIZE
            });
            /*this.$canvas.css({
                top: this.$el.height() / 2 - REAL_SIZE / 2 - 1,
                left: this.$el.width() / 2 - REAL_SIZE / 2 - 1
            });*/
        },

        render: function() {
            this.zone.messages.prune();
            var msgs = this.zone.messages.msgs;
            this.clear();
            var ctx = this.el.getContext('2d');

            // draw all mons
            var room = this.zone.ensureRoom();
            var mons = this.zone.liveMons();

            _.each(mons, function(mon) {
                drawBody(ctx, mon, 'rgba(240, 20, 30, 1)');
            }, this);

            // draw hero
            var cpos = transpose([this.zone.hero.x, this.zone.hero.y]);
            drawBody(ctx, this.zone.hero, 'rgba(30, 20, 240, 1)');

            drawMessages(ctx, msgs);

            return this;
        },
    });

    function drawMessages(ctx, msgs) {
        _.each(msgs, function(msg) {
            ctx.fillStyle = msg.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.font = '14px sans-serif';
            var pos = transpose(msg.pos)
            ctx.fillText(msg.text, pos[0], pos[1] - (window.time - msg.time) / msg.lifespan * 20);
        });
    }

    function drawBody(ctx, body, color) {
        var coords = transpose([body.x, body.y]);
        circle(ctx, coords, color);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '14px sans-serif';
        ctx.fillText(body.spec.name, coords[0], coords[1] + 10);

        var pctHp = body.hp / body.spec.maxHp;
        ctx.fillStyle = "#A00";
        ctx.fillRect(coords[0] - 15,coords[1]- 20, pctHp * 30, 5);

        //ctx.fill();

        ctx.rect(coords[0] - 15,coords[1]- 20,30,5);
        ctx.stroke();
    }

    function circle(ctx, pos, color) {
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }

    exports.extend({
        GameView: GameView,
        StatsTab: StatsTab,
        ItemTab: ItemTab
    });
});
