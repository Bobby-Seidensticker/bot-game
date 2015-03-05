namespace.module('bot.prob', function (exports, require) {
    exports.extend({
        rand: rand,
        pyRand: pyRand,
        rootRand: rootRand,
        binProb: binProb,
        middle50: middle50,
        pProb: pProb,
        test: test,
        pick: pick,
        sum: sum,
        randColor: randColor
    });

    var fact;

    // returns a random integer >= min and <= max
    function rand(min, max) {  // INCLUSIVE ON BOTH SIDES
        if (typeof(min) !== 'number' || typeof(max) !== 'number') {
            throw "rand() must be called with 2 numbers"
        }
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function pyRand(min, max) {  // inclusive of min, exclusive of max
        if (typeof(min) !== 'number' || typeof(max) !== 'number') {
            throw "pyRand() must be called with 2 numbers"
        }
        return Math.floor(Math.random() * (max - min) + min);
    }

    function rootRand(min, max) { // call
        //var root = 5;
        //var range = Math.pow(max, root);
        //var result = Math.max(min, Math.floor(Math.pow(pyRand(0, range), 1/root)));
        var result = pProb(min*2, max);

        return Math.max(min, result);
    }
    
    // Binary probability, returns true or false based off a p
    // p >= 1 always returns 1
    // p = 0.01 returns 1 on average once per 100 tries, 0 other times
    function binProb(p) {
        if (Math.random() < p) {
            return true;
        } else {
            return false;
        }
    }

    function middle50(s) {
        var a = Math.floor(s / 4);
        var b = Math.ceil(s * 3 / 4);
        return rand(a, b);
    }

    // lambda is expected value of the function.  aka:
    //   If we ran this function a 1M times we would get around 1M * lambda
    // x (sometimes written as k) is the variable to test
    function pProb(lambda, limit) {
        var r = Math.random(); // num between 0 and 1
        var x = 0;
        var prob;
        if (!limit) {
            limit = 100;
        }
        /*
          Start with x = 0, get the probability that it will happen, subtract that probability from the random number
          If that makes it less than zero, return x, otherwise test x += 1
        */
        while (x < limit) {
            prob = (Math.pow(lambda, x) * Math.exp(-lambda)) / (fact[x]);
            // console.log('for lambda ' + lambda + ' and x ' + x + ' prob = ' + prob);
            r -= prob;
            if (r < 0) {
                return x;
            }
            x++;
        }
        return x;
    }

    function sum(arr) {
        var s = 0;
        for (var i = arr.length; i--;) {
            s += arr[i];
        }
        return s;
    }

    // given an array of weights, of arbitrary sum, randomly selects an index and returns it
    function pick(weights) {
        var len = weights.length;
        var rand = Math.random() * sum(weights);
        var s = 0;
        var index = 0;

        while (index < len && rand > 0) {
            rand -= weights[index];
            index++;
        }
        index -= 1;
        return index;
    }

    // memo or cache count factorials
    function memoFact(count) {
        var arr = [1, 1];
        for (var i = 1; i < count; i++) {
            arr[i + 1] = arr[i] * (i + 1);
        }
        return arr;
    }

    function randColor(base, range) {
        var original = base;
        if (typeof(base) === 'string') {
            base = base.replace('#', '');
            if (base.length === 3) {
                base = base[0] + base[0] + base[1] + base[1] + base[2] + base[2];
            }
            if (base.length !== 6) {
                throw('randcolor base != 6');
            }
            base = [parseInt(base.slice(0, 2), 16), parseInt(base.slice(2,4), 16), parseInt(base.slice(4,6), 16)];
        }

        color = _.map(base, function(c) {
            c += rand(-range, range);
            c = c > 255 ? 255 : c;
            c = c < 0 ? 0 : c;
            return c;
        });
        var res = sprintf('#%02X%02X%02X', color[0], color[1], color[2]);
        return res;
    }

    function test() {
        var fact = memoFact(200);

        // test it

        var start = new Date().getTime();

        var hist = [];
        for (var i = 0; i < 100; i++) {
            hist[i] = 0;
        }
        for (var i = 0; i < 1000; i++) {
            var prob = pProb(40, 200);
            console.log(prob + ' monsters in room ' + i);
            hist[prob]++;
        }

        console.log('1000 cycles took ' + (new Date().getTime() - start) + 'ms');
        console.log(hist);

        for (var i = 0; i < 20; i++) {
            s = '';
            var count = hist[i];
            for (var j = 0; j < count; j++) {
                s += 'x';
            }
            console.log(s);
        }
    }

    fact = memoFact(200);
});
