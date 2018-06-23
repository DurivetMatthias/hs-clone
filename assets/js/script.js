let boards = [];
let cards = [];
let globalCardId = 0;
let handDiv;
let boardDiv;
let opponentHandDiv;
let opponentBoardDiv;
let player;
let opponent;
let currentAction;
let currentMinion;
let activePlayer;
let catalog = {
    mindBlast: function () {
        return new Card("mindBlast",
            2,
            function () {
                opponent.health-=5;
            },
            "spell");
    },
    whisp: function () {
        return new Card("whisp",
            0,
            function(){
                return new Minion(1,1)
            },
            "minion");
    },
    oracle: function () {
        return new Card("oracle",
            1,
            function(){
                return new Minion(2,2)
            },
            "minion");
    }
};

HTMLElement.prototype.on = function(event, selector, handler) {
    this.addEventListener(event, function(e) {
        let target = e.target;
        if (typeof(selector) === 'string') {
            while (!target.matches(selector) && target !== this) {
                target = target.parentElement;
            }

            if (target.matches(selector)){
                handler.call(null, target);
            }

        } else {
            selector.call(this, e);
        }
    });
};

function minionAttack(attacker, defender) {
    defender.health -= attacker.attack;
    attacker.health -= defender.attack;
}

document.addEventListener('DOMContentLoaded', function () {

   /*document.documentElement.on('click', '.ready', function (target) {
       let list = document.getElementsByClassName('ready');
       for(let i=0;i<list.length;i++){
           if(list[i]!=target) list[i].classList.add('suppressReady')
       }
       currentMinion = target.dataset.id;
   });

    document.documentElement.on('click', '.targetable', function (target) {
        target.health -= currentMinion.attack;
        currentMinion.health -= target.attack;
    });*/

    player = new Player();
    activePlayer = player;
    opponent = new Player();
    for(let i = 0;i<15;i++){
        let whispCopy = catalog.whisp();
        whispCopy.id = globalCardId++;
        player.deck.push(whispCopy);

        let oC = catalog.oracle();
        oC.id = globalCardId++;
        player.deck.push(oC);

        let wc = catalog.whisp();
        wc.id = globalCardId++;
        opponent.deck.push(wc);

        let oc = catalog.oracle();
        oc.id = globalCardId++;
        opponent.deck.push(oc);
    }
    player.drawCard(5);
    opponent.drawCard(5);

    let app = new Vue({
        el: '#app',
        data: {
            player: player,
            opponent: opponent,
            activePlayer: activePlayer
        },
        methods: {
            endTurn: function () {
                if(activePlayer===player) {

                    activePlayer = opponent;
                    this.activePlayer = opponent;
                }
                else {
                    activePlayer = player;
                    this.activePlayer = player;
                }
                this.activePlayer.board.forEach(function (minion) {
                    minion.summoningSickness = false;
                });
            },
            minionClick: function () {
                cosnole.log('hi');
            }
        }
    });

    handDiv = document.getElementById('hand');
    boardDiv = document.getElementById('board');
    opponentHandDiv = document.getElementById('opponentHand');
    opponentBoardDiv = document.getElementById('opponentBoard');
    makeDroppable(document.documentElement);//basically drop anywhere but in self TODO undroppable in hand
});

function makeDroppable(element) {
    element.ondrop = drop;
    element.ondragover = allowDrop;
}

function disableDrop(element) {
    element.ondragover = null;
    element.ondrop = null;
}

function makeDragggable(element) {
    element.setAttribute('draggable', true);
    element.ondragstart = drag;
}
function disableDrag(element) {
    if(element!=handDiv){
        element.setAttribute('draggable', false);
        element.ondragstart = null;
    }
}

function allowDrop(ev) {
    if(!ev.target.classList.contains('card')) ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("id", ev.target.dataset.id);
}

function drop(ev) {
    let id = ev.dataTransfer.getData("id");
    let card = activePlayer.getCard(id);
    activePlayer.board.push(card.effect());// if returns minion(multiple TODO)
    activePlayer.removeCard(id);
}

function Player() {
    this.health = 30;
    this.mana = 1;
    this.maxHandSize = 10;
    this.armor = 0;
    this.weapon = null;
    this.attack = 0;
    this.deck = [];
    this.hand = [];
    this.board = [];
    this.deadMinions = [];
    this.playedCards = [];
    this.displayTargets = false;
    this.drawCard = function (amount) {
        for(let i=0;i<amount;i++){
            let card = this.deck.pop();
            //addCardDiv(card);
            this.hand.push(card);
        }
    };
    this.getCard = function (id) {
        let result;
        this.hand.forEach(function (card) {
            if(parseInt(card.id) == id) result = card;
        });
        return result;
    };
    this.removeCard = function (id) {
        this.hand = this.hand.filter(function (card) {
            return card.id != id;
        });
    };
    return this;
}

function Card(name, cost, effect, type) {
    this.name = name;
    this.cost = cost;
    this.effect = effect;
    this.type = type;
}

function Minion(attack, health) {
    this.attack = attack;
    this.health = health;
    this.numberOfAttacks = 1;
    this.summoningSickness = true;
    this.attackable = true;
    this.targetable = true;
    return this;
}