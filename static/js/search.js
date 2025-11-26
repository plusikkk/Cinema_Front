document.addEventListener('DOMContentLoaded', function () {
    const searchForms = document.querySelectorAll('.search-bar');

    searchForms.forEach(form => {
        const input = form.querySelector('input');
        const resultsContainer = form.querySelector('.search-results-container');

        // Отримуємо URL з атрибута. Якщо з якоїсь причини атрибута немає,
        // хардкодимо правильний шлях згідно з вашим urls.py (/api/movies/)
        const apiUrl = form.getAttribute('data-api-url') || '/api/movies/';

        input.setAttribute('autocomplete', 'off');

        input.addEventListener('input', function (e) {
            const query = e.target.value.trim();

            if (query.length > 1) {
                // Формуємо URL запиту
                const separator = apiUrl.includes('?') ? '&' : '?';
                const fetchUrl = `${apiUrl}${separator}search=${encodeURIComponent(query)}`;

                fetch(fetchUrl)
                    .then(response => {
                        // Якщо 404 - значить шлях неправильний, але з новим кодом цього не буде
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.json();
                    })
                    .then(data => {
                        resultsContainer.innerHTML = '';
                        const movies = data.results || [];

                        if (movies.length > 0) {
                            resultsContainer.classList.add('open');
                            movies.forEach(movie => {
                                const link = document.createElement('a');
                                // У urls.py (Front) у вас path('movie/<int:pk>/', ...)
                                // Тому посилання будуємо так:
                                link.href = `/movie/${movie.id}/`;
                                link.classList.add('search-result-item');
                                link.textContent = movie.title;
                                resultsContainer.appendChild(link);
                            });
                        } else {
                            resultsContainer.classList.remove('open');
                        }
                    })
                    .catch(error => {
                        console.error('API Error:', error);
                        resultsContainer.classList.remove('open');
                    });
            } else {
                resultsContainer.classList.remove('open');
            }
        });

        // Закриття при кліку поза полем
        document.addEventListener('click', function (e) {
            if (!form.contains(e.target)) {
                resultsContainer.classList.remove('open');
            }
        });
    });
});