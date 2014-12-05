namespace.module('bot.menu', function (exports, require) {

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
        defaults: function() {
            return {
                speed: 0,
                type: 'ERR type',
                damage: 0,
                range: 0
            }
        },

        initialize: function() {
            log.debug('Armor Model attributes at initialize: %s', JSON.stringify(this.attributes));
            if (!('id' in this)) {
                log.debug('loading armor %s from file', this.get('name'));
                this.set(itemref.expand('armor', this.get('name')));
            }
        },
    });

    var WeaponModel = GearModel.extend({
        defaults: function() {
            return {
                weight: 0,
                type: 'ERR type',
            }
        },

        initialize: function() {
            if (!('id' in this)) {
                log.debug('loading weapon %s from file', this.get('name'));
                this.set(itemref.expand('weapon', this.get('name')));
            }
        },
    });

    var SkillModel = GearModel.extend({
        defaults: function() {
            return {
                mana: 0,
                types: []
            }
        },

        initialize: function() {
            if (!('id' in this)) {
                log.debug('loading skill %s from file', this.get('name'));
                this.set(itemref.expand('skill', this.get('name')));
            }
        },
    });

    var ArmorCollection = Backbone.Collection.extend({
        model: ArmorModel,

        localStorage: new Backbone.LocalStorage('armor-collection'),

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

        localStorage: new Backbone.LocalStorage('weapon-collection'),

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

    var SkillCollection = Backbone.Collection.extend({
        model: SkillModel,

        localStorage: new Backbone.LocalStorage('skill-collection'),

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

        
        /*function brandNewInv() {
          var inv = {
          'weapons': [
          itemref.expand('weapon', 'wooden sword'),
          itemref.expand('weapon', 'shitty bow'),
          itemref.expand('weapon', 'magic stick')
          ],
          'armor': [
          itemref.expand('armor', 'cardboard kneepads')
          ],
          'skills': [
          itemref.expand('skill', 'basic melee'),
          itemref.expand('skill', 'basic range'),
          itemref.expand('skill', 'basic spell')
          ],
          'affixes': [],
          'recipes': [
	  itemref.expand('recipe', 'smelly cod piece'),
	  itemref.expand('recipe', 'balsa helmet'),
	  itemref.expand('recipe', 'lightning arrow')
	  ],
	  'mats': []
          };
          return inv;
          }*/
    });

    var MenuModel = Backbone.Model.extend({
        defaults: function() {
            return {
                selectedTab: 0
            }
        },

        tabClick: function(index) {
            this.set('selectedTab', index)
        }
    });

    var TabModel = Backbone.Model.extend({
        defaults: function() {
            return {visible: false};
        }
    });

    var TabCollection = Backbone.Collection.extend({
        model: TabModel
    });

    var TabsView = Backbone.View.extend({
        tagName: 'table',

        el: $('.menu'),

        render: function() {
            this.collection.each(function(tab) {
                var tabView = new TabView({model: tab});
                this.$el.append(tabView.render().el);
            }, this);
            return this;
        },

        initialize: function() {
            
        },
    });

    var TabView = Backbone.View.extend({
        tagName: 'td',

        template: _.template($('#menu-tab-template').html()),

        render: function() {
            
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    function newMenu() {
        var tabs = new TabCollection([
                {name: 'map', selected: true},
                {name: 'inv', selected: false},
                {name: 'craft', selected: false},
                {name: 'lvlup', selected: false},
                {name: 'settings', selected: false},
        ]);
        var view = new TabsView({collection: tabs});

        view.render();
    }

    exports.extend({
        newMenu: newMenu,
        //MenuView: MenuView
    });

});