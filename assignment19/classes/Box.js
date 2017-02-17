// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Box extends GameObject {
	constructor(params) {
		super(params);
		this.type = "box";
		this.altitude = 1;
		this.image = SPRITE_DATA.box;
		this.frameSpeed = 10;

		if (this.spriteYInverted) {
			this.image = SPRITE_DATA.box_inv;
		}
	}

	tick() {
		// Check for ground
		if (!this.boundingBox) {
			return;
		}
		if (!this.spriteYInverted) {
			var ground = checkCollision(this.boundingBox.left, this.boundingBox.bot, this.width, 1);

			if (Object.keys(ground).length <= 0) {
				// In air
				this.yVel += 0.07;
				if (this.yVel > 1) {
					this.yVel = 1;
				}
			} else {
				for (var obj of Object.keys(ground)) {
					if (objects[obj] && objects[obj].type == "troll") {
						console.log("Crushing troll?");
						objectDeletionQueue[obj] = ground[obj];
					}
				}
			}
		} else {
			var ceil = checkCollision(this.boundingBox.left, this.boundingBox.top - 1, this.width, 1);

			if (Object.keys(ceil).length <= 0) {
				// In air
				this.yVel -= 0.07;
				if (this.yVel < -1) {
					this.yVel = -1;
				}
			} else {
				for (var obj of Object.keys(ceil)) {
					if (objects[obj] && objects[obj].type == "troll") {
						console.log("Crushing troll?");
						objectDeletionQueue[obj] = ceil[obj];
					}
				}
			}
		}
	}

	staffLift() {
		this.image = SPRITE_DATA.box_active;
	}

	staffDrop() {
		this.image = SPRITE_DATA.box;
		if (this.spriteYInverted) {
			this.image = SPRITE_DATA.box_inv;
		}
	}

}
