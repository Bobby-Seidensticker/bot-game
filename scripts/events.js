namespace.module('bot.events', function (exports, require) {

    // TODO rename window.Events to DirtyQueue  DirtyQueue.mark
    // TODO rename window.gevents to            DirtyListener
    // TODO initialize DirtyListener in this file, not in main.js

    var log = namespace.bot.log;

    function EventHolder() {
        this.obj = {};
    }

    EventHolder.prototype.mark = function(name) {
        this.obj[name] = true;
    }

    EventHolder.prototype.triggerAll = function(eventObject) {
        log.debug('Triggering All Events');

        _.each(
            this.obj,
            function(value, key, list) {
                if (value) {
                    if (key !== 'vis') {
                        log.debug('triggering event %s', key);
                    }
                    eventObject.trigger(key);
                    list[key] = false;
                }
            },
            this
        );
    }

    window.Events = new EventHolder();
});
