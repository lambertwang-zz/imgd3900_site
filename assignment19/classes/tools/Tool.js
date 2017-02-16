// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Tool extends GameObject {
	constructor(params) {
		super(params);
		this.type = "tool_undefined";
		this.altitude = 2;
		this.ephemeral = true;

		this.dontRegenerate = true;

		this.holder = player;
		this.statusText = [
			"Where did you find this?"
		];

		this.handOffsetX = 0;
		this.handOffsetY = 0;
	}

	spawnParams() {
		var ret = super.spawnParams();
		ret.tool = this.tool;d
		ret.alt_tool = this.alt_tool;

		return ret;
	}

	tick() {
		if (this.target) {
			this.target.move(
				controls.mouseX + camera.x - WIDTH/2 - 2 - this.target.x,
				controls.mouseY + camera.y - HEIGHT/2 - 3 - this.target.y);
			if (Math.abs(this.target.x + 2 - (controls.mouseX + camera.x - WIDTH/2)) > 2 ||
				Math.abs(this.target.y + 2 - (controls.mouseY + camera.y - HEIGHT/2)) > 2) {
				this.drop();
			}
		}
	}

	draw() {
		// Overloaded draw function
		// Follows merlin
		this.spriteXInverted = this.holder.spriteXInverted;
		this.x = this.holder.x + (this.spriteXInverted ? (1 - this.handOffsetX - this.width) :(this.holder.width + this.handOffsetX));
		this.y = this.holder.y + this.handOffsetY;

		super.draw();
	}

	/**
	 * Subclass method.
	 * Function is bound to holder when called.
	 * Should return true to override default jump.
	 */
	jump() {
		return false;
	}

	/**
	 * Subclass method.
	 * Function is bound to holder when called.
	 * Should return true to override default gravity.
	 */
	gravity() {
		return false;
	}

	/**
	 * Subclass method.
	 */
	down() {
	}

	/**
	 * Subclass method.
	 * Called when something is clicked.
	 */
	cast(targets) {
	}

	/**
	 * Subclass method.
	 * Called when tool is traded back to altar.
	 */
	release() {
	}
}
