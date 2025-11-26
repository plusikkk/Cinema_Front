const BASE_URL = "http://127.0.0.1:8001/api";

// Глобальні змінні
let allSessions = [];
let selectedDateStr = null;
let globalMovieEndDate = '...';

document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const movieId = pathParts[pathParts.length - 1];

    if (movieId && !isNaN(movieId)) {
        loadMovieDetails(movieId);
        loadMovieSessions(movieId);
    } else {
        console.error("Movie ID not found in URL");
        displayError("ID фільму не знайдено в адресі.");
    }

    // Закриваємо Popover при кліку будь-де поза ним
    document.addEventListener('click', hidePopover);
});

function displayError(message) {
    const container = document.getElementById('movieContainer');
    if (container) {
        container.innerHTML = `<div style="color: var(--pink); text-align: center; padding: 50px; grid-column: 1 / -1;">
            <h2>Помилка завантаження даних фільму</h2>
            <p>${message}</p>
        </div>`;
    }
}

async function loadMovieDetails(id) {
    try {
        const url = `${BASE_URL}/movies/${id}/`;
        const response = await fetch(url);

        if (!response.ok) {
            let errorMessage = `Не вдалося завантажити фільм. Статус: ${response.status}.`;
            if (response.status === 404) {
                errorMessage = "Фільм не знайдено в базі даних.";
            }
            throw new Error(errorMessage);
        }

        const movie = await response.json();

        // Основні дані
        document.getElementById('movieTitle').textContent = movie.title;
        document.getElementById('movieDescription').textContent = movie.description;
        document.getElementById('movieYear').textContent = new Date(movie.release_date).getFullYear();
        document.getElementById('movieRating').textContent = movie.rating;
        document.getElementById('movieAge').textContent = `${movie.age_category}+`;
        document.getElementById('movieDuration').textContent = `${movie.duration} хв`;
        document.getElementById('movieDirector').textContent = movie.director || 'Не вказано';

        // ЗБЕРІГАЄМО ДАТУ ЗАКІНЧЕННЯ
        if (movie.end_date) {
            const endDateObj = new Date(movie.end_date);
            globalMovieEndDate = endDateObj.toLocaleDateString('uk-UA');
        } else {
            globalMovieEndDate = 'невідомо';
        }

        // Жанри
        const genresContainer = document.getElementById('movieGenres');
        if (movie.genres && movie.genres.length > 0) {
            const genresText = movie.genres.map(g => g.name).join(', ');
            genresContainer.textContent = genresText;
        } else {
            genresContainer.innerHTML = '<span class="muted-text">Не вказано</span>';
        }

        // Постер
        const poster = document.getElementById('moviePoster');
        poster.src = movie.poster_url || '/static/img/placeholder.jpg';
        poster.onerror = function() {
            this.src = '/static/img/placeholder.jpg';
        };

        // Трейлер
        const trailerBtn = document.getElementById('trailerBtn');
        if (movie.trailer_url) {
            trailerBtn.href = movie.trailer_url;
            trailerBtn.style.display = 'inline-flex';
        } else {
            trailerBtn.style.display = 'none';
        }

        // Актори
        const actorsContainer = document.getElementById('movieActors');
        if (movie.actors && movie.actors.length > 0) {
            actorsContainer.innerHTML = movie.actors.map(actor => {
                let photoContent;
                if (actor.photo) {
                    photoContent = `
                        <img src="${actor.photo}" alt="${actor.name}" class="actor-photo"
                             onerror="this.outerHTML='<i class=\\'fas fa-user actor-placeholder-icon\\'></i>'">
                    `;
                } else {
                    photoContent = `<i class="fas fa-user actor-placeholder-icon"></i>`;
                }
                return `
                    <div class="actor-card">
                        <div class="actor-photo-frame">
                            ${photoContent}
                        </div>
                        <span class="actor-name">${actor.name}</span>
                    </div>
                `;
            }).join('');
        } else {
             actorsContainer.innerHTML = '<span class="muted-text">Інформація про акторів відсутня</span>';
        }

        // Бейджі фільму (верхні на постері)
        const badgesContainer = document.getElementById('movieBadges');
        if (movie.badges && movie.badges.length > 0) {
            badgesContainer.innerHTML = movie.badges.map(b =>
                `<span class="p-badge">${b.name}</span>`
            ).join('');
        }

        // Кнопка Купити
        document.getElementById('buyBtn').onclick = () => {
            document.querySelector('.schedule-column').scrollIntoView({behavior: 'smooth'});
        };

    } catch (error) {
        console.error("Помилка завантаження деталей фільму:", error);
        displayError(error.message || "Сталася невідома помишка при завантаженні даних фільму.");
    }
}

/* =========================================
   РОЗКЛАД
   ========================================= */

async function loadMovieSessions(movieId) {
    const container = document.getElementById('sessionsContainer');
    container.innerHTML = '<div class="loading-sessions">Оновлення розкладу...</div>';

    try {
        const res = await fetch(`${BASE_URL}/sessions/?movie=${movieId}`);
        if (!res.ok) throw new Error('Failed to fetch sessions');

        allSessions = await res.json();

        if (allSessions.length > 0) {
            initDateSelector();
        } else {
            container.innerHTML = '<div class="loading-sessions">На жаль, сеансів немає</div>';
            document.getElementById('dateDropdownBtn').disabled = true;
            document.getElementById('selectedDateText').textContent = "Немає сеансів";
        }

    } catch (e) {
        console.error("Помилка:", e);
        container.innerHTML = '<div class="loading-sessions">Помилка завантаження</div>';
    }
}

function initDateSelector() {
    const uniqueDates = new Set();
    allSessions.forEach(session => {
        const dateKey = session.start_time.split('T')[0];
        uniqueDates.add(dateKey);
    });

    const sortedDates = Array.from(uniqueDates).sort();

    if (sortedDates.length > 0) {
        selectedDateStr = sortedDates[0];
        renderDateDropdown(sortedDates);
        renderSessionsForDate(selectedDateStr);
    }
}

function renderDateDropdown(dates) {
    const dropdownList = document.getElementById('dateDropdownList');
    const dropdownBtn = document.getElementById('dateDropdownBtn');
    const btnText = document.getElementById('selectedDateText');

    dropdownList.innerHTML = '';

    dropdownBtn.onclick = (e) => {
        e.stopPropagation();
        dropdownList.classList.toggle('active');
    };

    document.addEventListener('click', () => {
        dropdownList.classList.remove('active');
    });

    // 1. Рендеримо дати
    dates.forEach(dateStr => {
        const dateObj = new Date(dateStr);
        const formattedDate = formatDateHumanReadable(dateObj);

        const item = document.createElement('div');
        item.className = 'date-option';
        if (dateStr === selectedDateStr) item.classList.add('selected');

        item.innerHTML = formattedDate;

        item.onclick = () => {
            selectedDateStr = dateStr;
            btnText.textContent = formattedDate;
            document.querySelectorAll('.date-option').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            renderSessionsForDate(selectedDateStr);
        };

        dropdownList.appendChild(item);
    });

    // 2. ДОДАЄМО ІНФО ПРО ПРОКАТ В КІНЕЦЬ СПИСКУ
    const rentalInfo = document.createElement('div');
    rentalInfo.className = 'dropdown-info-item';
    rentalInfo.innerHTML = `
        Далі розклад не сформовано.<br>
        Фільм в прокаті до <span>${globalMovieEndDate}</span>
    `;
    dropdownList.appendChild(rentalInfo);

    btnText.textContent = formatDateHumanReadable(new Date(selectedDateStr));
}

function renderSessionsForDate(dateKey) {
    const container = document.getElementById('sessionsContainer');
    container.innerHTML = '';

    const legendContainer = document.querySelector('.formats-legend');
    legendContainer.innerHTML = '';
    const allBadgesSet = new Set();

    const filteredSessions = allSessions.filter(session => {
        return session.start_time.startsWith(dateKey);
    });

    if (filteredSessions.length === 0) {
        container.innerHTML = '<div class="loading-sessions">Сеансів немає</div>';
        return;
    }

    const groupedByCinema = {};
    filteredSessions.forEach(session => {
        const cinema = session.hall && session.hall.cinema ? session.hall.cinema : null;
        const cinemaName = cinema ? (cinema.name || cinema) : 'Кінотеатр';

        if (!groupedByCinema[cinemaName]) {
            groupedByCinema[cinemaName] = { sessions: [], cinemaObj: cinema };
        }
        groupedByCinema[cinemaName].sessions.push(session);
    });

    for (const [cinemaName, data] of Object.entries(groupedByCinema)) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'cinema-group';

        const header = document.createElement('div');
        header.className = 'cinema-name-header';
        header.textContent = cinemaName;
        groupDiv.appendChild(header);

        const timesGrid = document.createElement('div');
        timesGrid.className = 'times-grid';

        data.sessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        data.sessions.forEach(session => {
            const timeObj = new Date(session.start_time);
            const timeStr = timeObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

            // Формуємо текст для кнопки сеансу
            let formatText = "2D";
            if (session.movie && session.movie.badges && session.movie.badges.length > 0) {
                formatText = session.movie.badges.map(b => b.name).join(' ');
            }

            const btn = document.createElement('button');
            btn.className = 'time-slot';
            btn.innerHTML = `<span class="ts-time">${timeStr}</span><span class="ts-format">${formatText}</span>`;

            btn.onclick = () => { window.location.href = `/booking/${session.id}/`; };
            timesGrid.appendChild(btn);

            // --- ВИПРАВЛЕНО: ЗБИРАЄМО ЗНАЧКИ ФІЛЬМУ ЗАМІСТЬ КІНОТЕАТРУ ---
            if (session.movie && session.movie.badges && Array.isArray(session.movie.badges)) {
                session.movie.badges.forEach(badge => {
                    // Додаємо значки фільму в унікальний набір для легенди
                    allBadgesSet.add(JSON.stringify(badge));
                });
            }
        });

        groupDiv.appendChild(timesGrid);
        container.appendChild(groupDiv);
    }

    // 2. РЕНДЕРИМО ЗІБРАНІ ЗНАЧКИ ФІЛЬМУ В НИЖНІЙ БЛОК
    if (allBadgesSet.size > 0) {
        const sortedBadges = Array.from(allBadgesSet).map(json => JSON.parse(json));

        sortedBadges.forEach(badge => {
            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'f-badge';

            // ВСТАВЛЯЄМО ТЕКСТ ТА ІКОНКУ ПИТАННЯ
            badgeSpan.innerHTML = `${badge.name} <i class="fas fa-question-circle"></i>`;

            // Встановлюємо слухачі на ВЕСЬ SPAN
            badgeSpan.addEventListener('mouseenter', (e) => showPopover(e, badge));
            badgeSpan.addEventListener('mouseleave', hidePopover);
            badgeSpan.addEventListener('click', (e) => e.stopPropagation());

            legendContainer.appendChild(badgeSpan);
        });
    }
}

// ===============================================
// ФУНКЦІЇ ДЛЯ КАСТОМНОГО POPOVER
// ===============================================

function showPopover(e, badge) {
    e.stopPropagation();
    const popover = document.getElementById('badgePopover');
    const targetRect = e.target.closest('.f-badge').getBoundingClientRect();
    const description = badge.description || 'Детальний опис відсутній.';

    const contentHtml = `
        <i class="fa-solid fa-circle-info popover-icon"></i>
        <span>${description}</span>
    `;
    document.getElementById('popoverDescription').innerHTML = contentHtml;

    // Вимірювання висоти
    popover.style.display = 'block';
    const POPOVER_WIDTH = 320;
    const ARROW_HEIGHT = 10;
    const REAL_HEIGHT = popover.offsetHeight;

    const leftPosition = targetRect.left + (targetRect.width / 2) - (POPOVER_WIDTH / 2);

    // Автоматичний розрахунок висоти підйому
    const topPosition = targetRect.top - REAL_HEIGHT - ARROW_HEIGHT;

    popover.style.position = 'fixed';
    popover.style.left = `${leftPosition}px`;
    popover.style.top = `${topPosition}px`;

    requestAnimationFrame(() => {
        popover.classList.add('visible');
    });
}

function hidePopover() {
    const popover = document.getElementById('badgePopover');
    if (popover.classList.contains('visible')) {
        popover.classList.remove('visible');
        setTimeout(() => {
            if (!popover.classList.contains('visible')) {
                popover.style.display = 'none';
            }
        }, 200);
    }
}


function formatDateHumanReadable(dateObj) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const d = new Date(dateObj.toDateString());
    const t = new Date(today.toDateString());
    const tm = new Date(tomorrow.toDateString());

    if (d.getTime() === t.getTime()) return `Сьогодні, ${d.getDate()} ${getMonthName(d.getMonth())}`;
    if (d.getTime() === tm.getTime()) return `Завтра, ${d.getDate()} ${getMonthName(d.getMonth())}`;

    const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return `${days[d.getDay()]}, ${d.getDate()} ${getMonthName(d.getMonth())}`;
}

function getMonthName(monthIndex) {
    const months = [
        'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
        'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
    ];
    return months[monthIndex];
}