// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

// The G object will contain all public constants, variables and functions

var G;

// This self-invoking function encapsulates all game functionality.
// It is called as this file is loaded, and initializes the G object.

( function () {
	"use strict";

	// Log database if page unloaded
	var unloadEvent = function(event) {
		if (!won) {
			PS.dbEvent(DB_NAME, "completion", false);
			// PS.dbSend(DB_NAME, "lwang5");
			// PS.dbSend(DB_NAME, "jctblackman");
		}
	};

	// Takes h (0-360), s(0-1), and v(0-1)
	// Returns an int containing an RGB value.
	var hsvToRgb = function(h, s, v) {
		var c = s * v;
		var x = c * (1 - Math.abs((h / 60.0) % 2 - 1));
		var m = v - c;
		var rgb = [0, 0, 0];
		switch (Math.floor(h / 60)) {
			case 0:
				rgb = [c, x, 0];
				break;
			case 1:
				rgb = [x, c, 0];
				break;
			case 2:
				rgb = [0, c, x];
				break;
			case 3:
				rgb = [0, x, c];
				break;
			case 4:
				rgb = [x, 0, c];
				break;
			case 5:
				rgb = [c, 0, x];
				break;
		}

		return (Math.floor((rgb[0] + m) * 255) << 16) + 
			(Math.floor((rgb[1] + m) * 255) << 8) + 
			Math.floor((rgb[2] + m) * 255);
	}


	var MAX_WIDTH = 10;
	var MAX_HEIGHT = 10;
	var DB_NAME = "three_bead_telemetry";

	var STYLE = {
		BACKGROUND_COLOR: hsvToRgb(0, 0, .1),
		BEAD_COLOR: hsvToRgb(0, 0, 0),
		FADE_COLOR: hsvToRgb(0, 0, .5),
		FADE_TIME: 30,
		STATUS_COLOR: 0xffffff,
		HOVER: {
			COLOR: PS.WHITE,
			COLOR_ACTIVE: hsvToRgb(0, .8, 1),
			THICKNESS: 2,
			THICKNESS_ACTIVE: 4
		}
	}

	var BEAD_TYPES = [
		{ // Red Square
			color: hsvToRgb(0, .8, 1),
			glyph: 0x25A0,
		},
		{ // Green Hex
			color: hsvToRgb(120, .5, 1),
			glyph: 0x2B22,
		},
		{ // Blue Rhombus
			color: hsvToRgb(240, .7, 1),
			glyph: 0x25C6,
		},
		{ // Purple Cross
			color: hsvToRgb(300, .7, 1),
			glyph: 0x2756,
		},
		{ // Orange Triangle
			color: hsvToRgb(30, 1, 1),
			glyph: 0x25BC,
		},
		{ // Cyan Circle
			color: hsvToRgb(180, .8, 1),
			glyph: 0x25CF,
		},
		{ // Pink Heart
			color: hsvToRgb(330, .7, 1),
			glyph: 0x2665,
		},
		{ // Yellow Star
			color: hsvToRgb(60, 1, 1),
			glyph: 0x2605,
		}
	]

	var cellMap = [];

	// Draws cell at (x, y)
	// Accepts PS.ALL
	var drawCell = function(x, y, fade = false) {
		for (var i = (x == PS.ALL ? 0 : x); i < (x == PS.ALL ? MAX_WIDTH : x + 1); i++) {
			for (var j = (y == PS.ALL ? 0 : y); j < (y == PS.ALL ? MAX_HEIGHT : y + 1); j++) {
				var cell = BEAD_TYPES[cellMap[i][j]]
				PS.glyph(i, j, cell.glyph);
				PS.glyphColor(i, j, cell.color);

				if (fade) {
					PS.fade(i, j, 0);
					PS.color(i, j, STYLE.FADE_COLOR);
					PS.fade(i, j, STYLE.FADE_TIME);
					PS.color(i, j, STYLE.BEAD_COLOR);
				}
			}
		}
	}

	// Put a random cell in the space (x, y)
	// Accepts PS.ALL
	var fillRandom = function(x, y) {

	}

	// Handles resizing grid and map data
	var size = function(width, height) {
		PS.gridSize( width, height );

		cellMap = [];
		for (var i = 0; i < width; i++) {
			cellMap.push([]);
			for (var j = 0; j < height; j++) {
				cellMap[i].push(PS.random(BEAD_TYPES.length) - 1);
			}
		}
	}

	var tick = function () {
		// PS.gridSize(MAX_WIDTH++, MAX_HEIGHT++);
	};

	// -1 if not active or targeting
	var activeX = -1, activeY = -1, targetX = -1, targetY = -1;

	var swap = function() {
		if (targetX < 0 || activeX < 0) {
			return;
		}
		var temp = cellMap[activeX][activeY];
		cellMap[activeX][activeY] = cellMap[targetX][targetY];
		cellMap[targetX][targetY] = temp;
		drawCell(activeX, activeY, true);
		drawCell(targetX, targetY, true);
	}

	var clearActive = function() {
		if (activeX >= 0 && activeY >= 0 ) {
			PS.border ( activeX, activeY, 0 );
			activeX = -1;
			activeY = -1;
		}
	}
	
	var clearTarget = function() {
		if (targetX >= 0 && targetY >= 0 ) {
			PS.border ( targetX, targetY, 0 );
			targetX = -1;
			targetY = -1;
		}
	}

	var setTarget = function(x, y) {
		if (x == activeX && y == activeY) {
			return;
		}

		// Check direction of target
		var d_x = x - activeX, d_y = y - activeY;
		// Map angle value from range [-PI..PI] to integer [-1..2]
		var angle = Math.floor((Math.atan2(d_y, d_x) * 2 / Math.PI) + 0.5);
		var new_targetX = activeX, new_targetY = activeY;
		// Each integer represents each of 4 cardinal directions
		switch (angle) {
			case -1: // North
				new_targetY = activeY - 1;
				break;
			case 0: // East
				new_targetX = activeX + 1;
				break;
			case 1: // South
				new_targetY = activeY + 1;
				break;
			case 2: // West
				new_targetX = activeX - 1;
				break;
		}
		// Check if target has changed
		if (targetX != new_targetX && targetY != new_targetY) {
			clearTarget();
			// Set new target value
			targetX = new_targetX;
			targetY = new_targetY;
			PS.border ( targetX, targetY, STYLE.HOVER.THICKNESS_ACTIVE );
			PS.borderColor ( targetX, targetY, STYLE.HOVER.COLOR_ACTIVE );
		}
	}

	// Public functions are exposed in the global G object, which is initialized here.
	// Only two functions need to be exposed; everything else is encapsulated!
	// So safe. So elegant.

	G = {
		touch: function(x, y) {
			activeX = x;
			activeY = y;
			PS.border ( x, y, STYLE.HOVER.THICKNESS_ACTIVE );
			PS.borderColor ( x, y, STYLE.HOVER.COLOR_ACTIVE );
		},
		release: function(x, y) {
			swap();
			clearActive();
			clearTarget();
		},
		enter: function(x, y) {
			if (activeX >= 0) {
				setTarget(x, y);
			} else {
				PS.borderColor ( x, y, STYLE.HOVER.COLOR );
				PS.border ( x, y, STYLE.HOVER.THICKNESS );
			}
		},
		exit: function(x, y) {
			if (activeX >= 0) {
			} else {
				PS.border ( x, y, 0 );
			}
		},
		exitGrid: function() {
			clearActive();
			clearTarget();
		},

		// Initialize the game
		// Called once at startup

		init : function () {

			// Establish grid size
			// This should always be done FIRST, before any other initialization!\

			size(MAX_WIDTH, MAX_HEIGHT);
			PS.gridColor( STYLE.BACKGROUND_COLOR ); // grid background color
			PS.border( PS.ALL, PS.ALL, 0 ); // no bead borders
			PS.borderColor ( PS.ALL, PS.ALL, STYLE.HOVER.COLOR );

			PS.color( PS.ALL, PS.ALL, STYLE.BEAD_COLOR ); // Make all beads black
			PS.alpha( PS.ALL, PS.ALL, 255 );

			// Log and send if the window is closed
			window.addEventListener("beforeunload", unloadEvent);

			PS.statusColor( STYLE.STATUS_COLOR );
			PS.statusText( "PLEASE ADD DETAILS" );

			// Initialize Database
			PS.dbInit(DB_NAME);
			
			PS.timerStart( 60, tick );

			drawCell(PS.ALL, PS.ALL);
		}
	};
} () ); // end of self-invoking function

// PS.init( system, options )
// Initializes the game

PS.init = function( system, options ) {
	"use strict";

	G.init(); // game-specific initialization
};

// PS.touch ( x, y, data, options )
// Called when the mouse button is clicked on a bead, or when a bead is touched

PS.touch = G.touch;

PS.release = G.release;

PS.enter = G.enter;

PS.exit = G.exit;

PS.exitGrid = G.exitGrid;

PS.keyDown = function( key, shift, ctrl, options ) {
	"use strict";
};

PS.keyUp = function( key, shift, ctrl, options ) {
	"use strict";
};

PS.swipe = function( data, options ) {
	"use strict";
};

PS.input = function( sensors, options ) {
	"use strict";
};

