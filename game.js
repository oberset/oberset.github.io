let currentGame = {
    numbers: []
}

function saveGame(name = 'default') {
    addValue(`game-${name}`, currentGame);
}

function removeGame(name = 'default') {
    clearValue(`game-${name}`);
}

function loadGame(name = 'default') {
    const game = getValue(`game-${name}`);
    if (game) {
        currentGame = game;
    }
}

function addNumber(number) {
    currentGame.numbers.unshift(number);
    emit('add_number');
}

function deleteLastNumber() {
    emit('delete_number');

    currentGame.numbers.shift();
    const list = currentGame.numbers.reverse();
    currentGame.numbers = [];

    addNumbers(list);
}

function addNumbers(list) {
    const next = (items) => {
        if (!items.length) {
            return;
        }
        const [current, ...others] = items;
        setTimeout(() => {
            addNumber(current);
            next(others);
        }, 50);
    };

    next(list);
}

function deleteLast() {
    currentGame.numbers.shift();
}

function getNumberInfo(number) {
    return NUMBER_INFO.get(number);
}

function getNumbers(inParts) {
    if (inParts) {
        const parts = [];
        const len = currentGame.numbers.length;

        for (let i = 0; i < len; i += inParts) {
            parts.push(currentGame.numbers.slice(i, i + inParts));
        }

        return parts.map((part) => part.map((number) => NUMBER_INFO.get(number)));
    }
    return currentGame.numbers.map((number) => NUMBER_INFO.get(number));
}

function startGame(numbers = []) {
    addNumbers(numbers);
}
