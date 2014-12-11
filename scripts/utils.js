namespace.module('bot.vector', function (exports, require) {

    var log = namespace.bot.log;

    function dist(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0]) + Math.pow(a[1] - b[1]));
    }

    function getDistances(base, targets) {
        return _.map(targets, function(target) { return dist(base, target); });
    }

});


namespace.module('bot.utils', function (exports, require) {

    var log = namespace.bot.log;

    function applyAffixes(startVal, mods) {
        var mores, adds, splits, modtype, amt;
        mores = 1;
        adds = startVal;
        _.each(mods, function(mod) {
	    splits = mod.split(' ');
	    modtype = splits[0];
            amt = parseFloat(splits[1]);
	    if (modtype === 'added') {
                adds += amt
	    } else if (modtype === 'more') {
                mores *= amt;
	    } else {
                log.error('Improperly formatted affix %s', mod);
            }
        });
        return adds * mores;
    }

    function applyAllAffixes(t, stats, affixDict) {
        stats = _.filter(stats, function(stat) { return stat in affixDict});
        _.each(stats, function(stat) { t[stat] = applyAffixes(t[stat], affixDict[stat]); });
    }

    exports.extend({
        applyAllAffixes: applyAllAffixes
    });

});

