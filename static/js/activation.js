$(document).ready(function() {
    // Перевіряємо, чи передали нам дані
    if (typeof ACTIVATION_DATA === 'undefined') {
        console.error("Помилка: Дані активації не знайдені.");
        return;
    }

    const uid = ACTIVATION_DATA.uid;
    const token = ACTIVATION_DATA.token;
    const backendPort = ACTIVATION_DATA.backendPort;
    const homeUrl = ACTIVATION_DATA.homeUrl;

    // Формуємо URL до API
    const BACKEND_API_URL = `http://127.0.0.1:${backendPort}/api/auth/activation/${uid}/${token}/`;

    console.log("Стукаємо на:", BACKEND_API_URL);

    $.ajax({
        url: BACKEND_API_URL,
        method: "GET",
        success: function(data) {
            console.log("Успіх:", data);
            $("#status-text").text("Успішно! Входимо в систему...").css("color", "green");

            // Зберігаємо токени
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);

            if (data.username) {
                localStorage.setItem('username', data.username);
            }

            // Перенаправляємо на головну
            setTimeout(() => {
                window.location.href = homeUrl;
            }, 1000);
        },
        error: function(xhr) {
            console.error("Помилка:", xhr);
            $("#status-text").text("Помилка активації.").css("color", "red");

            // Виводимо деталі
            let msg = "Помилка запиту: " + xhr.status;
            if (xhr.status === 0) msg += " (Сервер недоступний або CORS)";
            if (xhr.status === 404) msg += " (Невірне посилання)";

            alert(msg);
        }
    });
});