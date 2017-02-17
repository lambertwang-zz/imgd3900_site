// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Additional style things */
STYLE.LOAD_FADE_DURATION = 30;
STYLE.OVERLAY_FADE_RATE = 4;
STYLE.OVERLAY_FADE = 480;
STYLE.LEVEL_LOAD_TIMEOUT = 1000;

var SOUND_OPTIONS = {
	autoplay: false,
	path: "sounds/",
	lock: true,
	fileTypes: [ "wav" ]
}

// Sounds created using http://www.bfxr.net/ available under the Apache 2.0 License
/**
 * Sounds go here
 */

// Global events and game variables
var levelFade = 0;
var player = null;
var playerData = {
	tool: null,
	alt_tool: null,
	hasKnowledge: false
}
var DB_NAME = "merlin_telemetry";

globalEventListener["init"] = function() {
	// Initialize Database
	PS.dbInit(DB_NAME);
}

globalEventListener["shutdown"] = function() {
	// Only dbSend if hosted, not locally testing
	if (window.location.hostname == "users.wpi.edu") {
		PS.dbSend(DB_NAME, "lwang5");
		PS.dbSend(DB_NAME, "jctblackman");
	}
	PS.dbErase(DB_NAME);
}

/** Set global event listeners */
globalEventListener["beforeLoadLevel"] = function() {
	PS.dbEvent(DB_NAME, "level_loaded", levelIndex);

	// Pause game and setup level fading
	controls.paused = true;

	levelFade = STYLE.OVERLAY_FADE;
	PS.fade(PS.ALL, PS.ALL, STYLE.LOAD_FADE_DURATION);

	// Preserve merlin's weapons (if possible)
	if (player) {
			if (player.tool) {
				playerData.tool = player.tool.constructor;
			} else {
				playerData.tool = null;
			}

			if (player.alt_tool) {
				playerData.alt_tool = player.alt_tool.constructor;
			} else {
				playerData.alt_tool = null;
			}
	}
}

globalEventListener["afterLoadLevel"] = function() {
	// Level should be done fading in
	setTimeout(function() {
		PS.fade(PS.ALL, PS.ALL, 0);
		controls.paused = false;
	}, STYLE.LEVEL_LOAD_TIMEOUT);
}

globalEventListener["afterRenderAll"] = function() {
	// Draw a fade overlay on the screen
	if (levelFade > 0) {
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
				drawPixel([0, 0, 0, levelFade], i, j);
			}
		}
		if (!controls.paused) {
			levelFade -= STYLE.OVERLAY_FADE_RATE;
		}
	}
}

globalEventListener["debug"] = function() {
	STYLE.OVERLAY_FADE = 0;
	STYLE.LOAD_FADE_DURATION = 0;
	STYLE.LEVEL_LOAD_TIMEOUT = 0;
}
