namespace.module('bot.vector', function (exports, require) {

    var log = namespace.bot.log;

    function dist(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    }

    function getDistances(base, targets) {
        // log.error('vector, base: %s, targets: %s', JSON.stringify(base), JSON.stringify(targets));
        return _.map(targets, function(target) { return dist(base, target); });
    }

    exports.extend({
        getDistances: getDistances
    });
});


namespace.module('bot.utils', function (exports, require) {

    var log = namespace.bot.log;

    function applyAffixes(startVal, mods) {
        console.log("applyAffixes", startVal, mods);
        var mores, adds, splits, modtype, amt;
        mores = 1;
        adds = startVal;
        _.each(mods, function(mod) {
            splits = mod.split(' ');
            modtype = splits[0];
            amt = parseFloat(splits[1]);
            if (modtype === 'added') {
                adds += amt;
            } else if (modtype === 'more') {
                mores *= (1 + 0.01*amt);
            } else {
                log.error('Improperly formatted affix %s', mod);
                throw('up');
                console.log(mods, startVal, mores, adds);
            }
        });
        console.log("returning", adds*mores, adds, mores);
        return adds * mores;
    }

    function applyAllAffixes(t, stats, affixDict) {
        stats = _.filter(stats, function(stat) { return stat in affixDict});
        _.each(stats, function(stat) { t[stat] = applyAffixes(t[stat], affixDict[stat]); });
    }

    function affixesToAffDict (affixes) {
        var affixDict = {};
        for (var i = 0; i < affixes.length; i++) {
            var affix = affixes[i].split(' ');
            var stat = affix[0];
            var mod = affix.slice(1).join(' ');
            if (affixDict[stat]) {
                affixDict[stat].push(mod);
            } else {
                affixDict[stat] = [mod];
            }
        }
        return affixDict;
    }

    exports.extend({
        applyAllAffixes: applyAllAffixes,
        affixesToAffDict: affixesToAffDict
    });

});
