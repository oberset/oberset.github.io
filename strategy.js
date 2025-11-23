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

    addEventListener('clear', () => {
        const group = lineStructure.getFirstItemsGroupElement();
        const items = lineStructure.getItemsElement(group);
        const element = lineStructure.getFirstItemElement(items);

        items.innerHTML = '';

        items.appendChild(element);
    });
}

function selectedNumbers() {
    const input = document.querySelector('.selected_numbers_repeats input');
    const container = document.querySelector('.selected_numbers_container');

    input.addEventListener('blur', (e) => {
        const value = parseInt(e.currentTarget.value, 10);
        if (value > 0) {
            SelectedNumbers.instance.maxAttempts = value;
        } else {
            SelectedNumbers.instance.maxAttempts = SelectedNumbers.DEFAULT_ATTEMPTS;
        }
    });

    addEventListener('add_number', () => {
        SelectedNumbers.instance.updateSelectedNumbers();
    });

    addEventListener('change_selected_numbers', () => {
        const selected = Array.from(SelectedNumbers.instance.selected.values()).sort((a, b) => {
            return a - b;
        });
        const fragment = document.createDocumentFragment();

        for (let number of selected) {
            const element = document.createElement('div');

            element.textContent = `${number} > ${SelectedNumbers.instance.attemptsCount.get(number)}`;
            element.classList.add('selected_number');

            element.addEventListener('click', () => {
                container.removeChild(element);
                SelectedNumbers.instance.removeSelectedNumber(number);
            });

            fragment.appendChild(element);
        }

        container.innerHTML = '';
        container.appendChild(fragment);
    });
}

function lastNumbersStrategy() {
    const lineStructure = new Line('.strategy-last-numbers');
    const numbersPositionStructure = new Line('.numbers-position');
    const gameRoundsStructure = new Line('.game-rounds-count');
    const winAttemptsStructure = new Line('.win-attempts');
    const resultStructure = new Line('.result');
    const customNumbersInput = document.querySelector('.custom_numbers input');

    const service = new Bets();

    showBets(lineStructure, service);

    const button = document.querySelector('.start-game');
    const buttonEventListener = () => {
        if (service.active) {
            service.stop();
            button.classList.remove('neutral');
            button.classList.add('green');
        } else {
            service.start();
            button.classList.remove('green');
            button.classList.add('neutral');
        }
    };
    button.addEventListener('click', buttonEventListener);

    addEventListener('add_number', () => {
        calcLastNumbers(lineStructure, service);
        nextSpin(gameRoundsStructure, service.rounds);
        calcNumbersPosition(numbersPositionStructure, service.orders.entries());
        calcWinAttempts(winAttemptsStructure, service);
        showResult(resultStructure, service);
    });

    addEventListener('delete_number', () => {
        service.clear();

        calcLastNumbers(lineStructure, service);
        nextSpin(gameRoundsStructure, service.rounds);
        calcNumbersPosition(numbersPositionStructure, service.orders.entries());
        calcWinAttempts(winAttemptsStructure, service);

        button.classList.remove('neutral');
        button.classList.add('green');
        button.style.cursor = 'pointer';
        button.addEventListener('click', buttonEventListener);
    });

    addEventListener('clear', () => {
        calcLastNumbers(lineStructure, service);
        nextSpin(gameRoundsStructure, service.rounds);
        calcNumbersPosition(numbersPositionStructure, service.orders.entries());
        calcWinAttempts(winAttemptsStructure, service);
    });

    customNumbersInput.addEventListener('blur', (e) => {
        const value = e.currentTarget.value;
        if (value) {
            const numbers = value.split(/[\D\s]+/).map((n) => Number(n)).filter((n) => !isNaN(n));
            if (numbers.length) {
                console.log('Value', numbers);
                service.update(numbers)
            }
        }
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

function showResult(resultStructure, service) {
    const result = service.result;
    const index = Math.floor(36 / service.bets.length) - 1;
    const group = resultStructure.getFirstItemsGroupElement();
    const items = resultStructure.getItemsElement(group);

    const elements = [];

    for (let items of result) {
        const fragment = document.createDocumentFragment();
        const numbersElement = document.createElement('div');
        numbersElement.classList.add('container');

        const [count1, count2, count3, winHappened] = items;
        const balances = [count1, count2, count3];

        for (let count of balances) {
            const numberElement = document.createElement('div');
            numberElement.classList.add('number');
            numberElement.innerText = count;

            if (winHappened) {
                numberElement.classList.add('bold');
            }

            if (count < 0) {
                numberElement.classList.add('negative-1');
            } else if (count === 0) {
                numberElement.classList.add('cold');
            } else if (count <= index) {
                numberElement.classList.add('positive-2');
            } else if (count <= (index * 2)) {
                numberElement.classList.add('positive-3');
            } else {
                numberElement.classList.add('positive-4');
            }

            fragment.appendChild(numberElement);
        }

        numbersElement.appendChild(fragment);
        elements.push(numbersElement);
    }

    resultStructure.setItems(items, elements);
}

function calcLastNumbers(lineStructure, service) {
    const [current] = currentGame.numbers;
    service.next(current);
}

function showBets(lineStructure, service) {
    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const betsList = new WeakMap();

    const elements = [];

    for (let set of Bets.SETS) {
        const element = createItem(template, set.join(' '));

        if (set === service.bets) {
            element.classList.remove('neutral');
            element.classList.add('positive-3');
        } else {
            element.classList.remove('positive-3');
            element.classList.add('neutral');
        }

        betsList.set(element, set);

        element.addEventListener('click', (e) => {
            service.update(betsList.get(e.currentTarget));
            showBets(lineStructure, service);
        });

        elements.push(element);
    }

    lineStructure.setItems(items, elements);
}

function calcWinAttempts(lineStructure, service) {
    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const balance = service.relativeBalance;
    const stopPoint = service.stopPoint;

    const element = createItem(template, stopPoint);

    if (balance > stopPoint) {
        element.classList.remove('neutral');
        element.classList.remove('red');
        element.classList.add('green');
    } else if (balance <= stopPoint) {
        element.classList.remove('neutral');
        element.classList.remove('green');
        element.classList.add('red');
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
