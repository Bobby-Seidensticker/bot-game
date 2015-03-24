window.gl = {};

Array.prototype.sum = function() {
    var s = 0;
    for (var i = this.length; i--;) {
        s += this[i];
    }
    return s;
};

Array.prototype.min = function() {
    var len = this.length;
    if (!len) {
        return;
    }
    var min = this[0];
    for (var i = 1; i < len; i++) {
        if (this[i] < min) {
            min = this[i];
        }
    }
    return min;
};

Array.prototype.minIndex = function() {
    var len = this.length;
    if (!len) {
        return;
    }
    var min = this[0];
    var index = 0;
    for (var i = 1; i < len; i++) {
        if (this[i] < min) {
            min = this[i];
            index = i;
        }
    }
    return index;
};

Array.prototype.max = function() {
    var len = this.length;
    if (!len) {
        return;
    }
    var max = this[0];
    for (var i = 1; i < len; i++) {
        if (this[i] > max) {
            max = this[i];
        }
    }
    return max;
};

Array.prototype.maxIndex = function() {
    var len = this.length;
    if (!len) {
        return;
    }
    var max = this[0];
    var index = 0;
    for (var i = 1; i < len; i++) {
        if (this[i] > max) {
            max = this[i];
            index = i;
        }
    }
    return index;
};

Array.prototype.avg = function() {
    return this.sum() / this.length;
};

var a = [4, 2, 6, 73, 3, 2, 3, 5, 2, 5, 6, 23, 67, 1, 2, 4, 1, 5, 64, 7, 9];
var b;
console.time('min');
for (var i = 0; i < 10000; i++) {
    b = a.min();
}
console.timeEnd('min');

console.time('indexOf');
for (var i = 0; i < 10000; i++) {
    b = a.indexOf(a.min());
}
console.timeEnd('indexOf');

console.time('minIndex');
for (var i = 0; i < 10000; i++) {
    b = a.minIndex();
}
console.timeEnd('minIndex');
