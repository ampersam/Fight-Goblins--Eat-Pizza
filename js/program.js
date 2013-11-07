var monsterList = [];
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
            'wait': 190
        },
        'gameWindow': {
            'height': 15,
            'width': 30
        }
    };

    var $gameRows;
    var $gameWindow = $('#game-window');
    var controls = {left: 37, up: 38, right: 39, down: 40, wait: 190};
    var gameCells = new Array(options.gameWindow.height);
    var gameState = new Array(options.gameWindow.height);
    var roomMap = [];

    //HUD elements
    var $playerHUD;
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
        this.monsterID = null;
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

        //create the matrix of jquery objects representing each cell in the grid
        for (y = 0; y < gameCells.length; y += 1) {
            gameCells[y] = new Array(options.gameWindow.width);
            for (x = 0; x < gameCells[y].length; x += 1) {
                gameCells[y][x] = $($gameRows[y]).children().eq(x);
            }
        }

        //init the gameState from which all game data is created, modified, and create
        for (y = 0; y < gameState.length; y += 1) {
            gameState[y] = [];
            for (x = 0; x < options.gameWindow.width; x += 1) {
                gameState[y][x] = '&#183;';
                gameCells[y][x].addClass('green-' + getRandomInteger(1,3));
            }
        }

        //roomMap creation (still in beta)
        createMap(5);


    }

    function createGameWindowEl (options) {
        var _rowI, _cellI, _$row;
        $gameWindow = $('#game-window');
        for (_rowI = 0; _rowI < options.gameWindow.height; _rowI += 1) {
            _$row = $(document.createElement('div')).addClass('row');
            for (_cellI = 0; _cellI < options.gameWindow.width; _cellI += 1) {
                _$row.append(document.createElement('span'));
            }
            $gameWindow.append(_$row);
        }
    }

    //gameWindow drawing functions
    function drawIcon(icon) {
        gameCells[icon.pos.y][icon.pos.x].html(icon.stats.icon)
                                         .addClass(icon.stats.type);
    }

    function updateGameWindow(state) {
        var y, x, currentBlock;

        //populate table with non-actor cell contents
        saveMap();  //bind the roomMap to the gameState
        for (y = 0; y < state.length; y += 1) {
            for (x = 0; x < state[y].length; x += 1) {
                currentBlock = state[y][x];
                if (currentBlock !=='.') {
                    gameCells[y][x].html(currentBlock);
                }

                //content-based cell coloring for non-icons
                if (currentBlock === '#') {
                    gameCells[y][x].addClass('wall');
                }
                else if (currentBlock === '\+') {
                    gameCells[y][x].addClass('black');
                }

            }
        }

        //icon drawing
        if (player) {

            if (monsterList.length) {
                forEach(monsterList, drawIcon);
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
        if (!player) createNewPlayer();
        else {
            player = null;
            monsterList = [];
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
        // console.log('premod room stats: (' + originX + ', ' + originY + ') -- ' + w + 'x' + h);

        //if room collides with a boundary let it partially draw
        if (originX + w > options.gameWindow.width) {
            w = options.gameWindow.width - originX;
        }
        if (originY + h > options.gameWindow.height) {
            h = options.gameWindow.height - originY;
        }
        // console.log('postmod room stats: (' + originX + ', ' + originY + ') -- ' + w + 'x' + h);

        //if room collides with another generated room let it partially draw
        //placeholder room is inflated to prevent the creation of blocked squares
        var tempRoom = new Room(w+2,h+2,originX-1,originY-1);
        for (i = 1; i < roomMap.length; i += 1) {
            if (checkOverlap(tempRoom, roomMap)) {
                console.log('room overlap');
                return false;
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

        //fill in obstructed tiles inside walls with '+'
        fillInRoom(roomObj);
    }

    function fillInRoom (roomObj) {
        var _row, _cell;
        for (_row = roomObj.origin.y + 1; _row < (roomObj.origin.y + roomObj.dim.h - 1); _row += 1 ) {
            for (_cell = roomObj.origin.x + 1; _cell < (roomObj.origin.x + roomObj.dim.w - 1); _cell += 1) {
                gameState[_row][_cell] = '\+';
            }
        }
    }

    function saveMap(){
        var i;
        for (i = 1; i < roomMap.length; i+=1) {
            saveRoom(roomMap[i]);
        }
    }


    //AI Functions
    function generateMonster () {
        var monster = new Monster();
        var type;

        // TODO rewrite generation selection
       if (player.turn % 5 === 0) {
            if (player.stats.level > 3 && getRandomInteger(0,1)) {
                type = 'troll';
            } else {
                type = 'goblin';
            }
        } else {
            type = null;
        }

        switch (type) {
            case 'goblin':
                monster.stats.attack = 1;
                monster.stats.type = 'goblin';
                monster.stats.icon = 'g';
                monster.stats.hp = getRandomInteger(5,20);
                monster.stats.xpVal = 3 + (monster.stats.hp)/4;
                break;

            case 'troll':
                monster.stats.attack = getRandomInteger(0,1) ? 2 : 3;
                monster.stats.type = 'troll';
                monster.stats.icon = 'T';
                monster.stats.hp = getRandomInteger(15,40);

                monster.stats.xpVal = 5 + (monster.stats.hp)/4;
                break;
            default:
                return;
        }
        //universals
        monster.stats.maxHP = monster.stats.hp;
        monster.monsterID = monsterList.length;

        //set monster position
        do {
            monster.pos.x = getRandomInteger(0,options.gameWindow.width-1);
            monster.pos.y = getRandomInteger(0,options.gameWindow.height-1);
        } while (
                    checkOverlap(monster, player) || 
                    (pizza && checkOverlap(pizza, monster)) ||
                    checkOverlap(monster, roomMap) ||
                    (monsterList.length && checkOverlap(monster, monsterList))
                );

        //add monster to the array of monsters
        monsterList.push(monster);
    }

    function generatePizza() {
        pizza = new Pizza();
        do {
            pizza.pos.x = getRandomInteger(0,options.gameWindow.width-1);
            pizza.pos.y = getRandomInteger(0,options.gameWindow.height-1);
            $pizzaCell = gameCells[pizza.pos.y][pizza.pos.x];
        } while (
                    checkOverlap(pizza, player) || 
                    (monsterList.length && checkOverlap(pizza, monsterList)) ||
                    checkOverlap(pizza, roomMap)
                );
    }

    function checkMonsterState(monster) {
        monster.hasActed = false;

        //is monster dead?
        if (monster.stats.hp <= 0) {
            player.stats.xp += monster.stats.xpVal;
            gameCells[monster.pos.y][monster.pos.x].removeClass(monster.stats.type)
                .addClass(monster.stats.type + '-blood');
            return false;
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
                while (!monsterMove(monster, player));
                monster.hasActed = true;
            } else {
                while (!monsterMove(monster));
                monster.hasActed = true;
            }
        }

        //does monster see player post-move?
        if (checkLOS(player,monster)) {
            monster.seenPlayer = true;
        }

        monster.turn += 1;
        return true;
    }

    function monsterMash () {
        var _id;

        //check if the monster printer is ready
        generateMonster();

        for (_id = 0; _id < monsterList.length; _id += 1) {
            if (monsterList[_id]) {

                //run checkMonsterState for each monster and let it act
                //if checkMonsterState returns false, monster has died and should be deleted :(
                if (!checkMonsterState(monsterList[_id])) {
                    delete monsterList[_id];
                }

            }
        }
    }


    // TODO figure out how to have monsters move responsively to each other lol
    function monsterMove(monster, playerObj) {
        var monsterX, monsterY, playerX, playerY;
        var newPos = {'pos':{}};
        monsterX = monster.pos.x;
        monsterY = monster.pos.y;

        newPos.pos.x = monsterX;
        newPos.pos.y = monsterY;

        if (arguments[1]) {
            playerX = playerObj.pos.x;
            playerY = playerObj.pos.y;

            //movement relative to the player
            if (playerX === monsterX) {
                //player at Y axis
                newPos.pos.y = monsterY < playerY ? monsterY + 1 : monsterY - 1;
            } else if (playerY === monsterY) {
                //player at X axis
                newPos.pos.x = monsterX < playerX ? monsterX + 1 : monsterX - 1;
            } else {
                //player diagonal
                if (monsterX < playerX && monsterY < playerY) {
                    //quadrant 1
                    if (getRandomInteger(0,1)) newPos.pos.x = monsterX + 1;
                    else newPos.pos.y = monsterY + 1;
                } else if (monsterX < playerX && monsterY > playerY) {
                    //quadrant 2
                    if (getRandomInteger(0,1)) newPos.pos.x = monsterX + 1;
                    else newPos.pos.y = monsterY - 1;
                } else if (monsterX > playerX && monsterY > playerY) {
                    //quadrant 3
                    if (getRandomInteger(0,1)) newPos.pos.x = monsterX - 1;
                    else newPos.pos.y = monsterY - 1;
                } else {
                    //quadrant 4
                    if (getRandomInteger(0,1)) newPos.pos.x = monsterX - 1;
                    else newPos.pos.y = monsterY + 1;
                }

                //did player move around a corner? find the movement that doesn't involve cutting the corner
                if (checkOverlap(newPos, roomMap)) {
                    return false;
                }

                //did another monster move into that space first?
                if (checkOverlap(newPos, monsterList)) {
                    return true;
                }
            }
        } else {
            //randomized movement
            do {
                newPos.pos.x = monsterX;
                newPos.pos.y = monsterY;
                if (getRandomInteger(0,1)) {
                    newPos.pos.x = getRandomInteger(0,1) ? monsterX + 1 : monsterX - 1;
                } else {
                    newPos.pos.y = getRandomInteger(0,1) ? monsterY + 1 : monsterY - 1;
                } 
            } while (
                !(
                    (newPos.pos.x >= 0 && newPos.pos.x <= options.gameWindow.width-1) && 
                    (newPos.pos.y >= 0 && newPos.pos.y <= options.gameWindow.height-1)
                ) || 
                checkOverlap(newPos, roomMap) ||
                checkOverlap(newPos, monsterList)
            );
        }

        if (pizza && gameCells[newPos.pos.y][newPos.pos.x].is($pizzaCell)) {
            doAttack(monster,pizza);
            pizza = null;
        }

        //hacky removeClass at the moment
        gameCells[monster.pos.y][monster.pos.x].removeClass(monster.stats.type);

        monster.pos.y = newPos.pos.y;
        monster.pos.x = newPos.pos.x;
        return true;
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
                default:
                    return;
            }
            $playerCell = gameCells[player.pos.y][player.pos.x];
            player.turn += 1;

            //begin AI checks
            monsterMash();

            if (!pizza && player.turn % 10 === 0) {
                generatePizza();
            }

            //check player level
            checkPlayerLevel();

            //gameOver check
            if (player.stats.hp <= 0) {
                updateUI();
                gameCells[player.pos.y][player.pos.x].removeClass('player');
                freshBoot();
            } else {
                updateGameWindow(gameState);
                updateUI();
            }
        }
    }

    function playerMove(x,y) {
        var roomI;
        var newPos = {
            'pos': {
                'x': null, 
                'y': null
            }
        };
        newPos.pos.x = player.pos.x + x;
        newPos.pos.y = player.pos.y + y;


        //check if monster present in new square
        if (monsterList.length) {
            forEach(monsterList, function (monster) {
                if (checkOverlap(monster,newPos)) {
                    doAttack(monster, player);
                    return;
                }
            });
        }

        //check if pizza is present in new square
        if (pizza && checkOverlap(pizza, newPos)) {
            doAttack(player, pizza);
            gameCells[pizza.pos.y][pizza.pos.x].removeClass('pizza')
                .addClass('pizza-blood');
            pizza = null;
        }

        //check if there's a wall present
        if (checkOverlap(newPos, roomMap)) {
            return;
        }

        //hacky solution to removeClass as player moves
        gameCells[player.pos.y][player.pos.x].removeClass('player');

        //move player
        if (newPos.pos.x >= 0 && newPos.pos.x <= (options.gameWindow.width - 1)) {
            player.pos.x = newPos.pos.x;
        }
        if (newPos.pos.y >= 0 && newPos.pos.y <= (options.gameWindow.height - 1)) {
            player.pos.y = newPos.pos.y;
        }
    }

    function createNewPlayer() {
        player = new Player();
        player.pos.x = getRandomInteger(0, options.gameWindow.width - 1);
        player.pos.y = getRandomInteger(0, options.gameWindow.height - 1);
        while (checkOverlap(player, roomMap)) {
            player.pos.x = getRandomInteger(0, options.gameWindow.width - 1);
            player.pos.y = getRandomInteger(0, options.gameWindow.height - 1);
        }
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


    function checkOverlap(object1, object2) {
        var _arrayofObjs, _icon, _i, _overlap;
        if (arguments[0] instanceof Array || arguments[1] instanceof Array) {
            for (_i = 0; _i < arguments.length; _i += 1) {
                arguments[_i] instanceof Array ? _arrayofObjs = arguments[_i] : _icon = arguments[_i];
            }
            for (_i = 1; _i < _arrayofObjs.length; _i += 1) {
                if (checkOverlap(_icon, _arrayofObjs[_i])) {
                    return true;
                }
            }
        } else {
            object1 = getDimensions(object1);
            object2 = getDimensions(object2);

            if ((object1.left > object2.right) || (object1.right < object2.left) ||
                     (object1.top > object2.bottom) || (object1.bottom < object2.top)) {
                return false;
            } else {
                return true;
            }
        }
    }

    function getDimensions(object) {
        var results = {
            'top': null,
            'bottom': null,
            'right': null,
            'left': null
        };
        if (object.pos) {
            results.top = object.pos.y;
            results.bottom = object.pos.y;
            results.left = object.pos.x;
            results.right = object.pos.x;
        } 
        else if (object.origin) {
            results.top = object.origin.y;
            results.bottom = object.origin.y + object.dim.h - 1;
            results.left = object.origin.x;
            results.right = object.origin.x + object.dim.w - 1;
        } 
        return results;
    }



    $(document).ready(function() {
        createGameWindowEl(options);
        $gameRows = $gameWindow.find('.row');
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