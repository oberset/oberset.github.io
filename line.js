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
        while (itemsElement.lastElementChild) {
            itemsElement.removeChild(itemsElement.lastElementChild);
        }
        itemsElement.appendChild(fragment);
    }
}

class Bets {
    constructor(numbersCount = 6) {
        this.orders = new Map();
        this.bets = new Set();
        this.numbersCount = numbersCount;
        this.rounds = 0;
        this.began = false;
        this.attempts = 0;
        console.log('Numbers', this.numbersCount);
    }

    start() {
        this.began = true;
        this.rounds = 0;
        this.attempts = 0;
        console.log('start');
    }

    clear() {
        this.orders = new Map();
        this.bets = new Set();
        this.rounds = 0;
        this.began = false;
        this.attempts = 0;
    }

    addPosition(n) {
        const offset = getLastOffset();
        this.orders.set(n, offset);

        if (this.began) {
            this.rounds += 1;
            this.attempts += 1;
        }
    }

    next(n) {
        this.addPosition(n);

        if (!this.began) {
            const result = {};
            const numbers = currentGame.numbers;

            NUMBERS.forEach((item, index) => {
                result[item.number] = 0;
                const neighbors = [item.number, ...item.neighbors_1];
                for (let n of neighbors) {
                    const equals = numbers.filter((curr) => curr === n);
                    if (equals.length) {
                        result[item.number] += equals.length;
                    }
                }
            });

            const orders = Object.entries(result).reduce((acc, [n, count]) => {
                if (count) {
                    acc.push({
                        number: n,
                        count
                    })
                }
                return acc;
            }, []);

            orders.sort((a, b) => {
                return b.count - a.count;
            });

            const [max] = orders;
            console.log('max', max);

            const info = getNumberInfo(+max.number);
            const [n1, n2] = info.neighbors_1;

            this.bets = new Set([n1, max.number, n2]);

            return [];
        }

        if (this.bets.has(n)) {
            this.attempts = 1;
        }

        /*if (this.attempts >= this.getMaxAttempt()) {
            this.began = false;
        }*/

        return this.bets.entries();
    }

    getMaxAttempt() {
        return 18;
    }
}

Object.assign(Bets, {
    instance: null,
    getInstance(numbersCount = 3) {
        if (this.instance === null) {
            this.instance = new Bets(numbersCount);
        }
        return this.instance;
    }
});

function line() {
    const lineStructure = new Line('.line');

    addEventListener('add_number', () => {
        const [n] = currentGame.numbers;
        const numberInfo = NUMBER_INFO.get(n);

        const group = lineStructure.getFirstItemsGroupElement();
        const items = lineStructure.getItemsElement(group);
        const template = lineStructure.getFirstItemElement(items);

        const element = lineStructure.createItem(template, numberInfo);

        if (currentGame.numbers.length > 1) {
            lineStructure.addItem(items, element);
        } else {
            lineStructure.updateItems(items, element);
        }
    });

    addEventListener('delete_number', () => {
        const group = lineStructure.getFirstItemsGroupElement();
        const items = lineStructure.getItemsElement(group);
        const template = lineStructure.getFirstItemElement(items);

        const element = createItem(template, 'N');
        element.classList.remove('green', 'red', 'black');

        lineStructure.updateItems(items, element);
    });
}

function getLastOffset(calcRepeatsOnly = true, forNumber = undefined) {
    const [last, ...prev] = currentGame.numbers;
    const current = forNumber !== undefined ? forNumber : last;
    const list = forNumber !== undefined ? currentGame.numbers : prev;

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

function getAvgHotColdRepeats(repeats) {
    const hot = [];
    const cold = [];

    const numbers = currentGame.numbers.filter((n, i) => {
        return currentGame.numbers.findIndex((current, index) => current === n && index !== i) !== -1;
    });

    const list = Array.from(repeats).filter(([n]) => numbers.includes(n));

    for (let [, offset] of list) {
        if (offset < 37) {
            hot.push(offset);
        } else {
            cold.push(offset);
        }
    }

    const hotSum = hot.reduce((acc, offset) => {
        acc += offset;
        return acc;
    }, 0);

    const coldSum = cold.reduce((acc, offset) => {
        acc += offset;
        return acc;
    }, 0);

    const hotAvg = hotSum > 0 ? Math.round(hotSum / hot.length) : 0;
    const coldAvg = coldSum > 0 ? Math.round(coldSum / cold.length) : 0;

    return [hotAvg, coldAvg];
}
