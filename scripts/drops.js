namespace.module('bot.drops', function(exports, require) {

    var inventory;
    var log;
    $(function() {
        inventory = namespace.bot.inv;
        itemref = namespace.bot.itemref;
        utils = namespace.bot.utils;
        log = namespace.bot.log;
    });

    /*
      dropFactory returns an object that implements the Drop interface
      constructor(): takes the monster itemRef data for that drop and saves it properly
      make(): returns the created object, called iff it needs to be made
      message(): returns the message that should be displayed
     */

    function dropFactory(type, refData) {
        // type is card, item, or skill
        if (type === 'card') {
            return new CardDrop(refData);
        }
        if (type === 'item') {
            return new ItemDrop(refData);
        }
        if (type === 'skill') {
            return new SkillDrop(refData);
        }
        throw ('shoot, drop factory called with invalid type argument: ' + type);
    }

    function CardDrop(refData) {
        // ['card name', cardlvl]
        this.name = refData[0];
        this.level = refData[1];
    }

    CardDrop.prototype.make = function() {
        var card = new inventory.CardModel(this.name);
        var qp = Math.floor(Math.pow(2.5, this.level - 1));
        card.applyQp(qp);
        card.isNew = true;
        return card;
    };

    // Extra function for cards.  What is called if there already exists that card but it needs xp
    CardDrop.prototype.update = function(existingCard) {
        var qp = Math.floor(Math.pow(2.5, this.level - 1));
        if (existingCard.applyQp(qp) > 0) {
            this.storedMessage = 'Leveled Up: ' + utils.firstCap(this.name);
        } else {
            this.storedMessage = '+' + qp + ' ' + utils.firstCap(this.name) + ' QP';
        }
    };

    CardDrop.prototype.message = function() {
        if (this.storedMessage) {
            return this.storedMessage;
        } else {
            return 'New Card: ' + utils.firstCap(this.name);
        }
    };

    function ItemDrop(refData) {
        this.itemType = refData[0];
        this.name = refData[1];
    }

    ItemDrop.prototype.make = function() {
        var item;
        if (this.itemType === 'weapon') {
            item = new inventory.WeaponModel(this.name);
        }
        if (this.itemType === 'armor') {
            item = new inventory.ArmorModel(this.name);
        }
        item.isNew = true;
        return item;
    };

    ItemDrop.prototype.message = function() {
        return 'New Item: ' + utils.firstCap(this.name);
    };

    function SkillDrop(refData) {
        // 'skillname'
        this.name = refData;
    }

    SkillDrop.prototype.make = function() {
        var skill = new inventory.SkillModel(this.name);
        skill.isNew = true;
        return skill;
    };

    SkillDrop.prototype.message = function() {
        return 'New Skill: ' + utils.firstCap(this.name);
    };

    exports.extend({
        dropFactory: dropFactory
    });

});
