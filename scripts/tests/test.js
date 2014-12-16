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


        QUnit.test( 'page loaded', function( assert ) {
            assert.equal( 'hello', 'hello', 'page has loaded successfully' );
        });

        log.info('onReady');
        //console.log(main);
        var gameModel = new main.GameModel();
        console.log(gameModel);

        QUnit.test( 'gameModel initialized' , function( assert ) {
            assert.equal(false, gameModel.get('inZone'), 'not inZone');
            assert.equal(false, gameModel.get('running'), 'not running');
            assert.ok(gameModel.char, 'initialized with char');
            assert.ok(gameModel.inv, 'initialized with inv');
            assert.ok(gameModel.lastTime, 'able to get time');
            assert.equal(gameModel.zonesCleared, 0, 'starting with 0 zones cleared');
        });

        QUnit.test( 'character properly initialized' , function( assert ) {
            var char = gameModel.char;
            console.log(char);
            assert.ok(char, 'character created');
            assert.equal(char.get('name'), 'bobbeh', 'char names Bobbeh');
            assert.equal(char.get('level'), 1, 'character level intialized to level 1');
            assert.equal(char.get('team'), 0, 'character on correct team');
            assert.equal(char.get('xp'), 0, 'Character xp initialize to 0');
            assert.equal(char.get('nextLevelXp'), char.getNextLevelXp(), 'nextLevelXp saved on char');

            validateAttributes(assert, char);

            //Skills
            var skillChain = char.get('skillChain');
            assert.equal(skillChain.length, 1 , 'initialized skill chain with one skill');
            var skill = skillChain.models[0];
            assert.equal(skill.get('name'), 'basic melee', 'initialized with "basic melee"');
            validateSkill(assert, skill);
            assert.equal(skill.get('exp'), 0, 'skill created with 0 xp');
            assert.equal(skill.get('level'), 1, 'skill should be initialized at level 1, current level: ' + skill.get('level'));
            assert.equal(skill.get('equippedBy'), 'bobbeh', 'skill\'s equippedBy should be set to Bobbeh');
        });

        function validateAttributes(assert, entity) {
            assert.ok(entity.get('maxHp') > 0, 'entity has  positive maxHp: ' + entity.get('maxHp'));
            assert.equal(entity.get('hp'), entity.get('maxHp'), 'hp initialized to maxHp');
            assert.ok(entity.get('maxMana') > 0, 'character initialized with positive maxMana: ' + entity.get('maxMana'));
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
            assert.ok(entity.get('fireResist') > 0, 'fireResist initialized with positive value: ' + entity.get('fireResist'));
            assert.ok(entity.get('coldResist') > 0, 'coldResist initialized with positive value: ' + entity.get('coldResist'));
            assert.ok(entity.get('lightResist') > 0, 'lightResist initialized with positive value: ' + entity.get('lightResist'));
            assert.ok(entity.get('poisResist') > 0, 'poisResist initialized with positive value: ' + entity.get('poisResist'));
        }

        function validateSkill(assert, skill) {
            assert.ok(skill.get('cooldownTime') > 0 , 'skill has positive cooldown time: ' + skill.get('cooldownTime'));

            var skillTypes = ['melee', 'range', 'spell'];
            assert.ok(skillTypes.indexOf(skill.get('class')) >= 0, 'valid skill class: ' + skill.get('class'));
            assert.ok(skill.get('physDmg') > 0 , 'skill has positive physDmg: ' + skill.get('physDmg'));
            assert.ok(skill.get('range') > 0, 'skill has positive range: ' + skill.get('range'));
            assert.ok(skill.get('speed') > 0, 'skill has positive speed: ' + skill.get('speed')); // TODO - figure out how speed actuallly works
            assert.ok(skill.get('affixes').length !== undefined, 'skill contains array of affixes');

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
