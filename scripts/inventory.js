namespace.module('bot.inv', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

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
        }),

        initialize: function() {
            log.debug('Armor Model attributes at initialize: %s', JSON.stringify(this.toJSON()));
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
            range: 0
        }),

        initialize: function() {
            log.debug('Weapon Model attributes at initialize: %s', JSON.stringify(this.toJSON()));
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
            type: 'skill' // remove this
        }),

        initialize: function() {
            log.debug('Skill Model attributes at initialize: %s', JSON.stringify(this.toJSON()));
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
	    var damage = weapon.damage;
	    var range = weapon.range;
	    var speed = weapon.speed;
	    
	},
    });

    var SkillChain = Backbone.Collection.extend({
        model: SkillModel,

        bestSkill: function(mana, distances) {
            var range = this.get('range');
            return this.find(function(skill) {
                if (mana >= skill.get('manaCost') && skill.cool()) {
                    return _.some(distances, function(dist) { return range >= dist; });
                }
                return false;
            });
        }
    });

    function newSkillChain() {
        var sk;
        sk = new SkillChain();

        return sk;
    }


    var ArmorCollection = Backbone.Collection.extend({
        model: ArmorModel,

        localStorage: new Backbone.LocalStorage('armor'),

        initialize: function() {
            this.fetch();
            log.info('armor collection length: %d', this.length);
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
            log.info('weapon collection length: %d', this.length);
            if (this.length === 0) {
                log.info('No weapons in local storage.');
                this.create({name: 'wooden sword'});
                this.create({name: 'shitty bow'});
                this.create({name: 'magic stick'});
            }
        }
    });

    // this is all for inventory
    var SkillCollection = Backbone.Collection.extend({
        model: SkillModel,

        localStorage: new Backbone.LocalStorage('skills'),

        initialize: function() {
            this.fetch();
            log.info('skill collection length: %d', this.length);
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
            console.log('here', this.model.armor.toJSON());
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
        SkillChain: SkillChain
    });
});