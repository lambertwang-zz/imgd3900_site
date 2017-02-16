// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Door extends GameObject {
	constructor(params) {
		super(params);
		this.type = "door";
		this.altitude = 0;
		this.image = SPRITE_DATA.door;

		this.height = 1;
		this.heightOffset = 8;
		this.width = 2;
		this.widthOffset = 2;
	}
}
