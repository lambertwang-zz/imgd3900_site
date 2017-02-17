// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Dragon extends GameObject {
	constructor(params) {
		super(params);
		this.type = "dragon";
		this.altitude = 1;
		this.image = SPRITE_DATA.dragon;
		this.frameSpeed = 90;

		this.height = 1;
		this.heightOffset = 21;
		this.width = 6;
		this.widthOffset = 10;

		this.spoken = false;

		this.speech = [
			"\"ARROGANT BLUE,\"",
			"\"THIS MOUNTAIN IS MY EMBLEM\"",
			"\"YOUNG WIZARD,\"",
			"\"RETURN WHENCE YOU CAME\"",
			"\"LET YOUR KING KNOW\"",
			"\"THIS IS NO MORTAL PALACE\""
		]
	}

	collide(other) {
		if (other.type == "merlin") {
			if (!this.spoken) {
				showStatus(this.speech);
				other.stunned = 540;
				other.xVel = 0;
				this.spoken = true;
			}
		}
	}
}
