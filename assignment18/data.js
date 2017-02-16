// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Game data */
SPRITE_DATA = {
	merlin: {
		imageName: "merlin.png",
	},
	merlin_walk: {
		imageName: "merlin.walk.png",
		frames: 3,
		width: 4
	},
	troll: {
		imageName: "troll.png",
	},
	troll_walk: {
		imageName: "troll.walk.png",
		frames: 4,
		width: 12
	},
	staff: {
		imageName: "staff.png",
	},
	staff_active: {
		imageName: "staff.active.png",
	},
	box: {
		imageName: "box.png",
	},
	box_active: {
		imageName: "box.active.png",
		frames: 4,
		width: 5
	},
	door: {
		imageName: "door.png",
	},
	door_prev: {
		imageName: "door.prev.png",
	},
	altar: {
		imageName: "altar.png",
	},
	altar_staff: {
		imageName: "altar.staff.png",
		frames: 2,
		width: 4
	},
	altar_balloon: {
		imageName: "altar.balloon.png",
		frames: 2,
		width: 4
	},
	altar_bow: {
		imageName: "altar.bow.png",
		frames: 2,
		width: 4
	},
	balloon: {
		imageName: "balloon.png",
	},
	balloon_used: {
		imageName: "balloon.used.png",
	},
};

LEVEL_DATA = [
	{
		imageName: "level1.png",
		statusText: [
			"Aaaaaaaaaah!",
			"Where am I?",
			"I need find the exit!",
			"Arrow Keys/WASD to move"
		],
		objects: [
		]
	},
	{
		imageName: "level2.png",
		statusText: [
			"Debris blocks my way",
			"Press Up/W to jump"
		],
		objects: []
	},
	{
		imageName: "level3.png",
		statusText: [
			"What's that? A magic staff?",
			"Maybe I should grab it..."
		],
		objects: []
	},
	{
		imageName: "level4.png",
		statusText: [""],
		objects: []
	},
	{
		imageName: "level5.png",
		statusText: [""],
		objects: []
	},
	{
		imageName: "level6.png",
		statusText: [
			"My clairvoyance is blocked!",
			"I must find out why..."
		],
		objects: []
	},
	{
		imageName: "level7.png",
		statusText: [""],
		objects: []
	},
	{
		imageName: "level8.png",
		statusText: [""],
		objects: []
	},
];

OBJECT_DATA = {
	255: { 
		default: { constructor: Merlin } },
	192: {
		0: { constructor: Door },
		128: { constructor: DoorPrev },
		default: { constructor: Door }
	},
	128: { default: {constructor: Box } },
	64: {
		default: {
			constructor: Altar,
			params: {
				tool: undefined,
				image: "altar_staff"
			}
		},
		64: {
			constructor: Altar,
			params: {
				tool: Staff,
				image: "altar_staff"
			}
		},
		128: {
			constructor: Altar,
			params: {
				tool: Balloon,
				image: "altar_balloon"
			}
		},
		192: {
			constructor: Altar,
			params: {
				tool: Bow,
				image: "altar_bow"
			}
		}
	},
	32: { default : { constructor: Troll } }
}
