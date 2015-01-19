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
            this.cards = [];
            this.equipped = false;
            this.maxCards = 0;
        },

        applyXp: function(xp) {
            this.xp += xp;
            if (this.canLevel()) {
                // this.prepLevelUp();
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

            if (type === 'skill') {
                this.maxCards = Math.min(this.level, 1);
            } else {
                this.maxCards = this.slotFormula(this.classLevel, this.itemLevel);
            }
        },

        equipCard: function(card) {
            if (this.cards.length) {}
        },
    });

    var ArmorModel = GearModel.extend({
        initialize: function(classLevel, type) {
            GearModel.prototype.initialize.call(this)
            this.itemType = 'armor';
            this.classLevel = classLevel;
            this.type = type;

            var ref = itemref.ref.armor[type];
            this.formula = ref.formula;
            this.slotFormula = ref.slotFormula;
            this.weight = ref.weight;
            this.name = ref.names[this.classLevel];

            this.maxCards = this.slotFormula(classLevel, itemLevel);
            log.debug('Made a new armor cl: %d, type: %s, name: %s', this.classLevel, this.type, this.name);
        }
    });

    var WeaponModel = GearModel.extend({
        initialize: function(classLevel, type) {
            GearModel.prototype.initialize.call(this)
            this.itemType = 'weapon';
            this.classLevel = classLevel;
            this.type = type;

            var ref = itemref.ref.weapon[type];
            this.formula = ref.formula;
            this.slotFormula = ref.slotFormula;
            this.speed = ref.speed;
            this.range = ref.range;
            this.name = ref.names[this.classLevel];

            log.debug('Made a new weapon cl: %d, type: %s, name: %s', this.classLevel, this.type, this.name);
        }
    });

    var SkillModel = GearModel.extend({
        initialize: function(name) {
            this.itemType = 'skill';
            this.name = name;
            this.manaCost = 0;
            this.cooldown = 0;
            this.cooldownTime = 800;
            GearModel.prototype.initialize.call(this);

            log.debug('loading skill %s from file', this.name);
            _.extend(this, itemref.expand('skill', this.name));
        },

        cool: function() {
            // TODO remember cooldown is not being decremented, we just check to see if current fake time is greater than fake time of expire
            return this.cooldown <= 0;
        },

        use: function(castTime) {
            this.cooldown = this.cooldownTime + castTime;
        },

        computeAttrs: function(baseDmgStats, dmgKeys) {
            this.baseDmgStats = baseDmgStats;  // please don't modify this
            this.dmgStats = $.extend(true, {}, baseDmgStats);

            // log.info('Skill compute attrs');
            this.range = weapon.range;
            this.speed = weapon.speed;

            var cards = this.getCards();
            cards.push(this);  // pushing the skills 'mods' array and level
            var mods;
            for (var i = 0; i < cards.length; i++) {
                var mods = cards[i].mods;
                for (var j = 0; j < mods.length; j++) {
                    utils.addMod(this.dmgStats, mods[j].def, cards[i].level);
                }
            }

            var dtype, obj, targetKeys, dmg, convPct, convAmt, gainedAmt, i, j;
            var keysLen = dmgKeys.length;
            for (var i = 0; i < keysLen; i++) {
                dtype = dmgKeys[i];
                obj = this.dmgStats[dtype];
                convPct = 100;

                dmg = obj.added * obj.more;
                for (var j = i; j < keysLen; j++) {
                    convAmt = obj.converted[dmgKeys[j]];
                    if (convAmt > convPct) {
                        convAmt = convPct;
                    }
                    this.dmgStats[dmgKeys[j]].added += convAmt / 100 * dmg;
                    convPct -= convAmt;
                }
                dmg *= (convPct / 100);
                for (var j = i; j < keysLen; j++) {
                    gainedAmt = obj.gainedas[dmgKeys[j]];
                    this.dmgStats[dmgKeys[j]].added += gainedAmt / 100 * dmg;
                }
                this[dtype] = dmg;
            }
        },
    });

    var Skillchain = window.Model.extend({
        initialize: function() {
            this.skills = [undefined, undefined, undefined, undefined];
            // this.on('add remove', this.countChange, this);
        },

        equip: function(skill, slot) {
            // something that equips skills and takes slot, puts it in proper place, pushes others out of way, throws error if too many equipped
            // then updates ranges, computes attrs?
        },

        ranges: function() {
            if (this.skills.length === 0) {
                this.furthest = undefined;
                this.shortest = undefined;
                return;
            }

            var i, l;
            var ranges = [];
            for (i = 0, l = this.skills.length; i < l; i++) {
                if (this.skills[i] === undefined) {
                    return;
                }
                ranges.push(skill.range);
            }
            this.shortest = ranges.min();
            this.furthest = ranges.max();
        },

        bestSkill: function(mana, distances) {
            var skill;
            for (i = 0, l = this.skills.length; i < l; i++) {
                skill = this.skills[i];
                if (skill === undefined) {
                    return;
                }
                // all this shit:
            }
            /*return this.find(function(skill) {
                if (mana >= skill.get('manaCost') && skill.cool()) {
                    return _.some(distances, function(dist) {
                        return this.get('range') >= dist;
                    }, skill);
                }
                return false;
            }, this);*/
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
    });

    var EquippedGearModel = window.Model.extend({

        slots: ['mainHand','head', 'hands', 'chest', 'legs'],

        // weapon slots: mainHand
        // armor slots: head, chest, hands, legs

        equip: function(item, slot) {
            log.debug('EquippedGearModel.equip, slot: %s', slot);
            var changed = false;

            if (this[slot].id === item.id) {
                this.unequip(this[slot]);
                item.equipped = false;
                changed = true;
            }

            if (item.itemType === 'weapon') {
                if (slot === 'mainHand') {
                    this.unequip(this[slot]);
                    this[slot] = item;
                    item.equipped = true;
                    changed = true;
                } else {
                    log.info('ya done fucked up equipping a weapon name: %s type: %s',
                             item.name, item.itemType);
                    throw('shit');
                }
            } else if (item.itemType === 'armor') {
                if (item.type === slot) {
                    this.unequip(this[slot]);
                    this[slot] = item;
                    item.equipped = true;
                    changed = true;
                } else {
                    log.info('ya done fucked up equipped armor name: %s type: %s',
                             item.name, item.itemType);
                    throw('shit');
                }
            } else {
                log.info('ya done fucked up equipped sumpin\' ya don\'t equip' +
                         ' name: %s type: %s', item.name, item.itemType);
                throw('shit');
            }
            if (changed) {
                window.ItemEvents.trigger('equipChange', item, slot);
            }
        },

        unequip: function(item) {
            if (item !== undefined) {
                item.equipped = false;
            }
        },

        allCards: function() {
            
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
        /*addDrops: function(drops) {
            _.each(drops, function(drop){
                if (typeof(drop)== 'object') {
                    this.recipes.add(drop);
                } else if (typeof(drop) == 'string'){
                    this.materials.addDrop(drop);
                } else {
                    log.warning('invalid drop %s', typeof(drop));
                }
            }, this);
        },*/
    });

    var CardModel = window.Model.extend({
        initialize: function(name) {
            _.extend(this, itemref.expand('card', this.name));
            this.amts = [];
            this.equipped = [];
            for (var i = 0; i < this.levels; i++) {
                this.amts[i] = 0;
                this.equipped[i] = 0;
            }
        }
    });

    var CardCollection = window.Model.extend({
        initialize: function() {
            this.models = [
                new CardModel('hot sword');
                new CardModel('surprisingly hot sword');
                new CardModel('hard head');
            ];
        }
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

        WeaponModel: WeaponModel,
        ArmorModel: ArmorModel,
        SkillModel: SkillModel,
        Skillchain: Skillchain,
        EquippedGearModel: EquippedGearModel,
    });
});
