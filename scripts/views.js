namespace.module('bot.views', function (exports, require) {

    require('org.startpad.funcs').patch();

    exports.extend({
        'init': init,
        'tick': tick
    });

    var log = require('bot.log');

    function GameView(controller) {
        this.controller = controller;

        this.$user = $('.user');
        this.$char = $('.char');
        this.$vis = $('.vis');
    }

    GameView.prototype.init = function(chars) {
        var i, c, charTmpl, mainTmpl, visTmpl;

        this.mainTmpl = $('#game-main-menu-tmpl').html();
        Mustache.parse(this.mainTmpl);
        this.$user.append(Mustache.render(this.mainTmpl, {}));

        this.charTmpl = $('#char-tmpl').html();
        Mustache.parse(this.charTmpl);
        for (i = 0; i < chars.length; i++) {
            this.newChar(chars[i]);
        }

        this.visTmpl = $('#vis-tmpl').html();
        Mustache.parse(this.visTmpl);
        this.$vis.append(Mustache.render(this.visTmpl, {}));
    }

    GameView.prototype.newChar = function(c) {
        this.$char.append(Mustache.render(this.charTmpl, {"name": c.name}));
    }

    GameView.prototype.resize = function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var i;

        log.info('onResize, width: %d, height: %d', width, height);

        this.setSizeLoc(this.$char,
            width - 400 - 10, 150 - 10,
            0, 0);

        this.setSizeLoc(this.$user,
            400 - 10, height - 10,
            width - 400, 0);

        this.setSizeLoc(this.$vis,
            width - 400 - 10, height - 150 - 10,
            0, 150);
    }

    GameView.prototype.update = function() {
        log.info('GameView.update called');
    }

    GameView.prototype.setSizeLoc = function($ele, width, height, left, top) {
        $ele.css('width', width);
        $ele.css('height', height);
        $ele.css('left', left);
        $ele.css('top', top);
    }

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
    }
});