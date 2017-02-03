// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

// The G object will contain all public constants, variables and functions

var G;

// This self-invoking function encapsulates all game functionality.
// It is called as this file is loaded, and initializes the G object.
/**
 * Author: Lambert Wang (lwang5@wpi.edu)
 */

( function () {
	"use strict";

	var TILE = {
		UNDEFINED: -1, // Used for out of bounds
		WALL: 0,
		FLOOR: 1,
		GOLD: 2,
	}

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

	var generateMap = function(width, height, gold_count) {
		// Starting point is always at 0, 0.
		// Width and height must be odd.
		// Uses a modified Prim's algorithm to generate mazes

		var maze = new Array(width * height);
		var walls = [];
		for (var i = 0; i < maze.length; i++) {
			maze[i] = TILE.WALL;
		}

		var put = function(x, y, val) {
			maze[x + y * width] = val;
		}

		var check = function(x, y) {
			if (x >= 0 && y >= 0 && x < width && y < height) {
				return maze[x + y * width];
			}
			return TILE.UNDEFINED;
		}

		var carve = function(cell) {
			if (check(cell[0], cell[1]) > TILE.WALL) {
				return;
			}
			var neighbors = [
				[cell[0] + 2, cell[1]],
				[cell[0] - 2, cell[1]],
				[cell[0], cell[1] + 2],
				[cell[0], cell[1] - 2]
			];
			var cell_paths = [];
			var cell_walls = [];
			for (var neighbor of neighbors) {
				if (!walls.includes(neighbor)) {
					var neighbor_val = check(neighbor[0], neighbor[1]);
					if (neighbor_val == TILE.WALL) {
						cell_walls.push(neighbor);
					}
					if (neighbor_val > TILE.WALL) { // A 0 or negative value represents closed space
						cell_paths.push(neighbor);
					}
				}
			}

			var cells_to_carve = [cell];
			
			if (cell_paths.length > 0) {
				var inter_cell = cell_paths[Math.floor(Math.random() * cell_paths.length)];
				cells_to_carve.push([(inter_cell[0] + cell[0]) / 2, (inter_cell[1] + cell[1]) / 2]);
			}

			for (var cell of cells_to_carve) {
				put(cell[0], cell[1], TILE.FLOOR);
			}

			walls = walls.concat(cell_walls);
		}

		carve([1, 1]);

		while (walls.length > 0) {
			carve(walls.splice(Math.floor(Math.random() * walls.length), 1)[0]);
		}

		// Place gold now
		var visited = [1 + width];
		var gold_placed = 0;
		while (gold_placed < gold_count) {
			var pick = Math.floor(Math.random() * width * height);
			if (!visited.includes[pick]) {
				if (check(pick % width, Math.floor(pick / width)) == TILE.FLOOR) {
					gold.push(pick);
					put(pick % width, Math.floor(pick / width), TILE.GOLD);
					gold_placed++;
				}
			}
		}

		return {
			width: WIDTH,
			height: HEIGHT,
			pixelSize: 1, // must be present!
			data: maze
		}
	}

	/**
	 * This function generates the entire state of the game.
	 * 
	 */
	var setupState = function() {
		// Randomly generate color scheme
		color_scheme = generateColors();
		exit_ready = false;
		gold = [];
		gold_count = Math.floor(WIDTH * HEIGHT * GOLD_FREQUENCY) + 1; // initial number of gold pieces in map
		gold_found = 0;

		map = generateMap(WIDTH, HEIGHT, gold_count)

		// randomly pick an exit
		// O(infinity)
		while (true) {
			var index = Math.floor(Math.random() * map.data.length);
			if (map.data[index] > TILE.WALL) {
				// These two variables control the location of the exit
				// This location MUST correspond to a floor location (1) in the maza.data array
				// or a startup error will occur!
				exitX = index % WIDTH;
				exitY = Math.floor(index / WIDTH);
				break;
			}
		}

		// These two variables control the initial location of the actor
		// This location MUST correspond to a floor location (1) in the maza.data array
		// or a startup error will occur!
		actorX = 1; // initial x-pos of actor sprite
		actorY = 1; // initial y-pos of actor sprite
	};

	// Randomly generate color scheme
	var generateColors = function() {
		var color_hue = Math.floor(Math.random() * 360);
	
		return {
			// bg: PS.COLOR_GRAY_DARK, // background color
			wall:  hsvToRgb(color_hue, .8, .2), // wall color
			floor:  hsvToRgb(color_hue, .8, .5), // floor color
			actor:  hsvToRgb((color_hue + 180) % 360, .4, .8), // actor color
			gold:  PS.COLOR_YELLOW, // gold color
			exit:  hsvToRgb((color_hue + 90) % 360, 1, .2) // exit color
		}
	}

	// Constants are in all upper-case

	var WIDTH = 21; // grid width
	var HEIGHT = 21; // grid height

	var GOLD_FREQUENCY = .03;

	var PLANE_FLOOR = 0; // z-plane of floor
	var PLANE_ACTOR = 1; // z-plane of actor
	var SOUND_OPTIONS = {
		path: "/project1/assets/",
		lock: true,
		fileTypes: [ "wav" ]
	};

	// Sounds created using http://www.bfxr.net/ available under the Apache 2.0 License
	var SOUND_FLOOR = "sf_click"; // touch floor sound
	var SOUND_WALL = "sf_wall"; // touch wall sound
	var SOUND_GOLD = "sf_coin"; // take coin sound
	var SOUND_OPEN = "sf_open"; // open exit sound
	var SOUND_WIN = "sf_win"; // win sound
	var SOUND_ERROR = "fx_uhoh"; // error sound

	// Variables
	var id_sprite; // actor sprite id
	var id_path; // pathmap id for pathfinder
	var id_timer; // timer id

	var color_hue = Math.floor(Math.random() * 360);
	
	// Randomly generate color scheme
	var color_scheme;
	var actorX, actorY, exitX, exitY, map;
	var won = false; // true on win
	var exit_ready = false; // true when exit is opened
	var gold;
	var gold_count;
	var gold_found;

	setupState();

	// Timer function, called every 1/10th sec
	// This moves the actor along paths

	var path; // path to follow, null if none
	var step; // current step on path
	var firstGame = true;
	var tick_count;

	var moveActor = function() {
		var p, nx, ny, ptr, val;
		if ( !path ) { // path invalid (null)?
			return; // just exit
		}

		// Get next point on path

		p = path[ step ];
		nx = p[ 0 ]; // next x-pos
		ny = p[ 1 ]; // next y-pos

		// If actor already at next pos,
		// path is exhausted, so nuke it
		if ( ( actorX === nx ) && ( actorY === ny ) ) {
			path = null;
			return;
		}

		// Move sprite to next position

		PS.spriteMove( id_sprite, nx, ny );
		actorX = nx; // update actor's xpos
		actorY = ny; // and ypos

		// If actor has reached a gold piece, take it

		ptr = ( actorY * WIDTH ) + actorX; // pointer to map data under actor
		val = map.data[ ptr ]; // get map data
		if ( val === TILE.GOLD ) {
			gold.splice(gold.indexOf(ptr), 1);
			gold_found ++;
			map.data[ ptr ] = TILE.FLOOR; // change gold to floor in map.data
			PS.gridPlane( PLANE_FLOOR ); // switch to floor plane
			PS.color( actorX, actorY, color_scheme.floor ); // change visible floor color

			// If last gold has been collected, activate the exit
			if ( gold.length == 0 ) {
				exit_ready = true;
				PS.color( exitX, exitY, color_scheme.exit ); // show the exit
				PS.glyphColor( exitX, exitY, PS.COLOR_WHITE ); // mark with white X
				PS.glyph( exitX, exitY, "X" );
				PS.statusText( "Found " + gold_found + " gold! Exit open!" );
				PS.audioPlay( SOUND_OPEN, SOUND_OPTIONS );
			}

			// Otherwise just update score

			else {
				PS.statusText( "Found " + gold_found + " gold!" );
				PS.audioPlay( SOUND_GOLD, SOUND_OPTIONS );
			}
		}

		// If exit is ready and actor has reached it, end game

		else if ( exit_ready && ( actorX === exitX ) && ( actorY === exitY ) ) {
			PS.timerStop( id_timer ); // stop movement timer
			PS.statusText( "You escaped with " + gold_count + " gold!" );
			PS.audioPlay( SOUND_WIN, SOUND_OPTIONS );
			PS.glyph( exitX, exitY, "" );
			won = true;

			setupState();
			setTimeout(PS.statusText.bind(this, "Restarting..." ), 2000);
			setTimeout(setupGame, 4000);
			tick_count = 20;
		}

		step += 1; // point to next step

		// If no more steps, nuke path
		if (step >= path.length ) {
			path = null;
		}
	}

	var tick = function () {
		tick_count++;

		moveActor()
		
		if (won) {
			return;
		}
		
		// Randomly move gold every 2 seconds (for some reason)
		if (tick_count % 20 == 0) {
			var new_gold = [];
			for (var gold_piece of gold) { 
				// Gold pieces are stored as indexes into the map
				// Check 4 directions
				var directions = [
					gold_piece + 1,
					gold_piece - 1,
					gold_piece + WIDTH,
					gold_piece - WIDTH
				];
				var valid_directions = [];
				for (var direction of directions) {
					if (map.data[direction] == TILE.FLOOR && direction != actorX + actorY * WIDTH) {
						valid_directions.push(direction);
					}
				}
				if (valid_directions.length > 0) {
					var new_position = valid_directions[Math.floor(Math.random() * valid_directions.length)];
					map.data[new_position] = TILE.GOLD;
					PS.color(new_position % WIDTH, Math.floor(new_position / WIDTH), color_scheme.gold);
					map.data[gold_piece] = TILE.FLOOR;
					PS.color(gold_piece % WIDTH, Math.floor(gold_piece / WIDTH), color_scheme.floor);
					new_gold.push(new_position);
				} else {
					new_gold.push(gold_piece);
				}
			}
			gold = new_gold;
		}
	};

	// Initialize the game
	var setupGame = function() {
		var x, y, val, color;

		PS.gridColor( color_scheme.wall ); // Set background color to wall color

		// Check for illegal actor/exit locations
		val = map.data[ ( actorY * WIDTH ) + actorX ]; // get map data under actor
		if ( val <= TILE.WALL ) {
			console.log(map);
			PS.debug( "ERROR: Actor not on empty floor! value found: " + val);
			PS.audioPlay( SOUND_ERROR );
			return;
		}

		val = map.data[ ( exitY * WIDTH ) + exitX ]; // get map data at exit position
		if ( val <= TILE.WALL ) {
			PS.debug( "ERROR: Exit not on empty floor! value found: " + val );
			PS.audioPlay( SOUND_ERROR );
			return;
		}

		PS.statusText( "Click/touch to move" );

		// Use the map.data array to draw the maze
		// This also counts the number of gold pieces that have been placed

		for ( y = 0; y < HEIGHT; y += 1 ) {
			for ( x = 0; x < WIDTH; x += 1 ) {
				val = map.data[ ( y * WIDTH ) + x ]; // get data
				switch (val) {
					case TILE.WALL:
						color = color_scheme.wall;
						break;
					case TILE.FLOOR:
						color = color_scheme.floor;
						break;
					case TILE.GOLD:
						color = color_scheme.gold;
						break;
				}
				if (!firstGame) {
					// Onend function ensures that fade only happens once
					PS.fade(x, y, 30, { onEnd: function(x, y) {
						PS.fade(x, y, 0)
					}.bind(this, x, y) });
				}
				PS.color( x, y, color );
			}
		}

		// Create 1x1 solid sprite for actor
		// Place on actor plane in initial actor position
		if (id_sprite) {
			PS.spriteDelete(id_sprite);
		}
		id_sprite = PS.spriteSolid( 1, 1 );
		PS.spriteSolidColor( id_sprite, color_scheme.actor );
		PS.spritePlane( id_sprite, PLANE_ACTOR );
		PS.spriteMove( id_sprite, actorX, actorY );

		// Create pathmap from our imageMap
		// for use by pathfinder
		if (id_path) {
			PS.pathDelete(id_path);
		}
		id_path = PS.pathMap( map );
		path = null; // start with no path
		step = 0;
		firstGame = false;
		tick_count = 0;
		won = false;

		// Start the timer function that moves the actor
		// Run at 10 frames/sec (every 6 ticks)
		id_timer = PS.timerStart(6, tick );
	}
	// Public functions are exposed in the global G object, which is initialized here.
	// Only two functions need to be exposed; everything else is encapsulated!
	// So safe. So elegant.

	G = {
		// Initialize the game
		// Called once at startup

		init : function () {

			// Establish grid size
			// This should always be done FIRST, before any other initialization!

			PS.gridSize( WIDTH, HEIGHT );

			PS.gridColor( color_scheme.wall ); // Set background color to wall color (do this before initial fade)
			PS.gridFade(30);
			PS.border( PS.ALL, PS.ALL, 0 ); // no bead borders
			PS.statusColor( PS.COLOR_WHITE );
			

			// Preload & lock sounds
			PS.audioLoad( SOUND_FLOOR, SOUND_OPTIONS );
			PS.audioLoad( SOUND_WALL, SOUND_OPTIONS );
			PS.audioLoad( SOUND_GOLD, SOUND_OPTIONS );
			PS.audioLoad( SOUND_OPEN, SOUND_OPTIONS );
			PS.audioLoad( SOUND_WIN, SOUND_OPTIONS );

			setupGame();
		},

		// move( x, y )
		// Set up new path for the actor to follow

		move : function ( x, y ) {
			var line;

			// Do nothing if game over
			if ( won ) {
				return;
			}

			// Use pathfinder to calculate a line from current actor position
			// to touched position

			line = PS.pathFind( id_path, actorX, actorY, x, y );

			// If line is not empty, it's valid,
			// so make it the new path
			// Otherwise hoot at the player

			if ( line.length > 0 ) {
				path = line;
				step = 0; // start at beginning
				PS.audioPlay( SOUND_FLOOR, SOUND_OPTIONS );
			}
			else {
				PS.audioPlay( SOUND_WALL, SOUND_OPTIONS );
			}
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

PS.touch = function( x, y, data, options ) {
	"use strict";

	G.move( x, y ); // initiates actor movement
};

// All event functions must be present to prevent startup errors,
// even if they don't do anything

PS.release = function( x, y, data, options ) {
	"use strict";
};

PS.enter = function( x, y, data, options ) {
	"use strict";
};

PS.exit = function( x, y, data, options ) {
	"use strict";
};

PS.exitGrid = function( options ) {
	"use strict";
};

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

