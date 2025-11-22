function getBadgesHTML(badges) {
    if (!badges || badges.length === 0) return '';

    // Контейнер
    let html = '<div class="badges-container" style="position: absolute; top: 10px; left: 10px; z-index: 20; display: flex; gap: 6px; flex-wrap: wrap; pointer-events: none; transition: opacity 0.3s;">';

    badges.forEach(badge => {
        html += `
            <div class="quality-badge" style="
                position: static; 
                background-color: rgba(0, 0, 0, 0.85); 
                border: 1px solid rgba(255, 255, 255, 0.3); 
                color: #fff; 
                padding: 4px 8px; 
                border-radius: 6px; 
                font-size: 0.7rem; 
                font-weight: 700; 
                text-transform: uppercase; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            ">
                ${badge.name}
            </div>`;
    });

    html += '</div>';

    return html;
}


function getPosterHTML(posterUrl, title) {
    if (posterUrl) {
        return `<img src="${posterUrl}" alt="${title}">`;
    } else {
        return `
        <div class="no-poster-placeholder">
            <div class="np-content">
                <span class="np-logo">Multi<span class="np-pink">Flex</span></span>
                <div class="np-divider"></div>
                <span class="np-text">Скоро з’явиться...</span>
            </div>
        </div>
        `;
    }
}


