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

    var vector = namespace.bot.vector;
    var vu = namespace.bot.vectorutils;
    var Point = vu.Point;

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
            this.listenTo(gl.DirtyListener, 'centerChange', this.force);
        },

        updateConstants: function() {
            vvs.center = this.gameView.getCenter();
            vvs.cart = this.zone.hero.pos.rawMult(vvs.ratio);
            vvs.iso = vvs.cart.toIso();
            vvs.iso.y -= SIZE / 2;
            vvs.diff = vvs.center.sub(vvs.iso);
        },

        resize: function() {
            var ss = new Point(window.innerWidth, window.innerHeight - 155);
            vvs.ss = ss.clone();

            if (ss.x / 2 > ss.y) {  // if height is the limiting factor
                vvs.realSize = ss.y;
            } else {
                vvs.realSize = ss.x / 2;
            }
            vvs.ratio = vvs.realSize / SIZE;

            this.updateConstants();

            this.$el.css({
                width: ss.x,
                height: ss.y
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

    function transpose(modelPoint) {
        var viewPoint = modelPoint.rawMult(vvs.ratio);
        viewPoint = viewPoint.toIso();
        viewPoint.y -= SIZE / 2;
        return viewPoint.add(vvs.diff);
    }

    var BackgroundTiles = gl.Model.extend({
        initialize: function(filename, canvasSize, imgSize, scale) {
            this.canvas = document.createElement('canvas');
            this.img = new Image();
            this.img.src = filename;
            this.img.onload = this.cache.bind(this);
            this.canvasSize = canvasSize;
            this.imgSize = imgSize;
            this.scale = scale;
        },

        cache: function() {
            $(this.canvas).attr({
                width: this.canvasSize.x,
                height: this.canvasSize.y
            });

            var scaled = this.imgSize.rawMult(this.scale);
            $(this.img).attr({ width: scaled.x, height: scaled.y });

            var iMax = this.canvasSize.x / scaled.x;
            var jMax = this.canvasSize.y / scaled.y;

            var ctx = this.canvas.getContext('2d');

            //ctx.drawImage(this.img, 0, 0, scaled[0], scaled[1]);
            for (var i = 0; i < this.canvasSize.x; i += scaled.x) {
                for (var j = 0; j < this.canvasSize.y; j += scaled.y) {
                    ctx.drawImage(this.img, i, j, scaled.x, scaled.y);
                }
            }
        }
    });

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
            this.size = new Point(window.innerWidth, window.innerHeight - 155);
            this.$el.attr({
                width: this.size.x,
                height: this.size.y
            });

            this.tiles = new BackgroundTiles('assets/floor.jpg', new Point(4000, 4000), new Point(256, 256), 0.25);

            this.ctx = this.el.getContext('2d');
            this.force();
        },

        clear: function() {
            this.$el.attr('width', this.size.x);
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
            var coords = transpose(new Point(0, 0));
            this.ctx.setTransform(a, b, c, d, coords.x, coords.y);
        },

        drawBg: function() {
            var start = this.zone.heroPos - 4;
            var end = this.zone.heroPos + 4;
            if (start < 0) { start = 0; }
            if (end >= this.zone.rooms.length) { end = this.zone.rooms.length - 1; }

            for (var i = start; i <= end; i++) {
                var room = this.zone.rooms[i];
                var pos = room.pos.sub(this.zone.getCurrentRoom().pos);
                var size;

                pos = pos.rawMult(vvs.ratio);
                size = room.size.rawMult(vvs.ratio);

                this.ctx.drawImage(this.tiles.canvas, 0, 0, size.x, size.y, pos.x, pos.y, size.x, size.y);

                this.ctx.font = '20px sans-serif';
                this.ctx.fillStyle = '#eee';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(i, pos.x + size.x / 2, pos.y + 25);
            }
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
            this.size = new Point(window.innerWidth, window.innerHeight - 155);
            this.$el.attr({
                width: this.size.x,
                height: this.size.y
            });
        },

        clear: function() {
            this.el.getContext('2d').clearRect(0, 0, this.size.x, this.size.y);
        },

        render: function() {
            this.clear();
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
            drawBody(ctx, this.zone.hero, 'rgba(0, 150, 240, 1)');

            drawMessages(ctx, msgs);

            var pos;
            pos = transpose(this.zone.getCurrentRoom().ent)
            pos.y -= 5;
            circle(ctx, pos, '#f00', 5, true);

            var exit = this.zone.getCurrentRoom().exit;
            if (exit) {
                pos = transpose(exit);
                pos.y -= 5;
                circle(ctx, pos, '#0f0', 5, true);
            }

            var atk;
            for (var i = 0; i < this.zone.attacks.attacks.length; i++) {
                atk = this.zone.attacks.attacks[i];
                pos = transpose(atk.pos)
                pos.y -= 5;
                circle(ctx, pos, '#f00', 5, true);
            }

            return this;
        },
    });

    function drawMessages(ctx, msgs) {
        _.each(msgs, function(msg) {
            ctx.fillStyle = msg.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.font = '12px Source Code Pro';
            var pos = transpose(msg.pos)
            if (msg.verticalOffset) {
                pos.y -= msg.verticalOffset;
            }
            ctx.fillText(msg.text, pos.x, pos.y - (gl.time - msg.time) / msg.lifespan * 20);
        });
    }

    function drawBody(ctx, body, color) {
        var coords = transpose(body.pos);
        var p;
        height = body.height;
        width = body.width;
        ctx.lineCap = 'round';
        ctx.lineWidth = 2;

        // head
        circle(ctx, coords.sub(new Point(0, height * 11 / 14)), color, height / 7);

        // draw body, legs
        var legFrame = 0;
        if (body.hasMoved) {
            legFrame = Math.abs(Math.floor(gl.time % 400 / 20) - 10);
        }
        ctx.beginPath();
        lines(ctx,
              coords.sub(new Point(0, height * 9 / 14)),
              coords.sub(new Point(0, height * 3 / 14)),
              coords.add(new Point(width / 2 * (10 - legFrame) / 10, 0))
             );

        lines(ctx,
              coords.sub(new Point(0, height * 3 / 14)),
              coords.sub(new Point(width / 2 * (10 - legFrame) / 10, 0))
             );

        //arms
        var rArmFrame = 0; // valid values 0 to 10
        var lArmFrame = 0;
        
        if (body.busy()) {
            rArmFrame = Math.abs(Math.floor(gl.time % 500 / 25) - 10);
            lArmFrame = Math.abs(Math.floor((gl.time + 111) % 500 / 25) - 10);
        }

        lines(ctx,
              coords.sub(new Point(0, height / 2)),
              coords.add(new Point(width / 2, -(height / 2 + (1 - (2 * rArmFrame / 10)) * height / 4)))
             );

        lines(ctx,
              coords.sub(new Point(0, height / 2)),
              coords.sub(new Point(width / 2, (height / 2 + (1 - (2 * lArmFrame / 10)) * height / 4)))
             );

        ctx.stroke();        

        ctx.lineWidth = 1;
        
        // draw name
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '14px Source Code Pro';
        ctx.fillStyle = color;
        ctx.fillText(body.spec.name, coords.x, coords.y + 10);

        //HP fill
        var hpCoords = coords.add(new Point(-15, -10 - height));
        var pctHp = body.hp / body.spec.maxHp;
        ctx.fillStyle = "#A00";
        ctx.fillRect(hpCoords.x, hpCoords.y, pctHp * 30, 5);

        //HP box
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.rect(hpCoords.x, hpCoords.y, 30, 5);
        ctx.closePath();
        ctx.stroke();
    }

    function lines(ctx, p) {
        if (p) {
            ctx.moveTo(p.x, p.y);
        }
        for (var i = 2; i < arguments.length; i++) {
            ctx.lineTo(arguments[i].x, arguments[i].y);
        }
    }

    function circle(ctx, pos, color, radius, fill) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
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
