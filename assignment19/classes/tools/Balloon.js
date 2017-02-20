// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Balloon extends Tool {
	constructor(params) {
		super(params);
		this.type = "balloon";
		this.altitude = 2;
		this.image = SPRITE_DATA.balloon;

		this.altarImage = SPRITE_DATA.altar_balloon
		this.statusText = [
			"Wow, a magic balloon!",
			"Press Down/S to descend faster"
		];

		this.handOffsetX = 0;
		this.handOffsetY = -3;
	}

	draw() {
		if (controls.down) {
			this.image = SPRITE_DATA.balloon_used;
		} else {
			this.image = SPRITE_DATA.balloon;
		}

		super.draw();
	}

	jump() {
		if (this.ground.solid) {
			// On ground or standing on something
			this.yVel = 0;
			if (controls.up || controls.space) {
				if (!this.jumped) {
					this.jumped = true;
					this.yVel = -1.2;
					this.move(0, -1);
				}
			} else {
				this.jumped = false;
			}
		}
		return true;
	}

	gravity() {
		if (!this.ground.solid) {
			// In air
			this.yVel += 0.05;
			if (!controls.down && this.yVel > 0.1) {
				this.yVel = 0.1;
			}
		}
		return true;
	}

	down() {
		this.holder.yVel = 1;
	}
}
