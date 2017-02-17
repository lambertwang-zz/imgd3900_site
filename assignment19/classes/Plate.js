// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Plate extends GameObject {
	constructor(params) {
		super(params);
		this.type = "plate";
		this.altitude = 1;
		this.image = SPRITE_DATA.plate;
		this.heightOffset = 0;

		this.pressTime = 0;
		// The plate must be held down for 30 frames
		this.pressThreshold = 30;
		this.pressed = false;
	}

	tick() {
		if (!this.boundingBox) {
			return;
		}
		var top = {};
		if (this.spriteYInverted) {
			// Check for things on top
			top = checkCollision(this.boundingBox.left, this.boundingBox.bot, this.width, 2);
		} else {
			// Check for things on top
			top = checkCollision(this.boundingBox.left, this.boundingBox.top - 2, this.width, 2);
		}
		if (Object.keys(top).length > 0) {
			if (++this.pressTime >= this.pressThreshold) {
				if (!this.pressed) {
					sendEvent("plate_pressed");
					this.pressed = true;
					this.heightOffset = 1;
					this.image = SPRITE_DATA.plate_active;
				}
				this.pressTime = this.pressThreshold;
			}
		} else {
			if (--this.pressTime <= 0) {
				if (this.pressed) {
					sendEvent("plate_released");
					this.pressed = false;
					this.heightOffset = 0;
					this.image = SPRITE_DATA.plate;
				}
				this.pressTime = 0;
			}
		}
	}
}
