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
            if(msg.verticalOffset) {
                console.log('worked');
                pos[1] -= msg.verticalOffset;
            }
            ctx.fillText(msg.text, pos[0], pos[1] - (gl.time - msg.time) / msg.lifespan * 20);
        });
    }

    function drawBody(ctx, body, color) {
        var coords = transpose([body.x, body.y]);
        var height = 70;
        var width = 20;
        
        //head
        circle(ctx, [coords[0], coords[1] - height*11/14], color, height/7);
 
        //draw body, legs
        var legFrame = 0;
        if(body.hasMoved) {
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
        
        if(body.busy()) {
            rArmFrame = Math.abs(Math.floor(gl.time % 500 / 25) - 10);
            lArmFrame = Math.abs(Math.floor((gl.time + 111) % 500 / 25) - 10);
        }
        ctx.moveTo(coords[0], coords[1] - height/2);
        ctx.lineTo(coords[0] + width/2, coords[1] - height/2 + (1 - (2 * rArmFrame / 10 ))*height/4);
        ctx.moveTo(coords[0], coords[1] - height/2);
        ctx.lineTo(coords[0] - width/2, coords[1] - height/2 + (1 - (2 * lArmFrame / 10 ))*height/4);
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
