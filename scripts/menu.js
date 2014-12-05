namespace.module('bot.menu', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var MenuModel = Backbone.Model.extend({
        defaults: function() {
            return {
                selectedTab: 0
            }
        },

        tabClick: function(index) {
            this.set('selectedTab', index)
        }
    });

    var TabModel = Backbone.Model.extend({
        defaults: function() {
            return {visible: false};
        }
    });

    var TabCollection = Backbone.Collection.extend({
        model: TabModel
    });

    var TabsView = Backbone.View.extend({
        tagName: 'table',

        el: $('.menu'),

        render: function() {
            this.collection.each(function(tab) {
                var tabView = new TabView({model: tab});
                this.$('tr').append(tabView.render().el);
            }, this);
            return this;
        },

        initialize: function() {
            
        },
    });

    var TabView = Backbone.View.extend({
        tagName: 'td',

        render: function() {
            this.$el.attr({
                class: 'tab',
                id: this.model.get('name'),
            });
            this.$el.html(this.model.get('name'));
            //this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    function newMenu() {
        var tabs = new TabCollection([
                {name: 'map', selected: true},
                {name: 'inv', selected: false},
                {name: 'craft', selected: false},
                {name: 'lvlup', selected: false},
                {name: 'settings', selected: false},
        ]);
        var view = new TabsView({collection: tabs});

        view.render();
    }

    exports.extend({
        newMenu: newMenu,
        //MenuView: MenuView
    });

});