namespace.module('bot.events', function (exports, require) {

    var log = namespace.bot.log;

    function DirtyQueueClass() {
        this.obj = {};
    }

    DirtyQueueClass.prototype.mark = function(name) {
        if (this.obj[name]) {
            return;
        }
        this.obj[name] = true;
        var split = name.split(':');
        if (split.length > 1) {
            for (var i = 1; i < split.length; i++) {
                this.obj[split.slice(0, split.length - i).join(':')] = true;
            }
        }
    }

    DirtyQueueClass.prototype.triggerAll = function(eventObject) {
        log.debug('Triggering All Events');

        _.each(
            this.obj,
            function(value, key, list) {
                if (value) {
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
    window.EquipEvents = _.extend({}, Backbone.Events);
    window.UIEvents = _.extend({}, Backbone.Events);
    window.MessageEvents = _.extend({}, Backbone.Events);
});
