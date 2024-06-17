function rollbackList() {
    const button = document.querySelector('.rollback');

    button.addEventListener('click', () => {
        deleteLastNumber();
    });
}
