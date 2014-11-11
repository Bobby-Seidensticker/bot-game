namespace.module('bot.models', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var prob = namespace.bot.prob;
    var log = namespace.bot.log;
    var itemref = namespace.bot.itemref;

    exports.extend({
        'init': init
    });

    var user;

    function init(data) {
        user = new User(loadRawData(data));
        user.init();
    }

    function ensureProps(obj) {
        if (arguments.length <= 1) {
            log.warning('Called ensureProps with just an ');
        }
    }

    function loadRawData(data) {
        var d;

        try {
            d = JSON.parse(data);
            if (!('chars' in d && 'inventory' in d && 'weapons' in d['inventory'] &&
                  'weapons' in d['inventory'] && 'weapons' in d['inventory'] && 'weapons' in d['inventory']) {
                
            }
        }
        catch (e) {
            if (data === undefined) {
                log.info('models.loadRawData(), No data in localStorage reverting to default');
            } else {
                log.error('models.loadRawData(), Tried to parse corrupt JSON, given %s, reverting to default', data);
            }
            d = {
                chars: [],
                inventory: {
                    weapons: [],
                    armor: [],
                    affixes: [],
                    skills: []
                }
            };
        }

        return d;
    }

    // expects an object, not a string
    function User(data) {
        this.data = data;
        this.lastTime = new Date().getTime();
        this.chars = [];
        this.inventory = {};
    }

    User.prototype.init() {
        var i, chars;
        rawChars = this.data.chars;
        for (i = 0; i < rawChars.length; i++) {
            this.chars[i] = new Char(rawChars[i]);
        }
        
    }

    User.prototype.tick() {
        var t = new Date().getTime();
        var diff = t - this.lastTime;
        this.lastTime = t;

        for (var i = 0; i < this.chars.length; i++) {
            this.chars.tick
        }
    }

});