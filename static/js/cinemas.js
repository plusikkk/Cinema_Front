let map;
let allCinemasData = [];

const UKRAINE_BOUNDS = {
    north: 52.4, south: 44.3, west: 22.1, east: 40.2,
};

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { Marker } = await google.maps.importLibrary("marker");

    const kyivPosition = { lat: 50.4501, lng: 30.5234 };

    // Ініціалізація мапи
    map = new Map(document.getElementById("map"), {
        zoom: 11,
        center: kyivPosition,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
        ],
        restriction: {
            latLngBounds: UKRAINE_BOUNDS,
            strictBounds: true,
        },
        minZoom: 6,
        maxZoom: 18,
    });

    loadCinemas(Marker);
}

async function loadCinemas(MarkerClass) {
    try {
        const response = await fetch('http://127.0.0.1:8001/api/cinemas/?t=' + new Date().getTime());
        const cinemas = await response.json();

        console.log("✅ Дані з бази:", cinemas);

        if (cinemas && cinemas.length > 0) {
            allCinemasData = cinemas;

            // 1. Малюємо маркери на карті
            renderMarkers(cinemas, MarkerClass);

            // 2. Малюємо список кінотеатрів
            renderCinemaList(cinemas);

            // 3. Налаштовуємо пошук і фільтри
            setupFilters();
        } else {
            console.warn("⚠️ Список порожній.");
            document.getElementById('cinemas-list-container').innerHTML = '<div class="no-results">Кінотеатрів поки немає.</div>';
        }
    } catch (error) {
        console.error("❌ Помилка API:", error);
    }
}

// ФУНКЦІЯ ДЛЯ МАРКЕРІВ
function renderMarkers(cinemas, MarkerClass) {
    cinemas.forEach(cinema => {
        if (cinema.latitude && cinema.longitude) {
            const position = {
                lat: Number(cinema.latitude),
                lng: Number(cinema.longitude)
            };

            // Створення маркера
            const marker = new MarkerClass({
                map: map,
                position: position,
                title: cinema.name,
                animation: google.maps.Animation.DROP,
            });

            // Клік на маркер
            marker.addListener("click", () => {
                const card = document.getElementById(`cinema-card-${cinema.id}`);
                if(card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Ефект підсвітки картки
                    card.style.borderColor = "#ff3c8e";
                    setTimeout(() => card.style.borderColor = "rgba(255, 255, 255, 0.08)", 2000);
                }
                map.panTo(position);
                map.setZoom(14);
            });
        } else {
            console.log(`⚠️ У кінотеатру ${cinema.name} немає координат`);
        }
    });
}

function renderCinemaList(cinemas) {
    const container = document.getElementById('cinemas-list-container');
    container.innerHTML = '';

    if (cinemas.length === 0) {
        container.innerHTML = '<div class="no-results">За вашим запитом нічого не знайдено.</div>';
        return;
    }

    cinemas.forEach(cinema => {
        let imgSrc = '/static/img/cinema-placeholder.jpg';
        if (cinema.photo && cinema.photo.trim() !== "") {
            imgSrc = cinema.photo;
        }

        // Місто
        let cityBadgeHTML = '';
        if (cinema.city && cinema.city.name) {
            cityBadgeHTML = `<span class="city-badge">${cinema.city.name}</span>`;
        }

        // Значки
        let badgesHTML = '';
        if (Array.isArray(cinema.badges) && cinema.badges.length > 0) {
            badgesHTML = cinema.badges.map(badge =>
                `<span class="badge-item">${badge.name}</span>`
            ).join('');
        }

        const cardHTML = `
            <div class="cinema-card" id="cinema-card-${cinema.id}">
                <div class="card-image">
                    <img src="${imgSrc}" alt="${cinema.name}" 
                         onerror="this.src='/static/img/cinema-placeholder.jpg';">
                </div>
                
                <div class="card-content">
                    <div class="card-header-group">
                        <h3>
                            ${cinema.name} 
                            ${cityBadgeHTML}
                        </h3>
                        <p class="card-address"><i class="fas fa-map-marker-alt"></i> ${cinema.address || 'Адреса уточнюється'}</p>
                    </div>
                    
                    <a href="/schedule/?cinema=${cinema.id}" class="btn-details">
                        <i class="far fa-calendar-alt" style="margin-right:8px;"></i> Розклад
                    </a>
                </div>

                <div class="card-badges-container">
                    ${badgesHTML}
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function setupFilters() {
    const searchInput = document.getElementById('cinemaSearch');
    const filterContainer = document.getElementById('cityFilters');

    // Генеруємо кнопки міст
    const cities = new Set();
    allCinemasData.forEach(c => {
        if (c.city && c.city.name) cities.add(c.city.name);
    });

    cities.forEach(city => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = city;
        btn.dataset.city = city;
        btn.onclick = () => filterByCity(city, btn);
        filterContainer.appendChild(btn);
    });

    const allBtn = filterContainer.querySelector('[data-city="all"]');
    if(allBtn) allBtn.onclick = () => filterByCity('all', allBtn);

    // Пошук
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const filtered = allCinemasData.filter(c =>
                c.name.toLowerCase().includes(val) ||
                (c.address && c.address.toLowerCase().includes(val))
            );
            renderCinemaList(filtered);
        });
    }
}

function filterByCity(cityName, clickedBtn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');

    if (cityName === 'all') {
        renderCinemaList(allCinemasData);
    } else {
        const filtered = allCinemasData.filter(c => c.city && c.city.name === cityName);
        renderCinemaList(filtered);
    }

    const searchInput = document.getElementById('cinemaSearch');
    if(searchInput) searchInput.value = '';
}

initMap();




