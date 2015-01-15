namespace.module('bot.inv', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;
    var prob = namespace.bot.prob;

    var GearModel = Backbone.Model.extend({
        defaults: function() {
            return {
                xp: 0,
                level: 1,
                affixes: [],
                nextAffix: '',
                equippedBy: ''
            };
        },

        applyXp: function(xp) {
            this.set('xp', this.get('xp') + xp);
            if (this.canLevel()) {
                this.prepLevelUp();
            }
        },

        prepLevelUp: function() {
            // purpose of function is to roll 'nextAffix' and activate level up button
            // item does not actually level (even if xp reached) until player clicks
            if (this.get('nextAffix') === '') {
                this.set('nextAffix', this.rollAffix());
            }
        },

        canLevel: function() {
            return this.get('xp') >= this.getNextLevelXp();
        },

        getNextLevelXp: function() {
            return Math.floor(100 * Math.exp((this.get('level') - 1) / Math.PI));
        },

        levelUp: function() {
            if (this.get('nextAffix') === '') {
                log.error('item levelUp called without nextAffix properly initted');
            }

            var type = this.get('itemType');
            var affixes = this.get('affixes');
            this.set('affixes', affixes.concat(this.get('nextAffix')));
            this.set('nextAffix', '');

            log.info('leveling up %s', type);
            this.set('xp', this.get('xp') - this.getNextLevelXp());
            this.set('level', this.get('level') + 1);
            if (this.canLevel()) {
                this.prepLevelUp();
            }
        }
    });

    var ArmorModel = GearModel.extend({
        defaults: function() {
            return _.extend({
                weight: 0,
                type: 'ERR type',
                itemType: 'armor'
            }, GearModel.prototype.defaults());
        },

        initialize: function() {
            log.debug('loading armor %s from file', this.get('name'));
            this.set(itemref.expand('armor', this.get('name')));
        },
    });

    //var WeaponModel = GearModel.extend({
    var WeaponModel = GearModel.extend({
        defaults: function() {
            return _.extend({
                speed: 0,
                type: 'ERR type',
                damage: 0,
                range: 0,
                itemType: 'weapon'
            }, GearModel.prototype.defaults());
        },

        initialize: function() {
            log.debug('loading weapon %s from file %s', this.get('name'), JSON.stringify(this.get('affixes')));
            this.set(itemref.expand('weapon', this.get('name')));
        },
    });

    var SkillModel = GearModel.extend({
        defaults: function() {
            return _.extend({
                manaCost: 0,
                cooldownTime: 800,
                types: [],
                level: 1,
                itemType: 'skill'
            }, GearModel.prototype.defaults());
        },

        initialize: function() {
            this.cooldown = 0;
            log.debug('loading skill %s from file', this.get('name'));
            this.set(itemref.expand('skill', this.get('name')));
        },

        cool: function() {
            return this.cooldown <= 0;
        },

        getDamage: function(castTime) {
            this.use(castTime);
            return {
                'physDmg': this.get('physDmg'),
                'fireDmg': this.get('fireDmg'),
                'coldDmg': this.get('coldDmg'),
                'lightDmg': this.get('lightDmg'),
                'poisDmg': this.get('poisDmg')
            };
        },

        use: function(castTime) {
            this.cooldown = this.get('cooldownTime') + castTime;
        },

        computeAttrs: function(weapon, affixDict) {
            //log.info('Skill compute attrs');
            var t = {
                physDmg: weapon.get('damage'),
                range: weapon.get('range'),
                speed: weapon.get('speed'),
                fireDmg: 0,
                coldDmg: 0,
                lightDmg: 0,
                poisDmg: 0,
                manaCost: this.get('manaCost')
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
            //console.log('skill computeAttrs', t, this, affixDict);
            this.set(t);

            log.debug('Skill compute attrs: %s', JSON.stringify(t));
        },
    });

    var Skillchain = Backbone.Collection.extend({
        model: SkillModel,

        initialize: function() {
            this.on('add remove', this.countChange, this);
        },

        countChange: function(item) {
            log.debug('Skillchain countChange');
            var ranges = this.pluck('range');
            this.shortest = ranges.min();
            this.furthest = ranges.max();
            // TODO: figure out range
            //console.log(item.get('range'));
        },

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

    function newSkillchain() {
        var sk;
        sk = new Skillchain();
        return sk;
    }

    var EquippedGearModel = Backbone.Model.extend({

        slots: ['mainHand','head', 'offHand', 'hands', 'chest', 'legs'],

        // weapon slots: mainHand, offHand
        // armor slots: head, chest, hands, legs
        initialize: function(options, inv) {
        },

        equip: function(item, slot) {
            log.debug('EquippedGearModel.equip, slot: %s', slot);
            if(this.get(slot) == item) {
                //If already equipped, unequip
                this.unset(slot);
                item.set('equippedBy', '');
                this.trigger('equipSuccess');
                return;
            }
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
                    item.set('equippedBy', this.get('heroName'));
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
                    item.set('equippedBy', this.get('heroName'));
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
                // TODO, this is a dumb passthrough, will be removed when we are using the global event queue
                this.listenTo(item, 'change', this.trigger.curry('change'));
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
                this.stopListening(item, 'change');
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

        applyXp: function(xp) {
            _.each(this.slots, function(slot) {
                if (this.get(slot)) {
                    this.get(slot).applyXp(xp);
                }
            }, this);

        },
    });

    var ItemCollection = Backbone.Collection.extend({
        itemTypes: function() {
            return ['weapon', 'armor', 'skill'];
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
    });

    exports.extend({
        ItemCollection: ItemCollection,
        InvItemCollectionView: InvItemCollectionView,

        WeaponModel: WeaponModel,
        ArmorModel: ArmorModel,
        SkillModel: SkillModel,
        Skillchain: Skillchain,
        newSkillchain: newSkillchain,
        EquippedGearModel: EquippedGearModel,
    });
});
