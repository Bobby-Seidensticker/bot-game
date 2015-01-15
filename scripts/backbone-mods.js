var Model = window.Model = function() {
    this.initialize.apply(this, arguments);
};

_.extend(window.Model.prototype, Backbone.Events, {
    initialize: function() {}
});

Model.extend = Backbone.Model.extend;