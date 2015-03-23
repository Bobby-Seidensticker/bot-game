namespace.module('bot.views', function (exports, require) {

    var log = namespace.bot.log;
    var entity = namespace.bot.entity;
    var VisView = namespace.bot.vis.VisView;
    var vu = namespace.bot.vectorutils;
    var Point = vu.Point;
    var PointFromEvent = vu.PointFromEvent;

    var FOOTER_HEIGHT = 114;

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(options, game) {
            log.info('GameView initialize');

            this.configTab = new ConfigTab({}, game);
            this.statsTab = new StatsTab({}, game);
            //this.itemTab = new ItemTab({}, game);
            this.itemTab = new DraggableItemTab({}, game);
            this.helpTab = new HelpTab({}, game);
            this.mapTab = new MapTab({}, game);
            //this.cardTab = new CardTab({}, game);
            this.cardTab = new DraggableCardTab({}, game);

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
                    if (key === "projCount" && skill.spec.projCount <= 1) {
                        return;
                    }
                    if (key === "decayRange") {
                        return;
                    }
                    if (key === "radius" || key === "rate" || key === "angle") {  // todo only if not aoe
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
                if (key === "dodge") {
                    statname = "Approx. Dodge Chance (this zone)";
                    var dodge = this.model.spec.dodge;
                    var level = gl.game.zone.level;
                    var attAcc = (9 + level) * 2;
                    var chance = 1 -(3 * 0.5 * (attAcc/(attAcc + dodge)));
                    data.spec.push([statname, Math.min(0.99, chance.toFixed(2))]);
                }
                if (key === "armor") {
                    var fakeDmg = 10 * Math.pow(1.06, gl.game.zone.level);
                    var redFactor = fakeDmg / (fakeDmg + this.model.spec.armor);
                    data.spec.push(["Est. Physical Damage Taken after Armor (this zone)", redFactor.toFixed(2)]);
                }
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

            this.state = this.DISABLED
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
        },
    });

    var DraggableItemSlot = Backbone.View.extend({
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
            if (this.model) {
                this.model.isNew = false;
                this.render();
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
            }
            this.listenTo(this.dragHandler, 'dragstart', this.render);

            this.listenTo(gl.UIEvents, 'itemSlotMouseenter', this.onOtherMouseenter);
            this.listenTo(gl.UIEvents, 'itemSlotMouseleave', this.onOtherMouseleave);
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

        render: function() {
            this.$el.html(this.template(this));
            if (this.model && this.model.disabled) {
                this.$el.addClass('red');
            }
            if (this.model && this.dragHandler.isDraggingThis(this.model)) {
                this.$el.addClass('dragging');
            }
            return this;
        }
    });

    var DraggableItemTab = Backbone.View.extend({
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
            gl.DirtyQueue.mapMark(['inventory:new', 'hero:xp', 'computeAttrs', 'skillComputeAttrs', 'filterChange'], 'itemTab');
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
            var view = new DraggableItemSlot({model: model}, this.dragHandler, slot, parent);
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
            gl.DirtyQueue.mark('filterChange');
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
            'mouseenter': 'onMouseenter',
            'mouseleave': 'onMouseleave'
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

        initialize: function() {
            this.listenTo(gl.UIEvents, 'tabShow', this.onTabShow);
            this.listenTo(gl.UIEvents, 'tabHide', this.onTabHide);
            this.listenTo(gl.DirtyListener, 'footer:invshownew', this.invShowNew);
            this.listenTo(gl.DirtyListener, 'footer:invhidenew', this.invHideNew);
            this.listenTo(gl.DirtyListener, 'footer:cardshownew', this.cardShowNew);
            this.listenTo(gl.DirtyListener, 'footer:cardhidenew', this.cardHideNew);
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

        events: {
            'mouseenter': 'onMouseenter'
        },
        onMouseenter: function() { gl.UIEvents.trigger('mouseleave'); },

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
            gl.game.settings['autoAdvance'] = this.$('#autoAdvance').prop('checked');
            console.log(gl.game.settings);
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
            var preTag = document.createElement('div');
            preTag.innerHTML = '<p><input type="checkbox" id="autoAdvance" /> Auto-advance on zone clear</p>';
            frag.appendChild(preTag);
            var data, sub, name, zoneRef;

            var len = this.zone.unlockedZones + 1;
            for (var i = 0; i < len; i++) {
                var zoneCount = this.zone.zoneOrder.length;
                var upgradeCount = Math.floor(i / zoneCount);
                var zoneI = i % zoneCount;
                var level = Math.max(1, i * 5);
                
                var name = this.zone.zoneOrder[zoneI];
                var zoneRef = this.zone.allZones[name];
                var nameStr = upgradeCount >= 1 ? " " + (upgradeCount + 1) : ""
                data = _.extend({name: name + nameStr, level: level, running: i === this.zone.nextZone, zoneNum: i}, zoneRef);                
                sub = new ZoneMapTab({model: data});
                this.listenTo(sub, 'click', this.zoneClick);
                this.subs.push(sub);
                frag.appendChild(sub.render().el);
            }


            this.$holder.html(frag);
            $('#autoAdvance').prop('checked', gl.game.settings.autoAdvance)            
            return this;
        }
    });

    var ConfigTab = Backbone.View.extend({
        tagName: 'div',
        className: 'config',

        events: {
            'click #wipebutton': 'wipe',
            'click #namebutton': 'nameButton',
            'click #devbutton': 'devButton',
            'click #donateButton': 'donate',
            'click #enableBuildHotkeys': 'toggleEnableBuildHotkeys',
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
            this.$holder.html(this.template);
            $('#enableBuildHotkeys').prop('checked', gl.game.settings.enableBuildHotkeys)
            /*this.$('#namebutton').on('click', this.nameButton.bind(this));
              this.$('#devbutton').on('click', this.devButton.bind(this));
              this.$('#donateButton').on('click', this.donate.bind(this));*/
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
                    var donId = new Date() + "-" + uid;
                    var savedDonation = {
                        amount: amount,
                        uid: gl.FBuid,
                        tokenId: token.id,
                        email: token.email,
                        type: token.type,
                        version: gl.VERSION_NUMBER
                    }
                    gl.FB.child('payments').child(uid).set(savedDonation);
                    token.amount = amount;
                    console.log("TOKEN:", token, savedDonation);
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
            gl.game.settings['enableBuildHotkeys'] = this.$('#enableBuildHotkeys').prop('checked');
            console.log(gl.game.settings);
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



    var DraggableCardTabItemSlot = DraggableItemSlot.extend({
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

        render: function() {
            DraggableItemSlot.prototype.render.call(this);
            if (this.selected) {
                this.$el.addClass('selected');
            }
        },

        select: function() { this.selected = true; this.$el.addClass('selected');  },
        unselect: function() { this.selected = false; this.$el.removeClass('selected'); },

        onDrop: function(dropPos, model) {
            if (this.dropSuccess(dropPos) && this.equipper) {
                this.equipper.equipCard(model, this.slot);
            }
            // TODO is this here only so that the model that is being dragged (and hidden) can be shown again?
            //   if so, is a full tab re-render necessary?
            gl.DirtyQueue.mark('cardTab');
        },
    });

    var DraggableCardTab = Backbone.View.extend({
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

            // should we do a rendered once?
            this.renderedOnce = false;

            this.hovering = undefined;
            this.selected = undefined;

            this.allViews = [];
            this.dragHandler = new DragHandler(this.onBodyMousedown.bind(this));
            this.listenTo(this.dragHandler, 'drop', this.onDrop);

            // Map dirty queue events to itemTab update
            gl.DirtyQueue.mapMark(['cards:new', 'hero:xp', 'computeAttrs', 'skillComputeAttrs'], 'cardTab');
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
            var view = new DraggableCardTabItemSlot({model: model}, this.dragHandler, slot, equipper);

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

            this.$el.html(this.template({selected: this.selected}));
            this.$('.holder').css('height', this.holderHeight);

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



    exports.extend({
        GameView: GameView,
        StatsTab: StatsTab,
    });
});
