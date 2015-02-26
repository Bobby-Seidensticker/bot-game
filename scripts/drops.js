namespace.module('bot.drops', function (exports, require) {

    var inventory;
    $(function() {
        inventory = namespace.bot.inv;
        itemref = namespace.bot.itemref
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
        throw('shit, drop factory called with invalid type argument: ' + type);
    }

    function CardDrop(refData) {
        // ['card name', cardlvl]
        this.name = refData[0];
        this.level = refData[1];
    }

    CardDrop.prototype.make = function() {
        var card = new inventory.CardModel(this.name);
        var qp = Math.pow(10, this.level - 1);
        card.applyQp(qp);
        return card;
    }

    // Extra function for cards.  What is called if there already exists that card but it needs xp
    CardDrop.prototype.update = function(existingCard) {
        var qp = Math.pow(10, this.level - 1);
        existingCard.applyQp(qp);
        this.storedMessage = qp + ' ' + this.name + ' qp';
    }

    CardDrop.prototype.message = function() {
        if (this.storedMessage) {
            return this.storedMessage;
        } else {
            return this.name + ' ' + this.level;
        }
    }

    function ItemDrop(refData) {
        // ['weapon|armor', 'type/slot', classLevel]
        this.itemType = refData[0];
        this.type = refData[1];
        this.classLevel = refData[2];
        this.name = itemref.ref[this.itemType][this.type].names[this.classLevel];
    }

    ItemDrop.prototype.make = function() {
        if (this.itemType === 'weapon') {
            return new inventory.WeaponModel(this.classLevel, this.type);
        }
        if (this.itemType === 'armor') {
            return new inventory.ArmorModel(this.classLevel, this.type);
        }
    }

    ItemDrop.prototype.message = function() {
        return this.name;
    }

    function SkillDrop(refData) {
        // 'skillname'
        this.name = refData;
    }

    SkillDrop.prototype.make = function() {
        return new inventory.SkillModel(this.name);
    }

    SkillDrop.prototype.message = function() {
        return this.name;
    }

    exports.extend({
        dropFactory: dropFactory
    });

});