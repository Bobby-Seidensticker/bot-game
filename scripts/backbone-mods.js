$(function() {
    var Model = gl.Model = function() {
        this.id = _.uniqueId('m');
        this.initialize.apply(this, arguments);
    };

    _.extend(gl.Model.prototype, Backbone.Events, {
        initialize: function() {}
    });

    Model.extend = Backbone.Model.extend;
}());
