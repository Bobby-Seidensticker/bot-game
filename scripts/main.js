namespace.module('bot.main', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var prob = namespace.bot.prob;
    var log = namespace.bot.log;

    var itemref = namespace.bot.itemref;
    var storage = namespace.bot.storage;

    var views = namespace.bot.views;
    var models = namespace.bot.models;
    var control = namespace.bot.control;

    var user;


    exports.extend({
        'onReady': onReady
    });

    function onReady() {
        tests();



        var data = localStorage['char'];
        models.init(data);
        views.init(models.model);
        control.init(models.model);

        
    }

    

    function tests() {
        itemref.expand('test', 'harf');
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
