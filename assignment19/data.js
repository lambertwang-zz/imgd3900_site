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
	altar_orb: {
		imageName: "altar.orb.png",
		frames: 6,
		width: 4
	},
	altar_bow: {
		imageName: "altar.bow.png",
		frames: 2,
		width: 4
	},
	staff: {
		imageName: "staff.png",
	},
	staff_active: {
		imageName: "staff.active.png",
	},
	balloon: {
		imageName: "balloon.png",
	},
	balloon_used: {
		imageName: "balloon.used.png",
	},
	orb: {
		imageName: "orb.png",
		frames: 6,
		width: 4
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
		]
	},
	{
		imageName: "level2.png",
		statusText: [
			"Debris blocks my way",
			"Press Up/W to jump"
		]
	},
	{
		imageName: "level3.png",
		statusText: [
			"What's that? A magic staff?",
			"Maybe I should grab it..."
		]
	},
	{
		imageName: "level4.png",
		statusText: [""]
	},
	{
		imageName: "level5.png",
		statusText: [""]
	},
	{
		imageName: "level6.png",
		statusText: [
			"My clairvoyance is blocked!",
			"I must find out why..."
		]
	},
	{
		imageName: "level7.png",
		statusText: ["Something smells here..."]
	},
	{
		imageName: "level8.png",
		statusText: [""]
	},
	{
		imageName: "level9.png",
		statusText: [""]
	},
	{
		imageName: "level10.png",
		statusText: [""]
	},
];

OBJECT_DATA = {
	255: { default: { constructor: Merlin } },
	193: {
		default: { constructor: DoorPrev },
		128: { 
			constructor: DoorPrev,
			params: {
				spriteYInverted: true
			}
		}
	},
	192: {
		default: { constructor: Door },
		128: { 
			constructor: Door,
			params: {
				spriteYInverted: true
			}
		},
		139: { 
			constructor: Door,
			params: {
				spriteYInverted: true,
				levelTarget: 9
			}
		}
	},
	128: { default: { constructor: Box } },
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
		65: {
			constructor: Altar,
			params: {
				tool: Staff,
				image: "altar_staff",
				spriteYInverted: true
			}
		},
		128: {
			constructor: Altar,
			params: {
				tool: Balloon,
				image: "altar_balloon"
			}
		},
		160: {
			constructor: Altar,
			params: {
				tool: GravityOrb,
				image: "altar_orb"
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
