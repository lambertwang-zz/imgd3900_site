// engine.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** 
 * GlassForge engine
 * Object & event driven engine with basic class, event, and level scripting for Perlenspiel 3.2
 * Authors: Joseph (jctblackman@wpi.edu) and Lambert (lwang5@wpi.edu)
 */

// Draws collision map on screen.
var DEBUG_DRAW = false;


/** Object related functions */
var objects = {};
var objectDeletionQueue = {};
var objectIdIterator = 0;
var cameraTarget = null;
var camera = { x: 0, y: 0 };

// Range for object rendering altitude
var MIN_ALT = 0;
var MAX_ALT = 4;

class GameObject {
	constructor(objectData) {
		/** Start User settable parameters */
		
		// String identifier for object
		this.type = null;

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
		this.solid = true;

		// If true, does not carry over between levels
		/**
		 * This is mostly used for tools.
		 * Because merlin constructs new tools each time he is constructed
		 */
		this.dontRegenerate = false;

		/**
		 * Rendering priority.
		 * Must be a number between 0 and 4 (inclusive) otherwise the object will not draw.
		 */
		this.altitude = 0;

		
		// Mirrored along X
		this.spriteXInverted = false;
		// Mirrored along Y
		this.spriteYInverted = false;
		this.opacity = 1;

		/** End of user settable parameters */
		if (objectData) {
			for (var key of Object.keys(objectData)) {
				this[key] = objectData[key];
			}
		}

		if (typeof this.image === 'string') {
			this.image = SPRITE_DATA[this.image];
		}

		this.eventListeners = {};

		// Set default variables
		this.xPrev = this.x;
		this.yPrev = this.y;

		this.xStep = 0.0;
		this.yStep = 0.0;
		this.xVel = 0.0;
		this.yVel = 0.0;

		// Set animation and sprite properties
		this.frameIndex = 0;
		this.frameStep = 0;
		this.frameSpeed = 0;

		// Set unique object ID
		this.id = objectIdIterator++;
		objects[this.id] = this;

		return this;
	}

	spawnParams() {
		return {
			x: this.x,
			y: this.y,
			image: this.image,
			altitude: this.altitude,
			type: this.type,
			ephemeral: this.ephemeral,
			solid: this.solid,
			dontRegenerate: this.dontRegenerate,
			spriteXInverted: this.spriteXInverted,
			spriteYInverted: this.spriteYInverted,
			opacity: this.opacity
		}
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
				this.height = this.image.height;
			}
			// Clear collision map
			if (!this.ephemeral) {
				this.clearCollisionMap();
			}

			this.computeBoundingBox();

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

	computeBoundingBox() {
		this.offsetWidthEff = (this.spriteXInverted ? (this.image.width - this.widthOffset - this.width) : this.widthOffset);
		this.offsetHeightEff = (this.spriteYInverted ? (this.image.height - this.heightOffset - this.height) : this.heightOffset);

		// Compute bounding box
		this.boundingBox = {
			left: Math.max(0, this.x + this.offsetWidthEff),
			right: Math.min(levelImage.width, this.x + (this.spriteXInverted ? (this.image.width - this.widthOffset) : (this.widthOffset + this.width))),
			top: Math.max(0, this.y + this.offsetHeightEff),
			bot: Math.min(levelImage.height, this.y + (this.spriteYInverted ? (this.image.height - this.heightOffset) : (this.heightOffset + this.height)))
		};
	}

	clearCollisionMap() {
		for (var i = Math.max(0, this.xPrev); i < Math.min(levelImage.width, this.xPrev + this.image.width); i++) {
			for (var j = Math.max(0, this.yPrev); j < Math.min(levelImage.height, this.yPrev + this.image.height); j++) {
				delete objectCollisionMap[i + j * levelImage.width][this.id];
			}
		}
	}

	computeCollision() {
		if (this.ephemeral || !this.boundingBox) {
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
		var drawXLoc = WIDTH / 2 + this.x - camera.x;
		var drawYLoc = HEIGHT / 2 + this.y - camera.y;
		if (drawXLoc + this.image.width < 0 ||
			drawYLoc + this.image.height < 0 ||
			drawXLoc >= WIDTH ||
			drawYLoc >= HEIGHT) {
			return;
		}
		if (this.image.frames) {
			imageBlit(
				this.image.imageData,
				drawXLoc, drawYLoc,
				this.image.width * this.frameIndex, 0, 
				this.image.width, this.image.height,
				this.spriteXInverted, this.spriteYInverted,
				this.opacity
			);
			this.frameStep++;
			if (this.frameStep > this.frameSpeed) {
				this.frameStep = 0;
				this.frameIndex = (this.frameIndex + 1) % this.image.frames;
			}
		} else {
			imageBlit(
				this.image.imageData,
				drawXLoc, drawYLoc,
				0, 0,
				this.image.width, this.image.height,
				this.spriteXInverted, this.spriteYInverted,
				this.opacity
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
		var edge = null;
		this.xStep += d_x;
		this.yStep += d_y;
		while (this.xStep > 1) {
			edge = checkCollision(this.boundingBox.right, this.boundingBox.top, 1, this.height);
			if (edge.solid || this.x + this.width >= levelImage.width) {
				this.xStep = 0;
				this.xVel = 0;
				stopped = true;
			} else {
				this.xStep--;
				this.x++;
				this.computeBoundingBox();
			}
		}
		while (this.xStep < -1) {
			edge = checkCollision(this.boundingBox.left - 1, this.boundingBox.top, 1, this.height);
			if (edge.solid || this.x <= 0) {
				this.xStep = 0;
				this.xVel = 0;
				stopped = true;
			} else {
				this.xStep++;
				this.x--;
				this.computeBoundingBox();
			}
		}
		while (this.yStep > 1) {
			edge = checkCollision(this.boundingBox.left, this.boundingBox.bot, this.width, 1);
			if (edge.solid || this.y + this.height >= levelImage.height) {
				this.yStep = 0;
				this.yVel = 0;
				stopped = true;
			} else {
				this.yStep--;
				this.y++;
				this.computeBoundingBox();
			}
		}
		while (this.yStep < -1) {
			edge = checkCollision(this.boundingBox.left, this.boundingBox.top - 1, this.width, 1);
			if (edge.solid || this.y <= 0) {
				this.yStep = 0;
				this.yVel = 0;
				stopped = true;
			} else {
				this.yStep++;
				this.y--;
				this.computeBoundingBox();
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

/** Game data */
/**
 * Definition of sprite data
 * {
 *  imageName: string,
 *  frames: int (optional),
 *  width: int (optional, required if frames > 1)
 * }
 */
var SPRITE_DIR = "sprites/";
var SPRITE_DATA = {};

/**
 * Storage for level information
 * {
 *  imageName: string,
 *  statusText: array[string],
 *  objects: array[{
 *	  constructor: GameObject.constructor,
 *	  params: {}
 *  }]
 * }
 */
var LEVEL_DIR = "levels/";
var LEVEL_DATA = [];

/**
 * 
 */
var OBJECT_DATA = {};

/**
 * Used to store frequently used timings and colors.
 */
var STYLE = {
	DEBUG: PS.COLOR_GREEN,
	BACKGROUND_COLOR: [0, 0, 0],
	WALL_COLOR: [255, 255, 255],
	STATUS_COLOR: PS.COLOR_WHITE,
	STATUS_DELAY: 2000
}

/**
 * Built in events & their parameters:
 * 	beforeLoadLevel
 * 	afterLoadLevel
 * 	afterRenderAll
 * 	debug
 * 
 * 	touch
 * 		x: int
 * 		y: int
 * 	init
 * 		system
 * 		options
 * 	shutdown
 * 
 * camera
 * 		sent after attempting to move the camera to the target
 */
var globalEventListener = {}

/** Begin engine code */
var WIDTH = 32;
var HEIGHT = 32;

var SOUND_OPTIONS = {
	autoplay: false,
	path: "sounds/",
	lock: true,
	fileTypes: [ "wav" ]
};

/** Eventing functions */
function sendEvent(type, params = []) {
	if (globalEventListener[type]) {
		globalEventListener[type].apply(null, params);
	}
	// Send event to all objects with a relevant listener
	for (var obj of Object.keys(objects)) {
		if (objects[obj].eventListeners[type]) {
			objects[obj].eventListeners[type].apply(objects[obj], params);
		}
	}
}

// Sounds created using http://www.bfxr.net/ available under the Apache 2.0 License

/** 
 * Rendering Pipeline
 * A rendering layer on top of Perlenspiel's drawing functions.
 * Does not circumvent the perlenspiel engine to draw and manipulate beads.
 */
/**
 * For some reason, the built-in alpha compositing
 * is not working so I'm writing my own.
 */
var pixels = [];

function setPixel(color, x, y) {
	var indexOffset = 3 * (x + y * WIDTH);
	pixels[indexOffset] = color[0];
	pixels[indexOffset + 1] = color[1];
	pixels[indexOffset + 2] = color[2];
};

function getPixel(x, y) {
	var indexOffset = 3 * (x + y * WIDTH);
	return pixels.slice(indexOffset, indexOffset + 3);
};

function drawPixel(color, x, y, opacity = 1) {
	if (x < 0 || x >= WIDTH ||
		y < 0 || y >= HEIGHT) {
		console.log("drawPixel: Pixel out of range: (" + x + ", " + y + ")");
		return;
	}
	var newPixel = getPixel(x, y);
	var alpha = color.length > 3 ? (Math.min(color[3], 255) * opacity) / 255 : 1;

	var alpha_i = (1 - alpha);
	// Alpha compositing
	newPixel[0] = Math.min((color[0] * alpha + newPixel[0] * alpha_i), 255);
	newPixel[1] = Math.min((color[1] * alpha + newPixel[1] * alpha_i), 255);
	newPixel[2] = Math.min((color[2] * alpha + newPixel[2] * alpha_i), 255);

	setPixel(newPixel, x, y);
};

function imageBlit(
	image, screenX, screenY,
	imageX = 0, imageY = 0,
	imageWidth = Infinity, imageHeight = Infinity,
	invertX = false, invertY = false,
	opacity = 1) {

	if (image.pixelSize < 3) {
		console.log("Error: imageBlit() requires at least 3 channels");
		return;
	}

	var i_init = (screenX < 0 ? -screenX : 0) + imageX;
	var j_init = (screenY < 0 ? -screenY : 0) + imageY;

	var i_range = Math.min(image.width, imageX + imageWidth);
	var j_range = Math.min(image.height, imageY + imageHeight) - (invertY ? j_init : 0);
	for (var i = i_init; i < i_range; i++) {
		var pixel_x = (invertX ? (i_range + i_init - i - 1) : i) + screenX - imageX;
		if (pixel_x >= WIDTH || pixel_x < 0) {
			continue;
		}
		for (var j = (invertY ? 0 : j_init); j < j_range; j++) {
			var pixel_y = (invertY ? (j_range + j_init - j - 1) : j) + screenY - imageY;
			if (pixel_y >= HEIGHT || pixel_y < 0) {
				continue;
			}
			imageDataIndex = (i + j * image.width) * image.pixelSize;
			drawPixel(
				image.data.slice(imageDataIndex, imageDataIndex + image.pixelSize),
				pixel_x, pixel_y,
				opacity);
		}
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

var levelIndex = -1;
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

// Stores objects of previous levels
var levelObjects = {};
var prevLevel = -1;

function loadLevel() {
	sendEvent("beforeLoadLevel");
	// Load level terrain
	levelImage = null;
	PS.imageLoad(
		LEVEL_DIR + LEVEL_DATA[levelIndex].imageName,
		onLevelImageLoaded, 4);
};

function onLevelImageLoaded(image) {
	if (levelImage != null) {
		return;
	}
	levelImage = image;

	// Set previous level objects
	levelObjects[prevLevel] = objects;
	objects = {};
	// Add new objects to level
	objectIdIterator = 0;
	if (levelObjects[levelIndex]) {
		for (var obj in levelObjects[levelIndex]) {
			if (!levelObjects[levelIndex][obj].dontRegenerate) {
				new levelObjects[levelIndex][obj].constructor(levelObjects[levelIndex][obj].spawnParams());
			}
		}
	} else {
		if (LEVEL_DATA[levelIndex].objects) {
			for (var obj of LEVEL_DATA[levelIndex].objects) {
				new obj.constructor(obj.params);
			}
		}
	}

	console.log("Generating level " + (levelIndex + 1));
	// Reads pixels and constructs collision map
	objectCollisionMap = [];
	for (var i = 0; i < levelImage.width * levelImage.height; i++) {
		objectCollisionMap[i] = {};
		if (!levelObjects[levelIndex]) {
			var objectTypeId = levelImage.data[i * 4 + 1];
			var objectTypeSubId = levelImage.data[i * 4 + 2];
			if (objectTypeId != 0) {
				var objectTypeEntry = OBJECT_DATA[objectTypeId];
				var objData = null;
				if (objectTypeEntry) {
					if (objectTypeEntry[objectTypeSubId]) {
						objData = objectTypeEntry[objectTypeSubId];
					} else if (objectTypeEntry.default) {
						objData = objectTypeEntry.default;
					}
				}

				var newObjParams = {
					x: i % image.width, 
					y: Math.floor(i / image.width)
				};
				var newObj = null;
				if (objData) {
					if (objData.params) {
						for (var param of Object.keys(objData.params)) {
							newObjParams[param] = objData.params[param];
						}
					}
					newObj = new objData.constructor(newObjParams);
				}

				if (newObj) {
					console.log(
						"LevelLoad: Placing " + newObj.type + 
						" at", newObjParams.x, newObjParams.y);
				} else {
					console.log(
						"LevelLoad: Unrecognized object token " + levelImage.data[i * 4 + 1] + 
						" at", newObjParams.x, newObjParams.y);
				}
			}
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

	// Set level status text
	if (!levelObjects[levelIndex]) {
		setTimeout(showStatus.bind(null, LEVEL_DATA[levelIndex].statusText), 1000);
	}

	prevLevel = levelIndex;

	sendEvent("afterLoadLevel");
}

var textTimeout;
function showStatus(textList, i=0) {
	PS.statusText(textList[i]);
	if (i == textList.length-1) {
		// Just showed the last text, exit
		return;
	}
	clearTimeout(textTimeout);
	textTimeout = setTimeout(showStatus.bind(null, textList, i+1), STYLE.STATUS_DELAY);
}

/**
 * Checks a range in the collision map and returns a list of all object ids collided with
 * -1 refers to terrain
 * Uses world coordinates
 */
function checkCollision(x, y, width = 0, height = 0) {
	var collidedWith = { solid: false };
	for (var i = Math.max(x, 0); i < Math.min(x + width, levelImage.width); i++) {
		for (var j = Math.max(y, 0); j < Math.min(y + height, levelImage.height); j++) {
			for (var id of Object.keys(objectCollisionMap[i + j * levelImage.width])) {
				collidedWith[id] = objects[id];
				if ((objects[id] && objects[id].solid) || id == -1) {
					collidedWith.solid = true;
				}
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
	var xPos = x + camera.x - WIDTH/2;
	var yPos = y + camera.y - HEIGHT/2;
	if (xPos < 0 || xPos >= levelImage.width ||
		yPos < 0 || yPos >= levelImage.height) {
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
	imageBlit(levelImage, WIDTH / 2 - camera.x, HEIGHT / 2 - camera.y);
}

/** Controls and state updates */
// TODO: Make the controls not incredibly game-specific
var controls = {
	paused: true,
	left: false,
	right: false,
	up: false,
	down: false,
	space: false,
	mouseX: -1,
	mouseY: -1,
}
var levelChangeReady = 0;

function engineTick() {
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

		// Move camera to follow cameraTarget
		if (cameraTarget) {
			camera.x = cameraTarget.x + Math.floor(cameraTarget.width / 2);
			camera.y = cameraTarget.y + Math.floor(cameraTarget.height / 2);
		}
		sendEvent("camera");

		// Render level and objects
		drawLevel();
		for (var alt = MIN_ALT; alt <= MAX_ALT; alt++) {
			for (var obj of Object.keys(objects)) {
				if (objects[obj].altitude == alt) {
					objects[obj].draw();
				}
			}
		}

	}

	sendEvent("afterRenderAll");

	flushPixels();

	// Change level (if necessary)
	if (levelChangeReady != levelIndex) {
		if (levelChangeReady >= 0 && levelChangeReady < LEVEL_DATA.length) {
			levelIndex = levelChangeReady;
			loadLevel();
		} else {
			levelChangeReady = levelIndex;
		}
	}

	if (DEBUG_DRAW && levelImage) {
		// showCollisionMap();
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
				// Draw collision boxes
				var collisionData = objectCollisionMap[i + camera.x - WIDTH / 2 + (j + camera.y - HEIGHT / 2) * levelImage.width];
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
	} else {
		PS.border(PS.ALL, PS.ALL, 0);
		PS.glyph(PS.ALL, PS.ALL, "");
	}
}

// TODO: add events for keypresses
function keyDown(key) {
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
		case 32:
			controls.space = true;
			break;
		case PS.KEY_F1:
			DEBUG_DRAW = !DEBUG_DRAW;
			break;
		case PS.KEY_F2:
			console.log("DEBUG: Skipped level");
			levelChangeReady = levelIndex + 1;
			sendEvent("debug");
			break;
		case PS.KEY_F3:
			console.log("DEBUG: Back a level");
			levelChangeReady = levelIndex - 1;
			sendEvent("debug");
			break;
	}
}

function keyUp(key) {
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
		case 32:
			controls.space = false;
			break;
	}
}

function touch(x, y) {
	sendEvent("touch", [x, y]);
}

function enter(x, y) {
	controls.mouseX = x;
	controls.mouseY = y;
}

function shutdown() {
	sendEvent("shutdown");
}

function init(system, options) {
	// Preload & lock sounds

	sendEvent("init");

	initGame();

	// 60 ticks per second
	PS.timerStart(1, engineTick);
}

PS.init = init;
PS.keyDown = keyDown;
PS.keyUp = keyUp;
PS.touch = touch;
// PS.release = G.release;
PS.enter = enter;
// PS.exit = G.exit;
// PS.exitGrid = G.exitGrid;
PS.shutdown = shutdown;
