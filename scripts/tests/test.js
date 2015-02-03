namespace.module('bot.test', function (exports, require) {

    exports.extend({
        onReady: onReady
    });

    require('org.startpad.funcs').patch();
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
            assert.ok(gameModel.running === true, 'running is true');
        });

        QUnit.test('Util tests', function(assert) {
            var dmgStats = utils.newBaseStatsDict(entity.dmgKeys);
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
            //assert.ok('lightDmg' in dmgStats.physDmg.converted);
            //assert.ok('lightDmg' in dmgStats.physDmg.gainedas);
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
            var utils = namespace.bot.utils;
            var dmgStats = utils.newBaseStatsDict(entity.dmgKeys);

            var skill = new inv.SkillModel('basic melee');

            var dmgKeys = namespace.bot.entity.dmgKeys;

            // add 2
            utils.addMod(dmgStats, 'physDmg added 2', 1);
            assert.equal(dmgStats.physDmg.added, 2, 'physDmg added 2');
            skill.computeAttrs(dmgStats, dmgKeys);
            assert.equal(skill.physDmg, 2, 'Skill\'s physDmg is equal to 2 after added 2');

            // more 50
            utils.addMod(dmgStats, 'physDmg more 50', 1);
            assert.equal(dmgStats.physDmg.more, 1.5, 'physDmg more 1.5');
            skill.computeAttrs(dmgStats, dmgKeys);
            assert.equal(skill.physDmg, 3, 'Skill\'s physDmg is equal to 3 after more 50');

            // 50 pct phys to lightning
            utils.addMod(dmgStats, 'physDmg converted 50 lightDmg', 1);
            assert.equal(dmgStats.physDmg.converted.lightDmg, 50, 'physDmg converted 50 lightDmg');
            skill.computeAttrs(dmgStats, dmgKeys);
            assert.equal(skill.physDmg, 1.5, 'Skill physDmg is equal to 1.5 after half phys to light');
            assert.equal(skill.lightDmg, 1.5, 'Skill lightDmg is equal to 1.5 after half phys to light');

            // more lightning
            utils.addMod(dmgStats, 'lightDmg more 100', 1);
            skill.computeAttrs(dmgStats, dmgKeys);
            assert.equal(skill.lightDmg, 3, 'Skill\'s lightDmg is equal to 3 after phys to lightning and more 100');

            // more lightning
            utils.addMod(dmgStats, 'lightDmg gainedas 50 fireDmg', 1);
            skill.computeAttrs(dmgStats, dmgKeys);
            assert.equal(skill.fireDmg, 1.5, 'Half of lightDmg gained as fireDmg');

            // add 2
            var mod = {def: 'coldDmg added 2 perLevel', type: 'dmg'};
            utils.addMod(dmgStats, utils.applyPerLevel(mod, 10).def);
            assert.equal(dmgStats.coldDmg.added, 20, 'coldDmg added 2 * 10');
            skill.computeAttrs(dmgStats, dmgKeys);
            assert.equal(skill.coldDmg, 20, 'Skill\'s coldDmg is equal to 20 after added 2 perLevel by 10 levels');
        });

        QUnit.test('HeroSpec properly initialized', function(assert) {
            var hero = gameModel.hero;
            //console.log('hero', hero);
            assert.ok(hero, 'hero created');
            assert.equal(hero.name, 'bobbeh', 'hero name is bobbeh');
            assert.equal(hero.level, 1, 'hero level intialized to level 1');
            assert.equal(hero.team, 0, 'hero on correct team');
            assert.equal(hero.xp, 0, 'Hero xp initialized to 0');
            assert.equal(hero.nextLevelXp, hero.getNextLevelXp(), 'nextLevelXp initialized');

            validateSpec(assert, hero);

            // Skills
            var skillchain = hero.skillchain;
            assert.ok(skillchain.skills[0] !== undefined, 'initialized skill chain with one skill');
            var skill = skillchain.skills[0];
            assert.equal(skill.name, 'basic melee', 'initialized with "basic melee"');
            //console.log('heroskill', skill);
            validateSkillSpec(assert, skill);
            assert.equal(skill.xp, 0, 'skill created with 0 xp');
            assert.equal(skill.level, 1, 'skill should be initialized at level 1, current level: ' + skill.level);
            //assert.equal(skill.get('equippedBy'), 'bobbeh', 'skill\'s equippedBy should be set to bobbeh');
        });

        QUnit.test('Zone test', function(assert) {
            assert.equal(true, gameModel.running, 'running is true');
            assert.ok(gameModel.zone, 'gameModel initialized with zone');
            gameModel.tick();
            assert.ok(1, 'gameModel.tick didn\'t crash it');
            
            // console.log('zone', gameModel.zone);
            assert.ok(gameModel.zone, 'Zone created on tick');
            assert.ok(gameModel.zone.rooms.length, 'has more than 1 room');
            assert.ok(gameModel.zone.initialized, 'is initialized');

            assert.equal(gameModel.zone.heroPos, 0, 'Hero is in room 0');
            var monsters = gameModel.zone.getCurrentRoom().monsters;
            assert.ok(monsters.length, 'room 0 monsters have truthy length');
            var mon = monsters[0];
            assert.equal(mon.spec.team, 1, 'First monster in room 0 is on correct team');
            validateSpec(assert, mon.spec);
            
            assert.ok(mon.skills[0].coolAt !== undefined, 'first skill has coolAt: ' + mon.skills[0].coolAt);

            validateSkillSpec(assert, mon.skills[0].spec);
        });

        QUnit.test('inventory', function(assert) {
            //TODO - why dont these inv locations have any attributes?  Inv seems to work on index.html...?
            var inv = gameModel.hero.inv;

            assert.ok(inv.models.length, 'inventory has at least one item');

            assert.ok(_.findWhere(inv.models, {itemType: 'weapon'}) !== undefined);
            assert.ok(_.findWhere(inv.models, {itemType: 'armor'}) !== undefined);
            assert.ok(_.findWhere(inv.models, {itemType: 'skill'}) !== undefined);

            validateWeapon(assert, _.findWhere(inv.models, {itemType: 'weapon'}));
            validateItem(assert, _.findWhere(inv.models, {itemType: 'armor'}));
            validateItem(assert, _.findWhere(inv.models, {itemType: 'skill'}));
        });

        QUnit.test('Combat', function(assert) {
            // TODO: do something about dodge
            var hero = new zone.HeroBody(gameModel.hero);
            var mon = new zone.MonsterBody('skeleton', 1);
            assert.equal(mon.hp, mon.spec.maxHp, 'Monster HP is at maxHp (' + mon.hp + '). Ready to take hit.');

            var skill = hero.skills[0].spec;

            assert.ok(skill, 'Hero skill found');
            assert.ok(skill.name, 'hero about to try using ' + skill.name);

            hero.attackTarget(mon, hero.skills[0]);
            assert.ok(mon.hp < mon.spec.maxHp, 'After attack, monster\'s hp decreased to ' + mon.hp);
            assert.ok(hero.skills[0].coolAt === window.time + skill.speed + skill.cooldownTime,
                      'skill\'s cooldown set to cooldownTime + speed after attack');
            assert.ok(hero.nextAction === window.time + skill.speed, 'Hero\'s next action skill\'s speed after attack');
            
            hero.revive();
            assert.equal(hero.hp, hero.spec.maxHp, 'Hero HP maxed for taking hit at ' + hero.hp);
            var skill = mon.skills[0];
            assert.ok(skill !== undefined, 'Mon has a skill equipped');
            assert.ok(skill.spec.name, 'mon about to try using ' + skill.spec.name);

            mon.attackTarget(hero, skill);
            assert.ok(hero.hp < hero.spec.maxHp, 'Hero\'s hp decreased from attack to ' + hero.hp);
            assert.equal(skill.coolAt, skill.spec.cooldownTime + skill.spec.speed + window.time,
                         'skill\'s cooldown set to cooldownTime + speed + windowtime after attack');
            assert.equal(mon.nextAction, skill.spec.speed + window.time,
                         'Mon\'s nextAction set to window time and skill\'s speed after attack');
        });

        QUnit.test('Combat, Equip, Resist', function(assert) {
            var hero = new zone.HeroBody(gameModel.hero);
            var mon = new zone.MonsterBody('fire skeleton', 1);
            
            assert.equal(hero.hp, hero.spec.maxHp, 'Hero HP maxed for taking hit at ' + hero.hp);
            var skill = mon.skills[0];
            assert.ok(skill !== undefined, 'Mon has a skill equipped');
            assert.ok(skill.spec.name, 'mon about to try using ' + skill.spec.name);
            assert.ok(skill.spec.fireDmg, 'mon skill has fireDmg: ' + skill.spec.fireDmg);
            mon.attackTarget(hero, skill);
            var startFireRes = hero.spec.fireResist;
            var damageTaken = hero.spec.maxHp - hero.hp;
            assert.ok(damageTaken, 'Hero hit for dmg: ' + damageTaken);
            hero.revive();

            //console.log('hi');
            // equip fire resist card in armor
            var card = {model: new inv.CardTypeModel('quenching blade'), level: 1};
            //console.log(card);

            assert.ok(card, 'generated quenching blade card to equip and add fire resist');

            // Following line is problematic because it assumes models[0] is a weapon, relies on Hero's arbitrary initial state
            hero.spec.inv.models[0].equipCard(card, 0);
            hero.spec.computeAttrs();
            assert.ok(hero.spec.fireResist < startFireRes, 'equipping card reduced fireResistance from ' + startFireRes + ' to: ' + hero.spec.fireResist);
            //console.log(hero.spec.inv.models[0]);

            assert.equal(hero.hp, hero.spec.maxHp, 'Post-equip: Hero HP maxed for taking hit at ' + hero.hp);
            mon.attackTarget(hero,skill);
            
            var newDamageTaken = hero.spec.maxHp - hero.hp;
            assert.ok(newDamageTaken, 'Hero hit for dmg: ' + newDamageTaken);
            assert.ok(newDamageTaken < damageTaken, 'fireResist card correctly reduced damage taken: ' + damageTaken +
                     ' to new value: ' + newDamageTaken);
            
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
            
            var name = item.name;
            var types = ['melee', 'range', 'spell']; //valid weapon types
            assert.ok(types.indexOf(item.type) !== -1, name + ' has valid type: ' + item.type);
            var necessary = ['physDmg'];
            var allTargets = [];
            _.each(item.baseMods, function(mod) {
                var target = mod.def.split(' ')[0];
                allTargets.push(target);
                var index = necessary.indexOf(target);
                if (index !== -1) {
                    necessary.splice(index, 1);
                }
            });
            assert.ok(necessary.length === 0, 'item has all the necessary mods, targets: ' + JSON.stringify(allTargets));
        }

        function validateItem(assert, item) {
            var name = item.name;
            assert.ok(name, name + ' has valid name');

            assert.ok(item.xp >= 0, name + ' has non-negative xp value: ' + item.xp);
            assert.equal(typeof(item.itemType), 'string', 'has an itemType and it\'s a string')
            assert.ok(item.cards && item.cards.length >= 0, 'has an array of cards');
            

            var mods = item.baseMods;
            assert.ok(mods.length, name + ' has at least one baseMod');
            assert.ok(item.level >= 1, name + ' has level >= 1');

            _.each(mods, validateMod.curry(assert));
        }

        function validateMod(assert, mod) {
            assert.ok('def' in mod, 'mod has a def field');
            assert.ok('type' in mod, 'mod has a type field');
            var validTypes = ['attr', 'def', 'eleResist', 'dmg'];
            assert.ok(validTypes.indexOf(mod.type) !== -1, 'mod has a valid type field ' + mod.type);

            var keys = {
                def: entity.defKeys,
                eleResist: entity.eleResistKeys,
                dmg: entity.dmgKeys,
            };
            var validVerbs = ['added', 'more', 'converted', 'gainedas'];
            var valid3Verbs = ['added', 'more'];
            var validSpecial = ['perLevel'].concat(keys.dmg.slice(0, 5));

            var split = mod.def.split(' ');
            assert.ok(keys[mod.type].indexOf(split[0]) !== -1, 'mod matches type');
            assert.ok(split.length >= 3 && split.length <= 4, 'mod has valid number of terms');
            assert.ok(validVerbs.indexOf(split[1]) !== -1, 'valid verb');
            assert.ok(typeof(parseInt(split[2], 10)) === 'number', 'valid number');
            assert.ok(parseInt(split[2], 10) === parseFloat(split[2]), 'is an integer');

            if (split.length === 3) {
                assert.ok(valid3Verbs.indexOf(split[1]) !== -1, 'appropriate verb for length 3: ' + split[1]);
            } else if (split.length === 4) {
                assert.ok(validVerbs.indexOf(split[1]) !== -1, 'appropriate verb for length 4: ' + split[1]);
                assert.ok(validSpecial.indexOf(split[3]) !== -1, 'appropriate special: ' + split[3]);
            }
        }

        function validateSpec(assert, entity) {
            assert.ok(entity.maxHp > 0, 'entity has positive maxHp: ' + entity.maxHp);
            //assert.ok(entity.hp <= entity.maxHp, 'hp is <= maxHp: ' + entity.hp); HeroSpec does not have hp (only body)
            assert.ok(entity.maxMana > 0, 'hero has positive maxMana: ' + entity.maxMana);
            //assert.ok(entity.mana <= entity.maxMana, 'mana is <= maxMana'); HeroSpec does not have mana (only body)

            // Base Stats
            assert.ok(entity.strength > 0, 'strength positive value: ' + entity.strength);
            assert.ok(entity.dexterity > 0, 'dexterity positive value: ' + entity.dexterity);
            assert.ok(entity.wisdom > 0, 'wisdom positive value: ' + entity.wisdom);
            assert.ok(entity.vitality > 0, 'vitality positive value: ' + entity.vitality);
            
            // Derivative Stats
            assert.ok(entity.armor > 0, 'armor has valid positive value: ' + entity.armor);
            assert.ok(entity.dodge > 0, 'dodge has valid positive value: ' + entity.dodge);
            assert.ok(entity.fireResist < 1, 'fireResist has valid value: ' + entity.fireResist);
            assert.ok(entity.coldResist < 1, 'coldResist has valid value: ' + entity.coldResist);
            assert.ok(entity.lightResist < 1, 'lightResist has valid value: ' + entity.lightResist);
            assert.ok(entity.poisResist < 1, 'poisResist has valid value: ' + entity.poisResist);
        }

        // NOTE: this validates skills after they have been computeAttr'ed - skill item will fail with not enough info
        function validateSkillSpec(assert, skillSpec) {
            //console.log('validate skill', skillSpec);

            assert.ok(skillSpec.name, 'skill has a name: ' + skillSpec.name);

            
            var skillTypes = ['melee', 'range', 'spell'];
            assert.ok(skillTypes.indexOf(skillSpec['class']) >= 0, 'valid skill class: ' + skillSpec['class']);
            assert.ok(skillSpec.physDmg >= 0, 'skill has non-negative physDmg: ' + skillSpec.physDmg);
            assert.ok(skillSpec.lightDmg >= 0, 'skill has non-negative lightDmg: ' + skillSpec.lightDmg);
            assert.ok(skillSpec.coldDmg >= 0, 'skill has non-negative coldDmg: ' + skillSpec.coldDmg);
            assert.ok(skillSpec.fireDmg >= 0, 'skill has non-negative fireDmg: ' + skillSpec.fireDmg);
            assert.ok(skillSpec.poisDmg >= 0, 'skill has non-negative poisDmg: ' + skillSpec.poisDmg);
            
            assert.ok(skillSpec.range > 0, 'skill has positive range: ' + skillSpec.range);
            assert.ok(skillSpec.speed > 0, 'skill has positive speed: ' + skillSpec.speed);

            // console.log(skill.attributes);
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
