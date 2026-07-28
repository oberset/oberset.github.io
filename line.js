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
        [Infinity]
    ];

    static MODES = [
        1, 2, 3, 4, 5
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
        this.lastSelected = new Map();
        this.lastRecommended = [];
        this.offset = undefined;
        this.limit = 37;
        this.lastBalance = 0;
        this.skip = 0;
        this.count = 0;
        this.steps = undefined;
        this.mode = Bets.MODES[0];
        this.mix = new Map();
        this.useMix = false;
        this.checkOnce = false;
        this.lastFailed = [];

        addEventListener('delete_number', () => {
            this.reset();
            this.recalc();
        });
    }

    start() {
        console.log('start');
        this.began = true;
        this.update(this.bets);
        this.active = true;
    }

    stop() {
        console.log('stop');
        this.active = false;
        this.began = false;
        this.update(this.bets);
    }

    clear() {
        this.orders = new Map();
        this.bets = [];
        this.result = [];
        this.absoluteBalance = 0;
        this.lastRecommendedBalance = 0;
        this.winHappened = false;
        this.isPositive = undefined;
        this.lastSelected.clear();
        this.lastRecommended = [];
        this.lastBalance = 0;
        this.count = 0;
        this.lastFailed = [];
        console.log('clear');
    }

    reset() {
        this.absoluteBalance = 0;
        this.lastRecommendedBalance = 0;
        this.result = [];
        this.lastSelected.clear();
        this.lastRecommended = [];
        this.lastBalance = 0;
        this.winHappened = false;
        this.isPositive = undefined;
        this.count = 0;
        this.lastFailed = [];
    }

    changeOffset(offset, steps, limit) {
        console.log('offset', offset);
        console.log('steps', steps);
        console.log('limit', limit);

        this.reset();

        this.offset = offset > 0 ? offset : undefined;
        this.limit = limit > 0 ? limit : 37;
        this.steps = steps > 0 ? steps : undefined;

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
    }

    updateBets(list) {
        return list.map(([n, count]) => [n, count - 1]).filter(([, count]) => count > 0);
    }

    getFrequentNumber(offset = 18, count = 18) {
        const [items = []] = getNumbers(offset + 1);
        const [first, ...next] = items;

        if (!first || !next || !next.length) {
            return;
        }

        const compared = next.find((item) => item.number === first.number);

        if (compared) {
            return [first.number, count];
        }
    }

    getLateNumber(offset = 1, count = 18) {
        const first = currentGame.numbers[0];

        const numberOffset = getLastOffset() || (this.count - 1);

        if (numberOffset >= offset) {
            return [first, count];
        }
    }

    getFirstFailedNumber(offset = 18,  count = 18) {
        if (currentGame.numbers.length <= offset) {
            return;
        }

        const numbers = currentGame.numbers.slice(0, offset);

        for (let n of currentGame.numbers) {
            if (!numbers.includes(n)) {
                return [n, count];
            }
        }
    }

    getLastFailedNumber(offset = 0, count = 18) {
        if (currentGame.numbers.length <= offset) {
            return;
        }

        const orders = {};

        currentGame.numbers.forEach((n, i) => {
           const [first, second] = orders[n] || [];
           if (!first) {
               orders[n] = [currentGame.numbers.length - i];
           } else if (!second) {
               orders[n].push(first - (currentGame.numbers.length - i));
           }
        });

        let number;
        let max = 0;

        Object.entries(orders).forEach(([n, pos]) => {
            const [first, second] = pos;
            const min = second ? Math.min(first, second) : first;

            if (min > max) {
                max = min;
                number = Number(n);
            }
        });

        if (number) {
            return [number, count];
        }
    }

    updateSelectedNumbers(n, prev) {
        let mix = this.useMix ? [...this.mix.entries()] : [
            [0, [this.mode, this.offset, this.steps, this.limit, this.checkOnce]]
        ];

        mix.forEach(([id, item]) => {
            let next;

            let lastSelected = this.lastSelected.get(id) || [];
            const [mode, offset, steps, limit, checkOnce] = item;

            if (this.winHappened && checkOnce) {
                lastSelected = lastSelected.filter(([item]) => item !== n);
            }

            if (mode === 1) {
                next = this.getFrequentNumber(offset, steps);
            } else if (mode === 2) {
                next = this.getLateNumber(offset, steps);
            } else if (mode === 3) {
                next = this.getFirstFailedNumber(offset, steps);
            } else if (mode === 4) {
                next = this.getLastFailedNumber(offset, steps);
            }

            if (next) {
                const [nextNumber] = next;
                lastSelected = lastSelected.filter(([n]) => nextNumber !== n);
                lastSelected.unshift(next);
            }

            lastSelected = lastSelected.slice(0, limit);
            this.lastSelected.set(id, lastSelected);
        });

        const lastRecommended = [];

        for (let [id, items] of this.lastSelected.entries()) {
            const list = items.map(([n]) => n);
            list.sort((a, b) => a - b);

            lastRecommended.push([...list]);

            const diff = (prev.get(id) || []).map(([n]) => n);

            const added = list.filter((n) => !diff.includes(n));
            const deleted = diff.filter((n) => !list.includes(n));

            lastRecommended.push(['add', ...added]);
            lastRecommended.push(['del', ...deleted]);
        }

        this.lastRecommended = lastRecommended;

        emit('change_recommended');
    }

    next(n) {
        this.count += 1;

        if (this.count <= this.skip) {
            return;
        }

        this.addPosition(n);

        this.changeResult(n);

        const prev = new Map();

        [...this.lastSelected.entries()].forEach(([id, list]) => {
            prev.set(id, list);
            this.lastSelected.set(id, this.updateBets(list))
        });

        this.updateSelectedNumbers(n, prev);
    }

    startMix() {
        console.log('Start mix');
        this.useMix = true;

        this.reset();
        this.recalc();
    }

    stopMix() {
        console.log('Stop mix');
        this.useMix = false;

        this.reset();
        this.recalc();
    }

    changeResult(n) {
        if (!this.bets.includes(Infinity)) {
            this.winHappened = this.bets.includes(n);
            this.absoluteBalance = this.calcBalance(null, this.bets);

            if (this.winHappened) {
                this.isPositive = this.absoluteBalance >= this.lastBalance;
                this.lastBalance = this.absoluteBalance;
            }
        } else {
            this.winHappened = false;

            for (let items of this.lastRecommended) {
                if (items.includes(n)) {
                    this.winHappened = true;
                    break;
                }
            }

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

    setSkip(skip = 0) {
        console.log('skip', skip);

        this.reset();

        this.skip = skip;

        this.recalc();
    }

    setMode(mode = 1, checkOnce = 0) {
        console.log('mode', mode);
        console.log('checkOnce', checkOnce);

        this.reset();

        this.mode = Bets.MODES.includes(mode) ? mode : Bets.MODES[0];
        this.checkOnce = Boolean(checkOnce);

        this.recalc();
    }

    saveOptions() {
        setTimeout(() => {
            const id = this.mix.size;
            this.mix.set(id, [this.mode, this.offset, this.steps, this.limit, this.checkOnce]);
            console.log('Mix', [...this.mix.values()]);
            emit('change_mix');
        }, 5);
    }

    deleteOptions(id) {
        this.mix.delete(id);
        console.log('Mix', [...this.mix.values()]);
        emit('change_mix');

        this.reset();
        this.recalc();
    }

    calcLastRecommendedBalance(n) {
        let balance = 0;
        let count = 0;

        for (let items of this.lastRecommended) {
            count += items.length;
        }

        for (let items of this.lastRecommended) {
            if (items.includes(n)) {
                balance += 36 - count;
            }
        }

        if (balance > 0) {
            return balance;
        }

        return -(count);
    }

    calcBalance(numbers, bets) {
        let list = numbers || getNumbers();

        if (this.skip > 0) {
            list = list.slice(0, list.length - this.skip);
        }

        let balance = 0;

        list.map((item) => item.number).forEach((n) => {
            if (bets.includes(n)) {
                balance += (36 - bets.length);
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
