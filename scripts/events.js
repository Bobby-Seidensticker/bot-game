namespace.module('bot.events', function (exports, require) {

    var log = namespace.bot.log;

    function DirtyQueueClass() {
        this.obj = {};
    }

    DirtyQueueClass.prototype.mark = function(name) {
        this.obj[name] = true;
    }

    DirtyQueueClass.prototype.triggerAll = function(eventObject) {
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

    window.DirtyQueue = new DirtyQueueClass();

    window.DirtyListener = _.extend({}, Backbone.Events);

    window.GameEvents = _.extend({}, Backbone.Events);
    window.ItemEvents = _.extend({}, Backbone.Events);
    window.UIEvents = _.extend({}, Backbone.Events);
});
