/* 
	--------------
	SERPENTS TOWER
	--------------

	Game design by Hazel-Bee Lever (https://hazelsworld.neocities.org/)
	Programming by Glitch (https://glitch.gay/)

	'cards.js' library by Einar Egilsson, used under the MIT license (https://github.com/einaregilsson/cards.js/blob/gh-pages/LICENSE)
*/

class TowerFloor {
	rows = 3;
	cols = 3;

	// Each tower floor has a series of rooms
	constructor() {
		this.rooms = Array(rows * cols);
	}

	getRoom(x, y) {
		if (x < 0 || y < 0 || x >= cols || y >= rows) {
			throw "Invalid room coordinates";
		}
		return this.rooms[x + y*cols];
	}
}

class TowerRoom {
	// Rooms can be completed using a weapon of the same or higher value
	constructor(card, towerFloor, x, y) {
		this.card = card;
		this.towerFloor = towerFloor;
		this.x = x;
		this.y = y;
		this.faceUp = false;
		this.adjacentRooms = [];
	}

	getNeighbours() {
		const neighbours = [];
		if (x > 0) {
			neighbours.push(this.towerFloor.getRoom(x - 1, y));
		}
		if (y > 0) {
			neighbours.push(this.towerFloor.getRoom(x, y - 1));
		}
		if (x < TowerFloor.cols - 1) {
			neighbours.push(this.towerFloor.getRoom(x + 1, y));
		}
		if (y < TowerFloor.rows - 1) {
			neighbours.push(this.towerFloor.getRoom(x, y + 1));
		}
		return neighbours;
	}

	onClick() {

	}
}

class Hand {
	// Your hand holds weapons you can use to fight the serpent
	constructor() {
		this.weapons = [];
	}
}

class Weapon {
	// A weapon represents any card in your possession
    constructor() {
        // Initialize properties here
    }

	onClick() {

	}
}


// Initialise cards.js library usage (table, deck, etc)
cards.init({table:'#card-table', type:STANDARD, blackJoker:true, redJoker:true});
var deck, hand, discardPile;
const globalSpeed = 300;

function clickHand(card) {
	let selected = card.el.classList.contains("selected");
	document.querySelectorAll(".card.hand.selected").forEach((el)=>{
		el.classList.remove("selected");
	})
	if (selected == false) {
		// Select the hand card
		card.el.classList.add("selected");

		// Check if a room card is selected
		let room = document.querySelector(".card.room.selected")
		if (room != undefined) {
			attack(card, room.card);
		}
	}
}

function clickRoom(room) {
	let selected = room.el.classList.contains("selected");
	document.querySelectorAll(".card.room.selected").forEach((el)=>{
		el.classList.remove("selected");
	})
	if (selected == false) {
		// Select the room card
		room.el.classList.add("selected");

		// Check if a hand card is selected
		let card = document.querySelector(".card.hand.selected")
		if (card != undefined) {
			attack(card.card, room);
		}
	}
}

function attack(card, room) {
	// Deselect everything
	document.querySelectorAll(".card.selected").forEach((el)=>{
		el.classList.remove("selected", "room", "hand", "floor");
	});
	room.el.classList.add("hand");
	card.rotate(Math.random() * 20 - 10);

	// Move cards around
	let cardX = card.container.x;
	let cardY = card.container.y;	
	card.moveTo(room.container.x, room.container.y, globalSpeed);
	window.setTimeout(()=>{
		room.moveTo(cardX, cardY, globalSpeed);
		card.moveTo(discardPile.x, discardPile.y, globalSpeed);
	}, globalSpeed)

	// Remove card from hand
	let newHand = card.container;
	room.container = newHand;
	room.container[0] = room;
	card.container = undefined;

	// Reveal neighbouring cards
	window.setTimeout(()=>{
		let dataRoom = parseInt(room.el.getAttribute("data-room"));
		if (dataRoom > 2) {
			flip(dataRoom - 3);
		}
		if (dataRoom < 6) {
			flip(dataRoom + 3);
		}
		if (dataRoom % 3 != 0) {
			flip(dataRoom - 1);
		}
		if (dataRoom % 3 != 2) {
			flip(dataRoom + 1);
		}
	}, globalSpeed * 2);
}

function flip(dataRoom) {
	let roomCard = document.querySelector(`.floor[data-room='${dataRoom}']`);
	if (roomCard != undefined && roomCard != null) {
		roomCard = roomCard.card;

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
				roomCard.el.classList.remove("selected", "room", "hand", "floor");
				roomCard.el.clearAttribute("data-room");
			}
		} else {
			// Reveal room
			roomCard.showCard();
			roomCard.container.click(clickRoom);
			roomCard.el.classList.add("room");
		}
	}
}

function newGame() {
	// Create new deck
	deck = new cards.Deck({x: 100, y: 170});
	deck.addCards(cards.all);
	cards.shuffle(deck);
	deck.render({immediate:true});

	// Create discard pile
	discardPile = new cards.Hand({x: 500, y: 170, faceUp:true});

	// Deal starting hand
	hand = [] //new cards.Hand({faceUp:true});
	for (let i=0; i<4; i++) {
		const options = {
			x: cards.options.table.clientWidth / 2 - 112 + (i * 75),
			y: 420,
			faceUp: true
		}
		hand.push(new cards.Hand(options));
		hand[i].addCard(deck.topCard());
		hand[i][0].el.classList.add("hand");
		hand[i].click(clickHand);
		hand[i].render();
	}
	
	// Create 9 cards for the tower floor
	window.setTimeout(()=>{
		towerFloor = [];
		for (let i=0; i<9; i++) {
			let cardx = i % 3;
			let cardy = Math.floor(i / 3);

			const options = {
				x: cards.options.table.clientWidth / 2 - 75 + cardx * 75,
				y: 70 + cardy * 100,
				faceUp: i >= 7
			}; 
			towerFloor.push(new cards.Hand(options));
			towerFloor[i].addCard(deck.topCard());
			towerFloor[i][0].el.classList.add("floor");
			towerFloor[i][0].el.setAttribute("data-room", i);
			if (i >= 7) {
				towerFloor[i][0].el.classList.add("room");
				towerFloor[i].click(clickRoom);
			}

			window.setTimeout(()=>{
				towerFloor[i].render();
			}, 50 * cardx + 100 * cardy);
		}
	}, 500);
}
newGame();

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