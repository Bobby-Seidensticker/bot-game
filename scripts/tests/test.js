namespace.module('bot.test', function (exports, require) {

    exports.extend({
        onReady: onReady
    });

    var log = namespace.bot.log;
    var inv = namespace.bot.inv;
    var menu = namespace.bot.menu;
    var entity = namespace.bot.entity;
    var zone = namespace.bot.zone;
    var main = namespace.bot.main;

    function onReady() {
        log.info('LOADED');


	QUnit.test( "page loaded", function( assert ) {
	    assert.equal( "hello", "hello", "page has loaded successfully" );
	});

        log.info('onReady');
	console.log(main);
        var gameModel = new main.GameModel();
	console.log(gameModel);

	QUnit.test( "gameModel initialized" , function( assert ) {
		assert.equal(false, gameModel.get('inZone'), "not inZone");
    		assert.equal(false, gameModel.get('running'), "not running");
		assert.ok(gameModel.char, "initialized with char");
		assert.ok(gameModel.inv, "initialized with inv");
		assert.ok(gameModel.lastTime, "able to get time");
		assert.equal(gameModel.zonesCleared, 0, "starting with 0 zones cleared");
	});

       	QUnit.test( "character properly initialized" , function( assert ) {
		var char = gameModel.char;
		console.log(char);
		assert.ok(char, "character created");
		assert.equal(char.get('level'), 1, "character level intialized to level 1");
		assert.equal(char.get('team'), 0, "character on correct team");
		assert.ok(char.get('maxHp') > 0, "character initialized with positive maxHp");
		assert.equal(char.get('hp'), char.get('maxHp'), "hp initialized to maxHp");
                assert.ok(char.get('maxMana') > 0, "character initialized with positive maxMana");
                assert.equal(char.get('mana'), char.get('maxMana'), "mana initialized to maxMana");

		//Base Stats
		assert.ok(char.get('strength') > 0, "strength intilaized with positive value");
                assert.ok(char.get('dexterity') > 0,"dexterity intilaized with positive value");
                assert.ok(char.get('wisdom') > 0,"wisdom intilaized with positive value");
                assert.ok(char.get('vitality') > 0,"vitality intilaized with positive value");
		
		//Derivative Stats
		assert.ok(char.get('armor') > 0, "armor initialized with positive value");
		assert.ok(char.get('dodge') > 0, "dodge initialized with positive value");
		assert.ok(char.get('fireResist') > 0, "fireResist initialized with positive value");
		assert.ok(char.get('coldResist') > 0, "coldResist initialized with positive value");
		assert.ok(char.get('lightResist') > 0, "lightResist initialized with positive value");
		assert.ok(char.get('poisResist') > 0, "poisResist initialized with positive value");
		
		//Skills
		var skillChain = char.get('skillChain');
		assert.equal(skillChain.length, 1 , "initialized skill chain with one skill");
		var skill = skillChain.models[0];
		assert.equal(skill.get('name'), "basic melee", "initialized with 'basic melee'");
		testSkill(assert, skill);


	});

	function testAttributes(assert, entity) {
	    var boobs;
	}
	
	function testSkill(assert, skill) {
	    assert.ok(skill.get('cooldownTime') > 0 , "skill has positive cooldown time: " + skill.get('cooldownTime'));
	    assert.ok(skill.get('physDmg') > 0 , "skill has positive physDmg: " + skill.get('physDmg'));
	    var skillTypes = ["melee", "range", "spell"];
	    assert.ok(skillTypes.indexOf(skill.get('class')) >= 0, "valid skill class: " + skill.get('class'));
	    //TODO - equipped by is not properly set to char name on initialization                                                                                              
	    console.log(skill.attributes);
	}




        //var gameView = new namespace.bot.window.GameView();
        //var m = new menu.TabView();

        //var invMenuView = new inv.InvMenuView({model: gameModel.inv});

        //var invModel = new inv.InvModel();
        //var invMenuView = new inv.InvMenuView({model: invModel});
        //var craftMenuView = new inv.CraftMenuView({model: invModel});
        //var lvlupMenuView = new inv.LvlupMenuView({model: invModel});

        //gameModel.start();
    }
});
    /*
    var GameModel = Backbone.Model.extend({
        defaults: function() {
            return {
                running: false,
                inZone: false
            }
        },

        initialize: function() {
            this.inv = new inv.InvModel();

            this.char = new entity.newChar(this.inv);

            this.lastTime = new Date().getTime();
            this.zonesCleared = 0;
        },

        start: function() {
            log.info('start');
            this.set({running: true});
            requestAnimFrame(this.tick.bind(this));
        },

        stop: function() {
            this.set({running: false});
        },

        tick: function() {
            log.debug('begin tick');
            if (new Date().getTime() > window.STOP_AFTER) {
                console.log('done');
                this.stop();
                return;
            }

            if (!this.get('inZone')) {

                this.zone = zone.newZoneModel(this.char);
                this.set('inZone', true);
            }
            if (!this.char.get('hp') || this.char.get('hp') <= 0 || this.zone.done()) {
                log.info('Getting new zone, recomputing char attrs');
                this.char.computeAttrs();
                this.zone = zone.newZoneModel(this.char);
            }

            var thisTime = new Date().getTime();
            var monsters = this.zone.getCurrentRoom().monsters;  // type MonsterCollection
            //for (var t = this.lastTime; t < thisTime; t += 2) {
            for (var t = this.lastTime; t < thisTime; t += thisTime - this.lastTime) {
                log.debug('tick calling update functions');
                // pass new time to char and all monsters
                this.char.update(t);
                monsters.update(t);

                this.char.tryDoStuff(monsters.living());

                // Check if cleared / done, if so get out
                if (monsters.cleared()) {
                    if (this.zone.done()) {
                        if (this.zonesCleared > 0) {
                            log.warning('Cleared a zone, done!');
                            return;
                        }
                        this.zonesCleared++;
                        break;
                    }
                    this.zone.nextRoom();
                    monsters = this.zone.getCurrentRoom().monsters;
                    continue;
                }

                monsters.tryDoStuff([this.char]);

                if (!this.char.isAlive()) {
                    break;
                }
            }

            this.lastTime = thisTime;

            if (this.get('running')) {
                requestAnimFrame(this.tick.bind(this));
            }
        },
    });

});

window.STOP_AFTER = new Date().getTime() + 100000;
    */