/*function lineStrategy() {
    const lineStructure = new Line('.strategy-line');

    addEventListener('add_number', () => {
        calcLineStrategyScore(lineStructure, 'red', currentGame.numbers.length <= 1);
    });
}*/

/*function parityStrategy() {
    const lineStructure = new Line('.strategy-parity');

    addEventListener('add_number', () => {
        calcLineStrategyScore(lineStructure, 'odd', currentGame.numbers.length <= 1);
    });
}*/

/*function bigNumbersStrategy() {
    const lineStructure = new Line('.strategy-big-numbers');

    addEventListener('add_number', () => {
        calcLineStrategyScore(lineStructure, 'big', currentGame.numbers.length <= 1);
    });
}*/

function repeatsStrategy() {
    const lineStructure = new Line('.strategy-repeats');

    addEventListener('add_number', () => {
        calsRepeats(lineStructure, currentGame.numbers.length <= 1);
    });

    addEventListener('delete_number', () => {
        const group = lineStructure.getFirstItemsGroupElement();
        const items = lineStructure.getItemsElement(group);
        const element = lineStructure.getFirstItemElement(items);

        if (currentGame.numbers.length > 1) {
            items.removeChild(element);
        } else {
            const empty = createItem(element, '');
            element.classList.add('neutral');
            element.style.width = `0px`;

            lineStructure.updateItems(items, empty);
        }
    });
}

function lastNumbersStrategy() {
    const lineStructure = new Line('.strategy-last-numbers');
    const numbersPositionStructure = new Line('.numbers-position');
    const gameRoundsStructure = new Line('.game-rounds-count');
    const winAttemptsStructure = new Line('.win-attempts');

    const service = new Bets();

    const button = document.querySelector('.start-game');
    const buttonEventListener = () => {
        service.start();
        button.classList.remove('green');
        button.classList.add('neutral');
        button.style.cursor = 'default';
        button.removeEventListener('click', buttonEventListener);
    };
    button.addEventListener('click', buttonEventListener);

    addEventListener('add_number', () => {
        calcLastNumbers(lineStructure, service);
        nextSpin(gameRoundsStructure, service.rounds);
        calcNumbersPosition(numbersPositionStructure, service.orders.entries());
        calcWinAttempts(winAttemptsStructure, service);
    });

    addEventListener('delete_number', () => {
        service.clear();

        calcLastNumbers(lineStructure, service);
        nextSpin(gameRoundsStructure, service.rounds);
        calcNumbersPosition(numbersPositionStructure, service.orders.entries());
        calcWinAttempts(winAttemptsStructure, service);
    });
}

function calcLineStrategyScore(lineStructure, prop, isUpdate = false) {
    const numbers = getNumbers();

    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const scores = [
        calcOppositeScore(numbers, prop)
    ];

    const fragment = createHTMLElements(scores, (score) => createStrategyItem(template, score));

    if (!isUpdate) {
        lineStructure.addItem(items, fragment);
    } else {
        lineStructure.updateItems(items, fragment);
    }
}

function calcOppositeScore(numbers, prop) {
    const list = [...numbers].reverse();

    let score = 0;
    let step = 1;
    let prev;

    list.forEach((current) => {
        if (!prev) {
            prev = current;
            return;
        }

        if (step === 2) {
            score += prev[prop] !== current[prop] && current[prop] !== null ? 1 : -1;
        }

        if (prev[prop] === current[prop] && current[prop] !== null) {
            step += 1;
        } else {
            step = 1;
        }

        prev = current;
    });

    return score;
}

function calsRepeats(lineStructure, isUpdate = false) {
    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const offset = getLastOffset();

    let value = {
        text: offset || '',
        length: offset ? _roundValue(offset * 2.5, [32, 64, 96, 128]) : 0
    }

    const element = createItem(template, value.text);
    element.classList.add('neutral');
    element.style.width = `${value.length}px`;

    if (!isUpdate) {
        lineStructure.addItem(items, element);
    } else {
        lineStructure.updateItems(items, element);
    }
}

function calcLastNumbers(lineStructure, service) {
    const [current] = currentGame.numbers;

    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const numbers = Array.from(service.next(current).map(([n]) => n));
    numbers.sort((a, b) => a < b ? -1 : 1);
    const bets = numbers.join(' ');

    const element = createItem(template, bets);
    element.classList.add('neutral');

    lineStructure.updateItems(items, element);
}

function calcWinAttempts(lineStructure, service) {
    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const element = createItem(template, service.attempts);

    const maxRounds = service.maxAttempts % 2 ? service.maxAttempts + 1 : service.maxAttempts;

    const positive = service.attempts <= maxRounds / 2;
    const negative = service.attempts > maxRounds / 2;

    if (positive) {
        element.classList.remove('neutral');
        element.classList.remove('red');
        element.classList.add('green');
    } else if (negative) {
        element.classList.remove('neutral');
        element.classList.remove('green');
        element.classList.add('red');
    } else {
        element.classList.remove('red');
        element.classList.remove('green');
        element.classList.add('neutral');
    }

    lineStructure.updateItems(items, element);
}

function _roundValue(value, roundList) {
    let max;
    for (let round of roundList) {
        if (value < round) {
            return round;
        }
        max = round;
    }
    return max;
}
