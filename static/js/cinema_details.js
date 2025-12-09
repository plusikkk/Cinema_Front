const BASE_URL = "http://127.0.0.1:8001/api";
let allSessions = [];

document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const cinemaId = pathParts[pathParts.length - 1];

    if (cinemaId && !isNaN(cinemaId)) {
        loadCinemaInfo(cinemaId);
        loadSessionsAndRenderMovies(cinemaId);
    } else {
        document.querySelector('#cinemaTitle').textContent = "Кінотеатр не знайдено";
    }
});

// ІНФОРМАЦІЯ ПРО КІНОТЕАТР
async function loadCinemaInfo(id) {
    try {
        const res = await fetch(`${BASE_URL}/cinemas/${id}/`);
        if (!res.ok) throw new Error('Failed to load info');

        const cinema = await res.json();

        document.getElementById('cinemaTitle').textContent = cinema.name;
        document.getElementById('cinemaDescription').textContent = cinema.description || 'Опис відсутній';
        document.getElementById('cinemaAddress').textContent = cinema.address;

        if (cinema.city && cinema.city.name) {
            document.getElementById('cinemaCity').textContent = cinema.city.name;
        }

        const mainImage = document.getElementById('cinemaMainImage');
        if (cinema.photo) {
            mainImage.src = cinema.photo;
        } else {
            mainImage.src = '/static/img/cinema-placeholder.jpg';
        }

        // Значки
        const badgesContainer = document.getElementById('cinemaBadges');
        if (cinema.badges && cinema.badges.length > 0) {
            badgesContainer.innerHTML = cinema.badges.map(b =>
                `<div class="feature-badge" title="${b.name}">
                    <i class="fas fa-check-circle"></i> ${b.name}
                </div>`
            ).join('');
        } else {
            badgesContainer.innerHTML = '<span style="color: grey; font-size: 0.8rem;">Додаткові послуги не вказані</span>';
        }

        // МАПА
        const mapBtn = document.getElementById('googleMapBtn');
        if (cinema.latitude && cinema.longitude) {
            // Використовуємо стандартний формат Google Maps для координат
            mapBtn.href = `https://www.google.com/maps?q=${cinema.latitude},${cinema.longitude}`;
            mapBtn.style.display = 'flex';
        } else {
            mapBtn.style.display = 'none';
        }

    } catch (e) {
        console.error(e);
    }
}

// ЗАВАНТАЖЕННЯ ФІЛЬМІВ
async function loadSessionsAndRenderMovies(cinemaId) {
    const container = document.getElementById('cinemaMoviesGrid');
    try {
        const res = await fetch(`${BASE_URL}/sessions/?cinema=${cinemaId}`);
        if (!res.ok) throw new Error('Failed to load schedule');

        allSessions = await res.json();

        if (allSessions.length === 0) {
            container.style.display = 'block';
            container.innerHTML = '<div style="text-align:center; padding:30px; font-size:1.2rem; color: #aaa;">У цьому кінотеатрі зараз немає активних показів.</div>';
            return;
        }

        renderUniqueMovies(allSessions);

    } catch (e) {
        console.error(e);
        container.style.display = 'block';
        container.innerHTML = '<div style="color:red; text-align:center;">Помилка завантаження фільмів.</div>';
    }
}

function renderUniqueMovies(sessions) {
    const container = document.getElementById('cinemaMoviesGrid');
    container.innerHTML = '';
    container.style.display = 'flex';

    const uniqueMoviesMap = new Map();
    sessions.forEach(session => {
        const movie = session.movie;
        if (movie && !uniqueMoviesMap.has(movie.id)) {
            uniqueMoviesMap.set(movie.id, movie);
        }
    });

    const moviesList = Array.from(uniqueMoviesMap.values());

    moviesList.forEach(movie => {
        const movieDetailUrl = `/movie/${movie.id}/`;
        const posterSrc = movie.poster_url || '/static/img/placeholder.jpg';

        const card = document.createElement('a');
        card.className = 'cinema-movie-card';
        card.href = movieDetailUrl;

        card.innerHTML = `
            <div class="cmc-poster">
                <img src="${posterSrc}" alt="${movie.title}" onerror="this.src='/static/img/placeholder.jpg'">
                
                <div class="cmc-overlay">
                    <span class="btn-details-icon"><i class="fas fa-ticket-alt"></i> Детальніше </span>
                </div>
            </div>
            
            <div class="cmc-info">
                <h3 class="cmc-title">${movie.title}</h3>
                <div class="cmc-meta">
                    <span class="cmc-age">${movie.age_category}+</span>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}



