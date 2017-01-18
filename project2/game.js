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

	var seed = Math.random() * (1 << 14); // 14 bits of cryptographic security
	for (var i = 0; i < seed; i++) {
		PS.random(2);
	}

	// Metrics and Tracking Configuration
	var GOLD_TYPES = { // Wall border definitions
		"dead ends": [3],
		"corridors": [2],
		"corners": [2], // TODO: Fix me
		"intersections": [0, 1]
	}

	var GOLD_MAX = 10; // maximum gold

	// Constants are in all upper-case

	var PLANE_FLOOR = 0; // z-plane of floor
	var PLANE_ACTOR = 1; // z-plane of actor

	var COLOR_BG = PS.COLOR_GRAY_DARK; // background color
	var COLOR_WALL = PS.COLOR_BLACK; // wall color
	var COLOR_FLOOR = PS.COLOR_GRAY; // floor color
	var COLOR_GOLD = PS.COLOR_YELLOW; // gold color
	var COLOR_ACTOR = PS.COLOR_RED; // actor color
	var COLOR_EXIT = PS.COLOR_BLUE; // exit color

	var SOUND_FLOOR = "fx_click"; // touch floor sound
	var SOUND_WALL = "fx_hoot"; // touch wall sound
	var SOUND_GOLD = "fx_coin1"; // take coin sound
	var SOUND_OPEN = "fx_powerup8"; // open exit sound
	var SOUND_WIN = "fx_tada"; // win sound
	var SOUND_ERROR = "fx_uhoh"; // error sound

	var MAP_UNDEFINED = -1; // void
	var MAP_WALL = 0; // wall
	var MAP_FLOOR = 1; // floor
	var MAP_GOLD = 2; // floor + gold
	var MAP_ACTOR = 3; // floor + actor
	var MAP_EXIT = 4; // floor + exit

	var MAP_ID = 0; // map number

	// Variables
	var id_sprite; // actor sprite id
	var id_path; // pathmap id for pathfinder
	var id_timer; // timer id

	var gold_count = 0; // initial number of gold pieces in map
	var gold_found = 0; // gold pieces collected
	var won = false; // true on win

	// This imageMap is used for map drawing and pathfinder logic
	// All properties MUST be present!
	// The map.data array controls the layout of the maze,
	// the location of the gold pieces, the actor and the exit
	// 0 = wall, 1 = floor, 2 = floor + gold, 3 = floor + actor, 4 = floor + exit
	// To move a gold piece, swap a 2 with a 1
	// To move the actor's initial position, swap the 3 and a 1
	// To move the exit's position, swap the 4 and a 1
	// You cannot have more than one actor/exit, or more than GOLD_MAX gold pieces!
	var map = {
		width : 23, height : 23, pixelSize : 1,
		data : [
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
			0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0,
			0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0,
			0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0,
			0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0,
			0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0,
			0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0,
			0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0,
			0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0,
			0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0,
			0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0,
			0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
			0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0,
			0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0,
			0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0,
			0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
			0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0,
			0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0,
			0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0,
			0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0,
			0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
		]
	};

	var getMapVal = function(x, y) {
		if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
			return MAP_UNDEFINED;
		}
		return map.data[x + y * map.width];
	}

	var wallCount = function(x, y) {
		var walls = 0;
		if (getMapVal(x - 1, y) == MAP_WALL) {
			walls++;
		}
		if (getMapVal(x + 1, y) == MAP_WALL) {
			walls++;
		}
		if (getMapVal(x, y - 1) == MAP_WALL) {
			walls++;
		}
		if (getMapVal(x, y + 1) == MAP_WALL) {
			walls++;
		}
		return walls;
	}

	var placeGold = function(wallCounts) {
		var validPlacements = [];
		for (var i = 0; i < map.width; i++) {
			for (var j = 0; j < map.height; j++) {
				if (getMapVal(i, j) == MAP_FLOOR && wallCounts.includes(wallCount(i, j))) {
					validPlacements.push(i + j * map.width);
				}
			}
		}

    for (var gold_placed = 0; gold_placed < GOLD_MAX; gold_placed++) {
      if (len(validPlacements) == 0) break;
      // Splice(index, 1) removes a value at index and returns the value
			map.data[validPlacements.splice(PS.random(validPlacements.length) - 1, 1)] = MAP_GOLD;
			gold_placed++;
    }
	}

	placeGold(GOLD_TYPES.intersections);

	// Randomly place an actor
	var randomPlace;
	do {
		randomPlace = PS.random(map.data.length) - 1;
	} while (map.data[randomPlace] != MAP_FLOOR);
	map.data[randomPlace] = MAP_ACTOR;
	
	// Randomly place an exit
	do {
		randomPlace = PS.random(map.data.length) - 1;
	} while (map.data[randomPlace] != MAP_FLOOR);
	map.data[randomPlace] = MAP_EXIT;

	// These two variables control the initial location of the actor
	var actorX; // initial x-pos of actor sprite
	var actorY; // initial y-pos of actor sprite

	// These two variables control the location of the exit
	var exitX; // x-pos of exit
	var exitY; // y-pos of exit

	var exit_ready = false; // true when exit is opened

	// Timer function, called every 1/10th sec
	// This moves the actor along paths
	var path; // path to follow, null if none
	var step; // current step on path

	var tick = function () {
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

		ptr = ( actorY * map.height ) + actorX; // pointer to map data under actor
		val = map.data[ ptr ]; // get map data
		if ( val === MAP_GOLD ) {
			map.data[ ptr ] = MAP_FLOOR; // change gold to floor in map.data
			PS.gridPlane( PLANE_FLOOR ); // switch to floor plane
			PS.color( actorX, actorY, COLOR_FLOOR ); // change visible floor color

			// If last gold has been collected, activate the exit

			gold_found += 1; // update gold count
			if ( gold_found >= gold_count ) {
				exit_ready = true;
				PS.color( exitX, exitY, COLOR_EXIT ); // show the exit
				PS.glyphColor( exitX, exitY, PS.COLOR_WHITE ); // mark with white X
				PS.glyph( exitX, exitY, "X" );
				PS.statusText( "Found " + gold_found + " gold! Exit open!" );
				PS.audioPlay( SOUND_OPEN );
			}

			// Otherwise just update score

			else {
				PS.statusText( "Found " + gold_found + " gold!" );
				PS.audioPlay( SOUND_GOLD );
			}
		}

		// If exit is ready and actor has reached it, end game

		else if ( exit_ready && ( actorX === exitX ) && ( actorY === exitY ) ) {
			PS.timerStop( id_timer ); // stop movement timer
			PS.statusText( "You escaped with " + gold_found + " gold!" );
			PS.audioPlay( SOUND_WIN );
			won = true;
			return;
		}

		step += 1; // point to next step

		// If no more steps, nuke path

		if ( step >= path.length ) {
			path = null;
		}
	};

	// Public functions are exposed in the global G object, which is initialized here.
	// Only two functions need to be exposed; everything else is encapsulated!
	// So safe. So elegant.

	G = {
		// Initialize the game
		// Called once at startup

		init : function () {
			var len, i, x, y, val, color;

			// Establish grid size
			// This should always be done FIRST, before any other initialization!

			PS.gridSize( map.width, map.height );
			PS.gridColor( COLOR_BG ); // grid background color
			PS.border( PS.ALL, PS.ALL, 0 ); // no bead borders

			// Locate positions of actor and exit, count gold pieces, draw map

			gold_count = 0;
			actorX = exitX = -1; // mark as not found
			for ( y = 0; y < map.height; y += 1 ) {
				for ( x = 0; x < map.width; x += 1 ) {
					val = map.data[ ( y * map.height ) + x ]; // get map data
					if ( val === MAP_WALL ) {
						PS.color( x, y, COLOR_WALL );
					}
					else if ( val === MAP_FLOOR ) {
						PS.color( x, y, COLOR_FLOOR );
					}
					else if ( val === MAP_GOLD ) {
						gold_count += 1;
						if ( gold_count > GOLD_MAX ) {
							PS.debug( "WARNING: More than " + GOLD_MAX + " gold!\n" );
							PS.audioPlay( SOUND_ERROR );
							return;
						}
						PS.color( x, y, COLOR_GOLD );
					}
					else if ( val === MAP_ACTOR ) {
						if ( actorX >= 0 ) {
							PS.debug( "WARNING: More than one actor!\n" );
							PS.audioPlay( SOUND_ERROR );
							return;
						}
						actorX = x;
						actorY = y;
						map.data[ ( y * map.height ) + x ] = MAP_FLOOR; // change actor to floor
						PS.color( x, y, COLOR_FLOOR );
					}
					else if ( val === MAP_EXIT ) {
						if ( exitX >= 0 ) {
							PS.debug( "WARNING: More than one exit!\n" );
							PS.audioPlay( SOUND_ERROR );
							return;
						}
						exitX = x;
						exitY = y;
						map.data[ ( y * map.height ) + x ] = MAP_FLOOR; // change exit to floor
						PS.color( x, y, COLOR_FLOOR );
					}
				}
			}

			PS.statusColor( PS.COLOR_WHITE );
			PS.statusText( "Click/touch to move" );

			// Preload & lock sounds

			PS.audioLoad( SOUND_FLOOR, { lock : true } );
			PS.audioLoad( SOUND_WALL, { lock : true } );
			PS.audioLoad( SOUND_GOLD, { lock : true } );
			PS.audioLoad( SOUND_OPEN, { lock : true } );
			PS.audioLoad( SOUND_WIN, { lock : true } );

			// Create 1x1 solid sprite for actor
			// Place on actor plane in initial actor position

			id_sprite = PS.spriteSolid( 1, 1 );
			PS.spriteSolidColor( id_sprite, COLOR_ACTOR );
			PS.spritePlane( id_sprite, PLANE_ACTOR );
			PS.spriteMove( id_sprite, actorX, actorY );

			// Create pathmap from our imageMap
			// for use by pathfinder

			id_path = PS.pathMap( map );

			// Start the timer function that moves the actor
			// Run at 10 frames/sec (every 6 ticks)

			path = null; // start with no path
			step = 0;
			id_timer = PS.timerStart( 6, tick );
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
				PS.audioPlay( SOUND_FLOOR );
			}
			else {
				PS.audioPlay( SOUND_WALL );
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

