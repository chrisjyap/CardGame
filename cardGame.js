/**
 * Created by Chris on 6/9/2015.
 */

function Game(){
    this.team1Score = 0;
    this.team2Score = 0;
    this.deck = new Deck();
    this.deck.shuffle();
    this.players = [new Person(1), new Person(2), new Person(3), new Person(4)];
}

Game.prototype.score = function(obj){
    if(obj.team === 1) this.team1Score += obj.points;
    else this.team2Score += obj.points;
};

Game.prototype.resetBoard = function(){
    var scores = document.querySelectorAll('p.score');
    for(var i = 0; i< this.players.length; i++){
        this.players[i].hand= [];
        this.players[i].score = 0;
        scores[i].innerHTML= 'Score: 0';
    }
    this.deck= new Deck();
    this.deck.shuffle();
};

Game.prototype.deal = function(){
    while(this.deck.cards.length > 0){
        this.players[0].hand.push(this.deck.cards[0]);
        this.players[1].hand.push(this.deck.cards[1]);
        this.players[2].hand.push(this.deck.cards[2]);
        this.players[3].hand.push(this.deck.cards[3]);
        this.deck.cards.splice(0 , 4);
    }

    for(var i = 0; i< 4; i ++){
        for(var j= 0; j< this.players[i].hand.length; j++)
            this.players[i].hand[j].id= j+1;
    }
    displayHand(this.players);
};

Game.prototype.biddingPhase= function(players){
    return new Promise(function(resolve, reject){
        var bidders = [players[0], players[1]];
        var temp = 1; //temp = temp ===0 ? 1: 0;
        var bid = {
            current: bidders[0].id,
            high: 0,
            head: 0
        };

        var buttonsBid = document.querySelectorAll('button.bid');
        for(var j = 0; j< buttonsBid.length; j++){
            (function(index) {
                buttonsBid[index].onclick= function() {
                    //console.log('curr: ', document.querySelector('div#player-' + (index + 1) + ' input').value);
                    var curr = Number(document.querySelector('div#player-' + (index + 1) + ' input').value);
                    if((bid.high >= curr && bidders[0].id !== bid.current) || bid.high> curr){
                        console.log('Number is equal or lower. You have been passed.');
                        if ((index + 1) === bidders[0].id) bidders.splice(0, 1);
                        else bidders.splice(1, 1);
                        temp++;
                        if(temp === 4) resolve(bid);
                        else {
                            bidders.push(players[temp]);
                            bid.current = bidders[1].id;
                        }
                    }
                    else {
                        bid.head = index + 1;
                        bid.high = curr;
                        bid.current = bid.current === bidders[0].id ? bidders[1].id : bidders[0].id;
                    }
                    disableButtons();
                    enableButton(bid.current);
                };
            })(j);
        }

        var buttonsPass = document.querySelectorAll('button.pass');
        for(var i = 0; i< buttonsPass.length; i++){
            (function(index) {
                buttonsPass[index].onclick = function(){
                    if((index+1) === bidders[0].id) bidders.splice(0, 1);
                    else bidders.splice(1,1);
                    temp++;
                    if(temp === 4) resolve(bid);
                    else {
                        bidders.push(players[temp]);
                        bid.current = bidders[1].id;
                        disableButtons();
                        enableButton(bid.current);
                    }
                };
            })(i);
        }
        disableButtons();
        enableButton(bid.current);
    });
};

Game.prototype.startGame = function(suit, bid, players){
    console.log('We about to start THIS');
    var counter = 1, bidHead = bid.head, start = bid.head, card;
    var roundHand= { hand: []}, winObj = {};
    var ulList = document.querySelectorAll('div.player div.hand-container');
    disableUL();
    enableUL(start);
    return new Promise(function (resolve, reject){
        for(var i = 0; i< ulList.length; i++){
            (function(index) {
                ulList[index].onclick =  function(event) {
                    if(ulList[index].className.indexOf("active") > -1){
                        console.log(event.target.innerHTML);
                        for(var i= 0; i<players[index].hand.length; i++){
                            if(players[index].hand[i].id === Number(event.target.classList[0])){
                                roundHand['hand'].push({
                                    player: index +1,
                                    card: players[index].hand[i]
                                });
                                card = players[index].hand[i];
                                if(counter === 1) roundHand['secondSuit'] = players[index].hand[i].getSuit();
                                players[index].hand.splice(i, 1);
                                (event.target).parentNode.removeChild(event.target);
                                break;
                            }
                        }
                        var ele = createElement('div', document.querySelector('div.game'), 'card');
                        displayCard(ele, card);
                        start++;
                        start = start === 5 ? 1 : start;
                        if(counter === 4){
                            winObj = calculatePoints(roundHand, suit);
                            players[winObj.player -1].score += winObj.points;
                            document.querySelector('div.game').innerHTML = '';
                            document.querySelector('div#player-'+ winObj.player + ' p.score').innerHTML= 'Score: ' + players[winObj.player -1].score;
                            counter =0;
                            start = winObj.player;
                            roundHand.hand = [];
                            roundHand.secondSuit = '';
                            if(players[0].hand.length === 0) {
                                disableUL();
                                var teamScore = players[bidHead-1].score;
                                teamScore += (bidHead-1) > 1 ? players[bidHead-3].score : players[bidHead+1].score;
                                console.log('Winner of round: ', teamScore);
                                resolve({
                                    'team': bidHead % 2 === 1 ? 1: 2,
                                    'points': teamScore >= bid.high ? 1: -1
                                });
                            }
                        }
                        counter++;
                        disableUL();
                        enableUL(start);
                    }
                };
            })(i);
        }
    });
};

Game.prototype.playerHands= function(){
    for(var i =0; i<4; i++){
        console.log(this.players[i].name + ': ');
        for(var j=0; j< this.players[i].hand.length; j++){
            console.log(this.players[i].hand[j].toString());
        }
    }
};

function createElement(elementType, parent, className, innerHTML, custom) {
    var element = document.createElement(elementType);
    if (parent) parent.appendChild(element);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    if (typeof custom !== 'undefined') {
        for (var prop in custom) {
            element.setAttribute(prop, custom[prop]);
        }
    }
    return element;
}

function disableButtons(){
    var bidButtons = document.querySelectorAll('button.bid');
    var passButtons = document.querySelectorAll('button.pass');
    var inputs = document.querySelectorAll('input');
    for(var i = 0; i <bidButtons.length; i++){
        bidButtons[i].disabled= true;
        passButtons[i].disabled= true;
        inputs[i].disabled= true;
    }
}

function enableButton(id){
    document.querySelector('div#player-' + id +' button.bid').disabled = false;
    document.querySelector('div#player-' + id +' button.pass').disabled = false;
    document.querySelector('div#player-' + id +' input').disabled = false;
}

function enableUL(id){
    document.querySelector('div#player-' + id +' div.hand-container').className = 'hand-container active';
    document.querySelector('div#player-' + id).style.border = '1px solid red';
}

function disableUL(){
    var ul = document.querySelectorAll('div.hand-container');
    var playersCon = document.querySelectorAll('div.player');
    for(var i = 0; i <ul.length; i++){
        ul[i].className= 'hand-container';
        if(typeof playersCon[i] !== 'undefined') playersCon[i].style.border = '1px solid black'
    }
}

function displayHand(players){
    var ele;
    for(var i = 0; i< 4; i ++){
        document.querySelector('div#player-' +(i+1) + ' p.name').innerHTML = players[i].name;
        for(var j= 0; j< players[i].hand.length; j++){
            ele = createElement('div', document.querySelector('div#player-' +(i+1) + ' div.hand-container'), (j+1) + ' card card-'+(j+1));
            displayCard(ele, players[i].hand[j]);
        }
    }
}

function calculatePoints(roundHand, suit){
    var priority = { 'Jack': 8, 9: 7, 'Ace': 6, 10: 5, 'King': 4, 'Queen': 3, 8: 2, 7: 1};
    var points = { 'Jack': 3, 9: 2, 'Ace': 1, 10: 1 };
    priority[suit] = 20;
    priority[roundHand.secondSuit] = 10;
    var high = 0, temp = 0;
    var winner = { 'player': 0, 'points': 0 };
    for(var i = 0; i< roundHand.hand.length; i++){
        console.log('suit, ', (roundHand.hand[i].card.getSuit() in priority ? priority[roundHand.hand[i].card.getSuit()]: 0),' value ,', priority[roundHand.hand[i].card.getValue()]);
        temp = (roundHand.hand[i].card.getSuit() in priority ? priority[roundHand.hand[i].card.getSuit()]: 0) + priority[roundHand.hand[i].card.getValue()];
        if(temp> high){
            winner['player'] = roundHand.hand[i].player;
            high = temp;
        }
        winner['points'] += (roundHand.hand[i].card.getValue() in points ? points[roundHand.hand[i].card.getValue()]: 0);
        console.log(roundHand.hand[i].card.toString());
    }
    return winner;
}

function hideEle(ele){
    if(ele.length> 1){
        for(var i = 0; i< ele.length; i++)
            ele[i].style.display='none';
    }
    else ele.style.display= 'none';
}

function showEle(ele){
    if(ele.length> 1){
        for(var i = 0; i< ele.length; i++)
            ele[i].style.display='inline';
    }
    else ele.style.display= 'inline';
}

function updateScore(game){
    var spans= document.querySelectorAll('div.scoreContainer span');
    spans[0].innerHTML = game.team1Score;
    spans[1].innerHTML = game.team2Score;
}

function displayCard(ele, card){
    var cardMap= {'Ace': 0, 7: 6, 8:7, 9:8, 10:9, 'Jack':10, 'Queen':11, 'King': 12};
    //console.log('value: ', card.getValue(), ' ', card.value);
    ele.style.backgroundPosition = (-500- (280.75 * cardMap[card.getValue()])) + 'px ' + (-1166 - (374.7 *card.suit) )+'px';
}

function Person(name){
    this.id= name;
    this.name = 'Player ' + name;
    this.hand = [];
    this.score = 0;
}

function Card(suit, val){
    this.suit= suit;
    this.value= val;
    this.id = 0;
}

Card.values = ['Ace', 7, 8, 9, 10, 'Jack', 'Queen', 'King'];
Card.suits = ['Clubs', 'Hearts', 'Spades', 'Diamonds'];
Card.prototype.toString= function(){ return Card.values[this.value]+ ' of ' + Card.suits[this.suit]; };
Card.prototype.getSuit = function(){ return Card.suits[this.suit] };
Card.prototype.getValue = function(){ return Card.values[this.value] };

function Deck(){
    var _deck = [];
    for(var i = 0; i<4; i++){
        for(var j = 0; j< 8; j++){
            _deck.push(new Card(i, j));
        }
    }
    Object.defineProperty(this, 'cards', {
        get: function(){
            return _deck;
        }
    });
}

Deck.prototype.toString = function(){
    return this.cards.map(function (card) {
        return card.toString();
    }).join(', ');
};

Deck.prototype.shuffle = function(){
    var randomIndex, temp;
    for(var i = 0; i< this.cards.length; i++){
        randomIndex = Math.floor(Math.random()* this.cards.length);
        temp = this.cards[i];
        this.cards[i]= this.cards[randomIndex];
        this.cards[randomIndex] = temp;
    }
};

/* Game start! */
document.addEventListener('DOMContentLoaded', function(){
    var game = new Game();
    gameLoop(game);

});

function gameLoop(game){
    game.deal();
    showEle(document.querySelectorAll('div.bidContainer'));
    hideEle(document.querySelector('div.power-suit'));
    var biddingPromise =game.biddingPhase(game.players);
    biddingPromise.then(function(data){
        disableButtons();
        hideEle(document.querySelectorAll('div.bidContainer'));
        showEle(document.querySelector('div.power-suit'));
        document.querySelector('div.power-suit span').innerHTML = 'Congratulations player ' + data.head + '. What is the power suit?';
        document.querySelector('button.suit').onclick = function(){
            var suit = document.querySelector('select').value;
            hideEle(document.querySelector('div.power-suit'));
            game.startGame(suit, data, game.players).then(function(data){
                disableUL();
                console.log('ROUND: ', data);
                game.score(data);
                updateScore(game);
                if(game.team1Score === 6 || game.team2Score=== 6){
                    console.log('Winner Winner chicken dinner!')
                }
                else{
                    game.resetBoard();
                    gameLoop(game);
                }
            });
        };
    });
}