namespace.module('bot.menu', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var TAB_NAMES = ['map', 'inv', 'craft', 'lvlup', 'settings'];

    /*
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
                var tabView = new TabView({model: tab, $el: this.$('#' + tab.get('name'))});
                //this.$('tr').append(tabView.render().el);
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

    var MenusView = Backbone.View.extend({
        events: {
            'click .tab': 'onClick'
        },

        render: function() {
            this.collection.each(function(tab) {
                var tabView = new TabView({model: tab, $el: this.$('#' + tab.get('name'))});
                //this.$('tr').append(tabView.render().el);
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

    var MenuView = Backbone.View.extend({
        tagName: 'div',

        render: function() {
            this.$el.attr({
                class: this.model.get('name') + '-menu'
            });
            this.$el.html(this.model.get('name') + '-menu');
            this.holder.html(this.$el);
        }
    });

    function newMenu() {
        var mapTab = new TabModel({name: 'map', selected: true});
        var invTab = new TabModel({name: 'inv', selected: false});

        var mapTabView = new TabView({model: mapTab, el: $('#map')})
        



        var tabs = new TabCollection([
                {name: 'map', selected: true},
                {name: 'inv', selected: false},
                {name: 'craft', selected: false},
                {name: 'lvlup', selected: false},
                {name: 'settings', selected: false},
        ]);
        var tabsView = new TabsView({collection: tabs});
        tabsView.render();

        //var menusView = new MenusView({collection: tabs});
        //menusView.render();
    }*/

    var MenuModel = Backbone.Model.extend({
        defaults: {
            'selTab': 0,
        }
    });

    var MenuView = Backbone.View.extend({
        model: new MenuModel(),

        el: $('.menu'),

        events: {
            'click .tab': 'onTabClick',
        },

        // needs to be given {collection: CharCollection}
        initialize: function() {
            //this.$menuHolder = this.$('.menu-holder');
            this.$subMenus = this.$('.sub-menu');
            this.listenTo(this.model, 'change:selTab', this.render);
            this.render();
        },

        render: function() {
            var selTab = this.model.get('selTab');
            this.$subMenus.each(function(index, element) {
                if (selTab === index) {
                    $(element).removeClass('closed');
                } else {
                    $(element).addClass('closed');
                }
            });
            return this;
        },

        onTabClick: function(event) {
            var prefix = event.target.id.split('-')[0];
            this.model.set('selTab', TAB_NAMES.indexOf(prefix));
        },
    });


    exports.extend({
        //newMenu: newMenu,
        MenuView: MenuView
    });

});

/*
menu
tab
sub-tab

MenuModel

  MenuModel
   tabSelected
   charSelected
   name
   
  TabView
   has MenuModel
   
  


var i = 0;
var j = 0;
for (tab in ['map', 'inv', 'craft', 'lvlup', 'settings']) {
    for (charModel in chars) {
        var model = new MenuModel({'name': tab, 'tabSelected': i === 0, 'charSelected': j === 0});
        
        
        j++;
    }
    j = 0;
    i++;
}*/