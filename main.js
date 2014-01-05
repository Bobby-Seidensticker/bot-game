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
        var l = new Level('forest', 1, 1);
        var i = new Instance(You, l);
        i.run();

        console.log("done");
        // request animation frame takes a function and calls it up to 60 times per second if there are cpu resources available
        // it scales back automatically
        //requestAnimationFrame(main);
    }

    // main loop, requestAnimationFrame automatically gives the first argument
    function main(msSinceLastCall) {
        requestAnimationFrame(main);
    }

    // run through a level, takes a hero and a level
    function Instance(hero, level) {
        this.hero = hero;
        this.level = level;
    }

    Instance.prototype.run = function() {
        console.log("Running level:");
        console.log(this.level);
        console.log("With this hero:");
        console.log(this.hero);
        /*
        var 
        for (var i = 0; i < Level.mlocs.length; i++) {
            while (this.isAlive() && Level.mlocs[i].length) {
                
                this.la
            }
        }

          for room in level.rooms
          kill monsters in room

        console.log("Done running level " + Level);
         */

        console.log("Done running level, hero is " + (this.hero.isAlive ? "alive" : "dead"));
    }

    function Hero(name) {
        this.name = name;
        this.str = 20;
        this.vit = 20;
        this.spa = 0.8;      // sec per attack
        this.la = this.spa;  // last attack
        this.weapon = new Weapon(1);
        this.armor = new Armor(1);

        this.initStats = function() {
            this.hpMax = this.vit * 5;
            this.hp = this.hpMax;
            this.dmgMod = this.str / 3;
        }
        this.initStats();
    }

    Hero.prototype.isAlive = function() {
        return this.hp > 0;
    }

    function Item(type, level) {
        this.level = level;
        this.type = type;
    }

    function Weapon(level) {
        Item.call(this, 'weapon', level);
        this.dmgMin = WEAPON_BASE * Math.pow(WEAPON_MULT, level);
        this.dmgMax = this.dmgMin * 2;
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

        //var monster = { 'hp': 5, 'dmgLow': 2, 'dmgHigh': 4, 'spa': 1 };

        for (var i = 0; i < this.len; i++) {
            console.log("tick");
            var monsterCount = prob.pProb(this.monster_count);
            this.mlocs[i] = [];
            for (var j = 0; j < monsterCount; j++) {
                //this.mlocs[i][j] = monster;  // this does not make a new instance
                this.mlocs[i][j] = { 'hp': 5, 'dmgLow': 2, 'dmgHigh': 4, 'spa': 1 };
            }
        }

        //console.log("Level, mlocs: " + this.mlocs);
    }

});