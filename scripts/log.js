namespace.module('bot.log', function(exports, require) {

    var uid = localStorage.getItem('uid');

    if (uid === null) {
        uid = Math.floor(Math.random() * 100000000);
        localStorage.setItem('uid', uid);
        localStorage.getItem('uid');
    } else {
        warning('UID found in localStorage, resuming session');
    }

    gl.FB = new Firebase('https://fiery-heat-4226.firebaseio.com');

    gl.FB.authAnonymously(function(error, authData) {
        if (error) {
            console.log('anon login failed', error);
            gl.FBuid = 'failedauth';
            gl.FBL = gl.FB.child('logs').child(uid);
            gl.FBL.child('logs').push('starting with failed auth');
        } else {
            //info('Good anon auth: %s', authData.uid);
            gl.FBuid = authData.uid.slice(11);
            gl.FBL = gl.FB.child(gl.VERSION_NUMBER).child('logs').child(uid);
            gl.FBUI = gl.FBL.child('UI');
            gl.FBL.child('logs').push('starting');
        }
    });

    var LEVEL = 'UI';

    var FNS = [debug, info, UI, warning, error, stack];

    var NAMES = ['debug', 'info', 'UI', 'warning', 'error', 'stack'];

    var extender = {};
    var clear = false;

    for (var i = 0; i < FNS.length; i++) {
        if (clear || LEVEL === NAMES[i]) {
            extender[NAMES[i]] = FNS[i];
            clear = true;
            //console.log(NAMES[i], ' clear');
        } else {
            extender[NAMES[i]] = function() {};
        }
    }

    exports.extend(extender);

    function fileLine() {
        var s = new Error().stack.split('\n')[3];
        return s.slice(s.indexOf('(') + 1, s.length - 1);
    }

    function dateStr() {
        return (new Date()).toString().slice(4, -15);
    }

    function debug() {
        var a = arguments;
        a[0] = 'DEBUG ' + fileLine() + ' ' + a[0];
        console.log('%c' + sprintf.apply(null, a), 'color: blue');
    }

    function info() {
        var a = arguments;
        a[0] = 'INFO ' + fileLine() + ' ' + a[0];
        console.log('%c' + sprintf.apply(null, a), 'color: green');
    }

    function warning() {
        var a = arguments;
        /*if (gl.FBL) {
            gl.FBL.push("WARNING: " + sprintf.apply(null,a) + "  @" + gl.time);
        }*/
        a[0] = 'WARNING ' + fileLine() + ' ' + a[0];
        console.log('%c' + sprintf.apply(null, a), 'color: orange');
    }

    function error() {
        var a = arguments;
        if (gl.FBL) {
            gl.FBL.child('logs').push('ERROR:' + sprintf.apply(null, a) + '  @' + gl.time);
        }
        a[0] = 'ERROR ' + fileLine() + ' ' + a[0];
        console.log('%c' + sprintf.apply(null, a), 'color: red');

    }

    //  call with 'log.line(new Error(), 'your text here');
    function stack() {
        var a = arguments;
        a[0] = new Error().stack.replace(/   at /g, '').split('\n').slice(2).join('\n') + '\n  ' + a[0];
        console.log('%c' + sprintf.apply(null, a), 'color: purple');
    }

    function UI() {
        var a = arguments;
        /*if (gl.FBUI) {
            gl.FBUI.push("UI:" + sprintf.apply(null,a) + "  @" + gl.time);
        }*/
        a[0] = 'UI: ' + fileLine() + ' ' + a[0];
        console.log('%c' + sprintf.apply(null, a), 'color: cyan');
    }
});
