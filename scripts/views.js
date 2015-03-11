namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;
    var entity = namespace.bot.entity;
    var VisView = namespace.bot.vis.VisView;
    var vu = namespace.bot.vectorutils;
    var Point = vu.Point;

    var FOOTER_HEIGHT = 113;

    // highlight open tab
    // show unequip X on hover

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options, game) {
            log.info('GameView initialize');

            this.configTab = new ConfigTab({}, game);
            this.statsTab = new StatsTab({}, game);
            this.itemTab = new ItemTab({}, game);
            this.helpTab = new HelpTab({}, game);
            this.mapTab = new MapTab({}, game);
            this.cardTab = new CardTab({}, game);

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
            this.$el.append(this.configTab.render().el);
            this.$el.append(this.helpTab.render().el);
        },

        getCenter: function() {
            var left, right;
            if (this.statsTab.visible) {
                left = this.statsTab.$el.width();
            } else if (this.mapTab.visible) {
                left = this.mapTab.$el.width();
            } else if (this.helpTab.visible) {
                left = this.helpTab.$el.width();
            } else if (this.configTab.visible) {
                left = this.configTab.$el.width();
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
                (window.innerHeight - FOOTER_HEIGHT) / 2
            );
        },
    });

    var TabVisibilityManager = gl.Model.extend({
        // This is a handy class which handles events triggered by clicking the tab-opening buttons in the footer,
        //   shows or hides the appropriate tabs, and triggers tabShow and tabHide events for others to listen to.
        // Each TabView has an instance

        initialize: function(name, $el, render, showEventStr) { // hideEventStr1, hideEventStr2,..., hideEventStrN
            this.name = name;
            this.$el = $el;
            this.render = render; // Make sure render is bound to the correct this context
            this.visible = false;
            this.$el.addClass('hidden');
            this.listenTo(gl.UIEvents, showEventStr, this.toggleVisible);
            for (var i = 4; i < arguments.length; i++) {
                this.listenTo(gl.UIEvents, arguments[i], this.hide);
            }
        },

        show: function() {
            log.UI('Showing %s tab', this.name);
            this.visible = true;
            this.$el.removeClass('hidden');
            this.render();
            gl.UIEvents.trigger('tabShow', this.name);
        },

        hide: function() {
            log.info('Hiding %s tab', this.name);
            this.visible = false;
            this.$el.addClass('hidden');
            gl.UIEvents.trigger('tabHide', this.name);
        },

        toggleVisible: function() {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
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
        tagName: 'div',

        template: _.template($('#kv-table-template').html()),

        initialize: function(options) {
            // TODO add selective updating
            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);
        },

        render: function() {
            var skill, statname;
            var data = {};
            var skilldata = {};
            var body = this.model;
            var spec = body.spec;

            data.body = [
                ['Name', spec.name],
                ['Level', spec.level],
            ];

            for (var i = 0; i < this.model.skills.length; i++) {
                var arr = [];
                skill = this.model.skills[i];
                _.each(entity.dmgKeys, function(key) {
                    if(key == "projCount" && skill.spec.projCount <= 1) {
                        return;
                    }
                    if(key == "decayRange"){
                        return;
                    }
                    if(key == "radius" || key == "rate" || key == "angle"){ //todo only if not aoe
                        return;
                    }

                    
                    
                    statname = namespace.bot.itemref.ref.statnames[key];
                    arr.push([statname, skill.spec[key].toFixed(2)]);
                }, this);
                var coolIn = Math.max(0, skill.coolAt - gl.time);
                arr.push(['Cool In', Math.floor(coolIn)]);
                skilldata[skill.spec.name] = arr;
            }

            data.spec = [];
            var specKeys = entity.defKeys.concat(entity.eleResistKeys);
            var key;
            for (var i = 0; i < specKeys.length; i++) {
                key = specKeys[i];
                statname = namespace.bot.itemref.ref.statnames[key];
                data.spec.push([statname, this.model.spec[key].toFixed(2)]);
            }

            this.$el.html(this.template({data: data, skilldata: skilldata}));
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
            this.listenTo(gl.DirtyListener, 'zoneTick', this.render);

            this.tvm = new TabVisibilityManager('stats', this.$el, this.render.bind(this), 'footer:buttons:stats',
                                                'footer:buttons:map', 'footer:buttons:help', 'footer:buttons:config');

            this.$el.append('<div class="holder"></div>');
            this.$holder = this.$('.holder');

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
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
            if (!this.tvm.visible) {
                return this;
            }
            var diffs = this.diffs();
            this.$holder.html(this.heroView.render().el);
            return this;
        },
    });

    var InfoBox = Backbone.View.extend({
        tagName: 'div',
        className: 'infoBox',
        template: _.template($('#info-box-template').html()),

        initialize: function() {
            this.listenTo(gl.UIEvents, 'mouseenter', this.show);
            this.listenTo(gl.UIEvents, 'mouseleave', this.hide);

            this.listenTo(gl.DirtyListener, 'footer:buttons', this.hide);
            this.listenTo(gl.DirtyListener, 'hero:xp', this.render);

            this.listenTo(gl.UIEvents, 'tabShow', this.onTabShow);
            this.listenTo(gl.UIEvents, 'tabHide', this.onTabHide);

            this.visibleTabs = {};
        },

        onTabShow: function(name) {
            this.visibleTabs[name] = true;
            this.updateRight();
        },

        onTabHide: function(name) {
            this.visibleTabs[name] = false;
            this.updateRight();
        },

        updateRight: function() {
            if (this.visibleTabs['cards'] || this.visibleTabs['inv']) {
                this.$el.css('right', 410);
            } else {
                this.$el.css('right', 5);
            }
        },

        show: function(view) {
            if (view.model !== undefined) {
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
            'mousedown': 'onClick',
            'mouseenter': 'onMouseenter',
            'mouseleave': 'onMouseleave',
        },

        onClick: function(event) {
            log.UI("Clicked on ItemSlot in slot: %s, containing: %s", this.slot ? this.slot : "unequipped", this.model ? this.model.name : "empty");
            var cls = event.target.classList[0];
            if (cls === 'corner' && this.canUnequip) {
                this.trigger('unequip', this);
                return;
            }
            this.trigger('click', this);
        },

        onMouseenter: function() {
            if (this.canUnequip) {
                log.warning('adding hovering class on item slot');
                this.$el.addClass('hovering');
            }
            this.trigger('hovering', this);
            gl.UIEvents.trigger('mouseenter', this);
        },

        onMouseleave: function() {
            if (this.model) {
                if (this.tabName === "Items" || this.equippedModel === undefined ||
                    this.equippedModel.name !== "Equipped" &&
                    this.equippedModel.name !== "Skillchain") {
                    this.model.isNew = false;
                    gl.ItemEvents.trigger('newchange');
                }
                this.render();
            }
            log.info('onMouseleave');
            this.$el.removeClass('hovering');
            this.trigger('hovering');
            gl.UIEvents.trigger('mouseleave');
        },

        initialize: function(options, slot, equippedModel, canSelect, canUnequip, tabName, isCard) {
            this.slot = slot;
            this.showNew = false;
            this.tabName = tabName;
            this.isCard = isCard;
            this.equippedModel = equippedModel;
            this.template = _.template($('#item-slot-template').html());
            this.canSelect = canSelect;
            this.canUnequip = canUnequip;

            this.listenTo(gl.UIEvents, 'mouseenter', this.onGlobalMouseenter);
            this.listenTo(gl.UIEvents, 'mouseleave', this.onGlobalMouseleave);
            this.listenTo(gl.DirtyListener, 'cards:newchange', this.render);
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

        onGlobalMouseenter: function(hoveredSlot) {
            if (hoveredSlot.slot === undefined && this.slot !== undefined) {
                if (this.slot === hoveredSlot.model.slot ||
                    (typeof(this.slot) === 'number' && hoveredSlot.model.itemType === 'skill')) {
                    this.yellow = true;
                    this.$el.addClass('yellow');
                }
            }
        },

        onGlobalMouseleave: function() {
            this.yellow = false;
            this.$el.removeClass('yellow');
        },
        
        render: function() {
            if (this.model && this.model.isNew) {
                this.showNew = true;
            } else {
                this.showNew = false;
            }
            if (this.model && this.tabName === "Cards" && !this.isCard) {
                var loc = this.equippedModel.name;
                if (loc === "Skillchain" && this.equippedModel.newCards) {
                    this.showNew = true;
                } else if (loc === "Equipped" && this.equippedModel.newCards[this.slot]) {
                    this.showNew = true;
                } else {
                    this.showNew = false;
                }
            }
            this.$el.html(this.template(this));
            if (this.model && this.model.disabled) {
                this.$el.addClass('red');
            }
            return this;
        }
    });

    var FilterView = Backbone.View.extend({
        tagName: 'span',
        events: {
            'mousedown': 'onClick'
        },

        initialize: function(options, text, value) {
            this.el.innerHTML = text;
            this.value = value;
        },

        onClick: function() {
            this.trigger('click', this);
        },

        select: function() {
            this.selected = true;
            this.$el.addClass('selected');
        },

        unselect: function() {
            this.selected = false;
            this.$el.removeClass('selected');
        }
    });

    var AbstractFilterBarView = Backbone.View.extend({
        tagName: 'div',

        initialize: function(options, texts, values) {
            this.texts = texts;
            this.values = values;
            this.views = [];
        },

        render: function() {
            var frag = document.createDocumentFragment();
            var view;
            for (var i = 0; i < this.texts.length; i++) {
                view = new FilterView({}, this.texts[i], this.values[i]);
                this.listenTo(view, 'click', this.onClick);
                frag.appendChild(view.render().el);
                this.views.push(view);
            }
            this.$el.append(frag);

            this.views[0].select();
            this.selectedValue = this.views[0].value;

            return this;
        },

        onClick: function(view) {
            _.invoke(this.views, 'unselect');
            view.select();
            this.selectedValue = view.value;

            this.trigger('filterChange');
        },

        filter: function() { throw('This is an abstract class'); },
    });

    var WeaponTypeFilterBarView = AbstractFilterBarView.extend({
        filter: function(items) {
            if (this.selectedValue === undefined) {
                return items;
            }
            return _.filter(items, function(item) {
                if (item.itemType === 'armor') {
                    return false;
                }
                if (item.itemType === 'weapon') {
                    return item.weaponType === this.selectedValue;
                }
                if (item.itemType === 'skill') {
                    return item.skillType === this.selectedValue;
                }
            }, this);
        },
    });

    var SlotTypeFilterBarView = AbstractFilterBarView.extend({
        filter: function(items) {
            if (this.selectedValue === undefined) {
                return items;
            }
            return _.filter(items, function(item) {
                return item.slot === this.selectedValue;
            }, this);
        },
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

            this.renderedOnce = false;

            this.listenTo(gl.DirtyListener, 'inventory:new', this.render);
            this.listenTo(gl.DirtyListener, 'hero:xp', this.render);
            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);
            this.listenTo(gl.DirtyListener, 'skillComputeAttrs', this.render);

            this.tvm = new TabVisibilityManager('inv', this.$el, this.render.bind(this), 'footer:buttons:inv',
                                                'footer:buttons:cards');

            this.fb1 = new WeaponTypeFilterBarView({}, ['All', 'Ml', 'Ra', 'Sp'],
                                                   [undefined, 'melee', 'range', 'spell']).render();
            this.fb2 = new SlotTypeFilterBarView({}, ['All', 'We', 'He', 'Ch', 'Ha', 'Lg', 'Sk'],
                                                 [undefined, 'weapon', 'head', 'chest', 'hands', 'legs', 'skill']).render();

            this.listenTo(this.fb1, 'filterChange', this.render);
            this.listenTo(this.fb2, 'filterChange', this.render);

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
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
            log.UI('Unequipping: ' + itemSlot.model.name);
            if (this.selected) {
                this.selected.unselect();
                this.selected = undefined;
            }
            this.hovering = undefined;

            itemSlot.unselect();
            var unequipSuccess = itemSlot.equippedModel.equip(undefined, itemSlot.slot);
        },

        onHover: function(itemSlot) {
            this.hovering = itemSlot;
        },

        newItemSlot: function(model, slot, parent) {
            var canSelect = slot === undefined;
            var canUnequip = slot !== undefined && model;
            var view = new ItemSlot({model: model}, slot, parent, canSelect, canUnequip, "Items");
            this.listenTo(view, 'click', this.onClick);
            this.listenTo(view, 'unequip', this.onUnequip);
            this.listenTo(view, 'hovering', this.onHover);
            this.allViews.push(view);
            return view;
        },

        render: function() {
            if (!this.tvm.visible) {
                return this;
            }

            if (!this.renderedOnce) {
                this.$el.html(this.template());
                this.$('.filters').append(this.fb1.el);
                this.$('.filters').append(this.fb2.el);
                this.renderedOnce = true;
            }

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
            items = this.fb1.filter(items);
            items = this.fb2.filter(items);
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

            if (this.hovering && this.hovering.model) {
                this.hovering = _.find(this.allViews, function(view) { return view.model && this.hovering.model.id === view.model.id; }, this);
                this.hovering.onMouseenter();
            }

            return this;
        },
    });

    var CardTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#card-tab-template').html()),

        initialize: function(options, game) {
            this.name = 'Card';
            this.equipped = game.hero.equipped;      // equippedGearModel;
            this.skillchain = game.hero.skillchain;  // skillchain;
            this.cardInv = game.cardInv;             // cardTypeCollection;

            this.allViews = [];
            this.listenTo(gl.DirtyListener, 'cards:new', this.render);

            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);
            this.listenTo(gl.DirtyListener, 'skillComputeAttrs', this.render);
            this.listenTo(gl.DirtyListener, 'equipChange', this.hardRender);

            this.tvm = new TabVisibilityManager('cards', this.$el, this.render.bind(this), 'footer:buttons:cards',
                                                'footer:buttons:inv');

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
            this.$el.css({
                left: size.x - 405,
                height: size.y
            });
        },

        onClick: function(clickedView) {
            if (clickedView.isUnequipped) {
                log.info('clicking unequipped card %s', clickedView.model.name);
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
            log.info('Was not unequipped');
            if (clickedView.canSelect) {
                log.info('clicked selectable card');
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
            this.hovering = hoveredView;
        },

        newItemSlot: function(model, slot, parent, canSelect, canUnequip, isCard) {
            var view = new ItemSlot({model: model}, slot, parent, canSelect, canUnequip, "Cards", isCard);

            view.isUnequipped = slot === undefined;

            this.listenTo(view, 'click', this.onClick);
            this.listenTo(view, 'unequip', this.onUnequip);
            this.listenTo(view, 'hovering', this.onHover);
            this.allViews.push(view);
            return view;
        },

        hardRender: function() {
            this.selectedCard = undefined;
            this.selectedItem = undefined;
            return this.render();
        },

        render: function() {
            if (!this.tvm.visible) {
                return this;
            }

            this.$el.html(this.template({selectedItem: this.selectedItem}));

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
            if (this.hovering && this.hovering.model) {
                this.hovering = _.find(this.allViews, function(view) { return view.model && this.hovering.model.id === view.model.id; }, this);
                this.hovering.onMouseenter();
            }

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

    var SkillFooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'skill',
        template: _.template($('#skill-footer-template').html()),

        events: {
            'mouseenter .skill': 'onMouseenter',
            'mouseleave .skill': 'onMouseleave'
        },

        onMouseenter: function() {
            gl.UIEvents.trigger('mouseenter', {model: this.model.spec});
        },

        onMouseleave: function() {
            gl.UIEvents.trigger('mouseleave');
        },

        initialize: function(options, hero) {
            this.hero = hero;
            this.listenTo(gl.DirtyListener, 'tick', this.adjust);
        },

        adjust: function() {
            var SIZE = 73;
            var cdHeight = 0;
            var useWidth = 0;

            if (this.model.coolAt > gl.time) {
                var durPct = (this.hero.nextAction - gl.time) / this.hero.lastDuration;

                // cooling down but doesn't have cooldown, must be last used
                if (this.model.spec.cooldownTime === 0) {
                    useWidth = durPct;  // grep in use wipe while being in use
                    cdHeight = 0;       // red no cooldown wipe
                } else {
                    cdHeight = (this.model.coolAt - gl.time) / this.model.spec.cooldownTime;
                    if (cdHeight > 1) {  // if in use and has cooldown, cap cooldown wipe height, grey in use wipe
                        useWidth = durPct;
                        cdHeight = 1;
                    } else {
                        useWidth = 0;  // if just cooling down, no in use wipe
                    }
                }
                useWidth *= SIZE;
                cdHeight *= SIZE;
            }

            if (this.model.oom) { this.$skill.addClass('oom') } else { this.$skill.removeClass('oom'); }
            if (this.model.oor) { this.$skill.addClass('oor') } else { this.$skill.removeClass('oor'); }
            
            this.$cd.css('height', cdHeight);
            this.$use.css('width', useWidth);
        },

        render: function() {
            this.$el.html(this.template(this));
            this.$skill = this.$('.skill');
            this.$cd = this.$('.cooldown');
            this.$use = this.$('.use-bar');
            this.adjust();
            return this;
        }
    });

    var SkillchainFooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'skillchain',

        initialize: function(options, hero) {
            this.hero = hero;
            this.views = [];
            this.listenTo(gl.DirtyListener, 'bodySkillchainUpdated', this.render);
        },

        render: function() {
            this.$el.empty();

            this.views = _.map(this.hero.skills, function(model) { return new SkillFooterView({model: model}, this.hero); }, this);
            var frag = document.createDocumentFragment();
            _.each(this.views, function(view) { frag.appendChild(view.render().el); });
            this.$el.append(frag);

            return this;
        }
    });

    var PotionView = Backbone.View.extend({
        tagName: 'div',
        className: 'potion-holder',
        template: _.template($('#potion-template').html()),

        events: {
            'mousedown': 'use'
        },

        initialize: function(options, hero) {
            this.hero = hero;
            this.listenTo(gl.DirtyListener, 'tick', this.adjust);
        },

        use: function() {
            this.hero.tryUsePotion();
        },

        adjust: function() {
            var SIZE = 73;
            var pct = (this.hero.potionCoolAt - gl.time) / 10000;
            this.$cd.css('height', pct * SIZE);
        },

        render: function() {
            this.$el.html(this.template());
            this.$cd = this.$('.cooldown');
            return this;
        }
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

        initialize: function() {
            this.listenTo(gl.UIEvents, 'tabShow', this.onTabShow);
            this.listenTo(gl.UIEvents, 'tabHide', this.onTabHide);
            this.listenTo(gl.DirtyListener, 'footer:buttons:invshownew', this.invShowNew);
            this.listenTo(gl.DirtyListener, 'footer:buttons:invhidenew', this.invHideNew);
            this.listenTo(gl.DirtyListener, 'footer:buttons:cardshownew', this.cardShowNew);
            this.listenTo(gl.DirtyListener, 'footer:buttons:cardhidenew', this.cardHideNew);
        },
        
        invShowNew: function() {
            this.$('.invnewflag').show();
        },
        invHideNew: function() {
            this.$('.invnewflag').hide();
        },
        cardShowNew: function() {
            this.$('.cardnewflag').show();
        },
        cardHideNew: function() {
            this.$('.cardnewflag').hide();
        },
        
        events: {
            'mousedown .config-button': 'clickConfig',
            'mousedown .help-button': 'clickHelp',
            'mousedown .stats-button': 'clickStats',
            'mousedown .map-button': 'clickMap',
            'mousedown .inv-button': 'clickInv',
            'mousedown .cards-button': 'clickCards'
        },

        onTabShow: function(name) {
            this.$('.' + name + '-button').addClass('open');
        },

        onTabHide: function(name) {
            this.$('.' + name + '-button').removeClass('open');
        },

        clickConfig: function() { gl.UIEvents.trigger('footer:buttons:config') },
        clickHelp: function() { gl.UIEvents.trigger('footer:buttons:help'); },
        clickStats: function() { gl.UIEvents.trigger('footer:buttons:stats'); },
        clickMap: function() { gl.UIEvents.trigger('footer:buttons:map'); },
        clickInv: function() { gl.UIEvents.trigger('footer:buttons:inv'); },
        clickCards: function() { gl.UIEvents.trigger('footer:buttons:cards'); },

        render: function() {
            this.$el.html(this.template(this.zone));
            return this;
        },
    });

    var FooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'footer',

        initialize: function(options, game, visibleTabsInterface) {
            this.resize();
            $(window).on('resize', this.resize.bind(this));

            this.zone = game.zone;
            this.hero = this.zone.hero;

            this.heroBodyView = new HeroFooterView({model: this.hero});
            this.zoneView = new ZoneFooterView({}, this.zone);
            this.skillchainView = new SkillchainFooterView({}, this.hero);
            this.potionView = new PotionView({}, this.hero);
            this.buttons = new FooterButtonsView({}, visibleTabsInterface);
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
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
            frag.appendChild(this.potionView.render().el);
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
            'mousedown': 'onClick',
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

            this.tvm = new TabVisibilityManager('map', this.$el, this.render.bind(this), 'footer:buttons:map',
                                                'footer:buttons:stats', 'footer:buttons:help', 'footer:buttons:config');

            this.$el.html('<div class="holder"></div>');
            this.$holder = this.$('.holder');

            this.resize();
            $(window).on('resize', this.resize.bind(this));
            this.listenTo(gl.DirtyListener, 'zone:unlocked', this.render);
        },

        resize: function() {
            this.$el.css({
                height: window.innerHeight - FOOTER_HEIGHT
            });
            this.$holder.css({
                height: window.innerHeight - FOOTER_HEIGHT
            });
        },

        zoneClick: function(zoneName) {
            log.UI("MapTab: Clicked on zone: %s", zoneName);
            this.zone.nextZone = zoneName;
            this.zone.newZone(zoneName);
            this.render();
        },

        render: function() {
            if (!this.tvm.visible) {
                return this;
            }
            _.each(this.subs, function(sub) {
                sub.remove();
                this.stopListening(sub);
            }, this);
            this.subs = [];

            var frag = document.createDocumentFragment();
            var data, sub, name, zoneRef;

            var len = Math.min(this.zone.unlockedZones + 1, this.zone.zoneOrder.length);
            for (var i = 0; i < len; i++) {
                var name = this.zone.zoneOrder[i];
                var zoneRef = this.zone.allZones[name];
                data = _.extend({name: name, running: name === this.zone.nextZone}, zoneRef);
                sub = new ZoneMapTab({model: data});
                this.listenTo(sub, 'click', this.zoneClick);
                this.subs.push(sub);
                frag.appendChild(sub.render().el);
            }

            this.$holder.html(frag);
            return this;
        }
    });

    var ConfigTab = Backbone.View.extend({
        tagName: 'div',
        className: 'config',

        events: {
            'click #wipebutton': 'wipe'
        },

        initialize: function(options, game) {
            this.template = _.template($('#config-template').html());
            this.zone = game.zone;
            
            this.tvm = new TabVisibilityManager('config', this.$el, this.render.bind(this), 'footer:buttons:config',
                                                'footer:buttons:map', 'footer:buttons:help', 'footer:buttons:stats');

            this.$el.html('<div class="holder"></div>');
            this.$holder = this.$('.holder');

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            this.$el.css({
                height: window.innerHeight - FOOTER_HEIGHT
            });
            this.$holder.css({
                height: window.innerHeight - FOOTER_HEIGHT
            });
        },

        render: function() {
            if (!this.tvm.visible) {
                return this;
            }
            this.$holder.html(this.template);
            this.$('#namebutton').bind('click', this.nameButton);
            this.$('#devbutton').bind('click', this.devButton);
            return this;
        },

        wipe: function() {
            localStorage.removeItem('data');
            location.reload();
        },

        nameButton: function() {
            var userInput = $('#charname').val();
            gl.game.hero.name = userInput.length < 64 ? userInput : "SMARTASS";
        },
        
        devButton: function() {
            var msg = $('#devmsg').val();
            if(msg != "") {
                gl.FB.child(gl.VERSION_NUMBER).child('feedback').push(localStorage.getItem('uid') + " - " + gl.game.hero.name + " says:" + msg);
            }
            $('#devmsg').val('');
        },
        
    });

    var HelpTab = Backbone.View.extend({
        tagName: 'div',
        className: 'help',

        initialize: function(options, game) {
            this.template = _.template($('#help-template').html());
            this.zone = game.zone;

            this.tvm = new TabVisibilityManager('help', this.$el, this.render.bind(this), 'footer:buttons:help',
                                                'footer:buttons:map', 'footer:buttons:config', 'footer:buttons:stats');

            this.$el.html('<div class="holder"></div>');
            this.$holder = this.$('.holder');

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            this.$el.css({
                height: window.innerHeight - FOOTER_HEIGHT
            });
            this.$holder.css({
                height: window.innerHeight - FOOTER_HEIGHT
            });
        },

        render: function() {
            if (!this.tvm.visible) {
                return this;
            }
            this.$holder.html(this.template);
            return this;
        }
    });

    exports.extend({
        GameView: GameView,
        StatsTab: StatsTab,
        ItemTab: ItemTab
    });
});
