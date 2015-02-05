namespace.module('bot.vis', function (exports, require) {

    /*
      TODO:
      Vis view's el is a div
      Make BackgroundView its own el=canvas view
      Make EntityView its own el=canvas view
      Make canvas full screen, abs positioned
      OnResize adjust namespace global RATIO, REAL_SIZE so the max dimension is the min size of the screen
    */


    var log = namespace.bot.log;

    var VisView = Backbone.View.extend({
        tagName: 'div',
        className: 'vis',

        // this needs to get all zones, when game model changes, probably should get all of gameModel
        initialize: function(options, game) {
            log.warning('visview init');
            this.zone = game.zone;

            this.bg = new BackgroundView({}, game);
            this.entity = new EntityView({}, game);

            $(window).on('resize', this.resize.bind(this));
            this.resize();

            this.$el.append(this.bg.render().el);
            this.$el.append(this.entity.render().el);
            
            this.listenTo(gl.DirtyListener, 'tick', this.render);
        },

        resize: function() {
            this.size = [window.innerWidth, window.innerHeight - 155];
            this.$el.css({
                width: this.size[0],
                height: this.size[1]
            });
            this.bg.resize();
            this.entity.resize();
        },

        render: function() {
            this.bg.render();
            this.entity.render();
            return this;
        },
    });


    function transpose(coords) {
        return [coords[0] * RATIO, coords[1] * RATIO];
    }

    var REAL_SIZE = 300;
    var SIZE = 1000 * 1000;
    var RATIO = REAL_SIZE / SIZE;


    var BackgroundView = Backbone.View.extend({
        tagName: 'canvas',
        className: 'bg',

        initialize: function(options, game) {
            log.warning('bg view init');
            this.zone = game.zone;

            this.resize();
            this.listenTo(gl.DirtyListener, 'tick', this.render);
        },

        resize: function() {
            this.size = [window.innerWidth, window.innerHeight - 155];
            this.$el.attr({
                width: this.size[0],
                height: this.size[1]
            });
        },

        render: function() {
            this.resize();
            return this;
        },
    });

    var EntityView = Backbone.View.extend({
        tagName: 'canvas',
        className: 'entity',

        initialize: function(options, game) {
            log.warning('visview init');
            this.zone = game.zone;

            this.resize();
            this.listenTo(gl.DirtyListener, 'tick', this.render);
        },

        resize: function() {
            this.size = [window.innerWidth, window.innerHeight - 155];
            this.$el.attr({
                width: this.size[0],
                height: this.size[1]
            });
        },

        render: function() {
            this.resize();

            this.zone.messages.prune();
            var msgs = this.zone.messages.msgs;
            var ctx = this.el.getContext('2d');

            // draw all mons
            var room = this.zone.ensureRoom();
            var mons = this.zone.liveMons();

            _.each(mons, function(mon) {
                drawBody(ctx, mon, 'rgba(240, 20, 30, 1)');
            }, this);

            // draw hero
            var cpos = transpose([this.zone.hero.x, this.zone.hero.y]);
            drawBody(ctx, this.zone.hero, 'rgba(30, 20, 240, 1)');

            drawMessages(ctx, msgs);

            return this;
        },
    });

    function drawMessages(ctx, msgs) {
        _.each(msgs, function(msg) {
            ctx.fillStyle = msg.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.font = '14px sans-serif';
            var pos = transpose(msg.pos)
            ctx.fillText(msg.text, pos[0], pos[1] - (gl.time - msg.time) / msg.lifespan * 20);
        });
    }

    function drawBody(ctx, body, color) {
        var coords = transpose([body.x, body.y]);
        var height = 70;
        var width = 20;
        
        //head
        circle(ctx, [coords[0], coords[1] - height*11/14], color, height/7);


        //draw body, arms, legs
        ctx.beginPath();
        ctx.moveTo(coords[0], coords[1] - height*9/14);
        ctx.lineTo(coords[0], coords[1] - height*3/14);
        ctx.lineTo(coords[0] + width/2, coords[1]);
        ctx.moveTo(coords[0], coords[1] - height*3/14);
        ctx.lineTo(coords[0] - width/2, coords[1]);
        ctx.moveTo(coords[0], coords[1] - height/2);
        ctx.lineTo(coords[0] + width/2, coords[1] - height/2);
        ctx.moveTo(coords[0], coords[1] - height/2);
        ctx.lineTo(coords[0] - width/2, coords[1] - height/2);
        ctx.stroke();        
        
        // draw name
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '14px sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(body.spec.name, coords[0], coords[1] + 10);

        //HP fill
        var hpCoords = [coords[0] - 15, coords[1] - 10 - height];
        var pctHp = body.hp / body.spec.maxHp;
        ctx.fillStyle = "#A00";
        ctx.fillRect(hpCoords[0], hpCoords[1], pctHp * 30, 5);

        //HP box
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.rect(hpCoords[0], hpCoords[1], 30, 5);
        ctx.closePath();
        ctx.stroke();
    }

    function circle(ctx, pos, color, radius) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], radius, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.closePath();
    }

    exports.extend({
        VisView: VisView
    });    
});