// game.js for Perlenspiel 3.2
// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

/** Game data */
SPRITE_DATA = {
	merlin: { imageName: "merlin.png" },
	merlin_walk: {
		imageName: "merlin.walk.png",
		frames: 3,
		width: 4
	},
	king: { imageName: "king.png" },
	troll: { imageName: "troll.png" },
	troll_walk: {
		imageName: "troll.walk.png",
		frames: 4,
		width: 12
	},
	dragon: {
		imageName: "dragon.png",
		frames: 4,
		width: 26
	},
	drake: {
		imageName: "drake.png",
		frames: 4,
		width: 26
	},
	box: { imageName: "box.png" },
	box_inv: { imageName: "box.inv.png" },
	box_active: {
		imageName: "box.active.png",
		frames: 4,
		width: 5
	},
	plate: { imageName: "plate.png" },
	plate_active: { imageName: "plate.active.png" },
	toggle_block: { imageName: "toggle_block.png" },
	door: { imageName: "door.png" },
	door_prev: { imageName: "door.prev.png" },
	altar: { imageName: "altar.png" },
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
	staff: { imageName: "staff.png" },
	staff_active: { imageName: "staff.active.png" },
	balloon: { imageName: "balloon.png" },
	balloon_used: { imageName: "balloon.used.png" },
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
			"Where am I?",
			"I need find the exit!",
			"Arrow Keys/WASD to move"
		]
	},
	{
		imageName: "level2.png",
		statusText: [
			"What happened to this castle?",
			"Debris blocks my way",
			"Press Up/W to jump"
		]
	},
	{
		imageName: "level3.png",
		statusText: []
	},
	{
		imageName: "level4.png",
		statusText: [
			"I should help the king",
			"And solve this mystery"
		]
	},
	{
		imageName: "level5.png",
		statusText: [
			"My clairvoyance is blocked!",
			"I must find another way..."
		]
	},
	{
		imageName: "level6.png",
		statusText: [
			"These ruins are perilous",
			"I must watch my step"
		]
	},
	{
		imageName: "level7.png",
		statusText: [
			"Something smells here..."
		]
	},
	{
		imageName: "level8.png",
		statusText: [
			"What a baffling room!",
			"Perhaps something I need",
			"has been left behind..."
		]
	},
	{
		imageName: "level9.png",
		statusText: [ "This floor is unstable" ]
	},
	{
		imageName: "level10.png",
		statusText: [""]
	},
	{
		imageName: "level11.png",
		statusText: [""]
	},
	{
		imageName: "level12.png",
		statusText: [ "I sense something powerful..." ]
	},
	{
		imageName: "level13.png",
		statusText: [
			"*ROOOOAAAR*",
			"The source must be ahead!"
		]
	},
	{
		imageName: "level14.png",
		statusText: [
			"Dueling serpents!",
			"My search has ended."
		]
	},
	{
		imageName: "end.png",
		statusText: [ "The end." ]
	},
];

OBJECT_DATA = {
	255: { default: { constructor: Merlin } },
	254: { default: { constructor: Vortigern } },
	253: { default: { constructor: Dragon } },
	252: { default: { constructor: Drake } },
	193: {
		default: { constructor: DoorPrev },
		128: { 
			constructor: DoorPrev,
			params: {
				spriteYInverted: true
			}
		},
		139: { 
			constructor: DoorPrev,
			params: {
				spriteYInverted: true,
				levelTarget: 7
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
	130: { default: { constructor: ToggleBlock } },
	129: { 
		default: { constructor: Plate },
		128: { 
			constructor: Plate,
			params: { spriteYInverted: true }
		 } 
	},
	128: {
		default: { constructor: Box },
		128: { 
			constructor: Box,
			params: { spriteYInverted: true }
		}
	},
	64: {
		default: { constructor: Altar },
		1: {
			constructor: Altar,
			params: { spriteYInverted: true }
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
		}
	},
	32: { default : { constructor: Troll } }
}
