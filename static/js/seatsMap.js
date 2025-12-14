const API_BASE_URL = "http://127.0.0.1:8001";

const seatsContainer = document.getElementById('seats-container');
const countSpan = document.getElementById('count');
const totalSpan = document.getElementById('total');
const payBtn = document.getElementById('pay-btn');
const useBonusesCheckbox = document.getElementById('use-bonuses');
const userBonusesDisplay = document.getElementById('user-bonuses-display');

let ticketPrice = 0;
let selectedSeats = [];
let userBalance = 0;

function getAuthToken() {
    return localStorage.getItem('access_token');
}

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function loadUserProfile() {
    const token = getAuthToken();
    if (!token) {
        if(userBonusesDisplay) userBonusesDisplay.innerText = "Увійдіть для використання";
        if(useBonusesCheckbox) useBonusesCheckbox.disabled = true;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/userprofile/`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            if (data.profile && data.profile.bonus_balance !== undefined) {
                userBalance = data.profile.bonus_balance;
            } else if (data.bonus_balance !== undefined) {
                userBalance = data.bonus_balance;
            } else {
                userBalance = 0;
            }

            if(userBonusesDisplay) userBonusesDisplay.innerText = userBalance;
            if(useBonusesCheckbox) useBonusesCheckbox.disabled = false;
        }
    } catch (error) {
        console.error("Помилка з'єднання (User):", error);
    }
}

// ЗАВАНТАЖЕННЯ КАРТИ МІСЦЬ
async function loadSeats() {
    if (typeof sessionId === 'undefined' || !sessionId) {
        console.error("Session ID не знайдено!");
        alert("Помилка: ID сеансу відсутній.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/seats/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Помилка завантаження місць');

        const data = await response.json();

        const titleEl = document.getElementById('movie-title');
        if (titleEl && data.movie_title) titleEl.innerText = data.movie_title;

        ticketPrice = data.session_price;
        renderSeats(data.seats);

    } catch (error) {
        console.error(error);
        alert('Не вдалося завантажити схему залу.');
    }
}

function renderSeats(seats) {
    if (!seatsContainer) {
        console.error("Помилка: Не знайдено контейнер <div id='seats-container'> в HTML");
        return;
    }

    seatsContainer.innerHTML = '';

    // Групуємо місця по рядах
    const rowsMap = {};
    seats.forEach(seat => {
        if (!rowsMap[seat.row]) rowsMap[seat.row] = [];
        rowsMap[seat.row].push(seat);
    });

    const sortedRows = Object.keys(rowsMap).sort((a, b) => a - b);

    sortedRows.forEach(rowNum => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');

        const rowSeats = rowsMap[rowNum].sort((a, b) => a.num - b.num);

        rowSeats.forEach(seat => {
            const seatDiv = document.createElement('div');
            seatDiv.classList.add('seat');

            if (seat.is_occupied) {
                seatDiv.classList.add('occupied');
            } else {
                seatDiv.addEventListener('click', () => toggleSeat(seatDiv, seat.id));
            }

            seatDiv.title = `Ряд ${seat.row}, Місце ${seat.num} (${seat.price} грн)`;
            rowDiv.appendChild(seatDiv);
        });

        seatsContainer.appendChild(rowDiv);
    });
}

// ЛОГІКА ВИБОРУ МІСЦЯ
function toggleSeat(seatDiv, seatId) {
    if (seatDiv.classList.contains('selected')) {
        seatDiv.classList.remove('selected');
        selectedSeats = selectedSeats.filter(id => id !== seatId);
    } else {
        seatDiv.classList.add('selected');
        selectedSeats.push(seatId);
    }
    if(countSpan) countSpan.innerText = selectedSeats.length;
    if(totalSpan) totalSpan.innerText = selectedSeats.length * ticketPrice;
}

// ЛОГІКА ОПЛАТИ
if (payBtn) {
    payBtn.addEventListener('click', async () => {
        if (selectedSeats.length === 0) {
            alert('Будь ласка, оберіть хоча б одне місце.');
            return;
        }
        if (!getAuthToken()) {
            alert("Будь ласка, увійдіть в акаунт.");
            return;
        }

        const payload = {
            session_id: sessionId,
            seat_id: selectedSeats,
            use_bonuses: useBonusesCheckbox ? useBonusesCheckbox.checked : false
        };

        payBtn.disabled = true;
        payBtn.innerText = "Обробка...";

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/create/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                if (result.status === 'success' && result.message === 'Paid by bonuses') {
                    alert("Квитки успішно куплені за бонуси!");
                    window.location.reload();
                } else if (result.data && result.signature) {
                    submitLiqPay(result.data, result.signature);
                }
            } else {
                alert(result.error || "Помилка при створенні замовлення");
                payBtn.disabled = false;
                payBtn.innerText = "Оплатити";
            }

        } catch (error) {
            console.error("Payment Error:", error);
            payBtn.disabled = false;
            payBtn.innerText = "Оплатити";
        }
    });
}

// LIQPAY
function submitLiqPay(data, signature) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.liqpay.ua/api/3/checkout';

    const inputData = document.createElement('input');
    inputData.type = 'hidden';
    inputData.name = 'data';
    inputData.value = data;
    form.appendChild(inputData);

    const inputSig = document.createElement('input');
    inputSig.type = 'hidden';
    inputSig.name = 'signature';
    inputSig.value = signature;
    form.appendChild(inputSig);

    document.body.appendChild(form);
    form.submit();
}

document.addEventListener('DOMContentLoaded', () => {
    loadSeats();
    loadUserProfile();
});


