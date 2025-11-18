const BASE_URL = "http://127.0.0.1:8001/api";
let currentPage = 1;
const dataElement = document.getElementById('status_to_load');
const STATUS_TO_LOAD = dataElement ? JSON.parse(dataElement.textContent) : 'screened';

async function fetchMovies(status, page = 1) {
  let url = `${BASE_URL}/movies/?status=${status}&page=${page}&page_size=8`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
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
        <div class="movie-title">
            <a href="${detailUrl}">${title}</a>
        </div>
        <div class="movie-overlay">
            <div class="overlay-top-buttons">
                <a href="${detailUrl}" class="overlay-button"><i class="fas fa-info-circle"></i> <span>Детальніше</span></a>
                <a href="${trailerUrl}" class="overlay-button" target="_blank" rel="noopener noreferrer"><i class="fas fa-play"></i> <span>Трейлер</span></a>
            </div>
            <div class="overlay-middle-content">
                <div class="premiere-text">Прем'єра <span class="premiere-date">${formattedDate}</span></div>
                <div class="tickets-text">Квитки у продажу!</div>
            </div>
            ${isPresale ? '<div class="presale-badge">PRESALE</div>' : ''}
            <div class="overlay-bottom-title"><a href="${detailUrl}">${title}</a></div>
        </div>
    </div>
  `;
}


function renderMovies(paginatedData) {
  const container = document.getElementById('movies-grid-container');
  if (!container) return;

  const movies = paginatedData.results;
  container.innerHTML = '';

  if (!movies || movies.length === 0) {
    container.innerHTML = '<p style="color: var(--muted); font-size: 1.1rem;">За вашим запитом фільмів не знайдено.</p>';
    return;
  }

  movies.forEach(movie => {
    const movieCardHTML = createMovieCard(movie, '');
    container.insertAdjacentHTML('beforeend', movieCardHTML);
  });
}

// ОНОВЛЕННЯ ПАГІНАЦІЯ
function updatePagination(page, paginatedData) {
  const pageInfo = document.getElementById('page-info');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');

  const totalPages = Math.ceil(paginatedData.count / 8);

  if (pageInfo) pageInfo.innerText = `${page} / ${totalPages || 1}`;
  if (prevBtn) prevBtn.disabled = !paginatedData.previous;
  if (nextBtn) nextBtn.disabled = !paginatedData.next;
}

async function loadMovies(page = 1) {
  const data = await fetchMovies(STATUS_TO_LOAD, page);
  if (data) {
    renderMovies(data);
    updatePagination(page, data);
    currentPage = page;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMovies(1);

  document.getElementById('prev-page').addEventListener('click', () => {
      loadMovies(currentPage - 1);
  });
  document.getElementById('next-page').addEventListener('click', () => {
      loadMovies(currentPage + 1);
  });
});


