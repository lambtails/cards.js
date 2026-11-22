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


class TowerFloor {
	rows = 3;
	cols = 3;

	// Each tower floor has a series of rooms
	constructor() {
		this.rooms = new Array();
		this.roomCount = 0;
	}

	dealFloor() {
		/*
			if (i >= 7) {
				towerFloor.rooms[i][0].el.classList.add("room");
				towerFloor.rooms[i].click(clickRoom);
			}*/

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

		// Delay animation slightly
		window.setTimeout(()=>{
			card.moveTo(hand.x, hand.y, globalSpeed);
		}, globalSpeed);
	}

	discard() {
		// Remove from the tower floor
		this.towerFloor.discardRoom(this.roomX, this.roomY);

		// Move card to discard pile
		let card = this[0];
		card.el.classList.remove("floor");
		card.container = undefined;

		// Delay animation slightly
		window.setTimeout(()=>{
			card.moveTo(discardPile.x, discardPile.y, globalSpeed);
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
	
	// Add all cards to deck
	deck.addCards(cards.all);
	cards.shuffle(deck);
	deck.render({immediate:true});
}

function newGame() {
	// Deal starting hand
	hand.dealStartingHand();
	
	// Create 9 cards for the tower floor
	window.setTimeout(()=>{
		for (let i=0; i<9; i++) {
			let roomX = i % 3;
			let roomY = Math.floor(i / 3);

			const options = {
				x: cards.options.table.clientWidth / 2 - 75 + roomX * 75,
				y: 70 + roomY * 100
			}; 
			towerFloor.addRoom(new TowerRoom(options, deck.topCard(), towerFloor, roomX, roomY))
		}

		towerFloor.dealFloor();
	}, 500);
}

initSerpentsTower();
newGame();

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
		//room.el.classList.remove("floor");
		//room.el.classList.add("hand");

		// Move cards around
		card.moveTo(roomContainer.x, roomContainer.y, globalSpeed);
		window.setTimeout(()=>{
			card.rotate(Math.random() * 20 - 10);
			card.moveTo(discardPile.x, discardPile.y, globalSpeed);
		}, globalSpeed)

		

		// Remove card from hand
		//room.container = newHand;
		//room.container[0] = room;
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
				roomCard.moveTo(discardPile.x, discardPile.y, globalSpeed);
				roomCard.rotate(Math.random() * 20 - 10);
				roomCard.el.classList.remove("selected", "hand", "floor");
				roomCard.el.removeAttribute("data-room");
			}
		} else {
			// Reveal room
			roomCard.showCard();
			//roomCard.container.click(clickRoom);
			//roomCard.el.classList.add("room");
		}
	}
}



/*
//Now lets create a couple of hands, one face down, one face up.
upperhand = new cards.Hand({faceUp:false, y:60});
lowerhand = new cards.Hand({faceUp:true,  y:340});

//Lets add a discard pile
discardPile = new cards.Deck({faceUp:true});
discardPile.x += 50;


//Let's deal when the Deal button is pressed:
document.getElementById("deal").addEventListener("click", ()=>{
	//Deck has a built in method to deal to hands.
	document.getElementById("deal").style.display = "none";
	deck.deal(5, [upperhand, lowerhand], 50, function() {
		//This is a callback function, called when the dealing
		//is done.
		discardPile.addCard(deck.topCard());
		discardPile.render();
	});
})


//When you click on the top card of a deck, a card is added
//to your hand
deck.click(function(card){
	if (card === deck.topCard()) {
		lowerhand.addCard(deck.topCard());
		lowerhand.render();
	}
});

//Finally, when you click a card in your hand, if it's
//the same suit or rank as the top card of the discard pile
//then it's added to it
lowerhand.click(function(card){
	if (card.suit == discardPile.topCard().suit
		|| card.rank == discardPile.topCard().rank) {
		discardPile.addCard(card);
		discardPile.render();
		lowerhand.render();
	}
});


//So, that should give you some idea about how to render a card game.
//Now you just need to write some logic around who can play when etc...
//Good luck :)
*/