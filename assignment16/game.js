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

	// Draws collision map on screen.
	var DEBUG_DRAW = false;

	var WIDTH = 32;
	var HEIGHT = 32;
	var DB_NAME = "merlin_telemetry";

	var STYLE = {
		DEBUG: PS.COLOR_GREEN,
		BACKGROUND_COLOR: PS.COLOR_GRAY,
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

	/**
	 * For some reason, the built-in alpha compositing 
	 * is not working so I'm writing my own.
	 */
	var pixels = [
	];

	function setPixel(color, x, y) {
		pixels[3 * (x + y * WIDTH)] = color[0];
		pixels[3 * (x + y * WIDTH) + 1] = color[1];
		pixels[3 * (x + y * WIDTH) + 2] = color[2];
	};

	function getPixel(x, y) {
		return [
			pixels[3 * (x + y * WIDTH)],
			pixels[3 * (x + y * WIDTH) + 1],
			pixels[3 * (x + y * WIDTH) + 2]
		];
	};

	function drawPixel(color, x, y) {
		var newPixel = getPixel(x, y);
		var alpha = color.length > 3 ? color[3] / 255 : 1.0;

		newPixel[0] = Math.min((color[0] * alpha + newPixel[0] * (1 - alpha)) / (alpha + (1 - alpha)), 255);
		newPixel[1] = Math.min((color[1] * alpha + newPixel[1] * (1 - alpha)) / (alpha + (1 - alpha)), 255);
		newPixel[2] = Math.min((color[2] * alpha + newPixel[2] * (1 - alpha)) / (alpha + (1 - alpha)), 255);

		setPixel(newPixel, x, y);
	};

	function imageBlit(image, screenX, screenY, imageX = 0, imageY = 0) {
		if (image.pixelSize < 3) {
			console.log("Error: imageBlit() requires at least 3 channels");
			return;
		}
		for (var i = screenX < 0 ? -screenX : imageX; i + screenX < WIDTH && i < image.width; i++) {
			for (var j = screenY < 0 ? -screenY : imageY; j + screenY < HEIGHT && j < image.height; j++) {
				drawPixel(
					image.data.slice(
						(i + j * image.width) * image.pixelSize,
						(i + j * image.width) * image.pixelSize + image.pixelSize),
						i + screenX, j + screenY);
			}
		}
	};

	function flushPixels() {
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
				PS.color(i, j,
					pixels[3 * (i + j * WIDTH)],
					pixels[3 * (i + j * WIDTH) + 1],
					pixels[3 * (i + j * WIDTH) + 2])
			}
		}
		for (var i = 0; i < WIDTH * HEIGHT; i++) {
			pixels[i * 3] = 0;
			pixels[i * 3 + 1] = 0;
			pixels[i * 3 + 2] = 0;
		}
	}

	var SPRITE_DIR = "sprites/";
	var SPRITE_DATA = {
		merlin: {
			imageName: "merlin.png",
			imageData: null
		},
		troll: {
			imageName: "troll.png",
			imageData: null
		}
	};
	
	var LEVEL_DIR = "levels/";
	var LEVEL_DATA = [
		{
			imageName: "level1.png",
			startLocation: {
				x: 10,
				y: 10
			},
			objects: [
				{
					image: "troll", 
					x: 10, 
					y: 10, 
					tickFunction: null,
					width: 9,
					height: 11,
					widthOffset: 3,
					heightOffset: 1
				}
			]
		}
	];

	/** Game initialization and loadingfunctions */

	var levelIndex = 0;
	var levelImage = null;

	var objectCollisionMap = [];
	var player = null;

	function initGame() {
		// Establish grid size
		setGridSize(WIDTH, HEIGHT);

		// Load all sprites
		for (var sprite of Object.keys(SPRITE_DATA)) {
			PS.imageLoad(
				SPRITE_DIR + SPRITE_DATA[sprite].imageName, 
				onSpriteLoaded.bind(this, sprite));
		}
	};

	// Handles resizing grid and map data
	function setGridSize(width, height) {
		PS.gridSize(width, height);
		PS.gridColor(STYLE.BACKGROUND_COLOR); // grid background color

		PS.border(PS.ALL, PS.ALL, 0); // no bead borders
		PS.borderColor(PS.ALL, PS.ALL, STYLE.DEBUG);

		PS.color(PS.ALL, PS.ALL, STYLE.BEAD_COLOR); // Make all beads black
		PS.color(PS.ALL, PS.ALL, PS.COLOR_WHITE); // Make all beads black
		PS.alpha(PS.ALL, PS.ALL, 255);
	}

	function onSpriteLoaded(spriteKey, spriteImage) {
		SPRITE_DATA[spriteKey].imageData = spriteImage;
	};

	function loadLevel() {
		levelImage = null;
		PS.imageLoad(
			LEVEL_DIR + LEVEL_DATA[levelIndex].imageName, 
			onLevelImageLoaded, 4);
		objects = {};
		objectIdIterator = 0;
		player = new GameObject({
			image: "merlin", 
			x: 0,
			y: 0,
			width: 4,
			tickFunction: playerTick
		});
		for (var obj of LEVEL_DATA[levelIndex].objects) {
			new GameObject(obj);
		}
	};

	function onLevelImageLoaded(image) {
		levelImage = image;

		objectCollisionMap = [];
		console.log("Level width: " + levelImage.width);
		console.log("Level height: " + levelImage.height);
		for (var i = 0; i < levelImage.width * levelImage.height; i++) {
			objectCollisionMap[i] = {};
			if (levelImage.data[i * 4 + 3] > 128) {
				objectCollisionMap[i][-1] = true;
			}
		}
	}

	/** Object related functions */
	var objects = {};
	var objectIdIterator = 0;

	class GameObject {
		constructor(objectData) {
			/** User settable parameters */
			this.x = 0;
			this.y = 0;
			this.width = -1;
			this.height = -1;
			this.widthOffset = 0;
			this.heightOffset = 0;
			this.solid = false;
			/** End of user settable parameters */
			for (var key of Object.keys(objectData)) {
				console.log(key);
				this[key] = objectData[key];
			}

			console.log(this.image);
			if (this.image) {
				this.image = SPRITE_DATA[this.image];
			}
			if (this.tickFunction) {
				this.tickFunction = this.tickFunction.bind(this);
			}
			this.xPrev = this.x;
			this.yPrev = this.y;

			this.xStep = 0.0;
			this.yStep = 0.0;
			this.xVel = 0.0;
			this.yVel = 0.0;

			this.id = objectIdIterator;
			objects[objectIdIterator] = this;
			objectIdIterator++;
	
			return this;
		}

		tick() {
			if (this.tickFunction) {
				this.tickFunction(this);
			}
			this.updateMovement();

			// Update collision map
			// Only if image data is available
			if (this.image.imageData && levelImage) {
				if (this.width == -1) {
					this.width = this.image.imageData.width;
				}
				if (this.height == -1) {
					this.height = this.image.imageData.height;
				}
				for (var i = Math.max(0, this.xPrev + this.widthOffset); i < Math.min(levelImage.width, this.xPrev + this.widthOffset + this.width); i++) {
					for (var j = Math.max(0, this.yPrev); j < Math.min(levelImage.height, this.yPrev + this.height); j++) {
						delete objectCollisionMap[i + j * levelImage.width][this.id];
					}
				}
				for (var i = Math.max(0, this.x + this.widthOffset); i < Math.min(levelImage.width, this.x + this.widthOffset + this.width); i++) {
					for (var j = Math.max(0, this.y + this.heightOffset); j < Math.min(levelImage.height, this.y + this.heightOffset + this.height); j++) {
						objectCollisionMap[i + j * levelImage.width][this.id] = true;
					}
				}
			}

			this.xPrev = this.x;
			this.yPrev = this.y;
		}

		move(d_x, d_y) {
			// Reset step to 0 if direction changed
			if (this.xStep * d_x < 0) {
				this.xStep = 0;
			}
			if (this.yStep * d_y < 0) {
				this.yStep = 0;
			}
			this.xStep += d_x;
			this.yStep += d_y;
			while (this.xStep > 1) {
				this.xStep--;
				var edge = checkCollision(this.x + this.width + this.widthOffset, this.y + this.heightOffset, 1, this.height);
				if (Object.keys(edge).length > 0 || this.x + this.width >= levelImage.width) {
					this.xStep = 0;
				} else {
					this.x++;
				}
			}
			while (this.xStep < -1) {
				this.xStep++;
				var edge = checkCollision(this.x - 1 + this.widthOffset, this.y + this.heightOffset, 1, this.height);
				if (Object.keys(edge).length > 0 || this.x <= 0) {
					this.xStep = 0;
				} else {
					this.x--;
				}
			}
			while (this.yStep > 1) {
				this.yStep--;
				var edge = checkCollision(this.x + this.widthOffset, this.y + this.height + this.heightOffset, this.width, 1);
				if (Object.keys(edge).length > 0 || this.y + this.heighy >= levelImage.height) {
					this.yStep = 0;
				} else {
					this.y++;
				}
			}
			while (this.yStep < -1) {
				this.yStep++;
				var edge = checkCollision(this.x + this.widthOffset, this.y - 1 + this.heightOffset, this.width, 1);
				if (Object.keys(edge).length > 0 || this.y <= 0) {
					this.yStep = 0;
				} else {
					this.y--;
				}
			}
		}

		updateMovement() {
			this.move(this.xVel, this.yVel);
		}
	}

	/**
	 * Checks a range in the collision map and returns a list of all object ids collided with
	 * -1 refers to terrain
	 */
	function checkCollision(x, y, width = 0, height = 0) {
		var collidedWith = {};
		for (var i = Math.max(x, 0); i < Math.min(x + width, levelImage.width); i++) {
			for (var j = Math.max(y, 0); j < Math.min(y + height, levelImage.height); j++) {
				for (var id in Object.keys(objectCollisionMap[i + j * levelImage.width])) {
					collidedWith[id] = true;
				}
			}
		}
		return collidedWith;
	}

	/** Rendering functions */

	function drawLevel() {
		imageBlit(
			levelImage, 
			WIDTH / 2 - player.x, 
			HEIGHT / 2 - player.y);
	}

	function drawObject(obj) {
		imageBlit(
			obj.image.imageData,
			WIDTH / 2 + obj.x - player.x,
			HEIGHT / 2 + obj.y - player.y
		);
	}

	/** Controls and state updates */
	var controls = {
		left: false,
		right: false,
		up: false,
		down: false
	}

	function playerTick() {
		// Check for ground
		var ground = checkCollision(this.x + this.widthOffset, this.y + this.height + this.heightOffset, this.width, 1);
		
		if (controls.left) {
			this.xVel = -.3;
		} else if (controls.right) {
			this.xVel = .3;
		} else {
			this.xVel = 0;
		}

		if (Object.keys(ground).length > 0) {
			// On ground or standing on something
			this.yVel = 0;
			if (controls.up) {
				this.yVel = -1;
			}
		} else {
			// In air
			this.yVel += 0.07;
			if (this.yVel > 1) {
				this.yVel = 1;
			}
		}
	}

	function tick() {
		if (levelImage) {
			// Update state
			for (var obj of Object.keys(objects)) {
				objects[obj].tick();
			}

			// Render level and objects
			drawLevel();
			for (var obj of Object.keys(objects)) {
				drawObject(objects[obj]);
			}
		}

		flushPixels();

		if (levelImage && DEBUG_DRAW) {
			// showCollisionMap();
			for (var i = 0; i < WIDTH; i++) {
				for (var j = 0; j < HEIGHT; j++) {
					// Draw collision boxes
					var collisionData = objectCollisionMap[i + player.x - WIDTH / 2 + (j + player.y - HEIGHT / 2) * levelImage.width];
					if (collisionData && Object.keys(collisionData).length > 0) {
						PS.border(i, j, 1);
						PS.glyph(i, j, String(Object.keys(collisionData).length));
						PS.glyphColor(i, j, STYLE.DEBUG);
					} else {
						PS.border(i, j, 0);
						PS.glyph(i, j, "");
					}
				}
			}
		} 
			// HEIGHT / 2 - player.y)
	};

	// Public functions are exposed in the global G object, which is initialized here.
	// Only two functions need to be exposed; everything else is encapsulated!
	// So safe. So elegant.

	G = {
		keyDown: function(key) {
			switch (key) {
				case PS.KEY_ARROW_LEFT:
					controls.left = true;
					break;
				case PS.KEY_ARROW_RIGHT:
					controls.right = true;
					break;
				case PS.KEY_ARROW_UP:
					controls.up = true;
					break;
				case PS.KEY_ARROW_DOWN:
					controls.down = true;
					break;
			}
		},
		keyUp: function(key) {
			switch (key) {
				case PS.KEY_ARROW_LEFT:
					controls.left = false;
					break;
				case PS.KEY_ARROW_RIGHT:
					controls.right = false;
					break;
				case PS.KEY_ARROW_UP:
					controls.up = false;
					break;
				case PS.KEY_ARROW_DOWN:
					controls.down = false;
					break;
			}
		},
		touch: function(x, y) {
		},
		release: function(x, y) {
		},
		enter: function(x, y) {
		},
		exit: function(x, y) {
		},
		exitGrid: function() {
		},
		shutdown: function() {
			return;
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

			// Initialize Database
			// PS.dbInit(DB_NAME);

			initGame();
			loadLevel();

			// 60 ticks per second
			PS.timerStart(1, tick);
		}
	};
} () ); // end of self-invoking function

// PS.init( system, options )
// Initializes the game

PS.init = G.init;
PS.keyDown = G.keyDown;
PS.keyUp = G.keyUp;
PS.touch = G.touch;
PS.release = G.release;
PS.enter = G.enter;
PS.exit = G.exit;
PS.exitGrid = G.exitGrid;
PS.shutdown = G.shutdown;
