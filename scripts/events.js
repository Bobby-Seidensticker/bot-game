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

    gl.DirtyQueue = new DirtyQueueClass();

    gl.DirtyListener = _.extend({}, Backbone.Events);

    gl.GameEvents = _.extend({}, Backbone.Events);
    gl.ItemEvents = _.extend({}, Backbone.Events);
    gl.EquipEvents = _.extend({}, Backbone.Events);
    gl.UIEvents = _.extend({}, Backbone.Events);
    gl.MessageEvents = _.extend({}, Backbone.Events);
});
