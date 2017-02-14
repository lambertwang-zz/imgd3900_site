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

	/** Object related functions */
	var objects = {};
	var objectDeletionQueue = {};
	var objectIdIterator = 0;

	class GameObject {
		constructor(objectData) {
			/** User settable parameters */
			this.x = 0;
			this.y = 0;
			// Refers to collision box dimensions, not sprite dimensions
			this.width = -1;
			this.height = -1;
			this.widthOffset = 0;
			this.heightOffset = 0;
			// If true does not have any collision map
			this.ephemeral = false;
			// If true cannot move through other objects
			this.solid = false;
			this.type = null;
			/** End of user settable parameters */
			if (objectData) {
				for (var key of Object.keys(objectData)) {
					this[key] = objectData[key];
				}
			}

			if (this.image) {
				this.image = SPRITE_DATA[this.image];
			}
			this.xPrev = this.x;
			this.yPrev = this.y;

			this.xStep = 0.0;
			this.yStep = 0.0;
			this.xVel = 0.0;
			this.yVel = 0.0;

			this.frameIndex = 0;
			this.frameStep = 0;
			this.frameSpeed = 0;
			this.spriteInverted = false;

			this.id = objectIdIterator;
			objects[objectIdIterator] = this;
			objectIdIterator++;
	
			return this;
		}

		update() {
			this.tick();
			this.updateMovement();

			// Update collision map
			// Only if image data is available
			if (this.image && this.image.imageData && levelImage) {
				if (this.width == -1) {
					this.width = this.image.width;
				}
				if (this.height == -1) {
					this.height = this.image.imageData.height;
				}
				// Clear collision map
				if (!this.ephemeral) {
					this.clearCollisionMap();
				}

				this.offsetWidthEff = (this.spriteInverted ? this.image.width - this.width : this.widthOffset);
				this.widthEff = (this.spriteInverted ? this.image.width - this.width : this.widthOffset)
				// Compute bounding box
				this.boundingBox = {
					left: Math.max(0, this.x + this.offsetWidthEff),
					right: Math.min(levelImage.width, this.x + (this.spriteInverted ? (this.image.width - this.widthOffset) : (this.widthOffset + this.width))),
					top: Math.max(0, this.y + this.heightOffset),
					bot: Math.min(levelImage.height, this.y + this.heightOffset + this.height)
				};
				// Update collision map
				if (!this.ephemeral) {
					for (var i = this.boundingBox.left; i < this.boundingBox.right; i++) {
						for (var j = this.boundingBox.top; j < this.boundingBox.bot; j++) {
							objectCollisionMap[i + j * levelImage.width][this.id] = true;
						}
					}
				}
			}

			this.xPrev = this.x;
			this.yPrev = this.y;
		}
		
		clearCollisionMap() {
			for (var i = Math.max(0, this.xPrev); i < Math.min(levelImage.width, this.xPrev + this.image.width); i++) {
				for (var j = Math.max(0, this.yPrev); j < Math.min(levelImage.height, this.yPrev + this.image.height); j++) {
					delete objectCollisionMap[i + j * levelImage.width][this.id];
				}
			}
		}

		computeCollision() {
			if (this.ephemeral) {
				return;
			}
			// Compute collision bounding box
			var collisions = checkCollision(
				this.boundingBox.left - 1, 
				this.boundingBox.top - 1,
				this.boundingBox.right - this.boundingBox.left + 2,
				this.boundingBox.bot - this.boundingBox.top + 2);
			for (var objId of Object.keys(collisions)) {
				if (objects[objId] && objects[objId] != this) {
					this.collide(objects[objId]);
				}
			}
		}

		draw() {
			if (!this.image) {
				return;
			}
			if (this.image.frames) {
				imageBlit(
					this.image.imageData,
					WIDTH / 2 + this.x - player.x,
					HEIGHT / 2 + this.y - player.y,
					this.image.width * this.frameIndex,
					0, this.image.width, Infinity, this.spriteInverted
				);
				this.frameStep++;
				if (this.frameStep > this.frameSpeed) {
					this.frameStep = 0;
					this.frameIndex = (this.frameIndex + 1) % this.image.frames;
				}
			} else {
				imageBlit(
					this.image.imageData,
					WIDTH / 2 + this.x - player.x,
					HEIGHT / 2 + this.y - player.y,
					0, 0, Infinity, Infinity, this.spriteInverted
				);
			}
		}

		updateMovement() {
			this.move(this.xVel, this.yVel);
		}

		move(d_x, d_y) {
			// Reset step to 0 if direction changed
			if (this.xStep * d_x < 0) {
				this.xStep = 0;
			}
			if (this.yStep * d_y < 0) {
				this.yStep = 0;
			}
			var stopped = false;
			this.xStep += d_x;
			this.yStep += d_y;
			while (this.xStep > 1) {
				this.xStep--;
				var edge = checkCollision(this.boundingBox.right, this.boundingBox.top, 1, this.height);
				if (Object.keys(edge).length > 0 || this.x + this.width >= levelImage.width) {
					this.xStep = 0;
					this.xVel = 0;
					stopped = true;
				} else {
					this.x++;
				}
			}
			while (this.xStep < -1) {
				this.xStep++;
				var edge = checkCollision(this.boundingBox.left - 1, this.boundingBox.top, 1, this.height);
				if (Object.keys(edge).length > 0 || this.x <= 0) {
					this.xStep = 0;
					this.xVel = 0;
					stopped = true;
				} else {
					this.x--;
				}
			}
			while (this.yStep > 1) {
				this.yStep--;
				var edge = checkCollision(this.boundingBox.left, this.boundingBox.bot, this.width, 1);
				if (Object.keys(edge).length > 0 || this.y + this.heighy >= levelImage.height) {
					this.yStep = 0;
					this.yVel = 0;
					stopped = true;
				} else {
					this.y++;
				}
			}
			while (this.yStep < -1) {
				this.yStep++;
				var edge = checkCollision(this.boundingBox.left, this.boundingBox.top - 1, this.width, 1);
				if (Object.keys(edge).length > 0 || this.y <= 0) {
					this.yStep = 0;
					this.yVel = 0;
					stopped = true;
				} else {
					this.y--;
				}
			}
			return stopped;
		}

		tick() {
			// Implemented in subclasses
		}

		collide() {
			// Implemented in subclasses
		}
	}

	/** Game scripting */
	var player = null;
	var playerData = {
		tool: null,
		alt_tool: null
	}

	class Merlin extends GameObject {
		constructor(params) {
			super(params);
			this.type = "merlin";
			this.image = SPRITE_DATA.merlin;
			this.frameSpeed = 15;

			player = this;
			this.stunned = 0;
			this.health = 2;
			this.onGround = false;
			this.tool = null;
			this.alt_tool = null;
			this.touchingAltar = false; // Currently touching altar
			this.touchedAltar = false; // Touched altar last frame

			if (playerData.tool) {
				this.tool = new playerData.tool();
			}
			if (playerData.alt_tool) {
				this.alt_tool = new playerData.alt_tool();
			}
		}

		tick() {
			// Check for ground
			if (!this.boundingBox) {
				return;
			}
			var ground = checkCollision(this.boundingBox.left, this.boundingBox.bot, this.width, 1);

			this.touchingAltar = this.touchedAltar;
			this.touchedAltar = false;
			
			if (this.stunned <= 0) {
				if (controls.left) {
					this.image = SPRITE_DATA.merlin_walk;
					this.spriteInverted = true;
					this.xVel = -.3;
				} else if (controls.right) {
					this.image = SPRITE_DATA.merlin_walk;
					this.spriteInverted = false;
					this.xVel = .3;
				} else {
					this.image = SPRITE_DATA.merlin;
					this.xVel = 0;
				}

				if (Object.keys(ground).length > 0) {
					// On ground or standing on something
					this.onGround = true;
					this.yVel = 0;
					if (controls.up) {
						this.yVel = -1;
						if (this.tool && this.tool.jump) {
							this.tool.jump();
						}
					}
				}

				if (controls.down) {
					if (this.tool && this.tool.down) {
						this.tool.down();
					}
				}
			} else {
				this.stunned--;
			}

			if (Object.keys(ground).length <= 0) {
				// In air
				this.onGround = false;
				this.yVel += 0.07;
				if (this.yVel > 1) {
					this.yVel = 1;
				}
				if (this.tool && this.tool.gravity) {
					this.tool.gravity();
				}
			}
		}

		collide(other) {
			if (other.type == "troll") {
				console.log("Ack! Troll");
				this.yVel = -1.5;
				if (other.x > this.x) {
					this.xVel = -.5;
					this.move(-1, -1);
				} else {
					this.xVel = .5;
					this.move(1, -1);
				}
				this.stunned = 30;
			} else if (other.type == "door") {
				levelChangeReady = 1;
			} else if (other.type == "door_prev") {
				levelChangeReady = -1;
			} else if (other.type == "altar") {
				this.touchedAltar = true;
				if (!this.touchingAltar) {
					this.pickup(other);
				}
			}
		}

		magic(targets) {
			for (var obj of Object.keys(targets)) {
				if (targets[obj] && targets[obj].type == "altar") {
					this.pickup(targets[obj]);
					return;
				}
			}
			if (this.tool) {
				this.tool.cast(targets);
			}
		}

		pickup(altar) {
			var temp = this.tool;
			if (altar.tool) {
				this.tool = new altar.tool();
				PS.dbEvent(DB_NAME, "tool_gained", this.tool.type);
				cycleTexts(this.tool.statusText);
			} else {
				this.tool = null;
			}
			if (temp) {
				altar.image = temp.altarImage;
				altar.tool = temp.constructor;
				objectDeletionQueue[temp.id] = temp;
			} else {
				altar.image = SPRITE_DATA.altar;
				altar.tool = null;
			}
		}
	}

	class Door extends GameObject {
		constructor(params) {
			super(params);
			this.type = "door";
			this.image = SPRITE_DATA.door;

			this.height = 1;
			this.heightOffset = 7;
			this.width = 2;
			this.widthOffset = 2;
		}
	}

	class DoorPrev extends GameObject {
		constructor(params) {
			super(params);
			this.type = "door_prev";
			this.image = SPRITE_DATA.door_prev;

			this.height = 1;
			this.heightOffset = 7;
			this.width = 2;
			this.widthOffset = 2;
		
		}
	}

	class Troll extends GameObject {
		constructor(objectData) {
			super(objectData);
			this.type = "troll";
			this.image = SPRITE_DATA.troll;
			this.frameSpeed = 20;
			
			this.width = 9;
			this.height = 11;
			this.widthOffset = 0;
			this.heightOffset = 1;
		}

		tick() {
			return;
			// Check for ground
			if (!this.boundingBox) {
				return;
			}
			var ground = checkCollision(this.boundingBox.left, this.boundingBox.bot, this.width, 1);
			
			if (controls.left) {
				this.image = SPRITE_DATA.troll_walk;
				this.spriteInverted = true;
				this.xVel = -.3;
			} else if (controls.right) {
				this.image = SPRITE_DATA.troll_walk;
				this.spriteInverted = false;
				this.xVel = .3;
			} else {
				this.image = SPRITE_DATA.troll;
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
	}

	class Box extends GameObject {
		constructor(objectData) {
			super(objectData);
			this.type = "box";
			this.image = SPRITE_DATA.box;
			this.frameSpeed = 10;
		}

		tick() {
			// Check for ground
			if (!this.boundingBox) {
				return;
			}
			var ground = checkCollision(this.boundingBox.left, this.boundingBox.bot, this.width, 1);

			if (Object.keys(ground).length <= 0) {
				// In air
				this.yVel += 0.07;
				if (this.yVel > 1) {
					this.yVel = 1;
				}
			} else {
				for (var obj of Object.keys(ground)) {
					if (objects[obj] && objects[obj].type == "troll") {
						console.log("Crushing troll?");
						objectDeletionQueue[obj] = ground[obj];
					}
				}
			}
		}
	}

	class Altar extends GameObject {
		constructor(params) {
			super(params);
			this.type = "altar";
			this.frameSpeed = 35;

			this.tool = params.tool;
		}
	}

	class Staff extends GameObject {
		constructor(params) {
			super(params);
			this.type = "staff";
			this.image = SPRITE_DATA.staff;
			this.ephemeral = true;

			this.altarImage = SPRITE_DATA.altar_staff
			this.target = null;
			this.holder = player;
			this.statusText = [
				"It's a powerful staff!",
				"Click to move blocks!"
			];
		}

		tick() {
			if (this.target) {
				if (this.target.move(
						controls.mouseX + player.x - WIDTH/2 - 2 - this.target.x, 
						controls.mouseY + player.y - HEIGHT/2 - 3 - this.target.y)) {
					this.drop();
				}
			}
		}

		draw() {
			// Overloaded draw function
			// Follows merlin
			this.spriteInverted = this.holder.spriteInverted;
			this.x = this.holder.x + (this.spriteInverted ? -1 : 4);
			this.y = this.holder.y;

			super.draw();
		}

		cast (targets) {
			if (this.target == null) {
				for (var obj of Object.keys(targets)) {
					if (targets[obj] && targets[obj].type == "box") {
						this.target = targets[obj];
						this.target.image = SPRITE_DATA.box_active;
						this.image = SPRITE_DATA.staff_active;
						return;
					}
				}
			} else {
				this.drop();
			}
		}

		drop() {
			if (this.target) {
				this.target.image = SPRITE_DATA.box;
				this.image = SPRITE_DATA.staff;
				this.target = null;
			}
		}
	}

	class Balloon extends GameObject {
		constructor(params) {
			super(params);
			this.type = "balloon";
			this.image = SPRITE_DATA.balloon;
			this.ephemeral = true;

			this.altarImage = SPRITE_DATA.altar_balloon
			this.holder = player;
			this.isDownPressed = false;
			this.statusText = [
				"Wow, a magic balloon!"
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

	/** Game data */

	var SPRITE_DIR = "sprites/";
	var SPRITE_DATA = {
		merlin: {
			imageName: "merlin.png",
			imageData: null
		},
		merlin_walk: {
			imageName: "merlin.walk.png",
			imageData: null,
			frames: 3,
			width: 4
		},
		troll: {
			imageName: "troll.png",
			imageData: null
		},
		troll_walk: {
			imageName: "troll.walk.png",
			imageData: null,
			frames: 4,
			width: 12
		},
		staff: {
			imageName: "staff.png",
			imageData: null
		},
		staff_active: {
			imageName: "staff.active.png",
			imageData: null
		},
		box: {
			imageName: "box.png",
			imageData: null
		},
		box_active: {
			imageName: "box.active.png",
			imageData: null,
			frames: 4,
			width: 5
		},
		door: {
			imageName: "door.png",
			imageData: null
		},
		door_prev: {
			imageName: "door.prev.png",
			imageData: null
		},
		altar: {
			imageName: "altar.png",
			imageData: null
		},
		altar_staff: {
			imageName: "altar.staff.png",
			imageData: null,
			frames: 2,
			width: 4
		},
		altar_balloon: {
			imageName: "altar.balloon.png",
			imageData: null,
			frames: 2,
			width: 4
		},
		balloon: {
			imageName: "balloon.png",
			imageData: null
		},
		balloon_used: {
			imageName: "balloon.used.png",
			imageData: null
		},
	};
	
	var LEVEL_DIR = "levels/";
	var LEVEL_DATA = [
		{
			imageName: "level1.png",
			statusText: [
				"Aaaaaaaaaah!",
				"Where am I?",
				"I need find the exit!",
				"Arrow Keys/WASD to move"
			],
			objects: [
				{
					constructor: Door,
					params: {
						x: 50,
						y: 28
					}
				}
			]
		},
		{
			imageName: "level2.png",
			statusText: [
				"Debris blocks my way",
				"Up/W to jump"
			],
			objects: [
				{
					constructor: Merlin,
					params: {
						x: 7,
						y: 29
					}
				},
				{
					constructor: Door,
					params: {
						x: 50,
						y: 28
					}
				}
			]
		},
		{
			imageName: "level3.png",
			statusText: [
				"What's that? A magic staff?",
				"Maybe I should click it..."
			],
			objects: [
				{
					constructor: Merlin,
					params: {
						x: 12,
						y: 29
					}
				},
				{
					constructor: Box,
					params: {
						x: 24,
						y: 24
					}
				},
				{
					constructor: Altar,
					params: {
						image: "altar_staff",
						x: 6,
						y: 26,
						tool: Staff
					}
				},
				{
					constructor: Door,
					params: {
						x: 70,
						y: 18
					}
				}
			]
		},
		{
			imageName: "level4.png",
			statusText: [
				"Yet more rooms",
				"My clairvoyance is blocked...",
				"I must find out why..."
			],
			objects: [
				{
					constructor: Merlin,
					params: {
						x: 5,
						y: 22
					}
				},
				{
					constructor: Altar,
					params: {
						image: "altar_balloon",
						x: 110,
						y: 29,
						tool: Balloon
					}
				},
				{
					constructor: Door,
					params: {
						x: 90,
						y: 10
					}
				}
			]
		},
		{
			imageName: "level5.png",
			statusText: [
				"TBD..."
			],
			objects: [
				{
					constructor: Merlin,
					params: {
						x: 20,
						y: 22
					}
				},
				{
					constructor: Altar,
					params: {
						image: "altar_balloon",
						x: 110,
						y: 29,
						tool: Balloon
					}
				},
				{
					constructor: DoorPrev,
					params: {
						x: 5,
						y: 10
					}
				}
			]
		}
	];

	/** Begin engine code */
	var WIDTH = 32;
	var HEIGHT = 32;
	var DB_NAME = "merlin_telemetry";

	var STYLE = {
		DEBUG: PS.COLOR_GREEN,
		BACKGROUND_COLOR: [0, 0, 0],
		WALL_COLOR: [255, 255, 255],
		LOAD_FADE_DURATION: 30,
		STATUS_COLOR: PS.COLOR_WHITE,
		OVERLAY_FADE_RATE: 4,
		OVERLAY_FADE: 480,
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
	var pixels = [];

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
		var alpha = color.length > 3 ? Math.min(color[3], 255) / 255 : 1.0;

		// Alpha compositing
		newPixel[0] = Math.min((color[0] * alpha + newPixel[0] * (1 - alpha)) / (alpha + (1 - alpha)), 255);
		newPixel[1] = Math.min((color[1] * alpha + newPixel[1] * (1 - alpha)) / (alpha + (1 - alpha)), 255);
		newPixel[2] = Math.min((color[2] * alpha + newPixel[2] * (1 - alpha)) / (alpha + (1 - alpha)), 255);

		setPixel(newPixel, x, y);
	};

	function imageBlit(
		image, screenX, screenY, 
		imageX = 0, imageY = 0, 
		imageWidth = Infinity, imageHeight = Infinity, 
		invert = false) {

		if (image.pixelSize < 3) {
			console.log("Error: imageBlit() requires at least 3 channels");
			return;
		}
		var i_init = screenX < 0 ? -screenX : imageX;
		var i = i_init;
		var i_range = Math.min(image.width, imageX + imageWidth);
		while (i < i_range) {
			var j = screenY < 0 ? -screenY : imageY;
			var j_range = Math.min(image.height, imageY + imageHeight);
			while (j < j_range) {
				var pixel_x = (invert ? (i_range + i_init - i - 1) : i) + screenX - imageX;
				var pixel_y = j + screenY - imageY;
				if (pixel_x >= 0 &&
					pixel_x < WIDTH &&
					pixel_y >= 0 &&
					pixel_y < HEIGHT) {
					drawPixel(
						image.data.slice(
							(i + j * image.width) * image.pixelSize,
							(i + j * image.width) * image.pixelSize + image.pixelSize),
						pixel_x, pixel_y);
				}
				j++;
			}
			i++
		}
	};

	function flushPixels() {
		// Draw the pixels to the screen
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
				PS.color(i, j,
					pixels[3 * (i + j * WIDTH)],
					pixels[3 * (i + j * WIDTH) + 1],
					pixels[3 * (i + j * WIDTH) + 2])
			}
		}
		// Clear the pixel buffer
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
				setPixel(STYLE.BACKGROUND_COLOR, i, j);
			}
		}
	}

	/** Game initialization and loadingfunctions */

	var levelIndex = 0;
	var levelImage = null;

	var objectCollisionMap = [];

	function initGame() {
		// Establish grid size
		setGridSize(WIDTH, HEIGHT);

		// Load all sprites
		for (var sprite of Object.keys(SPRITE_DATA)) {
			PS.imageLoad(
				SPRITE_DIR + SPRITE_DATA[sprite].imageName, 
				onSpriteLoaded.bind(this, sprite));
		}

		// Initialize pixel back buffer
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
				setPixel([0, 0, 0], i, j);
			}
		}
	};

	// Handles resizing grid and map data
	function setGridSize(width, height) {
		PS.gridSize(width, height);
		PS.gridColor(STYLE.BACKGROUND_COLOR); // grid background color
		PS.gridFade (STYLE.LOAD_FADE_DURATION)

		PS.border(PS.ALL, PS.ALL, 0); // no bead borders
		PS.borderColor(PS.ALL, PS.ALL, STYLE.DEBUG);

		PS.color(PS.ALL, PS.ALL, STYLE.BACKGROUND_COLOR); // Make all beads black
		PS.alpha(PS.ALL, PS.ALL, 255);

		PS.statusColor(STYLE.STATUS_COLOR); // Status text color
	}

	function onSpriteLoaded(spriteKey, spriteImage) {
		SPRITE_DATA[spriteKey].imageData = spriteImage;
		if (!SPRITE_DATA[spriteKey].width) {
			SPRITE_DATA[spriteKey].width = spriteImage.width;
		}
		if (!SPRITE_DATA[spriteKey].height) {
			SPRITE_DATA[spriteKey].height = spriteImage.height;
		}
	};

	function loadLevel() {
		PS.dbEvent(DB_NAME, "level_loaded", levelIndex);

		// Pause game and setup level fading
		controls.paused = true;
		levelFade = STYLE.OVERLAY_FADE;
		PS.fade(PS.ALL, PS.ALL, STYLE.LOAD_FADE_DURATION);
		PS.gridColor(STYLE.BACKGROUND_COLOR);


		// Load level terrain
 		levelImage = null;
		PS.imageLoad(
			LEVEL_DIR + LEVEL_DATA[levelIndex].imageName, 
			onLevelImageLoaded, 4);
		cycleTexts(LEVEL_DATA[levelIndex].statusText);

		// Preserve merlin's weapons (if possible)
		if (player) {
			if (player.tool) {
				playerData.tool = player.tool.constructor;
			}

			if (player.alt_tool) {
				playerData.alt_tool = player.alt_tool.constructor;
			}
		}
		
		// Add all objects to level
		objects = {};
		objectIdIterator = 0;
		for (var obj of LEVEL_DATA[levelIndex].objects) {
			new obj.constructor(obj.params);
		}
	};

	function onLevelImageLoaded(image) {
		levelImage = image;

		// Reads pixels and constructs collision map
		objectCollisionMap = [];
		for (var i = 0; i < levelImage.width * levelImage.height; i++) {
			objectCollisionMap[i] = {};
			// Blue pixel represents merlin
			if (levelImage.data[i * 4 + 2] == 255) {
				console.log("LevelLoad: Placing Merlin");
				new Merlin({ x: i % image.width, y: Math.floor(i / image.width) });
			}
			// If the red channel of the level image is > 128, then that is a wall section
			if (levelImage.data[i * 4] > 128) {
				objectCollisionMap[i][-1] = true;
				// Set the image data to the wall color
				levelImage.data[i * 4] = STYLE.WALL_COLOR[0];
				levelImage.data[i * 4 + 1] = STYLE.WALL_COLOR[1];
				levelImage.data[i * 4 + 2] = STYLE.WALL_COLOR[2];
			} else {
				// Set the image data to be transparent
				levelImage.data[i * 4 + 3] = 0;
			}
		}
		
		// Level should be done fading in
		setTimeout(function() {
			PS.fade(PS.ALL, PS.ALL, 0);
			controls.paused = false;
		}, 1000);
	}

	var textTimeout = null;
	function cycleTexts(textList, index = 0) {
		PS.statusText(textList[index++]);
		if (index < textList.length) {
			if (textTimeout != null) {
				clearTimeout(textTimeout);
				textTimeout = null;
			}
			textTimeout = setTimeout(cycleTexts.bind(null, textList, index), 2000);
		}
	}

	/**
	 * Checks a range in the collision map and returns a list of all object ids collided with
	 * -1 refers to terrain
	 * Uses world coordinates
	 */
	function checkCollision(x, y, width = 0, height = 0) {
		var collidedWith = {};
		for (var i = Math.max(x, 0); i < Math.min(x + width, levelImage.width); i++) {
			for (var j = Math.max(y, 0); j < Math.min(y + height, levelImage.height); j++) {
				for (var id of Object.keys(objectCollisionMap[i + j * levelImage.width])) {
					collidedWith[id] = objects[id];
				}
			}
		}
		return collidedWith;
	}

	/** 
	 * Retrieves collisions at a specific point.
	 * Uses screen coordinates
	 */
	function getCollisionAtScreen(x, y) {
		var xPos = x + player.x - WIDTH/2;
		var yPos = y + player.y - HEIGHT/2;
		if (xPos < 0 || yPos < 0 || xPos >= levelImage.width || yPos >= levelImage.height) {
			return {};
		}
		var collidedWith = {};
		for (var id of Object.keys(objectCollisionMap[xPos + yPos * levelImage.width])) {
			collidedWith[id] = objects[id];
		}
		return collidedWith;
	}

	/** Rendering functions */

	function drawLevel() {
		imageBlit(levelImage, WIDTH / 2 - player.x, HEIGHT / 2 - player.y);
	}

	/** Controls and state updates */
	var controls = {
		paused: true,
		left: false,
		right: false,
		up: false,
		down: false,
		mouseX: -1,
		mouseY: -1,
	}
	var levelFade = 0;
	var levelChangeReady = 0;

	function engineTick() {
		if (controls.paused) {
			// return;
		}
		if (levelImage) {
			if (!controls.paused) {
				// Update state
				for (var obj of Object.keys(objects)) {
					objects[obj].update();
				}

				// Compute Collisions
				for (var obj of Object.keys(objects)) {
					objects[obj].computeCollision();
				}

				// Clear the deletion queue
				for (var id of Object.keys(objectDeletionQueue)) {
					objects[id].clearCollisionMap();
					delete objects[id];
				}
				objectDeletionQueue = {};
			}

			// Render level and objects
			// keys.reverse() is a hacky way of giving merlin rendering priority
			drawLevel();
			for (var obj of Object.keys(objects).reverse()) {
				objects[obj].draw();
			}

			if (levelChangeReady != 0) {
				levelIndex += levelChangeReady;
				levelChangeReady = 0;
				loadLevel();
			}
		}

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

		flushPixels();

		if (DEBUG_DRAW && levelImage) {
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
		}  else {
			PS.border(PS.ALL, PS.ALL, 0);
			PS.glyph(PS.ALL, PS.ALL, "");
		}
	};

	// Public functions are exposed in the global G object, which is initialized here.
	// Only two functions need to be exposed; everything else is encapsulated!
	// So safe. So elegant.

	G = {
		keyDown: function(key) {
			switch (key) {
				case PS.KEY_ARROW_LEFT:
				case 97:
					controls.left = true;
					break;
				case PS.KEY_ARROW_RIGHT:
				case 100:
					controls.right = true;
					break;
				case PS.KEY_ARROW_UP:
				case 119:
					controls.up = true;
					break;
				case PS.KEY_ARROW_DOWN:
				case 115:
					controls.down = true;
					break;
				case PS.KEY_F1:
					DEBUG_DRAW = !DEBUG_DRAW;
					break;
				case PS.KEY_F2:
					console.log("DEBUG: Skipped level");
					levelChangeReady = 1;
					STYLE.OVERLAY_FADE = 0;
					STYLE.LOAD_FADE_DURATION = 0;
					break;
			}
		},
		keyUp: function(key) {
			switch (key) {
				case PS.KEY_ARROW_LEFT:
				case 97:
					controls.left = false;
					break;
				case PS.KEY_ARROW_RIGHT:
				case 100:
					controls.right = false;
					break;
				case PS.KEY_ARROW_UP:
				case 119:
					controls.up = false;
					break;
				case PS.KEY_ARROW_DOWN:
				case 115:
					controls.down = false;
					break;
			}
		},
		touch: function(x, y) {
			if (levelImage && player) {
				player.magic(getCollisionAtScreen(x, y));
			}
		},
		release: function(x, y) {
		},
		enter: function(x, y) {
			controls.mouseX = x;
			controls.mouseY = y;
		},
		exit: function(x, y) {
		},
		exitGrid: function() {
		},
		shutdown: function() {
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
 			PS.dbInit(DB_NAME, { login : false });

			initGame();
			loadLevel();

			// 60 ticks per second
			PS.timerStart(1, engineTick);
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
