function roller(diceRoll) {
    'use strict';
    //parse number
    var diceNum = diceRoll.charAt(0);
    if (typeof diceNum.charAt(1) === 'number') diceNum = diceNum + '' + diceRoll.charAt(1);
    //parse e
    var edge = diceRoll.charAt(diceRoll.length-1) === 'e';
    //contruct getRandomInteger
    var results = [];
    while (diceNum !== 0) {
        results.push(getRandomInteger(1,6));
        diceNum -= 1;
    }
    if (edge) {
        forEach(results, function(roll) {
            if (roll === 6) results.push(getRandomInteger(1,6));
        });
    }
    return results;
}