function table() {
    const container = document.querySelector('.table');
    const list = container.querySelectorAll('span, .zero');

    for (let element of list) {
        element..addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
                if (!expired) {
                    expired = e.timeStamp + 400
                } else if (e.timeStamp <= expired) {
                    // remove the default of this event ( Zoom )
                    e.preventDefault()
                    const n = parseInt(e.target.textContent);
                    if (!isNaN(n)) {
                        addNumber(n);
                    }
                    // then reset the variable for other "double Touches" event
                    expired = null
                } else {
                    // if the second touch was expired, make it as it's the first
                    expired = e.timeStamp + 400
                }
            }
        })
    }
}
