namespace.module('bot.views', function(exports, require) {

    var FOOTER_HEIGHT = 114;
    var log, entity, VisView, vu, Point, PointFromEvent, utils, presentableSlot, prettifyNum;

    $(function() {
        log = namespace.bot.log;
        entity = namespace.bot.entity;
        VisView = namespace.bot.vis.VisView;
        vu = namespace.bot.vectorutils;
        Point = vu.Point;
        PointFromEvent = vu.PointFromEvent;
        utils = namespace.bot.utils;
        presentableSlot = utils.presentableSlot;
        prettifyNum = utils.prettifyNum;
    });

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
            if (this.statsTab.tvm.visible) {
                left = this.statsTab.$el.width();
            } else if (this.mapTab.tvm.visible) {
                left = this.mapTab.$el.width();
            } else if (this.helpTab.tvm.visible) {
                left = this.helpTab.$el.width();
            } else if (this.configTab.tvm.visible) {
                left = this.configTab.$el.width();
            } else {
                left = 0;
            }

            if (this.itemTab.tvm.visible) {
                right = this.itemTab.$el.width();
            } else if (this.cardTab.tvm.visible) {
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

        initialize: function(name, $el, render, showEventStr) { // hideEventStr1, hideEventStr2, ..., hideEventStrN
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
            gl.DirtyQueue.mark('centerChange');
        }
    });

    var EntityView = Backbone.View.extend({
        tagName: 'div',

        template: _.template($('#kv-table-template').html()),

        initialize: function(options, zone) {
            // TODO add selective updating
            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);
            this.zone = zone;
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
                    if (key === 'projCount' && skill.spec.projCount <= 1) {
                        return;
                    }
                    if (key === 'decayRange') {
                        return;
                    }
                    if (key === 'radius' || key === 'rate' || key === 'angle') {  // todo only if not aoe
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
                if (key === 'dodge') {
                    statname = 'Approx. Dodge Chance (this zone)';
                    var dodge = this.model.spec.dodge;
                    var level = this.zone.level;
                    var attAcc = (9 + level) * 2;
                    var chance = 1 - (3 * 0.5 * (attAcc / (attAcc + dodge)));
                    data.spec.push([statname, Math.min(0.99, chance.toFixed(2))]);
                }
                if (key === 'armor') {
                    var fakeDmg = 10 * Math.pow(1.06, this.zone.level);
                    var redFactor = fakeDmg / (fakeDmg + this.model.spec.armor);
                    data.spec.push(['Est. Physical Damage Taken after Armor (this zone)', redFactor.toFixed(2)]);
                }
            }
            var version = this.model.spec.versionCreated.split('-').join('.');
            data.spec.push(['Character Version', version]);

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
            this.heroView = new EntityView({model: this.zone.hero}, this.zone);
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
            this.listenTo(gl.UIEvents, 'itemSlotMouseenter', this.show);
            this.listenTo(gl.UIEvents, 'itemSlotMouseleave', this.hide);

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
    var FilterView = Backbone.View.extend({
        tagName: 'span',
        events: {'mousedown': 'onClick'},
        onClick: function() { this.trigger('click', this); },

        initialize: function(options, text, value) {
            this.el.innerHTML = text;
            this.value = value;
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
            gl.DirtyQueue.mark('filterChange');
        },

        filter: function() { throw ('This is an abstract class'); },
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

    var DragHandler = Backbone.View.extend({
        tagName: 'div',
        template: _.template($('#draggable-template').html()),
        className: 'dragSlot',

        DISABLED: 0,
        DISABLED_WAIT: 1,
        UP_DRAG: 2,
        DOWN_DRAG: 3,

        initialize: function(extraMDF) {
            this.uid = _.uniqueId('mml');
            this.state = this.DISABLED;
            this.extraMDF = extraMDF;
            $('body').append(this.el);
            $('body').on('mousedown ' + this.uid, this.onMousedown.bind(this));
            $('body').on('mousemove ' + this.uid, this.onMousemove.bind(this));
            $('body').on('mouseup ' + this.uid, this.onMouseup.bind(this));

            $(window).on('resize', this.updateBodySize.bind(this));
            this.updateBodySize();
        },

        onViewMousedown: function(event, model) {
            if (this.state === this.DISABLED) {
                log.info('disabled to disabled wait');
                this.state = this.DISABLED_WAIT;
                this.model = model;
                this.dragStart = PointFromEvent(event);
                this.$el.html(this.template(this.model));
            }
        },

        onMousedown: function(event) {
            if (this.extraMDF !== undefined) {
                this.extraMDF(event);
            }
            if (this.state === this.UP_DRAG) {
                log.info('up drag to down drag');
                this.state = this.DOWN_DRAG;
            }
        },

        onMousemove: function(event) {
            if (this.state === this.DISABLED_WAIT) {
                if (this.dragStart.dist2(PointFromEvent(event)) > 25) {
                    log.info('disabled wait to down drag');
                    this.state = this.DOWN_DRAG;
                    this.startDragging(event);
                }
            } else if (this.state === this.DOWN_DRAG || this.state === this.UP_DRAG) {
                this.updatePos(event);
            }
        },

        onMouseup: function(event) {
            if (this.state === this.DISABLED_WAIT) {
                log.info('Disabled wait to up drag');
                this.state = this.UP_DRAG;
                this.startDragging(event);
            } else if (this.state === this.DOWN_DRAG) {
                log.info('down drag to disabled');
                this.state = this.DISABLED;
                this.stopDragging(event);
            }
        },

        isDraggingThis: function(model) {
            return (this.state === this.DOWN_DRAG || this.state === this.UP_DRAG) &&
                this.model.id === model.id;
        },

        startDragging: function(event) {
            this.$el.css('display', 'block');
            this.updatePos(event);

            this.trigger('dragstart');
        },

        stopDragging: function(event) {
            log.info('DROP');

            this.state = this.DISABLED;
            this.$el.css('display', 'none');
            var model = this.model;
            this.model = undefined;
            this.trigger('drop', PointFromEvent(event), model);
        },

        updateBodySize: function() {
            this.bodySize = new Point(window.innerWidth, window.innerHeight);
        },

        updatePos: function(event) {
            var left = event.pageX - 37;
            var top = event.pageY - 37;

            if (left < 0) {
                left = 0;
            }
            if (left + 77 > this.bodySize.x) {
                left = this.bodySize.x - 77;
            }
            if (top < 0) {
                top = 0;
            }
            if (top + 77 > this.bodySize.y) {
                top = this.bodySize.y - 77;
            }

            this.$el.css({ top: top, left: left });
        },

        remove: function() {
            Backbone.View.prototype.remove.call(this);
            $('body').off('mousedown ' + this.uid, this.onMousedown.bind(this));
            $('body').off('mousemove ' + this.uid, this.onMousemove.bind(this));
            $('body').off('mouseup ' + this.uid, this.onMouseup.bind(this));
        }
    });

    var ItemSlot = Backbone.View.extend({
        tagName: 'div',
        className: 'itemSlot',
        template: _.template($('#item-slot-template').html()),

        events: {
            'mousedown': 'onMousedown',
            'mouseenter': 'onMouseenter',
            'mouseleave': 'onMouseleave'
        },

        onMousedown: function(event) {
            if (this.model) {
                this.dragHandler.onViewMousedown(event, this.model);
                this.render();
            }
        },

        onMouseenter: function() {
            gl.UIEvents.trigger('itemSlotMouseenter', this);
            this.trigger('hovering', this);
        },

        onMouseleave: function() {
            if (this.model && this.model.isNew) {
                log.error('removing is new from model %s', this.model.name);
                this.model.isNew = false;
                this.render();
                gl.DirtyQueue.mark('removeNew');
            }
            this.trigger('hovering');
            gl.UIEvents.trigger('itemSlotMouseleave');
        },

        initialize: function(options, dragHandler, slot, equipper) {
            this.dragHandler = dragHandler;

            if (slot !== undefined) {
                this.slot = slot;
                this.equipper = equipper;
                this.listenTo(this.dragHandler, 'drop', this.onDrop);
            } else {
                this.slot = undefined;
            }
            this.listenTo(this.dragHandler, 'dragstart', this.render);

            this.listenTo(gl.UIEvents, 'itemSlotMouseenter', this.onOtherMouseenter);
            this.listenTo(gl.UIEvents, 'itemSlotMouseleave', this.onOtherMouseleave);
            this.listenTo(gl.DirtyListener, 'newChange', this.showIsNew);
            this.render();
        },

        onOtherMouseenter: function(hoveredSlot) {
            if (hoveredSlot.slot === undefined && this.slot !== undefined) {
                if (this.slot === hoveredSlot.model.slot ||
                    (typeof(this.slot) === 'number' && hoveredSlot.model.itemType === 'skill')) {
                    this.yellow = true;
                    this.$el.addClass('yellow');
                }
            }
        },

        onOtherMouseleave: function() {
            this.yellow = false;
            this.$el.removeClass('yellow');
        },

        dropSuccess: function(dropPos) {
            var off = this.$el.offset();
            var pos = new Point(off.left, off.top);
            var diff = dropPos.sub(pos);

            return diff.x >= 0 && diff.x <= 73 && diff.y >= 0 && diff.y <= 73;
        },

        onDrop: function(dropPos, model) {
            if (this.dropSuccess(dropPos)) {
                this.equipper.equip(model, this.slot);
            }
            // TODO is this here only so that the model that is being dragged (and hidden) can be shown again?
            //   if so, is a full tab re-render necessary?
            gl.DirtyQueue.mark('itemTab');
        },

        // Overwritten by CTItemSlot as logic is different
        showIsNew: function() {
            if (this.model && this.model.isNew) {
                this.$el.addClass('new');
            } else {
                this.$el.removeClass('new');
            }
        },

        render: function() {
            this.$el.html(this.template(this));
            if (this.model && this.model.disabled) {
                this.$el.addClass('red');
            }
            if (this.model && this.dragHandler.isDraggingThis(this.model)) {
                this.$el.addClass('dragging');
            }
            this.showIsNew();
            return this;
        }
    });

    // CardTab ItemSlot
    var CTItemSlot = ItemSlot.extend({
        onMousedown: function(event) {
            if (this.model) {
                if (this.model.itemType === 'card') {
                    this.dragHandler.onViewMousedown(event, this.model);
                    this.render();
                } else {
                    this.trigger('gearMousedown', this);
                }
            }
        },

        select: function() { this.selected = true; this.$el.addClass('selected'); },
        unselect: function() { this.selected = false; this.$el.removeClass('selected'); },

        onDrop: function(dropPos, model) {
            if (this.dropSuccess(dropPos) && this.equipper) {
                this.equipper.equipCard(model, this.slot);
            }
            // TODO is this here only so that the model that is being dragged (and hidden) can be shown again?
            //   if so, is a full tab re-render necessary?
            gl.DirtyQueue.mark('cardTab');
        },

        showIsNew: function() {
            var isNew = false;
            if (this.model) {
                if (this.model.itemType === 'card') {
                    isNew = this.model.isNew;
                } else {
                    isNew = this.model.hasNewCards;
                }
            }
            if (isNew) {
                this.$el.addClass('new');
            } else {
                this.$el.removeClass('new');
            }
        },

        render: function() {
            ItemSlot.prototype.render.call(this);
            if (this.selected) {
                this.$el.addClass('selected');
            }
        }
    });

    var ItemTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#item-tab-template').html()),

        events: {
            'mouseleave': 'onMouseleave',
        },

        onMouseleave: function() {
            gl.UIEvents.trigger('itemSlotMouseleave');
        },

        initialize: function(options, game) {
            this.equipped = game.hero.equipped;
            this.skillchain = game.hero.skillchain;
            this.inventory = game.inv;
            this.nsm = game.newStateManager;

            this.hovering = undefined;
            this.renderedOnce = false;

            this.allViews = [];
            this.dragHandler = new DragHandler();  // passed to itemSlots, used to detect unequip drops
            this.listenTo(this.dragHandler, 'drop', this.onDrop);

            this.fb1 = new WeaponTypeFilterBarView({}, ['All', 'Ml', 'Ra', 'Sp'],
                                                   [undefined, 'melee', 'range', 'spell']).render();
            this.fb2 = new SlotTypeFilterBarView({}, ['All', 'We', 'He', 'Ch', 'Ha', 'Lg', 'Sk'],
                                                 [undefined, 'weapon', 'head', 'chest', 'hands', 'legs', 'skill']).render();

            // Map dirty queue events to itemTab update
            gl.DirtyQueue.mapMark(['item:new', 'hero:xp', 'computeAttrs', 'skillComputeAttrs', 'filterChange'], 'itemTab');
            // render on itemTab dirty
            this.listenTo(gl.DirtyListener, 'itemTab', this.render);

            this.tvm = new TabVisibilityManager('inv', this.$el, this.render.bind(this), 'footer:buttons:inv',
                                                'footer:buttons:cards');

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
            this.$el.css({
                left: size.x - 405,
                height: size.y
            });
            this.holderHeight = size.y;
            this.$('.holder').css('height', size.y);
        },

        onDrop: function(dropPos, model) {
            var off = this.$('.unequipped').offset();
            if (model.equipped && dropPos.x >= off.left && dropPos.y >= off.top) {
                if (model.itemType === 'skill') {
                    // unequip a skill, must find out what slot it was in
                    var slot = this.skillchain.getSkillSlot(model);
                    this.skillchain.equip(undefined, slot);
                } else {
                    this.equipped.equip(undefined, model.slot);
                }
            }
        },

        onHover: function(itemSlot) {
            this.hovering = itemSlot;
        },

        newItemSlot: function(model, slot, parent) {
            var view = new ItemSlot({model: model}, this.dragHandler, slot, parent);
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
                this.$equipped = this.$('.equipped');
                this.$skillchain = this.$('.skillchain');
                this.$unequipped = this.$('.unequipped');
                this.renderedOnce = true;
                this.resize();
            }

            // properly remove all views
            _.each(this.allViews, function(view) { this.stopListening(view); view.remove(); }, this);
            this.allViews = [];

            _.each(this.equipped.slots, function(slot) {
                var view = this.newItemSlot(this.equipped[slot], slot, this.equipped);
                this.$equipped.append(view.el);
            }, this);

            _.each(this.skillchain.skills, function(skill, i) {
                var view = this.newItemSlot(skill, i, this.skillchain);
                this.$skillchain.append(view.el);
            }, this);

            var items = _.where(this.inventory.models, {equipped: false});
            items = this.fb1.filter(items);
            items = this.fb2.filter(items);
            _.each(items, function(model) {
                var view = this.newItemSlot(model);
                this.$unequipped.append(view.el);
            }, this);

            if (this.hovering && this.hovering.model) {
                this.hovering = _.find(this.allViews, function(view) { return view.model && this.hovering.model.id === view.model.id; }, this);
                if (this.hovering) {
                    this.hovering.onMouseenter();
                }
            }

            return this;
        },
    });

    var CardTab = Backbone.View.extend({
        tagName: 'div',
        className: 'itemTab',
        template: _.template($('#card-tab-template').html()),

        events: {
            'mouseleave': 'onMouseleave'
        },

        onMouseleave: function() {
            gl.UIEvents.trigger('itemSlotMouseleave');
        },

        initialize: function(options, game) {
            // this.name = 'Card';
            this.equipped = game.hero.equipped;
            this.skillchain = game.hero.skillchain;
            this.cardInv = game.cardInv;
            this.nsm = game.newStateManager;

            // should we do a rendered once?
            this.renderedOnce = false;

            this.hovering = undefined;
            this.selected = undefined;

            this.allViews = [];
            this.dragHandler = new DragHandler(this.onBodyMousedown.bind(this));
            this.listenTo(this.dragHandler, 'drop', this.onDrop);

            // Map dirty queue events to itemTab update
            gl.DirtyQueue.mapMark(['card:new', 'hero:xp', 'computeAttrs', 'skillComputeAttrs'], 'cardTab');
            gl.DirtyQueue.mapMark(['equipChange'], 'hardRenderCardTab');

            this.listenTo(gl.DirtyListener, 'cardTab', this.render);
            this.listenTo(gl.DirtyListener, 'hardRenderCardTab', this.hardRender);

            this.tvm = new TabVisibilityManager('cards', this.$el, this.render.bind(this), 'footer:buttons:cards',
                                                'footer:buttons:inv');

            var unselect = (function() { this.selected = undefined; }).bind(this);

            this.listenTo(gl.UIEvents, 'footer:buttons:cards', unselect);
            this.listenTo(gl.UIEvents, 'footer:buttons:inv', unselect);

            this.resize();
            $(window).on('resize', this.resize.bind(this));
        },

        onDrop: function(dropPos, cardModel) {
            if (cardModel.equipped) {
                var off = this.$('.unequipped').offset();
                if (dropPos.x >= off.left && dropPos.y >= off.top) {
                    var gear = cardModel.gearModel;
                    var slot = gear.getCardSlot(cardModel);
                    gear.equipCard(undefined, slot);
                }
            }
        },

        onBodyMousedown: function(event) {
            // if the mousedown is in the body and not on the card tab, deselect the selected gear piece
            if (event.pageX <= this.$el.offset().left) {
                this.hardRender();
            }
        },

        resize: function() {
            var size = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
            this.$el.css({
                left: size.x - 405,
                height: size.y
            });
            this.holderHeight = size.y;
            this.$('.holder').css('height', size.y);
        },

        onGearMousedown: function(view) {
            if (this.selected) {
                this.selected.unselect();

                if (this.selected.model.id === view.model.id) {
                    this.selected = undefined;
                    gl.DirtyQueue.mark('cardTab');
                    return;
                }
            }
            this.selected = view;
            this.selected.select();
            gl.DirtyQueue.mark('cardTab');
        },

        onHover: function(hoveredView) {
            this.hovering = hoveredView;
        },

        newItemSlot: function(model, slot, equipper) {
            // TODO: fix the args:
            var view = new CTItemSlot({model: model}, this.dragHandler, slot, equipper);

            this.listenTo(view, 'gearMousedown', this.onGearMousedown);
            this.listenTo(view, 'hovering', this.onHover);

            this.allViews.push(view);
            return view;
        },

        hardRender: function() {
            this.selected = undefined;
            return this.render();
        },

        render: function() {
            if (!this.tvm.visible) {
                return this;
            }

            //  TODO: should we do a rendered once?

            if (!this.renderedOnce) {
                this.$el.html(this.template({selected: this.selected}));
                this.$('.holder').css('height', this.holderHeight);
                this.renderedOnce = true;
            }

            if (this.selected) {
                this.$('.equipped-cards').find('.header').html('Equipped ' +
                                                 presentableSlot(this.selected.model.slot) +
                                                 ' Cards');
                this.$('.unequipped').find('.header').html('Unequipped ' +
                                                   presentableSlot(this.selected.model.slot) +
                                                   ' Cards');
            } else {
                this.$('.equipped-cards').find('.header').html('Click an item to equip cards');
                this.$('.unequipped').find('.header').html('All Unequipped Cards');
            }

            // call remove() on all views, and stopListening on all views
            _.each(this.allViews, function(view) { this.stopListening(view); view.remove(); }, this);
            this.allViews = [];

            var frag = document.createDocumentFragment();
            _.each(this.equipped.slots, function(slot) {
                // if model, can select, cannot unequip, is not card
                var view = this.newItemSlot(this.equipped[slot], slot);
                frag.appendChild(view.el);
            }, this);
            this.$('.equipped').append(frag);

            frag = document.createDocumentFragment();
            _.each(this.skillchain.skills, function(skill, i) {
                // if model, can select, cannot unequip, is not card
                var view = this.newItemSlot(skill, i);
                frag.appendChild(view.el);
            }, this);
            this.$('.skillchain').append(frag);

            // If item selected, show item's cards
            if (this.selected) {
                frag = document.createDocumentFragment();
                _.each(this.selected.model.cards, function(card, slot) {
                    // cannot select, if model can unequip, is card
                    var view = this.newItemSlot(card, slot, this.selected.model);
                    frag.appendChild(view.el);
                }, this);
                this.$('.equipped-cards').append(frag);

                var cards = this.cardInv.getSlotCards(this.selected.slot);  // get filtered cards
            } else {
                var cards = this.cardInv.models;  // get all cards
            }
            cards = _.filter(cards, function(card) { return !card.equipped; });

            frag = document.createDocumentFragment();
            _.each(cards, function(card) {
                // no slot, no parent, can select, cannot unequip, is card
                var view = this.newItemSlot(card, card.slot);
                frag.appendChild(view.el);
            }, this);
            this.$('.unequipped').append(frag);

            // selected slot is an ItemSlot holding a equippedGear or skill model
            if (this.selected) {
                var selectedView = _.find(this.allViews, function(view) { return view.model && this.selected.model.id === view.model.id; }, this);
                if (selectedView && selectedView.model.equipped) {
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

    var HFBW = 150;  // hero footer bar width

    var StatBar = Backbone.View.extend({
        tagName: 'div',
        className: 'barHolder',
        template: _.template($('#stat-bar-template').html()),

        height: 20,
        width: HFBW,
        fontSize: 14,
        fontColor: 'rgba(170, 170, 160, 1)',
        bgColor: '#f00',

        initialize: function(options) {
            this.$el.html(this.template());
            this.$bar = this.$('.bar');
            this.$text = this.$('.text');

            this.$el.css({
                width: this.width,
                height: this.height
            });
            this.$bar.css({
                'background-color': this.bgColor,
                'width': 0
            });
            this.$text.css({
                color: this.fontColor,
                'font-size': this.fontSize,
                'line-height': this.height + 'px'
            });

            this.lastWidth = 0;
        },

        _render: function(cur, max) {
            if (cur < 0) { cur = 0; }
            this.$text.html(prettifyNum(cur) + '/' + prettifyNum(max));
            var nw = Math.floor(this.width * cur / max);
            if (nw !== this.lastWidth) {
                this.lastWidth = nw;
                this.$bar.css('width', nw);
            }
            return this;
        },
    });

    var HpBar = StatBar.extend({
        bgColor: '#B22222',
        render: function() {
            return this._render(this.model.hp, this.model.spec.maxHp);
        },
    });

    var ManaBar = StatBar.extend({
        bgColor: '#0000AB',
        render: function() {
            return this._render(this.model.mana, this.model.spec.maxMana);
        },
    });

    var XpBar = StatBar.extend({
        bgColor: '#B8860B',
        render: function() {
            return this._render(this.model.spec.xp, this.model.spec.getNextLevelXp());
        },
    });

    var NameLevelView = Backbone.View.extend({
        tagName: 'div',
        className: 'name-level',
        render: function() {
            this.$el.html('<div class="name"><div>' + this.model.name + '</div></div><div class="level">' + this.model.level + '</div>');
            this.$('.name').css('width', HFBW - 5 - this.$('.level').width());
            return this;
        },
    });

    var HeroFooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'hero',
        template: _.template($('#hero-footer-template').html()),

        initialize: function() {
            this.nameLevel = new NameLevelView({model: this.model.spec});
            this.hpBar = new HpBar({model: this.model});
            this.manaBar = new ManaBar({model: this.model});
            this.xpBar = new XpBar({model: this.model});

            this.listenTo(gl.DirtyListener, 'rename', this.nameLevel.render.bind(this.nameLevel));
            this.listenTo(gl.DirtyListener, 'hero:hp', this.hpBar.render.bind(this.hpBar));
            this.listenTo(gl.DirtyListener, 'hero:mana', this.manaBar.render.bind(this.manaBar));
            this.listenTo(gl.DirtyListener, 'hero:xp', this.xpBar.render.bind(this.xpBar));

            this.listenTo(gl.DirtyListener, 'hero:levelup', this.render);
            this.listenTo(gl.DirtyListener, 'revive', this.render);
            this.listenTo(gl.DirtyListener, 'computeAttrs', this.render);

            this.renderedOnce = false;
        },

        render: function() {
            if (!this.renderedOnce) {
                this.renderedOnce = true;
                this.$el.append(this.nameLevel.render().el);
                this.$el.append(this.hpBar.render().el);
                this.$el.append(this.manaBar.render().el);
                this.$el.append(this.xpBar.render().el);
            } else {
                this.nameLevel.render();
                this.hpBar.render();
                this.manaBar.render();
                this.xpBar.render();
            }
            return this;
        },
    });

    var SkillFooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'skill',
        template: _.template($('#skill-footer-template').html()),

        events: {
            'mouseenter': 'onMouseenter',
            'mouseleave': 'onMouseleave'
        },

        onMouseenter: function() {
            gl.UIEvents.trigger('itemSlotMouseenter', {model: this.model.spec});
        },

        onMouseleave: function() {
            gl.UIEvents.trigger('itemSlotMouseleave');
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

            if (this.model.oom) { this.$el.addClass('oom') } else { this.$el.removeClass('oom'); }
            if (this.model.oor) { this.$el.addClass('oor') } else { this.$el.removeClass('oor'); }

            this.$cd.css('height', cdHeight);
            this.$use.css('width', useWidth);
        },

        render: function() {
            this.$el.html(this.template(this));
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

        initialize: function(options, inv, cardInv) {
            this.inv = inv;
            this.cardInv = cardInv;

            this.listenTo(gl.UIEvents, 'tabShow', this.onTabShow);
            this.listenTo(gl.UIEvents, 'tabHide', this.onTabHide);

            this.listenTo(gl.DirtyListener, 'newChange', this.setNew);
        },

        setNew: function() {
            if (this.inv.hasNew) {
                this.$('.invnewflag').show();
            } else {
                this.$('.invnewflag').hide();
            }

            if (this.cardInv.hasNew) {
                this.$('.cardnewflag').show();
            } else {
                this.$('.cardnewflag').hide();
            }
        },

        setCardNew: function() {
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
            this.$el.html(this.template());
            return this;
        },
    });

    var FooterView = Backbone.View.extend({
        tagName: 'div',
        className: 'footer',

        events: {
            'mouseenter': 'onMouseenter'
        },
        onMouseenter: function() { gl.UIEvents.trigger('itemSlotMouseleave'); },

        initialize: function(options, game) {
            this.resize();
            $(window).on('resize', this.resize.bind(this));

            this.zone = game.zone;
            this.hero = this.zone.hero;

            this.heroBodyView = new HeroFooterView({model: this.hero});
            this.zoneView = new ZoneFooterView({}, this.zone);
            this.skillchainView = new SkillchainFooterView({}, this.hero);
            this.potionView = new PotionView({}, this.hero);
            this.buttons = new FooterButtonsView({}, game.inv, game.cardInv);
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
            this.trigger('click', this.model.zoneNum);
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

        events: {
            'click #autoAdvance': 'toggleAutoAdvance',
        },

        initialize: function(options, game) {
            this.zone = game.zone;
            this.settings = game.settings;

            this.tvm = new TabVisibilityManager('map', this.$el, this.render.bind(this), 'footer:buttons:map',
                                                'footer:buttons:stats', 'footer:buttons:help', 'footer:buttons:config');

            this.$el.html($('#map-tab-template').html());
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

        toggleAutoAdvance: function() {
            this.settings['autoAdvance'] = this.$('#autoAdvance').prop('checked');
        },

        zoneClick: function(zoneName) {
            log.UI('MapTab: Clicked on zone: %s', zoneName);
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
            var preTag = document.createElement('div');
            preTag.innerHTML = '<p><input type="checkbox" id="autoAdvance" /> Auto-advance on zone clear</p>';
            frag.appendChild(preTag);
            var data, sub, name, zoneRef;

            var len = this.zone.unlockedZones + 1;
            for (var i = 0; i < len; i++) {
                var currentZone = this.zone.getZoneFromNum(i);
                
                var zoneCount = this.zone.zoneOrder.length;
                var upgradeCount = currentZone.upgradeCount;
                var zoneI = currentZone.zoneI;
                var level = Math.max(1, i * gl.ZONE_LEVEL_SPACING);

                var name = currentZone.name;
                var zoneRef = this.zone.allZones[name];
                var nameStr = currentZone.nameStr;
                data = _.extend({name: nameStr, level: level, running: i === this.zone.nextZone, zoneNum: i}, zoneRef);
                sub = new ZoneMapTab({model: data});
                this.listenTo(sub, 'click', this.zoneClick);
                this.subs.push(sub);
                frag.appendChild(sub.render().el);
            }


            this.$holder.html(frag);
            $('#autoAdvance').prop('checked', this.settings.autoAdvance);
            return this;
        }
    });

    var ConfigTab = Backbone.View.extend({
        tagName: 'div',
        className: 'config',
        template: _.template($('#config-template').html()),

        events: {
            'click #wipebutton': 'wipe',
            'click #namebutton': 'nameButton',
            'click #devbutton': 'devButton',
            'click #donateButton': 'donate',
            'click #enableBuildHotkeys': 'toggleEnableBuildHotkeys',
        },

        initialize: function(options, game) {
            this.zone = game.zone;
            this.settings = game.settings;
            this.hero = game.hero;

            this.tvm = new TabVisibilityManager('config', this.$el, this.render.bind(this), 'footer:buttons:config',
                                                'footer:buttons:map', 'footer:buttons:help', 'footer:buttons:stats');

            this.$el.html('<div class="holder"></div>');
            this.$holder = this.$('.holder');

            this.resize();
            $(window).on('resize', this.resize.bind(this));

            // Close Checkout on page navigation
            $(window).on('popstate', function() {
                this.handler.close();
            });
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
            this.$holder.html(this.template(this));
            $('#enableBuildHotkeys').prop('checked', this.settings.enableBuildHotkeys);
            return this;
        },

        donate: function(e) {
            var amount = Math.round(parseFloat($('#donationamount').val()) * 100);
            amount = Math.max(100, amount);
            this.handler = StripeCheckout.configure({
                key: 'pk_live_Udj2pXdBbHxWllQWuAzempnY',
                bitcoin: true,
                token: function(token) {
                    var uid = localStorage.getItem('uid');
                    var donId = new Date() + '-' + uid;
                    var savedDonation = {
                        amount: amount,
                        uid: gl.FBuid,
                        tokenId: token.id,
                        email: token.email,
                        type: token.type,
                        version: gl.VERSION_NUMBER
                    };
                    gl.FB.child('payments').child(uid).set(savedDonation);
                    token.amount = amount;
                    console.log('TOKEN:', token, savedDonation);
                    // Use the token to create the charge with a server-side script.
                    // You can access the token ID with `token.id`
                }
            });
            this.handler.open({
                name: 'DungeonsOfDerp',
                description: 'Donate towards development',
                amount: amount
            });
            e.preventDefault();
        },

        toggleEnableBuildHotkeys: function() {
            this.settings['enableBuildHotkeys'] = this.$('#enableBuildHotkeys').prop('checked');
            console.log(this.settings);
        },


        wipe: function() {
            localStorage.removeItem('data');
            location.reload();
        },

        nameButton: function() {
            var userInput = $('#charname').val();
            this.hero.name = userInput.length < 64 ? userInput : 'SMARTASS';
            gl.DirtyQueue.mark('rename');
        },

        devButton: function() {
            var msg = $('#devmsg').val();
            if (msg && msg.length) {
                gl.FB.child(gl.VERSION_NUMBER).child('feedback').push(localStorage.getItem('uid') + ' - ' + this.hero.name + ' says: ' + msg);
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
    });
});
