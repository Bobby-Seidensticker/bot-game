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
        itemType: 'armor',

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
        itemType: 'weapon',

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
        itemType: 'skill',

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

            utils.applyAllAffixes(t, ['physDmg', 'range', 'speed', 'fireDmg', 'coldDmg', 'lightDmg', 'poisDmg', 'manaCost'], affixDict);
            var skillAffDict = utils.affixesToAffDict(this.get('affixes'));
            utils.applyAllAffixes(t, ['physDmg', 'range', 'speed', 'fireDmg', 'coldDmg', 'lightDmg', 'poisDmg', 'manaCost'], skillAffDict);
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
                    return _.some(distances, function(dist) { return this.get('range') >= dist; }, skill);
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
        initialize: function() {
            
        },

        equip: function(item, slot) {
            var canEquipItem = true;

            if (!canEquipItem) {
                log.warning('You cannot equip this item name: %s type: %s', item.get('name'), item.itemType);
                throw('shit');
            }

            if (item.itemType === 'weapon') {
                if (slot === 'mainHand' || slot === 'offHand') {
                    this.unequip(this.get(slot));
                    this.set(slot, item);
                    item.set('equippedBy', this.get('charName'));
                } else {
                    log.info('ya done fucked up equipping a weapon name: %s type: %s', item.get('name'), item.itemType);
                    throw('shit');
                }
            } else if (item.itemType === 'armor') {
                if (item.get('type') === slot) {
                    this.unequip(this.get(slot));
                    this.set(slot, item);
                    item.set('equippedBy', this.get('charName'));
                } else {
                    log.info('ya done fucked up equipped armor name: %s type: %s', item.get('name'), item.itemType);
                    throw('shit');
                }
            } else {
                log.info('ya done fucked up equipped sumpin\' ya don\'t equip name: %s type: %s', item.get('name'), item.itemType);
                throw('shit');
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
            /*_.each(['mainHand', 'offHand', 'head', 'chest', 'hands', 'legs'], function(name) {
                console.log('getaffixes: ', name, this.get(name));
            }, this);*/

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

    var ArmorCollection = Backbone.Collection.extend({
        model: ArmorModel,

        localStorage: new Backbone.LocalStorage('armor'),

        initialize: function() {
            this.fetch();
            log.debug('armor collection length: %d', this.length);
            if (this.length === 0) {
                log.info('No armor in local storage.');
                this.create({name: 'cardboard kneepads'});
            }
        }
    });

    var WeaponCollection = Backbone.Collection.extend({
        model: WeaponModel,

        localStorage: new Backbone.LocalStorage('weapons'),

        initialize: function() {
            this.fetch();
            log.debug('weapon collection length: %d', this.length);
            if (this.length === 0) {
                log.info('No weapons in local storage.');
                this.create({name: 'wooden sword'});
                this.create({name: 'shitty bow'});
                this.create({name: 'crappy wand'});
            }
        }
    });

    // this is all for inventory
    var SkillCollection = Backbone.Collection.extend({
        model: SkillModel,

        localStorage: new Backbone.LocalStorage('skills'),

        initialize: function() {
            this.fetch();
            log.debug('skill collection length: %d', this.length);
            if (this.length === 0) {
                log.info('No skills in local storage.');
                this.create({name: 'basic melee'});
                this.create({name: 'basic range'});
                this.create({name: 'basic spell'});
            }
        }
    });

    // inventory
    var InvModel = Backbone.Model.extend({
        armor: new ArmorCollection,
        weapons: new WeaponCollection,
        skills: new SkillCollection,

        initialize: function() {
            console.log('inventory initialize');
        }
    });

    var InvMenuView = Backbone.View.extend({
        el: $('#inv-menu-holder'),

        template: _.template($('#inv-menu-template').html()),

        itemTemplate: _.template($('#inv-menu-item-template').html()),

        events: {
            'click .item': 'onItemClick'
        },

        initialize: function() {
            console.log('right here');
            this.render();
        },

        render: function() {
            var rendered = this.template({
                itemTemplate: this.itemTemplate,
                armor: this.model.armor.toJSON(),
                weapons: this.model.weapons.toJSON(),
                skills: this.model.skills.toJSON(),
            });
            console.log(this.el);
            console.log(this.$el);
            this.$el.html(rendered);
            return this;
        },

        onItemClick: function(event) {
            $(event.currentTarget).toggleClass('collapsed');
        },
    });

    exports.extend({
        InvModel: InvModel,
        InvMenuView: InvMenuView,
        SkillChain: SkillChain,
        newSkillChain: newSkillChain,
        EquippedGearModel: EquippedGearModel,
    });
});
