namespace.module('bot.views', function (exports, require) {

    require('org.startpad.funcs').patch();

    exports.extend({
        'GameView': GameView
    });

    var log = require('bot.log');

    function GameView() {
        this.$tabs = $('.tabs');
        this.$header = $('.header');
        this.$vis = $('.vis');
    }

    GameView.prototype.resize = function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var i;

        log.info('onResize, width: %d, height: %d', width, height);

        this.setSizeLoc(this.$header,
                        width - 400 - 10, 150 - 10,
                        0, 0);

        this.setSizeLoc(this.$tabs,
                        400 - 10, height - 10,
                        width - 400, 0);

        this.setSizeLoc(this.$vis,
                        width - 400 - 10, height - 150 - 10,
                        0, 150);
    }

    GameView.prototype.setSizeLoc = function($ele, width, height, left, top) {
        $ele.css('width', width);
        $ele.css('height', height);
        $ele.css('left', left);
        $ele.css('top', top);
    }

    /*
    function CharView(model) {
        this.model = model;
        // this is wrong:
        // this.$ele = $('.char');
        // need to get the correct div out of the many divs
    }

    CharView.prototype.init = function(controller) {
        this.controller = controller;
        // stuff
    }

    // decorator for this?  probs not
    CharView.prototype.onTick = function() {
        if (!this.model.dirty) {
            // not dirty, get out
            return;
        }

        // update the interface

        this.model.dirty = false;
    }

    function InventoryView(model) {
        this.model = model;
        //this.$ele = $('.inv'); wrong
    }

    InventoryView.prototype.init = function(controller) {
        this.controller = controller;
    }

    InventoryView.prototype.onTick = function() {
        if (!this.model.dirty) {
            return;
        }

        this.model.dirty = false;
    }*/
});