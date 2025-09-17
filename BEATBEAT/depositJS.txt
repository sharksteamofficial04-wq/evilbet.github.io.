document.addEventListener('DOMContentLoaded', () => {
    const methods = document.querySelectorAll('.deposit-method');
    methods.forEach(method => {
        method.addEventListener('click', () => {
            methods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
        });
    });

    // Установить первый метод активным по умолчанию
    const defaultMethod = document.querySelector('.deposit-method[data-method="card"]');
    if (defaultMethod) {
        defaultMethod.classList.add('active');
    }
});

function openDepositModal() {
    const modal = document.getElementById('depositModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeDepositModal() {
    const modal = document.getElementById('depositModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function processDeposit() {
    const amountInput = document.getElementById('depositAmount');
    const methodElement = document.querySelector('.deposit-method.active');
    if (!amountInput || !methodElement) {
        showNotification('Ошибка: элементы не найдены');
        return;
    }
    const amount = parseFloat(amountInput.value) || 0;
    const method = methodElement.dataset.method;
    if (amount <= 0) {
        showNotification('Введите корректную сумму');
        return;
    }
    balance += amount;
    localStorage.setItem('balance', balance);
    updateBalance();
    showNotification(`Баланс пополнен на ${amount.toFixed(2)}$ через ${method}`);
    closeDepositModal();
}