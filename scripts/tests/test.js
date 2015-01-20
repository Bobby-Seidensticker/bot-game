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
    var utils = namespace.bot.utils;
    
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
            assert.ok(gameModel.lastTime !== undefined, 'lastTime is defined');
            assert.ok(gameModel.running === false, 'not running');
        });

        QUnit.test('Util tests', function(assert) {
            var dmgStats = utils.newDmgStatsDict();
            assert.ok('physDmg' in dmgStats);
            assert.ok('lightDmg' in dmgStats);
            assert.ok('coldDmg' in dmgStats);
            assert.ok('fireDmg' in dmgStats);
            assert.ok('poisDmg' in dmgStats);
            assert.ok('range' in dmgStats);
            assert.ok('speed' in dmgStats);
            assert.equal(dmgStats.physDmg.added, 0);
            assert.equal(dmgStats.physDmg.more, 1);
            assert.ok('converted' in dmgStats.physDmg);
            assert.ok('lightDmg' in dmgStats.physDmg.converted);
            assert.ok('lightDmg' in dmgStats.physDmg.gainedas);
            assert.ok('gainedas' in dmgStats.physDmg);

            utils.addMod(dmgStats, 'physDmg added 2', 1);
            assert.equal(dmgStats.physDmg.added, 2, 'physDmg added 2');
            utils.addMod(dmgStats, 'physDmg more 100', 1);
            assert.equal(dmgStats.physDmg.more, 2, 'physDmg more 100');
            utils.addMod(dmgStats, 'physDmg converted 40 fireDmg', 1);
            assert.equal(dmgStats.physDmg.converted.fireDmg, 40, 'physDmg converted 40 fireDmg');
            utils.addMod(dmgStats, 'physDmg gainedas 40 fireDmg', 1);
            assert.equal(dmgStats.physDmg.gainedas.fireDmg, 40, 'physDmg gainedas 40 fireDmg');
        });

        QUnit.test('Util dmg skill tests', function(assert) {
            var dmgStats = utils.newDmgStatsDict();

            var skill = new inv.SkillModel('basic melee');

            utils.addMod(dmgStats, 'physDmg added 2', 1);
            assert.equal(dmgStats.physDmg.added, 2, 'physDmg added 2');

            var dmgKeys = [
                'physDmg',
                'lightDmg',
                'coldDmg',
                'fireDmg',
                'poisDmg',
                'range',
                'speed'
            ];

            skill.computeAttrs(dmgStats, dmgKeys);

            assert.equal(skill.physDmg, 2, 'Skill\'s physDmg is equal to 2');
        });

        QUnit.test('Hero properly initialized', function(assert) {
            var hero = gameModel.hero;
            //console.log('hero', hero);
            assert.ok(hero, 'hero created');
            assert.equal(hero.name, 'bobbeh', 'hero name is bobbeh');
            assert.equal(hero.level, 1, 'hero level intialized to level 1');
            assert.equal(hero.team, 0, 'hero on correct team');
            assert.equal(hero.xp, 0, 'Hero xp initialize to 0');
            assert.equal(hero.nextLevelXp, hero.getNextLevelXp(), 'nextLevelXp initialized');

            validateAttributes(assert, hero);

            // Skills
            var skillchain = hero.skillchain;
            assert.ok(skillchain.skills[0] !== undefined, 'initialized skill chain with one skill');
            var skill = skillchain.skills[0];
            assert.equal(skill.name, 'basic melee', 'initialized with "basic melee"');
            validateSkill(assert, skill);
            assert.equal(skill.xp, 0, 'skill created with 0 xp');
            assert.equal(skill.level, 1, 'skill should be initialized at level 1, current level: ' + skill.level);
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
	    assert.ok(monsters.models.length, 'room 0 monsters have truthy length');
	    var mon = monsters.models[0];
	    assert.equal(mon.team, 1, 'First monster in room 0 is on correct team');
	    validateAttributes(assert, mon);
	    validateSkill(assert, mon.skillchain.models[0]);
	});

	QUnit.test('inventory', function(assert) {
	    //TODO - why dont these inv locations have any attributes?  Inv seems to work on index.html...?
	    var inv = gameModel.hero.inv;

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
	    assert.equal(mon.hp, mon.maxHp, 'Monster HP maxed for taking hit');

	    var skill = hero.skillchain.at(0);
	    console.log(skill);
	    assert.ok(skill, 'hero skill found');
	    assert.ok(skill.get('name'), 'hero about to try using ' + skill.get('name'));

	    hero.attackTarget(mon, skill);
	    assert.ok(mon.hp < mon.maxHp, "Monster's hp decreased from attack");
	    assert.ok(skill.cooldown == skill.get('cooldownTime') + 500, 'cooldown set to cooldownTime after attack');

            hero.revive();
	    assert.equal(hero.hp, hero.maxHp, 'Hero HP maxed for taking hit');
	    var skill = mon.skillchain.at(0);
	    console.log(skill);
	    assert.ok(skill, 'mon skill found');
	    assert.ok(skill.get('name'), 'mon about to try using ' + skill.get('name'));

	    mon.attackTarget(hero, skill);
	    assert.ok(hero.hp < hero.maxHp, "Hero's hp decreased from attack");
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
            assert.ok(entity.maxHp > 0, 'entity has  positive maxHp: ' + entity.maxHp);
            assert.ok(entity.hp <= entity.maxHp, 'hp is <=  maxHp: ' + entity.hp);
            assert.ok(entity.maxMana > 0, 'hero initialized with positive maxMana: ' + entity.maxMana);
            assert.equal(entity.mana, entity.maxMana, 'mana initialized to maxMana');

            //Base Stats
            assert.ok(entity.strength > 0, 'strength intilaized with positive value: ' + entity.strength);
            assert.ok(entity.dexterity > 0,'dexterity intilaized with positive value: ' + entity.dexterity);
            assert.ok(entity.wisdom > 0,'wisdom intilaized with positive value: ' + entity.wisdom);
            assert.ok(entity.vitality > 0,'vitality intilaized with positive value: ' + entity.vitality);

            //Derivative Stats
            assert.ok(entity.armor > 0, 'armor initialized with positive value: ' + entity.armor);
            assert.ok(entity.dodge > 0, 'dodge initialized with positive value: ' + entity.dodge);
            // TODO - cast resist floats (and probably all stats) to 2-decimal places only (currently long and ugly floats)
            // We should have a discussion about this -Bobby
            // assert.equal(parseFloat(entity.fireResist.toFixed(4)), entity.fireResist, 'stats should have max of four  decimal places - XX.XX%');
            assert.ok(entity.fireResist, 'fireResist initialized with value: ' + entity.fireResist);
            assert.ok(entity.coldResist, 'coldResist initialized with value: ' + entity.coldResist);
            assert.ok(entity.lightResist, 'lightResist initialized with value: ' + entity.lightResist);
            assert.ok(entity.poisResist, 'poisResist initialized with value: ' + entity.poisResist);
        }

	//NOTE: this validates skills after they have been computeAttr'ed - skill item will fail with not enough info
        function validateSkill(assert, skill) {
	    //console.log('validate skill', skill);
            assert.ok(skill.cooldownTime > 0, 'skill has positive cooldown time: ' + skill.cooldownTime);

            var skillTypes = ['melee', 'range', 'spell'];
            assert.ok(skillTypes.indexOf(skill['class']) >= 0, 'valid skill class: ' + skill['class']);
            assert.ok(skill.physDmg > 0, 'skill has positive physDmg: ' + skill.physDmg);
            assert.ok(skill.range > 0, 'skill has positive range: ' + skill.range);
            assert.ok(skill.speed > 0, 'skill has positive speed: ' + skill.speed);

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
