// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Bow extends Tool {
	constructor(params) {
		super(params);
		this.altarImage = SPRITE_DATA.altar_bow
	}
}
