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
        this.queue = [];
        this.offset = 0;
        this.limit = 4;
        this.lastBalance = 0;
        this.skip = 0;
        this.count = 0;
        this.steps = 0;
        this.mode = 1;
        this.mix = new Map();
        this.useMix = false;

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
        this.queue = [];
        this.lastBalance = 0;
        this.count = 0;
        console.log('clear');
    }

    reset() {
        this.absoluteBalance = 0;
        this.lastRecommendedBalance = 0;
        this.result = [];
        this.queue = [];
        this.lastSelected.clear();
        this.lastRecommended = [];
        this.lastBalance = 0;
        this.winHappened = false;
        this.isPositive = undefined;
        this.count = 0;
    }

    changeOffset(offset, steps, limit) {
        console.log('offset', offset);
        console.log('limit', steps);
        console.log('limit', limit);

        this.reset();

        this.offset = offset > 0 ? offset : 0;
        this.limit = limit > 0 ? limit : 4;
        this.steps = steps > 0 ? steps : 0;

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

    getFrequentNumber(offset, steps, distance = 37) {
        const [items = []] = getNumbers(distance);

        const [first, ...next] = items;

        if (!first || !next || !next.length) {
            return;
        }

        let count;

        for (let i = 0; i < next.length; i++) {
            if (next[i].number === first.number) {
                count = steps || (37 - (i + 1));
                break;
            }
        }

        if (offset < 1) {
            if (!count) {
                return;
            }

            return [first.number, count];
        }

        let queue = this.queue
            .filter(([n]) => n !== first.number)
            .map(([n, ofs, count]) => [n, ofs - 1, count]);

        const current = queue.find(([,ofs]) => ofs === 0);

        if (current) {
            queue = queue.filter(([n]) => n !== current[0]);
        }

        if (count) {
            queue.push([first.number, offset, count]);
        }

        this.queue = queue;

        if (current) {
            return [current[0], current[2]];
        }
    }

    getLateNumber(offset, steps) {
        const distance = 35 + offset;
        const first = currentGame.numbers[0];

        const numberOffset = getLastOffset() || (this.count - 1);

        if (numberOffset > distance) {
            return [first, steps || 24];
        }
    }

    updateSelectedNumbers() {
        let mix = this.useMix ? [...this.mix.entries()] : [
            [0, [this.mode, this.offset, this.steps, this.limit]]
        ];

        mix.forEach(([id, item]) => {
            let next;

            let lastSelected = this.lastSelected.get(id) || [];
            const [mode, offset, steps, limit] = item;

            if (mode === 1) {
                next = this.getFrequentNumber(offset, steps);
            } else if (mode === 2) {
                next = this.getLateNumber(offset, steps);
            } else if (mode === 3) {
                next = this.getFrequentNumber(offset, steps, 14);
            } else if (mode === 4) {
                next = this.getFrequentNumber(offset, steps, 25);
            }

            if (next) {
                const [nextNumber] = next;
                lastSelected = lastSelected.filter(([n]) => nextNumber !== n);
                lastSelected.unshift(next);
            }

            lastSelected = lastSelected.slice(0, limit);
            // console.log('LAST', lastSelected);

            this.lastSelected.set(id, lastSelected);
        });

        const uniqueList = new Set();

        this.lastSelected.forEach((items) => {
            items.forEach(([n]) => {
                uniqueList.add(n);
            });
        });

        const list = Array.from(uniqueList);
        list.sort((a, b) => a - b);

        this.lastRecommended = list;

        emit('change_recommended');
    }

    next(n) {
        this.count += 1;

        if (this.count <= this.skip) {
            return;
        }

        this.addPosition(n);

        this.changeResult(n);

        [...this.lastSelected.entries()].forEach(([id, list]) => {
            this.lastSelected.set(id, this.updateBets(list))
        });

        this.updateSelectedNumbers();
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

    setSkip(skip = 0) {
        console.log('skip', skip);

        this.reset();

        this.skip = skip;

        this.recalc();
    }

    setMode(mode = 1) {
        console.log('mode', mode);

        this.reset();

        this.mode = [1, 2, 3, 4].includes(mode) ? mode : 1;

        this.recalc();
    }

    saveOptions() {
        setTimeout(() => {
            const id = this.mix.size;
            this.lastSelected.delete(id);
            this.mix.set(id, [this.mode, this.offset, this.steps, this.limit]);
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
        if (this.lastRecommended.includes(n)) {
            return 36 - this.lastRecommended.length;
        }

        return -(this.lastRecommended.length);
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
