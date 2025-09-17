let couponItems = [];
let betHistory = JSON.parse(localStorage.getItem('betHistory')) || [];
let balance = parseFloat(localStorage.getItem('balance')) || 0;
let referrals = JSON.parse(localStorage.getItem('referrals')) || [];
let referralCode = localStorage.getItem('referralCode') || generateReferralCode();
let userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);

document.addEventListener('DOMContentLoaded', () => {
    console.log('Инициализация: betHistory=', betHistory, 'referrals=', referrals, 'balance=', balance);
    localStorage.setItem('referralCode', referralCode);
    localStorage.setItem('userId', userId);
    initCoupon();
    initReferrals();
    updateBalance();
    updateBetHistory();
    updateCouponHistory();
});

function generateReferralCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function initReferrals() {
    const page = window.location.pathname;
    if (!page.includes('referal.html')) return;

    updateReferralStats();
    
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const textElement = this.previousElementSibling.querySelector('span');
            const text = textElement.textContent;
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Скопировано!');
                setTimeout(() => {
                    button.textContent = 'Копировать';
                }, 2000);
            });
        });
    });
}

function addReferral(referralId, referredBy) {
    const existing = referrals.find(r => r.id === referralId);
    if (!existing) {
        referrals.push({
            id: referralId,
            referredBy,
            joinDate: new Date().toLocaleString(),
            totalBets: 0,
            active: false,
            transactions: 0
        });
        localStorage.setItem('referrals', JSON.stringify(referrals));
        updateReferralStats();
        console.log('Добавлен реферал:', referralId, 'referredBy:', referredBy);
    }
}

function updateReferralStats() {
    const page = window.location.pathname;
    if (!page.includes('referal.html')) return;

    const referralLevelEl = document.getElementById('referralLevel');
    const referralCountEl = document.getElementById('referralCount');
    const referralEarnedEl = document.getElementById('referralEarned');
    const referralAvailableEl = document.getElementById('referralAvailable');
    const progressTextEl = document.getElementById('progressText');
    const progressFillEl = document.getElementById('progressFill');
    const referralCodeEl = document.getElementById('referralCode');
    const referralLinkEl = document.getElementById('referralLink');
    const withdrawableEl = document.getElementById('withdrawable');
    const referralBonusEl = document.getElementById('referralBonus');
    const reqLevelEl = document.getElementById('reqLevel');
    const reqTransactionsEl = document.getElementById('reqTransactions');
    const reqStatusEl = document.getElementById('reqStatus');

    referrals = JSON.parse(localStorage.getItem('referrals')) || [];
    
    const myReferrals = referrals.filter(r => r.referredBy === userId);
    const activeReferrals = myReferrals.filter(r => r.active).length;
    const totalEarned = myReferrals.reduce((sum, r) => sum + (r.totalBets * getReferralPercentage(getReferralLevel(activeReferrals))), 0);
    const available = myReferrals.filter(r => r.transactions >= 2).reduce((sum, r) => sum + (r.totalBets * getReferralPercentage(getReferralLevel(activeReferrals))), 0);
    
    const level = getReferralLevel(activeReferrals);
    const levelRequirements = [
        { level: 1, referrals: 5, percent: 0.01 },
        { level: 2, referrals: 10, percent: 0.012 },
        { level: 3, referrals: 20, percent: 0.013 },
        { level: 4, referrals: 50, percent: 0.014 }
    ];
    const currentLevel = levelRequirements.find(l => l.level === level) || levelRequirements[0];
    const nextLevel = levelRequirements.find(l => l.level === level + 1);
    const progress = nextLevel ? Math.min(activeReferrals / nextLevel.referrals * 100, 100) : 100;

    if (referralLevelEl) referralLevelEl.textContent = level;
    if (referralCountEl) referralCountEl.textContent = activeReferrals;
    if (referralEarnedEl) referralEarnedEl.textContent = totalEarned.toFixed(2) + '$';
    if (referralAvailableEl) referralAvailableEl.textContent = available.toFixed(2) + '$';
    if (progressTextEl) progressTextEl.textContent = `${activeReferrals} / ${nextLevel ? nextLevel.referrals : currentLevel.referrals}`;
    if (progressFillEl) progressFillEl.style.width = `${progress}%`;
    if (referralCodeEl) referralCodeEl.textContent = referralCode;
    if (referralLinkEl) referralLinkEl.textContent = `https://evil.bet/ref/${referralCode}`;
    if (withdrawableEl) withdrawableEl.textContent = available.toFixed(2) + '$';
    if (referralBonusEl) referralBonusEl.textContent = totalEarned.toFixed(2) + '$';
    if (reqLevelEl) reqLevelEl.textContent = `Min. Level ${level >= 3 ? '✓' : 3}`;
    if (reqTransactionsEl) reqTransactionsEl.textContent = `${myReferrals.reduce((sum, r) => sum + r.transactions, 0)} / 2 подтвержденные транзакции ${myReferrals.reduce((sum, r) => sum + r.transactions, 0) >= 2 ? '✓' : ''}`;
    if (reqStatusEl) reqStatusEl.textContent = `Статус аккаунта: ${level >= 3 && myReferrals.reduce((sum, r) => sum + r.transactions, 0) >= 2 ? 'Verified' : 'Unverified'}`;

    document.querySelectorAll('.level-item').forEach(item => {
        const lvl = parseInt(item.getAttribute('data-level'));
        const req = levelRequirements.find(l => l.level === lvl);
        item.classList.toggle('level-active', lvl === level);
        const progressEl = item.querySelector('.level-progress');
        if (progressEl) progressEl.textContent = `${activeReferrals} / ${req.referrals} рефералов`;
    });

    console.log('Обновлены реферальные данные: level=', level, 'activeReferrals=', activeReferrals, 'earned=', totalEarned);
}

function getReferralLevel(activeReferrals) {
    if (activeReferrals >= 50) return 4;
    if (activeReferrals >= 20) return 3;
    if (activeReferrals >= 10) return 2;
    return 1;
}

function getReferralPercentage(level) {
    const percentages = { 1: 0.01, 2: 0.012, 3: 0.013, 4: 0.014 };
    return percentages[level] || 0.01;
}

function updateReferralBets(referralId, betAmount) {
    referrals = JSON.parse(localStorage.getItem('referrals')) || [];
    const referral = referrals.find(r => r.id === referralId);
    if (referral) {
        referral.totalBets += betAmount;
        referral.active = true;
        referral.transactions += 1;
        localStorage.setItem('referrals', JSON.stringify(referrals));
        updateReferralStats();
        console.log('Обновлены ставки реферала:', referralId, 'totalBets=', referral.totalBets);
    }
}

function initCoupon() {
    loadCoupon();
    updateCoupon();
    
    const stakeInput = document.getElementById('stakeInput');
    const placeBetBtn = document.getElementById('placeBetBtn');
    const clearCouponBtn = document.querySelector('.clear-coupon');
    
    if (stakeInput) {
        stakeInput.addEventListener('input', updateCoupon);
    }
    
    if (placeBetBtn) {
        placeBetBtn.addEventListener('click', placeBet);
    }
    
    if (clearCouponBtn) {
        clearCouponBtn.addEventListener('click', clearCoupon);
    }
}

function loadCoupon() {
    const savedCoupon = localStorage.getItem('globalCoupon');
    if (savedCoupon) {
        couponItems = JSON.parse(savedCoupon);
    }
    console.log('Загружен купон:', couponItems);
}

function saveCoupon() {
    localStorage.setItem('globalCoupon', JSON.stringify(couponItems));
    console.log('Сохранен купон:', couponItems);
}

function clearCoupon() {
    couponItems = [];
    updateCoupon();
    saveCoupon();
    document.querySelectorAll('.odds-item').forEach(item => item.classList.remove('selected'));
}

function addToCoupon(event, bet, odds, matchId) {
    if (couponItems.some(item => item.matchId === matchId)) {
        showNotification('Нельзя выбрать два события из одного матча!');
        return false;
    }
    if (!isInCoupon(event, bet, matchId)) {
        couponItems.push({ event, bet, odds: parseFloat(odds), matchId });
        updateCoupon();
        saveCoupon();
        return true;
    }
    return false;
}

function removeFromCoupon(index) {
    couponItems.splice(index, 1);
    updateCoupon();
    saveCoupon();
}

function isInCoupon(event, bet, matchId) {
    return couponItems.some(item => 
        item.event === event && item.bet === bet && item.matchId === matchId
    );
}

function removeFromCouponByEvent(eventName, betType, matchId) {
    const index = couponItems.findIndex(item => 
        item.event === eventName && item.bet === betType && item.matchId === matchId
    );
    if (index !== -1) {
        removeFromCoupon(index);
    }
}

function isCouponNotEmpty() {
    return couponItems.length > 0;
}

function updateCoupon() {
    const couponContainer = document.getElementById('couponItems');
    const totalOddsElement = document.getElementById('totalOdds');
    const potentialWinElement = document.getElementById('potentialWin');
    const placeBetBtn = document.getElementById('placeBetBtn');
    const betCoupon = document.querySelector('.bet-coupon');
    
    if (!couponContainer) {
        console.error('couponItems не найден');
        return;
    }
    
    couponContainer.innerHTML = '';
    
    if (couponItems.length === 0) {
        couponContainer.innerHTML = '<div class="coupon-empty">Выберите события для ставки</div>';
        if (totalOddsElement) totalOddsElement.textContent = '1.00';
        if (potentialWinElement) potentialWinElement.textContent = '0.00';
        if (placeBetBtn) placeBetBtn.disabled = true;
        if (betCoupon) betCoupon.classList.remove('visible');
        return;
    }
    
    let totalOdds = 1;
    
    couponItems.forEach((item, index) => {
        totalOdds *= item.odds;
        
        const couponItem = document.createElement('div');
        couponItem.className = 'coupon-item';
        couponItem.innerHTML = `
            <div class="coupon-event">${item.event}</div>
            <div class="coupon-bet">${item.bet}</div>
            <div class="coupon-odds">
                <div class="odds-number">${item.odds}</div>
                <div class="remove-bet" onclick="removeFromCoupon(${index}); highlightSelectedOdds();">×</div>
            </div>
        `;
        couponContainer.appendChild(couponItem);
    });
    
    if (totalOddsElement) totalOddsElement.textContent = totalOdds.toFixed(2);
    
    const stakeInput = document.getElementById('stakeInput');
    const stake = stakeInput ? parseFloat(stakeInput.value) || 0 : 0;
    if (potentialWinElement) potentialWinElement.textContent = (totalOdds * stake).toFixed(2);
    
    if (placeBetBtn) placeBetBtn.disabled = stake <= 0 || stake > balance;
    if (betCoupon) betCoupon.classList.add('visible');
}

function placeBet() {
    const stakeInput = document.getElementById('stakeInput');
    const stake = parseFloat(stakeInput.value) || 0;
    
    if (stake <= 0 || stake > balance) {
        showNotification('Недостаточно средств или неверная сумма ставки');
        return;
    }
    
    const totalOdds = parseFloat(document.getElementById('totalOdds').textContent);
    const potentialWin = (totalOdds * stake).toFixed(2);
    
    const bet = {
        date: new Date().toLocaleString(),
        events: couponItems.map(item => ({ event: item.event, bet: item.bet, odds: item.odds })),
        stake,
        totalOdds,
        potentialWin,
        status: 'Pending'
    };
    
    betHistory.push(bet);
    localStorage.setItem('betHistory', JSON.stringify(betHistory));
    
    const urlParams = new URLSearchParams(window.location.search);
    const referredBy = urlParams.get('ref');
    if (referredBy) {
        updateReferralBets('user_' + referredBy, stake);
    }
    
    balance -= stake;
    localStorage.setItem('balance', balance);
    updateBalance();
    
    showNotification(`Ставка на ${stake}$ принята! Потенциальный выигрыш: ${potentialWin}$`);
    clearCoupon();
    updateBetHistory();
    updateCouponHistory();
}

function updateBalance() {
    const balanceDisplay = document.getElementById('balanceDisplay');
    const profileBalance = document.getElementById('profileBalance');
    if (balanceDisplay) balanceDisplay.textContent = `${balance.toFixed(2)}$`;
    if (profileBalance) profileBalance.textContent = `${balance.toFixed(2)}$`;
    console.log('Баланс обновлен:', balance);
}

function updateBetHistory() {
    const betHistoryList = document.getElementById('betHistoryList');
    if (!betHistoryList) {
        console.error('betHistoryList не найден');
        return;
    }
    
    betHistory = JSON.parse(localStorage.getItem('betHistory')) || [];
    console.log('Обновление истории ставок:', betHistory);
    
    betHistoryList.innerHTML = '';
    if (betHistory.length === 0) {
        betHistoryList.innerHTML = '<div class="history-item">Нет ставок</div>';
        return;
    }
    
    betHistory.forEach((bet, index) => {
        const betEl = document.createElement('div');
        betEl.className = 'history-item';
        betEl.innerHTML = `
            <div class="history-date">${bet.date}</div>
            <div class="history-event">${bet.events.map(e => `${e.event} - ${e.bet} (${e.odds})`).join(', ')}</div>
            <div class="history-details">Ставка: ${bet.stake}$ | Коэф: ${bet.totalOdds.toFixed(2)} | Выигрыш: ${bet.potentialWin}$ | Статус: ${bet.status}</div>
        `;
        betHistoryList.appendChild(betEl);
    });
}

function updateCouponHistory() {
    const couponHistory = document.getElementById('couponHistory');
    if (!couponHistory) {
        console.error('couponHistory не найден');
        return;
    }
    
    betHistory = JSON.parse(localStorage.getItem('betHistory')) || [];
    console.log('Обновление истории в купоне:', betHistory);
    
    couponHistory.innerHTML = '';
    if (betHistory.length === 0) {
        couponHistory.innerHTML = '<div class="coupon-empty">Нет ставок</div>';
        return;
    }
    
    betHistory.slice(-5).reverse().forEach(bet => {
        const betEl = document.createElement('div');
        betEl.className = 'coupon-item';
        betEl.innerHTML = `
            <div class="coupon-event">${bet.date}</div>
            <div class="coupon-bet">${bet.events.map(e => `${e.event} - ${e.bet} (${e.odds})`).join(', ')}</div>
            <div class="coupon-odds">
                <div class="odds-number">Ставка: ${bet.stake}$ | Выигрыш: ${bet.potentialWin}$</div>
                <div class="remove-bet">Статус: ${bet.status}</div>
            </div>
        `;
        couponHistory.appendChild(betEl);
    });
}

function showNotification(message) {
    let notification = document.getElementById('global-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'global-notification';
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.style.opacity = '1';
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

function highlightSelectedOdds() {
    document.querySelectorAll('.odds-item').forEach(item => {
        const event = item.getAttribute('data-event');
        const bet = item.getAttribute('data-bet');
        const matchId = item.getAttribute('data-match-id');
        if (isInCoupon(event, bet, matchId)) {
            item.classList.add('selected');
            const betCoupon = document.querySelector('.bet-coupon');
            if (betCoupon) betCoupon.classList.add('visible');
        }
    });
}