namespace.module('bot.views', function (exports, require) {

    /*var funcs = */require('org.startpad.funcs').patch();

    exports.extend({
        'init': init
    });

    var log = require('bot.log');
    var view;

    function SuperView(model) {
        var i;

        this.user = new User($('.user'), model);
        this.chars = [];
        for (i = 0; i < model.chars.length; i++) {
            this.chars[i] = new Char($('.char'), model.chars[i]);
        }
        this.vis = new Vis($('.vis'), model);
    }

    SuperView.prototype.resize = function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var i;

        log.info('onResize, width: %d, height: %d', width, height);

        this.user.resize(width, height);
        for (i = 0; i < this.chars.length; i++) {
            this.chars[i].resize(width, height);
        }
        this.vis.resize(width, height);
    }

    SuperView.prototype.update = function() {
        log.info('SuperView.update called');
    }

    function View($ele, model) {
        log.info('View\'s constructor called');
        this.$ele = $ele;
        this.model = model;
    }

    View.prototype.setSizeLoc = function(width, height, left, top) {
        this.$ele.css('width', width);
        this.$ele.css('height', height);
        this.$ele.css('left', left);
        this.$ele.css('top', top);
    }

    function Char($ele, model) {
        log.info('Char\'s constructor called');
        View.call(this, $ele, model);
    }
    /*function Char($ele, model) {
        this.$ele = $ele;
        this.model = model;
    }*/

    Char.subclass(View);

    Char.prototype.resize = function(width, height) {
        this.setSizeLoc(
            width - 400 - 10, 150 - 10,
            0, 0);
    }

    function User($ele, model) {
        log.info('User\'s constructor called');
        View.call(this, $ele, model);
    }

    User.subclass(View);

    User.prototype.resize = function(width, height) {
        this.setSizeLoc(
            400 - 10, height - 10,
            width - 400, 0);
    }

    function Vis($ele, model) {
        log.info('Vis\'s constructor called');
        View.call(this, $ele, model);
    }

    Vis.subclass(View);

    Vis.prototype.resize = function(width, height) {
        this.setSizeLoc(
            width - 400 - 10, height - 150 - 10,
            0, 150);
    }

    function init(model) {
        view = new SuperView(model);

        $(window).on('resize', view.resize.bind(view));
        view.resize();
    }

    function update() {
        view.update();
    }
});