namespace.module('bot.log', function (exports, require) {

    exports.extend({
        'debug': debug,
        'info': info,
        'warning': warning,
        'error': error
    });

    function dateStr() {
        return (new Date()).toString().slice(4, -15);
    }

    function debug() {
        var a = arguments;
        a[0] = 'DEBUG ' + dateStr() + ' ' + a[0];
        console.log("%c" + sprintf.apply(null, a), "color:blue");
    }

    function info() {
        var a = arguments;
        a[0] = 'INFO ' + dateStr() + ' ' + a[0];
        console.log("%c" + sprintf.apply(null, a), "color: green");
    }

    function warning() {
        var a = arguments;
        a[0] = 'WARNING ' + dateStr() + ' ' + a[0];
        console.log("%c" + sprintf.apply(null, a), "color: yellow");
    }

    function error() {
        var a = arguments;
        a[0] = 'ERROR ' + dateStr() + ' ' + a[0];
        console.log("%c" + sprintf.apply(null, a), "color: red");
    }
});