const BASE_URL = "http://127.0.0.1:8001/api";

let currentPageNow = 1;
let currentPageSoon = 1;

// ВІКНО ТРЕЙЛЕРА
function getYouTubeID(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function openTrailerModal(url) {
    const videoId = getYouTubeID(url);

    if (!videoId) {
        alert("На жаль, посилання на трейлер відсутнє або некоректне.");
        return;
    }

    const modal = document.getElementById('trailerModal');
    const iframe = document.getElementById('trailerPlayer');

    if (modal && iframe) {
        iframe.setAttribute('referrerPolicy', 'no-referrer');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&origin=${window.location.origin}&rel=0&modestbranding=1`;

        modal.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('trailerModal');
    const closeBtn = document.querySelector('.close-trailer-btn') || document.querySelector('.close-trailer');
    const iframe = document.getElementById('trailerPlayer');

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            if (iframe) {
                iframe.src = "";
                iframe.removeAttribute('referrerPolicy');
            }
        }
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });
});

async function fetchMovies(status, page = 1) {
  const url = `${BASE_URL}/movies/?status=${status}&page=${page}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Помилка при завантаженні (${status}, стор. ${page}):`, error);
  }
}

// СТВОРЕННЯ КАРТКИ ФІЛЬМУ
function createMovieCard(movie, cardType) {
  const detailUrl = `/movie/${movie.id}/`;
  const trailerLink = movie.trailer_url ? movie.trailer_url : '';
  const title = movie.title;

  const releaseDate = new Date(movie.release_date);
  const options = { day: 'numeric', month: 'long' };
  const formattedDate = releaseDate.toLocaleDateString('uk-UA', options);
  const isPresale = releaseDate > new Date();

  const posterHTML = typeof getPosterHTML === 'function'
      ? getPosterHTML(movie.poster_url, title)
      : `<img src="${movie.poster_url}" alt="${title}">`;

  const badgesHTML = typeof getBadgesHTML === 'function'
      ? getBadgesHTML(movie.badges)
      : '';

  let trailerBtnHTML = '';
  if (trailerLink) {
      trailerBtnHTML = `
        <button class="overlay-button" onclick="openTrailerModal('${trailerLink}')">
            <i class="fas fa-play"></i> <span>Трейлер</span>
        </button>
      `;
  } else {
      trailerBtnHTML = `
        <span class="overlay-button disabled" style="opacity: 0.5; cursor: default;" title="Трейлер відсутній">
            <i class="fas fa-ban"></i> <span>Трейлер</span>
        </span>
      `;
  }

  return `
    <div class="movie-card">
        ${posterHTML}
        ${badgesHTML}
        
        <div class="movie-title">
            <a href="${detailUrl}">${title}</a>
        </div>

        <div class="movie-overlay">
            <div class="overlay-top-buttons">
                <a href="${detailUrl}" class="overlay-button"><i class="fas fa-info-circle"></i> <span>Детальніше</span></a>
                ${trailerBtnHTML}
            </div>
            <div class="overlay-middle-content">
                <div class="premiere-text">Прем'єра <span class="premiere-date">${formattedDate}</span></div>
                <div class="tickets-text">Квитки у продажу!</div>
            </div>
            ${isPresale ? '<div class="presale-badge">PRESALE</div>' : ''}

            <div class="overlay-bottom-title">
                <a href="${detailUrl}">${title}</a>
            </div>
        </div>
    </div>
  `;
}

function renderMovies(containerId, paginatedData, cardType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const movies = paginatedData.results;
  container.innerHTML = '';

  if (!movies || movies.length === 0) {
    if (currentPageNow > 1 || currentPageSoon > 1) {
        container.innerHTML = '<p>Більше фільмів немає.</p>';
    } else {
        container.innerHTML = '<p>Наразі фільмів у цій категорії немає.</p>';
    }
    return;
  }

  movies.forEach(movie => {
    const movieCardHTML = createMovieCard(movie, cardType);
    container.insertAdjacentHTML('beforeend', movieCardHTML);
  });
}

function updatePagination(prefix, page, paginatedData) {
  const pageInfo = document.getElementById(`page-info-${prefix}`);
  const prevBtn = document.getElementById(`prev-${prefix}`);
  const nextBtn = document.getElementById(`next-${prefix}`);

  const totalPages = Math.ceil(paginatedData.count / 4);

  if (pageInfo) pageInfo.innerText = `${page} / ${totalPages || 1}`;
  if (prevBtn) prevBtn.disabled = !paginatedData.previous;
  if (nextBtn) nextBtn.disabled = !paginatedData.next;
}

async function loadNowPlaying(page = 1) {
  const data = await fetchMovies('screened', page);
  if (data) {
    renderMovies('now-playing', data, 'now');
    updatePagination('now', page, data);
    currentPageNow = page;
  }
}

async function loadComingSoon(page = 1) {
  const data = await fetchMovies('soon', page);
  if (data) {
    renderMovies('coming-soon', data, 'soon');
    updatePagination('soon', page, data);
    currentPageSoon = page;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadNowPlaying(1);
  loadComingSoon(1);

  const prevNow = document.getElementById('prev-now');
  if (prevNow) prevNow.addEventListener('click', () => loadNowPlaying(currentPageNow - 1));

  const nextNow = document.getElementById('next-now');
  if (nextNow) nextNow.addEventListener('click', () => loadNowPlaying(currentPageNow + 1));

  const prevSoon = document.getElementById('prev-soon');
  if (prevSoon) prevSoon.addEventListener('click', () => loadComingSoon(currentPageSoon - 1));

  const nextSoon = document.getElementById('next-soon');
  if (nextSoon) nextSoon.addEventListener('click', () => loadComingSoon(currentPageSoon + 1));
});


