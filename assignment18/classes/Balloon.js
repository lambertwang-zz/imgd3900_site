// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Balloon extends GameObject {
	constructor(params) {
		super(params);
		this.type = "balloon";
		this.image = SPRITE_DATA.balloon;
		this.ephemeral = true;

		this.dontRegenerate = true;

		this.altarImage = SPRITE_DATA.altar_balloon
		this.holder = player;
		this.isDownPressed = false;
		this.statusText = [
			"Wow, a magic balloon!",
			"Press Down/S to descend faster"
		];
	}

	draw() {
		if (this.isDownPressed) {
			this.image = SPRITE_DATA.balloon_used;
			this.isDownPressed = false;
		} else {
			this.image = SPRITE_DATA.balloon;
		}
		// Overloaded draw function
		// Follows merlin
		this.spriteInverted = this.holder.spriteInverted;
		this.x = this.holder.x + (this.spriteInverted ? -3 : 4);
		this.y = this.holder.y - 4;

		super.draw();
	}

	jump() {
		this.holder.yVel = -1.4;
	}

	gravity() {
		if (!this.isDownPressed && this.holder.yVel > 0.1) {
			this.holder.yVel = 0.1;
		}
	}

	down() {
		this.holder.yVel = 1;
		this.isDownPressed = true;
	}

	cast (targets) {
	}
}
