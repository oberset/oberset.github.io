function addValue(key, value) {
    let data;

    if (typeof value === 'object' && value !== null) {
        data = JSON.stringify(value);
    } else if (value !== undefined) {
        data = value.toString();
    }

    localStorage.setItem(key, data);
}

function getValue(key) {
    return JSON.parse(localStorage.getItem(key));
}

function clearValue(key) {
    localStorage.removeItem(key);
}

function getEventListeners(event) {
    if (EVENTS.has(event)) {
        return EVENTS.get(event);
    }
    return [];
}

function addEventListener(event, listener) {
    if (EVENTS.has(event)) {
        const list = EVENTS.get(event);
        list.push(listener);
        EVENTS.set(event, list);
        return;
    }
    EVENTS.set(event, [listener]);
}

function emit(event) {
    getEventListeners(event).forEach((listener) => listener());
}

function createStrategyItem(template, score) {
    const element = template.cloneNode(true);
    let prefix = '';

    if (score < 0) {
        element.classList.remove('green');
        element.classList.remove('neutral');
        element.classList.add('red');
    } else if (score === 0) {
        element.classList.remove('red');
        element.classList.remove('green');
        element.classList.add('neutral');
    } else {
        element.classList.remove('red');
        element.classList.remove('neutral');
        element.classList.add('green');
        prefix = score > 0 ? '+' : '';
    }

    element.innerText = `${prefix}${score}`;

    return element;
}

function createItem(template, value) {
    const element = template.cloneNode(true);

    element.innerText = value;

    return element;
}
