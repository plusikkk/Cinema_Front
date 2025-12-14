const API_BASE_URL = "http://127.0.0.1:8001";

const seatsContainer = document.getElementById('seats-container');
const payBtn = document.getElementById('pay-btn');
const useBonusesCheckbox = document.getElementById('use-bonuses');
const userBonusesDisplay = document.getElementById('user-bonuses-display');
const totalDisplay = document.getElementById('total');
const countDisplay = document.getElementById('count');
const trailerBtn = document.getElementById('sidebar-trailer-btn');

let ticketPrice = 0;
let selectedSeats = [];
let userBalance = 0;

function getAuthToken() { return localStorage.getItem('access_token'); }

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// ЮЗЕР
async function loadUserProfile() {
    const token = getAuthToken();
    if (!token) {
        if(userBonusesDisplay) userBonusesDisplay.innerText = "0";
        if(useBonusesCheckbox) useBonusesCheckbox.disabled = true;
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/userprofile/`, {
            method: 'GET', headers: getHeaders()
        });
        if (response.ok) {
            const data = await response.json();
            userBalance = (data.profile && data.profile.bonus_balance) || data.bonus_balance || 0;
            if(userBonusesDisplay) userBonusesDisplay.innerText = userBalance;
            if(useBonusesCheckbox) useBonusesCheckbox.disabled = userBalance <= 0;
        }
    } catch (error) { console.error("User Profile Error:", error); }
}

// СЕАНСИ
async function loadSeats() {
    if (typeof sessionId === 'undefined' || !sessionId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/seats/`, {
            method: 'GET', headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Load failed');

        const data = await response.json();

        const setTxt = (id, v) => { const el = document.getElementById(id); if(el) el.innerText = v; };

        const posterArea = document.getElementById('sidebar-poster-area');
        if (posterArea) {
            posterArea.innerHTML = getPosterHTML(data.poster_url, data.movie_title) + getBadgesHTML(data.badges);
        }

        setTxt('sidebar-movie-title', data.movie_title);
        setTxt('sidebar-rating', data.rating);
        setTxt('sidebar-age', `${data.age_category}+`);
        setTxt('sidebar-duration', data.duration);

        setTxt('sidebar-cinema', data.cinema_name);
        setTxt('sidebar-hall', data.hall_name);

        if (data.start_time) {
            const d = new Date(data.start_time);
            setTxt('sidebar-date', d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }));
            setTxt('sidebar-time', d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }));
        }

        if (trailerBtn) {
            if(data.trailer_url) { trailerBtn.href = data.trailer_url; trailerBtn.style.display = 'flex'; }
            else trailerBtn.style.display = 'none';
        }

        ticketPrice = data.session_price;
        renderSeats(data.seats);
        updateTotal();

    } catch (error) { console.error(error); }
}

// СИДІННЯ
function renderSeats(seats) {
    if (!seatsContainer) return;
    seatsContainer.innerHTML = '';

    const rowsMap = {};
    seats.forEach(s => { if (!rowsMap[s.row]) rowsMap[s.row] = []; rowsMap[s.row].push(s); });
    const sortedRows = Object.keys(rowsMap).sort((a, b) => a - b);

    sortedRows.forEach(r => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');
        rowsMap[r].sort((a, b) => a.num - b.num).forEach(s => {
            const seatDiv = document.createElement('div');
            seatDiv.classList.add('seat');
            if (s.is_occupied) {
                seatDiv.classList.add('occupied');
            } else {
                seatDiv.addEventListener('click', () => toggleSeat(seatDiv, s.id));
            }
            rowDiv.appendChild(seatDiv);
        });
        seatsContainer.appendChild(rowDiv);
    });
}

function toggleSeat(el, id) {
    if (el.classList.contains('selected')) {
        el.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s !== id);
    } else {
        el.classList.add('selected');
        selectedSeats.push(id);
    }
    updateTotal();
}

function updateTotal() {
    const total = selectedSeats.length * ticketPrice;

    if(totalDisplay) totalDisplay.innerText = `${total} грн`;
    if(countDisplay) countDisplay.innerText = selectedSeats.length;

    if(payBtn) {
        if (selectedSeats.length > 0) {
            payBtn.disabled = false;
        } else {
            payBtn.disabled = true;
        }
        payBtn.innerText = "ОПЛАТИТИ";
    }
}

// ОПЛАТА
if (payBtn) {
    payBtn.addEventListener('click', async () => {
        if (!selectedSeats.length) return;
        if (!getAuthToken()) { alert("Увійдіть в акаунт"); return; }

        const payload = {
            session_id: sessionId,
            seat_id: selectedSeats,
            use_bonuses: useBonusesCheckbox ? useBonusesCheckbox.checked : false
        };

        const oldText = payBtn.innerText;
        payBtn.disabled = true; payBtn.innerText = "ОБРОБКА...";

        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/create/`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (res.ok) {
                if (result.status === 'success' && result.message === 'Paid by bonuses') {
                    alert("Оплачено бонусами!"); window.location.reload();
                } else if (result.data && result.signature) {
                    submitLiqPay(result.data, result.signature);
                }
            } else {
                alert(result.error || "Помилка");
                payBtn.disabled = false; payBtn.innerText = oldText;
            }
        } catch (e) {
            console.error(e);
            payBtn.disabled = false; payBtn.innerText = oldText;
        }
    });
}

function submitLiqPay(data, signature) {
    const form = document.createElement('form');
    form.method = 'POST'; form.action = 'https://www.liqpay.ua/api/3/checkout';

    const i1 = document.createElement('input'); i1.type='hidden'; i1.name='data'; i1.value=data;
    const i2 = document.createElement('input'); i2.type='hidden'; i2.name='signature'; i2.value=signature;

    form.appendChild(i1); form.appendChild(i2);
    document.body.appendChild(form); form.submit();
}

document.addEventListener('DOMContentLoaded', () => { loadSeats(); loadUserProfile(); });


