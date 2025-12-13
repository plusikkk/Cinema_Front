// --- НАЛАШТУВАННЯ ---
// Вкажіть тут адресу вашого БЕКЕНДУ (API)
const API_BASE_URL = "http://127.0.0.1:8001";

// Змінні з HTML
const seatsContainer = document.getElementById('seats-container');
const countSpan = document.getElementById('count');
const totalSpan = document.getElementById('total');
const payBtn = document.getElementById('pay-btn');
const useBonusesCheckbox = document.getElementById('use-bonuses');
const userBonusesDisplay = document.getElementById('user-bonuses-display');

// Стан сторінки
let ticketPrice = 0;
let selectedSeats = []; // Масив ID обраних місць
let userBalance = 0;    // Баланс користувача

// --- ДОПОМІЖНІ ФУНКЦІЇ ---

// Отримання токена авторизації
function getAuthToken() {
    return localStorage.getItem('access_token'); // Перевірте, як ви зберігаєте токен при логіні
}

// Заголовки для запитів
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// --- 1. ОТРИМАННЯ ДАНИХ КОРИСТУВАЧА (БОНУСИ) ---
async function loadUserProfile() {
    const token = getAuthToken();

    if (!token) {
        userBonusesDisplay.innerText = "Увійдіть для використання";
        useBonusesCheckbox.disabled = true;
        return;
    }

    try {
        // Ендпоінт для отримання даних юзера (перевірте свій URL, часто це /api/auth/me/ або /api/users/me/)
        const response = await fetch(`${API_BASE_URL}/api/auth/userprofile/`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();

            // 🔥 ВАЖЛИВО: Беремо дані згідно твого UserSerializer
            // У тебе User -> profile -> bonus_balance
            if (data.profile && data.profile.bonus_balance !== undefined) {
                userBalance = data.profile.bonus_balance;
            } else {
                userBalance = 0;
            }

            userBonusesDisplay.innerText = userBalance;
            useBonusesCheckbox.disabled = false;
        } else {
            console.error("Не вдалося завантажити профіль");
            userBonusesDisplay.innerText = "Помилка";
        }
    } catch (error) {
        console.error("Помилка з'єднання (User):", error);
    }
}

// --- 2. ЗАВАНТАЖЕННЯ КАРТИ МІСЦЬ ---
async function loadSeats() {
    // sessionId береться з глобальної змінної в HTML
    if (!sessionId) {
        console.error("Session ID is missing");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/seats/`, {
            method: 'GET',
            // Тут авторизація зазвичай не обов'язкова, але можна додати
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Помилка завантаження місць');

        const data = await response.json();

        // Оновлюємо інфо про фільм (якщо є елементи в HTML)
        const titleEl = document.getElementById('movie-title');
        const infoEl = document.getElementById('session-info');

        if (titleEl) titleEl.innerText = data.movie_title || "Фільм";
        if (infoEl) infoEl.innerText = `${data.cinema_name || ''}, ${data.hall_name || ''} | ${data.start_time ? new Date(data.start_time).toLocaleString('uk-UA') : ''}`;

        ticketPrice = data.session_price;
        renderSeats(data.seats);

    } catch (error) {
        console.error(error);
        alert('Не вдалося завантажити схему залу.');
    }
}

// --- 3. МАЛЮВАННЯ СІТКИ (РЕНДЕР) ---
function renderSeats(seats) {
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

        // Сортуємо місця в ряду
        const rowSeats = rowsMap[rowNum].sort((a, b) => a.num - b.num);

        rowSeats.forEach(seat => {
            const seatDiv = document.createElement('div');
            seatDiv.classList.add('seat');

            // Якщо місце зайняте
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

// --- 4. ЛОГІКА ВИБОРУ МІСЦЯ ---
function toggleSeat(seatDiv, seatId) {
    if (seatDiv.classList.contains('selected')) {
        seatDiv.classList.remove('selected');
        selectedSeats = selectedSeats.filter(id => id !== seatId);
    } else {
        seatDiv.classList.add('selected');
        selectedSeats.push(seatId);
    }
    updateSummary();
}

function updateSummary() {
    const count = selectedSeats.length;
    countSpan.innerText = count;
    totalSpan.innerText = count * ticketPrice;
}

// --- 5. ЛОГІКА ОПЛАТИ (CreateOrder) ---
payBtn.addEventListener('click', async () => {
    if (selectedSeats.length === 0) {
        alert('Будь ласка, оберіть хоча б одне місце.');
        return;
    }

    // Перевірка авторизації перед покупкою
    if (!getAuthToken()) {
        alert("Будь ласка, увійдіть в акаунт, щоб купити квитки.");
        // Тут можна зробити редірект на логін
        // window.location.href = '/login/';
        return;
    }

    const payload = {
        session_id: sessionId,
        seat_id: selectedSeats,
        use_bonuses: useBonusesCheckbox.checked
    };

    payBtn.disabled = true; // Блокуємо кнопку, щоб не натиснули двічі
    payBtn.innerText = "Обробка...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/create/`, {
            method: 'POST',
            headers: getHeaders(), // Тут обов'язково треба токен!
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            // ВАРІАНТ А: Повна оплата бонусами
            if (result.status === 'success' && result.message === 'Paid by bonuses') {
                alert("Квитки успішно куплені за бонуси!");
                window.location.reload(); // Або перехід на сторінку "Мої квитки"
            }
            // ВАРІАНТ Б: Треба доплатити через LiqPay
            else if (result.data && result.signature) {
                submitLiqPay(result.data, result.signature);
            }
        } else {
            // Обробка помилок (наприклад, вік < 16)
            alert(result.error || "Помилка при створенні замовлення");
            payBtn.disabled = false;
            payBtn.innerText = "Оплатити";
        }

    } catch (error) {
        console.error("Payment Error:", error);
        alert("Помилка з'єднання з сервером.");
        payBtn.disabled = false;
        payBtn.innerText = "Оплатити";
    }
});

// --- 6. ВІДПРАВКА ФОРМИ LIQPAY ---
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

// --- СТАРТ ---
// Спочатку завантажуємо місця, потім дані профілю
document.addEventListener('DOMContentLoaded', () => {
    loadSeats();
    loadUserProfile();
});