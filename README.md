bot-game
========

###MAKE SURE ALL NOTES BEGIN WITH TODO, ex:
TODO: This is a hack, come back and refactor sooner rather than later

#Classes

Hero(name)
  name
  str
  vit
  spa         // Seconds per attack
  la          // Last Attack
  weapon      // class instance of equipped weapon
  armor       // class instance of equipped armor
  hpMax       // calculated from vit * 5
  hp          // current hp, when constructed, hp == hpMax
  dmgMod      // calculated from str / 3, multiplied by weapon to get actual damage
  isAlive()   // bool, returns if hero is alive

Instance(Level, Hero)
  run()       // Runs the given hero through the given level
  

Item(type, level)
  level  // item level of the item
  type   // what kind of item

Weapon(level)   // subclass of Item
  dmgMin // minimum damage based off level
  dmgMax // maximum damage based off level

Armor(level)    // subclass of Item
  armor  // armor level based off level

Level
  len    // numer of rooms (length)
  type   // type/kind of level
  level  // level of monsters
  monster_count  // average number of monsters per room (filled via poisson distribution on a room by room basis)
  mlocs  // array of rooms, each is currently an array of monster types

#Views

View(HTMLDOM canvas, uint x1, uint y1, uint x2, uint y2)
/******** IDEAS ********/

This is meant to be an abstract class of which all views that draw on the canvas inherit from.
  The View class should/may have some nice way of abstracting away the fact that they are only given a subsection of the canvas.
  This is so the subclasses will not have to each deal with their own shitty ways of adjusting their coordinate space,
    and just deal with the canvas as if they had their own html canvas object.
There are two ways of approaching this problem
WRONG One is to have 1 canvas, and give each sub View a subset of the coordinate space.
  The View would be initialized with a way of specifying which coordinate space to use, and the view would pretend as if that were the whole canvas
The other way is actually the correct way,
  Each View will have its own canvas or multiple canvases.  This is because canvases retain all drawing on them, and the only way to clear it
  is to reset the whole thing and draw everything (including the stuff not currently being drawn) all over again.  This is unnecessarily computationally expensive.
  Multiple canvases are used for things like static backgrounds.  An inventory for example, could have a background texture on ones, the dividers on another, and
  the items themselves on yet another.  This is the proper way to do it.

/***********************/