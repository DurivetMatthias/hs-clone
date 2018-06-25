let globalId = 0;
let handDiv;
let boardDiv;
let opponentHandDiv;
let opponentBoardDiv;
let app;

let catalog = {
    mindBlast: function () {
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
                app.activePlayer.summonMinion(new Minion(1,1, this.id));
            },
            "minion");
    },
    oracle: function () {
        return new Card("oracle",
            1,
            function(){
                app.activePlayer.summonMinion(new Minion(2,2, this.id));
            },
            "minion");
    },
    smite: function () {
        return new Card("smite",
            1,
            function(){
                app.targetedEffectPlayed(TARGET_OPTIONS.ANY, function (target) {
                    target.takeDamage(2);
                })
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
                })
            },
            "spell");
    }
};

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

function initDeck(deck) {
    deck.push(catalog.flameStrike());
    deck.push(catalog.smite());
    deck.push(catalog.whisp());
    deck.push(catalog.oracle());
    deck.push(catalog.mindControll());
}

function removeFromArray(a, x) {
    let i = a.indexOf(x);
    a.splice(i, 1);
}

document.addEventListener('DOMContentLoaded', function () {
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
                this.activePlayer = this.getNonActivePlayer();
                this.activePlayer.board.map(minion => {minion.summoningSickness = false;
                                                        minion.numberOfAttacks = minion.maxNumberOfAttacks});
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
            targetedEffectPlayed: function (targetOption, effect) {
                this.activeCard = new TargetObject(targetOption, effect);
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
            }
        },
        beforeMount() {
            this.player = new Player();
            this.activePlayer = this.player; //TODO random start
            this.opponent = new Player();
            this.player.drawCard(5);//TODO opening mulligan
            this.opponent.drawCard(5);
        }
    });

    document.documentElement.on('click', '.ready', function (target) {
        app.minionAttack(target);
    });

    document.documentElement.on('click', '.targetable', function (target) {
        app.targetSelected(target);
    });

    handDiv = document.getElementById('hand');
    boardDiv = document.getElementById('board');
    opponentHandDiv = document.getElementById('opponentHand');
    opponentBoardDiv = document.getElementById('opponentBoard');
    makeDroppable(document.documentElement);
});

function killMinion(minion) {
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
    if(!ev.target.classList.contains('hand')&&!ev.target.classList.contains('card')) ev.preventDefault();//specify dropable places
}

function drag(ev) {
    ev.dataTransfer.setData("id", ev.target.dataset.id);
}

function drop(ev) {
    let id = ev.dataTransfer.getData("id");
    let card = app.activePlayer.getCard(id);
    card.effect();
    app.activePlayer.removeCard(id);
}

function Player() {
    this.id = globalId++;
    this.health = 30;
    this.mana = 1;
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
        return result;
    };
    this.removeMinion = function (id) {
        this.board = this.board.filter(function (minion) {
            return minion.id != id;
        });
    };
    this.summonMinion = function (minion) {
        this.board.push(minion);
    };
    initDeck(this.deck);
    return this;
}

function Card(name, cost, effect, type) {
    this.name = name;
    this.cost = cost;
    this.effect = effect;
    this.type = type;
    this.id = globalId++;
}

function Minion(attack, health, id) {
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
    this.takeDamage = function (amount) {
        this.health -= amount;
        if(this.health<=0) killMinion(this);
    };
    return this;
}

function TargetObject(targetType, secondArgument) {
    this.targetType = targetType;
    if(targetType==TARGET_OPTIONS.MINION_COMBAT) this.minion = secondArgument;
    else this.effect = secondArgument;
    return this;
}