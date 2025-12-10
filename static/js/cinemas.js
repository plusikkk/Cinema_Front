let map;
let allCinemasData = [];

const UKRAINE_BOUNDS = {
    north: 52.4, south: 44.3, west: 22.1, east: 40.2,
};

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { Marker } = await google.maps.importLibrary("marker");

    const kyivPosition = { lat: 50.4501, lng: 30.5234 };

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
        console.log("Дані з бази:", cinemas);

        if (cinemas && cinemas.length > 0) {
            allCinemasData = cinemas;

            renderMarkers(cinemas, MarkerClass);
            renderCinemaList(cinemas);
            setupFilters();
        } else {
            console.warn("Список порожній.");
            document.getElementById('cinemas-list-container').innerHTML = '<div class="no-results">Кінотеатрів поки немає.</div>';
        }
    } catch (error) {
        console.error("Помилка API:", error);
    }
}

function renderMarkers(cinemas, MarkerClass) {
    cinemas.forEach(cinema => {
        if (cinema.latitude && cinema.longitude) {
            const position = {
                lat: Number(cinema.latitude),
                lng: Number(cinema.longitude)
            };

            const marker = new MarkerClass({
                map: map,
                position: position,
                title: cinema.name,
                animation: google.maps.Animation.DROP,
            });

            marker.addListener("click", () => {
                highlightCinema(cinema.id);
                map.panTo(position);
                map.setZoom(14);
            });
        }
    });
}

// ВІДОБРАЖЕННЯ КАРТОК
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

        let cityBadgeHTML = '';
        if (cinema.city && cinema.city.name) {
            cityBadgeHTML = `<span class="city-badge">${cinema.city.name}</span>`;
        }

        let badgesHTML = '';
        if (Array.isArray(cinema.badges) && cinema.badges.length > 0) {
            badgesHTML = cinema.badges.map(badge =>
                `<span class="badge-item">${badge.name}</span>`
            ).join('');
        }

        const cardHTML = `
            <div class="cinema-card" id="cinema-card-${cinema.id}">
                <div class="card-image">
                    <a href="/cinema/${cinema.id}/" style="display:block; width:100%; height:100%;">
                        <img src="${imgSrc}" alt="${cinema.name}" 
                             onerror="this.src='/static/img/cinema-placeholder.jpg';">
                    </a>
                </div>
                
                <div class="card-content">
                    <div class="card-header-group">
                        <h3>
                            <a href="/cinema/${cinema.id}/" style="color: inherit; text-decoration: none;">
                                ${cinema.name}
                            </a>
                            ${cityBadgeHTML}
                        </h3>
                        <p class="card-address"><i class="fas fa-map-marker-alt"></i> ${cinema.address || 'Адреса уточнюється'}</p>
                    </div>
                    
                    <a href="/cinema/${cinema.id}/" class="btn-details">
                        <i class="far fa-calendar-alt" style="margin-right:8px;"></i> Детальніше про кінотеатр
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
    const suggestionsBox = document.getElementById('searchSuggestions');
    const dropdownBtn = document.getElementById('cityDropdownBtn');
    const dropdownList = document.getElementById('cityDropdownList');

    document.addEventListener('click', (e) => {

        if (dropdownList && !dropdownBtn.contains(e.target) && !dropdownList.contains(e.target)) {
            dropdownList.classList.remove('active');
            dropdownBtn.classList.remove('active');
        }

        if (suggestionsBox && !searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.remove('active');
        }
    });

    if (dropdownBtn && dropdownList) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownList.classList.toggle('active');
            dropdownBtn.classList.toggle('active');
        });

        const citiesSet = new Set();
        allCinemasData.forEach(c => {
            if (c.city && c.city.name) citiesSet.add(c.city.name);
        });

        const sortedCities = Array.from(citiesSet).sort((a, b) => a.localeCompare(b, 'uk'));
        dropdownList.innerHTML = '';

        const allOption = document.createElement('div');
        allOption.className = 'city-option selected';
        allOption.textContent = 'Всі міста';
        allOption.onclick = () => selectCity('all', 'Всі міста', allOption);
        dropdownList.appendChild(allOption);

        sortedCities.forEach(city => {
            const item = document.createElement('div');
            item.className = 'city-option';
            item.textContent = city;
            item.onclick = () => selectCity(city, city, item);
            dropdownList.appendChild(item);
        });
    }

    if(searchInput && suggestionsBox) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();

            const filtered = allCinemasData.filter(c =>
                c.name.toLowerCase().includes(val) ||
                (c.address && c.address.toLowerCase().includes(val))
            );
            renderCinemaList(filtered);

            if (val.length > 0) {
                renderSuggestions(filtered, suggestionsBox, searchInput);
            } else {
                suggestionsBox.classList.remove('active');
            }
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length > 0) {
                suggestionsBox.classList.add('active');
            }
        });
    }
}

function renderSuggestions(cinemas, container, inputField) {
    container.innerHTML = '';

    if (cinemas.length === 0) {
        container.classList.remove('active');
        return;
    }

    const limitedCinemas = cinemas.slice(0, 5);

    limitedCinemas.forEach(cinema => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <span class="suggestion-name">${cinema.name}</span>
            <span class="suggestion-city">${cinema.city ? cinema.city.name : ''}</span>
        `;

        item.onclick = () => {
            inputField.value = cinema.name;
            container.classList.remove('active');
            renderCinemaList([cinema]);
            highlightCinema(cinema.id);

            if (map && cinema.latitude && cinema.longitude) {
                map.panTo({ lat: Number(cinema.latitude), lng: Number(cinema.longitude) });
                map.setZoom(15);
            }
        };

        container.appendChild(item);
    });

    container.classList.add('active');
}

function selectCity(cityName, displayName, clickedItem) {
    const currentCityText = document.getElementById('currentCityText');
    if (currentCityText) currentCityText.textContent = displayName;

    document.querySelectorAll('.city-option').forEach(el => el.classList.remove('selected'));
    clickedItem.classList.add('selected');

    if (cityName === 'all') {
        renderCinemaList(allCinemasData);
    } else {
        const filtered = allCinemasData.filter(c => c.city && c.city.name === cityName);
        renderCinemaList(filtered);
    }

    const searchInput = document.getElementById('cinemaSearch');
    if(searchInput) searchInput.value = '';

    document.getElementById('cityDropdownList').classList.remove('active');
    document.getElementById('cityDropdownBtn').classList.remove('active');
}

function highlightCinema(cinemaId) {
    const card = document.getElementById(`cinema-card-${cinemaId}`);
    if(card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.borderColor = "#ff3c8e";
        setTimeout(() => card.style.borderColor = "rgba(255, 255, 255, 0.08)", 2000);
    }
}

initMap();



