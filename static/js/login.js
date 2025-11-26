const API_TOKEN_URL = "http://127.0.0.1:8001/api/token/";

// Функція для збереження токенів
function saveTokens(data) {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    if (data.username) {
        localStorage.setItem('username', data.username);
    }
}

function redirectAfterLogin() {
    if (typeof MAIN_PAGE_URL !== 'undefined') {
        window.location.href = MAIN_PAGE_URL;
    } else {
        window.location.href = "/";
    }
}

$(document).ready(function() {
    $("#loginForm").on("submit", function(e) {
        e.preventDefault();

        $("#error-message").hide().text("");

        const username = $("#username").val();
        const password = $("#password").val();

        $.ajax({
            url: API_TOKEN_URL,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: function(data) {
                console.log("Login success");
                saveTokens({ ...data, username: username });
                redirectAfterLogin();
            },
            error: function(xhr) {
                console.error("Login error", xhr);
                let message = "Невірний логін або пароль";

                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    message = xhr.responseJSON.detail;
                } else if (xhr.status === 0) {
                    message = "Помилка з'єднання з сервером. Перевірте, чи запущено бекенд на порту 8001 та налаштування CORS.";
                }

                alert(message);
            }
        });
    });
});




