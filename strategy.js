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

function selectedFirstOneNumbers() {
    const root = document.querySelector('.first_one_numbers');
    const input = root.querySelector('.selected_numbers_repeats input');
    const container = root.querySelector('.selected_numbers_container');

    input.addEventListener('blur', (e) => {
        const value = parseInt(e.currentTarget.value, 10);
        if (value > 0) {
            SelectedNumbers.instance.firstOneMaxAttempts = value;
        } else {
            SelectedNumbers.instance.firstOneMaxAttempts = SelectedNumbers.DEFAULT_ATTEMPTS;
        }
    });

    addEventListener('add_number', () => {
        SelectedNumbers.instance.updateFirstOneNumbers();
    });

    addEventListener('change_first_one_numbers', () => {
        const selected = Array.from(SelectedNumbers.instance.firstOne.values()).sort((a, b) => {
            return a - b;
        });
        const fragment = document.createDocumentFragment();

        for (let number of selected) {
            const element = document.createElement('div');

            element.textContent = `${number} > ${SelectedNumbers.instance.firstOneAttemptsCount.get(number)}`;
            element.classList.add('selected_number');

            element.addEventListener('click', () => {
                container.removeChild(element);
                SelectedNumbers.instance.removeFirstOneNumber(number);
                SelectedNumbers.instance.addSecondOneNumber(number);
                SelectedNumbers.instance.updateSecondOneNumbers(false);
            });

            fragment.appendChild(element);
        }

        container.innerHTML = '';
        container.appendChild(fragment);
    });
}

function selectedSecondOneNumbers() {
    const root = document.querySelector('.second_one_numbers');
    const input = root.querySelector('.selected_numbers_repeats input');
    const container = root.querySelector('.selected_numbers_container');

    input.addEventListener('blur', (e) => {
        const value = parseInt(e.currentTarget.value, 10);
        if (value > 0) {
            SelectedNumbers.instance.secondOneMaxAttempts = value;
        } else {
            SelectedNumbers.instance.secondOneMaxAttempts = SelectedNumbers.DEFAULT_ATTEMPTS;
        }
    });

    addEventListener('add_number', () => {
        SelectedNumbers.instance.updateSecondOneNumbers();
    });

    addEventListener('change_second_one_numbers', () => {
        const selected = Array.from(SelectedNumbers.instance.secondOne.values()).sort((a, b) => {
            return a - b;
        });
        const fragment = document.createDocumentFragment();

        for (let number of selected) {
            const element = document.createElement('div');

            element.textContent = `${number} > ${SelectedNumbers.instance.secondOneAttemptsCount.get(number)}`;
            element.classList.add('selected_number');

            element.addEventListener('click', () => {
                container.removeChild(element);
                SelectedNumbers.instance.removeSecondOneNumber(number);
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
    const resultStructure = new Line('.result');
    const customNumbersInput = document.querySelector('.custom_numbers input');
    const customModeInput = document.querySelector('.custom_mode input');
    const customOffsetInput = document.querySelector('.custom_offset input');
    const customSkipInput = document.querySelector('.custom_skip input');
    const offsetPlusControl = document.querySelector('.custom_offset #offset_plus');
    const offsetMinusControl = document.querySelector('.custom_offset #offset_minus');
    const saveMixControl = document.querySelector('.custom_save_mix button');
    const mixStructure = document.querySelector('.custom_mix');
    const toggleMix = document.querySelector('.custom_toggle_mix button');

    const service = new Bets();

    const addNewNumbers = (list) => {
        if (list.length) {
            customNumbersInput.value = list.join(',');
        }
    }

    showRecommended(lineStructure, service, Bets.SETS, addNewNumbers);

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

    const changeOffset = (value) => {
        if (value) {
            const [offset, steps, limit] = value.split(/[\D\s]+/).map((n) => Number(n)).filter((n) => !isNaN(n));
            service.changeOffset(offset, steps, limit);
        } else {
            service.changeOffset();
        }
    }

    offsetPlusControl.addEventListener('click', () => {
        const value = parseInt(customOffsetInput.value.toString());
        let newValue = 1;

        if (value > 0) {
            newValue = value + 1;
        }

        customOffsetInput.value = newValue;
        changeOffset(newValue.toString());
    });

    offsetMinusControl.addEventListener('click', () => {
        const value = parseInt(customOffsetInput.value.toString());
        let newValue = 0;

        if (value > 1) {
            newValue = value - 1;
        }

        customOffsetInput.value = newValue;
        changeOffset(newValue.toString());
    });

    addEventListener('change_recommended', () => {
        const recommended = service.lastRecommended;

        showRecommended(lineStructure, service, Bets.SETS.concat([recommended]), addNewNumbers);
    })

    addEventListener('add_number', () => {
        calcLastNumbers(lineStructure, service);
        nextSpin(gameRoundsStructure, service.rounds);
        calcNumbersPosition(numbersPositionStructure, service.orders.entries());
        showResult(resultStructure, service);
    });

    addEventListener('delete_number', () => {
        service.clear();

        calcLastNumbers(lineStructure, service);
        nextSpin(gameRoundsStructure, service.rounds);
        calcNumbersPosition(numbersPositionStructure, service.orders.entries());

        button.classList.remove('neutral');
        button.classList.add('green');
        button.style.cursor = 'pointer';
        button.addEventListener('click', buttonEventListener);
    });

    addEventListener('clear', () => {
        calcLastNumbers(lineStructure, service);
        nextSpin(gameRoundsStructure, service.rounds);
        calcNumbersPosition(numbersPositionStructure, service.orders.entries());
    });

    addEventListener('change_mix', () => {
        mixStructure.innerHTML = '';

        const mix = [...service.mix.entries()];

        mix.forEach(([id, item]) => {
            const element = document.createElement('div');
            element.classList.add('mix-item');
            element.textContent = item.join(', ');
            element.addEventListener('click', () => {
                service.deleteOptions(id);
            });
            mixStructure.appendChild(element);
        });
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

    customOffsetInput.addEventListener('blur', (e) => {
        const value = e.currentTarget.value;
        changeOffset(value);
    });

    customSkipInput.addEventListener('blur', (e) => {
        const value = parseInt(e.currentTarget.value) || 0;
        service.setSkip(value);
    });

    customModeInput.addEventListener('blur', (e) => {
        const value = parseInt(e.currentTarget.value) || 0;
        service.setMode(value);
    });

    saveMixControl.addEventListener('click', () => {
        service.saveOptions();
    });

    toggleMix.addEventListener('click', (e) => {
        service.useMix ? service.stopMix() : service.startMix();
        e.currentTarget.textContent = service.useMix ? 'Stop mix' : 'Start mix';
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
    const index = Math.floor(108 / Math.max(service.bets.length, 2)) - 1;
    const group = resultStructure.getFirstItemsGroupElement();
    const items = resultStructure.getItemsElement(group);

    const elements = [];

    for (let items of result) {
        const fragment = document.createDocumentFragment();
        const numbersElement = document.createElement('div');
        numbersElement.classList.add('container');

        const [count1, count2, winHappened, isPositive] = items;

        if (!service.began && !winHappened) {
            continue;
        }

        const numberElement = document.createElement('div');
        numberElement.classList.add('number');
        numberElement.classList.add('empty');

        if (isPositive !== undefined) {
            numberElement.classList.add(isPositive ? 'plus' : 'minus');
        }

        fragment.appendChild(numberElement);

        const balances = [count1, count2];

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

function showRecommended(lineStructure, service, recommended, onChange) {
    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const betsList = new WeakMap();

    const elements = [];
    const selected = service.bets.join(' ');

    for (let set of recommended) {
        const text = set.join(' ');
        const element = createItem(template, text);

        if (text === selected) {
            element.classList.remove('neutral');
            element.classList.add('positive-3');
        } else {
            element.classList.remove('positive-3');
            element.classList.add('neutral');
        }

        betsList.set(element, set);

        element.addEventListener('click', (e) => {
            const list = betsList.get(e.currentTarget);
            service.update(list);
            if (onChange) {
                onChange(list);
            }
        });

        elements.push(element);
    }

    lineStructure.setItems(items, elements);
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
