namespace.module('bot.menu', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;

    var TAB_NAMES = ['map', 'inv', 'craft', 'lvlup', 'settings'];

    var TabModel = Backbone.Model.extend({
        defaults: {
            'selTab': 0,
        }
    });

    var TabView = Backbone.View.extend({
        model: new TabModel(),

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
        TabView: TabView
    });

});
