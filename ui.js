function createHTMLElement(numberInfo, elementConstructor) {
    return elementConstructor(numberInfo);
}

function createHTMLElements(list, elementConstructor) {
    return list.reduce((fragment, item) => {
        const element = elementConstructor(item);
        fragment.appendChild(element);
        return fragment;
    }, document.createDocumentFragment());
}
