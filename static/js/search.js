const API_BASE_URL = "http://127.0.0.1:8001/api";

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const searchBar = searchInput.parentElement;

  if (!searchInput) return;

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  async function fetchSuggestions(query) {
    if (query.length < 2) {
      resultsContainer.innerHTML = '';
      resultsContainer.classList.remove('open');
      searchBar.classList.remove('search-active');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/movies/?search=${query}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      renderSuggestions(data.results);
    } catch (error) {
      console.error("Помилка при отриманні пропозицій:", error);
      resultsContainer.innerHTML = '';
      resultsContainer.classList.remove('open');
      searchBar.classList.remove('search-active');
    }
  }

  function renderSuggestions(movies) {
    resultsContainer.innerHTML = '';

    if (!movies || movies.length === 0) {
      resultsContainer.classList.remove('open');
      searchBar.classList.remove('search-active');
      return;
    }

    movies.slice(0, 5).forEach(movie => {
      const item = document.createElement('a');
      item.href = `/movie/${movie.id}/`;
      item.classList.add('search-result-item');
      item.textContent = movie.title;
      resultsContainer.appendChild(item);
    });

    resultsContainer.classList.add('open');
    searchBar.classList.add('search-active');
  }

  searchInput.addEventListener('input', debounce((e) => {
    fetchSuggestions(e.target.value);
  }, 300));

  // Ховає результати, якщо клікнути будь-де
  document.addEventListener('click', (e) => {
    if (!resultsContainer.contains(e.target) && e.target !== searchInput) {
      resultsContainer.classList.remove('open');
      searchBar.classList.remove('search-active');
    }
  });
});



