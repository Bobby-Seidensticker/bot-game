namespace.module('bot.inv', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;
    var prob = namespace.bot.prob;

    var GearModel = window.Model.extend({
        initialize: function() {
            this.xp = 0;
            this.level = 1;
            this.baseMods = [];
            this.cards = [];
            this.equipped = false;
            this.maxCards = 5;
            this.ensureCardArray();
        },

        applyXp: function(xp) {
            this.xp += xp;
            if (this.canLevel()) {
                this.levelUp();
            }
        },

        canLevel: function() {
            return this.xp >= this.getNextLevelXp();
        },

        getNextLevelXp: function() {
            return Math.floor(100 * Math.exp((this.level - 1) / Math.PI));
        },

        levelUp: function() {
            var type = this.itemType;
            this.xp -= this.getNextLevelXp();
            this.level += 1;

            this.ensureCardArray(this.maxCards);
            // maybe this goes away forever? this.ensureCardArray(this.slotFormula(this.classLevel, this.level));
        },

        ensureCardArray: function() {
            _.each(_.compact(this.cards), function(card) {
                if (!card.model || card.model.itemType !== 'ctm') {
                    throw('Error, GearModel\'s this.cards has a improper card');
                }
            }, this);

            if (this.maxCards === this.cards.length) {
                return;
            }
            if (this.maxCards < this.cards.length) {
                log.error('Somehow ensureCardArray was called with maxCards less than the current cards array\'s length.');
                return;
            }
            while (this.cards.length < this.maxCards) {
                this.cards.push(undefined);
            }
        },

        getMods: function() {
            var cards = _.compact(this.cards);
            var mods = _.map(cards, function(card) { return card.model.getMods(card.level); });
            return mods.concat(utils.applyPerLevels(this.baseMods, this.level));
        },

        equipCard: function(card, slotIndex) {
            if (slotIndex >= this.cards.length) {
                log.error('Cannot equip card in slotIndex %d when item only has %d slots', slotIndex, this.cards.length);
                return false;
            }

            if (this.cards[slotIndex]) {
                this.cards[slotIndex].model.unequip(this.cards[slotIndex].level);
                this.cards[slotIndex] = undefined;
            }
            if (card) {
                card.model.equip(card.level);
                this.cards[slotIndex] = card;
            }

            log.warning('equipCard, now have %d cards equipped', _.compact(this.cards).length);

            // TODO: make this more specific
            window.ItemEvents.trigger('equipChange');
            return true;
        },

        unequipCards: function() {
            var i, l, c;
            for (i = 0, l = this.cards.length; i < l; i++) {
                c = this.cards[i];
                if (c) {
                    c.model.unequip(c.level);
                    this.cards[i] = undefined;
                }
            }
        },
    });

    var ArmorModel = GearModel.extend({
        initialize: function(classLevel, type) {
            GearModel.prototype.initialize.call(this)
            this.itemType = 'armor';
            this.classLevel = classLevel;
            this.type = type;

            var ref = $.extend(true, {}, itemref.ref.armor[type]);
            this.baseMods = ref.mods.concat(ref.getClassMods(this.classLevel));
            //this.slotFormula = ref.slotFormula;
            this.weight = ref.weight;
            this.name = ref.names[this.classLevel];

            // might go away forever? this.ensureCardArray(this.slotFormula(this.classLevel, this.level));
            log.debug('Made a new armor cl: %d, type: %s, name: %s', this.classLevel, this.type, this.name);
        }
    });

    var WeaponModel = GearModel.extend({
        initialize: function(classLevel, type) {
            GearModel.prototype.initialize.call(this)
            this.itemType = 'weapon';
            this.classLevel = classLevel;
            this.type = type;

            var ref = $.extend(true, {}, itemref.ref.weapon[type]);
            this.baseMods = ref.mods.concat(ref.getClassMods(this.classLevel));
            //this.slotFormula = ref.slotFormula;
            this.name = ref.names[this.classLevel];

            // might go away forever? this.ensureCardArray(this.slotFormula(this.classLevel, this.level));
            log.debug('Made a new weapon cl: %d, type: %s, name: %s', this.classLevel, this.type, this.name);
        }
    });

    var SkillModel = GearModel.extend({
        initialize: function(name) {
            this.itemType = 'skill';
            this.name = name;
            GearModel.prototype.initialize.call(this);

            // might go away forever? this.ensureCardArray(1);
            log.debug('loading skill %s from file', this.name);
            _.extend(this, itemref.expand('skill', this.name));
        },

        computeAttrs: function(baseDmgStats, dmgKeys) {
            this.baseDmgStats = baseDmgStats;  // please don't modify this
            this.dmgStats = $.extend(true, {}, baseDmgStats);

            log.debug('Skill compute attrs');

            var mods = this.getMods();
            _.each(mods, function(mod) {
                utils.addMod(this.dmgStats, mod.def);
            }, this);

            _.each(dmgKeys, function(stat) {
                this[stat] = utils.computeStat(this.dmgStats, stat);
            }, this);
        },
    });

    var Skillchain = window.Model.extend({
        initialize: function() {
            this.skills = [undefined, undefined, undefined, undefined, undefined];
            // this.on('add remove', this.countChange, this);
        },

        equip: function(skill, slot) {
            if (skill === undefined) {
                if (this.skills[slot]) {
                    this.skills[slot].equipped = false;
                }
                this.skills[slot] = undefined;
            } else {
                if (skill.itemType !== 'skill') {
                    return false;
                }
                if (this.skills[slot]) {
                    this.skills[slot].equipped = false;
                }
                skill.equipped = true;
                this.skills[slot] = skill;
            }

            window.DirtyQueue.mark('skillchainChange');
            window.ItemEvents.trigger('skillchainChange', skill, slot);
            return true;
        },

        ranges: function() {
            if (this.skills.length === 0) {
                this.furthest = undefined;
                this.shortest = undefined;
                return;
            }

            var i, l;
            var ranges = _.pluck(_.compact(this.skills), 'range');

            this.shortest = ranges.min();
            this.furthest = ranges.max();
        },

        computeAttrs: function(dmgStats, dmgOrder) {
            log.debug('skill chain compute attrs');

            this.lastDmgStats = dmgStats;
            _.each(this.skills, function(skill) {
                if (skill !== undefined) {
                    skill.computeAttrs(dmgStats, dmgOrder);
                }
            });
        },

        applyXp: function(xp) {
            _.each(_.compact(this.skills), function (skill) {
                skill.applyXp(xp);
            });
        },
    });

    var EquippedGearModel = window.Model.extend({

        slots: ['weapon', 'head', 'hands', 'chest', 'legs'],

        // weapon slots: weapon
        // armor slots: head, chest, hands, legs

        initialize: function() {
            this.listenTo(window.ItemEvents, 'equip', this.equip);
        },

        equip: function(item, slot) {

            //log.debug('EquippedGearModel.equip item %s in slot %s', item.name, slot);

            /*
              Slot empty, filling with item: fill slot
              Slot empty, filling with nothing: error
              Slot full, filling with item: unequip old, fill new
              Slot full, filling with nothing: unequip old, empty slot
              Slot full, trying to equip same item, error
              When equipping, ensure it's a valid operation

              If no error, fire an equipChange event
            */

            if (item === undefined) {
                if (this[slot] === undefined) {
                    log.info('Equip: Slot empty, filling with nothing, returning...');
                    return false;
                }
                this[slot].equipped = false;
                this[slot].unequipCards();
            } else {
                if (item.itemType === 'skill') {
                    return false;
                }
                if (this[slot] !== undefined) {
                    if (this[slot].id === item.id) {
                        return false;
                    }
                    this[slot].equipped = false;
                    this[slot].unequipCards();
                }

                if (item.itemType === 'armor' && item.type !== slot) {
                    log.error('Tried to equip armor %s of type %s in slot %s, returning...', item.name, item.type, slot);
                    return false;
                }
                if (item.itemType === 'weapon' && slot !== 'weapon') {
                    log.error('Tried to equip weapon %s in slot %s, can only be weapon, returning...', item.name, slot);
                    return false;
                }
                item.equipped = true;
            }

            this[slot] = item;
            window.DirtyQueue.mark('equipChange');
            window.ItemEvents.trigger('equipChange', item, slot);
            return true;
        },

        getMods: function() {
            var items = _.compact(_.map(this.slots, function(slot) { return this[slot]; }, this));
            return _.flatten(_.map(items, function(item) { return item.getMods(); }));
        },

        toDict: function() {
            return _.object(this.slots, _.map(this.slots, function(slot) { return this[slot]; }, this));
        },

        applyXp: function(xp) {
            _.each(this.slots, function(slot) {
                if (this[slot] !== undefined) {
                    this[slot].applyXp(xp);
                }
            }, this);
        },
    });

    var ItemCollection = window.Model.extend({
        initialize: function() {
            this.models = [
                new WeaponModel(0, 'melee'),
                new SkillModel('basic melee'),
                new ArmorModel(0, 'head'),
            ];
        },

        byId: function(id) {
            return _.findWhere(this.models, {id: id});
        },

        addDrops: function(drops) {
            // TODO add checking in here to ignore duplicates and do something about cards n stuff
            var drop;
            for (var i = 0; i < drops.length; i++) {
                drop = drops[i];
                if (drop.dropType === 'card') {
                    continue;
                }
                if (drop.dropType === 'weapon' || drop.dropType === 'armor') {
                    var exists = !!(_.findWhere(this.models, {itemType: drop.data[0], type: drop.data[1], classLevel: drop.data[2]}));
                    if (!exists) {
                        window.DirtyQueue.mark('inventory:new');
                        if (drop.dropType === 'weapon') {
                            this.models.push(new WeaponModel(drop.data[2], drop.data[1]));
                            log.info('Adding %s %s %d to inv', drop.data[0], drop.data[1], drop.data[2]);
                        } else if (drop.dropType === 'armor') {
                            this.models.push(new ArmorModel(drop.data[2], drop.data[1]));
                            log.info('Adding %s %s %d to inv', drop.data[0], drop.data[1], drop.data[2]);
                        }
                    } else {
                        log.info('Already have %s %s %d', drop.data[0], drop.data[1], drop.data[2]);
                    }
                } else if (drop.dropType === 'skill') {
                    var exists = !!(_.findWhere(this.models, {name: drop.data}));
                    if (!exists) {
                        window.DirtyQueue.mark('inventory:new');
                        this.models.push(new SkillModel(drop.data));
                        log.info('Adding skill %s', drop.data);
                    } else {
                        log.info('Already have skill %s', drop.data);
                    }
                }
            }
        }
    });

    var CardTypeModel = window.Model.extend({
        initialize: function(name) {
            _.extend(this, itemref.expand('card', name));
            this.itemType = 'ctm';
            this.name = name;
            this.amts = [];
            this.equipped = [];
            // this.amts and equipped have 0 undefined so weird stuff will happen if you access / write them
            // the 0th element is ignored so we don't have to deal with index and level being different
            for (var i = 1; i <= this.levels; i++) {
                this.amts[i] = 0;
                this.equipped[i] = 0;
            }
        },

        levelAvailable: function(level) {
            return level <= this.levels && this.amts[level] > 0 && this.equipped[level] === 0;
        },

        getMods: function(level) {
            log.debug('CardTypeModel.getMods. name: %s, level: %d, amts: %d, equipped: %d',
                      this.name, level, this.amts[level], this.equipped[level]);

            return utils.applyPerLevels(this.mods, level);
        },

        /*// Must already be available, and called must then equip it
        getCard: function(level) {
            log.debug('CardTypeModel.getCard. name: %s, level: %d, amts: %d, equipped: %d',
                      this.name, level, this.amts[level], this.equipped[level]);

            this.equipped[level] = 1;
            return {
                mods: this.mods,
                level: level,
                callback: _.bind(this.unequip, this, level)
            };
        },*/

        // this is called with level, not index.  If it's out of range, you're screwed, so don't do that
        equip: function(level) {
            this.equipped[level]++;
            log.warning('CardTypeModel.equip card name: %s, level: %d, current equipped[level]: %d',
                     this.name, level, this.equipped[level]);
        },

        unequip: function(level) {
            this.equipped[level]--;
            log.warning('CardTypeModel.unequip card name: %s, level: %d, current equipped[level]: %d',
                     this.name, level, this.equipped[level]);
        },

        addCard: function(level) {
            this.amts[level]++;
            this.upgrade(level);
        },

        upgrade: function(level) {
            while (this.amts[level] > 10 && (level + 1) <= this.levels) {
                this.amts[level] -= 10;
                this.amts[level + 1] += 1;
                log.info('Upgrading 10 level %d %s\'s to level %d', level, this.name, level + 1);
                level++;
            }
        },
    });

    var CardTypeCollection = window.Model.extend({
        initialize: function() {
            this.models = [];
        },

        addDrops: function(drops) {
            var drop;
            var changed = false;
            for (var i = 0; i < drops.length; i++) {
                drop = drops[i];
                if (drop.dropType !== 'card') {
                    continue;
                }
                var typeModel = _.findWhere(this.models, {name: drop.data[0]});
                if (typeModel === undefined) {
                    typeModel = new CardTypeModel(drop.data[0]);
                    this.models.push(typeModel);
                }
                typeModel.addCard(drop.data[1]);
                log.info('Added card %s level %d to card inv', drop.data[0], drop.data[1]);
                changed = true;
            }
            if (changed) { window.DirtyQueue.mark('cards:new'); }
        },

        getSlotCTMs: function(slot) {
            return _.filter(this.models, function(model) { return model.slot === slot; });
        },
    });

    /*
    var ItemCollectionView = Backbone.View.extend({
        el: $('#inv-menu-holder'),

        template: _.template($('#inv-menu-template').html()),

        initialize: function() {
            var groups = this.collection.itemTypes();
            this.$el.html(this.template({groups: groups}));

            this.groupContentEls = _.object(groups, _.map(groups, function(group) {
                return this.$('.' + group + ' .item-group-content');
            }, this), this);

            this.collection.each(function(item) {
                // This is sitting in the void, I believe that is ok
                var view = new this.SubView({model: item});
                var $container = this.groupContentEls[item.get('itemType')];
                $container.append(view.render().el);
            }, this);

            // TODO done
            this.listenTo(this.collection, 'add', this.onAdd);
        },

        onAdd: function(item) {
            log.debug('ItemCollectionView onAdd');
            //console.log(item);
            var view = new this.SubView({model: item});
            var $container = this.groupContentEls[item.get('itemType')];
            var el = view.render().el;

            $container.append(el);
        }
    });

    var ItemView = Backbone.View.extend({
        tagName: 'div',

        template: _.template($('#inv-menu-item-template').html()),

        events: {
            'click .item-header': 'expandCollapse'
        },

        renderInitted: false,

        initialize: function() {
            this.listenTo(this.model, 'destroy', this.destroy);
            this.listenTo(this.model, 'change', this.onChange);
        },

        prettyAffix: function(affix) {
            //Working here now
            var splits = affix.split(' ');
            if (splits[1] == 'added') {
                return '+' + splits[2] + ' Added ' + splits[0][0].toUpperCase() + splits[0].slice(1);
            } else if (splits[1] == 'more') {
                return splits[2] + '% More ' + splits[0][0].toUpperCase() + splits[0].slice(1);
            } else {
                log.warning('ItemView.prettyAffix returning unstyled affix, no modifier def');
            }
            return affix;
        },

        renderAffixes: function() {
            var affixes = this.model.get('affixes');
            var rendered = '';
            _.each(affixes, function(affix) {
                rendered += '<p>' + this.prettyAffix(affix) + '</p>'
            }, this);
            if (this.model.get('nextAffix') != '') {
                rendered += '<p class="nextAffix">' + this.prettyAffix(this.model.get('nextAffix')) +
                    '<input type="button" value="Reroll (' + this.model.get('level') + ' poops)" class="reroll"></p>';
            }
            //TODO - put nextAffix here
            return rendered;
        },

        getNextLevelXp: function(xp) {
            return this.model.getNextLevelXp(xp);
        },

        render: function(notFirst) {
            //console.log('rendering this', this);
            if (!this.renderInitted) {
                this.initRender();
                this.renderInitted = true;
            } 
            this.$('.xp').html(this.model.get('xp'));
            this.$('.nextLevelXp').html(this.model.getNextLevelXp());
            this.$('.item-affixes').html(this.renderAffixes());
            this.$('.level').html(this.model.get('level'));

            if (this.model.get('equippedBy') == '') {
                this.$('.equip').attr('value', 'Equip');
            } else {
                this.$('.equip').attr('value', 'Unequip');
            }
                                                     

            return this;
        },

        initRender: function(notFirst) {
            var type = this.model.get('itemType');

            //console.log('buttons', this.buttons);
            var ext = {
                'buttons': this.buttons,
                'midExtra': this.midExtra()
            };
            //console.log('itemview', this.midExtra());

            var obj = _.extend({}, this.model.toJSON(), ext);
            this.$el.html(this.template(obj));
            this.$el.attr({
                'class': 'item collapsed '+ this.model.get('name').split(' ').join('-')
            });
        },

        expandCollapse: function() {
            log.debug('expand collapse click on model name %s', this.model.get('name'));
            this.$el.toggleClass('collapsed');
        },

        onChange: function() {
            this.render(true);
        },

        destroy: function() {
            log.error('ItemView destroy, bad');
            this.$el.remove();
        },
    });

    var InvItemView = ItemView.extend({
        events: _.extend({}, ItemView.prototype.events, {
            'click .equip': 'equip',
            'click .level-up': 'levelUp',
            'click .reroll': 'reroll'
        }),

        buttons: $('#inv-menu-item-buttons-template').html(),

        equip: function() {
            log.info('equip click on model name %s', this.model.get('name'));
            // TODO this is dumb, this should trigger a global event like this:
            // window.ItemEvents.trigger('equipAttempt', this.model);
            this.model.trigger('equipClick', this.model);
        },

        midExtra: function() {
            return _.template($('#inv-menu-item-xp').html(), {
                xp: this.model.get('xp'),
                nextLevelXp: this.model.getNextLevelXp()
            }, this);
        },

        reroll: function() {
            log.debug('invitemview reroll called');
            this.model.reroll();
            this.render();
        },

        levelUp: function() {
            this.model.levelUp();
        },

        onChange: function() {
            this.render();
            //Trying to un-disable butons here
            //console.log('oh yeah', this.$('.level-up'));
            if (this.model.canLevel()) {
                this.$('.level-up').prop('disabled', false);
            } else {
                this.$('.level-up').prop('disabled', true);
            }

        }
    });

    var InvItemCollectionView = ItemCollectionView.extend({
        el: $('#inv-menu-holder'),
        template: _.template($('#inv-menu-template').html()),
        SubView: InvItemView
    });*/

    exports.extend({
        ItemCollection: ItemCollection,
        //InvItemCollectionView: InvItemCollectionView,
        CardTypeCollection: CardTypeCollection,
        CardTypeModel: CardTypeModel,
        WeaponModel: WeaponModel,
        ArmorModel: ArmorModel,
        SkillModel: SkillModel,
        Skillchain: Skillchain,
        EquippedGearModel: EquippedGearModel,
    });
});
