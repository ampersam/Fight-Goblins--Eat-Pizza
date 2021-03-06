var monster = null, $monsterCell = null;
var pizza = null, $pizzaCell = null;
var player = null, $playerCell = null;

(function (){
    console.log('script loaded');

    var options = {
        'controls': {
            'left': 37, 
            'up': 38, 
            'right': 39, 
            'down': 40,
            'wait': 91
        },
        'gameWindow': {
            'height': 15,
            'width': 30
        }
    };

    var $gameRows;
    var $gameWindow = $('#game-window');
    var controls = {left: 37, up: 38, right: 39, down: 40};
    var gameCells = new Array(options.gameWindow.height);
    var gameState = new Array(options.gameWindow.height);
    var roomMap = [];

    //HUD elements
    var $monsterHUD, $playerHUD;
    $monsterHUD = $('#monster');
    $playerHUD = $('#interface');

    var $playerCurrentHP, $playerMaxHP, $playerXP, $playerLevel;
    $playerCurrentHP = $playerHUD.find('.hp').children('.current');
    $playerMaxHP = $playerHUD.find('.hp').children('.max');
    // $playerMaxHP = $($playerHUD + ' .hp .max');
    $playerXP = $playerHUD.find('.xp').children();
    $playerLevel = $playerHUD.find('.level').children();



    //leveling data
                    //   X   1   2   3   4   5   6   7    8    9   10   11
    var xpArray     = [-10,  0, 10, 23, 38, 55, 70, 90, 150, 215, 340, 440];
    var maxHPArray  = [999, 10, 15, 20, 27, 34, 52, 60,  69,  78,  87,  97];
    var attackArray = [ 99,  2,  2,  3,  4,  4,  6,  6,   7,   8,   9,  10];

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

    var Monster = function () {
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

    var Room = function (w,h,originX,originY) {
        this.dim = {
            'w': w,
            'h': h
        };
        this.origin = {
            'x': originX,
            'y': originY
        };
    };


    //Initialization functions
    function initGameArrays() {
        var y, x, $el;
        for (y = 0; y < gameState.length; y += 1) {
            gameState[y] = [];
            for (x = 0; x < options.gameWindow.width; x += 1) {
                gameState[y][x] = '.';
            }
        }
        createMap(5);
        for (y = 0; y < gameCells.length; y += 1) {
            gameCells[y] = new Array(options.gameWindow.width);
            for (x = 0; x < gameCells[y].length; x += 1) {
                gameCells[y][x] = $($gameRows[y]).children().eq(x);
            }
        }
    }


    function prepTableEl(options) {
        var i, j;
        for (i = 0; i <= options.gameWindow.height-1; i += 1) {
            $gameWindow.append('<tr></tr>');
        }
        $gameWindow.find('tr').each(function() {
            for (j = 0; j < options.gameWindow.width; j += 1) {
                $(this).append('<td></td>');
            }
        });
    }

    //gameWindow drawing functions
    function drawIcon(icon) {
        console.log(icon.stats.icon + ": " + icon.pos.x + " " + icon.pos.y);
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

    function updateGameWindow(state) {
        var y, x;
        //populate table with non-actor cell contents
        saveMap();
        for (y = 0; y < state.length; y += 1) {
            for (x = 0; x < state[y].length; x += 1) {
                gameCells[y][x].html(state[y][x]).removeClass();
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
        $playerCurrentHP.html(player.stats.hp);
        $playerMaxHP.html(player.stats.maxHP);
        $playerXP.html(Math.floor(player.stats.xp));
        $playerLevel.html(player.stats.level);
    }


    function freshBoot() {
        $('#title-card').toggle();
        $gameWindow.toggle();
        $playerHUD.toggle();
        $monsterHUD.toggle();
        if (!player) createNewPlayer();
        else {
            player = null;
            monster = null;
            pizza = null;
            $(document).unbind('keydown');
        }
    }


    //Map Creation
    function createMap(rooms) {
        var roomCount = 1;
        while (roomCount <= rooms) {
            if (createRoom(getRandomInteger(4,9), getRandomInteger(4,9), roomCount)) roomCount += 1;
        }
    }


    function createRoom(w,h,counter) {
        var i = 0;
        var roomOrigin = [getRandomInteger(0, options.gameWindow.width), getRandomInteger(0, options.gameWindow.height)];
        var originX = roomOrigin[0];
        var originY = roomOrigin[1];
        console.log('premod room stats: (' + originX + ', ' + originY + ') -- ' + w + 'x' + h);

        //if room collides with a boundary let it partially draw
        if (originX + w > options.gameWindow.width) {
            w = options.gameWindow.width - originX;
        }
        if (originY + h > options.gameWindow.height) {
            h = options.gameWindow.height - originY;
        }
        console.log('postmod room stats: (' + originX + ', ' + originY + ') -- ' + w + 'x' + h);

        //if room collides with another generated room let it partially draw
        if (roomMap.length > 1) {
            for (i = 1; i < roomMap.length; i += 1) {
                var roomTop, roomBottom, roomLeft, roomRight, newRoomTop, newRoomBottom, newRoomRight, newRoomLeft;
                roomTop = roomMap[i].origin.y;
                roomBottom = roomMap[i].origin.y + roomMap[i].dim.h - 1;
                roomLeft = roomMap[i].origin.x;
                roomRight = roomMap[i].origin.x + roomMap[i].dim.w - 1;
                newRoomTop = originY;
                newRoomBottom = originY + h - 1; 
                newRoomLeft = originX;
                newRoomRight = originX + w - 1;
                if (!(newRoomTop > roomBottom) && !(newRoomBottom < roomTop) &&
                     !(newRoomRight < roomLeft) && !(newRoomLeft > roomRight)) {
                    console.log('failed: overlap');
                    return false;
                }
            }
        }


        //room-too-small check
        if (w < 3 || h < 3) {
            console.log('failed: too small');
            return false;
        }

        roomMap[counter] = new Room(w,h,originX,originY);
        return true;
    }

    function saveRoom(roomObj) {
        var i = 0;

        //draw room's horizontal walls
        while (i != roomObj.dim.w) {
            gameState[roomObj.origin.y][roomObj.origin.x + i] = '#';
            gameState[roomObj.origin.y + (roomObj.dim.h - 1)][roomObj.origin.x + i] = '#';
            i += 1;
        }
        i = 1;
        //draw room's vertical walls
        while (i != roomObj.dim.h-1) {
            gameState[roomObj.origin.y + i][roomObj.origin.x] = '#';
            gameState[roomObj.origin.y + i][roomObj.origin.x + (roomObj.dim.w - 1)] = '#';
            i += 1;
        }
    }

    function saveMap(){
        var i;
        for (i = 1; i < roomMap.length; i+=1) {
            console.log(roomMap);
            saveRoom(roomMap[i]);
        }
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
            monster.pos.x = getRandomInteger(0,options.gameWindow.width-1);
            monster.pos.y = getRandomInteger(0,options.gameWindow.height-1);
            $monsterCell = gameCells[monster.pos.y][monster.pos.x];
        } while ($monsterCell.is($playerCell) || 
                (pizza && $monsterCell.is($pizzaCell)));
    }

    function generatePizza() {
        pizza = new Pizza();
        do {
            pizza.pos.x = getRandomInteger(0,options.gameWindow.width-1);
            pizza.pos.y = getRandomInteger(0,options.gameWindow.height-1);
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
            //can the monster attack?
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

            //does monster see player post-move?
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
            } while (!((newX >= 0 && newX <= options.gameWindow.width-1) && (newY >= 0 && newY <= options.gameWindow.height-1)));
        }

        if (gameCells[newY][newX].is($pizzaCell)) {
            doAttack(monster,pizza);
            pizza = null;
        }
        monster.pos.y = newY;
        monster.pos.x = newX;
    }

    //Player Functions
    function playerAction(event) {
        if (player) {
            switch (event.which) {
                case options.controls.left:
                    event.preventDefault();
                    playerMove(-1, 0);
                    break;
                case options.controls.right:
                    event.preventDefault();
                    playerMove(1, 0);
                    break;
                case options.controls.up:
                    event.preventDefault();
                    playerMove(0, -1);
                    break;
                case options.controls.down:
                    event.preventDefault();
                    playerMove(0, 1);
                    break;
                case options.controls.wait:
                    event.preventDefault();
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

            //gameOver check
            if (player.stats.hp <= 0) {
                updateUI();
                freshBoot();
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
        if (newX >= 0 && newX <= (options.gameWindow.width - 1)) {
            player.pos.x = newX;
        }
        if (newY >= 0 && newY <= (options.gameWindow.height - 1)) {
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



    $(document).ready(function() {
        prepTableEl(options);
        $gameRows = $gameWindow.find('tr');
        initGameArrays();

        $('#play-button').on('click', function(e) {
            e.preventDefault();
            freshBoot();
            console.log('lvlup lvl: ' + player.stats.level + ' atk: ' + player.stats.attack + ' hp: ' + player.stats.maxHP);
            updateGameWindow(gameState);
            $(document).on('keydown', playerAction);
        });


    });

})();