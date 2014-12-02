namespace.module('bot.models', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    var log = namespace.bot.log;
    var itemref = namespace.bot.itemref;
    var views = namespace.bot.views;
    var controllers = namespace.bot.controllers;

    exports.extend({
        'Game': Game
    });

    var user;

    function init(data) {
        user = new User(loadRawData(data));
        user.init();
        return user;
    }

    function ensureProps(obj) {
        for (var i = 1; i < arguments.length; i++) {
            if (!(arguments[i] in obj)) {
                return false;
            }
        }
        return true
    }

    function loadRawData(data) {
        var d;

        try {
            d = JSON.parse(data);
            fucked = false
            if (!('chars' in d)) { fucked = true; }
            if (!('inventory' in d)) { fucked = true; }
            if (!ensureProps(d['inventory'], 'weapons', 'armor', 'skills', 'affixes', 'mats')) { fucked = true; }
            if (fucked) {
                throw('loadRawData: fucked');
            }
        }
        catch (e) {
            if (data === undefined) {
                log.info('models.loadRawData(), No data in localStorage reverting to default');
            } else {
                log.error('models.loadRawData(), Tried to parse corrupt JSON, given %s, reverting to default', data);
            }
            d = {
                chars: [{name: 'bobbeh'}],
                inventory: {
                    weapons: [],
                    armor: [],
                    skills: [],
                    affixes: [],
                    mats: []
                }
            };
        }

        return d;
    }

    function Game() {
        var data, i, view, controller;
        data = loadRawData(localStorage['char']);

        this.inventory = new Inventory(data.inventory);

        this.chars = [];
        for (i = 0; i < data.chars.length; i++) {
            this.chars[this.chars.length] = new Char(data.chars[i], this.inventory);
        }

        view = new views.GameView();
        controller = new controllers.GameController(this, view);
        controller.init();
    }

    Game.prototype.init = function() {}

    function Char(data, inventory) {
        this.name = data.name;
        this.inventory = inventory;

        this.view = new views.CharView(this);
        this.controller = new controllers.CharController(this);

        this.view.init();
        this.controller.init(this.view);
    }

    function Inventory(data) {
        this.weapons = data.weapons;
        this.armor = data.armor;
        this.skills = data.skills;
        this.affixes = data.affixes;
        this.mats = data.mats;

        this.view = new views.InventoryView(this);
        this.controller = new controllers.InventoryController(this);

        this.view.init(this.controller);
        this.controller.init(this.view);
    }

    /*function Map(data) {
        this.data = data;
        this.view = new views.MapView(this);
    }*/

});