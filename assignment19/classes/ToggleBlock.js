// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class ToggleBlock extends GameObject {
	constructor(params) {
		super(params);
		this.type = "toggle_block";
		this.altitude = 1;
		this.image = SPRITE_DATA.toggle_block;

		this.activePlates = 0;

		this.eventListeners["plate_pressed"] = this._activate;
		this.eventListeners["plate_released"] = this._release;
	}

	_activate() {
		this.activePlates++;
		if (this.activePlates > 0) {
			this.clearCollisionMap();
			this.ephemeral = true;
		}
	}

	_release() {
		this.activePlates--;
		if (this.activePlates <= 0) {
			this.ephemeral = false;
		}
	}

	tick() {
		if (this.ephemeral) {
			if (this.opacity > 0) {
				this.opacity = Math.max(0, this.opacity - .02);
			}
		} else {
			if (this.opacity < 1) {
				this.opacity = Math.min(1, this.opacity + .04);
			}
		}
	}
}
