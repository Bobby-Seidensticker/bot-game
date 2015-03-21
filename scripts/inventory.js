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
            this.cards = [undefined, undefined, undefined, undefined, undefined];
            this.equipped = false;
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
            this.loadCards(this.cardNames, cardInv);
        },

        loadCards: function(cardNames, cardInv) {
            _.each(cardNames, function(name, i) {
                this.equipCard(_.findWhere(cardInv.models, {name: name}), i);
            }, this);
        },
        
        applyXp: function(xp) {
            var levels = 0;
            this.xp += xp;
            while (this.canLevel()) {
                this.xp -= this.getNextLevelXp();
                this.level++;
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

        getMods: function() {
            var cards = _.compact(this.cards);
            var mods = _.flatten(_.map(cards, function(card) { return card.getMods(); }));
            return mods.concat(utils.applyPerLevels(this.baseMods, this.level));
        },

        equipCard: function(card, slot) {
            if (slot >= this.cards.length || (card && card.itemType !== 'card')) {
                return false;
            }

            if (card === undefined) {
                if (this.cards[slot]) {
                    this.actuallyUnequipCard(slot);
                }
                return false;
            }

            if (card.equipped) {  // card already equipped
                var curSlot = this.getCardSlot(card);
                if (slot === curSlot) {
                    return false;
                }
                if (this.cards[slot]) {
                    this.actuallyEquipCard(this.cards[slot], curSlot);
                } else {
                    this.actuallyUnequipCard(curSlot);
                }
                this.actuallyEquipCard(card, slot);
            } else {
                if (this.cards[slot]) {
                    this.actuallyUnequipCard(slot);
                }
                this.actuallyEquipCard(card, slot);
            }

            // this trigger is exclusively for communication between gear and
            // equipped gear model so egm doesn't have to listenTo and stopListening on every single gear change
            gl.EquipEvents.trigger('change');  
            return true;
        },

        actuallyEquipCard: function(card, slot) {
            card.equipped = true;
            card.gearModel = this;
            this.cards[slot] = card;
        },

        actuallyUnequipCard: function(slot) {
            this.cards[slot].equipped = false;
            this.cards[slot].gearModel = this;
            this.cards[slot] = undefined;
        },

        getCardSlot: function(card) {
            if (!card) { return undefined; }
            for (var i = this.cards.length; i--;) {
                if (this.cards[i] && this.cards[i].name === card.name) {
                    return i;
                }
            }
            return undefined;
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
            return 'a' + {melee: 'a', range: 'b', spell: 'c'}[model.weaponType] + model.name;
        } else if (model.itemType === 'armor') {
            return 'b' + {head: 'a', chest: 'b', legs: 'c', hands: 'd'}[model.slot] + model.name;
        } else if (model.itemType === 'skill') {
            return 'c' + model.name.toLowerCase();
        }
    }

    // itemType -> slot
    // weapon  type -> weaponType
    // skill class -> skillType

    var ArmorModel = GearModel.extend({
        initialize: function(name) {
            GearModel.prototype.initialize.call(this);
            _.extend(this, itemref.expand('armor', name));

            this.name = name;
            this.itemType = 'armor';
            this.baseMods = this.mods;
            this.key = getSortKey(this);
        }
    });

    var WeaponModel = GearModel.extend({
        initialize: function(name) {
            GearModel.prototype.initialize.call(this)
            _.extend(this, itemref.expand('weapon', name));

            this.name = name;
            this.itemType = 'weapon';
            this.slot = 'weapon';
            this.baseMods = this.mods;
            this.key = getSortKey(this);
        }
    });

    var SkillModel = GearModel.extend({
        initialize: function(name) {
            GearModel.prototype.initialize.call(this);
            _.extend(this, itemref.expand('skill', name));

            this.name = name;
            this.itemType = 'skill';
            this.slot = 'skill';
            this.key = getSortKey(this);
        },

        computeAttrs: function(baseDmgStats, weaponType, dmgKeys, actualDmgKeys) {
            this.weaponType = weaponType;  // please don't modify this
            this.baseDmgStats = baseDmgStats;
            this.dmgStats = $.extend(true, {}, baseDmgStats);

            log.debug('Skill compute attrs');

            // remove added baseDmg amounts from spells (they can only be modified by cards on skill or by more increases)
            if (this.skillType === 'spell') {
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
            if (this.skillType !== 'spell' && this.skillType !== weaponType) {
                typeMoreMod = 0;
            }

            _.each(arr, function(stat) {
                this[stat] = utils.computeStat(this.dmgStats, stat);
                if (this.skillType + "Dmg" === stat) {
                    typeMoreMod *= this[stat];  // attackType modifiers are percentage based
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

            // Total damage summed here for convenience.  Used in takeDamage to quickly figure out
            //   how much damage was mitigated to adjsut the hpLeech and manaLeech
            spec.totalDmg = spec.physDmg + spec.lightDmg + spec.coldDmg + spec.fireDmg + spec.poisDmg;

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

            var change = false;

            if (skill === undefined) {
                change = this.unequip(slot);
            } else if (skill.itemType === 'skill') {
                if (skill.equipped) {                         // if skill we are trying to equip is already equipped
                    var curSlot = this.getSkillSlot(skill);   // get the slot it's equipped in
                    if (curSlot !== slot) {                   // if it was dropped in a different slot
                        if (this.skills[slot]) {              // if something is already in that slot
                            this.skills[curSlot] = this.skills[slot];
                            this.skills[slot] = skill;
                        } else {                              // slot dropping into is currently empty
                            this.skills[slot] = this.skills[curSlot];
                            this.skills[curSlot] = undefined;
                        }
                        change = true;
                    }
                } else {
                    this.unequip(slot);
                    skill.equipped = true;
                    this.skills[slot] = skill;
                    change = true;
                    if (!isMonster) {
                        log.warning('Skillchain equipped %s into slot %d', skill, slot);
                    }
                }
            }
            if (change) {
                this.trigger('change');
            }
            return change;
        },

        unequip: function(slot) {
            var skill = this.skills[slot];
            if (skill !== undefined) {
                skill.equipped = false;
                skill.disabled = false;
                skill.unequipCards();   // TODO save equipped cards
                log.warning('Skillchain unequipping %s from slot %d', skill.name, slot);
                this.skills[slot] = undefined;
                return true;
            }
            return false;
        },

        getSkillSlot: function(skill) {
            if (!skill) { return undefined; }
            for (var i = this.skills.length; i--;) {
                if (this.skills[i] && this.skills[i].name === skill.name) {
                    return i;
                }
            }
            return undefined;
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
                this.equip(_.findWhere(inv.models, {name: itemName}), slot);
            }, this);
        },

        propChange: function() { this.trigger('change'); },

        equip: function(item, slot) {
            log.info('equipped gear model equip');

            var change = false;

            if (item === undefined) {
                change = this.unequip(slot);
            } else if (item.slot === slot) {
                this.unequip(slot);
                this[slot] = item;
                item.equipped = true;
                change = true;
            }

            if (change) {
                this.trigger('change');
            }
            return change;
        },

        unequip: function(slot) {
            var item = this[slot];
            if (item !== undefined) {
                item.equipped = false;
                item.unequipCards();  // TODO save equipped cards
                this[slot] = undefined;
                return true;
            }
            return false;
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
                           new WeaponModel('wooden bow'),
                           new WeaponModel('simple wand'),
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
                gl.DirtyQueue.mark('footer:invshownew');
            } else {
                gl.DirtyQueue.mark('footer:invhidenew');
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
                isNew: this.isNew
            };
        },

        fromJSON: function(data) {
            _.extend(this, data);
        },

        getMods: function() {
            return utils.applyPerLevels(this.mods, this.level);
        },

        applyQp: function(qp) {
            var levels = 0;
            this.qp += qp;
            while (this.canLevel()) {
                this.qp -= this.getNextLevelQp();
                this.level++;
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
            return Math.pow(3, this.level);
        },

        pctLeveled: function() {
            return this.qp / this.getNextLevelQp();
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
                gl.DirtyQueue.mark('footer:cardshownew')
            } else {
                gl.DirtyQueue.mark('footer:cardhidenew')
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
