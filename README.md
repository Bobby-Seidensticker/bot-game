bot-game
========

#Classes

Hero(name)
  name
  str
  vit
  spa         // Seconds per attack
  la          // Last Attack
  weapon      // class instance of equipped weapon
  armor       // class instance of equipped armor
  maxHp       // calculated from vit * 5
  hp          // current hp, when constructed, hp == maxHp
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
