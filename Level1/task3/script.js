const display = document.getElementById('display');
const impactResult = document.getElementById('impactResult');
const buttons = document.querySelectorAll('.btn[data-value]');
const clearBtn = document.getElementById('clear');
const calculateBtn = document.getElementById('calculate');

let currentInput = '';

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentInput.length < 7) {
            if (currentInput === '0') currentInput = '';
            currentInput += btn.getAttribute('data-value');
            display.textContent = `$${Number(currentInput).toLocaleString()}`;
        }
    });
});

clearBtn.addEventListener('click', () => {
    currentInput = '';
    display.textContent = '$0';
    impactResult.textContent = '';
});

calculateBtn.addEventListener('click', () => {
    const amount = parseInt(currentInput, 10) || 0;
    if (amount === 0) {
        impactResult.textContent = 'Please enter a donation amount.';
        return;
    }
    // Example: 1 dollar plants 2 trees
    const treesPlanted = amount * 2;
    impactResult.textContent = `Your donation of $${amount} can plant approximately ${treesPlanted} trees! 🌳`;
});
