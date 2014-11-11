namespace.module('bot.views', function (exports, require) {
    //var funcs = require('org.startpad.funcs').patch();

    exports.extend({
        'init': init
    });

    var log = require('bot.log');

    var view;

    function setSizeLoc($ele, width, height, left, top) {
        $ele.css('width', width);
        $ele.css('height', height);
        $ele.css('left', left);
        $ele.css('top', top);
    }

    function View($char, $vis, $user) {
        log.info('Initializing new View, given %s %s %s', $char, $vis, $user);
        this.$char = $char;
        this.$vis = $vis;
        this.$user = $user;
        return this;
    }

    View.prototype.resize = function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        log.info('onResize, width: %d, height: %d, char: %s, vis: %s, user: %s', width, height, this.$char, this.$vis, this.$user);

        setSizeLoc(this.$char,
                   width - 400 - 10, 150 - 10,
                   0, 0);
        setSizeLoc(this.$vis,
                   width - 400 - 10, height - 150 - 10,
                   0, 150);
        setSizeLoc(this.$user,
                   400 - 10, height - 10,
                   width - 400, 0);
    }

    function init() {
        view = new View($('.char'), $('.vis'), $('.user'));

        $(window).on('resize', view.resize.bind(view));
        view.resize();
    }
});