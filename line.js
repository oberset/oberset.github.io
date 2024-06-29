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
}

class Bets {
    constructor(maxBets = 4, maxAttempts = 18, step = 2) {
        this.orders = new Map();
        this.bets = new Map();
        this.maxBets = maxBets;
        this.maxAttempts = maxAttempts;
        this.rounds = 0;
        this.began = false;
        this.attempts = 0;
        this.lastResults = [];
        this.step = step;
        this.defaultBets = maxBets;
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
        this.rounds = 1;
        this.began = false;
        this.attempts = 1;
        this.lastResults = [];
        console.log('clear');
    }

    addPosition(n) {
        const offset = getLastOffset();
        this.orders.set(n, offset);

        if (this.began) {
            this.rounds += 1;
            this.attempts += 1;
        }

        const [hotAvg] = getAvgHotColdRepeats(this.orders);

        if (hotAvg > 0) {
            this.maxAttempts = hotAvg;
        }
    }

    next(n) {
        this.addPosition(n);

        if (!this.began) {
            return [];
        }

        const ignoreNumbers = [];

        if (this.bets.has(n)) {
            this.bets.clear();
            this.lastResults.push(this.attempts);
            this.attempts = 1;
            this.maxBets = this.defaultBets;
            ignoreNumbers.push(n);
        } else {
            const maxRounds = this.maxAttempts % 2 ? this.maxAttempts + 1 : this.maxAttempts;
            
            if (this.attempts - 1 % maxRounds === 0) {
                this.maxBets = this.defaultBets;
                console.log('== Round failed ==');
                console.log(this.bets.entries());
                console.log('_________________');
                this.bets.clear();
            } else if (this.attempts - 1 % (maxRounds / 2) === 0) {
                this.maxBets = Math.round(this.defaultBets * 1.5);
            }

        }

        if (this.bets.size > 0) {
            const bets = this.bets.entries();

            for (let [n, attempts] of bets) {
                this.bets.set(n, attempts + 1);
            }
        }

        const nextBets = this.maxBets - this.bets.size;

        for (let i = 0; i < nextBets; i++) {
            const next = this.getNextBet(ignoreNumbers);
            this.bets.set(next, 1);
        }

        return this.bets.entries();
    }

    getNextBet(ignoreNumbers) {
        let max = 0;

        const list = Array.from(this.orders.entries()).filter(([n]) => {
            const offset = getLastOffset(true, n);
            const maxOffset = (this.maxAttempts * 2) + 1;
            if (offset > maxOffset) {
                return false;
            }
            return !this.bets.has(n) && !ignoreNumbers.includes(n);
        });

        let [next] = currentGame.numbers;

        for (let [n, offset] of list) {
            if (offset > max) {
                max = offset;
                next = n;
            }
        }

        return next;
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
