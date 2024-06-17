function table() {
    const container = document.querySelector('.table');
    const list = container.querySelectorAll('span, .zero');

    for (let element of list) {
        element.addEventListener('click', function(e) {
            const n = parseInt(e.target.textContent);
            if (!isNaN(n)) {
                addNumber(n);
            }
        })
    }
}
