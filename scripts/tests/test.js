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
    var itemref = namespace.bot.itemref;
    var vector = namespace.bot.vector;
    
    function onReady() {
        log.info('LOADED');

        QUnit.test('page loaded', function(assert) {
            assert.equal('hello', 'hello', 'page has loaded successfully');
        });

        log.info('onReady');

        window.gevents = _.extend({}, Backbone.Events);

        var gameModel = new main.GameModel();
        //console.log('gameModel', gameModel);

        QUnit.test('gameModel initialized', function(assert) {
            assert.ok(gameModel.hero, 'initialized with hero');
            assert.ok(gameModel.inv, 'initialized with inv');
            assert.ok(gameModel.lastTime, 'able to get time');
        });

        QUnit.test('Hero properly initialized', function(assert) {
            var hero = gameModel.hero;
            //console.log('hero', hero);
            assert.ok(hero, 'hero created');
            assert.equal(hero.get('name'), 'bobbeh', 'hero name is bobbeh');
            assert.equal(hero.get('level'), 1, 'hero level intialized to level 1');
            assert.equal(hero.get('team'), 0, 'hero on correct team');
            assert.equal(hero.get('xp'), 0, 'Hero xp initialize to 0');
            assert.equal(hero.get('nextLevelXp'), hero.getNextLevelXp(), 'nextLevelXp initialized');

            validateAttributes(assert, hero);

            // Skills
            var skillchain = hero.get('skillchain');
            assert.equal(skillchain.length, 1, 'initialized skill chain with one skill');
            var skill = skillchain.at(0);
            assert.equal(skill.get('name'), 'basic melee', 'initialized with "basic melee"');
            validateSkill(assert, skill);
            assert.equal(skill.get('xp'), 0, 'skill created with 0 xp');
            assert.equal(skill.get('level'), 1, 'skill should be initialized at level 1, current level: ' + skill.get('level'));
            //assert.equal(skill.get('equippedBy'), 'bobbeh', 'skill\'s equippedBy should be set to bobbeh');
	});

	QUnit.test('Zone test', function(assert) {
            assert.equal(false, gameModel.inZone, 'not inZone');
            assert.equal(false, gameModel.running, 'not running');
	    gameModel.tick();
	    assert.ok(1, 'gameModel.tick didn\'t crash it');
            assert.equal(true, gameModel.inZone, 'inZone');
	    // console.log('zone', gameModel.zone);
	    assert.ok(gameModel.zone, 'Zone created on tick');
	    assert.ok(gameModel.zone.get('roomCount') >= 0, 'has roomcount of at least 1');
	    assert.equal(gameModel.zone.get('rooms').length, gameModel.zone.get('roomCount'), 'roomcount matches number of rooms created');
	    assert.ok(gameModel.zone.get('initialized'), 'has a hero');

            assert.equal(gameModel.zone.get('heroPos'), 0, 'Hero is in room 0');
	    var monsters = gameModel.zone.getCurrentRoom().monsters;
	    // console.log(monsters);
	    assert.ok(monsters.length, 'room 0 monsters have truthy length');
	    var mon = monsters.at(0);
	    assert.equal(mon.get('team'), 1, 'First monster in room 0 is on correct team');
	    validateAttributes(assert, mon);
	    validateSkill(assert, mon.get('skillchain').models[0]);
	});

	QUnit.test('inventory', function(assert) {
	    //TODO - why dont these inv locations have any attributes?  Inv seems to work on index.html...?
	    var inv = gameModel.hero.get('inv');

	    assert.ok(inv.where({'itemType': 'weapon'}).length, 'inventory has at least one weapon');
	    assert.ok(inv.where({'itemType': 'armor'}).length, 'inventory has at least one armor');
	    assert.ok(inv.where({'itemType': 'skill'}).length, 'inventory has at least one skill');
	    //assert.ok(inv.armor.length, 'inventory has at least one armor');
	    //assert.ok(inv.skills.length, 'inventory has at least one skill');

	    validateWeapon(assert, inv.findWhere({'itemType': 'weapon'}));
	    validateItem(assert, inv.findWhere({'itemType': 'armor'}));
	    validateItem(assert, inv.findWhere({'itemType': 'skill'}));
	});

	QUnit.test('Combat', function(assert) {
	    var hero = gameModel.hero;

	    var mon = new entity.MonsterModel({'name':'skeleton'});
	    assert.equal(mon.get('hp'), mon.get('maxHp'), 'Monster HP maxed for taking hit');

	    var skill = hero.get('skillchain').at(0);
	    console.log(skill);
	    assert.ok(skill, 'hero skill found');
	    assert.ok(skill.get('name'), 'hero about to try using ' + skill.get('name'));

	    hero.attackTarget(mon, skill);
	    assert.ok(mon.get('hp') < mon.get('maxHp'), "Monster's hp decreased from attack");
	    assert.ok(skill.cooldown == skill.get('cooldownTime') + 500, 'cooldown set to cooldownTime after attack');

	    hero.set('hp', hero.get('maxHp'));
	    assert.equal(hero.get('hp'), hero.get('maxHp'), 'Hero HP maxed for taking hit');
	    var skill = mon.get('skillchain').at(0);
	    console.log(skill);
	    assert.ok(skill, 'mon skill found');
	    assert.ok(skill.get('name'), 'mon about to try using ' + skill.get('name'));

	    mon.attackTarget(hero, skill);
	    assert.ok(hero.get('hp') < hero.get('maxHp'), "Hero's hp decreased from attack");
	    assert.ok(skill.cooldown == skill.get('cooldownTime') + 500, 'cooldown set to cooldownTime after attack');	    

            assert.equal(hero.nextAction, 500, 'Hero nextAction equal to 500');
	});

	QUnit.test('Vector', function(assert) {
            var vector = namespace.bot.vector;

            assert.ok(vector.equal([1,2], [1,2]));
            assert.ok(!vector.equal([1,2], [2,1]));
            assert.ok(!vector.equal([2,2], [2,1]));
            assert.ok(vector.equal([1,2,3], [1,2,3]));

            assert.equal(vector.dist([0, 0], [3, 4]), 5);
            assert.notEqual(vector.dist([0, 0], [3, 3]), 5);

            assert.ok(vector.equal(vector.closer([0, 0], [0, 4], 1, 0), [0, 1]));

            var pos = vector.closer([0, 0], [0, 11], 10, 10);
            var dist = vector.dist(pos, [0, 1]);
            assert.equal(pos[0], 0);
            assert.equal(pos[1], 1);

            var pos = vector.closer([0, 0], [1, 1], 1, 0);
            assert.equal(pos[0], 1);
            assert.equal(pos[1], 1);

            var pos = vector.closer([0, 0], [2, 2], 2, 0);
            assert.equal(pos[0], 1);
            assert.equal(pos[1], 1);

            var pos = vector.closer([0, 0], [0, 11], 10, 10);
            var dist = vector.dist(pos, [0, 1]);
            assert.equal(dist, 0);
        });

	function validateWeapon(assert, item) {
	    validateItem(assert, item);
	    var name = item.get('name');
	    var types = ['melee','range','spell']; //valid weapon types
	    assert.ok(types.indexOf(item.get('type')) >= 0, name + ' has valid type: ' + item.get('type'));
	    assert.ok(item.get('damage') >= 0, name + ' has non-negative damage value: ' + item.get('damage'));
	    assert.ok(item.get('range') >= 0, name + ' has non-negative range value: ' + item.get('range'));
	    assert.ok(item.get('speed') >= 0, name + ' has non-negative speed value: ' + item.get('speed'));	    
	}

	function validateItem(assert, item) {
	    var name = item.get('name');
	    assert.ok(name, name + ' has valid name');

	    assert.ok(item.get('xp') >= 0, name + ' has non-negative xp value: ' + item.get('xp'));
	    var affs = item.get('affixes');
	    assert.ok(jQuery.isArray(affs), name + ' has affix array');

	    //item affix validation
	    if (affs.length === 0) {
		assert.ok(1, 'empty affix array is valid');
	    } else {
		for (var i = 0; i < affs.length; i++) {
		    var split = affs[i].split(' ');
		    assert.equal(split.length, 3, 'affix:"' + affs[i] + '" should contain three space separated terms');
		    var validModifiers = ['added', 'more']
		    assert.ok(validModifiers.indexOf(split[1]) >= 0, 'affix modifier is valid : ' + split[1]);
		}
	    }
	}
	
        function validateAttributes(assert, entity) {
            assert.ok(entity.get('maxHp') > 0, 'entity has  positive maxHp: ' + entity.get('maxHp'));
            assert.ok(entity.get('hp') <= entity.get('maxHp'), 'hp is <=  maxHp: ' + entity.get('hp'));
            assert.ok(entity.get('maxMana') > 0, 'hero initialized with positive maxMana: ' + entity.get('maxMana'));
            assert.equal(entity.get('mana'), entity.get('maxMana'), 'mana initialized to maxMana');

            //Base Stats
            assert.ok(entity.get('strength') > 0, 'strength intilaized with positive value: ' + entity.get('strength'));
            assert.ok(entity.get('dexterity') > 0,'dexterity intilaized with positive value: ' + entity.get('dexterity'));
            assert.ok(entity.get('wisdom') > 0,'wisdom intilaized with positive value: ' + entity.get('wisdom'));
            assert.ok(entity.get('vitality') > 0,'vitality intilaized with positive value: ' + entity.get('vitality'));

            //Derivative Stats
            assert.ok(entity.get('armor') > 0, 'armor initialized with positive value: ' + entity.get('armor'));
            assert.ok(entity.get('dodge') > 0, 'dodge initialized with positive value: ' + entity.get('dodge'));
            // TODO - cast resist floats (and probably all stats) to 2-decimal places only (currently long and ugly floats)
            // We should have a discussion about this -Bobby
            // assert.equal(parseFloat(entity.get('fireResist').toFixed(4)), entity.get('fireResist'), 'stats should have max of four  decimal places - XX.XX%');
            assert.ok(entity.get('fireResist'), 'fireResist initialized with value: ' + entity.get('fireResist'));
            assert.ok(entity.get('coldResist'), 'coldResist initialized with value: ' + entity.get('coldResist'));
            assert.ok(entity.get('lightResist'), 'lightResist initialized with value: ' + entity.get('lightResist'));
            assert.ok(entity.get('poisResist'), 'poisResist initialized with value: ' + entity.get('poisResist'));
        }

	//NOTE: this validates skills after they have been computeAttr'ed - skill item will fail with not enough info
        function validateSkill(assert, skill) {
	    //console.log('validate skill', skill);
            assert.ok(skill.get('cooldownTime') > 0, 'skill has positive cooldown time: ' + skill.get('cooldownTime'));

            var skillTypes = ['melee', 'range', 'spell'];
            assert.ok(skillTypes.indexOf(skill.get('class')) >= 0, 'valid skill class: ' + skill.get('class'));
            assert.ok(skill.get('physDmg') > 0, 'skill has positive physDmg: ' + skill.get('physDmg'));
            assert.ok(skill.get('range') > 0, 'skill has positive range: ' + skill.get('range'));
            assert.ok(skill.get('speed') > 0, 'skill has positive speed: ' + skill.get('speed')); // TODO - figure out how speed actuallly works
            assert.ok(skill.get('affixes').length !== undefined, 'skill contains array of affixes');

            //console.log(skill.attributes);
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
