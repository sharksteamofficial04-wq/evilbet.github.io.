
let couponItems = JSON.parse(localStorage.getItem('couponItems')) || [];
let betHistory = JSON.parse(localStorage.getItem('betHistory')) || [];
let balance = parseFloat(localStorage.getItem('balance')) || 0;
let referrals = JSON.parse(localStorage.getItem('referals')) || [];
let referralCode = localStorage.getItem('referralCode') || Math.floor(100000 + Math.random() * 900000).toString();
let userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
let supportMessages = JSON.parse(localStorage.getItem('supportMessages')) || [];

function initCoupon() {
    localStorage.setItem('referralCode', referralCode);
    localStorage.setItem('userId', userId);
    localStorage.setItem('referals', JSON.stringify(referrals));
    loadCoupon();
    updateCoupon();
    updateBetHistory();
    renderSupportChat();
    const stakeInput = document.getElementById('stakeInput');
    const placeBetBtn = document.getElementById('placeBetBtn');
    const clearCouponBtn = document.querySelector('.clear-coupon');
    const tabs = document.querySelectorAll('.coupon-tab');
    if (stakeInput) stakeInput.addEventListener('input', updateCoupon);
    if (placeBetBtn) placeBetBtn.addEventListener('click', placeBet);
    if (clearCouponBtn) clearCouponBtn.addEventListener('click', clearCoupon);
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const bets = document.getElementById('couponItems');
            const history = document.getElementById('couponHistory');
            if (bets && history) {
                if (tab.dataset.tab === 'bets') {
                    bets.style.display = 'block';
                    history.style.display = 'none';
                } else {
                    bets.style.display = 'none';
                    history.style.display = 'block';
                    updateCouponHistory();
                }
            }
        });
    });
}

function loadCoupon() {
    couponItems = JSON.parse(localStorage.getItem('couponItems')) || [];
}

function saveCoupon() {
    localStorage.setItem('couponItems', JSON.stringify(couponItems));
}

function getCouponItems() {
    return couponItems;
}

function addToCoupon(event, bet, odds, matchId) {
    const exists = couponItems.find(c => c.event === event && c.bet === bet && c.matchId === matchId);
    if (!exists && !isNaN(odds)) {
        couponItems.push({ event, bet, odds, matchId });
        saveCoupon();
        return true;
    }
    return false;
}

function removeFromCouponByEvent(event, bet, matchId) {
    couponItems = couponItems.filter(c => !(c.event === event && c.bet === bet && c.matchId === matchId));
    saveCoupon();
    highlightSelectedOdds();
}

function updateCoupon() {
    const couponItemsDiv = document.getElementById('couponItems');
    const totalOddsDiv = document.getElementById('totalOdds');
    const potentialWinDiv = document.getElementById('potentialWin');
    const stakeInput = document.getElementById('stakeInput');
    const placeBetBtn = document.getElementById('placeBetBtn');

    if (!couponItemsDiv || !totalOddsDiv || !potentialWinDiv || !stakeInput || !placeBetBtn) return;

    couponItemsDiv.innerHTML = couponItems.length === 0 ? '<div class="coupon-empty">Выберите события для ставки</div>' : '';
    couponItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'coupon-item';
        div.innerHTML = `
            <div class="coupon-event">${item.event}</div>
            <div class="coupon-bet">${item.bet}</div>
            <div class="coupon-odds">
                <span class="odds-number">${item.odds.toFixed(2)}</span>
                <button class="remove-bet" data-event="${item.event}" data-bet="${item.bet}" data-match-id="${item.matchId}">×</button>
            </div>
        `;
        couponItemsDiv.appendChild(div);
        div.querySelector('.remove-bet').addEventListener('click', () => {
            removeFromCouponByEvent(item.event, item.bet, item.matchId);
            updateCoupon();
        });
    });

    const totalOdds = couponItems.reduce((acc, item) => acc * item.odds, 1);
    const stake = parseFloat(stakeInput.value) || 0;
    const potentialWin = totalOdds * stake;

    totalOddsDiv.textContent = totalOdds.toFixed(2);
    potentialWinDiv.textContent = potentialWin.toFixed(2);
    placeBetBtn.disabled = couponItems.length === 0 || stake <= 0 || stake > balance;
}

function clearCoupon() {
    couponItems = [];
    saveCoupon();
    updateCoupon();
    highlightSelectedOdds();
    document.getElementById('betCoupon')?.classList.remove('visible');
}

function placeBet() {
    const stakeInput = document.getElementById('stakeInput');
    if (!stakeInput) return;
    const stake = parseFloat(stakeInput.value) || 0;
    if (stake <= 0 || stake > balance) {
        showNotification('Недостаточно средств или неверная сумма');
        return;
    }
    balance -= stake;
    const totalOdds = couponItems.reduce((acc, item) => acc * item.odds, 1);
    const potentialWin = totalOdds * stake;
    const eventsWithStatus = couponItems.map(eventItem => ({
        ...eventItem,
        status: Math.random() < 0.33 ? 'win' : Math.random() < 0.66 ? 'lose' : 'pending'
    }));
    const overallStatus = eventsWithStatus.every(e => e.status === 'win') ? 'win' :
                          eventsWithStatus.some(e => e.status === 'lose') ? 'lose' : 'pending';
    const bet = {
        id: Date.now(),
        type: getBetType(eventsWithStatus),
        events: eventsWithStatus,
        stake,
        totalOdds: totalOdds.toFixed(2),
        potentialWin: potentialWin.toFixed(2),
        date: new Date().toLocaleString('ru-RU'),
        status: overallStatus
    };
    betHistory.push(bet);
    localStorage.setItem('betHistory', JSON.stringify(betHistory));
    localStorage.setItem('balance', balance);
    updateBalance();
    updateBetHistory();
    updateCouponHistory();
    clearCoupon();
    showNotification('Ставка размещена!');
}

function updateBetHistory() {
    const historyItemsDiv = document.getElementById('historyItems');
    if (!historyItemsDiv) return;
    historyItemsDiv.innerHTML = betHistory.length === 0 ? '<div class="coupon-empty">Нет ставок</div>' : '';
    betHistory.slice().reverse().forEach(bet => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div>Дата: ${bet.date}</div>
            <div>Тип: ${bet.type}</div>
            <div>События: ${bet.events.map(e => `${e.event} (${e.bet})`).join(', ')}</div>
            <div>Ставка: ${bet.stake.toFixed(2)}$</div>
            <div>Коэффициент: ${bet.totalOdds}</div>
            <div>Возможный выигрыш: ${bet.potentialWin}$</div>
            <div>Статус: ${getStatusText(bet.status)}</div>
        `;
        historyItemsDiv.appendChild(div);
    });
}

function updateCouponHistory() {
    const couponHistoryDiv = document.getElementById('couponHistory');
    if (!couponHistoryDiv) return;
    couponHistoryDiv.innerHTML = betHistory.length === 0 ? '<div class="coupon-empty">Нет ставок</div>' : '';
    betHistory.slice().reverse().forEach(bet => {
        const div = document.createElement('div');
        div.className = `coupon-history-item ${bet.type.toLowerCase()}`;
        div.onclick = () => openBetDetails(bet.id);
        div.innerHTML = `
            <div class="history-type">${bet.type}</div>
            <div class="history-date">${bet.date}</div>
            <div class="history-event">${bet.events.map(e => e.event).join(', ')}</div>
            <div class="history-details">
                <div class="history-bet">${bet.events.map(e => e.bet).join(', ')}</div>
                <div class="history-odds">${bet.totalOdds}</div>
                <div class="history-status ${bet.status}">${getStatusText(bet.status)}</div>
            </div>
            <div class="history-details">
                <div class="history-bet">Ставка: ${bet.stake.toFixed(2)}$</div>
                <div class="history-odds">Выигрыш: ${bet.potentialWin}$</div>
            </div>
        `;
        couponHistoryDiv.appendChild(div);
    });
}

function getBetType(events) {
    return events.length === 1 ? 'ОРДИНАР' : 'ЭКСПРЕСС';
}

function getStatusText(status) {
    switch (status) {
        case 'win': return 'Выиграл';
        case 'lose': return 'Проиграл';
        case 'pending': return 'В ожидании';
        default: return 'Неизвестно';
    }
}

function highlightSelectedOdds() {
    document.querySelectorAll('.odds-item').forEach(item => {
        const event = item.dataset.event;
        const bet = item.dataset.bet;
        const matchId = parseInt(item.dataset.matchId);
        const exists = couponItems.find(c => c.event === event && c.bet === bet && c.matchId === matchId);
        item.classList.toggle('selected', !!exists);
    });
}

function openBetDetails(betId) {
    const bet = betHistory.find(b => b.id === betId);
    if (!bet) return;
    const title = document.getElementById('betDetailsTitle');
    const content = document.getElementById('betDetailsContent');
    if (!title || !content) return;
    title.textContent = `Детали ставки ${betId} (${bet.type})`;
    content.innerHTML = `
        <div>Дата: ${bet.date}</div>
        <div>Ставка: ${bet.stake.toFixed(2)}$ | Коэффициент: ${bet.totalOdds} | Выигрыш: ${bet.potentialWin}$</div>
        <div>Общий статус: ${getStatusText(bet.status)}</div>
        <div style="margin-top: 10px;">
            ${bet.events.map((e, index) => `
                <div class="bet-details-item">
                    <div class="bet-details-event">${e.event} - ${e.bet} (${e.odds.toFixed(2)})</div>
                    <div class="bet-details-status ${e.status}">${getStatusText(e.status)}</div>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('betDetailsModal')?.classList.add('show');
}

function closeBetDetails() {
    document.getElementById('betDetailsModal')?.classList.remove('show');
}

function updateBalance(amount = 0) {
    if (amount > 0) balance += amount;
    localStorage.setItem('balance', balance);
    const balanceDisplay = document.getElementById('balanceDisplay');
    if (balanceDisplay) {
        balanceDisplay.textContent = `${balance.toFixed(2)}$`;
    }
}

function renderSupportChat() {
    const chat = document.getElementById('supportChat');
    if (!chat) return;
    chat.innerHTML = '';
    supportMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.type}`;
        div.innerHTML = `
            <div class="message-text">${msg.text}</div>
            <div class="message-time">${msg.time}</div>
        `;
        chat.appendChild(div);
    });
    chat.scrollTop = chat.scrollHeight;
}

function sendSupportMessage() {
    const input = document.getElementById('supportInput');
    if (!input || !input.value.trim()) return;
    const message = {
        id: Date.now(),
        text: input.value.trim(),
        time: new Date().toLocaleTimeString('ru-RU'),
        type: 'user'
    };
    supportMessages.push(message);
    localStorage.setItem('supportMessages', JSON.stringify(supportMessages));
    renderSupportChat();
    input.value = '';
}

function showNotification(message) {
    const notification = document.getElementById('global-notification');
    if (!notification) return;
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Экспорт функций
window.initCoupon = initCoupon;
window.addToCoupon = addToCoupon;
window.removeFromCouponByEvent = removeFromCouponByEvent;
window.updateCoupon = updateCoupon;
window.getCouponItems = getCouponItems;
window.updateBalance = updateBalance;
window.updateBetHistory = updateBetHistory;
window.renderSupportChat = renderSupportChat;
window.sendSupportMessage = sendSupportMessage;
window.showNotification = showNotification;
window.highlightSelectedOdds = highlightSelectedOdds;
window.closeBetDetails = closeBetDetails;
