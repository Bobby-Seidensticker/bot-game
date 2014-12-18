namespace.module('bot.inv', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;

    var GearModel = Backbone.Model.extend({
        defaults: function() {
            return {
                exp: 0,
                level: 0,
                affixes: [],
                equippedBy: '',
            };
        },

        equip: function() {
            
        },
    });

    var ArmorModel = GearModel.extend({
        defaults: _.extend({}, GearModel.prototype.defaults(), {
            weight: 0,
            type: 'ERR type',
            itemType: 'armor'
        }),

        initialize: function() {
            // log.debug('Armor Model attributes at initialize: %s', JSON.stringify(this.toJSON()));
            if (!('id' in this)) {
                log.debug('loading armor %s from file', this.get('name'));
                this.set(itemref.expand('armor', this.get('name')));
            }
        },
    });

    var WeaponModel = GearModel.extend({
        defaults: _.extend({}, GearModel.prototype.defaults(), {
            speed: 0,
            type: 'ERR type',
            damage: 0,
            range: 0,
            itemType: 'weapon'
        }),

        initialize: function() {
            // log.debug('Weapon Model attributes at initialize: %s', JSON.stringify(this.toJSON()));
            if (!('id' in this)) {
                log.debug('loading weapon %s from file', this.get('name'));
                this.set(itemref.expand('weapon', this.get('name')));
            }
        },
    });

    var SkillModel = GearModel.extend({
        defaults: _.extend({}, GearModel.prototype.defaults(), {
            manaCost: 0,
            cooldown: 0,
            cooldownTime: 800,
            types: [],
            level: 1,
            itemType: 'skill'
        }),

        initialize: function() {
            // log.debug('Skill Model attributes at initialize: %s', JSON.stringify(this.toJSON()));
            if (!('id' in this)) {
                log.debug('loading skill %s from file', this.get('name'));
                this.set(itemref.expand('skill', this.get('name')));
            }
        },

        cool: function() {
            return this.get('cooldown') <= 0;
        },

        use: function() {
            this.set('cooldown', this.get('cooldownTime'));
        },

        computeAttrs: function(weapon, affixDict) {
            //log.info('Skill compute attrs');
            var t = {
                "physDmg": weapon.get('damage'),
                "range": weapon.get('range'),
                "speed": weapon.get('speed'),
                "fireDmg": 0,
                "coldDmg": 0,
                "lightDmg": 0,
                "poisDmg": 0,
                "manaCost": this.get('manaCost')
            };

            utils.applyAllAffixes(
                t,
                ['physDmg', 'range', 'speed', 'fireDmg',
                 'coldDmg', 'lightDmg', 'poisDmg', 'manaCost'],
                affixDict);
            var skillAffDict = utils.affixesToAffDict(this.get('affixes'));
            utils.applyAllAffixes(
                t,
                ['physDmg', 'range', 'speed', 'fireDmg', 'coldDmg',
                 'lightDmg', 'poisDmg', 'manaCost'],
                skillAffDict);
            //console.log("skill computeAttrs", t, this, affixDict);
            this.set(t);

            log.debug('Skill compute attrs: %s', JSON.stringify(t));
        },
    });

    var SkillChain = Backbone.Collection.extend({
        model: SkillModel,

        bestSkill: function(mana, distances) {
            return this.find(function(skill) {
                if (mana >= skill.get('manaCost') && skill.cool()) {
                    return _.some(distances, function(dist) {
                        return this.get('range') >= dist;
                    }, skill);
                }
                return false;
            }, this);
        },

        computeAttrs: function(weapon, affixDict) {
            log.debug('skill chain compute attrs len: %d', this.length);
            this.invoke('computeAttrs', weapon, affixDict);
        },
    });

    function newSkillChain() {
        var sk;
        sk = new SkillChain();
        sk.add({"name": "basic melee"});
        return sk;
    }

    var EquippedGearModel = Backbone.Model.extend({

        slots: ['mainHand',  'head', 'offHand', 'hands', 'chest', 'legs'],

        // weapon slots: mainHand, offHand
        // armor slots: head, chest, hands, legs
        initialize: function(options, inv) {
            if (inv) {
                this.inv = inv;
                this.listenTo(inv, 'equipClick', this.equip);
            }
        },

        equip: function(item, slot) {
            log.info('EquippedGearModel.equip, slot: %s', slot);
            var canEquipItem = true;
            var success = false;

            if (!canEquipItem) {
                log.warning('You cannot equip this item name: %s type: %s',
                            item.get('name'), item.get('itemType'));
                throw('shit');
            }

            if (item.get('itemType') === 'weapon') {
                if (slot === 'mainHand' || slot === 'offHand') {
                    this.unequip(this.get(slot));
                    this.set(slot, item);
                    item.set('equippedBy', this.get('charName'));
                    success = true;
                } else {
                    log.info('ya done fucked up equipping a weapon name: %s type: %s',
                             item.get('name'), item.get('itemType'));
                    throw('shit');
                }
            } else if (item.get('itemType') === 'armor') {
                if (item.get('type') === slot) {
                    this.unequip(this.get(slot));
                    this.set(slot, item);
                    item.set('equippedBy', this.get('charName'));
                    success = true;
                } else {
                    log.info('ya done fucked up equipped armor name: %s type: %s',
                             item.get('name'), item.get('itemType'));
                    throw('shit');
                }
            } else {
                log.info('ya done fucked up equipped sumpin\' ya don\'t equip' +
                         ' name: %s type: %s', item.get('name'), item.get('itemType'));
                throw('shit');
            }
            if (success) {
                this.trigger('equipSuccess');
            }
            //console.log('equippedgearmodel, equp: ', item, slot, this.get(slot));
        },

        getWeapon: function() {
            var weapon = this.get('mainHand');
            if (weapon) {
                return weapon;
            }
            return new WeaponModel({name: 'fists'});
        },

        getAffixes: function() {

            var all = _.map(this.slots, function(name) {
                //console.log(name);
                var item = this.get(name);
                //console.log(item);
                return item === undefined ? [] : item.get('affixes');
            }, this);
            //console.log(all);
            return _.flatten(all);
        },

        getStats: function() {
            // maybe refactor computeAttrs stuff into here possibly
        },

        unequip: function(item) {
            if (item !== undefined) {
                item.set({
                    'equipped': false,
                    'equippedBy': ''
                });
            }
        },

        toDict: function() {
            return _.object(
                this.slots,
                _.map(this.slots, this.get, this));
        },
    });

    var RecipeCollection = Backbone.Collection.extend({
        itemTypes: function() {
            return ['weapon', 'armor', 'skill', 'material'];
        },

        initialize: function() {
            // do sumpin' here
            var defaults = [
                new WeaponModel({name: 'bowie knife'}),
                new WeaponModel({name: 'decent wand'}),
                new SkillModel({name: 'fire slash'}),
                new SkillModel({name: 'ice arrow'}),		
                new SkillModel({name: 'poison ball'}),
                new ArmorModel({name: 'balsa helmet'})
            ];
            this.add(defaults);
        },

	removeRecipe: function(recipe) {
	    this.remove(recipe);
	    console.log(this);
	},
    });

    var ItemCollection = Backbone.Collection.extend({
        itemTypes: function() {
            return ['weapon', 'armor', 'skill', 'material', 'recipe'];
        },

        initialize: function() {
            // no models given, do basics
            var defaults = [
                new WeaponModel({name: 'wooden sword'}),
                new WeaponModel({name: 'shitty bow'}),
                new WeaponModel({name: 'crappy wand'}),
                new SkillModel({name: 'basic melee'}),
                new SkillModel({name: 'basic range'}),
                new SkillModel({name: 'basic spell'}),
                new ArmorModel({name: 'cardboard kneepads'})
            ];
            this.add(defaults);

            this.recipes = new RecipeCollection();
            this.listenTo(this.recipes, 'craftClick', this.craft);
        },

        craft: function(recipeModel) {
            log.info('ItemCollection.craft called');
	    console.log("Itemcollection craft with, " , recipeModel);
	    this.add(recipeModel);
	    this.recipes.removeRecipe(recipeModel);
	    console.log(this);
        },
    });

    var ItemCollectionView = Backbone.View.extend({
        el: $('#inv-menu-holder'),

        template: _.template($('#inv-menu-template').html()),

        initialize: function() {
            var groups = this.collection.itemTypes();
            this.$el.html(this.template({groups: groups}));

            var groupContentEls = _.object(groups, _.map(groups, function(group) {
                return this.$('.' + group + ' .item-group-content');
            }, this), this);

            this.collection.each(function(item) {
                // This is sitting in the void, I believe that is ok
                var view = new this.SubView({model: item});
                var $container = groupContentEls[item.get('itemType')];
                $container.append(view.render().el);
            }, this);
        }
    });

    var ItemView = Backbone.View.extend({
        tagName: 'div',

        template: _.template($('#inv-menu-item-template').html()),

        events: {
            'click .item-header': 'expandCollapse'
        },

        initialize: function() {},

        render: function() {
            var type = this.model.get('itemType');
	    //console.log('buttons', this.buttons);
            this.$el.html(this.template(_.extend({}, this.model.toJSON(), {'buttons': this.buttons})));
            this.$el.attr({
                'class': 'item collapsed',
                'id': 'inv-item-' + this.model.get('name')
            });
            return this;
        },

        expandCollapse: function() {
            log.info('expand collapse click on model name %s', this.model.get('name'));
            this.$el.toggleClass('collapsed');
        },

    });

    var InvItemView = ItemView.extend({
        events: _.extend({}, ItemView.prototype.events, {
            'click .equip': 'equip',
        }),

	buttons: $('#inv-menu-item-buttons-template').html(),


	
        equip: function() {
            log.info('equip click on model name %s', this.model.get('name'));
            var slot;
            var itemType = this.model.get('itemType');
            if (itemType === 'armor') {
                slot = this.model.get('type');
            } else if (itemType === 'weapon') {
                slot = 'mainHand';
            } else {
                slot = '';
            }
            this.model.trigger('equipClick', this.model, slot);
        },
    });

    var CraftItemView = ItemView.extend({
        events: _.extend({}, ItemView.prototype.events, {
	    'click .craft': 'craft',
	}),

	initialize: function() {
	    this.buttons = this.model.get('craftCost') + $('#craft-menu-item-buttons-template').html();
	},

	craft: function() {
	    console.log(this.model);
	    this.model.trigger('craftClick', this.model);
	    //console.log(this);
	}
    });

    var InvItemCollectionView = ItemCollectionView.extend({
        el: $('#inv-menu-holder'),
        template: _.template($('#inv-menu-template').html()),
        SubView: InvItemView
    });

    var CraftItemCollectionView = ItemCollectionView.extend({
        el: $('#craft-menu-holder'),
        template: _.template($('#craft-menu-template').html()),
        SubView: CraftItemView
    });

    exports.extend({
        ItemCollection: ItemCollection,
        InvItemCollectionView: InvItemCollectionView,

        RecipeCollection: RecipeCollection,
        CraftItemCollectionView: CraftItemCollectionView,

        SkillChain: SkillChain,
        newSkillChain: newSkillChain,
        EquippedGearModel: EquippedGearModel,
    });
});
