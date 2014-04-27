namespace.module('bot.views', function (exports, require) {

    var funcs = require('org.startpad.funcs').patch();

    // TODO does/should views need prob?
    prob = namespace.prob;

    exports.extend({
        'CanvasUI': CanvasUI
    });

    /*
      How should we handle the instances, the idea that I had before was to pass in the instance and the canvas to the view and it would render it
      Passing in the canvas is wrong, so there just leaves the instance thing.
      I think that the individual view constructors should not take an instance, but instead be initialized on init before the instance is initialized
      Then, they each can have a render function which takes an instance that would make everything visible.
      calling update() on the view will change necessary stuff.
     */


    // This is the class for the whole thing, it takes 3 jquery wrapped divs for the dungeon view, hero (hp/xp/equipped), and inventory
    // it then makes a dungeon hero and inv class passing only the divs, they can get the size from the object and insert the
    // necessary canvases, and store links to them on their own

    function CanvasUI($container, $dungeon, $hero, $inv) {
        console.log('canvasui constructor');
        this.$container = $container;
        this.dungeonView = new DungeonView($dungeon);
        this.heroView = new HeroView($hero);
        this.invView = new InvView($inv);
        this.resize();
    }

    CanvasUI.prototype.addInstance = function(instance) {
        this.dungeonView.addInstance(instance);
        this.heroView.addInstance(instance);
        this.invView.addInstance(instance);
    }

    CanvasUI.prototype.resize = function() {
        console.log('canvas UI resize');
        //this.size = [window.innerWidth, window.innerHeight];
        this.size = [600, 400];

        this.$container.css('width', this.size[0]);
        this.$container.css('height', this.size[1]);

        var layout;
        var dungeonSize;  // [width, height]
        var dungeonLoc;   // [left, top]
        var heroSize;
        var heroLoc;
        var invSize;
        var invLoc;

        // TODO determine appropriate layout and set layout var to appropriate string
        layout = 'landscape';

        if (layout == 'landscape') {
            heroSize = [this.size[0] / 2, 200];
            invSize = [this.size[0] / 2, 200];
            dungeonSize = [this.size[0], 200];

            heroLoc = [0, this.size[1] / 2];
            invLoc = [this.size[0] / 2, this.size[1] / 2];
            dungeonLoc = [0, 0];
        }

        this.heroView.resize(heroSize, heroLoc);
        this.invView.resize(invSize, invLoc);
        this.dungeonView.resize(dungeonSize, dungeonLoc);
    }

    CanvasUI.prototype.updateAll = function() {
        this.heroView.update();
        this.invView.update();
        this.dungeonView.update();
    }

    function View($container) {
        this.$container = $container;
        this.$container.append('<canvas class="l1"></canvas>');
        this.canvases = [this.$container.find('.l1')[0]];
        this.name = this.$container.attr('id');
        this.instance = undefined;
    }

    View.prototype.resize = function(size, loc) {
        this.size = size;

        console.log(this.name, size, loc);

        var c = this.$container;
        c.css('width', size[0]);
        c.css('height', size[1]);
        c.css('left', loc[0]);
        c.css('top', loc[1]);

        for (var i = 0; i < this.canvases.length; i++) {
            $(this.canvases[i]).attr('width', size[0]);
            $(this.canvases[i]).attr('height', size[1]);
        }

        if (this.instance === undefined) {
            console.log('update called on ' + this.name + ' with instance === undefined');
        } else {
            this.update();
        }
    }

    View.prototype.addInstance = function(instance) {
        this.instance = instance;
        this.update();
    }

    View.prototype.update = function() {
        // View specific updating, does the grunt work of visualizing the instance's data
        // does nothing (for now?) subclasses must define this
    }

    View.prototype.clearCanvas = function(index) {
        if (index < 0 || (index - 1) > this.canvases.length) {
            console.log("ERROR clear canvas index out of range");
            return;
        }
        $(this.canvases[index]).attr('width', this.size[0]);
    }

    function DungeonView($container) {
        View.call(this, $container);
        
    }

    DungeonView.subclass(View);

    DungeonView.prototype.update = function() {
        
    }

    function HeroView($container) {
        View.call(this, $container);
        
    }

    HeroView.subclass(View);

    HeroView.prototype.update = function() {
        if (this.instance === undefined) {
            console.log('Hero View update called with instance undefined');
            return;
        }
        var hero = this.instance.hero;
        var ctx = this.canvases[0].getContext('2d');
        var hpPct = this.instance.hero.hp / this.instance.hero.hpMax;
        var xpPct = this.instance.hero.xp / this.instance.hero.lvlUpXP;

        this.clearCanvas(0);

        //this.drawBar(ctx, 'HP', this.instance.hero.hp / this.instance.hero.hpMax, [40, 2], [this.size[0] - 40, 16]);
        this.drawBar(ctx, 'HP', hpPct, [this.size[0], 20], [0, 0]);

        //this.drawBar(ctx, 'XP', this.instance.hero.xp / this.instance.hero.lvlUpXP, [40, 22], [this.size[0] - 40, 16]);
        this.drawBar(ctx, 'XP', xpPct, [this.size[0], 20], [0, 20]);
        
        /*
          hero.xp
          hero.lvlUpXP;
          hero.hp;
          hero.hpMax;
        */
    }

    //HeroView.prototype.drawBar = function(ctx, type, pct, pos, size) {
    HeroView.prototype.drawBar = function(ctx, type, pct, size, pos) {
        var posColor;
        var negColor;

        var textColor = '#111';
        var textHeight = Math.floor(size[1] * 0.40) * 2;
        var textPos = [pos[0] + 2, pos[1] + (size[1] - textHeight) / 2];

        if (type == 'HP') {
            posColor = '#d00';
            negColor = '#d66';
        } else if (type == 'XP') {
            posColor = '#ff0';
            negColor = '#ee6';
        } else {
            console.log("ERROR drawBar called with invalid arguments", arguments);
            return;
        }

        ctx.font = textHeight + 'px sans-serif';
        ctx.textBaseline = 'top';

        ctx.fillStyle = textColor;
        ctx.fillText(type, textPos[0], textPos[1]);

        ctx.fillStyle = negColor;
        ctx.fillRect(pos[0], pos[1], size[0], size[1]);

        ctx.fillStyle = posColor;
        ctx.fillRect(pos[0], pos[1], size[0] * pct, size[1]);
    }

    function InvView($container) {
        View.call(this, $container);
        
    }

    InvView.subclass(View);

    InvView.prototype.update = function() {
        
    }

});