var monster = null, $monsterCell = null;
var pizza = null, $pizzaCell = null;
var player = null, $playerCell = null;

(function app(){
    console.log('script loaded');

    var $gameWindow = $('#game-window');
    var $gameRows = $gameWindow.find('tr');
    var arrowKeys = {left: 37, up: 38, right: 39, down: 40};
    var gameCells = new Array(10);
    var gameState = new Array(10);

    //HUD elements
    var $monsterHUD, $playerHUD;
    $monsterHUD = $('#monster');
    $playerHUD = $('#player');

    var $playerCurrentHP, $playerMaxHP, $playerXP, $playerLevel;
    $playerCurrentHP = $playerHUD.find('.hp').children('.current');
    $playerMaxHP = $playerHUD.find('.hp').children('.max');
    $playerXP = $playerHUD.find('.xp').children();
    $playerLevel = $playerHUD.find('.level').children();

    //set gamestates
    var gameOver = [['','','', '', '', '', '','','',''],
                    ['','','','G','A','M','E','','',''],
                    ['','','','O','V','E','R','','',''],
                    ['','','', '', '', '', '','','',''],
                    ['','','', '', '', '', '','','',''],
                    ['','','', '', '', '', '','','',''],
                    ['','','', '', '', '', '','','',''],
                    ['','','', '', '', '', '','','',''],
                    ['','','', '', '', '', '','','',''],
                    ['','','', '', '', '', '','','','']];

    //leveling data
    var xpArray =    [-10,  0, 10, 23, 38, 55, 70, 90, 150, 215, 340, 440];
    var maxHPArray = [999, 10, 15, 20, 27, 34, 52, 60,  69,  78,  87,  97];
    var attackArray = [99,  2,  2,  3,  4,  4,  6,  6,   7,   8,   9,  10];

    var Player = function () {
        this.stats = {
            'attack': 2,
            'maxHP': 10,
            'hp': 10,
            'xp': 0,
            'icon': '@',
            'type': 'player',
            'level': 1
        };
        this.pos = {
            'x': 0,
            'y': 0
        };
        this.turn = 1;
    };

    var Monster = function (type) {
        this.stats = {
            'type': null,
            'icon': null,
            'attack': 0,
            'hp': 0,
            'maxHP': 0,
            'facing': null,
            'los': [1,3],
            'xpVal': 0
        };
        this.pos = {
            'x': null,
            'y': null
        };
        this.turn = 1;
        this.seenPlayer = false;
        this.hasActed = false;
    };

    var Pizza = function (type) {
        this.stats = {
            'icon': 'o',
            'type': 'pizza',
            'attack': -8
        };
        this.pos = {
            'x': null,
            'y': null
        };
    };

    function initGameArrays() {
        var y, x, $el;
        for (y = 0; y < gameState.length; y += 1) {
            gameState[y] = ['.','.','.','.','.','.','.','.','.','.'];
        }
        for (y = 0; y < gameCells.length; y += 1) {
            gameCells[y] = new Array(10);
            for (x = 0; x < gameCells[y].length; x += 1) {
                gameCells[y][x] = $($gameRows[y]).children().eq(x);
            }
        }
    }

    //gameWindow drawing functions

    function drawIcon(icon) {
        gameCells[icon.pos.y][icon.pos.x].html(icon.stats.icon)
                                         .addClass(icon.stats.type);
    }

    //LoS code on hold
    /*
    function drawLoS(los, facing) {
        var losCells = [];
        var $monsterCell = $monsterCell;

        if (facing === 'W') {
            losCells.push($monsterCell.;
            if (monster.pos.y > 1) {
                losCells.push($monsterCell
            }
        }

        forEach(losCells, function(x) {
            x.addClass('line-of-sight');
        });
    }
    */

    function updateGameWindow(array) {
        var y, x;
        //populate table with non-actor cell contents
        for (y = 0; y < array.length; y += 1) {
            for (x = 0; x < array[y].length; x += 1) {
                gameCells[y][x].html(array[y][x]).removeClass();
            }
        }
        if (player) {
            if (monster) {
                drawIcon(monster);
            }
            if (pizza) {
                drawIcon(pizza);
            }
            drawIcon(player);
        }
        updateUI();
    }

    function updateUI () {
        if (!monster) {
            $monsterHUD.hide();
        } else {
            $monsterHUD.find('.hp').children().html(monster.stats.hp);
            $monsterHUD.show();
        }
        $playerCurrentHP.html(player.stats.hp);
        $playerMaxHP.html(player.stats.maxHP);
        $playerXP.html(Math.floor(player.stats.xp));
        $playerLevel.html(player.stats.level);
    }


    //AI Functions
    function generateMonster (type) {
        monster = new Monster();
        switch (type) {
            case 'goblin':
                monster.stats.attack = 1;
                monster.stats.facing = 'W';
                monster.stats.type = 'goblin';
                monster.stats.icon = 'g';
                monster.stats.hp = getRandomInteger(5,20);
                monster.stats.maxHP = monster.stats.hp;
                monster.stats.xpVal = 3 + (monster.stats.hp)/4;
                break;

            case 'troll':
                monster.stats.attack = getRandomInteger(0,1) ? 2 : 3;
                monster.stats.facing = 'W';
                monster.stats.type = 'troll';
                monster.stats.icon = 'T';
                monster.stats.hp = getRandomInteger(15,40);
                monster.stats.maxHP = monster.stats.hp;
                monster.stats.xpVal = 5 + (monster.stats.hp)/4;
                break;

        }

        //set monster position
        do {
            monster.pos.x = getRandomInteger(0,9);
            monster.pos.y = getRandomInteger(0,9);
            $monsterCell = gameCells[monster.pos.y][monster.pos.x];
        } while ($monsterCell.is($playerCell) || 
                (pizza && $monsterCell.is($pizzaCell)));
    }

    function generatePizza() {
        pizza = new Pizza();
        do {
            pizza.pos.x = getRandomInteger(0,9);
            pizza.pos.y = getRandomInteger(0,9);
            $pizzaCell = gameCells[pizza.pos.y][pizza.pos.x];
        } while ($pizzaCell.is($playerCell) || 
                 (monster && $pizzaCell.is($monsterCell)));
    }

    function checkAIState() {
        if (monster) {
            monster.hasActed = false;

            //is monster dead?
            if (monster.stats.hp <= 0) {
                player.stats.xp += monster.stats.xpVal;
                monster = null;
                return;
            }

            //does monster see player?
            if (checkLOS(player, monster)) {
                monster.seenPlayer = true;
                doAttack(player, monster);
                monster.hasActed = true;
            }

            //how does monster move?
            //if monster has not seen player, move randomly
            //if monster has seen player but not acted, monster move towards player
            if (!monster.hasActed) {
                if (monster.seenPlayer) {
                    monsterMove(player);
                    monster.hasActed = true;
                } else {
                    monsterMove();
                    monster.hasActed = true;
                }
            }
            $monsterCell = gameCells[monster.pos.y][monster.pos.x];

            //does monster see player now?
            if (checkLOS(player,monster)) {
                monster.seenPlayer = true;
            }

            monster.turn += 1;
        } 
        else if (player.turn % 5 === 0) {
            if (player.stats.level > 3 && getRandomInteger(0,1)) {

                generateMonster('troll');
            } else {
                generateMonster('goblin');
            }
        }
    }

    function monsterMove(playerObj) {
        var newX, newY, monsterX, monsterY, playerX, playerY;
        monsterX = monster.pos.x;
        monsterY = monster.pos.y;

        newX = monsterX;
        newY = monsterY;

        if (arguments[0]) {
            playerX = playerObj.pos.x;
            playerY = playerObj.pos.y;

            //movement relative to the player
            if (playerX === monsterX) {
                //player at Y axis
                newY = monsterY < playerY ? monsterY + 1 : monsterY - 1;
            } else if (playerY === monsterY) {
                //player at X axis
                newX = monsterX < playerX ? monsterX + 1 : monsterX - 1;
            } else {
                //player diagonal
                if (monsterX < playerX && monsterY < playerY) {
                    //quadrant 1
                    if (getRandomInteger(0,1)) newX = monsterX + 1;
                    else newY = monsterY + 1;
                } else if (monsterX < playerX && monsterY > playerY) {
                    //quadrant 2
                    if (getRandomInteger(0,1)) newX = monsterX + 1;
                    else newY = monsterY - 1;
                } else if (monsterX > playerX && monsterY > playerY) {
                    //quadrant 3
                    if (getRandomInteger(0,1)) newX = monsterX - 1;
                    else newY = monsterY - 1;
                } else {
                    //quadrant 4
                    if (getRandomInteger(0,1)) newX = monsterX - 1;
                    else newY = monsterY + 1;
                }
            }
        } else {
            //randomized movement
            do {
                newX = monsterX;
                newY = monsterY;
                if (getRandomInteger(0,1)) {
                    newX = getRandomInteger(0,1) ? monsterX + 1 : monsterX - 1;
                } else {
                    newY = getRandomInteger(0,1) ? monsterY + 1 : monsterY - 1;
                } 
            } while (!((newX >= 0 && newX <= 9) && (newY >= 0 && newY <= 9)));
        }

        if (gameCells[newY][newX].is($pizzaCell)) {
            pizza = null;
        }
        monster.pos.y = newY;
        monster.pos.x = newX;
    }

    //Player Functions
    function playerAction(event) {
        if (player) {
            switch (event.which) {
                case arrowKeys.left:
                    playerMove(-1, 0);
                    break;
                case arrowKeys.right:
                    playerMove(1, 0);
                    break;
                case arrowKeys.up:
                    playerMove(0, -1);
                    break;
                case arrowKeys.down:
                    playerMove(0, 1);
                    break;
            }
            $playerCell = gameCells[player.pos.y][player.pos.x];
            player.turn += 1;

            //begin AI checks
            checkAIState();
            if (!pizza && player.turn % 10 === 0) {
                generatePizza();
            }

            //check player level
            checkPlayerLevel();

            //gameover check
            if (player.stats.hp <= 0) {
                updateUI();
                player = null;
                monster = null;
                pizza = null;
                updateGameWindow(gameOver);
            } else {
                updateGameWindow(gameState);
                updateUI();
            }
        }
    }

    function playerMove(x,y) {
        var newX = player.pos.x + x;
        var newY = player.pos.y + y;

        //check if monster present in new square
        if (monster && (newX === monster.pos.x && newY === monster.pos.y)) {
                doAttack(monster, player);
                return;
        }

        //check if pizza is present in new square
        if (pizza && (newX === pizza.pos.x && newY === pizza.pos.y)) {
            doAttack(player, pizza);
            pizza = null;
        }

        //move player
        if (newX >= 0 && newX <= ($($gameRows[0]).children().length - 1)) {
            player.pos.x = newX;
        }
        if (newY >= 0 && (newY <= ($gameRows.length - 1))) {
            player.pos.y = newY;
        }
    }

    function createNewPlayer() {
        player = new Player();
    }

    function checkPlayerLevel() {
        var i;
        if (player.stats.xp >= xpArray[player.stats.level + 1]) {
            player.stats.level += 1;
            player.stats.maxHP = maxHPArray[player.stats.level];
            player.stats.attack = attackArray[player.stats.level];
            console.log(player.stats.level + ' ' + maxHPArray[player.stats.level]);
            console.log('lvlup lvl: ' + player.stats.level + ' atk: ' + player.stats.attack + ' hp: ' + player.stats.maxHP);
        }
    }

    //Generic action functions
    function doAttack(target, attacker) {
        var newHP = target.stats.hp - attacker.stats.attack;
        if (newHP <= target.stats.maxHP) {
            target.stats.hp = newHP;
        } else {
            target.stats.hp = target.stats.maxHP;
        }
    }

    function checkLOS(target, attacker) {
        var targetCell = gameCells[target.pos.y][target.pos.x];
        //check right
        if (gameCells[attacker.pos.y][attacker.pos.x - 1] && gameCells[attacker.pos.y][attacker.pos.x - 1].is(targetCell)) {
            return true;
        }
        //check left
        else if (gameCells[attacker.pos.y][attacker.pos.x + 1] && gameCells[attacker.pos.y][attacker.pos.x + 1].is(targetCell)) {
            return true;
        }
        //check up
        else if (gameCells[attacker.pos.y - 1] && gameCells[attacker.pos.y - 1][attacker.pos.x].is(targetCell)) {
            return true;
        }
        //check down
        else if (gameCells[attacker.pos.y + 1] && gameCells[attacker.pos.y + 1][attacker.pos.x].is(targetCell)) {
            return true;
        }
        return false;
    }


    //Utilities
    function forEach(array, func) {
        var i;
        for (i = 0; i < array.length; i += 1) {
            func(array[i]);
        }
    }

    function getRandomInteger(min, max) {
        return Math.floor(Math.random() * (max-min + 1) + min);
    }

    function coinFlip(thing1, thing2) {
        return getRandomInteger(0,1) ? thing1 : thing2;
    }

    $(document).ready(function() {
        initGameArrays();
        createNewPlayer();
        console.log('lvlup lvl: ' + player.stats.level + ' atk: ' + player.stats.attack + ' hp: ' + player.stats.maxHP);
        updateGameWindow(gameState);

        $(document).on('keydown', playerAction);
    });

})();