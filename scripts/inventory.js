namespace.module('bot.inv', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;
    var prob = namespace.bot.prob;

    var GearModel = gl.Model.extend({
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

            log.info('equipCard, now have %d cards equipped', _.compact(this.cards).length);

            // this trigger is exclusively for communication between gear and
            // equipped gear model so egm doesn't have to listenTo and stopListening on every single gear change
            gl.EquipEvents.trigger('change');  
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

        computeAttrs: function(baseDmgStats, weaponType, dmgKeys, actualDmgKeys) {
            this.weaponType = weaponType;  // please don't modify this
            this.baseDmgStats = baseDmgStats;
            this.dmgStats = $.extend(true, {}, baseDmgStats);

            log.debug('Skill compute attrs');

            //remove added baseDmg amounts from spells (they can only be modified by cards on skill or by more increases)
            if (this.class === "spell") {
                _.each(actualDmgKeys, function(dmgType) {        
                    this.dmgStats[dmgType].added = 0;
                }, this);
            }

            
            var mods = this.getMods();
            _.each(mods, function(mod) {
                utils.addMod(this.dmgStats, mod.def);
            }, this);

            

            var arr = ['meleeDmg', 'rangeDmg', 'spellDmg'];

            var typeMoreMod = 1;
            if (this.class !== 'spell' && this.class !== weaponType) {
                typeMoreMod = 0;
            }

            _.each(arr, function(stat) {
                this[stat] = utils.computeStat(this.dmgStats, stat);
                if (this.class + "Dmg" == stat) {
                    typeMoreMod *= 1 + (this[stat] / 100); //attackType modifiers are percentage based
                }
            }, this);

            _.each(dmgKeys, function(stat) {
                if (actualDmgKeys.indexOf(stat) !== -1) {
                    this.dmgStats[stat].more *= typeMoreMod;
                }
                if (arr.indexOf(stat) !== -1) {
                    return;
                }
                this[stat] = utils.computeStat(this.dmgStats, stat);
            }, this);

            var totalDmg = 0;
            _.each(actualDmgKeys, function(stat) {
                totalDmg += this[stat];
            }, this);
            this.disabled = totalDmg === 0;
        },
    });

    var Skillchain = gl.Model.extend({
        initialize: function() {
            this.skills = [undefined, undefined, undefined, undefined, undefined];
            // this.on('add remove', this.countChange, this);
        },

        equip: function(skill, slot) {
            log.info('skillchain equip');
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

            this.trigger('change');
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

        computeAttrs: function(dmgStats, weaponType) {
            var dmgKeys = namespace.bot.entity.dmgKeys;
            var actualDmgKeys = namespace.bot.entity.actualDmgKeys;
            log.debug('skill chain compute attrs');

            this.lastDmgStats = dmgStats;
            _.each(this.skills, function(skill) {
                if (skill !== undefined) {
                    skill.computeAttrs(dmgStats, weaponType, dmgKeys, actualDmgKeys);
                }
            });

            this.trigger('skillComputeAttrs');
            gl.DirtyQueue.mark('skillComputeAttrs');
        },

        applyXp: function(xp) {
            _.each(_.compact(this.skills), function (skill) {
                skill.applyXp(xp);
            });
        },
    });

    var EquippedGearModel = gl.Model.extend({

        slots: ['weapon', 'head', 'hands', 'chest', 'legs'],

        // weapon slots: weapon
        // armor slots: head, chest, hands, legs

        initialize: function() {
            // this line and event object is used exclusively for equipment card changes to propogate through here
            // and up to the hero so the egm doesn't have to listen and stop listening every equip
            this.listenTo(gl.EquipEvents, 'change', this.propChange);
        },

        propChange: function() { this.trigger('change'); },

        equip: function(item, slot) {
            log.info('equipped gear model equip');

            /*
              Slot empty, filling with item: fill slot
              Slot empty, filling with nothing: error
              Slot full, filling with item: unequip old, fill new
              Slot full, filling with nothing: unequip old, empty slot
              Slot full, trying to equip same item, error
              When equipping, ensure it's a valid operation

              If no error, fire appropriate events
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
            this.trigger('change');
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

    var ItemCollection = gl.Model.extend({
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
                        gl.DirtyQueue.mark('inventory:new');
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
                        gl.DirtyQueue.mark('inventory:new');
                        this.models.push(new SkillModel(drop.data));
                        log.info('Adding skill %s', drop.data);
                    } else {
                        log.info('Already have skill %s', drop.data);
                    }
                }
            }
        }
    });

    var CardTypeModel = gl.Model.extend({
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

    var CardTypeCollection = gl.Model.extend({
        initialize: function() {
            this.models = [];
        },

        addDrops: function(drops) {
            var drop;
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
                gl.DirtyQueue.mark('cards:new');
            }
        },

        getSlotCTMs: function(slot) {
            if(typeof(slot) == "number") {
                slot = 'skill';
            }
            return _.filter(this.models, function(model) { return model.slot === slot; });
        },
    });

    exports.extend({
        ItemCollection: ItemCollection,
        CardTypeCollection: CardTypeCollection,
        CardTypeModel: CardTypeModel,
        WeaponModel: WeaponModel,
        ArmorModel: ArmorModel,
        SkillModel: SkillModel,
        Skillchain: Skillchain,
        EquippedGearModel: EquippedGearModel,
    });
});
