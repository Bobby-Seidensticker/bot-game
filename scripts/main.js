namespace.module('bot.main', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var itemref = namespace.bot.itemref;

    var views = namespace.bot.views;
    //var models = namespace.bot.models;
    //var controls = namespace.bot.controls;

    var game;

    exports.extend({
        'onReady': onReady
    });

    function onReady() {
        tests();

        var data;
        data = localStorage['char'];

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
        log.info("TESTS COMPLETE\n\n");
    }

    function ensureProps(obj) {
        for (var i = 1; i < arguments.length; i++) {
            if (!(arguments[i] in obj)) {
                return false;
            }
        }
        return true
    }

    function loadRawData(data) {
        var d;

        try {
            d = JSON.parse(data);
            fucked = false
            if (!('chars' in d)) { fucked = true; }
            if (!('inventory' in d)) { fucked = true; }
            if (!ensureProps(d['inventory'], 'weapons', 'armor', 'skills', 'affixes', 'mats')) { fucked = true; }
            if (fucked) {
                throw('loadRawData: fucked');
            }
        }
        catch (e) {
            if (data === undefined) {
                log.info('models.loadRawData(), No data in localStorage reverting to default');
            } else {
                log.error('models.loadRawData(), Tried to parse corrupt JSON, given %s, reverting to default', data);
            }
            d = {
                chars: [{name: 'bobbeh'}],
                inv: {
                    weapons: [],
                    armor: [],
                    skills: [],
                    affixes: [],
                    mats: []
                }
            };
        }

        return d;
    }

    function Game() {
        this.view = new views.GameView();
        this.view.resize();
        $(window).on('resize', this.view.resize.bind(this.view));

        this.data = loadRawData(localStorage['char']);

        console.log(this.data);
        //log.info('data from ls: ', JSON.stringify(this.data));

        this.tabs = new Tabs(this.data);
        this.tabs.init();

        this.map = new Map({});
        this.map.init();
        this.inv = new Inv(this.data.inv);
        this.inv.init();
        this.craft = new Craft({});
        this.craft.init();
        this.lvlup = new Lvlup({});
        this.lvlup.init();
        this.settings = new Settings({});
        this.settings.init();

        this.chars = [];
        for (var i = 0; i < this.data.chars.length; i++) {
            this.chars[i] = new Char(this.data.chars[i], this.inv);
            this.data.chars[i].focus = i === 0;
            this.chars[i].init();
        }
    }

    Game.prototype.init = function (data) {
    }

    Game.prototype.tick = function() {
    }


    function Char(data, inv) {
        this.data = data;
        this.inv = inv;

        this.$header = $('.header');
        this.$tabs = $('.tabs');
        this.statsTmpl = $('#header-stats-tmpl').html();
    }

    Char.prototype.init = function() {
        this.data.focused = this.data.focus ? '' : 'closed';
        this.$statsView = $(Mustache.render(this.statsTmpl, this.data));
        this.$header.append(this.$statsView);
    }

    Char.prototype.toggle = function() {
        this.$view.toggleClass('closed');
    }

    function Tabs(data) {
        this.data = data;
    }

    Tabs.prototype.init = function() {
        this.tabs = ['map', 'inv', 'craft', 'lvlup', 'settings'].map(function(x) {
            return $('#' + x);
        });
        this.contents = ['map', 'inv', 'craft', 'lvlup', 'settings'].map(function(x) {
            return $('#' + x + '-content-holder');
        });
        for (var i = 0; i < this.tabs.length; i++) {
            this.tabs[i].on('click', function(eleIndex) {
                console.log('Click on element ' + eleIndex);
                for (var i = 0; i < this.tabs.length; i++) {
                    if (i === eleIndex) {
                        this.contents[i].removeClass('closed');
                    } else {
                        this.contents[i].addClass('closed');
                    }
                }
            }.curry(i).bind(this));
        }
    }

    function Map(data) {
        this.data = data;

        this.$ele = $('#map-content-holder');
        this.tmpl = $('#map-tab-tmpl').html();
    }

    Map.prototype.init = function() {
        this.$ele.append(Mustache.render(this.tmpl, this.data));
    }

    function Inv(data, $ele, tmpl) {
        this.data = data;

        this.$ele = $('#inv-content-holder');
        this.tmpl = $('#inv-tab-tmpl').html();
    }

    Inv.prototype.init = function() {
        this.$ele.append(Mustache.render(this.tmpl, this.data));
    }

    function Craft(data) {
        this.data = data;

        this.$ele = $('#craft-content-holder');
        this.tmpl = $('#craft-tab-tmpl').html();
    }

    Craft.prototype.init = function() {
        this.$ele.append(Mustache.render(this.tmpl, this.data));
    }

    function Lvlup(data) {
        this.data = data;

        this.$ele = $('#lvlup-content-holder');
        this.tmpl = $('#lvlup-tab-tmpl').html();
    }

    Lvlup.prototype.init = function() {
        this.$ele.append(Mustache.render(this.tmpl, this.data));
    }

    function Settings(data) {
        this.data = data;

        this.$ele = $('#settings-content-holder');
        this.tmpl = $('#settings-tab-tmpl').html();
    }

    Settings.prototype.init = function() {
        this.$ele.append(Mustache.render(this.tmpl, this.data));
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
