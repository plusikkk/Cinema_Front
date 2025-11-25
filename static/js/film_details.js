const BASE_URL = "http://127.0.0.1:8001/api"; 

document.addEventListener('DOMContentLoaded', () => {
    // Отримуємо ID фільму з URL
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const movieId = pathParts[pathParts.length - 1];

    if (movieId && !isNaN(movieId)) {
        loadMovieDetails(movieId);
        loadMovieSessions(movieId);
    } else {
        console.error("Movie ID not found in URL");
        displayError("ID фільму не знайдено в адресі.");
    }
});

function displayError(message) {
    const container = document.getElementById('movieContainer');
    if (container) {
        container.innerHTML = `<div style="color: var(--pink); text-align: center; padding: 50px; grid-column: 1 / -1;">
            <h2>Помилка завантаження даних фільму</h2>
            <p>${message}</p>
        </div>`;
    }
    const sessionsList = document.getElementById('sessionsList');
    if (sessionsList) {
        sessionsList.innerHTML = `<div class="loading-sessions">Розклад недоступний</div>`;
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
        document.getElementById('movieTitle').textContent = movie.title;
        document.getElementById('movieDescription').textContent = movie.description;
        document.getElementById('movieYear').textContent = new Date(movie.release_date).getFullYear();
        document.getElementById('movieRating').textContent = movie.rating;
        document.getElementById('movieAge').textContent = `${movie.age_category}+`;
        document.getElementById('movieDuration').textContent = `${movie.duration} хв`;
        
        // РЕЖИСЕР
        document.getElementById('movieDirector').textContent = movie.director || 'Не вказано';

        // ЖАНРИ
        const genresContainer = document.getElementById('movieGenres');
        if (movie.genres && movie.genres.length > 0) {
            // Створюємо рядок "Action, Adventure, Comedy"
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

        // АКТОРИ
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

        // Бейджі
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
        displayError(error.message || "Сталася невідома помилка при завантаженні даних фільму.");
    }
}

// Завантаження сеансів
async function loadMovieSessions(movieId) {
    const list = document.getElementById('sessionsList');
    list.innerHTML = '<div class="loading-sessions">Пошук сеансів...</div>';

    try {
        const res = await fetch(`${BASE_URL}/sessions/?movie=${movieId}`);
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const sessions = await res.json();
        
        if (sessions.length > 0) {
            list.innerHTML = '';
            sessions.forEach(session => {
                const cinemaName = session.hall && session.hall.cinema ? (session.hall.cinema.name || session.hall.cinema) : 'Невідомий кінотеатр';
                
                const el = document.createElement('div');
                el.className = 'session-card';
                el.innerHTML = `
                    <div class="s-cinema">${cinemaName}</div>
                    <div class="s-info">
                        <span class="s-time">${new Date(session.start_time).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span class="s-price">${session.price} грн</span>
                    </div>
                `;
                el.onclick = () => {
                    alert(`Обрано сеанс #${session.id} у ${cinemaName} о ${new Date(session.start_time).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`);
                };
                list.appendChild(el);
            });
        } else {
            list.innerHTML = '<div class="loading-sessions">Сеансів немає</div>';
        }

    } catch (e) {
        console.error("Помилка завантаження сеансів:", e);
        list.innerHTML = '<div class="loading-sessions">Не вдалося завантажити розклад</div>';
    }
}



