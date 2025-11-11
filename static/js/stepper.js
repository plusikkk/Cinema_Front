// Налаштування для "Зараз у кіно"
let currentPageNow = 1;
let totalPagesNow = 1;

function fetchNowPlaying(page=1) {
    fetch(`http://backend.example.com/api/movies/now_playing/?page=${page}`)
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('now-playing');
        container.innerHTML = '';
        data.results.forEach(film => {
            const div = document.createElement('div');
            div.classList.add('movie-card');
            div.innerHTML = `
                <img src="${film.poster_url}" alt="${film.title}">
                <h3>${film.title}</h3>
            `;
            container.appendChild(div);
        });

        currentPageNow = page;
        totalPagesNow = Math.ceil(data.count / 6);
        document.getElementById('page-info-now').innerText = `${currentPageNow} / ${totalPagesNow}`;
        document.getElementById('prev-now').disabled = !data.previous;
        document.getElementById('next-now').disabled = !data.next;
    });
}

document.getElementById('prev-now').addEventListener('click', () => {
    if(currentPageNow > 1) fetchNowPlaying(currentPageNow - 1);
});
document.getElementById('next-now').addEventListener('click', () => {
    fetchNowPlaying(currentPageNow + 1);
});



// Налаштування для "Скоро у кіно"
let currentPageSoon = 1;
let totalPagesSoon = 1;

function fetchComingSoon(page=1) {
    fetch(`http://backend.example.com/api/movies/coming_soon/?page=${page}`)
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('coming-soon');
        container.innerHTML = '';
        data.results.forEach(film => {
            const div = document.createElement('div');
            div.classList.add('movie-card');
            div.innerHTML = `
                <img src="${film.poster_url}" alt="${film.title}">
                <h3>${film.title}</h3>
            `;
            container.appendChild(div);
        });

        currentPageSoon = page;
        totalPagesSoon = Math.ceil(data.count / 6);
        document.getElementById('page-info-soon').innerText = `${currentPageSoon} / ${totalPagesSoon}`;
        document.getElementById('prev-soon').disabled = !data.previous;
        document.getElementById('next-soon').disabled = !data.next;
    });
}

document.getElementById('prev-soon').addEventListener('click', () => {
    if(currentPageSoon > 1) fetchComingSoon(currentPageSoon - 1);
});
document.getElementById('next-soon').addEventListener('click', () => {
    fetchComingSoon(currentPageSoon + 1);
});

fetchNowPlaying();
fetchComingSoon();
