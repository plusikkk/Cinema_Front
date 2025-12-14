const BASE_URL = "http://127.0.0.1:8001/api";

let currentPage = 1;
const dataElement = document.getElementById('status_to_load');
const STATUS_TO_LOAD = dataElement ? JSON.parse(dataElement.textContent) : 'screened';

function getFilterParams() {
    const params = new URLSearchParams();

    params.append('status', STATUS_TO_LOAD);
    params.append('page', currentPage);
    params.append('page_size', 8);

    const animCheckbox = document.querySelector('input[name="filter_animation"]:checked');
    if (animCheckbox) params.append('animation', 'true');

    const kidsCheckbox = document.querySelector('input[name="filter_kids"]:checked');
    if (kidsCheckbox) params.append('kids', 'true');

    const ageCheckboxes = document.querySelectorAll('input[name="filter_age"]:checked');
    if (ageCheckboxes.length > 0) {
        const values = Array.from(ageCheckboxes).map(cb => parseInt(cb.value));
        const minAge = Math.min(...values);
        params.append('age_limit', minAge);
    }

    const genreCheckboxes = document.querySelectorAll('input[name="filter_genre"]:checked');
    const selectedGenres = Array.from(genreCheckboxes).map(cb => cb.value);

    if (selectedGenres.length > 0) {
        params.append('genres', selectedGenres.join(','));
    }

    return params;
}

async function fetchMovies() {
  const params = getFilterParams();
  let url = `${BASE_URL}/movies/?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Помилка при завантаженні:`, error);
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

  const posterHTML = getPosterHTML(movie.poster_url, title);
  const badgesHTML = getBadgesHTML(movie.badges);

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
                <a href="${trailerUrl}" class="overlay-button" target="_blank" rel="noopener noreferrer"><i class="fas fa-play"></i> <span>Трейлер</span></a>
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

function renderMovies(paginatedData) {
  const container = document.getElementById('movies-grid-container');
  if (!container) return;

  container.innerHTML = '';

  if (!paginatedData || !paginatedData.results || paginatedData.results.length === 0) {
    container.innerHTML = '<p style="color: var(--muted); font-size: 1.1rem; width: 100%; text-align: center;">За вашим запитом фільмів не знайдено</p>';
    return;
  }

  const movies = paginatedData.results;
  movies.forEach(movie => {
    const movieCardHTML = createMovieCard(movie, '');
    container.insertAdjacentHTML('beforeend', movieCardHTML);
  });
}

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
  currentPage = page;
  const container = document.getElementById('movies-grid-container');
  if(container) container.style.opacity = '0.5';

  const data = await fetchMovies();

  if (data) {
    renderMovies(data);
    updatePagination(page, data);
  }

  if(container) container.style.opacity = '1';
}

document.addEventListener('DOMContentLoaded', () => {
  loadMovies(1);

  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');

  if (prevBtn) prevBtn.addEventListener('click', () => loadMovies(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => loadMovies(currentPage + 1));

  const allFilters = document.querySelectorAll(
      'input[name="filter_animation"], ' +
      'input[name="filter_kids"], ' +
      'input[name="filter_age"], ' +
      'input[name="filter_genre"]'
  );

  allFilters.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
          loadMovies(1);
      });
  });
});


