namespace.module('prob', function (exports, require) {
    exports.extend({
        'rand': rand,
        'binProb': binProb,
        'pProb': pProb,
        'test': test
    });

    var fact;


    // returns a random integer >= min and < max
    function rand(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }


    // Binary probability, returns true or false based off a p
    // p >= 1 always returns 1
    // p = 0.01 returns 1 on average once per 100 tries, 0 other times
    function binProb(p) {
        if (Math.random() < p) {
            return 1;
        } else {
            return 0;
        }
    }


    // lambda is expected value of the function.  aka:
    //   If we ran this function a 1M times we would get around 1M * lambda
    // x (sometimes written as k) is the variable to test
    function pProb(lambda, limit) {
        var r = Math.random(); // num between 0 and 1
        var x = 0;
        var prob;
        if (!limit) {
            limit = 100;
        }
        /*
          Start with x = 0, get the probability that it will happen, subtract that probability from the random number
          If that makes it less than zero, return x, otherwise test x += 1
        */
        while (x < limit) {
            prob = (Math.pow(lambda, x) * Math.exp(-lambda)) / (fact[x]);
            // console.log('for lambda ' + lambda + ' and x ' + x + ' prob = ' + prob);
            r -= prob;
            if (r < 0) {
                return x;
            }
            x++;
        }
        return x;
    }

    // memo or cache count factorials
    function memoFact(count) {
        var arr = [1, 1];
        for (var i = 1; i < count; i++) {
            arr[i + 1] = arr[i] * (i + 1);
        }
        return arr;
    }

    function test() {
        var fact = memoFact(200);

        // test it

        var start = new Date().getTime();

        var hist = [];
        for (var i = 0; i < 100; i++) {
            hist[i] = 0;
        }
        for (var i = 0; i < 100; i++) {
            var prob = pProb(1, 100);
            console.log(prob + ' monsters in room ' + i);
            hist[prob]++;
        }

        console.log('100 cycles took ' + (new Date().getTime() - start) + 'ms');
        console.log(hist);

        for (var i = 0; i < 20; i++) {
            s = '';
            var count = hist[i];
            for (var j = 0; j < count; j++) {
                s += 'x';
            }
            console.log(s);
        }
    }

    fact = memoFact(200);
});


namespace.module('botOfExile.main', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    prob = namespace.prob;

    exports.extend({
        'onReady': onReady
    });

    var factorialMemo;
    var You;

    // constants should be namespace and moved to another file
    var WEAPON_BASE = 2;
    var WEAPON_MULT = 1.2;
    var ARMOR_BASE = 10;
    var ARMOR_MULT = 1.2;

    function onReady() {
        You = new Hero('bobbeh');
    }

    // run through a level, takes a hero and a level
    function Run(Hero, Level) {
        this.Hero = Hero;
        this.Level = Level;
    }

/*    Run.prototype.execute = function() {

    };*/

    function Hero(name) {
        this.name = name;
        this.str = 20;
        this.vit = 20;
        this.weapon = new Weapon(1);
        this.armor = new Armor(1);

        this.initStats = function() {
            this.hpMax = this.vit * 5;
            this.hp = this.hpMax;
            this.dmgMod = this.str / 3;
        }
        this.initStats();
    }

    function Item(type, level) {
        this.level = level;
        this.type = type;
    }

    function Weapon(level) {
        Item.call(this, 'weapon', level);
        this.atkMin = WEAPON_BASE * Math.pow(WEAPON_MULT, level);
        this.atkMax = this.atkMin * 2;
    }

    Weapon.subclass(Item);

    function Armor(level) {
        Item.call(this, 'armor', level);
        this.armor = ARMOR_BASE * Math.pow(ARMOR_MULT, level);
    }

    Armor.subclass(Item);

    function Level(type, level, len) {
        var types = {'forest': 1, 'desert': 0.6};
        this.len = len;
        this.type = type;
        this.level = level;
        this.monster_count = types[type];
        this.mlocs = [];  // monster locations

        for (var i = 0; i < this.len; i++) {
            this.mlocs[i] = prob.pProb(types[this.level]);  // monster locations
        }

        console.log("Level, mlocs: " + this.mlocs);
    }

});