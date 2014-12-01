namespace.module('bot.eventqueue', function (exports, require) {

    require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var queue = new EventQueue();

    exports.extend({
        'add': queue.Add,
        'tick': queue.Tick,
    });

    // this is kinda janky

    function EventQueue() {
        this.q = [];
        this.ref = {};
    }

    EventQueue.prototype.Tick = function() {
        for (var i = 0; i < this.q.length; i++) {
            if (this.q[i] !== undefined) {
                this.q[i]();
            }
        }
    }

    EventQueue.prototype.Add = function(cb) {
        if (typeof(cb) !== 'function') {
            log.error('EventQueue.Add, given non function, %s nooping', cb);
            return
        }
        this.ref[cb] = this.q.length;
        this.q[this.q.length] = cb;
    }

    EventQueue.prototype.Remove = function(cb) {
        this.q[this.ref[cb]] = undefined;
        delete this.ref[cb];
    }

});
