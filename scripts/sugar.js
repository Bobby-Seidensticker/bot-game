/*Array.prototype.append = function(v) {
    this[this.length] = v;
}*/

function iterate(obj, cb) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            cb(prop, obj[prop]);
        }
    }
}

function assert(statement) {
    if (!statement) {
        throw('Assertion error');
    }
}