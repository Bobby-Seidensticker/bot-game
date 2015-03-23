namespace.module('bot.vis', function (exports, require) {

    /*
      TODO:
      Vis view's el is a div
      Make BackgroundView its own el=canvas view
      Make EntityView its own el=canvas view
      Make canvas full screen, abs positioned
      OnResize adjust namespace global RATIO, REAL_SIZE so the max dimension is the min size of the screen
    */

    var FOOTER_HEIGHT = 113;

    var log = namespace.bot.log;
    var vvs = {};  // vis vars
    var SIZE = 1000 * 1000;

    var vu = namespace.bot.vectorutils;
    var Point = vu.Point;

    var TEXTURES = {
        'assets/floor.jpg': new Image()
    };
    _.each(TEXTURES, function(value, key) { value.src = key; });

    var VisView = Backbone.View.extend({
        tagName: 'div',
        className: 'vis',

        events: {
            'mouseenter': 'onMouseenter'
        },
        onMouseenter: function() { gl.UIEvents.trigger('mouseleave'); },  // this is because chrome's mouse leave doesn't work

        // this needs to get all zones, when game model changes, probably should get all of gameModel
        initialize: function(options, game, gameView) {
            log.info('visview init');
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
            var ss = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
            if (ss.y < 1) {
                ss.y = 1;
            }
            vvs.ss = ss.clone();

            if (ss.x / 2 > ss.y) {  // if height is the limiting factor
                vvs.realSize = ss.y;
            } else {
                vvs.realSize = ss.x / 2;
            }
            vvs.ratio = vvs.realSize / SIZE;

            vvs.center = this.gameView.getCenter();
            vvs.cart = this.zone.hero.pos.mult(vvs.ratio);
            vvs.iso = vvs.cart.toIso();
            vvs.iso.y -= SIZE / 2;
            vvs.diff = vvs.center.sub(vvs.iso);
        },

        resize: function() {
            this.updateConstants();
            this.$el.css({
                width: vvs.ss.x,
                height: vvs.ss.y
            });

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
        var viewPoint = modelPoint.mult(vvs.ratio);
        viewPoint = viewPoint.toIso();
        viewPoint.y -= SIZE / 2;
        return viewPoint.add(vvs.diff);
    }

    var BackgroundTiles = gl.Model.extend({
        initialize: function(filename, canvasSize, imgSize, scale) {
            this.canvas = document.createElement('canvas');
            this.canvasSize = canvasSize;
            this.imgSize = imgSize;
            this.scale = scale;

            if (filename in TEXTURES) {
                this.img = TEXTURES[filename];
                this.img.onload = this.cache.bind(this);
                this.cache();
            } else {
                log.error('%s not found in TEXTURES cache. Loading but not available instantly', filename);
                this.img = new Image();
                this.img.src = filename;
                this.img.onload = this.cache.bind(this);
                TEXTURES[filename] = this.img;
            }
        },

        cache: function() {
            $(this.canvas).attr({
                width: this.canvasSize.x,
                height: this.canvasSize.y
            });

            var scaled = this.imgSize.mult(this.scale);
            $(this.img).attr({ width: scaled.x, height: scaled.y });

            var iMax = this.canvasSize.x / scaled.x;
            var jMax = this.canvasSize.y / scaled.y;

            var ctx = this.canvas.getContext('2d');

            for (var i = 0; i < this.canvasSize.x; i += scaled.x) {
                for (var j = 0; j < this.canvasSize.y; j += scaled.y) {
                    ctx.drawImage(this.img, i, j, scaled.x, scaled.y);
                }
            }
            gl.DirtyQueue.mark('centerChange');
        }
    });

    var BackgroundView = Backbone.View.extend({
        tagName: 'canvas',
        className: 'bg',

        initialize: function(options, game) {
            this.zone = game.zone;

            this.redraw = true;

            this.resize();
            this.listenTo(gl.DirtyListener, 'tick', this.render);
            this.listenTo(gl.DirtyListener, 'hero:move', function() { this.redraw = true; });
        },

        resize: function() {
            this.size = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
            this.$el.attr({
                width: this.size.x,
                height: this.size.y
            });

            this.tiles = new BackgroundTiles('assets/floor.jpg', new Point(4000, 4000), new Point(256, 256), vvs.ratio * 400);

            this.ctx = this.el.getContext('2d');
            this.force();
        },

        clear: function() {
            this.$el.attr('width', this.size.x);
            this.redraw = true;
        },

        force: function() {
            this.redraw = true;
            log.info('force background');
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

                pos = pos.mult(vvs.ratio);
                size = room.size.mult(vvs.ratio);

                this.ctx.drawImage(this.tiles.canvas, 0, 0, size.x, size.y, pos.x, pos.y, size.x, size.y);
                /*
                this.ctx.font = '20px sans-serif';
                this.ctx.fillStyle = '#eee';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(i, pos.x + size.x / 2, pos.y + 25);*/
            }
        },
    });

    var EntityView = Backbone.View.extend({
        tagName: 'canvas',
        className: 'entity',

        initialize: function(options, game) {
            log.info('visview init');
            this.zone = game.zone;

            this.resize();
            this.listenTo(gl.DirtyListener, 'tick', this.render);
            this.tempCanvas = document.createElement('canvas');
            $(this.tempCanvas).attr({
                width: 2000,
                height: 400
            });
            this.tctx = this.tempCanvas.getContext('2d');
        },

        resize: function() {
            this.size = new Point(window.innerWidth, window.innerHeight - FOOTER_HEIGHT);
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

            var drawables = [];

            _.each(mons, function(mon) {
                drawables.push(new BodyView(mon));
                //drawBody(ctx, mon, 'rgba(240, 20, 30, 1)', this.tempCanvas);
            }, this);

            // draw hero
            drawables.push(new BodyView(this.zone.hero));
            //drawBody(ctx, this.zone.hero, 'rgba(0, 150, 240, 1)', this.tempCanvas);

            _.each(this.zone.getAttacks(), function(atk) {
                drawables.push(new AttackView(atk));
            });

            sortDrawables(drawables);

            _.each(drawables, function(drawable) {
                drawable.draw(ctx, this.tempCanvas);
            }, this);

            /*var pos;
            pos = transpose(this.zone.getCurrentRoom().ent)
            pos.y -= 2;
            circle(ctx, pos, '#f00', 2, true);

            var exit = this.zone.getCurrentRoom().exit;
            if (exit) {
                pos = transpose(exit);
                pos.y -= 5;
                circle(ctx, pos, '#0f0', 2, true);
            }*/

            //drawAttacks(ctx, this.zone.attacks.attacks);

            drawMessages(ctx, msgs);

            return this;
        },
    });

    function drawMessages(ctx, msgs) {
        // TODO: fix offset for separating messages about multiple item drops from the same entity
        _.each(msgs, function(msg) {
            ctx.fillStyle = msg.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.font = Math.floor(vvs.ratio * 30000) + 'px Source Code Pro';
            if (msg.type === 'dmg') {
                var dmg = msg.dmg;
                var base = transpose(dmg.getBase());
                base.y -= dmg.getY() * vvs.ratio;
                ctx.fillText(msg.text, base.x, base.y);
            } else {
                var pos = transpose(msg.pos)
                if (msg.verticalOffset) {
                    pos.y -= msg.verticalOffset * vvs.ratio;
                }
                ctx.fillText(msg.text, pos.x, pos.y - (gl.time - msg.time) / msg.lifespan * 20);
            }
        });
    }

    function sortDrawables(drawables) {
        for (var i = drawables.length; i--;) {
            drawables[i].updateZ();
        }
        drawables.sort(function (a, b) { return a.z - b.z; });
    }

    function AttackView(atk) {
        this.atk = atk;
        this.z = 0;
    }

    AttackView.prototype.updateZ = function() {
        if (this.atk.type === 'cone' || this.atk.type === 'circle') {
            this.z = 0;
        } else {
            this.z = (this.atk.pos.x + this.atk.pos.y) / 2;
        }
    }

    AttackView.prototype.draw = function(ctx, tempCanvas) {
        if (this.atk.type === 'proj' && gl.time < this.atk.fireTime) {
            return;
        }
        if (this.atk.type === 'cone' && gl.time < this.atk.fireTime) {
            return;
        }
        if (this.atk.type === 'circle' && gl.time < this.atk.fireTime) {
            return;
        }

        var pos = transpose(this.atk.pos)
        pos.y -= this.atk.z * vvs.ratio;
        if (this.atk.type === 'circle') {
            flatCircle(ctx, this.atk);
        } else if (this.atk.type === 'cone') {
            flatArc(ctx, this.atk); //atk.start, atk. pos, this.atk.color, this.atk.radius * vvs.ratio, true);
        } else {
            circle(ctx, pos, this.atk.color, this.atk.projRadius * vvs.ratio, true);
        }
    }

    // Implements drawable interface
    function BodyView(body) {
        this.body = body;
        this.z = 0;
        this.color = this.body.isHero() ? 'rgba(0, 150, 240, 1)' : 'rgba(240, 20, 30, 1)';
    }

    BodyView.prototype.updateZ = function() {
        this.z = (this.body.pos.x + this.body.pos.y) / 2;
    }

    BodyView.prototype.draw = function(ctx, tempCanvas) {
        var coords = transpose(this.body.pos);
        var p;
        var height = this.body.spec.height * vvs.ratio;
        var width = this.body.spec.width * vvs.ratio;
        ctx.lineCap = 'round';
        ctx.lineWidth = this.body.spec.lineWidth * vvs.ratio;

        //height *= 3 / 4

        var headPos = new Point(0, height * 67 / 72);
        var headSize = height * 10 / 72;
        var crotch = new Point(0, height * 23 / 72);
        var legSize = height * 23 / 72;
        var armPos = new Point(0, height * 45 / 72);
        var armSize = height * 28 / 72;
        var bodyPos = [headPos, new Point(0, legSize)]; 

        // head
        circle(ctx, coords.sub(headPos), this.color, headSize, true);
        //isoCircle(ctx, coords.sub(headPos), this.color, headSize, headSize, true);

        // draw body, legs
        var legFrame = 0;
        if (this.body.moveStart > -1) {
            // range 0 to 2.  
            var secPerWidth = this.body.spec.width / this.body.spec.moveSpeed * 8;  // the * 8 makes it 8x slower than real
            legFrame = ((gl.time - this.body.moveStart) % secPerWidth) / secPerWidth * 2;
        }
        ctx.beginPath();
        lines(ctx,
              coords.sub(bodyPos[0]),
              coords.sub(bodyPos[1]),
              coords.add(new Point(width / 2 * (1 - legFrame), 0))
             );

        lines(ctx,
              coords.sub(bodyPos[1]),
              coords.sub(new Point(width / 2 * (1 - legFrame), 0))
             );

        // arms
        var rArm;
        var lArm;

        if (this.body.busy()) {
            var pct;
            if (this.body.lastDuration > 0) {
                pct = (this.body.nextAction - gl.time) / this.body.lastDuration;
            } else {
                pct = 1;
            }
            var ra = (pct + .1) * 1.3 * Math.PI * 2;
            var mra = Math.PI / 4 * Math.sin(ra);

            var la = pct * Math.PI * 2;
            var mla = Math.PI / 4 * Math.sin(la);

            rArm = new Point(Math.cos(mra) * width / 2, Math.sin(mra) * width / 2);
            lArm = new Point(Math.cos(mla + Math.PI) * width / 2, Math.sin(mla + Math.PI) * width / 2);
        } else {
            rArm = new Point(width / 2, 0);
            lArm = new Point(-width / 2, 0);
        }

        var armBase = coords.sub(armPos);

        lines(ctx,
              armBase,
              armBase.add(rArm)
             );

        lines(ctx,
              armBase,
              armBase.add(lArm)
             );

        ctx.stroke();        

        drawNameHealth(ctx, tempCanvas, this.body.spec.name, coords.sub(new Point(0, height)), this.body.hp / this.body.spec.maxHp);
    }

    function lines(ctx, p) {
        if (p) {
            ctx.moveTo(p.x, p.y);
        }
        for (var i = 2; i < arguments.length; i++) {
            ctx.lineTo(arguments[i].x, arguments[i].y);
        }
    }

    function drawNameHealth(ctx, tcanvas, text, pos, hpPct) {
        if (hpPct < 0) {
            hpPct = 0;
        }
        text = text.toUpperCase();

        var fontHeight = Math.floor(vvs.ratio * 30000);

        ctx.fillStyle = '#111';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = fontHeight + 'px Source Code Pro';
        ctx.fillText(text, pos.x, pos.y - fontHeight * 1.75);

        var tctx = tcanvas.getContext('2d');

        var textWidth = tctx.measureText(text).width;

        tctx.clearRect(0, 0, textWidth, fontHeight);

        tctx.fillStyle = '#e12';
        tctx.textAlign = 'left';
        tctx.textBaseline = 'top';
        tctx.font = fontHeight + 'px Source Code Pro';
        tctx.fillText(text, 0, 0);

        tctx.clearRect(textWidth * hpPct, 0, textWidth, fontHeight);
        ctx.drawImage(tcanvas, 0, 0, textWidth, fontHeight, pos.x - textWidth / 2, pos.y - fontHeight * 1.75, textWidth, fontHeight);
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

    function isoCircle(ctx, pos, color, width, height, fill) {
        ctx.strokeStyle = color;
        drawEllipseByCenter(ctx, pos.x, pos.y, width * 2, height * 2);
        ctx.closePath();
        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    function drawEllipseByCenter(ctx, cx, cy, w, h) {
        drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h);
    }

    function drawEllipse(ctx, x, y, w, h) {
        var kappa = .5522848,
        ox = (w / 2) * kappa, // control point offset horizontal
        oy = (h / 2) * kappa, // control point offset vertical
        xe = x + w,           // x-end
        ye = y + h,           // y-end
        xm = x + w / 2,       // x-middle
        ym = y + h / 2;       // y-middle

        ctx.beginPath();
        ctx.moveTo(x, ym);
        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        //ctx.closePath(); // not used correctly, see comments (use to close off open path)
        ctx.stroke();
    }

    function flatArc(ctx, atk) {
        var outerRadius = atk.pos.sub(atk.start).len();
        var innerRadius = outerRadius - atk.aoeRadius / 2;
        if (innerRadius < 0) {
            innerRadius = 0;
        }
        outerRadius *= vvs.ratio;
        innerRadius *= vvs.ratio;

        var pos = transpose(atk.start);

        var a1 = atk.vector.rotate(-atk.angle / 2).angle();
        var a2 = atk.vector.rotate(atk.angle / 2).angle();

        var properAngle = function(a) {
            if (a < 0) { a += Math.PI * 2; }
            return a;
        }

        a1 = properAngle(a1);
        a2 = properAngle(a2);

        ctx.save();
        ctx.beginPath();

        var a = 1, b = 0.5, c = -1, d = 0.5;
        ctx.setTransform(a, b, c, d, pos.x, pos.y);

        ctx.fillStyle = atk.color;

        ctx.arc(0, 0, outerRadius, a1, a2, false);
        ctx.arc(0, 0, innerRadius, a2, a1, true);
        ctx.fill();

        ctx.restore();
    }

    function flatCircle(ctx, atk) {
        var outerRadius = atk.pos.sub(atk.start).len();
        var innerRadius = outerRadius - 20000;
        if (innerRadius < 0) {
            innerRadius = 0;
        }
        outerRadius *= vvs.ratio;
        innerRadius *= vvs.ratio;

        var pos = transpose(atk.start);

        ctx.save();
        ctx.beginPath();

        var a = 1, b = 0.5, c = -1, d = 0.5;
        ctx.setTransform(a, b, c, d, pos.x, pos.y);

        ctx.fillStyle = atk.color;

        ctx.arc(0, 0, outerRadius, 0, Math.PI * 2, false);
        ctx.arc(0, 0, innerRadius, Math.PI * 2, 0, true);
        ctx.fill();

        ctx.restore();
    }

    exports.extend({
        VisView: VisView
    });    
});
