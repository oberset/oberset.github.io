const EVENT_TYPE = 'click';

function table() {
    const container = document.querySelector('.table');
    const list = container.querySelectorAll('span, .zero');

    for (let element of list) {
        element.addEventListener(EVENT_TYPE, (e) => {
            const n = parseInt(e.target.textContent);
            if (!isNaN(n)) {
                addNumber(n);
            }
        });
    }
}
