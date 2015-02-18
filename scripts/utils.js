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

    function pctCloser(start, end, pct) {
        var res = [
            Math.round(start[0] + (end[0] - start[0]) * pct),
            Math.round(start[1] + (end[1] - start[1]) * pct),
        ];
        return res;
    }

    function sum(a, b) {
        return [a[0] + b[0], a[1] + b[1]];
    }

    function sub(a, b) {
        return [a[0] - b[0], a[1] - b[1]];
    }

    function hit(start, end, target, trad, prad) {
        var rad = trad + prad;
        var pvect = sub(end, start);
        var tvect = sub(target, start);

        //console.log('from', start, 'to', end);
        //console.log('hitting target', target, 'with combined radius of', rad);

        var pangle = Math.atan(pvect[1] / pvect[0]);
        var tangle = Math.atan(tvect[1] / tvect[0]);

        var adiff = Math.abs(tangle - pangle);
        var psdist = Math.hypot(start[0] - target[0], start[1] - target[1]);//dist(start, target);
        //var psdist = dist(start, target);

        //console.log('angle diff', adiff, 'pstart to target dist', psdist);

        var closest = Math.sin(adiff) * psdist;

        if (closest < rad) {
            //console.log('closest is', closest, 'hit!');
            return true;
        } else {
            //console.log('closest is', closest, 'miss.');
            return false;
        }
    }

    function velocity(start, end, speed) {
        var s = sub(end, start);
        var fact = speed / dist(end, start);
        return [s[0] * fact, s[1] * fact];
    }

    function meleeVelocity(start, end, dt) {
        var s = sub(end, start);
        return [s[0] / dt, s[1] / dt];
    }

    exports.extend({
        getDistances: getDistances,
        dist: dist,
        equal: equal,
        closer: closer,
        pctCloser: pctCloser,
        sum: sum,
        sub: sub,
        hit: hit,
        velocity: velocity,
        meleeVelocity: meleeVelocity
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
                comp[a[j]] = {added: 0, more: 1, converted: {}, gainedas: {}};
            }
        }
        return comp;
    }

    // [primary] [verb] [amt] [special]   Note: special is either perLevel or dmgType in case of converted and gainedas
    // mod restrictions:
    // can only have 4, cannot have a converted or gainedas as perlevel
    function addMod(dict, def) { //str, level) {
        if(def === undefined) {
            log.error('addMod called with undefined def');
        }
        var s = def.split(' ');
        var amt = parseInt(s[2], 10);
        if (s[1] === 'added') {
            dict[s[0]]['added'] += amt;
        } else if (s[1] === 'more') {
            dict[s[0]]['more'] *= 1 + (amt / 100);
        } else if (s[1] === 'gainedas' || s[1] === 'converted') {
            if (dict[s[0]][s[1]][s[3]]) {
                dict[s[0]][s[1]][s[3]] += amt;
            } else {
                dict[s[0]][s[1]][s[3]] = amt;
            }
        } else {
            console.log('addMod about to barf with state ', dict, def);
            throw('shit');
        }
    }

    function applyPerLevel(mod, level) {
        var s = mod.def.split(' ');
        if (s.length === 4 && s[3] === 'perLevel') {
            s[2] = parseInt(s[2], 10) * level;
            s.pop();
            return {def: s.join(' '), type: mod.type};
        } else {
            return mod;
        }
    }

    function applyPerLevels(mods, levels) {
        var ret = [];
        if (typeof(levels) === 'number') {
            for (var i = 0; i < mods.length; i++) {
                ret.push(applyPerLevel(mods[i], levels));
            }
        } else {
            for (var i = 0; i < mods.length; i++) {
                ret.push(applyPerLevel(mods[i], levels[i]));
            }
        }
        return ret;
    }

    function prettifyMods(mods, level) {
        var res = [];
        _.each(mods, function(mod, i) {
            res[i] = applyPerLevel(mod, level);
        });
        
        var flatModDefs = flattenSameMods(res);
        res = [];

        _.each(flatModDefs, function(flatmod) {
            var finalmod = "";
            var spl = flatmod.split(' ');
            if(spl.length == 3) {
                if(spl[1] == "added") {
                    if(spl[2] >= 0) {
                        finalmod = "+" + spl[2] + " " + namespace.bot.itemref.ref.statnames[spl[0]];
                    } else {
                        finalmod = spl[2] + " " + namespace.bot.itemref.ref.statnames[spl[0]];
                    }
                } else if(spl[1] == "more") {
                    if(spl[2] >= 0) {
                        finalmod = spl[2] + "% More " + namespace.bot.itemref.ref.statnames[spl[0]];
                    } else {
                        finalmod = Math.abs(spl[2]) + "% Less " + namespace.bot.itemref.ref.statnames[spl[0]];
                    }
                }
            } else {
                finalmod = flatmod.def + " unimplemented";
            }
            res.push(finalmod);
        });
        return res;
    }

    function flattenSameMods(mods) {
        var fin = [];
        _.each(mods, function(mod) {
            var spl = mod.def.split(' ');
            var found = false;
            if (spl.length == 4) {
                fin.push(mod.def);
            } else if (spl.length == 3){
                found = false;
                for(var i = 0; i < fin.length; i++) {
                    var fspl = fin[i].split(' ');
                    if(fspl.length == 3 && fspl[0] == spl[0] && fspl[1] == spl[1]) {
                        if(fspl[1] == "added") {
                            fin[i] = fspl[0] + " " + fspl[1] + " " + (parseInt(fspl[2]) + parseInt(spl[2]));
                        } else if (fspl[1] == "more") {
                            var prod = ((1 +(parseInt(fspl[2])*0.01)) * (1 +(parseInt(spl[2])*0.01)) - 1) * 100;
                            console.log(mod.def, spl[2], fspl[2], prod);
                            fin[i] = fspl[0] + " " + fspl[1] + " " + (prod);
                        }
                        found = true;
                    }
                }
                if (! found) {
                    fin.push(mod.def);
                }
            } else {
                throw('weird mods in utils.flattenSameMods');
            }
        });
        return fin;
    }
    
    function computeStat(section, stat) {
        var stat, obj, res;

        obj = section[stat];
        convPct = 100;

        var res = obj.added * obj.more;
        _.each(obj.converted, function(value, key) {
            convAmt = obj.converted[key];
            if (convAmt > convPct) {
                convAmt = convPct;
            }
            section[key].added += convAmt / 100 * res;
            convPct -= convAmt;
        });

        res *= (convPct / 100);
        
        _.each(obj.gainedas, function(value, key) {
            gainedAmt = obj.gainedas[key];
            section[key].added += gainedAmt / 100 * res;
        });

        return res;
    }

    function firstCap(str) {
        var words = str.split(' ');
        _.each(words, function(word, i) {
            words[i] = word[0].toUpperCase() + word.slice(1);
        });
        return words.join(" ");
    }

    /*
    // this should also work for the mod object on an item (same fmt)
    function addModStats(all, mod) {
        var i, mod;
        for (var i = 0; i < card.mods.length; i++) {
            mod = card.mods[i];
            addMod(all[mod.type], mod.def, card.level);
        }
    }*/

    function addAllMods(all, mods) {
        for (var i = 0; i < mods.length; i++) {
            //addMod(all, mods[i]);
            if(mods[i].def == undefined) {
                log.error('wtf', mods[i].def);
            }               
            addMod(all[mods[i].type], mods[i].def);
        }
    }

    function applyAttackMods(dmg, mods) {
        var adk = namespace.bot.entity.actualDmgKeys;
        var result = {};
        var i;
        for (i = adk.length; i--;) {
            result[adk[i]] = dmg[adk[i]];
        }
        for (i = mods.length; i--;) {
            var split = mods[i].split(' ');
            result[split[0]] *= (parseInt(split[2], 10) + 100) / 100;
        }
        return result;
    }

    // rename this to getItemMods
    function expandSourceItem(itemType, type, itemLevel, classLevel) {
        itemLevel = parseInt(itemLevel);  //ensure itemLevel is num not string
        var ref = itemref.ref[itemType][type];
        var mods = ref.getClassMods(classLevel).concat(ref.mods);
        return applyPerLevels(mods, itemLevel);
    }

    // turns shorthand from monster definitions into usable cards
    // [['hot sword', 1], ['hard head', 1]] => [{mods: [(hot sword mods)], level: 1}, {mods: [(hard head mods)], level: 1}]
    function expandSourceCards(sourceCards) {
        return _.flatten(_.map(sourceCards, function(card) {
            return applyPerLevels(itemref.ref.card[card[0]].mods, card[1]);
        }, this));
    }

    exports.extend({
        applyPerLevel: applyPerLevel,
        applyPerLevels: applyPerLevels,
        expandSourceItem: expandSourceItem,
        expandSourceCards: expandSourceCards,
        newBaseStatsDict: newBaseStatsDict,
        prettifyMods: prettifyMods,
        //addAllCards: addAllCards,
        addAllMods: addAllMods,
        addMod: addMod,
        computeStat: computeStat,
        firstCap: firstCap,
        applyAttackMods: applyAttackMods
    });

});

namespace.module('bot.messages', function (exports, require) {

    var log = namespace.bot.log;

    var EXPIRES_IN = 10000;

    var Messages = gl.Model.extend({
        initialize: function() {
            this.messages = [];
        },

        send: function(text) {
            this.messages.push({text: text, expires: gl.time + EXPIRES_IN});
        },

        prune: function() {
            var i = 0, l = this.messages.length;
            while (i < l && this.messages[i].expires < gl.time) {
                i++;
            }
            this.messages.splice(0, i);
        }
    });

    exports.extend({
        Messages: Messages
    });
});
