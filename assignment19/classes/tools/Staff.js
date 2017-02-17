// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Staff extends Tool {
	constructor(params) {
		super(params);
		this.type = "staff";
		this.altitude = 2;
		this.image = SPRITE_DATA.staff;

		this.altarImage = SPRITE_DATA.altar_staff
		this.target = null;
		this.statusText = [
			"It's a powerful staff!",
			"Click to move blocks!"
		];

		this.handOffsetX = 0;
		this.handOffsetY = 0;
	}

	tick() {
		if (this.target) {
			this.target.move(
				controls.mouseX + camera.x - WIDTH/2 - 2 - this.target.x,
				controls.mouseY + camera.y - HEIGHT/2 - 3 - this.target.y);
			if (Math.abs(this.target.x + 2 - (controls.mouseX + camera.x - WIDTH/2)) > 2 ||
				Math.abs(this.target.y + 2 - (controls.mouseY + camera.y - HEIGHT/2)) > 2) {
				this._drop();
			}
		}
	}

	cast (targets) {
		if (this.target == null) {
			for (var obj of Object.keys(targets)) {
				if (targets[obj] && targets[obj].staffLift) {
					this.target = targets[obj];
					this.target.staffLift();
					this.image = SPRITE_DATA.staff_active;
					return;
				}
			}
		} else {
			this._drop();
		}
	}

	_drop() {
		if (this.target) {
			this.target.staffDrop();
			this.image = SPRITE_DATA.staff;
			this.target = null;
		}
	}

	release() {
		this._drop();
	}
}
