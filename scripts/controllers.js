namespace.module('bot.controllers', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var views = namespace.bot.views;

    exports.extend({
        'GameController': GameController,
    });

    function GameController(model, view) {
        this.model = model;
        this.view = view;
    }

    GameController.prototype.init = function() {
        this.view.resize();
        $(window).on('resize', this.view.resize.bind(this.view));

        this.model.dirty = true;
        this.view.init();
    }

    function CharController(model) {
        this.model = model;
    }

    CharController.prototype.init = function(view) {
        this.view = view;
        this.model.dirty = true;
    }


    function InventoryController(model) {
        this.model = model;
    }

    InventoryController.prototype.init = function(view) {
        this.view = view;
        this.model.dirty = true;
    }

});