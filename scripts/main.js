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
                itemref.expand('weapon', 'wooden sword'),
                itemref.expand('weapon', 'shitty bow'),
                itemref.expand('weapon', 'magic stick')
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
            'mats': []
        };
        return inv;
    }

    function Game() {
        this.view = new views.GameView();
        this.view.resize();
        $(window).on('resize', this.view.resize.bind(this.view));

        this.model = loadModel();

        console.log(this.model);
        //log.info('model from ls: ', JSON.stringify(this.model));

        this.tabs = new Tabs(this.model);
        this.tabs.init();

        this.map = new Map({});
        this.map.init();
        this.inv = new Inv(this.model.inv);
        this.inv.init();
        this.craft = new Craft({});
        this.craft.init();
        this.lvlup = new Lvlup({});
        this.lvlup.init();
        this.settings = new Settings({});
        this.settings.init();

        this.chars = [];
        for (var i = 0; i < this.model.chars.length; i++) {
            this.chars[i] = new Char(this.model.chars[i], this.inv);
            this.model.chars[i].focus = i === 0;
            this.chars[i].init();
        }
    }

    Game.prototype.init = function (model) {
    }

    Game.prototype.tick = function() {
    }


    function Char(model, inv) {
        this.model = model;
        this.inv = inv;

        this.$header = $('.header');
        this.$tabs = $('.tabs');
        this.statsTmpl = $('#header-stats-tmpl').html();
    }

    Char.prototype.init = function() {
        this.model.focused = this.model.focus ? '' : 'closed';
        this.$statsView = $(Mustache.render(this.statsTmpl, this.model));
        this.$header.append(this.$statsView);
    }

    Char.prototype.toggle = function() {
        this.$view.toggleClass('closed');
    }

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
            tmplData.weapons += makeInvItem(this.model.weapons[i]);
        }

        for (var i = 0; i < this.model.skills.length; i++) {
            tmplData.skills += makeInvItem(this.model.skills[i]);
        }

        for (var i = 0; i < this.model.armor.length; i++) {
            tmplData.armor += makeInvItem(this.model.armor[i]);
        }

        this.$ele = $(Mustache.render($('#inv-tab-tmpl').html(), tmplData));

        this.$dest.append(this.$ele);
    }

    Inv.prototype.init = function() {
        //this.$dest.append(Mustache.render(this.tmpl, this.model));
    }

    Inv.prototype.newItem = function(type, name) {
        var dest = this.model[type];
        dest[dest.length] = makeInvItem(itemref.expand(type, name));
    }

    function makeInvItem(model) {
        model.renderedAffixes = '';
        for (var i = 0; i < model.affixes.length; i++) {
            model.renderedAffixes += Mustache.render($('#inv-tab-item-affix-tmpl').html(), {'str': model.affixes[i]});
        }
        log.info("makeInvItem, model: %s", JSON.stringify(model));
        return Mustache.render($('#inv-tab-item-tmpl').html(), model);
    }


    function Craft(model) {
        this.model = model;

        this.$dest = $('#craft-content-holder');
        this.tmpl = $('#craft-tab-tmpl').html();
    }

    Craft.prototype.init = function() {
        this.$dest.append(Mustache.render(this.tmpl, this.model));
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
