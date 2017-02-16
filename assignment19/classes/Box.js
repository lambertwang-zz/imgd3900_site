// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */

class Box extends GameObject {
	constructor(objectData) {
		super(objectData);
		this.type = "box";
		this.altitude = 1;
		this.image = SPRITE_DATA.box;
		this.frameSpeed = 10;
	}

	tick() {
		// Check for ground
		if (!this.boundingBox) {
			return;
		}
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
	}
}
