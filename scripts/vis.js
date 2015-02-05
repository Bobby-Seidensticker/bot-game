namespace.module('bot.vis', function (exports, require) {

    var log = namespace.bot.log;

    function transpose(coords) {
        return [coords[0] * RATIO, coords[1] * RATIO];
    }

    var REAL_SIZE = 300;
    var SIZE = 1000 * 1000;
    var RATIO = REAL_SIZE / SIZE;

    var VisView = Backbone.View.extend({
        tagName: 'canvas',
        className: 'vis',

        // this needs to get all zones, when game model changes, probably shoudl get all of gameModel
        initialize: function(options, game) {
            log.warning('visview init');
            this.zone = game.zone;

            this.clear();
            this.listenTo(gl.DirtyListener, 'tick', this.render);
        },

        clear: function() {
            this.$el.attr({
                width: REAL_SIZE,
                height: REAL_SIZE
            });
            /*this.$canvas.css({
                top: this.$el.height() / 2 - REAL_SIZE / 2 - 1,
                left: this.$el.width() / 2 - REAL_SIZE / 2 - 1
            });*/
        },

        render: function() {
            this.zone.messages.prune();
            var msgs = this.zone.messages.msgs;
            this.clear();
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

        //head
        circle(ctx, [coords[0], coords[1] - height + 15], color);

        ctx.beginPath();
        ctx.moveTo(coords[0], coords[1] - height + 25);
        ctx.lineTo(coords[0], coords[1] - 15);
        ctx.lineTo(coords[0] + 10, coords[1]);
        ctx.moveTo(coords[0], coords[1] - 15);
        ctx.lineTo(coords[0] - 10, coords[1]);
        ctx.moveTo(coords[0], coords[1] - height/2);
        ctx.lineTo(coords[0] + 15, coords[1] - height/2);
        ctx.moveTo(coords[0], coords[1] - height/2);
        ctx.lineTo(coords[0] - 15, coords[1] - height/2);
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

    function circle(ctx, pos, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 10, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.closePath();
    }

    exports.extend({
        VisView: VisView
    });    
});
