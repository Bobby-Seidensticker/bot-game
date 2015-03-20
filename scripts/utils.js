namespace.module('bot.vectorutils', function (exports, require) {
    var PI = Math.PI;
    var TAU = Math.PI * 2;

    function PointFromEvent(event) {
        return new Point(event.pageX, event.pageY);
    }

    function Point(x, y) {
        this.x = x;
        this.y = y;
        if (isNaN(this.x)) {
            throw('shoot');
        }
    }

    Point.prototype.clone = function() {
        return new Point(this.x, this.y);
    }

    Point.prototype.add = function(p) {
        return new Point(this.x + p.x, this.y + p.y);
    }

    Point.prototype.abs = function() {
        return new Point(Math.abs(this.x), Math.abs(this.y));
    }

    Point.prototype.dadd = function(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    }

    Point.prototype.sub = function(p) {
        return new Point(this.x - p.x, this.y - p.y);
    }

    Point.prototype.dsub = function(p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    }

    Point.prototype.flip = function() {
        return new Point(this.y, this.x);
    }

    Point.prototype.mult = function(scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    }

    Point.prototype.dmult = function(scalar) {
        this.x = this.x * scalar;
        this.y = this.y * scalar;
        return this;
    }

    Point.prototype.dist = function(p) {
        return Math.sqrt(this.dist2(p));
    }

    Point.prototype.dist2 = function(p) {
        var x = this.x - p.x;
        var y = this.y - p.y;
        return x * x + y * y;
    }

    Point.prototype.len = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    Point.prototype.len2 = function() {
        return this.x * this.x + this.y * this.y;
    }

    Point.prototype.within = function(p, radius) {
        return this.sub(p).len2() < (radius * radius);
    }

    Point.prototype.rawDist = function(p) {
        return Math.sqrt(Math.pow(this.x - p.x, 2) + Math.pow(this.y - p.y, 2));
    }

    Point.prototype.equal = function(p) {
        return this.x === p.x && this.y === p.y;
    }

    Point.prototype.angle = function() {
        return Math.atan2(this.y, this.x);
    }

    Point.prototype.closer = function(dest, speed, stop) {
        var diff = dest.sub(this);
        var distance = this.dist(dest);
        if (distance - speed < stop) {
            speed = distance - stop;
        }
        var ratio = 1 - (distance - speed) / distance;
        diff.dmult(ratio);
        return this.add(diff);
    }

    Point.prototype.pctCloser = function(dest, pct) {
        return this.add(dest.sub(this).mult(pct));
    }

    Point.prototype.toIso = function() {
        return new Point(this.x - this.y, (this.x + this.y) / 2);
    }

    Point.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ')';
    }

    Point.prototype.dot = function(v) {
        return this.x * v.x + this.y * v.y;
    }

    Point.prototype.unitVector = function() {
        var len = this.len();
        if (!len) {
            return this;
        } else {
            return this.mult(1 / len);
        }
    }

    Point.prototype.rotate = function(degrees) {
        var angle = degrees / 180 * Math.PI;
        var sn = Math.sin(angle);
        var cs = Math.cos(angle);

        return new Point(this.x * cs - this.y * sn, this.x * sn + this.y * cs);
    }

    Point.prototype.inBounds = function(size) {
        var p = this.clone();
        if (p.x < 0) {
            p.x = 0;
        }
        if (p.x > size.x) {
            p.x = size.x;
        }
        if (p.y < 0) {
            p.y = 0;
        }
        if (p.y > size.y) {
            p.y = size.y;
        }
        return p;
    }

    function hit(s, e, t, r1, r2) {
        var r = r1 + r2;
        var r2 = r * r;

        var st = t.sub(s);
        var et = t.sub(e);
        var se = e.sub(s);

        if (st.len2() < r2 || et.len2() < r2) {
            return true;
        }

        var sd = st.dot(se);
        var ed = et.dot(se);

        if (sd < 0 || ed > 0) {
            return false;
        }

        var closest = Math.sin(Math.acos(sd / (st.len() * se.len()))) * st.len();
        if (closest <= r) {
            return true;
        }
        return false;
    }

    function coneHit(start, diff, angle, tpos, trad) {
        var arcDist = diff.len();
        var tDist = tpos.sub(start).len();
        if (arcDist < tDist - trad || arcDist > tDist + trad) {
            // Too close or too far away
            return false;
        }

        var leftVector = diff.rotate(angle / 2);
        var leftPoint = start.add(leftVector);
        if (leftPoint.within(tpos, trad)) {
            return true;
        }

        var rightVector = diff.rotate(-angle / 2);
        var rightPoint = start.add(rightVector);
        if (rightPoint.within(tpos, trad)) {
            return true;
        }

        var tv = tpos.sub(start);
        var angleDiff = degrees(Math.abs(tv.angle() - diff.angle()));
        if (angleDiff > 180) {
            angleDiff = 360 - angleDiff;
        }
        if (angleDiff < angle / 2) {
            return true;
        }
        return false;
    }

    function degrees(x) {
        return x / Math.PI * 180;
    }

    function getDistances(p1, p2s) {
        return _.map(p2s, function(p2) { return p1.dist(p2); });
    }

    exports.extend({
        Point: Point,
        PointFromEvent: PointFromEvent,
        hit: hit,
        coneHit: coneHit,
        getDistances: getDistances
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
        if (def === undefined) {
            log.error('addMod called with undefined def');
        }
        var s = def.split(' ');
        var amt = parseFloat(s[2]);
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
            throw('shoot');
        }
    }

    function applyPerLevel(mod, level) {
        var s = mod.def.split(' ');
        if (s.length === 4 && s[3] === 'perLevel') {
            if (s[1] === 'more') {
                if (s[2] > 0) {
                    s[2] = s[2] * level;
                } else {
                    s[2] = Math.pow(1 + parseFloat(s[2]) / 100, level) * 100 - 100;
                }
            } else {
                s[2] = parseFloat(s[2]) * level;
            }
            s.pop();
            return {def: s.join(' '), type: mod.type};
        } else {
            return mod;
        }
    }

    function applyPerLevels(mods, level) {
        var ret = [];
        for (var i = mods.length; i--;) {
            ret.push(applyPerLevel(mods[i], level));
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
            var finalmod = '';
            var spl = flatmod.split(' ');
            var val = parseFloat(spl[2]);                
            if (spl.length === 3) {
                if (spl[1] === 'added') {
                    if (spl[2] >= 0) {
                        finalmod = '+' + val + ' ' + namespace.bot.itemref.ref.statnames[spl[0]];
                    } else {
                        finalmod = val + ' ' + namespace.bot.itemref.ref.statnames[spl[0]];
                    }
                } else if (spl[1] === 'more') {
                    if (spl[2] >= 0) {
                        finalmod = val + '% More ' + namespace.bot.itemref.ref.statnames[spl[0]];
                    } else {
                        finalmod = Math.abs(val) + '% Less ' + namespace.bot.itemref.ref.statnames[spl[0]];
                    }
                }
            } else {
                if (spl[1] === 'gainedas') {
                    finalmod = val + '% of ' + namespace.bot.itemref.ref.statnames[spl[0]] +
                        ' Gained As ' + namespace.bot.itemref.ref.statnames[spl[3]];
                } else if (spl[1] === 'converted') {
                    finalmod = val + '% of ' + namespace.bot.itemref.ref.statnames[spl[0]] +
                        ' Converted To ' + namespace.bot.itemref.ref.statnames[spl[3]];
                } else {
                    log.error('infobox display not configured for : ' + flatmod);
                    finalmod = flatmod + ' unimplemented';
                }
            }
            res.push(finalmod);
        });
        return res;
    }

    function prettifyPerLvlMods(mods) {
        mods = _.filter(mods, function(mod) {
            var spl = mod.def.split(' ');
            return spl[spl.length - 1] === 'perLevel';
        });
        return prettifyMods(mods, 1);
    }

    function flattenSameMods(mods) {
        var fin = [];
        var lookup = {};

        _.each(mods, function(mod) {
            var spl = mod.def.split(' ');
            if (spl.length === 4) {
                fin.push(mod.def);
            } else if (spl.length === 3) {
                var stat = spl[0];
                var type = spl[1];
                if (lookup[type] === undefined) {
                    lookup[type] = {};
                }
                if (lookup[type][stat] === undefined) {
                    lookup[type][stat] = [];
                }
                lookup[type][stat].push(parseFloat(spl[2]));
            } else {
                throw('weird mods in utils.flattenSameMods');
            }
        });
        _.each(['added', 'more', 'converted', 'gainedas'], function(typeKey) {
            var typeObj = lookup[typeKey];
            _.each(typeObj, function(statArr, statKey) {
                var total;
                if (typeKey === 'more') {
                    total = 1;
                    for (var i = statArr.length; i--;) {
                        total *= statArr[i] / 100 + 1;
                    }
                    total = (total - 1) * 100;
                    fin.push(statKey + ' ' + typeKey + ' ' + total.toFixed(2));
                } else {
                    total = 0;
                    for (var i = statArr.length; i--;) {
                        total += statArr[i];
                    }
                    fin.push(statKey + ' ' + typeKey + ' ' + total);
                }
            });
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
        if (str === undefined) {
            log.error('utils.firstCap called with undefined string');
            return;
        }
        var words = str.split(' ');
        _.each(words, function(word, i) {
            words[i] = word[0].toUpperCase() + word.slice(1);
        });
        return words.join(' ');
    }

    var presentableSlotDict = {
        'weapon': 'Weapon',
        'head': 'Head',
        'chest': 'Chest',
        'hands': 'Hand',
        'legs': 'Leg',
        'skill': 'Skill'
    }

    function presentableSlot(slotStr) {
        var res = presentableSlotDict[slotStr];
        if (!res) { res = slotStr; }
        return res;
    }

    function spaceToUnderscore(str) {
        var arr = str.split(' ');
        return arr.join('_');
    }
    
    function addAllMods(all, mods) {
        for (var i = 0; i < mods.length; i++) {
            if (mods[i].def === undefined) {
                log.error('wtf', mods[i].def);
            }               
            addMod(all[mods[i].type], mods[i].def);
        }
    }

    // turns shorthand from monster definitions into usable cards
    // [['hot sword', 1], ['hard head', 1]] => [{mods: [(hot sword mods)], level: 1}, {mods: [(hard head mods)], level: 1}]
    function expandSourceCards(sourceCards, level) {
        return _.flatten(_.map(sourceCards, function(card) {
            if (card[0] === undefined) {
                throw('crap! did you forget a comma after card line in itemref?');
            }
            return applyPerLevels(itemref.ref.card[card[0]].mods, card[1] + level);
        }, this));
    }

    exports.extend({
        applyPerLevel: applyPerLevel,
        applyPerLevels: applyPerLevels,
        expandSourceCards: expandSourceCards,
        newBaseStatsDict: newBaseStatsDict,
        prettifyMods: prettifyMods,
        prettifyPerLvlMods: prettifyPerLvlMods,        
        addAllMods: addAllMods,
        addMod: addMod,
        computeStat: computeStat,
        firstCap: firstCap,
        spaceToUnderscore: spaceToUnderscore,
        presentableSlot: presentableSlot
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
