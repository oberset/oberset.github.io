function spinsCount() {
    const lineStructure = new Line('.spins-count');

    addEventListener('add_number', () => {
        nextSpin(lineStructure);
    });

    addEventListener('delete_number', () => {
        nextSpin(lineStructure);
    });
}

function nextSpin(lineStructure, spin) {
    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const count = spin === undefined ? currentGame.numbers.length : spin;

    const item = createHTMLElement(count, (value) => createItem(template, value));

    lineStructure.updateItems(items, item);
}
