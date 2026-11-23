/* 
	--------------
	SERPENTS TOWER
	--------------

	Game design by Hazel-Bee Lever (https://hazelsworld.neocities.org/)
	Programming by Glitch (https://glitch.gay/)

	'cards.js' library by Einar Egilsson, used under the MIT license (https://github.com/einaregilsson/cards.js/blob/gh-pages/LICENSE)
*/
const globalSpeed = 300;
var deck, hand, towerFloor, discardPile;
var initialised = false;


/// MODIFICATIONS TO CARDS.JS
cards.Container.prototype.extend({
	clearCards: function() {
		for (let i=0; i<this.length; i++) {
			let card = this[i];
			card.el.classList.add("hidden");
		}
		this.length = 0;
	},
	
	removeCardByName: function(name) {
		for (var i = 0; i < this.length; i++) {
			if (this[i].name == name) {
				this[i].el.classList.add("hidden");
				this.splice(i, 1);
				return true;
			}
		}
		return false;
	}
});


// SERPENTS TOWER CLASSES
class TowerFloor {
	rows = 3;
	cols = 3;

	// Each tower floor has a series of rooms
	constructor() {
		this.rooms = new Array();
		this.roomCount = 0;
	}

	dealFloor() {
		// Deal 9 more cards
		for (let i=0; i<9; i++) {
			const roomX = i % 3;
			const roomY = Math.floor(i / 3);
			const topCard = deck.topCard();
			const options = {
				x: cards.options.table.clientWidth / 2 - 75 + roomX * 75,
				y: 70 + roomY * 100
			};
			
			if (topCard !== undefined) {
				this.addRoom(new TowerRoom(options, topCard, this, roomX, roomY));
			}
		}

		// Reveal the last two or three cards in the floor
		// This is where the player starts fighting
		let revealCount = 2;
		if (this.roomCount < 8) {
			revealCount = 3;
		}
		if (this.roomCount < revealCount) {
			revealCount = this.roomCount;
		}
		for (let i=0; i<revealCount; i++) {
			this.rooms[this.roomCount-1-i].reveal();
		}
	}

	addRoom(room) {
		this.rooms.push(room);
		this.roomCount += 1;
	}

	getRoom(x, y) {
		if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) {
			throw "Invalid room coordinates";
		}
		return this.rooms[x + y*this.cols];
	}

	discardRoom(x, y) {
		this.rooms[x + y*this.cols] = undefined;
		this.roomCount -= 1;

		if (this.roomCount == 0) {
			window.setTimeout(()=>{
				this.rooms.length = 0;
				this.dealFloor();
			}, globalSpeed);
		}
	}

	clearCards() {
		for (let i=0; i<this.rooms.length; i++) {
			if (this.rooms[i] !== undefined) {
				this.rooms[i].clearCards();
			}
		}
		this.rooms.length = 0;
		this.roomCount = 0;
	}
}

class TowerRoom extends cards.Hand {
	// Rooms can be completed using a weapon of the same or higher value
	constructor(options, card, towerFloor, roomX, roomY) {
		super(options);
		this.towerFloor = towerFloor;
		this.roomX = roomX;
		this.roomY = roomY;

		// Add card
		card.el.classList.add('floor');
		card.el.setAttribute("data-room", roomX + roomY*3);
		card.steal = (hand) => {this.steal(hand)};
		this.addCard(card);

		// Render
		window.setTimeout(()=>{
			this.render();
		}, 50 * roomX + 100 * roomY);
	}

	reveal() {
		// Reveal the card and enable clicking logic
		if (this.faceUp == undefined || this.faceUp == false) {
			this.click(this.onClick);
			this.faceUp = true;
		}
	}

	steal(hand) {
		// Remove from the tower floor
		this.towerFloor.discardRoom(this.roomX, this.roomY);

		// Move card to hand
		let card = this[0];
		card.el.classList.remove("floor");
		card.el.classList.add("hand");
		card.container = hand;
		hand[0] = card;

		// Delay animation slightly
		window.setTimeout(()=>{
			card.moveTo(hand.x, hand.y, globalSpeed);
			card.moveToFront();
		}, globalSpeed);
	}

	discard() {
		// Remove from the tower floor
		this.towerFloor.discardRoom(this.roomX, this.roomY);

		// Move card to discard pile
		let card = this[0];
		card.el.classList.remove("floor");
		card.container = undefined;
		discardPile.push(card);

		// Delay animation slightly
		window.setTimeout(()=>{
			card.moveTo(discardPile.x, discardPile.y, globalSpeed);
			card.moveToFront();
		}, globalSpeed);
	}

	getNeighbours() {
		const neighbours = [];
		if (this.roomX > 0) {
			neighbours.push(this.towerFloor.getRoom(this.roomX - 1, this.roomY));
		}
		if (this.roomY > 0) {
			neighbours.push(this.towerFloor.getRoom(this.roomX, this.roomY - 1));
		}
		if (this.roomX < this.towerFloor.cols - 1) {
			neighbours.push(this.towerFloor.getRoom(this.roomX + 1, this.roomY));
		}
		if (this.roomY < this.towerFloor.rows - 1) {
			neighbours.push(this.towerFloor.getRoom(this.roomX, this.roomY + 1));
		}
		return neighbours;
	}

	onClick(roomCard) {
		let selected = roomCard.el.classList.contains("selected");
		document.querySelectorAll(".card.floor.selected").forEach((el)=>{
			el.classList.remove("selected");
		})
		if (selected == false) {
			// Select the room card
			roomCard.el.classList.add("selected");

			// Check if a hand card is selected
			let card = document.querySelector(".card.hand.selected")
			if (card != undefined) {
				attack(card.card, roomCard);
			}
		}
	}
}

class Hand {
	// Your hand holds weapons you can use to fight the serpent
	constructor() {
		this.weapons = [];
	}

	dealStartingHand() {
		for (let i=0; i<4; i++) {
			this.dealWeapon(i);
		}
	}

	dealWeapon(slot) {
		const options = {
			x: cards.options.table.clientWidth / 2 - 112 + (slot * 75),
			y: 420,
			faceUp: true
		}
		this.weapons.push(new Weapon(options, deck.topCard()));
	}

	clearCards() {
		for (let i=0; i<this.weapons.length; i++) {
			this.weapons[i].clearCards();
		}
		this.weapons.length = 0;
	}
}

class Weapon extends cards.Hand {
	// A weapon represents any card in your possession
	constructor(options, card) {
		super(options)
		
		// Add card to the weapon
		card.el.classList.add("hand");
		this.addCard(card);

		// Add click event listener
		this.click(this.onClick);

		// Render
		this.render();
	}
	
	onClick(card) {
		let selected = card.el.classList.contains("selected");
		document.querySelectorAll(".card.hand.selected").forEach((el)=>{
			el.classList.remove("selected");
		})
		if (selected == false) {
			// Select the hand card
			card.el.classList.add("selected");

			// Check if a room card is selected
			let room = document.querySelector(".card.floor.selected")
			if (room != undefined) {
				attack(card, room.card);
			}
		}
	}
}


// Initialise cards.js library usage (table, deck, etc)
function initSerpentsTower() {
	cards.init({table:'#card-table', type:STANDARD, blackJoker:true, redJoker:true, acesHigh:true});

	// Create deck, discard pile, hand and tower
	deck = new cards.Deck({x: 100, y: 170});
	hand = new Hand();
	discardPile = new cards.Hand({x: 500, y: 170, faceUp:true});
	towerFloor = new TowerFloor();
}

function newGame(difficulty=0) {
	if (initialised === false) {
		initSerpentsTower();
		initialised = true;
	}

	// Make sure cards aren't hidden
	document.querySelectorAll(".card").forEach((elem)=>{
		elem.classList.remove('hidden', 'hand', 'floor');
	})

	// Add cards to deck
	deck.addCards(cards.all);

	// Set game difficulty (number of jokers)
	if (difficulty === 0) {
		// Easy, two jokers in deck
	} else if (difficulty === 1) {
		// Medium, one joker in deck
		deck.removeCardByName('RJ0');
	} else if (difficulty === 2) {
		// Hard, no jokers
		deck.removeCardByName('RJ0');
		deck.removeCardByName('BJ0');
	}

	// Shuffle and deal starting hand
	cards.shuffle(deck);
	deck.render({immediate:true});
	hand.dealStartingHand();
	
	// Create 9 cards for the tower floor
	window.setTimeout(()=>{
		towerFloor.dealFloor();
	}, 500);

	// Show/hide various buttons
	document.getElementById("start-buttons").classList.add("hidden");
	document.getElementById("forfeit").classList.remove("hidden");
	document.getElementById("tower-floor").classList.remove("hidden");
	document.getElementById("card-hand").classList.remove("hidden");
}

function endGame() {
	deck.clearCards();
	hand.clearCards();
	towerFloor.clearCards();
	discardPile.clearCards();

	document.getElementById("forfeit").classList.add("hidden");
	document.getElementById("tower-floor").classList.add("hidden");
	document.getElementById("card-hand").classList.add("hidden");
	document.getElementById("start-buttons").classList.remove("hidden");
}

function attack(card, room) {
	// Get ranks
	let cardRank = card.rank;
	let roomRank = room.rank;

	// High aces
	if (cardRank === 1) {
		cardRank = 14;
	}
	if (roomRank === 1) {
		roomRank = 14;
	}

	// Deselect all cards
	document.querySelectorAll(".card.selected").forEach((el)=>{
		el.classList.remove("selected");
	});

	// Check if card outranks room, or is a joker (jokers can always be swapped)
	if (cardRank >= roomRank || roomRank == 0 || cardRank == 0) {
		// Reveal neighbouring cards
		let neighbours = room.container.getNeighbours();
		window.setTimeout(()=>{
			for (let neighbour of neighbours) {
				if (neighbour !== undefined) {
					neighbour.reveal();
					neighbour.render();

					let count = 0;
					for (let n of neighbour.getNeighbours()) {
						count += n !== undefined;
					}
					if (count == 0) {
						neighbour.discard();
					}
				}
			}
		}, globalSpeed);
		
		// Steal room and place in hand
		let handContainer = card.container;
		let roomContainer = room.container;
		room.steal(handContainer);
		
		// Move room to hand, hand to discard
		card.el.classList.remove("hand");

		// Move cards around
		card.moveTo(roomContainer.x, roomContainer.y, globalSpeed);
		window.setTimeout(()=>{
			card.rotate(Math.random() * 20 - 10);
			card.moveTo(discardPile.x, discardPile.y, globalSpeed);
			card.moveToFront();
			discardPile.push(card);
		}, globalSpeed)

		// Remove card from hand
		card.container = undefined;
	}
}

function flip(dataRoom) {
	let elem = document.querySelector(`.floor[data-room='${dataRoom}']`);
	if (elem != undefined && elem != null && elem.card != undefined && elem.card != null) {
		let roomCard = elem.card;
		let towerFloor = roomCard.container;

		if (roomCard.el.classList.contains("room")) {
			// Room is already revealed, so we check if neighbours still exist or not
			let tail = roomCard.el.getAttribute("data-room");
			let neighbourCount = 0;
			if (tail > 2 && document.querySelector(`.floor[data-room='${tail - 3}']`)) {
				neighbourCount += 1;
			}
			if (tail < 6 && document.querySelector(`.floor[data-room='${tail + 3}']`)) {
				neighbourCount += 1;
			}
			if (tail % 3 != 0 && document.querySelector(`.floor[data-room='${tail - 1}']`)) {
				neighbourCount += 1;
			}
			if (tail % 3 != 2 && document.querySelector(`.floor[data-room='${tail + 1}']`)) {
				neighbourCount += 1;
			}
			if (neighbourCount == 0) {
				discardPile.push(roomCard);
				roomCard.moveTo(discardPile.x, discardPile.y, globalSpeed);
				roomCard.moveToFront();
				roomCard.rotate(Math.random() * 20 - 10);
				roomCard.el.classList.remove("selected", "hand", "floor");
				roomCard.el.removeAttribute("data-room");
			}
		} else {
			// Reveal room
			roomCard.showCard();
		}
	}
}

document.getElementById("easy").addEventListener("click", ()=>{
	newGame(0);
});

document.getElementById("medium").addEventListener("click", ()=>{
	newGame(1);
});

document.getElementById("hard").addEventListener("click", ()=>{
	newGame(2);
});

document.getElementById("forfeit").addEventListener("click", ()=>{
	endGame();
});