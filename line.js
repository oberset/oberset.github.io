class Line {
    constructor(selector) {
        this.container = document.querySelector(selector);
    }

    getFirstItemsGroupElement() {
        return this.container.querySelector('.group');
    }

    getItemsElement(groupElement) {
        return groupElement.querySelector('.items');
    }

    getFirstItemElement(itemsElement) {
        return itemsElement.querySelector('.item');
    }

    createItem(template, numberInfo) {
        const element = template.cloneNode(true);
        element.classList.remove('green', 'red', 'black');

        if (numberInfo.red === null) {
            element.classList.add('green');
        } else {
            element.classList.add(numberInfo.red ? 'red' : 'black');
        }
        element.innerText = numberInfo.number;

        return element;
    }

    addItem(itemsElement, element) {
        const current = this.getFirstItemElement(itemsElement);
        itemsElement.insertBefore(element, current);
    }

    updateItems(itemsElement, fragment) {
        const item = this.getFirstItemElement(itemsElement);
        itemsElement.replaceChild(fragment, item);
    }

    setItems(itemsElement, list) {
        const fragment = document.createDocumentFragment();
        for (let item of list) {
            fragment.appendChild(item);
        }
        itemsElement.innerHTML = '';
        itemsElement.appendChild(fragment);
    }
}

class SelectedNumbers {
    static DEFAULT_ATTEMPTS = 35;
    static instance = new SelectedNumbers();

    constructor() {
        this.firstOne = new Set();
        this.firstOneAttemptsCount = new Map();
        this.firstOneMaxAttempts = SelectedNumbers.DEFAULT_ATTEMPTS;

        this.secondOne = new Set();
        this.secondOneAttemptsCount = new Map();
        this.secondOneMaxAttempts = SelectedNumbers.DEFAULT_ATTEMPTS;

        this.frozen = false;
    }

    freeze() {
        this.frozen = true;
    }

    defrost() {
        this.frozen = false;
    }

    addFirstOneNumber(number) {
        this.firstOne.add(Number(number));

        if (!this.firstOneAttemptsCount.has(number)) {
            this.firstOneAttemptsCount.set(number, this.firstOneMaxAttempts);
        }
    }

    removeFirstOneNumber(number) {
        this.firstOne.delete(number);
        this.firstOneAttemptsCount.delete(number);
    }

    addSecondOneNumber(number) {
        this.secondOne.add(Number(number));

        if (!this.secondOneAttemptsCount.has(number)) {
            this.secondOneAttemptsCount.set(number, this.secondOneMaxAttempts);
        }
    }

    removeSecondOneNumber(number) {
        this.secondOne.delete(number);
        this.secondOneAttemptsCount.delete(number);
    }

    updateFirstOneNumbers() {
        if (this.frozen) {
            return;
        }
        for (let number of this.firstOne) {
            const attempts = this.firstOneAttemptsCount.get(number);
            this.firstOneAttemptsCount.set(number, attempts - 1);
        }

        emit('change_first_one_numbers');
    }

    updateSecondOneNumbers(recalc = true) {
        if (this.frozen) {
            return;
        }

        if (recalc) {
            for (let number of this.secondOne) {
                const attempts = this.secondOneAttemptsCount.get(number);
                this.secondOneAttemptsCount.set(number, attempts - 1);
            }
        }

        emit('change_second_one_numbers');
    }
}

class Bets {
    static SETS = [
        [17, 20, 31, 34],
        [5, 16, 25, 32],
        [3, 7, 12, 21],
        [13, 24, 26, 27],
        [1, 9, 12, 14],
        [5, 8, 11, 33],
        [22, 28, 29, 35],
        [12, 23, 35, 36],
        [4, 7, 11, 21],
        [2, 4, 7, 15],
        [5, 13, 16, 17, 22, 24, 25, 32, 34],
        [1, 6, 9, 14, 17, 20, 25, 31, 34],
        [32, 15, 19, 4],
        [21, 2, 25, 17],
        [34, 6, 27, 13],
        [36, 11, 30, 8],
        [23, 10, 5, 24],
        [16, 33, 1, 20],
        [14, 31, 9, 22],
        [18, 29, 7, 28],
        [12, 35, 3, 26]
    ];

    constructor() {
        this.orders = new Map();
        this.rounds = 0;
        this.began = false;
        this.active = false;
        this.result = [];
        this.bets = Bets.SETS[0];
        this.absoluteBalance = 0;
        this.relativeBalance = 0;
        this.lastPointsBalance = 0;
        this.depth = 300;
        this.lastPeriod = 36;
        this.stopPoint = 0;
        this.maxWin = 0;
        this.winHappened = false;
    }

    start() {
        console.log('start');

        if (!this.began) {
            this.began = true;
        }

        this.maxWin = 0;
        this.stopPoint = this.getStopPoint();

        this.active = true;
    }

    stop() {
        console.log('stop');
        this.stopPoint = 0;
        this.maxWin = 0;
        this.rounds = 0;
        this.active = false;
        this.relativeBalance = 0;
    }

    clear() {
        this.orders = new Map();
        this.rounds = 0;
        this.began = false;
        this.bets = [];
        this.result = [];
        this.absoluteBalance = 0;
        this.relativeBalance = 0;
        this.lastPointsBalance = 0;
        this.bet = 1;
        this.stopPoint = 0;
        this.maxWin = 0;
        this.winHappened = false;
        console.log('clear');
    }

    update(bets) {
        this.clear();
        this.bets = bets;

        SelectedNumbers.instance.freeze();

        const numbers = getNumbers();

        clearNumbers();

        emit('clear');

        numbers.reverse();

        for (let item of numbers) {
            addNumber(item.number)
        }

        SelectedNumbers.instance.defrost();
    }

    addPosition(n) {
        const offset = getLastOffset();
        this.orders.set(n, offset);

        if (this.active) {
            this.rounds += 1;
        }
    }

    next(n) {
        this.addPosition(n);

        this.winHappened = this.bets.includes(n);

        this.changeResult();
    }

    changeResult() {
        this.absoluteBalance = this.calcBalance();

        this.lastPointsBalance = this.calcPointsDistance();

        const diff = this.calcRelativeBalance();

        this.relativeBalance += diff;

        this.result.unshift([
            this.absoluteBalance,
            this.lastPointsBalance,
            this.relativeBalance,
            this.winHappened
        ]);

        this.result = this.result.slice(0, this.depth);

        if (this.relativeBalance > this.maxWin) {
            this.maxWin = this.relativeBalance;
        }

        if (this.maxWin > 0) {
            this.stopPoint = this.getStopPoint() + this.maxWin;
        }
    }

    calcPointsDistance() {
        const minPoints = 3;

        let distance = 0;
        let points = 0;

        const [lastNumbers] = getNumbers(this.depth);

        if (!lastNumbers) {
            return 0;
        }

        for (let n of lastNumbers) {
            distance += 1;

            if (this.bets.includes(n.number)) {
                points += 1;
            }

            if (points === minPoints) {
                break;
            }
        }

        if (points > 1) {
            const wins = Math.floor(36 / this.bets.length) * (points - (points === minPoints ? 1 : 0));
            const attempts = distance - (points === minPoints ? 1 : 0);
            return wins - attempts;
        }

        return 0;
    }

    calcLastBalance() {
        const minPoints = 4;
        let balance = 0;
        let points = 0;

        const [lastNumbers] = getNumbers(this.depth);

        if (!lastNumbers) {
            return 0;
        }

        for (let n of lastNumbers) {
            if (this.bets.includes(n.number)) {
                balance += this.getWin();
                points += 1;
            } else {
                balance -= 1;
            }

            if (points >= minPoints) {
                break;
            }
        }

        return balance - this.getWin();
    }

    calcRelativeBalance() {
        if (!this.rounds) {
            return 0;
        }

        if (!this.active) {
            return 0;
        }

        const [lastNumbers] = getNumbers(this.rounds);

        if (!lastNumbers) {
            return 0;
        }

        const prev = this.relativeBalance;
        const current = this.calcBalance(lastNumbers, this.bet);

        return current - prev;
    }

    calcBalance(numbers, bet = 1) {
        const list = numbers || getNumbers();

        let balance = 0;

        list.map((item) => item.number).forEach((n) => {
            if (this.bets.includes(n)) {
                balance += this.getWin(bet);
            } else {
                balance -= bet;
            }
        });

        return balance;
    }

    getWin(bet = 1) {
        return Math.floor((36 * bet) / this.bets.length) - bet;
    }

    getStopPoint() {
        return -(Math.floor(80 / this.bets.length));
    }

    getHot() {
        const minCompares = 3;
        const minDiffs = 3;

        let result = [];

        const numbers = getNumbers();

        for (let i = 0; i < Bets.SETS.length; i++) {
            const set = Bets.SETS[i];
            let compares = 0;
            let uniqueNumbers = new Set();

            for (let n of numbers) {
                if (set.includes(n.number)) {
                    uniqueNumbers.add(n.number);
                    compares += 1;
                }
            }

            if (uniqueNumbers.size < minDiffs) {
                continue;
            }

            if (compares < minCompares) {
                continue;
            }

            result = set;
            break;
        }

        this.bets = result;

        return this.bets;
    }
}

function line() {
    const lineStructure = new Line('.line');

    let lastElement;

    addEventListener('add_number', () => {
        const [n] = currentGame.numbers;
        const numberInfo = NUMBER_INFO.get(n);

        const group = lineStructure.getFirstItemsGroupElement();
        const items = lineStructure.getItemsElement(group);
        const template = lineStructure.getFirstItemElement(items);

        const element = lineStructure.createItem(template, numberInfo);

        element.addEventListener('click', () => {
            SelectedNumbers.instance.addFirstOneNumber(n);
            emit('change_first_one_numbers');
        });

        lastElement = element;

        if (currentGame.numbers.length > 1) {
            lineStructure.addItem(items, element);
        } else {
            lineStructure.updateItems(items, element);
        }
    });

    addEventListener('delete_number', () => {
        if (lastElement) {
            if (currentGame.numbers.length > 0) {
                const group = lineStructure.getFirstItemsGroupElement();
                const items = lineStructure.getItemsElement(group);

                lastElement = lineStructure.getFirstItemElement(items);
                items.removeChild(lastElement);
            } else {
                lastElement = null;
            }
        }
    });

    addEventListener('clear', () => {
        const group = lineStructure.getFirstItemsGroupElement();
        const items = lineStructure.getItemsElement(group);

        const element = lineStructure.getFirstItemElement(items);

        items.innerHTML = '';

        lineStructure.addItem(items, element);
    });
}

function getLastOffset(calcRepeatsOnly = true) {
    const [current, ...list] = currentGame.numbers;

    let value;

    for (let i = 0; i < list.length; i++) {
        const n = list[i];

        if (n === current) {
            value = i + 1;
            break;
        }

        if (!calcRepeatsOnly) {
            value = i + 1;
        }
    }

    return value;
}

function getAvgRepeats(repeats) {
    const hot = [];
    const all = [];

    const numbers = currentGame.numbers.filter((n, i) => {
        return currentGame.numbers.findIndex((current, index) => current === n && index !== i) !== -1;
    });

    const list = Array.from(repeats).filter(([n]) => numbers.includes(n));

    for (let [, offset] of list) {
        if (offset < 37) {
            hot.push(offset);
        }
        all.push(offset);
    }

    const hotSum = hot.reduce((acc, offset) => {
        acc += offset;
        return acc;
    }, 0);

    const allSum = all.reduce((acc, offset) => {
        acc += offset;
        return acc;
    }, 0);

    const hotAvg = hotSum > 0 ? Math.round(hotSum / hot.length) : 0;
    const allAvg = allSum > 0 ? Math.round(allSum / all.length) : 0;

    return [hotAvg, allAvg];
}
