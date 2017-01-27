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

	// Metrics and variables
	var SCORE_PAD = "0000";

	// Takes h (0-360), s(0-1), and v(0-1)
	// Returns an int containing an RGB value.
	function hsvToRgb(h, s, v) {
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
		FADE_TIME: 20,
		STATUS_COLOR: 0xffffff,
		HOVER: {
			COLOR: hsvToRgb(0, 0, 1),
			COLOR_ACTIVE: hsvToRgb(0, .8, 1),
			THICKNESS: 2,
			THICKNESS_ACTIVE: 4
		},
		CLEAR_DELAY: 8,
		LEVEL_DELAY: 10
	}

	var SOUND_OPTIONS = {
		autoplay: false,
		path: "sounds/",
		lock: true,
		fileTypes: [ "wav" ]
	};

	// Sounds created using http://www.bfxr.net/ available under the Apache 2.0 License
	var SOUND_LEVEL = "level";
	var SOUND_CLEAR = "clear";
	var SOUND_COMBO = "combo";
	var SOUND_SWAP = "swap";

	var BEAD_TYPES = [
		{ // Red Square
			color: hsvToRgb(0, .8, 1),
			glyph: 0x25A0,
		},
		{ // Blue Rhombus
			color: hsvToRgb(240, .8, 1),
			glyph: 0x25C6,
		},
		{ // Orange Triangle
			color: hsvToRgb(30, 1, 1),
			glyph: 0x25BC,
		},
		{ // Cyan Circle
			color: hsvToRgb(200, .8, 1),
			glyph: 0x25CF,
		},
		{ // Pink Heart
			color: hsvToRgb(330, .6, 1),
			glyph: 0x2665,
		},
		{ // Green Hex
			color: hsvToRgb(110, .7, 1),
			glyph: 0x2B22,
		},
		{ // Yellow Star
			color: hsvToRgb(60, 1, 1),
			glyph: 0x2605,
		},
		{ // Purple Cross
			color: hsvToRgb(290, .8, 1),
			glyph: 0x2756,
		},
		{ // White snowflake
			color: hsvToRgb(0, 0, 1),
			glyph: 0x2746,
		},
		{ // Teal Music Notes
			color: hsvToRgb(160, .8, 1),
			glyph: 0x266B
		}
	]

	var COMPLETION_TEXT = [
		"Good job!",
		"Well done!",
		"Nice work!",
		"You're an expert!"
	];

	var LEVEL_DATA = [
		{
			width: 4,
			height: 1,
			clearToNext: -999,
			activeTypes: 5,
			customMap: [[0], [0], [1], [0]],
			statusText: "Touch and drag cells to swap them!"
		},
		{
			width: 2,
			height: 3,
			clearToNext: -999,
			activeTypes: 5,
			customMap: [[2, 3, 2], [3, 2, 3]],
			statusText: "Make cool combos!"
		},
		{
			width: 6,
			height: 6,
			clearToNext: 50,
			activeTypes: 5,
			statusText: "You're on your own!"
		},
		{
			width: 7,
			height: 7,
			clearToNext: 100,
			activeTypes: 5,
			statusText: "Level 2"
		},
		{
			width: 7,
			height: 7,
			clearToNext: 150,
			activeTypes: 6,
			statusText: "Level 3"
		},
		{
			width: 8,
			height: 8,
			clearToNext: 200,
			activeTypes: 7,
			statusText: "Level 4"
		},
		{
			width: 8,
			height: 8,
			clearToNext: 300,
			activeTypes: 8,
			statusText: "Level 5"
		},
		{
			width: 8,
			height: 8,
			clearToNext: 400,
			activeTypes: 8,
			statusText: "Level 6"
		},
		{
			width: 8,
			height: 8,
			clearToNext: 600,
			activeTypes: 9,
			statusText: "Level 7"
		},
		{
			width: 9,
			height: 9,
			clearToNext: 800,
			activeTypes: 9,
			statusText: "Level 8"
		},
		{
			width: 10,
			height: 10,
			clearToNext: 1000,
			activeTypes: 10,
			statusText: "Endless Mode"
		},
	];

	var height;
	var width;
	var activeTypes;
	var cellMap = [];
	var levelIndex = 0;
	var currentLevel;
	var score = -9; // So that your score is exactly 0 when you start level 1

	// Lock the controls after matching to fade in new cells
	var controlsLocked = 0; // Number of ticks to lock controls for

	function loadLevel() {
		PS.dbEvent(DB_NAME, "Loaded level", levelIndex);
		if (levelIndex >= LEVEL_DATA.length) {
			currentLevel = LEVEL_DATA[LEVEL_DATA.length-1];
			currentLevel.clearToNext = levelIndex*200 - 1000;
		} else {
			currentLevel = LEVEL_DATA[levelIndex];
		}
		width = currentLevel.width;
		height = currentLevel.height;
		activeTypes = currentLevel.activeTypes;
		setGridSize(width, height);

		PS.statusColor( STYLE.STATUS_COLOR );
		PS.statusText(currentLevel.statusText);

		if (currentLevel.customMap) {
			cellMap = currentLevel.customMap;
		}
		drawCell(PS.ALL, PS.ALL);
		PS.audioPlay( SOUND_LEVEL, SOUND_OPTIONS );
	}

	// Handles resizing grid and map data
	function setGridSize(width, height) {
		PS.gridSize( width, height );
		PS.gridColor( STYLE.BACKGROUND_COLOR ); // grid background color

		PS.border( PS.ALL, PS.ALL, 0 ); // no bead borders
		PS.borderColor ( PS.ALL, PS.ALL, STYLE.HOVER.COLOR );

		PS.color( PS.ALL, PS.ALL, STYLE.BEAD_COLOR ); // Make all beads black
		PS.alpha( PS.ALL, PS.ALL, 255 );

		cellMap = [];
		for (var i = 0; i < width; i++) {
			cellMap.push([]);
			for (var j = 0; j < height; j++) {
				cellMap[i].push(-1);
			}
		}

		fillRandom(PS.ALL, PS.ALL);
	}

	// Draws cell at (x, y)
	// Accepts PS.ALL
	function drawCell(x, y, fade = false) {
		if (x == PS.ALL) {
			for (var i = 0; i < width; i++) {
				drawCell(i, y, fade);
			}
		} else if (y == PS.ALL) {
			for (var j = 0; j < height; j++) {
				drawCell(x, j, fade);
			}
		} else {
			if (cellMap[x][y] == -1) {
				PS.glyph(x, y, 0);
			} else {
				var cell = BEAD_TYPES[cellMap[x][y]]
				PS.glyph(x, y, cell.glyph);
				PS.glyphColor(x, y, cell.color);
			}
			if (fade) {
				if (PS.fade(x, y).rate == 0) {
					PS.fade(x, y, 0);
					PS.color(x, y, STYLE.FADE_COLOR);
					PS.fade(x, y, STYLE.FADE_TIME, {
						onEnd: function(x, y) {
							PS.fade(x, y, 0);
						}.bind(this, x, y)
					});
					PS.color(x, y, STYLE.BEAD_COLOR);
				}
			}
		}
	}

	// Put a random cell in the space (x, y)
	// Ensures the cell type placed is different from all neighbors
	// Accepts PS.ALL
	function fillRandom(x, y) {
		if (x == PS.ALL) {
			for (var i = 0; i < width; i++) {
				fillRandom(i, y);
			}
		} else if (y == PS.ALL) {
			for (var j = 0; j < height; j++) {
				fillRandom(x, j);
			}
		} else {
			var validTypes = {};
			for (var i=0; i<activeTypes; i++) {
				validTypes[i] = false;
			}
			// Check neighbors
			if (x < width - 1) {
				delete validTypes[cellMap[x + 1][y]];
			}
			if (x > 0) {
				delete validTypes[cellMap[x - 1][y]];
			}
			if (y < height - 1) {
				delete validTypes[cellMap[x][y + 1]];
			}
			if (y > 0) {
				delete validTypes[cellMap[x][y - 1]];
			}
			var available = Object.keys(validTypes);
			cellMap[x][y] = available[PS.random(available.length) - 1];
			drawCell(x, y, true);
		}
	}

	// Matching functions
	var markedForClear = [];

	// Supports PS.ALL
	function findMatches(x, y) {
		if (x == PS.ALL) {
			for (var i = 0; i < width; i++) {
				findMatches(i, y);
			}
			clearMarkedCells();
		} else if (y == PS.ALL) {
			for (var j = 0; j < height; j++) {
				findMatches(x, j);
			}
		} else {
			var selfType = cellMap[x][y];
			// Finds all horizontal and vertical matches involving cell at (x, y)
			var checkCells = [x + y * width]
			var horizontal = 1;
			for (var i = x + 1; i < width && cellMap[i][y] == selfType; i++) {
				horizontal++;
				checkCells.push(i + y * width)
			}
			for (var i = x - 1; i >= 0 && cellMap[i][y] == selfType; i--) {
				horizontal++;
				checkCells.push(i + y * width)
			}
			if (horizontal >= 3) {
				for (var to_add of checkCells) {
					if (markedForClear.indexOf(to_add) == -1) {
						markedForClear.push(to_add);
					}
				}
			}

			var checkCells = [x + y * width]
			var vertical = 1;
			for (var j = y + 1; j < height && cellMap[x][j] == selfType; j++) {
				vertical++;
				checkCells.push(x + j * width)
			}
			for (var j = y - 1; j >= 0 && cellMap[x][j] == selfType; j--) {
				vertical++;
				checkCells.push(x + j * width)
			}
			if (vertical >= 3) {
				for (var to_add of checkCells) {
					if (markedForClear.indexOf(to_add) == -1) {
						markedForClear.push(to_add);
					}
				}
			}
		}
	}

	var combo = 0;

	function clearMarkedCells() {
		for (var cell of markedForClear) {
			cellMap[cell % width][Math.floor(cell / width)] = -1;
			drawCell(cell % width, Math.floor(cell / width), true);
		}
		// Incrase score based on amount cleared

		if (markedForClear.length > 0) {
			PS.dbEvent(DB_NAME, "Cleared N cells", markedForClear.length);
			if (combo > 1) {
				PS.dbEvent(DB_NAME, "at combo level", combo);
			}
			console.log("Score gained: N * 2 ^ C = " + markedForClear.length + " * 2 ^ " + combo + " = " + markedForClear.length * (1 << combo));

			if (combo > 0) {
				PS.audioPlay( SOUND_COMBO, SOUND_OPTIONS );
			} else {
				PS.audioPlay( SOUND_CLEAR, SOUND_OPTIONS );
			}

			score += markedForClear.length * (1 << combo);
			combo++;
			controlsLocked = STYLE.CLEAR_DELAY;
			if (score >= currentLevel.clearToNext) {
				PS.statusText(COMPLETION_TEXT[PS.random(COMPLETION_TEXT.length) - 1]);
				controlsLocked = STYLE.LEVEL_DELAY;
			} else {
				PS.statusText("Score: " + score + SCORE_PAD + " out of " + currentLevel.clearToNext + SCORE_PAD);
			}
		} else {
			combo = 0; // Start at combo = 0 so base multiplier is 1.
			// Clearing is done. Determine whether to move to next level
			if (score >= currentLevel.clearToNext) {
				levelIndex++;
				loadLevel();
			}
		}

		markedForClear = [];
	}

	function dropRows() {
		// Move tiles down in similar fashion to bubble-sort
		for (var i = 0; i < width; i++) {
			var tileMoved;
			do {
				tileMoved = false;
				// Bubble tiles down from the bottom-up
				for (var j = height - 1; j > 0; j--) {
					if (cellMap[i][j] == -1 && cellMap[i][j - 1] != -1) {
						tileMoved = true;
						cellMap[i][j] = cellMap[i][j - 1];
						cellMap[i][j - 1] = -1;
					}
				}
			} while (tileMoved);

			// Redraw column
			drawCell(i, PS.ALL);

			// Fade new cells from the top
			for (var j = 0; j < height && cellMap[i][j] == -1; j ++) {
				fillRandom(i, j);
			}
		}

		findMatches(PS.ALL, PS.ALL);
	}

	// -1 if not active or targeting
	var activeX = -1, activeY = -1, targetX = -1, targetY = -1;

	// Swap target and active cells
	function swap() {
		if (targetX < 0 || activeX < 0) {
			return;
		}
		var temp = cellMap[activeX][activeY];
		cellMap[activeX][activeY] = cellMap[targetX][targetY];
		cellMap[targetX][targetY] = temp;
		PS.audioPlay( SOUND_SWAP, SOUND_OPTIONS );
		drawCell(activeX, activeY, true);
		drawCell(targetX, targetY, true);
		findMatches(activeX, activeY);
		findMatches(targetX, targetY);
		clearMarkedCells();
	}

	function clearActive() {
		if (activeX >= 0 && activeY >= 0 ) {
			PS.border ( activeX, activeY, 0 );
			activeX = -1;
			activeY = -1;
		}
	}

	function clearTarget() {
		if (targetX >= 0 && targetY >= 0 ) {
			PS.border ( targetX, targetY, 0 );
			targetX = -1;
			targetY = -1;
		}
	}

	function setTarget(x, y) {
		if (x == activeX && y == activeY) {
			clearTarget();
			targetX = -1;
			targetY = -1;
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

	function tick() {
		if (controlsLocked > 0) {
			controlsLocked--;
			if (controlsLocked == 0) {
				dropRows();
			}
		}
	};

	// Public functions are exposed in the global G object, which is initialized here.
	// Only two functions need to be exposed; everything else is encapsulated!
	// So safe. So elegant.

	G = {
		touch: function(x, y) {
			if (controlsLocked > 0) {
				return;
			}
			activeX = x;
			activeY = y;
			PS.border ( x, y, STYLE.HOVER.THICKNESS_ACTIVE );
			PS.borderColor ( x, y, STYLE.HOVER.COLOR_ACTIVE );
		},
		release: function(x, y) {
			swap();
			clearActive();
			clearTarget();
			PS.borderColor ( x, y, STYLE.HOVER.COLOR );
			PS.border ( x, y, STYLE.HOVER.THICKNESS );
		},
		enter: function(x, y) {
			if (controlsLocked > 0) {
				return;
			}
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
		shutdown: function() {
			PS.dbEvent(DB_NAME, "final score", score);
			// PS.dbSend(DB_NAME, "lwang5");
			// PS.dbSend(DB_NAME, "jctblackman");
			PS.dbDump(DB_NAME);
		},

		// Initialize the game
		// Called once at startup

		init: function () {

			// Preload & lock sounds
			PS.audioLoad( SOUND_LEVEL, SOUND_OPTIONS );
			PS.audioLoad( SOUND_CLEAR, SOUND_OPTIONS );
			PS.audioLoad( SOUND_COMBO, SOUND_OPTIONS );
			PS.audioLoad( SOUND_SWAP, SOUND_OPTIONS );

			// Initialize Database
			PS.dbInit(DB_NAME);

			// Establish grid size
			// This should always be done FIRST, before any other initialization!
			loadLevel();

			// 10 ticks per second
			PS.timerStart( 6, tick );

			drawCell(PS.ALL, PS.ALL);
		}
	};
} () ); // end of self-invoking function

// PS.init( system, options )
// Initializes the game

PS.init = G.init;
PS.touch = G.touch;
PS.release = G.release;
PS.enter = G.enter;
PS.exit = G.exit;
PS.exitGrid = G.exitGrid;
PS.shutdown = G.shutdown;