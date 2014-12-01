namespace.module('bot.controllers', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    exports.extend({
        'GameController': GameController,
    });

    function GameController(model) {
        this.model = model;
    }

    GameController.prototype.init = function(view) {
        this.view = view;

        this.view.resize();
        $(window).on('resize', this.view.resize.bind(this.view));

        this.model.dirty = true;
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