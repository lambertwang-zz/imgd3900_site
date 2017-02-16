// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Altar extends GameObject {
	constructor(params) {
		super(params);
		this.type = "altar";
		this.altitude = 1;
		this.frameSpeed = 35;
		this.heightOffset = 10;
		this.height = 1;

		this.tool = params.tool;
	}

	spawnParams() {
		var ret = super.spawnParams();
		ret.tool = this.tool;

		return ret;
	}
}
