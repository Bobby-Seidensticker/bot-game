namespace.module('botOfExile.main', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    prob = namespace.prob;

    exports.extend({
        'onReady': onReady
    });

    // constants should be namespace and moved to another file
    var WEAPON_BASE = 2;
    var WEAPON_MULT = 1.2;
    var ARMOR_BASE = 10;
    var ARMOR_MULT = 1.2;

    function onReady() {
        you = new Hero('Bobbeh');
        var levelLevel = 1;
        var levelRooms = 5;
        var l = new Level('forest', levelLevel, levelRooms);
        var i = new Instance(you, l);

        console.log("end onready");
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
        console.log("instance constructor start");
        this.hero = hero;
        this.level = level;
        this.roomIndex = 0;

        this.init()
        
        requestAnimationFrame(this.run.bind(this));

        console.log("instance constructor end");
    }

    Instance.prototype.init = function() {
        var now = new Date().getTime();
        this.hero.la = now - this.mspa;
        this.na = now;
        this.roomIndex = 0;
    }

    Instance.prototype.run = function() {
        var now = new Date().getTime();
        var room = this.level.rooms[this.roomIndex];
        var monsters = room.monsters;
        var mon;

        // initialize room if necessary
        if (!room.initialized) {
            console.log("Hero entered room " + this.roomIndex);
            console.log(monsters.length + " monsters in the room!");
            room.init(now);
            // hero always attacks immediately after getting in the room, monsters start at cooldown
            this.hero.na = now;
        }

        // if hero is due to attack, do it
        if (this.hero.na < now) {
            this.doAttack(this.hero, monsters[0]);
            if (!monsters[0].isAlive()) {
                console.log(this.hero.name + " killed " + monsters[0].name + "!");
                monsters.splice(0, 1);
            }
        }
        // if any monsters are due to attack, do it
        for (var i = 0; i < monsters.length; i++) {
            mon = monsters[i];
            if (mon.na < now) {
                this.doAttack(mon, this.hero);
                if (!this.hero.isAlive()) {
                    console.log(mon.name + " killed hero " + this.hero.name + "!");
                    console.log("IT'S OVER!");
                    break;
                }
            }
        }

        // advance if necessary
        if (monsters.length == 0) {
            console.log("Cleared room " + this.roomIndex);
            this.roomIndex++;
        }

        // queue up next tick
        if (this.roomIndex < this.level.rooms.length && this.hero.isAlive()) {
            requestAnimationFrame(this.run.bind(this));
        }
    }

    Instance.prototype.doAttack = function(attacker, target) {
        var dmg = attacker.rollDamage();
        target.hp -= dmg;
        attacker.na += attacker.mspa;
        console.log(attacker.name + ' hit ' + target.name + ' for ' + dmg + ' damage!');
    }

    function Actor(type, name, hpMax, mspa, dmgMin, dmgMax) {
        this.type = type;
        this.name = name;
        this.hpMax = hpMax;
        this.hp = this.hpMax;
        this.la = new Date().getTime();
        this.na = this.la + this.mspa;  // next attack
        this.mspa = mspa;               // sec per attack
        this.dmgMin = dmgMin;
        this.dmgMax = dmgMax;
    }

    Actor.prototype.isAlive = function() {
        return this.hp > 0;
    }

    Actor.prototype.rollDamage = function() {
        return prob.rand(this.dmgMin, this.dmgMax);
    }

    function Hero(name, weapon, armor) {
        this.str = 20;
        this.vit = 20;

        this.weapon = weapon ? weapon : new Weapon(1);
        this.armor = armor ? armor : new Armor(1);

        this.dmgMod = this.str / 3;

        var hpMax = this.vit * 5;
        var mspa = 800;
        var dmgMin = this.weapon.dmgMin * this.dmgMod;
        var dmgMax = this.weapon.dmgMax * this.dmgMod;

        Actor.call(this, 'hero', name, hpMax, mspa, dmgMin, dmgMax);
    }

    Hero.subclass(Actor);

    function Monster(name, level) {
        this.str = 10 + level * 2;
        this.vit = 10 * level * 2;

        //this.weapon = weapon ? weapon : new Weapon(level);
        //this.armor = armor ? armor : new Armor(level);
        this.weapon = new Weapon(level);
        this.armor = new Armor(level);

        this.dmgMod = this.str / 3;

        var hpMax = this.vit * 3;
        var mspa = 1000;
        var dmgMin = this.weapon.dmgMin * this.dmgMod;
        var dmgMax = this.weapon.dmgMax * this.dmgMod;

        name = name ? name : 'fwah!';

        Actor.call(this, 'monster', name, hpMax, mspa, dmgMin, dmgMax);
    }

    Monster.subclass(Actor);

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
        var monsterCount;
        var mons;

        var monsterNames;
        
        this.len = len;
        this.type = type;
        this.level = level;
        this.monster_count = types[type];
        this.rooms = [];

        //var monster = { 'hp': 5, 'dmgLow': 2, 'dmgHigh': 4, 'spa': 1 };

        for (var i = 0; i < this.len; i++) {
            monsterNames = ['Pogi', 'Doofus', 'Nerd', 'DURR', 'herp', 'derp', 'Nards', 'Kenny', 'Vic']
            monsterCount = prob.pProb(this.monster_count);
            mons = [];
            for (var j = 0; j < monsterCount; j++) {
                mons[j] = new Monster(this.getMonsterName(monsterNames), level);
            }
            this.rooms[i] = new Room(mons);
        }
    }

    Level.prototype.getMonsterName = function(names) {
        if (names.length == 0) {
            return;
        }
        var rand = prob.pyRand(0, names.length)
        var name = names[rand];
        names.splice(rand, 1);
        console.log("Naming monster " + name);
        return name;
    }

    function Room(monsters) {
        this.monsters = monsters;
        this.initialized = false;
    }

    Room.prototype.init = function (now) {
        if (!now) {
            throw "Room init requires time arg";
        }
        for (var i = 0; i < this.monsters.length; i++) {
            this.monsters[i].la = now;
            this.monsters[i].na = now + this.monsters[i].mspa;
        }
        this.initialized = true;
    }

});