const API_BASE_URL = "http://127.0.0.1:8001";
const RANDOM_MOVIE_URL = API_BASE_URL + '/api/random-movie/';

function closeModal() {
    document.getElementById('recommend-modal').style.display = 'none';
    document.getElementById('recommend-content').innerHTML = '';
}

function renderRandomMovie(movie) {
    const modalContent = document.getElementById('recommend-content');

    const posterSrc = movie.poster_url ? movie.poster_url : '/static/img/no-poster.jpg';
    const safeDescription = movie.description
        ? movie.description.substring(0, 120) + '...'
        : 'Опис відсутній.';
    const trailerButton = movie.trailer_url ?
        `<a href="${movie.trailer_url}" target="_blank" class="modal-btn trailer-btn"><i class="fas fa-play"></i> Трейлер</a>` : '';

    let badgesHtml = '';
    if (movie.badges && movie.badges.length > 0) {
        badgesHtml = '<div class="modal-badges">';
        movie.badges.forEach(badge => {
            badgesHtml += `<span class="modal-badge">${badge.name}</span>`;
        });
        badgesHtml += '</div>';
    }

    modalContent.innerHTML = `
        <button onclick="closeModal()" class="modal-close-btn" title="Закрити">
            <i class="fa-solid fa-xmark"></i>
        </button>
        
        <div class="modal-movie-card">
            <img src="${posterSrc}" alt="${movie.title}" class="modal-poster">
            
            <h4>${movie.title}</h4>

            ${badgesHtml}
            
            <p class="modal-rating">★ ${movie.rating}/5</p>
            <p class="modal-description">${safeDescription}</p>
            
            <div class="modal-actions">
                <a href="/movie/${movie.id}/" class="modal-btn details-btn">Детальніше</a>
                ${trailerButton}
            </div>
        </div>
    `;

    document.getElementById('recommend-modal').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('recommend-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch(RANDOM_MOVIE_URL, {
            method: 'POST',
            headers: {
                'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(response => {
            if (response.status === 204) {
                return null;
            }
            if (!response.ok) {
                throw new Error('Помилка API. Статус: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            const modalContent = document.getElementById('recommend-content');

            /* ПОМИЛКИ */

            if (data === null) {
                modalContent.innerHTML = `
                    <button onclick="closeModal()" class="modal-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    
                    <div class="modal-not-found">
                        <div class="not-found-icon">
                            <i class="fa-regular fa-face-sad-tear"></i>
                        </div>
                        <h4>На жаль, нічого не знайдено</h4>
                        <p>Спробуйте змінити критерії пошуку або виберіть інші фільтри.</p>
                        <button onclick="location.reload()" class="modal-btn details-btn" style="margin-top: 15px;">
                            Очистити фільтри
                        </button>
                    </div>
                `;
                document.getElementById('recommend-modal').style.display = 'flex';
                return;
            }

            renderRandomMovie(data);
        })
        .catch(error => {
            console.error('Error:', error);

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = false;

            const modalContent = document.getElementById('recommend-content');

            modalContent.innerHTML = `
                <button onclick="closeModal()" class="modal-close-btn">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                
                <div class="modal-not-found">
                    <div class="not-found-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h4>Помилка завантаження</h4>
                    <p>Не вдалося отримати дані з сервера. Перевірте з'єднання та спробуйте ще раз.</p>
                    
                    <button onclick="closeModal()" class="modal-btn trailer-btn" style="margin-top: 15px;">
                        Закрити
                    </button>
                </div>
            `;

            document.getElementById('recommend-modal').style.display = 'flex';
        });
    });
});




