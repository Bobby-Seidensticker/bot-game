namespace.module('bot.main', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var itemref = namespace.bot.itemref;

    var views = namespace.bot.views;
    //var models = namespace.bot.models;
    //var controls = namespace.bot.controls;

    var game;
    var TABS = ['map', 'inv', 'craft', 'lvlup', 'settings'];

    exports.extend({
        'onReady': onReady
    });

    function onReady() {
        tests();

        game = new Game();
        game.init();

        requestAnimationFrame(tick);
    }

    function tick() {
        game.tick();

        requestAnimationFrame(tick);
    }

    function tests() {
        itemref.expand('test', 'harf');
        log.info('TESTS COMPLETE\n\n');
    }

    function ensureProps(obj) {
        for (var i = 1; i < arguments.length; i++) {
            if (!(arguments[i] in obj)) {
                return false;
            }
        }
        return true
    }

    function loadModel(model) {
        var data = localStorage['model'];

        var model;

        try {
            model = JSON.parse(data);
            fucked = false
            if (!('chars' in model)) { fucked = true; }
            if (!('inv' in model)) { fucked = true; }
            if (!ensureProps(model['inv'], 'weapons', 'armor', 'skills', 'affixes', 'mats')) { fucked = true; }
            if (fucked) {
                throw('loadRawModel: fucked');
            }
        }
        catch (e) {
            if (data === undefined) {
                log.info('models.loadRawModel(), No data in localStorage reverting to default');
            } else {
                log.error('models.loadRawModel(), Tried to parse corrupt JSON, given %s, reverting to default', data);
            }
            model = {
                'chars': [{'name': 'bobbeh'}],
                'inv': brandNewInv()
            };
        }

        return model;
    }

    function brandNewInv() {
        var inv = {
            'weapons': [
                itemref.expand('weapon', 'bowie knife'),
                itemref.expand('weapon', 'shitty bow'),
                itemref.expand('weapon', 'crappy wand')
            ],
            'armor': [
                itemref.expand('armor', 'cardboard kneepads')
            ],
            'skills': [
                itemref.expand('skill', 'basic melee'),
                itemref.expand('skill', 'basic range'),
                itemref.expand('skill', 'basic spell')
            ],
            'affixes': [],
            'recipes': [
		itemref.expand('recipe', 'smelly cod piece'),
		itemref.expand('recipe', 'balsa helmet'),
                itemref.expand('recipe', 'fire slice'),
		itemref.expand('recipe', 'ice slice'),
		itemref.expand('recipe', 'lightning slice'),
		itemref.expand('recipe', 'poison slice'),
                itemref.expand('recipe', 'fire arrow'),
                itemref.expand('recipe', 'ice arrow'),
		itemref.expand('recipe', 'lightning arrow'),
                itemref.expand('recipe', 'poison arrow'),
                itemref.expand('recipe', 'fire ball'),
		itemref.expand('recipe', 'ice ball'),
		itemref.expand('recipe', 'lightning ball'),
		itemref.expand('recipe', 'poison ball')
	    ],
	    'mats': []
        };
        return inv;
    }

    function Game() {
        this.view = new views.GameView();
        this.view.resize();
        $(window).on('resize', this.view.resize.bind(this.view));

        this.model = loadModel();

        var charmodel = newCharModel({'name': 'bobbeh'});

        console.log(this.model);
        //log.info('model from ls: ', JSON.stringify(this.model));

        this.tabs = new Tabs(this.model);
        this.tabs.init();

        this.map = new Map({});
        this.map.init();
        this.inv = new Inv(this.model.inv);
        this.inv.init();
        this.craft = new Craft(this.model.inv);
        this.craft.init();
        this.lvlup = new Lvlup({});
        this.lvlup.init();
        this.settings = new Settings({});
        this.settings.init();

        /*
        this.chars = [];
        for (var i = 0; i < this.model.chars.length; i++) {
            this.charsStats[i] = new Header(this.model.chars[i]);
            this.chars[i].focus = i === 0;
            this.chars[i].init();
        }*/
    }

    Game.prototype.init = function (model) {
    }

    Game.prototype.tick = function() {
    }

    // A model holds data that calls callbacks when modified using the 'set'
    function Subject() {
        log.debug('Subject constructor start');
        this._attrs = {};
        this._listeners = {};
        this.nonce = 0;
        this.initialized = false;
        log.debug('Subject constructor end');
    }

    Subject.prototype.init = function(data) {
        log.debug('Subject init start');
        iterate(data, function(name, value) {
            this._attrs[name] = value;
            this._listeners[name] = {};
        }.bind(this));
        this.initialized = true;
        log.debug('Subject init end');
    }

    Subject.prototype.set = function(name, val) {
        this._attrs[name] = val;
        iterate(this._listeners[name], function(key, val) {
            val();
        });
    }

    Subject.prototype.get = function(name) {
        return this._attrs[name];
    }

    Subject.prototype.addListener = function(name, callback) {
        this.nonce++;

        assert(name in this._listeners);
        assert(!(this.nonce in this._listeners[name]));

        this._listeners[name][this.nonce] = callback;

        assert(this.nonce in this._listeners[name]);
        return this.nonce;
    }

    Subject.prototype.removeListener = function(name, nonce) {
        log.info('rm list, name: %s, nonce: %d', name, nonce);
        console.log(this._listeners);
        assert(this._listeners[name][nonce] !== undefined);
        delete this._listeners[name][nonce];
        assert(this._listeners[name][nonce] === undefined);
    }

    // CharModel is-a Subject
    function CharModel() {
        log.debug('CharModel constructor start');
        Subject.call(this);
        log.debug('CharModel constructor end');
    }

    CharModel.subclass(Subject);

    CharModel.prototype.init = function(data) {
        log.debug('CharModel init start');
        Subject.prototype.init.call(this, data);
        log.debug('CharModel init end');
    }

    function newCharModel(data) {
        log.debug('newCharModel start');
        console.log(data);
        var cm = new CharModel();
        cm.init(data);
        assert(cm.initialized);
        
        var namePrinterNonce = cm.addListener('name', function(cm) {
            log.info('LISTENER: %s', cm.get('name'));
        }.curry(cm));

        log.info('set name handler, current name: %s', cm.get('name'));
        cm.set('name', 'hurr');
        log.info('current name: %s', cm.get('name'));
        
        cm.removeListener('name', namePrinterNonce);

        cm.set('name', 'cunt');
        log.info('current name: %s', cm.get('name'));

        log.debug('newCharModel end');
        return cm;
    }



    /* CharModel.prototype.setup = function(data) {
        this.name = data.name;
        this.level = 0;
        this.hp = 10;
        this.maxHp = 10;
        this.mana = 20;
        this.maxMana = 20;
        this.xp = 0;
        this.nextLevelXp = 100;
        this.zone = 'Dark Woods';
    } */
/*
    function HeaderCharView(model) {
        this.model = model;
        this.tmp = {'init': false};
    }

    HeaderCharView.prototype.init = function() {
        this.$ele = Mustache.render($('#header-stats-tmpl').html(), this.model._model);
        $('.header').append(this.$ele);

        //this.model.

        if (!(this.tmp.init === true)) {
            this.tmp.init = true;
        }
    }*/

    function Tabs(model) {
        this.model = model;
    }

    Tabs.prototype.init = function() {
        this.tabs = TABS.map(function(x) {
            return $('#' + x);
        });
        this.contents = TABS.map(function(x) {
            return $('#' + x + '-content-holder');
        });
        for (var i = 0; i < this.tabs.length; i++) {
            this.tabs[i].on('click', onTabClick.curry(this.contents, i));
        }
        onTabClick(this.contents, 1);
    }

    function onTabClick(contents, eleIndex) {
        for (var i = 0; i < contents.length; i++) {
            if (i === eleIndex) {
                contents[i].removeClass('closed');
            } else {
                contents[i].addClass('closed');
            }
        }
    }

    function Map(model) {
        this.model = model;

        this.$dest = $('#map-content-holder');
        this.tmpl = $('#map-tab-tmpl').html();
    }

    Map.prototype.init = function() {
        this.$dest.append(Mustache.render(this.tmpl, this.model));
    }

    function Inv(model) {
        var tmplData = {
            'weapons': '',
            'armor': '',
            'skills': ''
        };
        this.model = model;

        this.$dest = $('#inv-content-holder');
        this.tmpl = $('#inv-tab-tmpl').html();

        for (var i = 0; i < this.model.weapons.length; i++) {
            tmplData.weapons += makeInvItem(this.model.weapons[i], "weapon");
        }

        for (var i = 0; i < this.model.skills.length; i++) {
            tmplData.skills += makeInvItem(this.model.skills[i], "skill");
        }

        for (var i = 0; i < this.model.armor.length; i++) {
            tmplData.armor += makeInvItem(this.model.armor[i], "armor");
        }

        this.$ele = $(Mustache.render($('#inv-tab-tmpl').html(), tmplData));

        this.$dest.append(this.$ele);

        this.$dest.on('click', function(event) {
            var $target, $parent, wasCollapsed;

            $target = $(event.target);
            if ($target.hasClass('item-header')) {
                $parent = $target.parent();
                wasCollapsed = $parent.hasClass('collapsed');

                $('.item').addClass('collapsed');
                if (wasCollapsed) {
                    $parent.removeClass('collapsed');
                }
            }
            console.log(event);
            console.log($(event.target));
        });
    }

    Inv.prototype.init = function() {
        //this.$dest.append(Mustache.render(this.tmpl, this.model));
    }

    Inv.prototype.newItem = function(type, name) {
        var dest = this.model[type];
        dest[dest.length] = makeInvItem(itemref.expand(type, name));
    }

    function makeInvItem(model, type, isRecipe) {
        model.renderedAffixes = '';
	model.type = model.type ? model.type + " " + type : type;
	console.log(model);

	if (type == "armor") {
	    model.renderedAffixes += Mustache.render($('#inv-tab-item-affix-tmpl').html(), {'str': "Weight: " + model.weight});
	}

	if (type == "weapon") {
	    model.renderedAffixes += Mustache.render($('#inv-tab-item-affix-tmpl').html(), {'str': "Base Damage: " + model.damage});
	    model.renderedAffixes += Mustache.render($('#inv-tab-item-affix-tmpl').html(), {'str': "Attack Speed: " + model.speed});
	    model.renderedAffixes += Mustache.render($('#inv-tab-item-affix-tmpl').html(), {'str': "Range: " + model.range});
	}
	if (type =="skill"){
	    var skilltypes = model.types.join(" ") + " skill";
	    model.type = skilltypes;
	    model.renderedAffixes += Mustache.render($('#inv-tab-item-affix-tmpl').html(), {'str': "Mana Cost: " + model.mana});
	}

	if (isRecipe) {
	    model.buttonbox = Mustache.render($('#item-recipe-buttons-tmpl').html(), model);
        } else    {
	    model.buttonbox = Mustache.render($('#item-buttons-tmpl').html(), {});
	}

        for (var i = 0; i < model.affixes.length; i++) {
            model.renderedAffixes += Mustache.render($('#inv-tab-item-affix-tmpl').html(), {'str': model.affixes[i]});
        }
        log.info("makeInvItem, model: %s", JSON.stringify(model));
        return Mustache.render($('#inv-tab-item-tmpl').html(), model);
    }


    function Craft(model) {
	var tmplData = {
	    'armor': "",
	    'weapons': "",
	    'skills': ""
	}
	
	this.model = model;
	var recipes = this.model.recipes;
        this.$dest = $('#craft-content-holder');
        this.tmpl = $('#craft-tab-tmpl').html();
	
      //	console.log(itemref.ref);
	for (var i = 0; i < recipes.length; i++) {
	    var recipe = recipes[i];
	    var item = itemref.expand(recipe.type, recipe.name);
	    item.cost = recipe.cost;
	    console.log(item);
	    if (recipe.type == "armor") {
		tmplData['armor'] += makeInvItem(item, "armor", true);
	    }
	    if (recipe.type == "weapon"){
		tmplData['weapons'] += makeInvItem(item, "weapon", true);
            }
	    if (recipe.type == "skill"){
		tmplData['skills'] += makeInvItem(item, "skill", true);
            }
	}

	this.$ele = $(Mustache.render($('#craft-tab-tmpl').html(), tmplData));

        this.$dest.append(this.$ele);

	this.$dest.on('click', function(event) {
		var $target, $parent, wasCollapsed;

		$target = $(event.target);
		if ($target.hasClass('item-header')) {
		    $parent = $target.parent();
		    wasCollapsed = $parent.hasClass('collapsed');

		    $('.item').addClass('collapsed');
		    if (wasCollapsed) {
			$parent.removeClass('collapsed');
		    }
		}
		console.log(event);
		console.log($(event.target));
	    });
    }

    Craft.prototype.init = function() {
        //nothing here
    }

    function Lvlup(model) {
        this.model = model;

        this.$dest = $('#lvlup-content-holder');
        this.tmpl = $('#lvlup-tab-tmpl').html();
    }

    Lvlup.prototype.init = function() {
        this.$dest.append(Mustache.render(this.tmpl, this.model));
    }

    function Settings(model) {
        this.model = model;

        this.$dest = $('#settings-content-holder');
        this.tmpl = $('#settings-tab-tmpl').html();
    }

    Settings.prototype.init = function() {
        this.$dest.append(Mustache.render(this.tmpl, this.model));
    }


    /*
    function onTick() {
    }

    // run through a map, takes a hero and a map
    function Instance(hero, map) {
        this.entities = [[],[]];  // 0  is hero and allied entities, 1 is enemies

        requestAnimationFrame(this.run.bind(this));

        console.log('instance constructor start');
        this.hero = hero;
        this.map = map;
        this.roomIndex = 0;
        this.complete = false;

        this.init();

        this.timeAccumulator = 0;

        console.log('instance constructor end');
    }

    Instance.prototype.init = function() {
        console.log('new instance');
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
        console.log(['New Room contains', this.entities[1]]);
        var room = this.map.rooms[this.roomIndex];
        this.entities[1] = room.monsters;
        this.hero.onEnterRoom(this.curTime);
        room.init(this.curTime);
        box2DInit(this);
    };


    Instance.prototype.tryFinishRoom = function() {
        while (this.entities[1].length === 0 && this.roomIndex < this.map.rooms.length) {
            this.roomIndex++;
            console.log('entering room ' + this.roomIndex);
            if (this.roomIndex < this.map.rooms.length) {
                this.initRoom();
            }
        }
    };

    Instance.prototype.isComplete = function() {
        if (!this.hero.isAlive()) {
            console.log('hero dead');
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

        if (this.isComplete()) {
            onTick();
        } else {
            requestAnimFrame(this.run.bind(this));
        }

    };

    window.requestAnimFrame = (function(){
          return  window.requestAnimationFrame       || 
                  window.webkitRequestAnimationFrame || 
                  window.mozRequestAnimationFrame    || 
                  window.oRequestAnimationFrame      || 
                  window.msRequestAnimationFrame     || 
                  function(callback, element){
                    window.setTimeout(callback, 1000 / 60);
                  };
    })();

    document.onkeypress = function (e) {
      e = e || window.event;
      var charCode = e.charCode || e.keyCode,
      character = String.fromCharCode(charCode);
      
      if(character == 'w') {
        box.applyImpulse('Bobbeh', 270, parseInt(1000000));
      }
      if(character == 's') {
        box.applyImpulse('Bobbeh', 90, parseInt(1000000));
      }
      if(character == 'd') {
        box.applyImpulse('Bobbeh', 0, parseInt(1000000));
      }
      if(character == 'a') {
        box.applyImpulse('Bobbeh', 180, parseInt(1000000));
      }
    }
*/
});
