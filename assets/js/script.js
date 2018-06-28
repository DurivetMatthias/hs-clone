let globalId = 0;
let handDiv;
let boardDiv;
let opponentHandDiv;
let opponentBoardDiv;
let app;
let catalog;
function initCatalog() {
    if(!catalog) catalog = {
        pawn: function () {
            return new Card("pawn",
                1,
                function () {
                    let minion = new Minion(1,6, this.id);
                    minion.turnEndEffects = [function () {
                        let defenders = getOpposingId(minion.id);
                        for(let i=0;i<defenders.length;i++){
                            app.getNonActivePlayer().getMinion(defenders[i]).takeDamage(1);
                        }
                    }];
                    app.activePlayer.summonMinion(minion, this.minionIndex);
                },
                "spell");
        },mindBlast: function () {
        return new Card("mindBlast",
            2,
            function () {
                app.getNonActivePlayer().health-=5;
            },
            "spell");
    },
        flameStrike: function() {
            return new Card("flameStrike",
                2,
                function () {
                    app.getNonActivePlayer().board.map(minion => minion.takeDamage(4));
                },
                "spell");
        },
        whisp: function () {
            return new Card("whisp",
                0,
                function(){
                    app.activePlayer.summonMinion(new Minion(1,1, this.id), this.minionIndex);
                },
                "minion");
        },
        oracle: function () {
            return new Card("oracle",
                1,
                function(){
                    app.activePlayer.summonMinion(new Minion(1,1, this.id,{deathrattle: function (self) {
                        let allCards = Object.values(catalog);
                        let randomCard = allCards[Math.floor((Math.random() * allCards.length))]();
                        self.getOwner().hand.push(randomCard);
                    }}), this.minionIndex);
                },
                "minion");
        },
        smite: function () {
            return new Card("smite",
                1,
                function(){
                    app.targetedEffectPlayed(TARGET_OPTIONS.ANY, function (target) {
                        target.takeDamage(2);
                    }, this)
                },
                "spell");
        },
        mindControll: function () {
            return new Card("mind controll",
                10,
                function(){
                    app.targetedEffectPlayed(TARGET_OPTIONS.ENEMY_MINION, function (target) {
                        removeFromArray(app.getNonActivePlayer().board, target);
                        app.activePlayer.board.push(target);
                    }, this);
                },
                "spell");
        },
        lootHoarder: function () {
            let card = new Card("loot hoarder",
                2,
                function () {
                    app.activePlayer.summonMinion(new Minion(2,1, this.id, {deathrattle: function (self) {
                        self.getOwner().drawCard(1);
                    }}), this.minionIndex);
                },
                "minion");
            return card;
        }
    };
}

function getOpposingId(id) {
    let playerMinionAmount = app.player.board.length;
    let opponentMinionAmount = app.opponent.board.length;
    let playerState = app.player.board.map(minion => minion.id);
    let opponentState = app.opponent.board.map(minion => minion.id);
    let idInPlayerState =  playerState.includes(id);

    function addIdToFirstAndLast(id, array) {
        array.push(id);
        array.splice(0, 0, id);
    }

    for(let i=0;i<4;i++){//by adding 8 filler with max boardSize at 7 there are no out of indexes
        addIdToFirstAndLast(app.opponent.id, opponentState);
        opponentMinionAmount+=2;

        addIdToFirstAndLast(app.player.id, playerState);
        playerMinionAmount+=2;
    }
    while(playerMinionAmount+1<opponentMinionAmount){
        addIdToFirstAndLast(app.player.id, playerState);
        playerMinionAmount+=2;
    }
    while(opponentMinionAmount+1<playerMinionAmount){
        addIdToFirstAndLast(app.opponent.id, opponentState);
        opponentMinionAmount+=2;
    }

    if(playerMinionAmount%2 === opponentMinionAmount%2){//both even or odd
        if(idInPlayerState){
            return [opponentState[playerState.indexOf(id)]];
        }else{
            return [playerState[opponentState.indexOf(id)]]
        }
    }else{
        let opposingIdOne;
        let opposingIdTwo;
        if(idInPlayerState){
            if(playerMinionAmount>opponentMinionAmount){
                opposingIdOne = opponentState[playerState.indexOf(id)-1];
                opposingIdTwo = opponentState[playerState.indexOf(id)]
            }else{
                opposingIdOne = opponentState[playerState.indexOf(id)];
                opposingIdTwo = opponentState[playerState.indexOf(id)+1]
            }
        }
        else{
            if(opponentMinionAmount>playerMinionAmount){
                opposingIdOne = playerState[opponentState.indexOf(id)-1];
                opposingIdTwo = playerState[opponentState.indexOf(id)]
            }else{
                opposingIdOne = playerState[opponentState.indexOf(id)];
                opposingIdTwo = playerState[opponentState.indexOf(id)+1]
            }
        }
        if(idInPlayerState&&opposingIdOne===app.opponent.id) return [opposingIdTwo];
        else if(idInPlayerState&&opposingIdTwo===app.opponent.id) return [opposingIdOne];
        else if(!idInPlayerState&&opposingIdOne===app.player.id) return [opposingIdTwo];
        else if(!idInPlayerState&&opposingIdTwo===app.player.id) return [opposingIdOne];
        else return [opposingIdOne, opposingIdTwo];
    }
}

let TARGET_OPTIONS = {
    MINION_COMBAT: "MINION_COMBAT",
    ENEMY_MINION: "ENEMY_MINION",
    ENEMY_HERO: "ENEMY_HERO",
    ENEMY: "ENEMY",
    FRIENDLY_MINION: "FRIENDLY_MINION",
    FRIENDLY_HERO: "FRIENDLY_HERO",
    FRIENDLY: "FRIENDLY",
    ANY: "ANY",
    ANY_MINION: "ANY_MINION",
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

function removeFromArray(a, x) {
    let i = a.indexOf(x);
    a.splice(i, 1);
}

document.addEventListener('DOMContentLoaded', function () {
    handDiv = document.getElementById('hand');
    boardDiv = document.getElementById('board');
    opponentHandDiv = document.getElementById('opponentHand');
    opponentBoardDiv = document.getElementById('opponentBoard');
    makeDroppable(document.documentElement);

    app = new Vue({
        el: '#app',
        data: {
            player: null,
            opponent: null,
            activePlayer: null,
            activeCard: null,
            targets: [],
        },
        methods: {
            endTurn: function () {
                this.activePlayer.onTurnEnd();
                this.activePlayer = this.getNonActivePlayer();
                this.activePlayer.onTurnStart();
            },
            minionAttack: function (target) {
                this.activeCard = new TargetObject(TARGET_OPTIONS.MINION_COMBAT, this.activePlayer.getMinion(target.dataset.id));
                this.targets = this.getNonActivePlayer().board.filter(minion => minion.taunt == true);
                if(!this.targets.length>0) {
                    this.targets = this.getNonActivePlayer().board.filter(minion => !minion.stealth);
                    this.targets.push(this.getNonActivePlayer());
                }
            },
            targetSelected: function (target) {
                let defender = this.targets.filter( x => x.id == target.dataset.id)[0];
                switch (this.activeCard.targetType){
                    case TARGET_OPTIONS.MINION_COMBAT:
                        defender.takeDamage(this.activeCard.minion.attack);
                        this.activeCard.minion.takeDamage(defender.attack);
                        this.activeCard.minion.numberOfAttacks -= 1;
                        break;
                    default:
                        this.activeCard.effect(defender);
                        break;
                }

                this.activeCard = null;
                this.targets = [];
            },
            getNonActivePlayer: function () {
                if (this.activePlayer == this.player) return this.opponent;
                else return this.player;
            },
            targetedEffectPlayed: function (targetOption, effect, card) {
                this.targets = [];
                function addEnemyMinions() {
                    app.getNonActivePlayer().board.forEach(minion => app.targets.push(minion));
                }
                function addFriendlyMinions() {
                    app.activePlayer.board.forEach(minion => app.targets.push(minion));
                }
                function addEnemyHero() {
                    app.targets.push(app.getNonActivePlayer());
                }
                function addFriendlyHero() {
                    app.targets.push(app.activePlayer);
                }
                switch (targetOption){
                    case TARGET_OPTIONS.ANY:
                        addEnemyHero();
                        addFriendlyHero();
                        addEnemyMinions();
                        addFriendlyMinions();
                        break;
                    case TARGET_OPTIONS.ENEMY:
                        addEnemyMinions();
                        addEnemyHero();
                        break;
                    case TARGET_OPTIONS.FRIENDLY:
                        addFriendlyMinions();
                        addFriendlyHero();
                        break;
                    case TARGET_OPTIONS.ENEMY_MINION:
                        addEnemyMinions();
                        break;
                    case TARGET_OPTIONS.FRIENDLY_MINION:
                        addFriendlyMinions();
                        break;
                    case TARGET_OPTIONS.ANY_MINION:
                        addFriendlyMinions();
                        addEnemyMinions();
                        break;
                }
                if(app.targets.length>0){
                    this.activeCard = new TargetObject(targetOption, effect);
                }else{
                    card.unplayable = true;
                }
            }
        },
        beforeMount() {
            this.player = new Player();
            this.activePlayer = this.player; //TODO random start
            this.opponent = new Player();
            initDeck(this.player.deck);
            initDeck(this.opponent.deck);
            this.player.drawCard(5);//TODO opening mulligan
            this.opponent.drawCard(5);
            this.player.onTurnStart();
        }
    });

    document.documentElement.on('click', '.ready', function (target) {
        app.minionAttack(target);
    });

    document.documentElement.on('click', '.targetable', function (target) {
        app.targetSelected(target);
    });
});

function initDeck(deck) {
    initCatalog();
    for(let i=0;i<30;i++){
        deck.push(catalog.pawn());
    }
}

function killMinion(minion) {
    minion.deathrattle();
    app.player.board = app.player.board.filter(function (min) {
        if(min == minion) app.player.deadMinions.push(minion);
        return min != minion;
    });
    app.opponent.board = app.opponent.board.filter(function (min) {
        if(min == minion) app.opponent.deadMinions.push(minion);
        return min != minion;
    });
}

function makeDroppable(element) {
    element.ondrop = drop;
    element.ondragover = allowDrop;
}

function disableDrop(element) {
    element.ondragover = null;
    element.ondrop = null;
}

function makeDragggable(element) {
    element.setAttribute('draggable', "true");
    element.ondragstart = drag;
}
function disableDrag(element) {
    if(element!=handDiv){
        element.setAttribute('draggable', "false");
        element.ondragstart = null;
    }
}

function allowDrop(ev) {
    if(!ev.target.classList.contains('hand')&&!ev.target.classList.contains('card')) ev.preventDefault();//specify dropable places
}

function drag(ev) {
    ev.dataTransfer.setData("id", ev.target.dataset.id);
}

function drop(ev) {
    let id = ev.dataTransfer.getData("id");
    let card = app.activePlayer.getCard(id);
    let activeBoard;
    if(app.activePlayer === app.player) activeBoard = document.getElementById('board');
    else activeBoard = opponentBoardDiv = document.getElementById('opponentBoard');
    Array.prototype.forEach.call(activeBoard.children, function(child, index){
        if(ev.x>child.offsetLeft) card.minionIndex = index+1;//if none default is 0 in card constructor
    });
    card.effect();
    if(!card.unplayable) { //unlayable gets set in effect
        app.activePlayer.mana -= card.cost;
        app.activePlayer.removeCard(id);
    }
}

function Player() {
    this.id = globalId++;
    this.health = 30;
    this.maxMana = 10;
    this.mana = 0;
    this.maxHandSize = 10;
    this.armor = 0;
    this.weapon = null;
    this.maxNumberOfAttacks = 1;
    this.numberOfAttacks = 1;
    this.taunt = false;
    this.attackable = true;
    this.targetable = true;
    this.attack = 0;
    this.deck = [];
    this.hand = [];
    this.board = [];
    this.deadMinions = [];
    this.playedCards = [];
    this.displayTargets = false;
    this.additionalTurnStartEffects = [];
    this.onTurnStart = function () {
        this.board.forEach(minion => {minion.summoningSickness = false;
            minion.numberOfAttacks = minion.maxNumberOfAttacks});
        this.drawCard(1);
        if(this.maxMana<10) this.maxMana++;
        this.mana = this.maxMana;
        this.board.forEach(minion => minion.onTurnStart());
        this.additionalTurnStartEffects.forEach(x => x());
    };
    this.onTurnEnd = function () {
        this.board.forEach(minion => minion.onTurnEnd())
    };
    this.takeDamage = function (amount) {
        this.health -= parseInt(amount);
        if(this.health<=0) console.log(this, "has lost");
    };
    this.drawCard = function (amount) {
        for(let i=0;i<amount;i++){
            let card = this.deck.pop();
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
    this.getMinion = function (id) {
        let result;
        this.board.forEach(function (minion) {
            if(parseInt(minion.id) == id) result = minion;
        });
        if(!result&&id===app.player.id) return app.player;
        else if(!result&&id===app.opponent.id) return app.opponent;
        else return result;
    };
    this.removeMinion = function (id) {
        this.board = this.board.filter(function (minion) {
            return minion.id != id;
        });
    };
    this.summonMinion = function (minion, index) {
        this.board.splice(index, 0, minion);
    };
    return this;
}

function Card(name, cost, effect, type) {
    this.name = name;
    this.cost = cost;
    this.effect = effect;
    this.type = type;
    this.unplayable = false;
    this.minionIndex = 0;
    this.id = globalId++;
}

function Minion(attack, health, id, options) {
    let self = this;
    this.attack = attack;
    this.health = health;
    this.maxNumberOfAttacks = 1;
    this.numberOfAttacks = 1;
    this.summoningSickness = true;
    this.taunt = false;
    this.stealth = false;
    this.attackable = true;
    this.targetable = true;
    this.id = id;
    this.turnStartEffects = [];
    this.turnEndEffects = [];
    this.getOwner = function () {
        if(app.player.getMinion(id)) return app.player;
        else return app.opponent;
    };
    this.onTurnStart = function () {
        this.turnStartEffects.forEach(x => x());
    };
    this.onTurnEnd = function () {
        this.turnEndEffects.forEach(x => x());
    };
    this.additionalDeathrattles = [];
    this.deathrattle = function () {
        this.additionalDeathrattles.forEach(x => x(self));
    };
    this.takeDamage = function (amount) {
        this.health -= amount;
        if(this.health<=0) killMinion(this);
    };

    if(options){
        Object.keys(options).forEach(function (key) {
            let value = options[key];
            console.log(key, value);
            if(key === "deathrattle"){
                self.additionalDeathrattles.push(options.deathrattle);
            }else{
                self[key] = options[key];
            }
        });
    }
    return this;
}

function TargetObject(targetType, secondArgument) {
    this.targetType = targetType;
    if(targetType==TARGET_OPTIONS.MINION_COMBAT) this.minion = secondArgument;
    else this.effect = secondArgument;
    return this;
}