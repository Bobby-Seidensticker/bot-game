namespace.module('bot.window', function (exports, require) {

    var log = namespace.bot.log;
    var prob = namespace.bot.prob;

    var HeaderView = Backbone.View.extend({
        el: $('.header'),

        initialize: function() {
            log.warning('headerview init');
            $(window).on('resize', this.resize.bind(this));
            this.resize();
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: ss[0] - 400 - 10,
                height: 150 - 10,
                left: 0,
                top: 0
            });
        }
    });

    var MenuView = Backbone.View.extend({
        el: $('.menu'),

        initialize: function() {
            log.warning('menuview init');
            $(window).on('resize', this.resize.bind(this));
            this.resize();
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: 400 - 10,
                height: ss[1] - 10,
                left: ss[0] - 400,
                top: 0
            });
            this.$('.menu-holder').css({
                height: ss[1] - 55
            });
        }
    });

    var REAL_SIZE = 200;
    var SIZE = 1000 * 1000;
    var RATIO = REAL_SIZE / SIZE;

    var VisView = Backbone.View.extend({
        el: $('.vis'),

        // this needs to get all zones, when game model changes, probably shoudl get all of gameModel
        initialize: function(options, gameModel) {
            log.warning('visview init');
            this.m = gameModel;

            this.$canvas = $('<canvas width=100 height=100></canvas>');
            this.$el.append(this.$canvas);

            $(window).on('resize', this.resize.bind(this));
            this.resize();

            this.listenTo(window.DirtyListener, 'vis', this.redraw.bind(this));
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: ss[0] - 400 - 10,
                height: ss[1] - 150 - 10,
                left: 0,
                top: 150
            });
            this.clear();
            if (this.m.get('running')) {
                this.redraw();
            }
        },

        clear: function() {
            this.$canvas.attr({
                width: REAL_SIZE,
                height: REAL_SIZE
            });
            this.$canvas.css({
                top: this.$el.height() / 2 - REAL_SIZE / 2 - 1,
                left: this.$el.width() / 2 - REAL_SIZE / 2 - 1
            });
        },

        transpose: function(coords) {
            return [coords[0] * RATIO, coords[1] * RATIO];
        },

        redraw: function() {
            this.clear();
            var ctx = this.$canvas[0].getContext('2d');

            var cpos = this.transpose(this.m.hero.getCoords());

            circle(ctx, cpos, '#32E');

            var zone = this.m.zone;
            if (zone && zone.getCurrentRoom) {
                var monsters = zone.getCurrentRoom().monsters;
                monsters.each(function(mon, i) {
                    if (mon.isAlive()) {
                        var pos = this.transpose(mon.getCoords());
                        if (mon.get('color') === undefined) {
                            mon.set('color', prob.randColor('#E12', 60));
                        }
                        circle(ctx, pos, mon.get('color'));
                    }
                }, this);
            }
            this.m.set('dirty', false);
        },
    });

    function circle(ctx, pos, color) {
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }

    var MessagesView = Backbone.View.extend({
        el: $('.messages'),

        initialize: function() {
            log.error('MessagesView init, this.collection === undefined = %s', (this.collection === undefined).toString());
            $(window).on('resize', this.resize.bind(this));
            this.resize();
            this.listenTo(this.collection, 'pruned', this.render);
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight];
            this.$el.css({
                width: 300,
                height: ss[1] - 150 - 10,
                left: ss[0] - 400 - 10 - 300,
                top: 150,
                'z-index': 10
            });
            this.render();
        },

        render: function() {
            var html = '<p>' + this.collection.pluck('message').join('</p>\n<p>') + '</p>'
            log.info('messagesView html: %s', html);
            this.$el.html(html);
        }
    });


    // could make a library that wraps a canvas context.
    // Need to probably get drawing into non-dom canvases for speedup.  At very least for projectiles

    /*
    var ZoneView = Backbone.View.extend({
        tagName: 'table',

        initialize: function() {
            
        },


        $(window).on('resize', this.resize.bind(this));
    });*/

    function ceilRatio(a, b) {
        return Math.ceil(a) + ' / ' + Math.ceil(b);
    }

    function twoRatio(a, b) {
        return a.toFixed(2) + ' / ' + b.toFixed(2);
    }

    function two(a) {
        return a.toFixed(2);
    }

    var entity;
    var EntityView = Backbone.View.extend({
        tagName: 'table',

        template: _.template($('#kv-table-template').html()),

        initialize: function(options) {
            
        },

        render: function() {
            var skill;
            var data = {};
            var body = this.model;
            var spec = body.spec;

            data.body = [
                ['name', spec.name],
                ['level', spec.level],
                ['hp', twoRatio(body.hp, spec.maxHp)],
                ['mana', twoRatio(body.mana, spec.maxMana)],
                ['xp', twoRatio(spec.xp, spec.nextLevelXp)],
                ['pos/10k', '[' + Math.round(body.x / 10000) + ', ' + Math.round(body.y / 10000) + ']']
            ];

            for (var i = 0; i < this.model.skills.length; i++) {
                var arr = [];
                skill = this.model.skills[i];
                _.each(entity.dmgKeys, function(key) {
                    arr.push([key, skill.spec[key].toFixed(2)]);
                });
                arr.push(['cool in', skill.coolAt - window.time]);
                data[skill.spec.name] = arr;
            }

            data.spec = [];
            var specKeys = entity.defKeys.concat(entity.eleResistKeys);
            var key;
            for (var i = 0; i < specKeys.length; i++) {
                key = specKeys[i];
                  data.spec.push([key, this.model.spec[key].toFixed(2)]);
            }

            this.$el.html(this.template({data: data}));
            return this;
        },
    });

    var GameView = Backbone.View.extend({
        el: $('body'),

        initialize: function(game) {
            log.info('GameView initialize');

            entity = namespace.bot.entity;
            //var specKeys = entity.attrKeys.concat(entity.defKeys).concat(entity.eleResistKeys).concat(entity.dmgKeys);
            //specKeys = ['name', 'level', 'team', 'xp', 'nextLevelXp'].concat(specKeys);

            this.zone = game.zone;
            this.last = {};
            this.heroView = new EntityView({model: this.zone.hero});;
            this.render();

            this.listenTo(window.DirtyListener, 'tick', this.render);
            
            //var zone = new ZoneView({model: this.game.zone});
            /*

            this.headerView = new HeaderView();
            this.menuView = new MenuView();
            this.visView = new VisView({}, options.gameModel);
            this.messagesView = new MessagesView({collection: options.messageCollection});*/
        },

        diffs: function() {
            return {
                inst_uid: this.zone.iuid,
                heroPos: this.zone.heroPos,
                liveMonsCount: this.zone.liveMons().length
            };
        },

        render: function() {
            var diffs = this.diffs();
            var sameEntities = _.every(diffs, function(value, key) { return this.last[key] === value; }, this);

            if (sameEntities) {
                this.heroView.render();
                _.invoke(this.monsterViews, 'render');
            } else {
                var frag = document.createDocumentFragment();
                frag.appendChild(this.heroView.render().el);

                this.monsterViews = [];
                var livingMons = this.zone.liveMons();
                for (var i = 0; i < livingMons.length; i++) {
                    this.monsterViews.push(new EntityView({model: livingMons[i]}));
                    frag.appendChild(this.monsterViews[i].render().el);
                }
                this.$el.html(frag);
            }
        },
    });

    exports.extend({
        GameView: GameView
    });
});
