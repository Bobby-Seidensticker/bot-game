namespace.module('bot.inv', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var utils = namespace.bot.utils;
    var itemref = namespace.bot.itemref;
    var prob = namespace.bot.prob;
    var attacks = namespace.bot.attacks;

    var GearModel = gl.Model.extend({
        initialize: function() {
            this.xp = 0;
            this.level = 1;
            this.baseMods = [];
            this.cards = [];
            this.equipped = false;
            this.maxCards = 5;
            this.ensureCardArray();
            this.isNew = false;
        },

        toJSON: function() {
            return {
                xp: this.xp,
                level: this.level,
                cardNames: _.pluck(_.compact(this.cards), 'name'),
                isNew: this.isNew,
                itemType: this.itemType,
                name: this.name
            };
        },

        fromJSON: function(data, cardInv) {
            _.extend(this, data);
            _.each(this.cardNames, function(name, i) {
                this.equipCard(_.findWhere(cardInv.models, {name: name}), i);
            }, this);
        },

        applyXp: function(xp) {
            var levels = 0;
            this.xp += xp;
            if (this.canLevel()) {
                this.levelUp();
                levels++;
            }
            return levels;
        },

        canLevel: function() {
            return this.xp >= this.getNextLevelXp();
        },

        getNextLevelXp: function() {
            return Math.floor(100 * Math.exp((this.level - 1) / Math.PI));
        },

        pctLeveled: function() {
            return this.xp / this.getNextLevelXp();
        },

        levelUp: function() {
            var type = this.itemType;
            this.xp -= this.getNextLevelXp();
            this.level += 1;

            this.ensureCardArray(this.maxCards);
        },

        ensureCardArray: function() {
            _.each(_.compact(this.cards), function(card) {
                if (!card || card.itemType !== 'card') {
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
            var mods = _.flatten(_.map(cards, function(card) { return card.getMods(); }));
            return mods.concat(utils.applyPerLevels(this.baseMods, this.level));
        },

        equipCard: function(card, slotIndex) {
            if (slotIndex >= this.cards.length) {
                log.error('Cannot equip card in slotIndex %d when item only has %d slots', slotIndex, this.cards.length);
                return false;
            }
            if (card && card.equipped) {
                log.error('Cannot equip already equipped card, %s', card.name);
                return false;
            }
            if (this.cards[slotIndex]) {
                log.warning("Unequipping card %s at slot %d of item: %s", this.cards[slotIndex].name, slotIndex, this.name);
                this.cards[slotIndex].equipped = false;  // model.unequip(this.cards[slotIndex].level);
                this.cards[slotIndex] = undefined;

            }
            if (card) {
                card.equipped = true;  // model.equip(card.level);
                this.cards[slotIndex] = card;
                log.warning("Equipped card %s into slot %d of item: %s", card.name, slotIndex, this.name);
            }

            log.info('equipCard, now have %d cards equipped', _.compact(this.cards).length);

            // this trigger is exclusively for communication between gear and
            // equipped gear model so egm doesn't have to listenTo and stopListening on every single gear change
            gl.EquipEvents.trigger('change');  
            return true;
        },

        unequipCards: function() {
            for (var i = 0; i < this.cards.length; i++) {
                if (this.cards[i]) {
                    this.cards[i].equipped = false;
                    this.cards[i] = undefined;
                }
            }
        },
    });

    function getSortKey(model) {
        var num = 0;
        if (model.itemType === 'weapon') {
            return 'a' + {melee: 'a', range: 'b', spell: 'c'}[model.type] + model.name;
        } else if (model.itemType === 'armor') {
            return 'b' + {head: 'a', chest: 'b', legs: 'c', hands: 'd'}[model.type] + model.name;
        } else if (model.itemType === 'skill') {
            return 'c' + model.name.toLowerCase();
        }
    }

    var ArmorModel = GearModel.extend({
        initialize: function(name) {
            GearModel.prototype.initialize.call(this)
            this.name = name;
            _.extend(this, itemref.expand('armor', this.name));            
            this.itemType = 'armor';
            this.baseMods = this.mods;

            this.key = getSortKey(this);

            log.debug('Made a new armor name: %s', this.name);
        }
    });

    var WeaponModel = GearModel.extend({
        initialize: function(name) {
            GearModel.prototype.initialize.call(this)
            this.name = name;
            _.extend(this, itemref.expand('weapon', this.name));
            
            this.itemType = 'weapon';

            this.baseMods = this.mods;

            this.key = getSortKey(this);

            log.debug('Made a new weapon name: %s', this.name);
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

            this.key = getSortKey(this);
        },

        computeAttrs: function(baseDmgStats, weaponType, dmgKeys, actualDmgKeys) {
            this.weaponType = weaponType;  // please don't modify this
            this.baseDmgStats = baseDmgStats;
            this.dmgStats = $.extend(true, {}, baseDmgStats);

            log.debug('Skill compute attrs');

            //remove added baseDmg amounts from spells (they can only be modified by cards on skill or by more increases)
            if (this.class === 'spell') {
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
                if (this.class + "Dmg" === stat) {
                    typeMoreMod *= this[stat]; //attackType modifiers are percentage based
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

            this.calcAttacks();
        },

        calcAttack: function(spec, index, specs) {
            var keys = namespace.bot.entity.attackSpecKeys;
            var dmgKeys = namespace.bot.entity.attackSpecDmgKeys;

            // Ensure spec has necessary keys from skill
            _.each(keys, function(key) {
                spec[key] = this[key];
            }, this);

            // ensure angle and projCount, log errors
            if (spec.angle === undefined) { log.error('In calcAttack, Skill angle is undefined'); spec.angle = 30; }
            if (spec.projCount === undefined) { log.error('In calcAttack, Skill projCount is undefined'); spec.projCount = 1; }

            // apply qualifiers, lots of special case code
            if (spec.quals && spec.quals.length) {
                _.each(spec.quals, function(qual) {
                    var split = qual.split(' ');
                    if (split[0] === 'dmg') {
                        if (split[1] === 'more') {
                            var dmgMod = 1 + (parseFloat(split[2]) / 100);
                            _.each(dmgKeys, function(key) {
                                spec[key] *= dmgMod;
                            });
                        } else {
                            log.error('Trying to apply an invalid damage qualifier %s', qual);
                        } 
                    } else if (split[0].indexOf('Dmg') > -1) {
                        log.error('Trying to apply an invalid damage qualifier %s', qual);
                    } else if (split[0] === 'projCount') {
                        spec.projCount += parseFloat(split[2]);
                    } else if (split[0] === 'angle') {
                        spec.angle += parseFloat(split[2]);
                    }
                }, this);
            }

            // Sum LGoH and leech for quick use in EntityBody.handleHit
            spec.totalHpLeech = spec.hpOnHit + spec.hpLeech;
            spec.totalManaLeech = spec.manaOnHit + spec.manaLeech;

            // Ensure projCount and angle have sane values
            spec.projCount = Math.floor(spec.projCount);
            spec.angle = Math.floor(Math.abs(spec.angle));
            if (spec.projCount < 1) { spec.projCount = 1; }
            if (spec.projCount > 1 && spec.angle === 0) { spec.angle = 5; }

            var arrs = ['onHit', 'onKill', 'onRemove'];
            _.each(arrs, function(arr) {
                if (spec[arr] && spec[arr].length) {
                    _.each(spec[arr], this.calcAttack, this);
                }
            }, this);
        },

        calcAttacks: function() {
            this.specs = $.extend({}, this.specs);
            _.each(this.specs, this.calcAttack, this);
        },
        
        getTotalDmg: function() {
            return (this.physDmg + this.fireDmg + this.coldDmg + this.lightDmg + this.poisDmg).toFixed(2);
        },
        
        getDps: function() {
            return (this.getTotalDmg() / this.speed * 1000).toFixed(2);
        }
    });

    var Skillchain = gl.Model.extend({
        initialize: function() {
            this.skills = [undefined, undefined, undefined, undefined, undefined];
            this.name = "Skillchain";
            // this.on('add remove', this.countChange, this);
        },

        toJSON: function() {
            return _.pluck(_.compact(this.skills), 'name');
        },

        fromJSON: function(data, inv) {
            _.each(data, function(skillName, slot) {
                this.equip(_.findWhere(inv.models, {name: skillName}), slot, false);
            }, this);
        },

        equip: function(skill, slot, isMonster) {
            log.info('skillchain equip');
            if (skill === undefined) {
                if (this.skills[slot]) {
                    this.skills[slot].equipped = false;
                    this.skills[slot].disabled = false;
                    this.skills[slot].unequipCards();
                }
                log.warning('Skillchain unequipping %s from slot %d', this.skills[slot].name, slot);
                this.skills[slot] = undefined;
            } else {
                if (skill.itemType !== 'skill') {
                    return false;
                }
                if (this.skills[slot]) {
                    this.skills[slot].equipped = false;
                    this.skills[slot].disabled = false;
                    this.skills[slot].unequipCards();
                }
                skill.equipped = true;
                this.skills[slot] = skill;
                if(!isMonster) {
                    log.warning('Skillchain equipped %s into slot %d', this.skills[slot].name, slot);
                }
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
            _.each(_.compact(this.skills), function(skill) {
                skill.computeAttrs(dmgStats, weaponType, dmgKeys, actualDmgKeys);
            });

            this.trigger('skillComputeAttrs');
            gl.DirtyQueue.mark('skillComputeAttrs');
        },

        applyXp: function(xp) {
            var levels = 0;
            _.each(_.compact(this.skills), function (skill) {
                levels += skill.applyXp(xp);
            });
            return levels;
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
            this.name = "Equipped";
            this.newCards = {'weapon': false, 'head': false, 'hands': false, 'chest': false, 'legs': false};
            this.listenTo(gl.ItemEvents, 'newchange', this.findNews);
        },

        toJSON: function() {
            var slot;
            var obj = {};
            for (var i = 0; i < this.slots.length; i++) {
                slot = this.slots[i];
                if (this[slot]) {
                    obj[slot] = this[slot].name;
                }
            }
            return obj;
        },

        fromJSON: function(data, inv) {
            _.each(data, function(itemName, slot) {
                console.log('asdflkjasdflkjasdflkjsadf', itemName, slot, _.findWhere(inv.models, {name: itemName}));
                this.equip(_.findWhere(inv.models, {name: itemName}), slot);
            }, this);
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
                log.warning('EquipGearModel unequipping %s from slot %s', this[slot].name, slot);
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
                log.warning('EquipGearModel equipping %s into slot %s', item.name, slot);
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
            var levels = 0;
            _.each(this.slots, function(slot) {
                if (this[slot] !== undefined) {
                    levels += this[slot].applyXp(xp);
                }
            }, this);
            return levels;
        },
    });

    var ItemCollection = gl.Model.extend({
        initialize: function() {
            this.models = [
                /*new WeaponModel('cardboard sword'),
                new SkillModel('basic melee'),
                new SkillModel('basic range'),
                new SkillModel('basic spell'),
                new ArmorModel('balsa helmet'),*/
            ];
            this.sort();
            this.listenTo(gl.ItemEvents, 'newchange', this.checkForNews);
        },

        noobGear: function() {
            this.models = [new WeaponModel('cardboard sword'),
                           new SkillModel('basic melee'),
                           new SkillModel('basic range'),
                           new SkillModel('basic spell'),
                           new ArmorModel('balsa helmet')];
        },

        toJSON: function() {
            return _.map(this.models, function(model) { return model.toJSON(); });
        },

        fromJSON: function(data, cardInv) {
            this.models = _.map(data, function(model) {
                var item;
                if (model.itemType === 'skill') {
                    item = new SkillModel(model.name);
                } else if (model.itemType === 'weapon') {
                    item = new WeaponModel(model.name);
                } else if (model.itemType === 'armor') {
                    item = new ArmorModel(model.name);
                }
                item.fromJSON(model, cardInv);
                return item;
            }, this);
            this.sort();
        },

        byId: function(id) {
            return _.findWhere(this.models, {id: id});
        },

        sort: function() {
            this.models.sort(function(a, b) {
                if (a.key < b.key) { return -1; }
                if (a.key > b.key) { return 1; }
                return 0;
            });
        },

        addDrops: function(drops) {
            var messages = [];
            //log.warning('adding %d inv drops', drops.length);
            _.each(drops, function(drop) {
                //console.log(drop);
                if (_.findWhere(this.models, {name: drop.name})) {
                    return;
                }
                this.models.push(drop.make());
                this.sort();
                messages.push(drop.message());
                log.warning('Item dropped: %s', drop.name);
                gl.DirtyQueue.mark('inventory:new');
                this.checkForNews();
            }, this);
            return messages;
        },

        checkForNews: function() {
            var any = false;
            _.each(this.models, function(item) {
                if(item.isNew) {
                    any = true;
                }
            }, this);
            if (any) {
                gl.DirtyQueue.mark('footer:buttons:invshownew');
            } else {
                gl.DirtyQueue.mark('footer:buttons:invhidenew');
            }
        }
    });

    var CardModel = gl.Model.extend({
        initialize: function(name) {
            _.extend(this, itemref.expand('card', name));
            this.itemType = 'card';
            this.name = name;
            this.equipped = false;
            this.qp = 0;
            this.level = 1;
            this.isNew = false;
        },

        toJSON: function() {
            return {
                name: this.name,
                qp: this.qp,
                level: this.level,
                //equipped: this.equipped,  // needs to be false so the gear model can equip it itself
                isNew: this.isNew
            };
        },

        fromJSON: function(data) {
            _.extend(this, data);
        },

        getMods: function() {
            log.debug('CardModel.getMods. name: %s, level: %d', this.name, this.level);
            return utils.applyPerLevels(this.mods, this.level);
        },

        applyQp: function(qp) {
            var levels = 0;
            this.qp += qp;
            if (this.canLevel()) {
                this.levelUp();
                levels++;
            }
            if (levels && this.equipped) {
                this.trigger('change');
            }
            return levels;
        },

        canLevel: function() {
            return this.qp >= this.getNextLevelQp();
        },

        getNextLevelQp: function() {
            return Math.pow(10, this.level);
        },

        pctLeveled: function() {
            return this.qp / this.getNextLevelQp();
        },

        levelUp: function() {
            this.qp -= this.getNextLevelQp();
            this.level += 1;
            log.info('card %s leveling up to %d', this.name, this.level);
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

    var CardCollection = gl.Model.extend({
        initialize: function() {
            this.models = [];
            this.listenTo(gl.ItemEvents, 'newchange', this.updateNews);
        },

        toJSON: function() {
            return _.map(this.models, function(model) { return model.toJSON(); });
        },

        fromJSON: function(data) {
            this.models = _.map(data, function(cardData) {
                var c = new CardModel(cardData.name);
                c.fromJSON(cardData);
                return c;
            });
            this.updateNews();
        },

        updateNews: function() {
            var any = false;
            this.skillchain.newCards = false;
            _.each(this.equipped.slots, function(slot) {
                this.equipped.newCards[slot] = false;
            }, this);
            _.each(this.models, function(card) {
                if (card.isNew) {
                    any = true;
                    if (card.slot === 'skill') {
                        this.skillchain.newCards = true;
                    } else {
                        this.equipped.newCards[card.slot] = true;
                    }
                }
            }, this);
            if (any) {
                gl.DirtyQueue.mark('footer:buttons:cardshownew')
            } else {
                gl.DirtyQueue.mark('footer:buttons:cardhidenew')
            }
            gl.DirtyQueue.mark('cards:newchange');
        },

        addDrops: function(drops) {
            var messages = [];
            log.info('adding card drops');
            _.each(drops, function(drop) {
                var existingCard = _.findWhere(this.models, {name: drop.name});
                if (existingCard) {
                    drop.update(existingCard);
                } else {
                    this.models.push(drop.make());
                    log.warning('New Card dropped: %s', drop.name);
                    this.updateNews();
                }
                messages.push(drop.message());
                gl.DirtyQueue.mark('cards:new');
            }, this);
            return messages;
        },

        getSlotCards: function(slot) {
            if (typeof(slot) === 'number') {
                slot = 'skill';
            }
            return _.filter(this.models, function(model) { return model.slot === slot; });
        },
    });

    exports.extend({
        ItemCollection: ItemCollection,
        CardCollection: CardCollection,
        CardModel: CardModel,
        WeaponModel: WeaponModel,
        ArmorModel: ArmorModel,
        SkillModel: SkillModel,
        Skillchain: Skillchain,
        EquippedGearModel: EquippedGearModel,
    });
});
