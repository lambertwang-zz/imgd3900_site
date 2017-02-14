// engine.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** 
 * GlassForge engine
 * Object & event driven engine with basic class and level scripting for Perlenspiel 3.2
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
		// If true, does not carry over between levels
		/**
		 * This is mostly used for tools.
		 * Because merlin constructs new tools each time he is constructed
		 */
		this.dontRegenerate = false;
		this.type = null;
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
		this.spriteInverted = false;

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
			tool: this.tool,
			alt_tool: this.alt_tool,
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
		if (this.image.frames) {
			imageBlit(
				this.image.imageData,
				WIDTH / 2 + this.x - camera.x,
				HEIGHT / 2 + this.y - camera.y,
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
				WIDTH / 2 + this.x - camera.x,
				HEIGHT / 2 + this.y - camera.y,
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
		for (var obj of LEVEL_DATA[levelIndex].objects) {
			new obj.constructor(obj.params);
		}
	}

	console.log("Generating level " + (levelIndex+1));
	// Reads pixels and constructs collision map
	objectCollisionMap = [];
	for (var i = 0; i < levelImage.width * levelImage.height; i++) {
		objectCollisionMap[i] = {};
		if (!levelObjects[levelIndex]) {
			var newObj = null;
			var newObjParams = {
				x: i % image.width, 
				y: Math.floor(i / image.width)
			};
			var objData = null;
			if (OBJECT_DATA[levelImage.data[i * 4 + 1]]) {
				if (OBJECT_DATA[levelImage.data[i * 4 + 1]][levelImage.data[i * 4 + 2]]) {
					objData = OBJECT_DATA[levelImage.data[i * 4 + 1]][levelImage.data[i * 4 + 2]];
				} else if (OBJECT_DATA[levelImage.data[i * 4 + 1]].default) {
					objData = OBJECT_DATA[levelImage.data[i * 4 + 1]].default;
				}
			}
			if (objData) {
				if (objData.params) {
					for (var param of Object.keys(objData.params)) {
						newObjParams[param] = objData.params[param];
					}
				}
				newObj = new objData.constructor(newObjParams);
			}
			if (newObj) {
				console.log("LevelLoad: Placing " + newObj.type + " at", newObjParams.x, newObjParams.y);
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
	textTimeout = setTimeout(showStatus.bind(null, textList, i+1), 2000);
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
	var xPos = x + camera.x - WIDTH/2;
	var yPos = y + camera.y - HEIGHT/2;
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
	imageBlit(levelImage, WIDTH / 2 - camera.x, HEIGHT / 2 - camera.y);
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
		// Move camera to follow cameraTarget
		if (cameraTarget) {
			camera.x = cameraTarget.x + Math.floor(cameraTarget.width / 2);
			camera.y = cameraTarget.y + Math.floor(cameraTarget.height / 2);
		}
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

	sendEvent("afterRenderAll");

	flushPixels();

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
		case PS.KEY_F1:
			DEBUG_DRAW = !DEBUG_DRAW;
			break;
		case PS.KEY_F2:
			console.log("DEBUG: Skipped level");
			levelChangeReady = 1;
			sendEvent("debug");
			break;
		case PS.KEY_F3:
			console.log("DEBUG: Back a level");
			levelChangeReady = -1;
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
	loadLevel();

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
