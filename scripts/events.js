namespace.module('bot.events', function (exports, require) {

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
                    log.debug('triggering %s from key %s', value, key);
                    eventObject.trigger(key);
                    list[key] = false;
                }
            },
            this
        );
    }

    window.Events = new EventHolder();
});
