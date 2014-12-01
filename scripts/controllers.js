namespace.module('bot.controllers', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    exports.extend({
        'GameController': GameController,
    });

    function GameController(model, view) {
        this.model = model;
        this.view = view;

        $(window).on('resize', view.resize.bind(view));
        view.resize();
        this.model.dirty = true;
    }

    GameController.prototype.

    function init() {}

    function tick() {}

});