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
    constructor(coldNumbers = 6, hotNumbers = 3) {
        this.orders = new Map();
        this.bets = new Map();
        this.coldNumbers = coldNumbers;
        this.hotNumbers = hotNumbers;
        this.rounds = 0;
        this.began = false;
        this.attempts = 0;
        this.lastResults = [];
    }

    start() {
        this.began = true;
        this.rounds = 0;
        this.attempts = 0;
        console.log('start');
    }

    clear() {
        this.orders = new Map();
        this.bets = new Map();
        this.rounds = 0;
        this.began = false;
        this.attempts = 0;
        this.lastResults = [];
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
            return [];
        }

        const ignoreNumbers = [];

        if (this.bets.has(n)) {
            this.bets.delete(n);
            this.lastResults.push(this.attempts);
            this.attempts = 1;
            ignoreNumbers.push(n);
        }

        if (this.bets.size > 0) {
            const bets = this.bets.entries();
            const [hotAvg] = getAvgHotColdRepeats(this.orders);
            console.log('hotAvg', hotAvg);
            const maxAttempts = Math.ceil(hotAvg * 1.5);

            for (let [n, attempts] of bets) {
                if (attempts >= maxAttempts) {
                    this.bets.delete(n);
                    ignoreNumbers.push(n);
                } else {
                    this.bets.set(n, attempts + 1);
                }
            }
        }

        const nextBets = this.coldNumbers - this.bets.size;

        for (let i = 0; i < nextBets; i++) {
            const next = this.getColdNumber(ignoreNumbers);
            this.bets.set(next, 1);
        }

        return this.bets.entries();
    }

    getColdNumber(ignoreNumbers) {
        const numbers = Array.from(this.orders.entries()).filter(([n]) => {
            return !this.bets.has(n) && !ignoreNumbers.includes(n);
        });

        numbers.sort((a, b) => {
            const [,ao = 0] = a;
            const [,bo = 0] = b;

            return bo - ao;
        });

        let [next] = currentGame.numbers;

        if (numbers.length) {
            next = numbers[0][0];
        }

        return next;
    }
}

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
    const current = forNumber || last;
    const list = forNumber ? currentGame.numbers : prev;

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
