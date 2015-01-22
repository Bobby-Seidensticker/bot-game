namespace.module('bot.vector', function (exports, require) {

    var log = namespace.bot.log;

    function dist(a, b) {
        return Math.round(Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)));
    }

    function getDistances(base, targets) {
        // log.error('vector, base: %s, targets: %s', JSON.stringify(base), JSON.stringify(targets));
        return _.map(targets, function(target) { return dist(base, target); });
    }

    // a and b must be array-like and they must be the same length
    function equal(a, b) {
        for (var i = a.length; i--;) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    function closer(cur, dest, rate, stopDist) {
        var diff = [dest[0] - cur[0], dest[1] - cur[1]];
        var distance = dist(cur, dest);
        if (distance - rate < stopDist) {
            rate = distance - stopDist;
        }
        var ratio = 1 - (distance - rate) / distance;
        return [Math.round(cur[0] + diff[0] * ratio), Math.round(cur[1] + diff[1] * ratio)];
    }

    exports.extend({
        getDistances: getDistances,
        dist: dist,
        equal: equal,
        closer: closer
    });
});


namespace.module('bot.utils', function (exports, require) {

    var log = namespace.bot.log;
    var itemref = namespace.bot.itemref;

    function newBaseStatsDict() {
        var a, i, j, l;
        var comp = {};
        for (i = 0; i < arguments.length; i++) {
            a = arguments[i];
            for (j = 0; j < a.length; j++) {
                comp[a[j]] = {"added": 0, "more": 1};
            }
        }
        return comp;
    }

    function newDmgStatsDict() {
        return {
            physDmg: {
                added: 0,
                more: 1,
                converted: {lightDmg: 0, coldDmg: 0, fireDmg: 0, poisDmg: 0},
                gainedas: {lightDmg: 0, coldDmg: 0, fireDmg: 0, poisDmg: 0}
            },
            lightDmg: {
                added: 0,
                more: 1,
                converted: {coldDmg: 0, fireDmg: 0, poisDmg: 0},
                gainedas: {coldDmg: 0, fireDmg: 0, poisDmg: 0}
            },
            coldDmg: {
                added: 0,
                more: 1,
                converted: {fireDmg: 0, poisDmg: 0},
                gainedas: {fireDmg: 0, poisDmg: 0}
            },
            fireDmg: {
                added: 0,
                more: 1,
                converted: {poisDmg: 0},
                gainedas: {poisDmg: 0}
            },
            poisDmg: {
                added: 0,
                more: 1,
                converted: {},
                gainedas: {}
            },
            range: {added: 0, more: 1},
            speed: {added: 0, more: 1}
        };
    }

    // [primary] [verb] [amt] [special]   Note: special is either perLevel or dmgType in case of converted and gainedas
    // mod restrictions:
    // can only have 4, cannot have a converted or gainedas as perlevel
    function addMod(dict, str, level) {
        var s = str.split(' ');
        var amt = parseInt(s[2], 10);
        if (s.length === 4 && s[3] === 'perLevel') {
            amt *= level;
        }
        if (s[1] === 'added') {
            dict[s[0]]['added'] += amt;
        } else if (s[1] === 'more') {
            dict[s[0]]['more'] *= 1 + (amt / 100);
        } else if (s[1] === 'converted') {
            dict[s[0]]['converted'][s[3]] += amt;  // TODO: converted and gainedas are the same
        } else if (s[1] === 'gainedas') {
            dict[s[0]]['gainedas'][s[3]] += amt;
        } else {
            throw('shit');
        }
    }

    // this should also work for the mod object on an item (same fmt)
    function addCardStats(all, card) {
        var i, mod;
        for (var i = 0; i < card.mods.length; i++) {
            mod = card.mods[i];
            addMod(all[mod.type], mod.def, card.level);
        }
    }

    function addAllCards(all, cards) {
        var group, card;
        for (var i = 0; i < cards.length; i++) {
            addCardStats(all, cards[i]);
        }
    }

    function expandSourceItem(itemType, type, itemLevel, classLevel) {
        var ref = itemref.ref[itemType][type];
        var mods = ref.getClassMods(classLevel);
        return {mods: mods.concat(ref.mods), level: itemLevel};
    }

    // turns shorthand from monster definitions into usable cards
    // [['hot sword', 1], ['hard head', 1]] => [{mods: [(hot sword mods)], level: 1}, {mods: [(hard head mods)], level: 1}]
    function expandSourceCards(sourceCards) {
        return _.map(sourceCards, function(card) {
            return {mods: itemref.ref.card[card[0]].mods, level: card[1]};
        });
    }

    exports.extend({
        expandSourceItem: expandSourceItem,
        expandSourceCards: expandSourceCards,
        newBaseStatsDict: newBaseStatsDict,
        newDmgStatsDict: newDmgStatsDict,
        addAllCards: addAllCards,
        addMod: addMod
    });

});

namespace.module('bot.messages', function (exports, require) {

    var log = namespace.bot.log;

    var MessageModel = Backbone.Model.extend({
        defaults: function() {
            return {
                expiresIn: 20000,
                message: ''
            };
        }
    });

    var MessageCollection = Backbone.Collection.extend({
        model: MessageModel,
        comparator: 'expires',

        initialize: function() {
            this.storedTime = 0;
        },

        update: function(dt) {
            this.storedTime += dt;
        },
        applyTime: function() {
            this.each(function(model) {
                model.set('expiresIn', model.get('expiresIn') - this.storedTime);
            });
        },

        prune: function() {
            var now = new Date().getTime();
            this.remove(this.filter(function(model) {
                return model.get('expires') < now;
            }));
            log.info('message collection prune, data: %s', JSON.stringify(this.pluck('message')));
            this.trigger('pruned');
        },

        send: function(message, expiresIn) {
            this.applyTime();
            var obj = {message: message, expiresIn: expiresIn};
            this.add(new MessageModel(obj));
            this.prune();
        }
    });

    /*
    function Messages() {
        this.msgs = new MessageCollection();
    }

    Messages.prototype.send = function(message, expiresIn) {
    }*/

    exports.extend({
        MessageCollection: MessageCollection
    });
});


var MessageModel = Backbone.Model.extend({
    initialize: function() {
        this.unloaded = 0;
    },

    update: function(dt) {
        this.unloaded += dt;
        if (condition) {
            this.prune();
        }
    },

    prune: function() {
        var now = new Date().getTime();
        this.remove(this.filter(function(model) { return model.get('expires') < now; }));
        log.info('message collection prune, data: %s', JSON.stringify(this.pluck('message')));
        this.trigger('pruned');
    },

    send: function(message, expiresIn) {
        var obj = {message: message};
        if (expiresIn !== undefined) {
            obj.expires = new Date().getTime() + expiresIn;
        }
        this.add(new MessageModel(obj));
        this.prune();
    }
});
