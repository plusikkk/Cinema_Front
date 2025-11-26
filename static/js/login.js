// Константи для URL (якщо ви на одному домені, можна використовувати відносні шляхи)
const API_TOKEN_URL = "/api/token/";

// Функція для збереження токенів
function saveTokens(data) {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // Якщо хочеш зберегти ім'я користувача для відображення в шапці
    if (data.username) {
        localStorage.setItem('username', data.username);
    }
}

// Функція для перенаправлення
function redirectAfterLogin() {
    // Перенаправляємо на головну сторінку
    window.location.href = "{% url 'main_page' %}";
}

$(document).ready(function() {
    $("#loginForm").on("submit", function(e) {
        e.preventDefault();

        // Очищаємо попередні помилки, якщо були
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
                // Успішний логін
                console.log("Login success");

                // Зберігаємо токен. Додаємо username в об'єкт, бо бекенд може не повертати його в токені
                saveTokens({ ...data, username: username });

                redirectAfterLogin();
            },
            error: function(xhr) {
                // Обробка помилки
                console.error("Login error", xhr);

                let message = "Невірний логін або пароль";

                // Якщо сервер повернув конкретну помилку, показуємо її
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    message = xhr.responseJSON.detail;
                }

                alert(message);
                // Або можна виводити в дів:
                // $("#error-message").text(message).show();
            }
        });
    });
});