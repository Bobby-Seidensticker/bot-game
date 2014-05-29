namespace.module('bot.main', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    prob = namespace.bot.prob;

    exports.extend({
        'onReady': onReady
    });

    // constants should be namespace and moved to another file
    var WEAPON_BASE = 2;
    var WEAPON_MULT = 1.2;
    var ARMOR_BASE = 10;
    var ARMOR_MULT = 1.2;
    var ITEM_TYPES = ['weapon', 'armor'];

    var LOG_ATTACKS = false;

    var TC = 1;  // time coefficient
    var FRAMERATE = 1000 / 60;

    var currentInstance;
    var you;



    //Box2d and bTest stuff
    var physCtx = document.getElementById("physCanvas").getContext("2d");
    physCtx.strokeStyle = 'black';
      physCtx.beginPath();
      physCtx.arc(50, 50, 10, 0, Math.PI * 2, true);
      physCtx.closePath();
      physCtx.fill();
      physCtx.stroke();

    var $autoRun = $('#auto-run');
    var $singleRun = $('#single-run');

    var actionDictionary = { 
                    "basicAttack":{ 
                                    "type":"attack",
                                    "range":60,
                                    "damageMult":1,
                                    "manaCost":0,
                                    "skillDuration":600,
                                    "targetRequired":true
                                    },
                    "heavyStrike":{ 
                                    "type":"attack",
                                    "range":150,
                                    "damageMult":1.5,
                                    "manaCost":20,
                                    "skillDuration":600,
                                    "targetRequired":true
                                    },
                    "approachTarget":{  "type":"movement",
                                        "targetRequired":true,
                                        "skillDuration":1
                                    },
                    "getNearestTarget":{   "type":"target",
                                        "targetRequired":false,
                                        "skillDuration":1
                                    }
                    }; 



    function onReady() {
        you = new Hero('Bobbeh');

        // When they click the button, try to start an instance
        $singleRun.click(tryStartInstance);

        // if state of the checkbox changes, try to start an instance if auto run is checked
        $autoRun.change(onTick);

        // once per second, try to start an instance if auto run is checked
        tickInterval = setInterval(onTick, 1000);

        console.log("end onready");
        // request animation frame takes a function and calls it up to 60 times per second if there are cpu resources available
        // it scales back automatically
        //requestAnimationFrame(main);
    }

    function onTick() {
        if ($autoRun[0].checked) {
            tryStartInstance();
        }
    }

    function tryStartInstance() {
        if (currentInstance === undefined || currentInstance.isComplete()) {
            startInstance();
        }
    }

    function startInstance() {
        you.initStats();
        var mapLevel = you.level - 5 >= 1 ? you.level - 5 : 1;
        var mapRooms = 50;
        currentInstance = new Instance(you, new Map('forest', mapLevel, mapRooms));        
    }

    /*    // main loop, requestAnimationFrame automatically gives the first argument
    function main(msSinceLastCall) {
        requestAnimationFrame(main);
    }*/

    // run through a map, takes a hero and a map
    function Instance(hero, map) {
        this.entities = [[],[]];  // 0  is hero and allied entities, 1 is enemies

        
        requestAnimationFrame(this.run.bind(this));

        console.log("instance constructor start");
        this.hero = hero;
        this.map = map;
        this.roomIndex = 0;
        this.complete = false;

        this.init();

        this.timeAccumulator = 0;

        console.log("instance constructor end");
    }

    Instance.prototype.init = function() {
        console.log("new instance");
        this.roomIndex = 0;
        this.startTime = new Date().getTime();
        this.previousTime = this.startTime;
        this.curTime = 0;

        this.damageIndicators = [];
        this.entities[0] = [this.hero];
        this.hero.dead = false;
        this.initRoom();
    };

    Instance.prototype.initRoom = function() {
        console.log(["New Room contains", this.entities[1]]);
        var room = this.map.rooms[this.roomIndex];
        this.entities[1] = room.monsters;
        this.hero.onEnterRoom(this.curTime);
        room.init(this.curTime);
        box2DInit(this);
    };


    Instance.prototype.tryFinishRoom = function() {
        while (this.entities[1].length === 0 && this.roomIndex < this.map.rooms.length) {
            this.roomIndex++;
            console.log("entering room " + this.roomIndex);
            if (this.roomIndex < this.map.rooms.length) {
                this.initRoom();
            }
        }
    };

    Instance.prototype.isComplete = function() {
        if (!this.hero.isAlive()) {
            console.log("hero dead");
            return true;
        }
        if (this.roomIndex >= this.map.rooms.length) {
            return true;
        }
        return false;
    };


    Instance.prototype.finishRoom = function() {

    };

    Instance.prototype.run = function() {
        var now = new Date().getTime();


        var dt = now - this.previousTime;  //each run, calcs the time delta, and uses that as argument in individual actor update functions
        //console.log(dt);
        this.previousTime = now;

        var killed = [];

        for( var i in this.entities ) {
            for ( var j in this.entities[i] ) {
                //console.log(this.entities);    
                if(this.entities[i][j] !== undefined){
                    if(i == 1 && this.entities[i][j].dead) {
                        //console.log("dead cleanup");
                        killed.push(this.entities[i][j].name);
                        this.entities[i].splice(j, 1);
                    } else {
                        this.entities[i][j].update(dt);
                    }
                }
            }
        }
        this.tryFinishRoom();
        //console.log(this.map.rooms[this.roomIndex].monsters);
        //console.log(this.entities[1]);
        removeDeadFromBox2D(killed);
        this.timeAccumulator += dt;
        if(this.timeAccumulator >= FRAMERATE){
            //this.timeAccumulator -= FRAMERATE;
            this.timeAccumulator = 0;
            //box.applyImpulse("Bobbeh", parseInt(0), parseInt(9999));

            box2DUpdate();
            this.updateEntityPositions();

            draw();

            this.dumbRender(this.entities[1]);    
        }



        if (this.isComplete()) {
            onTick();
        } else {
            requestAnimFrame(this.run.bind(this));
        }

    };

    Instance.prototype.doNextAttack = function() {
        // Find the next attacker

        var room = this.map.rooms[this.roomIndex];
        var monsters = room.monsters;

        var nextAttack = this.hero.na;
        var nextAttacker = this.hero;

        for (var i = 0; i < monsters.length; i++) {
            if (monsters[i].na < nextAttack) {
                nextAttack = monsters[i].na;
                nextAttacker = monsters[i];
            }
        }

        // advance time the minimum amount--the time of the next attacker's attack
        this.curTime = nextAttack;

        if (nextAttacker.type == 'hero') {
            this.doAttack(this.hero, monsters[0]);
            if (!monsters[0].isAlive()) {
                console.log(this.hero.name + " killed " + monsters[0].name + "!");
                this.hero.gainXp(monsters[0].xpOnKill());
                this.hero.equip(monsters[0].getDrop());
                monsters.splice(0, 1);
            }
        } else if (nextAttacker.type == 'monster') {
            mon = nextAttacker;
            this.doAttack(mon, this.hero);
            if (!this.hero.isAlive()) {
                console.log(mon.name + " killed hero " + this.hero.name + "!");
            }
        }
    };



    Instance.prototype.doAttack = function(attacker, target) {
        var dmg = attacker.rollDamage() - target.armor.getConstReduction();
        dmg = dmg > 0 ? dmg : 0;
        this.damageIndicators.push(new DamageIndicator(target, dmg));
        target.hp -= dmg;
        attacker.na += attacker.mspa;
        console.log(sprintf("%s hit %s for %d dmg!", attacker.name, target.name, dmg));
    };

    Instance.prototype.dumbRender = function(monsters) {
        //$('#room').html("Room #: " + this.roomIndex);
        //cvs = document.getElementById("myCanvas");
        //var oldctx=cvs.getContext("2d");
        //oldctx.clearRect(0,0,900,600);
        //oldctx.fillStyle="#0000FF"; //Hero color is blue
        //oldctx.fillRect(this.hero.x- this.hero.size/2, this.hero.y- this.hero.size/2,this.hero.size,this.hero.size);
        var temptarg = this.hero.target ? this.hero.target.name : "undefined";
        $('#room').html(sprintf("Room #: %d", this.roomIndex));
        $('#hero').html(sprintf("%s <br>Lvl: %d <br>XP: %d <br>HP: %d/%d<br>MP: %d/%d<br>Weapon Lvl: %d <br>Armor Lvl: %d<br>Target: %s",
                                this.hero.name, this.hero.level, this.hero.xp,
                                Math.ceil(this.hero.hp), this.hero.hpMax, Math.ceil(this.hero.mp), this.hero.mpMax, this.hero.weapon.level,
                                this.hero.armor.level, temptarg));
        var tempstr = "<br><br>";
        for (var i in monsters) {
            tempstr += sprintf("%s's HP: %d/%d<br>", monsters[i].name, monsters[i].hp, monsters[i].hpMax);
            //oldctx.fillStyle="#444444"; //Enemy color is dark grey
            //oldctx.fillRect(monsters[i].x-monsters[i].size/2,monsters[i].y - monsters[i].size/2,monsters[i].size,monsters[i].size);      
        }
        $('#mobs').html(tempstr);

        for ( i in this.damageIndicators) {
            if(this.damageIndicators[i].render()){ // render passes back true when indicator needs to be killed
                this.damageIndicators.splice(i, 1);
            }
        }


    };

    Instance.prototype.getDistance = function(a1, a2) {
        return Math.sqrt(Math.pow(a1.x - a2.x, 2), Math.pow(a1.y - a2.y, 2));  
    };

    Instance.prototype.updateEntityPositions = function() {
        bodiesState = box.getState();
        for(var i = 0; i < this.entities.length; i++) {
            for(var j = 0; j < this.entities[i].length; j++) {
                this.entities[i][j].x = bodiesState[this.entities[i][j].name].x;
                this.entities[i][j].y = bodiesState[this.entities[i][j].name].y;
            }
        }
    };


    function Actor(type, name, hpMax, mspa, dmgMod, weapon, armor, level) {
        this.type = type;
        this.name = name;
        this.hpMax = hpMax;
        this.hp = this.hpMax;
        this.dead = false;

        this.mpMax = 50;
        this.mp = this.mpMax;

        this.na = 0;
        //this.na = new Date().getTime() + mspa;  // next attack
        this.mspa = mspa;                       // sec per attack
        this.dmgMod = dmgMod;
        this.weapon = weapon;
        this.armor = armor;
        this.level = level;
        this.target = undefined;

        this.size = 50; //px size of actor
        this.movementSpeed = 0.1//0.03;//in px per ms (1 is fast!)

        this.cooldownTime = 0; //ms until actor can make a new action.  When moving or attacks finish, cooldown will be zero.  When attack is done, cooldown in incremented by that attacks cooldown time.  
        this.currentAction = ""; // current action is the string name of the action the Actor is performing. an empty string implies the actor has no current action and is available to select a new one. 



    }



    //Update decrements cooldownTime until it reaches zero, then performs another action.
    Actor.prototype.update = function(dt) {
        if(this.dead){
            return;
        }


        this.cooldownTime = Math.max(0, this.cooldownTime - dt); //TODO: keep remainder of dt to smooth < 30ms potential jitteryness
        while( this.cooldownTime === 0 && dt > 0) {
            this.currentAction = "";
            dt = this.selectNextAction(dt); //returns a reduced dt value
        }
    };

    //goes through each action in the action chain, seeing if it has the requirements to perform it.  If all attempted but none valid, nothing happens.
    Actor.prototype.selectNextAction = function(dt) {

        var hasTarget = (this.target !== undefined);
        var targetRange;
        if (hasTarget) {
            targetRange = this.distanceTo(this.target);
        }
        for (var i in this.actionChain) {
            var action = actionDictionary[this.actionChain[i]]


            //if(this.actionChain[i] == "heavyStrike") {
            //    console.log([this, action]);    
            //}

;            //make sure has target if target is required
            if(!action.targetRequired || this.target !== undefined ) {

                //if attack, make sure the action's range and mana cost requirements are met.
                if(action.type == "attack") {
                    if(action.range < targetRange || action.manaCost > this.mp) {
                        continue;
                    }
                }
                dt = this.performAction(dt, this.actionChain[i]); // returns a dt value, reduced by the amount of time the action took to perform. 
                break;        
            }
        }
        return dt; 
    };

    Actor.prototype.performAction = function(dt, actionName) {
        //console.log(sprintf("performing %s", actionName));
        var action = actionDictionary[actionName];
        this.currentAction = actionName;
        if(action.skillDuration > dt) {
            this.cooldownTime = action.skillDuration - dt;
        }
        else {
            dt = dt - action.skillDuration;
        }
        switch(action.type) {
        case "attack":
            this.doAttack(actionName);
            //console.log("attacking with " + this.mp + "mp");
            break;
        case "movement":
            this.moveSkill(actionName);
            break;
        case "target":
            this.target = this.getNearestEnemy();
            break;    
        default:
            console.log("performAction: action type not recognized");
            break;
        }
        return dt;

    }; 

    Actor.prototype.isAlive = function() {
        return !this.dead;
    };

    Actor.prototype.doAttack = function(actionName) {
        var action = actionDictionary[actionName];
        var dmg = action.damageMult * this.rollDamage() - this.target.armor.getConstReduction();
        this.mp -= action.manaCost;
        dmg = dmg > 0 ? dmg : 0;
        currentInstance.damageIndicators.push(new DamageIndicator(this.target, dmg));
        //this.target.hp -= dmg;
        var manacost = action.manaCost ? action.manaCost : 0;
        if(LOG_ATTACKS) console.log(sprintf("%s hit %s for %d dmg using %s! (costs %d)", this.name, this.target.name, dmg, actionName, manacost));
        this.target.takeDamage(this, dmg);
        
    };

    Actor.prototype.takeDamage = function(attacker, dmg) {
        this.hp = Math.max(0, this.hp-dmg);
        if(this.hp === 0) {
            if(attacker.type == "hero"){
                attacker.gainXp(attacker.xpOnKill(this));
            }
            attacker.target = undefined;
            this.die();
        }
    };

    Actor.prototype.die = function() {
        this.dead = true;
        //Todo - cleanup dead critter
    }

    Actor.prototype.rollDamage = function() {
        var dmgMin, dmgMax;
        dmgMin = this.weapon.dmgMin * this.dmgMod;
        dmgMax = this.weapon.dmgMax * this.dmgMod;

        return prob.rand(dmgMin, dmgMax);
    };

    Actor.prototype.equip = function(itemsDropped) {
        var item;
        for (var i = 0; i < itemsDropped.length; i++) {
            item = itemsDropped[i];
            if (ITEM_TYPES.indexOf(item.type) == -1) {
                throw "WTF item not weapon or armor";
            }
            if (item.type == 'weapon' && this.weapon !== undefined && item.level > this.weapon.level) {
                console.log("Upgraded Hero's level " + this.weapon.level + " weapon to level " + item.level);
                this.weapon = item;
            } else if (item.type == 'armor' && this.armor !== undefined && item.level > this.armor.level) {
                console.log("Upgraded Hero's level " + this.armor.level + " armor to level " + item.level);
                this.armor = item;
            }
        }
    };

    Actor.prototype.xpOnKill = function(deceased) {
        return Math.floor(50 * Math.pow(1.1, deceased.level - 1));
    };

    Actor.prototype.gainXp = function(xp) {
        this.xp += xp;
        //var lvlUpXP = parseInt(100/1.2 * Math.pow(1.2, this.level));

        //while (this.handleLeveling());
        while (this.isNextLevel()) {
            this.xp -= this.lvlUpXP;
            this.levelUp();
        }
    };

    // factor out side effect of modifying this.levelUpXP
    Actor.prototype.isNextLevel = function() {
        this.lvlUpXP = Math.floor(100 * Math.pow(1.2, this.level - 1));
        //console.log(this);
        //console.log(this.xp + "/" + this.lvlUpXP);

        if (this.xp >= this.lvlUpXP) {
            return true;
        }
        return false;
    };

    Actor.prototype.initStats = function(level) {
        this.str = 18 + this.level * 2;
        this.vit = 18 + this.level * 2;
        this.dmgMod = this.calcDmgMod();
        this.hpMax = this.vit * 5;
        this.hp = this.hpMax;
    };

    Actor.prototype.levelUp = function() {
        this.level++;
        this.initStats();
    };

    Actor.prototype.calcDmgMod = function() {
        return this.str / 3;
    };

    Actor.prototype.moveTowards = function(target){
        if(target !== undefined) {
            if(Math.abs(this.x - target.x) > (this.size + target.size)/2) {
                var dx = (target.x - this.x)/Math.abs(target.x - this.x);
                this.x += dx;
            }
            if(Math.abs(this.y - target.y) > (this.size + target.size)/2) {
                var dy = (target.y - this.y)/Math.abs(target.y - this.y);
                this.y += dy;
            }
        }
    };

    Actor.prototype.distanceTo = function(target) {
        return Math.sqrt(Math.pow(this.x - target.x, 2), Math.pow(this.y - target.y, 2));  
    };

    Actor.prototype.getNearestEnemy = function() {
        var enemyAffinity = Math.abs(this.affinity - 1); // 0 > 1 , 1 > 0 , shouldn't be greater than 1
        var enemies = currentInstance.entities[enemyAffinity];
        var closestEnemyDist = undefined;
        var closestEnemy;
        for (var i in enemies) {
            if (closestEnemyDist === undefined || this.distanceTo(enemies[i]) < closestEnemyDist) {
                closestEnemy = enemies[i];
                closestEnemyDist = this.distanceTo(enemies[i]);
            }
        }
        return closestEnemy;
    };

    Actor.prototype.moveSkill = function(actionName) {
        // TODO - filter by action name to accomodate multiple different kinds of movement styles

        var targDist = this.distanceTo(this.target);
        var axes = ["x", "y"];

        //TODO  - fix movement overlap bug - allow collisions between all enemies, not just target
        for( var i in axes) {
            var axis = axes[i];
            var sizeBuffer = (this.size + this.target.size)/2; //widths of the nearest halves of each actor
            var dist = this.target[axis] - this[axis]; // dist on axis between enemies directionally
            if (Math.abs(dist) >= sizeBuffer + this.movementSpeed) {
                var direction = dist / Math.abs(dist);
                //this[axis] += this.movementSpeed * direction;
                var angle = this.angleToTarget(this.target);
                box.applyImpulse(this.name, parseInt(angle), parseInt(9999));

            }

        }

    };

    Actor.prototype.angleToTarget = function(target) {
        var dx = target.x - this.x;
        var dy = (target.y - this.y);
        var theta = Math.atan2(dy, dx);
        return theta * 180 / Math.PI;
    }

    function Hero(name, weapon, armor) {
        this.str = 20;  // TODO make these derive from formula instead of hardcoded
        this.vit = 20;
        this.xp = 0;
        this.x = 100;
        this.y = 275;
        this.affinity = 0; // hero and allies are affinity 0, enemies are affinity 1, entity array position

        this.actionChain = ["heavyStrike", "basicAttack", "approachTarget", "getNearestTarget"];

        var weapon = weapon ? weapon : new Weapon(1);
        var armor = armor ? armor : new Armor(5); //temporarily buffing armor, should start at 1
        var dmgMod = this.str / 3;
        var hpMax = this.vit * 5;
        var mspa = 700;
        var level = 1;

        Actor.call(this, 'hero', name, hpMax, mspa, dmgMod, weapon, armor, level);

        this.movementSpeed = 0.2;

    }

    Hero.subclass(Actor);

    Hero.prototype.onEnterRoom = function(curTime) {
        this.na = curTime + this.mspa;
        this.target = undefined;
        this.x = 100;
        this.y = 275;
        this.cooldownTime = 0;
        this.mp = this.mpMax;
        this.initStats();
    };

    function Monster(name, level, weapon, armor, dmgMod) {
        this.str = Math.floor(20 + level * 1.6);
        this.vit = Math.floor(20 + level * 1.6);


        this.affinity = 1; // hero and allies are affinity 0, enemies are affinity 1, entity array position

        var weapon = weapon ? weapon : new Weapon(level);
        var armor = armor ? armor : new Armor(level);
        var dmgMod = dmgMod ? dmgMod : this.str / 3;

        this.dropChance = 1 / 2;

        var hpMax = this.vit * 3;
        var mspa = 1000;

        this.x = 500 + Math.random()*300;
        this.y = 100 + Math.random()*450;
        this.actionChain = ["basicAttack", "approachTarget", "getNearestTarget"]; // The actionchain is a string array of the names of actions which the actor can perform.  Actions are attempted in order until a valid action is found or all fail. 
        name = name ? name : 'fwah!';

        Actor.call(this, 'monster', name, hpMax, mspa, dmgMod, weapon, armor, level);
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
    };

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
    };

    // currently unused, make a nice little function for this
    Armor.prototype.getPercentReduction = function() {
        return 1;
    };

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
            monsterNames = ['Pogi', 'Doofus', 'Nerd', 'DURR', 'herp', 'derp', 'Nards', 'Kenny', 'Vic', 'j', 'boo', 'bob', 'smelly', 'harold', 'carter'];

            monsterCount = 3;
            //monsterCount = prob.pProb(this.monster_count) + 2;// increasing monster count by one so monster always present TODO - tune this value better.
            mons = [];
            level = 1; // force weak monsters TODO remove
            for (var j = 0; j < monsterCount; j++) {
                mons[j] = new Monster(this.getMonsterName(monsterNames), level);
            }
            this.rooms[i] = new Room(mons);
        }
    }

    Map.prototype.getMonsterName = function(names) {
        if (names.length === 0) {
            return;
        }
        var rand = prob.pyRand(0, names.length);
        var name = names[rand];
        names.splice(rand, 1);
        return name;
    };

    function Room(monsters) {
        this.monsters = monsters;
        this.initialized = false;
    }

    Room.prototype.init = function (now) {
        if (typeof(now) !== 'number') {
            throw "Room init requires time arg";
        }
        for (var i = 0; i < this.monsters.length; i++) {
            this.monsters[i].na = now + this.monsters[i].mspa;
        }
        this.initialized = true;
    };

    function DamageIndicator(target, dmg) {
        this.x = target.x;
        this.y = target.y;
        this.dmg = dmg;
        this.age = 0;
    }

    DamageIndicator.prototype.render = function() {
        if (this.age < 30) {
            cvs = document.getElementById("physCanvas");
            var ctx=cvs.getContext("2d");
            
            ctx.fillStyle="rgba(99,99,99," + parseFloat((25-this.age)/25) + ")"; //Damage is red
            ctx.fillText(parseInt(this.dmg), this.x, this.y-this.age*2);
            this.age++;
            return false;
        } else {
            return true;
        }

    };

    function Projectile(owner, vector, size) {
        this.owner = owner;
        this.dx = vector[0];
        this.dy = vector[1];
        this.size = size;
        this.affinity = owner.affinity;
        this.x = owner.x;
        this.y = owner.y;

    }

    Projectile.prototype.update = function(dt){
        this.x += this.dx;
        this.y += this.dy;
        //Detect collision
    }


    function removeDeadFromBox2D(killed) {
        if(killed.length > 0) {
            for(var i = 0; i < killed.length; i++) {
                delete world[killed[0]];
            }
        }
    }


    //Stuff from Box2d example
    ///////////////////////////////
    //////////////////////////////
    //////////////////////

    var SCALE = 1;
    var NULL_CENTER = {x:null, y:null};
    
    function Entity(id, x, y, angle, center, color) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.angle = angle || 0;
      this.center = center;
      this.color = color || "red";
    }
    
    Entity.prototype.update = function(state) {
      this.x = state.x;
      this.y = state.y;
      this.center = state.c;
      this.angle = state.a;
    }
    
    Entity.prototype.draw = function(ctx) {
      /*ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(this.x * SCALE, this.y * SCALE, 4, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(this.center.x * SCALE, this.center.y * SCALE, 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();*/
    }
    
    Entity.build = function(def) {
      if (def.radius) {
        return new CircleEntity(def.id, def.x, def.y, def.angle, NULL_CENTER, def.color, def.radius);
      } else if (def.polys) {
        return new PolygonEntity(def.id, def.x, def.y, def.angle, NULL_CENTER, def.color, def.polys);
      } else {
        return new RectangleEntity(def.id, def.x, def.y, def.angle, NULL_CENTER, def.color, def.halfWidth, def.halfHeight);
      }
    }
    
    function CircleEntity(id, x, y, angle, center, color, radius) {
      color = color ? color : 'aqua';
      Entity.call(this, id, x, y, angle, center, color);
      this.radius = radius;
    }
    CircleEntity.prototype = new Entity();
    CircleEntity.prototype.constructor = CircleEntity;
    
    CircleEntity.prototype.draw = function(ctx) {
      ctx.save();
      ctx.translate(this.x * SCALE, this.y * SCALE);
      ctx.rotate(this.angle);
      ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
      
      ctx.fillStyle = this.color;
      //ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.arc(this.x * SCALE, this.y * SCALE, this.radius * SCALE, 0, Math.PI * 2, true);
      //ctx.moveTo(this.x * SCALE, this.y * SCALE);
      //ctx.lineTo((this.x) * SCALE, (this.y + this.radius) * SCALE);
      ctx.closePath();
      ctx.fill();
      //ctx.stroke();
      
      ctx.restore();
      
      Entity.prototype.draw.call(this, ctx);
    }
    
    function RectangleEntity(id, x, y, angle, center, color, halfWidth, halfHeight) {
      Entity.call(this, id, x, y, angle, center, color);
      this.halfWidth = halfWidth;
      this.halfHeight = halfHeight;
    }
    RectangleEntity.prototype = new Entity();
    RectangleEntity.prototype.constructor = RectangleEntity;
    
    RectangleEntity.prototype.draw = function(ctx) {
      ctx.save();
      ctx.translate(this.x * SCALE, this.y * SCALE);
      ctx.rotate(this.angle);
      ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
      ctx.fillStyle = this.color;
      ctx.fillRect((this.x-this.halfWidth) * SCALE,
                   (this.y-this.halfHeight) * SCALE,
                   (this.halfWidth*2) * SCALE,
                   (this.halfHeight*2) * SCALE);
      ctx.restore();
      
      Entity.prototype.draw.call(this, ctx);
    }

    var world = {};
    var bodiesState = null;
    var box = null;
    
    function box2DUpdate(animStart) {
      box.update();
      bodiesState = box.getState();
      //console.log(bodiesState);
      for (var id in bodiesState) {
        var entity = world[id];
        if (entity) {
            entity.update(bodiesState[id]);
        }
      }
    }
    
    var ctx = document.getElementById("physCanvas").getContext("2d");
    var canvasWidth = ctx.canvas.width;
    var canvasHeight = ctx.canvas.height;
    
    function draw() {
      //console.log("d");
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      for (var id in world) {
        var entity = world[id];
        entity.draw(ctx);
      }
    }
    /*
    var initialState = [
      {id: "ground", x: ctx.canvas.width / 2 / SCALE, y: ctx.canvas.height / SCALE, halfHeight: 0.5, halfWidth: ctx.canvas.width / SCALE, color: 'yellow'},
      {id: "ball", x: 2, y: ctx.canvas.height / SCALE - 2, radius: 1},
      {id: "b1", x:17, y: ctx.canvas.height / SCALE - 1, halfHeight: 2, halfWidth: 0.10},
      {id: "b2", x:17, y: ctx.canvas.height / SCALE - 5, halfHeight: 0.25, halfWidth: 2},
      {id: "box1", x:17, y: ctx.canvas.height / SCALE - 20, halfHeight:1, halfWidth: 1}
    ];*/
    
    var running = true;
    var impulseTimeout = null;
    var initTimeout = null;
    
    function box2DInit(inst) {
        world = {};
        for (var i = 0; i < inst.entities.length; i++) {
            for (var j = 0; j < inst.entities[i].length; j++) {
                var entX = inst.entities[i][j]["x"];
                var entY = inst.entities[i][j]["y"];
                var entName = inst.entities[i][j]["name"];
                var entColor = (i == 0) ? 'blue' : 'red';
                world[entName] = Entity.build({id: entName, x: entX, y: entY, radius: 30, color: entColor});
                //console.log(["initBox2d", entX, entY, world]);
            }
        }
      var bulletElem = {"checked":true}; //PLACEHOLDER ASSIGNMENT~~~
      box = new bTest(60, false, canvasWidth, canvasHeight, SCALE);
      box.setBodies(world, bulletElem.checked);
      box.activateListener();
      //console.log(box);
    //initListen();


      /*impulseTimeout = setTimeout(function() {
        box.applyImpulse("ball", parseInt(20), parseInt(9001));
      }, 1000);
      
      impulseTimeout = setTimeout(function() {
        init();
      }, 10000);*/

      draw(); ///PLACEHOLDER - remove
    }

    window.requestAnimFrame = (function(){
          return  window.requestAnimationFrame       || 
                  window.webkitRequestAnimationFrame || 
                  window.mozRequestAnimationFrame    || 
                  window.oRequestAnimationFrame      || 
                  window.msRequestAnimationFrame     || 
                  function(/* function */ callback, /* DOMElement */ element){
                    window.setTimeout(callback, 1000 / 60);
                  };
    })();

    var restart = false;
    
    /*
    document.addEventListener("DOMContentLoaded", function() {
      init();
      
      (function loop(animStart) {
        if (restart) {
          clearTimeout(impulseTimeout);
          clearTimeout(initTimeout);
          init();
          restart = false;
        }
        update(animStart);
        draw();
        requestAnimFrame(loop);
      })();
    }, false);
    */

    document.onkeypress = function (e) {
      e = e || window.event;
      var charCode = e.charCode || e.keyCode,
      character = String.fromCharCode(charCode);
      
      if(character == "w") {
        box.applyImpulse("Bobbeh", 270, parseInt(1000000));
      }
      if(character == "s") {
        box.applyImpulse("Bobbeh", 90, parseInt(1000000));
      }
      if(character == "d") {
        box.applyImpulse("Bobbeh", 0, parseInt(1000000));
      }
      if(character == "a") {
        box.applyImpulse("Bobbeh", 180, parseInt(1000000));
      }
    }




});
