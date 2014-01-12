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
    var ITEM_TYPES = ['weapon', 'armor'];

    var SPEED_TESTING = false;

    var currentInstance;
    var you;

    function onReady() {
        you = new Hero('Bobbeh');

        tick();
        tickInterval = setInterval(tick, 2000);

        console.log("end onready");
        // request animation frame takes a function and calls it up to 60 times per second if there are cpu resources available
        // it scales back automatically
        //requestAnimationFrame(main);
    }

    function tick() {
        if (currentInstance === undefined || currentInstance.complete) {
            you.initStats();
            var mapLevel = you.level - 5 >= 1 ? you.level - 5 : 1;
            var mapRooms = 50;
            currentInstance = new Instance(you, new Map('forest', mapLevel, mapRooms));
        }
    }

    /*    // main loop, requestAnimationFrame automatically gives the first argument
    function main(msSinceLastCall) {
        requestAnimationFrame(main);
    }*/

    // run through a map, takes a hero and a map
    function Instance(hero, map) {
        console.log("instance constructor start");
        this.hero = hero;
        this.map = map;
        this.roomIndex = 0;
        this.complete = false;

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
        var room = this.map.rooms[this.roomIndex];
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
        this.dumbRender(monsters);

        // if hero is due to attack, do it
        if (monsters.length > 0 && (this.hero.na < now || SPEED_TESTING)) {
            this.doAttack(this.hero, monsters[0]);
            if (!monsters[0].isAlive()) {
                console.log(this.hero.name + " killed " + monsters[0].name + "!");
                this.hero.gainXp(50);
                this.hero.equip(monsters[0].getDrop());

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
        if (this.roomIndex < this.map.rooms.length && this.hero.isAlive()) {
            requestAnimationFrame(this.run.bind(this));
        } else {
            this.complete = true;
        }
    }

    Instance.prototype.doAttack = function(attacker, target) {
        //var roll = attacker.rollDamage();
        //var cr = target.armor.getConstReduction();
        //var dmg = roll - cr;
        //dmg = dmg > 0 ? dmg : 0;
        //console.log("Do Attack, initial damage: " + roll + ", const reduction: " + cr + ", actual: " + dmg);

        var dmg = attacker.rollDamage() - target.armor.getConstReduction();
        dmg = dmg > 0 ? dmg : 0;
        target.hp -= dmg;
        attacker.na += attacker.mspa;
        //console.log(attacker.name + ' hit ' + target.name + ' for ' + dmg + ' damage!');
    }

    Instance.prototype.dumbRender = function(monsters) {
        //$('#room').html("Room #: " + this.roomIndex);
        $('#room').html(sprintf("Room #: %d", this.roomIndex));
        $('#hero').html(sprintf("%s <br>Lvl: %d <br>XP: %d <br>HP: %d/%d<br>Weapon Lvl: %d <br>Armor Lvl: %d", this.hero.name, this.hero.level, this.hero.xp, this.hero.hp, this.hero.hpMax, this.hero.weapon.level, this.hero.armor.level));
        var tempstr = "<br><br>";
        for(var i in monsters) {
            tempstr += monsters[i].name + "'s HP:" + monsters[i].hp + "<br>";
        }
        $('#mobs').html(tempstr);
    }

    function Actor(type, name, hpMax, mspa, dmgMin, dmgMax, level) {
        this.type = type;
        this.name = name;
        this.hpMax = hpMax;
        this.hp = this.hpMax;
        this.la = new Date().getTime();
        this.na = this.la + this.mspa;  // next attack
        this.mspa = mspa;               // sec per attack
        this.dmgMin = dmgMin;
        this.dmgMax = dmgMax;
        this.level = level;
    }

    Actor.prototype.isAlive = function() {
        return this.hp > 0;
    }

    Actor.prototype.rollDamage = function() {
        return prob.rand(this.dmgMin, this.dmgMax);
    }

    Actor.prototype.equip = function(itemsDropped) {
        var item;
        for (var i = 0; i < itemsDropped.length; i++) {
            item = itemsDropped[i];
            if (ITEM_TYPES.indexOf(item.type) == -1) {
                throw "WTF item not weapon or armor";
            }
            if (item.type == 'weapon' && item.level > this.weapon.level) {
                console.log("Upgraded Hero's level " + this.weapon.level + " weapon to level " + item.level);
                this.weapon = item;
            } else if (item.type == 'armor' && item.level > this.armor.level) {
                console.log("Upgraded Hero's level " + this.armor.level + " armor to level " + item.level);
                this.armor = item;
            }
        }
    }

    function Hero(name, weapon, armor) {
        this.str = 20;
        this.vit = 20;
        this.xp = 0;

        this.weapon = weapon ? weapon : new Weapon(1);
        this.armor = armor ? armor : new Armor(1);

        this.dmgMod = this.str / 3;

        var hpMax = this.vit * 5;
        var mspa = 800;
        var dmgMin = this.weapon.dmgMin * this.dmgMod;
        var dmgMax = this.weapon.dmgMax * this.dmgMod;
        var level = 1;

        Actor.call(this, 'hero', name, hpMax, mspa, dmgMin, dmgMax, level);
    }

    Hero.subclass(Actor);

    Hero.prototype.gainXp = function(xp) {
        this.xp += xp;
        //var lvlUpXP = parseInt(100/1.2 * Math.pow(1.2, this.level));

        //while (this.handleLeveling());
        while (this.isNextLevel()) {
            this.xp -= this.lvlUpXP;
            this.levelUp();
        }
    }

    // factor out side effect of modifying this.levelUpXP
    Hero.prototype.isNextLevel = function() {
        this.lvlUpXP = parseInt(100 * Math.pow(1.2, this.level - 1));
        console.log(this.xp + "/" + this.lvlUpXP);

        if (this.xp >= this.lvlUpXP) {
            return true;
        }
        return false;
    }

    Hero.prototype.initStats = function(level) {
        this.str = 20 + this.level * 2;
        this.vit = 20 + this.level * 2;
        this.dmgMod = this.str / 3;
        this.hpMax = this.vit * 5;
        this.hp = this.hpMax;
    }

    Hero.prototype.levelUp = function() {
        this.level++;
        this.initStats();
    }

    function Monster(name, level) {
        this.str = 10 + level * 2;
        this.vit = 10 * level * 2;

        //this.weapon = weapon ? weapon : new Weapon(level);
        //this.armor = armor ? armor : new Armor(level);
        this.weapon = new Weapon(level);
        this.armor = new Armor(level);

        this.dmgMod = this.str / 3;

        //this.dropChance = 1 / 10;
        this.dropChance = 1;

        var hpMax = this.vit * 3;
        var mspa = 1100;
        var dmgMin = this.weapon.dmgMin * this.dmgMod;
        var dmgMax = this.weapon.dmgMax * this.dmgMod;

        name = name ? name : 'fwah!';

        Actor.call(this, 'monster', name, hpMax, mspa, dmgMin, dmgMax, level);
    }

    Monster.subclass(Actor);

    Monster.prototype.getDrop = function() {
        var items = [];
        // roll for if monster dropped
        if (prob.binProb(this.dropChance)) {
            var itemLevel = this.level - 1 + prob.pProb(2);
            itemLevel = itemLevel > 0 ? itemLevel : 1;
            // roll for armor or weapon
            if (prob.binProb(0.5)) {
                console.log("dropping level " + itemLevel +  " weapon");
                items.push(new Weapon(itemLevel));
            } else {
                console.log("dropping level " + itemLevel +  " armor");
                items.push(new Armor(itemLevel));
            }
        }
        return items;
    }

    function Item(type, level) {
        this.level = level;
        this.type = type;
    }

    function Weapon(level) {
        Item.call(this, 'weapon', level);
        this.dmgMin = WEAPON_BASE * Math.pow(WEAPON_MULT, level - 1);
        this.dmgMax = this.dmgMin * 2;
    }

    Weapon.subclass(Item);

    function Armor(level) {
        Item.call(this, 'armor', level);
        this.armor = ARMOR_BASE * Math.pow(ARMOR_MULT, level - 1);
    }

    Armor.subclass(Item);

    Armor.prototype.getConstReduction = function () {
        return this.armor;
    }

    // currently unused, make a nice little function for this
    Armor.prototype.getPercentReduction = function() {
        return 1;
    }

    function Map(type, level, len) {
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

    Map.prototype.getMonsterName = function(names) {
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