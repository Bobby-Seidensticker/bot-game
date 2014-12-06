namespace.module('bot.menu', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var MenuModel = Backbone.Model.extend({
        defaults: function() {
            return {
                selected: 0
            }
        },

        tabClick: function(index) {
            this.set('selected', index)
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

        events: {
            'click .tab': 'onClick'
        },

        render: function() {
            this.collection.each(function(tab) {
                var tabView = new TabView({model: tab});
                this.$('tr').append(tabView.render().el);
            }, this);
            return this;
        },

        initialize: function() {
        },

        onClick: function(event) {
            var oldTab = this.collection.where({'selected': true})[0];
            var newTab = this.collection.where({'name': event.target.id})[0];
            oldTab.set({'selected': false});
            newTab.set({'selected': true});

            log.info('Had selected %s, now selected %s',
                     oldTab.get('name'), newTab.get('name'));
        }
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
        var tabsView = new TabsView({collection: tabs});
        tabsView.render();
    }

    exports.extend({
        newMenu: newMenu,
        //MenuView: MenuView
    });

});