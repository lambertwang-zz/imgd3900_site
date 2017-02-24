// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Drake extends GameObject {
	constructor(params) {
		super(params);
		this.type = "drake";
		this.altitude = 1;
		this.image = SPRITE_DATA.drake;
		this.frameSpeed = 90;

		this.height = 1;
		this.heightOffset = 21;
		this.width = 6;
		this.widthOffset = 10;

		this.spoken = false;

		this.speech = [
			"\"FOOLISH RED,\"",
			"\"YOU DRAW YOUR LAST BREATH\"",
			"\"THIS POOL IS MINE\"",
		]
	}

	collide(other) {
		if (other.type == "merlin") {
			if (!this.spoken) {
				showStatus(this.speech);
				other.stunned = 240;
				other.xVel = 0;
				this.spoken = true;
				playerData.hasKnowledge = true;
			}
		}
	}
}
