namespace.module('bot.damage', function (exports, require) {

    var vu;
    var Point;
    var prob;
    var log;

    $(function() {
        vu = namespace.bot.vectorutils;
        Point = vu.Point;
        prob = namespace.bot.prob;
        log = namespace.bot.log;
    });

    function Damage(start, end, height) {
        this.end = end;
        this.vect = end.sub(start).unitVector();
        this.startTime = gl.time;
        this.height = height;
        this.k = -3 * this.height * (0.75 + Math.random() / 2);
        this.p = 0.75 * this.height * (0.75 + Math.random() / 2);;
    }

    Damage.prototype.getY = function() {
        var elapsed = (gl.time - this.startTime) / 1000;
        return this.k * Math.pow((elapsed - 0.2), 2) + this.p;
    }

    Damage.prototype.getBase = function() {
        var elapsed = (gl.time - this.startTime);
        var base = this.end.add(this.vect.mult(400 * elapsed));
        return base;
    }

    exports.extend({
        Damage: Damage
    });
});