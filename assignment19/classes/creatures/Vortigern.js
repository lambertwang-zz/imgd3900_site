// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Class scripting */
class Vortigern extends GameObject {
	constructor(params) {
		super(params);
		this.type = "vertigorn";
		this.altitude = 1;
		this.image = SPRITE_DATA.king;

		this.height = 1;
		this.width = 7;
		this.heightOffset = 9;
		this.widthOffset = -1;

		this.spoken = false;

		this.speech = {
			prologue: [
				"\"I am King Vortigern\"",
				"\"Every month this happens!\"",
				"\"From atop this mountain\"",
				"\"My citadel crumbles\"",
				"\"Now go!\""
			],
			ending: [
				"My King, I bring knowledge",
				"Dragons fight beneath your castle.",
				"\"Ah hah,\"",
				"\"Thank you Merlin, the clever!\"",
				"\"My fortress shall move elsewhere.\""
			]
		}
	}

	tick() {
		if (player) {
			if (player.x > this.x) {
				this.spriteXInverted = false;
			} else {
				this.spriteXInverted = true;
			}
		}
	}

	collide(other) {
		if (!this.spoken && other.type == "merlin") {
			if (playerData.hasKnowledge) {
				showStatus(this.speech.ending);
				other.stunned = 20*60;
				setTimeout(function() {
					levelChangeReady = 14;
				}, 15000);
			} else {
				showStatus(this.speech.prologue);
			}
			other.stunned = 420;
			other.xVel = 0;
			this.spoken = true;
		}
	}
}
