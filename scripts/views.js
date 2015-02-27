namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;
    var entity = namespace.bot.entity;
    var VisView = namespace.bot.vis.VisView;
    var vu = namespace.bot.vectorutils;
    var Point = vu.Point;

    // highlight open tab
    // show unequip X on hover

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options, game) {
            log.info('GameView initialize');

            this.statsTab = new StatsTab({}, game);
            this.itemTab = new ItemTab({}, game);
            this.cardTab = new CardTab({}, game);
            this.mapTab = new MapTab({}, game);
            this.footerView = new FooterView({}, game);
            this.infoBox = new InfoBox();

            this.visView = new VisView({}, game, this);
            this.$el.append(this.visView.render().el);

            this.$el.append(this.statsTab.render().el);
            this.$el.append(this.mapTab.render().el);
            this.$el.append(this.itemTab.render().el);
            this.$el.append(this.cardTab.render().el);
            this.$el.append(this.infoBox.el);
            this.$el.append(this.footerView.render().el);
        },

        getCenter: function() {
            var left, right;
            if (this.statsTab.visible) {
                left = this.statsTab.$el.width();
            } else if (this.mapTab.visible) {
                left = this.mapTab.$el.width();
            } else {
                left = 0;
            }

            if (this.itemTab.visible) {
                right = this.itemTab.$el.width();
            } else if (this.cardTab.visible) {
                right = this.cardTab.$el.width();
            } else {
                right = 0;
            }

            return new Point(
                (window.innerWidth - left - right) / 2 + left,
                (window.innerHeight - 155) / 2
            );
        },
    });

    var MenuTabMixin = {
        // Mixing class needs to set a "name" string property for these logs to make sense
        show: function() {
            log.info('Showing %s tab', this.name);
            this.visible = true;
            this.$el.removeClass('hidden');
            this.render();
        },

        hide: function() {
            log.info('Hiding %s tab', this.name);
            this.visible = false;
            this.$el.addClass('hidden');
        },

        toggleVisible: function() {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
            gl.DirtyQueue.mark('centerChange');
        }
    };

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

            this.zone = game.zone;
            this.last = {};
            this.heroView = new EntityView({model: this.zone.hero});
            this.monsterViews = [];
            this.render();
            this.listenTo(gl.DirtyListener, 'zoneTick', this.render);

            // Related to MenuTabMixin
            this.name = 'Stats';
            this.hide();
            this.listenTo(gl.DirtyListener, 'footer:buttons:stats', this.toggleVisible);
            this.listenTo(gl.DirtyListener, 'footer:buttons:map', this.hide);

            this.$el.append('<div class="holder"></div>');
            this.$holder = this.$('.holder');

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - 155);
            this.$el.css({
                height: size.y
            });
            this.$('.holder').css({
                height: size.y
            });
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
                this.$holder.html(frag);
            }
            return this;
        },
    }).extend(MenuTabMixin);

    var InfoBox = Backbone.View.extend({
        tagName: 'div',
        className: 'infoBox',
        template: _.template($('#info-box-template').html()),

        initialize: function() {
            this.listenTo(gl.UIEvents, 'mouseover', this.show);
            this.listenTo(gl.UIEvents, 'mouseout', this.hide);

            this.listenTo(gl.DirtyListener, 'footer:buttons', this.hide);
            this.listenTo(gl.DirtyListener, 'hero:xp', this.render);
        },

        show: function(view) {
            if(view.model !== undefined) {
                this.view = view;
                this.render();
            }
        },

        hide: function() {
            this.view = undefined;
            this.render();
        },

        render: function() {
            if (this.view) {
                this.$el.css('display', 'block');
                // Avoid crashes due to undefineds
                this.$el.html(this.template(this.view));
            } else {
                this.$el.css('display', 'none');
            }

            return this;
        }
    });

    var ItemSlot = Backbone.View.extend({
        tagName: 'div',
        className: 'itemSlot',

        events: {
            'click': 'onClick',
            'mouseover': 'onMouseover',
            'mouseout': 'onMouseout',
        },

        onClick: function(event) {
            var cls = event.target.classList[0];
            if (cls === 'corner' && this.canUnequip) {
                this.trigger('unequip', this);
                return;
            }
            this.trigger('click', this);
        },

        onMouseover: function() {
            if (this.canUnequip) {
                this.$el.addClass('hovering');
            }
            this.trigger('hovering', this);
            gl.UIEvents.trigger('mouseover', this);
        },

        onMouseout: function() {
            this.$el.removeClass('hovering');
            this.trigger('hovering');
            gl.UIEvents.trigger('mouseout');
        },

        initialize: function(options, slot, equippedModel, canSelect, canUnequip) {
            this.slot = slot;
            this.equippedModel = equippedModel;
            this.template = _.template($('#item-slot-template').html());
            this.canSelect = canSelect;
            this.canUnequip = canUnequip;

            this.listenTo(gl.UIEvents, 'mouseover', this.onGlobalMouseover);
            this.listenTo(gl.UIEvents, 'mouseout', this.onGlobalMouseout);
            this.render();
        },

        canSelect: function() {
            // is NOT an equipped gear or skillchain slot
            return this.slot === undefined;
        },

        canUnequip: function() {
            return this.slot !== undefined && this.model;
        },

        select: function() { this.selected = true; this.$el.addClass('selected');  },
        unselect: function() { this.selected = false; this.$el.removeClass('selected'); },

        onGlobalMouseover: function(hoveredSlot) {
            if (hoveredSlot.slot !== undefined) { return; }  // Is a fixed slot, ignore

            if ((hoveredSlot.model.itemType === 'skill' && this.loc === 'skillchain') ||
                (hoveredSlot.model.itemType === 'weapon' && this.slot === 'weapon') ||
                (hoveredSlot.model.itemType === 'armor' && hoveredSlot.model.type === this.slot) ||
                (hoveredSlot.model.itemType === 'card' && hoveredSlot.model.slot === 'skill' && this.loc === 'skillchain') ||
                (hoveredSlot.model.itemType === 'card' && hoveredSlot.model.slot === this.slot )) {
                this.yellow = true;
                this.$el.addClass('yellow');
            }
        },

        onGlobalMouseout: function() {
            this.yellow = false;
            this.$el.removeClass('yellow');
        },
        
        render: function() {
            this.$el.html(this.template(this));
            if (this.model && this.model.disabled) {
                this.$el.addClass('red');
            }
            return this;
        }
    });

    var ItemTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#item-tab-template').html()),

        initialize: function(options, game) {
            this.equipped = game.hero.equipped;
            this.skillchain = game.hero.skillchain;
            this.inventory = game.inv;

            this.selected = undefined;
            this.hovering = undefined;

            this.listenTo(gl.DirtyListener, 'inventory:new', this.render);
            this.listenTo(gl.DirtyListener, 'hero:xp', this.render);
            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);
            this.listenTo(gl.DirtyListener, 'skillComputeAttrs', this.render);

            // Related to MenuTabMixin
            this.name = 'Items';
            this.hide();
            this.listenTo(gl.DirtyListener, 'footer:buttons:inv', this.toggleVisible);
            this.listenTo(gl.DirtyListener, 'footer:buttons:cards', this.hide);

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - 155);
            this.$el.css({
                left: size.x - 405,
                height: size.y
            });
        },

        onClick: function(itemSlot) {
            log.info('itemSlot on click, selected: %s', !!this.selected);

            if (itemSlot.canSelect) {
                var sameClicked = false;
                if (this.selected) {
                    sameClicked = itemSlot.model.id === this.selected.model.id;
                    this.selected.unselect();
                    this.selected = undefined;
                }
                if (!sameClicked) {
                    itemSlot.select();
                    this.selected = itemSlot;
                }
            } else {
                if (this.selected) {
                    var equipSuccess = itemSlot.equippedModel.equip(this.selected.model, itemSlot.slot);
                    this.selected.unselect();
                    this.selected = undefined;

                    if (equipSuccess) {
                        gl.DirtyQueue.mark('equipChange');
                        this.render();
                    }
                }
            }
        },

        onUnequip: function(itemSlot) {
            log.warning('itemSlot on unequip');

            if (this.selected) {
                this.selected.unselect();
                this.selected = undefined;
            }

            itemSlot.unselect();
            var unequipSuccess = itemSlot.equippedModel.equip(undefined, itemSlot.slot);
        },

        onHover: function(itemSlot) {
            if (itemSlot && itemSlot.canUnequip) {
                this.hovering = itemSlot;
            } else {
                this.hovering = undefined;
            }
        },

        newItemSlot: function(model, slot, parent) {
            var canSelect = slot === undefined;
            var canUnequip = slot !== undefined && model;
            var view = new ItemSlot({model: model}, slot, parent, canSelect, canUnequip);
            this.listenTo(view, 'click', this.onClick);
            this.listenTo(view, 'unequip', this.onUnequip);
            this.listenTo(view, 'hovering', this.onHover);
            this.allViews.push(view);
            return view;
        },

        render: function() {
            if (!this.visible) {
                return this;
            }

            this.$el.html(this.template());

            // properly remove all views
            _.each(this.allViews, function(view) { this.stopListening(view); view.remove(); }, this);
            this.allViews = [];

            var $equipped = this.$('.equipped');
            _.each(this.equipped.slots, function(slot) {
                var view = this.newItemSlot(this.equipped[slot], slot, this.equipped);
                $equipped.append(view.el);
            }, this);

            var $skillchain = this.$('.skillchain');
            _.each(this.skillchain.skills, function(skill, i) {
                var view = this.newItemSlot(skill, i, this.skillchain);
                $skillchain.append(view.el);
            }, this);

            var $unequipped = this.$('.unequipped');
            var items = _.filter(this.inventory.models, function(model) {
                return !model.equipped;
            });
            _.each(items, function(model) {
                var view = this.newItemSlot(model);
                $unequipped.append(view.el);
            }, this);

            if (this.selected) {
                var selectedView = _.find(this.allViews, function(view) { return view.model && this.selected.model.id === view.model.id; }, this);
                if (selectedView && selectedView.canSelect) {
                    selectedView.select();
                    this.selected = selectedView;
                } else {
                    this.selected = undefined;
                }
            }

            if (this.hovering) {
                var hoveringView = _.find(this.allViews, function(view) { return view.model && this.hovering.model.id === view.model.id; }, this);
                if (hoveringView && hoveringView.canUnequip) {
                    hoveringView.onMouseover();
                }
                this.hovering = hoveringView;
            }

            return this;
        },
    }).extend(MenuTabMixin);

    var CardTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#card-tab-template').html()),

        initialize: function(options, game) {
            this.equipped = game.hero.equipped;  // equippedGearModel;
            this.skillchain = game.hero.skillchain;  // skillchain;
            this.cardInv = game.cardInv; // cardTypeCollection;

            this.allViews = [];
            this.listenTo(gl.DirtyListener, 'cards:new', this.render);

            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);  // should this be more specific?
            this.listenTo(gl.DirtyListener, 'skillComputeAttrs', this.render);  // should this be more specific?
            this.listenTo(gl.DirtyListener, 'equipChange', this.hardRender);

            this.hide();
            this.listenTo(gl.DirtyListener, 'footer:buttons:cards', this.toggleVisible);
            this.listenTo(gl.DirtyListener, 'footer:buttons:inv', this.hide);

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - 155);
            this.$el.css({
                left: size.x - 405,
                height: size.y
            });
        },

        onClick: function(clickedView) {
            if (clickedView.isUnequipped) {
                log.warning('clicking unequipped');
                // unequipped card selecting logic
                if (this.selectedCard && clickedView.model.id === this.selectedCard.model.id) {
                    this.selectedCard.unselect();
                    this.selectedCard = undefined;
                } else {
                    clickedView.select();
                    this.selectedCard = clickedView;
                }
                return;
            }
            log.warning('Was not unequipped');
            if (clickedView.canSelect) {
                log.warning('clicked selectable');
                // equipped item selecting logic
                if (this.selectedItem && clickedView.model.id === this.selectedItem.model.id) {
                    this.selectedItem.unselect();
                    this.selectedItem = undefined;
                } else {
                    clickedView.select();
                    this.selectedItem = clickedView;
                }
                this.render();
                return;
            }
            log.warning('Was not selectable or unequipped');
            if (clickedView.isCard) {  // if it's a card and we can't select it, it's a card slot, try to equip
                // Implied: we have a selectedItem
                if (this.selectedCard) {
                    this.selectedItem.model.equipCard(this.selectedCard.model, clickedView.slot);
                    this.selectedCard.unselect();
                    this.selectedCard = undefined;
                }
                this.render();
                return;
            }
            log.warning('Was not selectable, unequipped, or card');
        },

        onUnequip: function(clickedView) {
            clickedView.equippedModel.equipCard(undefined, clickedView.slot);
        },

        onHover: function(hoveredView) {
            if (hoveredView && hoveredView.canUnequip) {
                this.hovering = hoveredView;
            } else {
                this.hovering = undefined;
            }
        },

        newItemSlot: function(model, slot, parent, canSelect, canUnequip, isCard) {
            var view = new ItemSlot({model: model}, slot, parent);
            view.canSelect = canSelect;
            view.canUnequip = canUnequip;
            view.isCard = isCard;
            view.isUnequipped = slot === undefined;

            log.info('Making new card tab item slot with model: %s and canSelect: %s, canUnequip: %s, isCard: %s, isUnequipped: %s, slot: %s',
                     model ? model.name : model, view.canSelect, view.canUnequip, view.isCard, view.isUnequipped, slot);

            this.listenTo(view, 'click', this.onClick);
            this.listenTo(view, 'unequip', this.onUnequip);
            this.listenTo(view, 'hovering', this.onHover);
            this.allViews.push(view);
            return view;
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

            this.$el.html(this.template());

            // call remove() on all views, and stopListening on all views
            _.each(this.allViews, function(view) { this.stopListening(view); view.remove(); }, this);
            this.allViews = [];

            var frag = document.createDocumentFragment();
            _.each(this.equipped.slots, function(slot) {
                // if model, can select, cannot unequip, is not card
                var view = this.newItemSlot(this.equipped[slot], slot, this.equipped, !!this.equipped[slot], false, false);
                this.allViews.push(view);
                frag.appendChild(view.el);
            }, this);
            this.$('.equipped').append(frag);

            frag = document.createDocumentFragment();
            _.each(this.skillchain.skills, function(skill, i) {
                // if model, can select, cannot unequip, is not card
                var view = this.newItemSlot(skill, i, this.skillchain, !!skill, false, false);
                this.allViews.push(view);
                frag.appendChild(view.el);
            }, this);
            this.$('.skillchain').append(frag);

            // If item selected, show item's cards
            if (this.selectedItem) {
                frag = document.createDocumentFragment();
                _.each(this.selectedItem.model.cards, function(card, slot) {
                    // cannot select, if model can unequip, is card
                    var view = this.newItemSlot(card, slot, this.selectedItem.model, false, !!card, true);
                    this.allViews.push(view);
                    frag.appendChild(view.el);
                }, this);
                this.$('.equipped-cards').append(frag);

                var cards = this.cardInv.getSlotCards(this.selectedItem.slot);  // get filtered cards
            } else {
                var cards = this.cardInv.models;  // get all cards
            }
            cards = _.filter(cards, function(card) { return !card.equipped; });

            frag = document.createDocumentFragment();
            _.each(cards, function(card) {
                // no slot, no parent, can select, cannot unequip, is card
                var view = this.newItemSlot(card, undefined, undefined, true, false, true);
                this.allViews.push(view);
                frag.appendChild(view.el);
            }, this);
            this.$('.unequipped').append(frag);

            // selected slot is an ItemSlot holding a equippedGear or skill model
            if (this.selectedItem) {
                var selectedView = _.find(this.allViews, function(view) { return view.model && this.selectedItem.model.id === view.model.id; }, this);
                if (selectedView && selectedView.canSelect) {
                    selectedView.select();
                    this.selectedItem = selectedView;
                } else {
                    this.selectedItem = undefined;
                }
            }
            if (this.selectedCard) {
                var selectedView = _.find(this.allViews, function(view) { return view.model && this.selectedCard.model.id === view.model.id; }, this);
                if (selectedView && selectedView.canSelect) {
                    selectedView.select();
                    this.selectedCard = selectedView;
                } else {
                    this.selectedCard = undefined;
                }
            }
            if (this.hovering) {
                var hoveringView = _.find(this.allViews, function(view) { return view.model && this.hovering.model.id === view.model.id; }, this);
                if (hoveringView && hoveringView.canUnequip) {
                    hoveringView.onMouseover();
                }
                this.hovering = hoveringView;
            }

            return this;
        },
    }).extend(MenuTabMixin);

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
            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);
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
            var size = new Point(window.innerWidth, window.innerHeight - 155);
            this.$el.css({
                width: size.x,
                top: size.y
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

    var ZoneMapTab = Backbone.View.extend({
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

    var MapTab = Backbone.View.extend({
        tagName: 'div',
        className: 'map',

        initialize: function(options, game) {
            this.zone = game.zone;

            this.name = 'Map';
            this.hide();
            this.listenTo(gl.DirtyListener, 'footer:buttons:stats', this.hide);
            this.listenTo(gl.DirtyListener, 'footer:buttons:map', this.toggleVisible);

            this.$el.html('<div class="holder"></div>');
            this.$holder = this.$('.holder');

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            this.$el.css({
                height: window.innerHeight - 155
            });
            this.$holder.css({
                height: window.innerHeight - 155
            });
        },

        show: function() {
            log.info('Showing MapTab');
            this.visible = true;
            this.$el.removeClass('hidden');
            this.render();
        },

        hide: function() {
            log.info('Hiding MapTab');
            this.visible = false;
            this.$el.addClass('hidden');
        },

        toggleVisible: function() {
            if (this.visible) {
                this.hide();
                gl.visLeft = 0;
                gl.visWidth = window.innerWidth;
            } else {
                this.show();
                gl.visLeft = this.$el.width();
                gl.visWidth = window.innerWidth - this.$el.width();
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
                sub = new ZoneMapTab({model: data});
                this.listenTo(sub, 'click', this.zoneClick);
                this.subs.push(sub);
                frag.appendChild(sub.render().el);
            }, this);

            this.$holder.html(frag);
            return this;
        }
    }).extend(MenuTabMixin);

    exports.extend({
        GameView: GameView,
        StatsTab: StatsTab,
        ItemTab: ItemTab
    });
});
