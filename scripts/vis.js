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
    var vvs = {};  // vis vars
    var SIZE = 1000 * 1000;

    var VisView = Backbone.View.extend({
        tagName: 'div',
        className: 'vis',

        // this needs to get all zones, when game model changes, probably should get all of gameModel
        initialize: function(options, game, gameView) {
            log.warning('visview init');
            this.zone = game.zone;
            this.gameView = gameView;

            this.updateConstants();

            this.bg = new BackgroundView({}, game);
            this.entity = new EntityView({}, game);

            $(window).on('resize', this.resize.bind(this));
            this.resize();

            this.$el.append(this.bg.render().el);
            this.$el.append(this.entity.render().el);

            this.listenTo(gl.DirtyListener, 'tick', this.render);
            this.listenTo(gl.DirtyListener, 'hero:move', this.updateConstants);
            this.listenTo(gl.DirtyListener, 'footer:buttons', this.force);
        },

        updateConstants: function() {
            vvs.center = this.gameView.getCenter();
            vvs.heroCoords = [this.zone.hero.x, this.zone.hero.y];

            vvs.cart = [vvs.heroCoords[0] * vvs.ratio, vvs.heroCoords[1] * vvs.ratio];

            vvs.iso = [vvs.cart[0] - vvs.cart[1], (vvs.cart[0] + vvs.cart[1]) / 2 - SIZE / 2];

            vvs.actual = [vvs.iso[0] + vvs.center[0], vvs.iso[1] + vvs.center[1]];
        },

        resize: function() {
            var ss = [window.innerWidth, window.innerHeight - 155];
            vvs.ss = ss;

            if (ss[0] / 2 > ss[1]) {  // if height is the limiting factor
                vvs.realSize = ss[1];
            } else {
                vvs.realSize = ss[0] / 2;
            }
            vvs.ratio = vvs.realSize / SIZE;

            this.updateConstants();

            this.$el.css({
                width: ss[0],
                height: ss[1]
            });

            this.updateConstants();
            this.bg.resize();
            this.entity.resize();
        },

        force: function() {
            this.updateConstants();
            this.bg.force();
        },

        render: function() {
            return this;
        },
    });

    function transpose(coords) {
        var cart = [coords[0] * vvs.ratio, coords[1] * vvs.ratio];
        var iso = [cart[0] - cart[1], (cart[0] + cart[1]) / 2 - SIZE / 2];
        iso = [iso[0] - vvs.iso[0] + vvs.center[0], iso[1] - vvs.iso[1] + vvs.center[1]];
        return iso;
    }

    var BackgroundView = Backbone.View.extend({
        tagName: 'canvas',
        className: 'bg',

        initialize: function(options, game) {
            log.warning('bg view init');
            this.zone = game.zone;

            this.redraw = true;

            this.resize();
            this.listenTo(gl.DirtyListener, 'tick', this.render);
            this.listenTo(gl.DirtyListener, 'hero:move', function() { this.redraw = true; });
        },

        resize: function() {
            this.size = [window.innerWidth, window.innerHeight - 155];
            this.$el.attr({
                width: this.size[0],
                height: this.size[1]
            });
            this.ctx = this.el.getContext('2d');
            this.force();
        },

        clear: function() {
            this.ctx.clearRect(-200, -200, this.size[0] + 400, this.size[1] + 400);
            this.redraw = true;
        },

        force: function() {
            this.redraw = true;
            this.render();
        },

        render: function() {
            if (this.redraw) {
                this.clear();
                this.transform();
                this.drawBg();
                this.redraw = false;
            }

            return this;
        },

        transform: function() {
            var a = 1, b = 0.5, c = -1, d = 0.5;
            var coords = transpose([0, 0]);
            this.ctx.setTransform(a, b, c, d, coords[0], coords[1]);
        },

        drawBg: function() {
            log.error('draw bg');

            var s = vvs.realSize;
            var h = s / 2;

            this.ctx.fillStyle = '#777';
            this.ctx.fillRect(0, 0, s, s);

            this.ctx.font = '16px sans-serif';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('North', h, -25);
            this.ctx.fillText('West', -25, h);
            this.ctx.fillText('East', s + 25, h);
            this.ctx.fillText('South', h, s + 25);
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

            gl.heroPos = this.zone


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
            drawBody(ctx, this.zone.hero, 'rgba(30, 20, 240, 1)');

            drawMessages(ctx, msgs);

            var pos;
            pos = transpose([0, 500000])
            pos[1] -= 5;
            circle(ctx, pos, '#fff', 5, true);

            pos = transpose([1000000, 500000])
            pos[1] -= 5;
            circle(ctx, pos, '#fff', 5, true);

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
            if(msg.verticalOffset) {
                pos[1] -= msg.verticalOffset;
            }
            ctx.fillText(msg.text, pos[0], pos[1] - (gl.time - msg.time) / msg.lifespan * 20);
        });
    }

    function drawBody(ctx, body, color) {
        var coords = transpose([body.x, body.y]);
        height = body.height;
        width = body.width;
        ctx.lineWidth = 2;
        
        //head
        circle(ctx, [coords[0], coords[1] - height * 11 / 14], color, height/7);
 
        //draw body, legs
        var legFrame = 0;
        if (body.hasMoved) {
            legFrame = Math.abs(Math.floor(gl.time % 400 / 20) - 10);
        }
        ctx.beginPath();
        ctx.moveTo(coords[0], coords[1] - height*9/14);
        ctx.lineTo(coords[0], coords[1] - height*3/14);
        ctx.lineTo(coords[0] + width/2 * (10 - legFrame)/10, coords[1]);
        ctx.moveTo(coords[0], coords[1] - height*3/14);
        ctx.lineTo(coords[0] - width/2 * (10 - legFrame)/10, coords[1]);

        //arms
        var rArmFrame = 0; // valid values 0 to 10
        var lArmFrame = 0;
        
        if (body.busy()) {
            rArmFrame = Math.abs(Math.floor(gl.time % 500 / 25) - 10);
            lArmFrame = Math.abs(Math.floor((gl.time + 111) % 500 / 25) - 10);
        }
        ctx.moveTo(coords[0], coords[1] - height/2);
        ctx.lineTo(coords[0] + width/2, coords[1] - height/2 + (1 - (2 * rArmFrame / 10 ))*height/4);
        ctx.moveTo(coords[0], coords[1] - height/2);
        ctx.lineTo(coords[0] - width/2, coords[1] - height/2 + (1 - (2 * lArmFrame / 10 ))*height/4);
        ctx.stroke();        

        ctx.lineWidth = 1;
        
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

    function circle(ctx, pos, color, radius, fill) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], radius, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.closePath();
        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    exports.extend({
        VisView: VisView
    });    
});
