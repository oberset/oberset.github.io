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
        [Infinity],
        [2,4],
        [6,9],
        [17,20],
        [25,32],
        [31,34],
        [24,27],
        [13,36],
        [23,26],
        [12,21]
    ];

    constructor() {
        this.orders = new Map();
        this.rounds = 0;
        this.began = false;
        this.active = false;
        this.result = [];
        this.bets = Bets.SETS[0];
        this.absoluteBalance = 0;
        this.lastRecommendedBalance = 0;
        this.depth = 750;
        this.winHappened = false;
        this.isPositive = undefined;
        this.lastSelected = [];
        this.lastRecommended = [];
        this.queue = [];
        this.offset = 0;
        this.limit = 4;
        this.lastBalance = 0;
    }

    start() {
        console.log('start');
        this.began = true;
        this.update(this.bets);
        this.active = true;
    }

    stop() {
        console.log('stop');
        this.rounds = 0;
        this.active = false;
        this.began = false;
        this.update(this.bets);
    }

    clear() {
        this.orders = new Map();
        this.rounds = 0;
        this.bets = [];
        this.result = [];
        this.absoluteBalance = 0;
        this.lastRecommendedBalance = 0;
        this.winHappened = false;
        this.isPositive = undefined;
        this.lastSelected = [];
        this.lastRecommended = [];
        this.queue = [];
        this.lastBalance = 0;
        console.log('clear');
    }

    changeOffset(offset, limit) {
        console.log('offset', offset);
        console.log('limit', limit);

        this.absoluteBalance = 0;
        this.lastRecommendedBalance = 0;
        this.result = [];
        this.queue = [];
        this.lastSelected = [];
        this.lastRecommended = [];
        this.lastBalance = 0;
        this.winHappened = false;
        this.isPositive = undefined;

        this.offset = offset > 0 ? offset : 0;
        this.limit = limit > 0 ? limit : 4;

        this.recalc();
    }

    recalc() {
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

    update(bets) {
        this.clear();
        this.bets = bets;
        this.recalc();
    }

    addPosition(n) {
        const offset = getLastOffset();
        this.orders.set(n, offset);

        if (this.active) {
            this.rounds += 1;
        }
    }

    updateBets(list) {
        return list.map(([n, count]) => [n, count - 1]).filter(([, count]) => count > 0);
    }

    nextBet() {
        const [items = []] = getNumbers(37);

        const [first, ...next] = items;

        if (!first || !next || !next.length) {
            return;
        }

        let count;

        for (let i = 0; i < next.length; i++) {
            if (next[i].number === first.number) {
                count = 37 - (i + 1);
                break;
            }
        }

        if (this.offset < 1) {
            if (!count) {
                return;
            }

            return [first.number, count];
        }

        let queue = this.queue
            .filter(([n]) => n !== first.number)
            .map(([n, offset, count]) => [n, offset - 1, count]);

        const current = queue.find(([,offset]) => offset === 0);

        if (current) {
            queue = queue.filter(([n]) => n !== current[0]);
        }

        if (count) {
            queue.push([first.number, this.offset, count]);
        }

        this.queue = queue;

        if (current) {
            return [current[0], current[2]];
        }
    }

    next(n) {
        this.addPosition(n);

        this.changeResult(n);

        this.lastSelected = this.updateBets(this.lastSelected);

        const next = this.nextBet();

        if (next) {
            const [nextNumber] = next;
            this.lastSelected = this.lastSelected.filter(([n]) => nextNumber !== n);
            this.lastSelected.unshift(next);
        }

        this.lastSelected = this.lastSelected.slice(0, this.limit);
        // console.log('LAST', this.lastSelected);

        const list = this.lastSelected.map(([n]) => n);
        list.sort((a, b) => a - b);

        this.lastRecommended = list;

        emit('change_recommended');
    }

    changeResult(n) {
        if (!this.bets.includes(Infinity)) {
            this.winHappened = this.bets.includes(n);
            this.absoluteBalance = this.calcBalance(null, this.bets);;

            if (this.winHappened) {
                this.isPositive = this.absoluteBalance >= this.lastBalance;
                this.lastBalance = this.absoluteBalance;
            }
        } else {
            this.winHappened = this.lastRecommended.includes(n);
            this.lastRecommendedBalance += this.calcLastRecommendedBalance(n);

            if (this.winHappened) {
                this.isPositive = this.lastRecommendedBalance >= this.lastBalance;
                this.lastBalance = this.lastRecommendedBalance;
            }
        }

        this.result.unshift([
            this.absoluteBalance,
            this.lastRecommendedBalance,
            this.winHappened,
            this.isPositive
        ]);

        this.result = this.result.slice(0, this.depth);
    }

    calcLastRecommendedBalance(n) {
        if (this.lastRecommended.includes(n)) {
            return 36 - this.lastRecommended.length;
        }

        return -(this.lastRecommended.length);
    }

    calcBalance(numbers, bets) {
        const list = numbers || getNumbers();

        let balance = 0;

        list.map((item) => item.number).forEach((n) => {
            if (bets.includes(n)) {
                balance += 36;
            } else {
                balance -= bets.length;
            }
        });

        return balance;
    }

    getStopPoint() {
        return -(Math.ceil((80 / this.bets.length) / 3) * 3);
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

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
