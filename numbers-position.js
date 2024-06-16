function calcNumbersPosition(lineStructure, repeats) {
    const group = lineStructure.getFirstItemsGroupElement();
    const items = lineStructure.getItemsElement(group);
    const template = lineStructure.getFirstItemElement(items);

    const [hotAvg, coldAvg] = getAvgHotColdRepeats(repeats);
    const text = [hotAvg, coldAvg].join(' / ');

    const item = createHTMLElement(text, (value) => createItem(template, value));
    lineStructure.updateItems(items, item);
}
