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
	var SCORE_PAD = "0";

	var MAX_WIDTH = 10;
	var MAX_HEIGHT = 10;
	var DB_NAME = "three_bead_telemetry";

	var STYLE = {
		BACKGROUND_COLOR: PS.COLOR_BLACK,
		BEAD_COLOR: PS.COLOR_BLACK,
		FADE_COLOR: PS.COLOR_GRAY,
		FADE_TIME: 20,
		STATUS_COLOR: PS.COLOR_WHITE,
		HOVER: {
			COLOR: PS.COLOR_WHITE,
			COLOR_ACTIVE: 0xFF3232,
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
	var SOUND_DROP = "drop";

	var BEAD_TYPES = [
		{ // Red Square
			color: PS.COLOR_RED,
			glyph: 0x25FC,
		},
		{ // Light Blue Rhombus
			color: 0x0080FF,
			glyph: 0x1F537,
		},
		{ // Orange Triangle
			color: PS.COLOR_ORANGE,
			glyph: 0x25BC,
		},
		{ // Cyan Circle
			color: PS.COLOR_CYAN,
			glyph: 0x26AB,
		},
		{ // Purple Heart
			color: PS.COLOR_VIOLET,
			glyph: 0x1F49C,
		},
		{ // Green Clover
			color: PS.COLOR_GREEN,
			glyph: 0x2618,
		},
		{ // Yellow Star
			color: PS.COLOR_YELLOW,
			glyph: 0x2605,
		},
		{ // Pink Cross
			color: PS.COLOR_MAGENTA,
			glyph: 0x2756,
		},
		{ // White Snowflake
			color: PS.COLOR_WHITE,
			glyph: 0x2746,
		},
		{ // Blue Music Note
			color: PS.COLOR_BLUE,
			glyph: 0x266B,
		}
	]

	var COMPLETION_TEXT = [
		"Good job!",
		"Well done!",
		"Nice work.",
		"You're an expert!",
		"Great skills!",
		"Your smile is contagious.",
		"You look great today!",
		"You're a smart cookie.",
		"I bet you make babies smile.",
		"You have impeccable manners.",
		"I like your style.",
		"You have the best laugh.",
		"I appreciate you.",
		"You are the most perfect you there is.",
		"You are enough.",
		"You're strong.",
		"Your perspective is refreshing.",
		"You're an awesome friend.",
		"You light up the room.",
		"You deserve a hug right now.",
		"You should be proud of yourself.",
		"You're more helpful than you realize.",
		"You have a great sense of humor.",
		"You've got all the right moves!",
		"You're all that and a super-size bag of chips.",
		"On a scale from 1 to 10, you're an 11.",
		"You are brave.",
		"You have the courage of your convictions.",
		"Your eyes are breathtaking.",
		"You are making a difference.",
		"You're like sunshine on a rainy day.",
		"You bring out the best in other people.",
		"You're a great listener.",
		"I bet you sweat glitter.",
		"You were cool way before hipsters were cool.",
		"That color is perfect on you.",
		"Hanging out with you is always a blast.",
		"You smell really good.",
		"Being around you makes everything better!",
		"Colors seem brighter when you're around.",
		"You're wonderful.",
		"Jokes are funnier when you tell them.",
		"Your bellybutton is kind of adorable.",
		"Your hair looks stunning.",
		"You're one of a kind!",
		"You're inspiring.",
		"Our community is better because you're in it.",
		"You have the best ideas.",
		"You're a candle in the darkness.",
		"You're a great example to others.",
		"You always know just what to say.",
		"You could survive a Zombie apocalypse.",
		"You're more fun than bubble wrap.",
		"When you make a mistake, you fix it.",
		"You're great at figuring stuff out.",
		"Your voice is magnificent.",
		"You're like a breath of fresh air.",
		"You're so thoughtful.",
		"Your creative potential seems limitless.",
		"Your name suits you to a T.",
		"You're irresistible when you blush.",
		"You seem to really know who you are.",
		"Any team would be lucky to have you on it.",
		"I bet you do the crossword puzzle in ink.",
		"Babies and small animals probably love you.",
		"There's ordinary, and then there's you.",
		"You're someone's reason to smile.",
		"You have a good head on your shoulders.",
		"You're really something special.",
		"You're a gift to those around you."
	];

	var TUTORIAL_COUNT = 3;

	var LEVEL_DATA = [
		{
			width: 7,
			height: 1,
			clearToNext: -63,
			activeTypes: 0,
			customMap: [[0], [2], [0], [1], [4], [3], [0]],
			statusText: "Touch and drag cells to swap them!"
		},
		{
			width: 2,
			height: 3,
			clearToNext: -27,
			activeTypes: 0,
			customMap: [[2, 3, 3], [2, 2, 3]],
			statusText: "Make cool combos!"
		},
		{
			width: 3,
			height: 4,
			clearToNext: 0,
			activeTypes: 0,
			customMap: [[-1, -2, -3, 3], [4, 3, 4, 4], [-4, -5, -6, 3]],
			statusText: "Make chains for tons of points!"
		},
		{
			width: 6,
			height: 6,
			clearToNext: 100,
			activeTypes: 5,
			statusText: "You're on your own!"
		},
		{
			width: 7,
			height: 7,
			clearToNext: 250,
			activeTypes: 5,
			statusText: "Level 2"
		},
		{
			width: 7,
			height: 7,
			clearToNext: 500,
			activeTypes: 6,
			statusText: "Level 3"
		},
		{
			width: 8,
			height: 8,
			clearToNext: 1000,
			activeTypes: 7,
			statusText: "Level 4"
		},
		{
			width: 8,
			height: 8,
			clearToNext: 4000,
			activeTypes: 8,
			statusText: "Level 5"
		},
		{
			width: 8,
			height: 8,
			clearToNext: 8000,
			activeTypes: 8,
			statusText: "Level 6"
		},
		{
			width: 8,
			height: 8,
			clearToNext: 15000,
			activeTypes: 9,
			statusText: "Level 7"
		},
		{
			width: 9,
			height: 9,
			clearToNext: 25000,
			activeTypes: 9,
			statusText: "Level 8"
		},
		{
			width: 10,
			height: 10,
			clearToNext: 50000,
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
	var score = -72; // So that your score is exactly 0 when you start level 1

	// Lock the controls after matching to fade in new cells
	var controlsLocked = 0; // Number of ticks to lock controls for

	function loadLevel() {
		PS.dbEvent(DB_NAME, "Loaded level", levelIndex);
		if (levelIndex >= LEVEL_DATA.length) {
			currentLevel = LEVEL_DATA[LEVEL_DATA.length-1];
			currentLevel.clearToNext = currentLevel.clearToNext + levelIndex * 1000;
		} else {
			currentLevel = LEVEL_DATA[levelIndex];
		}
		width = currentLevel.width;
		height = currentLevel.height;
		activeTypes = currentLevel.activeTypes;
		setGridSize(width, height);

		PS.statusColor( STYLE.STATUS_COLOR );
		if (levelIndex >= TUTORIAL_COUNT) {
			PS.statusText(currentLevel.statusText + " Score: " + score + SCORE_PAD);
		} else {
			PS.statusText(currentLevel.statusText);
		}

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
			if (cellMap[x][y] < 0) {
				PS.glyph(x, y, 0);
			} else {
				var cell = BEAD_TYPES[cellMap[x][y]]
				PS.glyph(x, y, cell.glyph);
				PS.glyphColor(x, y, cell.color);
			}
			if (fade) {
				if (PS.fade(x, y).rate == 0) {
					PS.fade(x, y, 0);
					PS.color(x, y, fade);
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
			var available = [];
			for (var i = 0; i < activeTypes; i++) {
				if (!findMatches(x, y, false, i)) {
					available.push(i);
				}
			}
			if (available.length > 0) {
				cellMap[x][y] = available[PS.random(available.length) - 1];
			} else {
				cellMap[x][y] = -PS.random(22222222222222);
			}
			// Check if in tutorial level, if yes, don't fade drop in
			if (levelIndex >= TUTORIAL_COUNT) {
				drawCell(x, y, STYLE.FADE_COLOR);
			} else {
				drawCell(x, y);
			}
		}
	}

	// Matching functions
	var markedForClear = {};

	// Supports PS.ALL
	function findMatches(x, y, clear = true, cellValue = undefined) {
		var match_found = false;
		if (x == PS.ALL) {
			for (var i = 0; i < width; i++) {
				if (findMatches(i, y)) {
					match_found = true;
				}
			}
			clearMarkedCells();
		} else if (y == PS.ALL) {
			for (var j = 0; j < height; j++) {
				if (findMatches(x, j)) {
					match_found = true;
				}
			}
		} else {
			var selfType = cellValue ? cellValue : cellMap[x][y];
			if (selfType < 0) {
				return match_found;
			}
			// Finds all horizontal and vertical matches involving cell at (x, y)
			var matchingCells = [[x, y]];
			for (var i = x + 1; i < width && cellMap[i][y] == selfType; i++) {
				matchingCells.push([i, y])
			}
			for (var i = x - 1; i >= 0 && cellMap[i][y] == selfType; i--) {
				matchingCells.push([i, y])
			}
			if (matchingCells.length >= 3) {
				match_found = true;
				if (clear) {
					for (var cell of matchingCells) {
						markedForClear[cell] = true;
					}
				}
			}

			var matchingCells = [[x, y]]
			for (var j = y + 1; j < height && cellMap[x][j] == selfType; j++) {
				matchingCells.push([x, j])
			}
			for (var j = y - 1; j >= 0 && cellMap[x][j] == selfType; j--) {
				matchingCells.push([x, j])
			}
			if (matchingCells.length >= 3) {
				match_found = true;
				if (clear) {
					for (var cell of matchingCells) {
						markedForClear[cell] = true;
					}
				}
			}
		}
		return match_found;
	}

	var combo = 0;
	var last_dropped = false;
	var completion_text_displayed = false;

	function clearMarkedCells() {
		for (var cell of Object.keys(markedForClear)) {
			var x = parseInt(cell.split(',')[0]);
			var y = parseInt(cell.split(',')[1]);
			if (cellMap[x][y] >= 0) {
				var fadeColor = BEAD_TYPES[cellMap[x][y]].color;
				cellMap[x][y] = -1;
				drawCell(x, y, fadeColor);
			}
		}
		// Incrase score based on amount cleared
		var numCleared = Object.keys(markedForClear).length;
		if (numCleared > 0) {
			PS.dbEvent(DB_NAME, "Cleared N cells", numCleared);
			if (combo > 1) {
				PS.dbEvent(DB_NAME, "at combo level", combo);
			}
			console.log("Score gained: N ^ 2 * 2 ^ C = " + numCleared + " ^ 2 * 2 ^ " + combo + " = " + numCleared * numCleared * (1 << combo));

			if (combo > 0) {
				PS.audioPlay( SOUND_COMBO, SOUND_OPTIONS );
			} else {
				PS.audioPlay( SOUND_CLEAR, SOUND_OPTIONS );
			}

			score += numCleared * numCleared * (1 << combo);
			combo++;
			controlsLocked = STYLE.CLEAR_DELAY;
			if (score >= currentLevel.clearToNext) {
				controlsLocked = STYLE.CLEAR_DELAY;
				if (completion_text_displayed && levelIndex >= TUTORIAL_COUNT) {
					PS.statusText("Score: " + score + SCORE_PAD + " out of " + currentLevel.clearToNext + SCORE_PAD);
				} else {
					PS.statusText(COMPLETION_TEXT[PS.random(COMPLETION_TEXT.length) - 1]);
					completion_text_displayed = true;
				}
			} else {
				if (levelIndex >= TUTORIAL_COUNT) {
					PS.statusText("Score: " + score + SCORE_PAD + " out of " + currentLevel.clearToNext + SCORE_PAD);
				}
			}
		} else {
			combo = 0; // Start at combo = 0 so base multiplier is 1.
			// Clearing is done. Determine whether to move to next level
			if (score >= currentLevel.clearToNext) {
				// Delay the level change until we finish dropping tiles
				if (!last_dropped && levelIndex >= TUTORIAL_COUNT) {
					last_dropped = true;
					controlsLocked = STYLE.LEVEL_DELAY;
				} else {
					last_dropped = false;
					completion_text_displayed = false;
					while (score >= LEVEL_DATA[++levelIndex].clearToNext) {}
					loadLevel();
				}
			}
		}

		markedForClear = {};
		return numCleared;
	}

	function dropRows() {
		// Move tiles down in similar fashion to bubble-sort
		var tileMoved = false;
		for (var i = 0; i < width; i++) {
			// do {
			// Bubble tiles down from the bottom-up
			for (var j = height - 1; j > 0; j--) {
				if (cellMap[i][j] < 0 && cellMap[i][j - 1] >= 0) {
					tileMoved = true;
					cellMap[i][j] = cellMap[i][j - 1];
					cellMap[i][j - 1] = -1;
				}
			}
			// } while (tileMoved);

			// Redraw column
			drawCell(i, PS.ALL);

			// Fade new cells from the top
			if (cellMap[i][0] < 0) {
				fillRandom(i, 0);
			}
			if (height > 1 && cellMap[i][1] < 0 && levelIndex >= TUTORIAL_COUNT) {
				tileMoved = true;
			}
		}

		if (!tileMoved) {
			findMatches(PS.ALL, PS.ALL);
		} else {
			PS.audioPlay(SOUND_DROP, SOUND_OPTIONS);
		}
		return tileMoved;
	}

	// -1 if not active or targeting
	var activeX = -1, activeY = -1, targetX = -1, targetY = -1;

	// Swap target and active cells
	// Returns -1 if no swap, otherwise returns cleared cells from resulting matches
	function swap() {
		if (targetX < 0 || activeX < 0) {
			return -1;
		}
		var temp = cellMap[activeX][activeY];
		cellMap[activeX][activeY] = cellMap[targetX][targetY];
		cellMap[targetX][targetY] = temp;
		PS.audioPlay( SOUND_SWAP, SOUND_OPTIONS );
		findMatches(activeX, activeY);
		findMatches(targetX, targetY);
		if (levelIndex == 0) {
			PS.statusText("Match 3 in a row to clear!");
		}
		var clearedCells = clearMarkedCells();
		if (clearedCells > 0) {
			drawCell(activeX, activeY);
			drawCell(targetX, targetY);
		} else {
			drawCell(activeX, activeY, STYLE.FADE_COLOR);
			drawCell(targetX, targetY, STYLE.FADE_COLOR);
		}
		return clearedCells;
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
			if (cellMap[new_targetX][new_targetY] >= 0) {
				targetX = new_targetX;
				targetY = new_targetY;
				PS.border ( targetX, targetY, STYLE.HOVER.THICKNESS_ACTIVE );
				PS.borderColor ( targetX, targetY, STYLE.HOVER.COLOR_ACTIVE );
			}
		}
	}

	function tick() {
		if (controlsLocked > 0) {
			controlsLocked--;
			if (controlsLocked == 0) {
				if (dropRows()) {
					controlsLocked = 4;
				}
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
			if (cellMap[x][y] >= 0) {
				if (!(levelIndex == 2 && y >= 2)) {
					activeX = x;
					activeY = y;
					PS.border ( x, y, STYLE.HOVER.THICKNESS_ACTIVE );
					PS.borderColor ( x, y, STYLE.HOVER.COLOR_ACTIVE );
				}
			}
		},
		release: function(x, y) {
			var result = swap();
			clearActive();
			clearTarget();
			if (result <= 0) {
				if (cellMap[x][y] >= 0) {
					if (!(levelIndex == 2 && y >= 2)) {
						PS.borderColor ( x, y, STYLE.HOVER.COLOR );
						PS.border ( x, y, STYLE.HOVER.THICKNESS );
					}
				}
			}
		},
		enter: function(x, y) {
			if (controlsLocked > 0) {
				return;
			}
			if (activeX >= 0) {
				setTarget(x, y);
			} else {
				if (cellMap[x][y] >= 0) {
					if (!(levelIndex == 2 && y >= 2)) {
						PS.borderColor ( x, y, STYLE.HOVER.COLOR );
						PS.border ( x, y, STYLE.HOVER.THICKNESS );
					}
				}
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
			// Only dbSend if hosted, not locally testing
			if (window.location.hostname == "users.wpi.edu") {
				PS.dbSend(DB_NAME, "lwang5");
				PS.dbSend(DB_NAME, "jctblackman");
			}
			PS.dbErase(DB_NAME);
		},

		// Initialize the game
		// Called once at startup

		init: function (system, options) {
			// Preload & lock sounds
			PS.audioLoad( SOUND_LEVEL, SOUND_OPTIONS );
			PS.audioLoad( SOUND_CLEAR, SOUND_OPTIONS );
			PS.audioLoad( SOUND_COMBO, SOUND_OPTIONS );
			PS.audioLoad( SOUND_SWAP, SOUND_OPTIONS );
			PS.audioLoad( SOUND_DROP, SOUND_OPTIONS );

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
