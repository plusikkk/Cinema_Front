const BASE_URL = "http://127.0.0.1:8001/api";

// поточні сторінки
let currentPageNow = 1;
let currentPageSoon = 1;

async function fetchMovies(status, page = 1) {
  const url = `${BASE_URL}/movies/?status=${status}&page=${page}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Помилка HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Помилка при завантаженні (${status}, стор. ${page}):`, error);
  }
}

// СТВОРЕННЯ КАРТКИ

function createMovieCard(movie, cardType) {

  const detailUrl = `/movie/${movie.id}/`;
  const trailerUrl = movie.trailer_url || '#';
  const title = movie.title;

  const releaseDate = new Date(movie.release_date);
  const options = { day: 'numeric', month: 'long' };
  const formattedDate = releaseDate.toLocaleDateString('uk-UA', options);

  const isPresale = releaseDate > new Date();

  return `
    <div class="movie-card">
        <img src="${movie.poster_url}" alt="${title}">
        <div class="quality-badge">IMAX</div>
        
        <div class="movie-title">
            <a href="${detailUrl}">${title}</a>
        </div>

        <div class="movie-overlay">
            
            <div class="overlay-top-buttons">
                <a href="${detailUrl}" class="overlay-button">
                    <i class="fas fa-info-circle"></i> 
                    <span>Детальніше</span>
                </a>
                <a href="${trailerUrl}" class="overlay-button" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-play"></i> 
                    <span>Трейлер</span>
                </a>
            </div>

            <div class="overlay-middle-content">
                <div class="premiere-text">
                    Прем'єра <span class="premiere-date">${formattedDate}</span>
                </div>
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



// ОНОВЛЕННЯ КНОПОК ПАГІНАЦІЇ

function updatePagination(prefix, page, paginatedData) {
  const pageInfo = document.getElementById(`page-info-${prefix}`);
  const prevBtn = document.getElementById(`prev-${prefix}`);
  const nextBtn = document.getElementById(`next-${prefix}`);

  const totalPages = Math.ceil(paginatedData.count / 4);

  if (pageInfo) pageInfo.innerText = `${page} / ${totalPages || 1}`;
  if (prevBtn) prevBtn.disabled = !paginatedData.previous;
  if (nextBtn) nextBtn.disabled = !paginatedData.next;
}




// Зараз у кіно
async function loadNowPlaying(page = 1) {
  const data = await fetchMovies('screened', page);
  if (data) {
    renderMovies('now-playing', data, 'now');
    updatePagination('now', page, data);
    currentPageNow = page;
  }
}

// Скоро у кіно
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

  document.getElementById('prev-now').addEventListener('click', () => {
      loadNowPlaying(currentPageNow - 1);
  });
  document.getElementById('next-now').addEventListener('click', () => {
      loadNowPlaying(currentPageNow + 1);
  });

  document.getElementById('prev-soon').addEventListener('click', () => {
      loadComingSoon(currentPageSoon - 1);
  });
  document.getElementById('next-soon').addEventListener('click', () => {
      loadComingSoon(currentPageSoon + 1);
  });
});


