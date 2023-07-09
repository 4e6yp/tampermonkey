const connectButtons = [...document.querySelectorAll('.artdeco-button.artdeco-button--2.artdeco-button--secondary.ember-view.full-width:not(.artdeco-button--muted)')];

connectButtons.forEach((button, index) => {
    if (button.innerText !== 'Connect') return;
    setTimeout(() => {
        button?.click()
    }, 100 * (index + 1))
})