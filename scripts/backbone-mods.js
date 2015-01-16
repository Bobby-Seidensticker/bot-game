var Model = window.Model = function() {
    this.id = _.uniqueId('m');
    this.initialize.apply(this, arguments);
};

_.extend(window.Model.prototype, Backbone.Events, {
    initialize: function() {}
});

Model.extend = Backbone.Model.extend;

/*
var Collection = window.Collection = function() {
    // TODO we will encounter issues if we try storing the id in localStorage and then using _.uniqueId to generate a new id, can collide
    this.id = _.uniqueId('c');
    this._reset();
    this.initialize.apply(this, arguments);
};

_.extend(window.Collection.prototype, Backbone.Events, {
    initialize: function() {},

    // Add a single fully formed window.Model to this collection
    add: function(model) {
        this.models.push(model);
        this.length = this.models.length;
    },

    // Remove a single fully formed window.Model to this collection
    remove: function(model) {
        if (!model) { return false; }
        var i, l, index;
        for (i = 0, l = this.length; i < l; i++) {
            if (this.models[i].id === model.id) {
                delete this._byId[model.id];
                this.models.splice(i, 1);
                this.length = this.models.length;
                return true;
            }
        }
        return false;
    },

    push: function(model) {
        this.add(model);
    },

    pop: function() {
        return this.remove(this.at(this.length - 1));
    },

    unshift: function(model) {
        this.models.unshift(model);
        this.length = this.models.length;
    },

    shift: function() {
        if (this.length > 0) {
            return this.models.shift();
        }
        this.length = this.models.length;
    },

    _reset: function() {
        this.length = 0;
        this.models = [];
        this._byId  = {};
    },
    
});

Collection.extend = Backbone.Collection.extend;

var array = [];
var slice = array.slice;

// Underscore methods that we want to implement on the Collection.
// 90% of the core usefulness of Backbone Collections is actually implemented
// right here:
var methods = [
    'forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample'];

// Mix in each Underscore method as a proxy to `Collection#models`.
_.each(methods, function(method) {
    Collection.prototype[method] = function() {
        var args = slice.call(arguments);
        args.unshift(this.models);
        return _[method].apply(_, args);
    };
});

// Underscore methods that take a property name as an argument.
var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

// Use attributes instead of properties.
_.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
        var iterator = _.isFunction(value) ? value : function(model) {
            return model.get(value);
        };
        return _[method](this.models, iterator, context);
    };
});
*/