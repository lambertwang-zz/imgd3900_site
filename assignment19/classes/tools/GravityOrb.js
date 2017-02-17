// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class GravityOrb extends Tool {
	constructor(params) {
		super(params);
		this.type = "orb";
		this.altitude = 2;
		this.image = SPRITE_DATA.orb;
		this.frameSpeed = 30;

		this.altarImage = SPRITE_DATA.altar_orb
		this.statusText = [
			"¡ɥɥHHHɐɐɐɐɐɐ∀∀",
			"What a mysterious orb!",
		];

		this.handOffsetX = -1
		this.handOffsetY = 2;

		this.holder.spriteYInverted = true;
	}

	jump() {
		var ceil = checkCollision(this.boundingBox.left, this.boundingBox.top - 1, this.width, 1);
		if (Object.keys(ceil).length > 0) {
			// On ground or standing on something
			this.yVel = 0;
			if (controls.up || controls.space) {
				this.yVel = 1;
			}
		}
		return true;
	}

	gravity() {
		var ceil = checkCollision(this.boundingBox.left, this.boundingBox.top - 1, this.width, 1);
		if (Object.keys(ceil).length <= 0) {
			// In air
			this.yVel -= 0.07;
			if (!controls.down && this.yVel < -1) {
				this.yVel = -1;
			}
		}
		return true;
	}

	release() {
		this.holder.spriteYInverted = false;
	}
}
