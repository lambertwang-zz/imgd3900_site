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

  // Since this code is executed *before* PS._sys(), the random seed isn't intialized.
  // I do so here using javascript's Math.random().
  var seed = Math.random()*10000;
  console.log("Seed:", seed);
  for (var i=0; i<seed; i++) {
    PS.random(10000);
  }

	// Constants are in all upper-case

	var WIDTH = PS.random(22)+7; // grid width: 8-32
	var HEIGHT = PS.random(22)+7; // grid height: 8-32

	var PLANE_FLOOR = 0; // z-plane of floor
	var PLANE_ACTOR = 1; // z-plane of actor

	var COLOR_BG = PS.COLOR_GRAY_LIGHT; // background color
	var COLOR_WALL = PS.COLOR_WHITE; // wall color
	var COLOR_FLOOR = PS.COLOR_BLACK; // floor color
	var COLOR_ACTOR = PS.COLOR_ORANGE; // actor color
	var COLOR_GOLD = PS.COLOR_RED; // gold color
	var COLOR_EXIT = PS.COLOR_GREEN; // exit color

	var SOUND_FLOOR = "move"; // touch floor sound
	var SOUND_WALL = "wall"; // touch wall sound
	var SOUND_GOLD = "gold"; // take coin sound
	var SOUND_OPEN = "exit_open"; // open exit sound
	var SOUND_WIN = "exit"; // win sound
	var SOUND_ERROR = "error"; // error sound

	var WALL = 0; // wall
	var FLOOR = 1; // floor
	var GOLD = 2; // floor + gold

	// Variables

	var id_sprite; // actor sprite id
	var id_path; // pathmap id for pathfinder
	var id_timer; // timer id
  
  var actorX, actorY; // Actor location
  var exitX, exitY; // Exit location
  var exit_ready = false; // true when exit is opened

	var gold_count; // initial number of gold pieces in map
	var gold_found; // gold pieces collected

  // Generating a random maze!
  function generateRandomMaze() {
    // First, create a blank grid, with walls
    var grid = [];
    for (var i=0; i<WIDTH; i++) {
      var row = [];
      row[0] = WALL;
      row[HEIGHT-1] = WALL;
      grid[i] = row;
    }
    grid[0].fill(WALL);
    grid[WIDTH-1].fill(WALL);

    var num_floor_squares = 0; // Used to randomly select gold & exit
    // Depth-first traversal to build out a random maze.
    function build_maze(x, y, last_dir) {
      var dir;
      while (1) {
        dir = [[-1, 0], [0, -1], [0, 1], [1, 0]][PS.random(4)-1];
        if (last_dir[0] + dir[0] == 0 && last_dir[1] + dir[1] == 0) continue; // Don't return on your path
        break;
      }
      // If the square hasn't been visited
      if (grid[x+dir[0]][y+dir[1]] == undefined) {
        // Check for a loop
        var found_floor = false;
        for (var i=0; i < 4; i++) {
          var new_dir = [[-1, 0], [0, -1], [0, 1], [1, 0]][i];
          if (dir[0] + new_dir[0] == 0 && dir[1] + new_dir[1] == 0) continue; // Ignore the current square
          if (grid[x+dir[0]+new_dir[0]][y+dir[1]+new_dir[1]] == FLOOR) {
            found_floor = true;
          }
        }
        if (found_floor) {
          grid[x+dir[0]][y+dir[1]] = WALL;
        } else {
          grid[x+dir[0]][y+dir[1]] = FLOOR;
          num_floor_squares++;
          build_maze(x+dir[0], y+dir[1], dir);
        }
      }
      // Check for dead end
      var unexplored = false;
      for (var i=0; i < 4; i++) {
        var new_dir = [[-1, 0], [0, -1], [0, 1], [1, 0]][i];
        if (grid[x+new_dir[0]][y+new_dir[1]] == undefined) {
          unexplored = true;
        }
      }
      // Use the same last_dir because it points to the way we came
      if (unexplored) build_maze(x, y, last_dir);
    }

    // Start generating a maze, centered on the actor.
    actorX = PS.random(WIDTH-2); // initial x-pos of actor sprite
    actorY = PS.random(HEIGHT-2); // initial y-pos of actor sprite
    grid[actorX][actorY] = FLOOR;
    build_maze(actorX, actorY, [0, 0]);

    // Maze is built, now populate with gold and exit
    var gold_squares = [];
    for (var g=0; g<5; g++) { // Gold generation
      gold_squares[g] = PS.random(num_floor_squares);
    }
    var exit_square = PS.random(num_floor_squares);

    var floor_no = 0;
    for (var i=0; i<WIDTH; i++) {
      for (var j=0; j<HEIGHT; j++) {
        if (grid[i][j] == FLOOR) {
          floor_no++;
          if (i == actorX && j == actorY) {
            continue; // No gold on the actor square
          } else if (exit_square == floor_no) {
            exitX = i;
            exitY = j;
            continue; // No gold on the exit square
          } else if (gold_squares.includes(floor_no)) {
            grid[i][j] = GOLD;
          }
        } else if (grid[i][j] == undefined) {
          // Some squares can get missed during the generation, so we fill them in.
          grid[i][j] = WALL;
        }
      }
    }
    var mapData = [];
    for (var j=0; j<HEIGHT; j++) {
      for (var i=0; i<WIDTH; i++) {
        mapData.push(grid[i][j]);
      }
    }
    return mapData;
  }
  
	var map = {
		width: WIDTH,
		height: HEIGHT,
		pixelSize: 1, // must be present!
    data: generateRandomMaze()
	};

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

		ptr = ( actorY * WIDTH ) + actorX; // pointer to map data under actor
		val = map.data[ ptr ]; // get map data
		if ( val === GOLD ) {
			map.data[ ptr ] = FLOOR; // change gold to floor in map.data
			PS.gridPlane( PLANE_FLOOR ); // switch to floor plane
			PS.color( actorX, actorY, COLOR_FLOOR ); // change visible floor color

			gold_found += 1; // update gold count
      // Update title & play sound
			// If last gold has been collected, activate the exit
			if ( gold_found >= gold_count ) {
				exit_ready = true;
				PS.color( exitX, exitY, COLOR_EXIT ); // show the exit
				PS.glyphColor( exitX, exitY, PS.COLOR_BLACK ); // mark with black X
				PS.glyph( exitX, exitY, "X" );
        PS.statusText( "Found all gold! Exit open!" );
        PS.audioPlay( SOUND_OPEN );
			} else {
        PS.statusText( "Found " + gold_found + " gold!" );
        PS.audioPlay( SOUND_GOLD );
      }
		}

		// If exit is ready and actor has reached it, end game

		else if ( exit_ready && ( actorX === exitX ) && ( actorY === exitY ) ) {
      PS.timerStop( id_timer ); // stop movement timer
			PS.statusText( "On to the next level!" );
      PS.glyph( exitX, exitY, "" ); // Wipe the exit X so it doesn't display "over our actor"
			PS.audioPlay( SOUND_WIN );
      
      // http://stackoverflow.com/a/951057
      function sleep (time) {
        return new Promise(resolve => setTimeout(resolve, time));
      }
      // Delays for 2.5s before continuing
      sleep(2500).then(() => {
        // Level complete, create a new level.
        map.data = generateRandomMaze();
        var saved_gold = gold_found;
        G.init();
        gold_found += saved_gold;
        gold_count += saved_gold;
        PS.statusText( "Found " + gold_found + " gold!" );
      });
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
			var x, y, val, color;

			// Establish grid size
			// This should always be done FIRST, before any other initialization!

			PS.gridSize( WIDTH, HEIGHT );
			PS.debug("Sounds used with permission from http://www.wolfensteingoodies.com/archives/olddoom/music.htm");

			// Check for illegal actor/exit locations

			val = map.data[ ( actorY * WIDTH ) + actorX ]; // get map data under actor
			if ( val !== FLOOR ) {
				PS.debug( "ERROR: Actor not on empty floor!" );
				PS.audioPlay( SOUND_ERROR );
				return;
			}

			val = map.data[ ( exitY * WIDTH ) + exitX ]; // get map data at exit position
			if ( val !== FLOOR ) {
				PS.debug( "ERROR: Exit not on empty floor!" );
				PS.audioPlay( SOUND_ERROR );
				return;
			}

			PS.gridColor( COLOR_BG ); // grid background color
			PS.border( PS.ALL, PS.ALL, 0 ); // no bead borders
			PS.statusColor( PS.COLOR_WHITE );
			PS.statusText( "Click/touch to move" );

			// Use the map.data array to draw the maze
			// This also counts the number of gold pieces that have been placed

			gold_count = gold_found = 0;
			for ( y = 0; y < HEIGHT; y++ ) {
				for ( x = 0; x < WIDTH; x++ ) {
					val = map.data[ ( y * WIDTH ) + x ]; // get data
					if ( val === WALL ) {
						color = COLOR_WALL;
					}
					else if ( val === FLOOR ) {
						color = COLOR_FLOOR;
					}
					else if ( val === GOLD ) {
						color = COLOR_GOLD;
						gold_count += 1; // add to count
					}
					PS.color( x, y, color );
				}
			}

			// Preload & lock sounds
      
      var soundsFolder = "sounds/";
      
			PS.audioLoad(SOUND_FLOOR, {lock:true , fileTypes:["wav"], path:soundsFolder});
			PS.audioLoad(SOUND_WALL,  {lock:true , fileTypes:["wav"], path:soundsFolder});
			PS.audioLoad(SOUND_GOLD,  {lock:true , fileTypes:["wav"], path:soundsFolder});
			PS.audioLoad(SOUND_OPEN,  {lock:true , fileTypes:["wav"], path:soundsFolder});
			PS.audioLoad(SOUND_WIN,   {lock:true , fileTypes:["wav"], path:soundsFolder});
			PS.audioLoad(SOUND_ERROR, {lock:true , fileTypes:["wav"], path:soundsFolder});

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

