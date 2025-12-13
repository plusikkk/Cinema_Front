const API_TOKEN_URL = "http://127.0.0.1:8001/api/token/";

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

    $("#loginForm .form-group").each(function() {
        if ($(this).find(".error-message").length === 0) {
            $(this).append('<div class="error-message">Заповніть це поле</div>');
        }
    });

    $("#loginForm input").on("input", function() {
        $(this).closest(".form-group").removeClass("error");
        $("#error-message").slideUp();
    });

    $("#loginForm").on("submit", function(e) {
        e.preventDefault();

        const $errorDiv = $("#error-message");
        const $btn = $(this).find("button[type='submit']");

        let isValid = true;
        const inputs = $(this).find("input");

        inputs.each(function() {
            if (!$(this).val().trim()) {
                isValid = false;
                $(this).closest(".form-group").addClass("error");
            }
        });

        if (!isValid) return;

        $errorDiv.hide().text("");

        const username = $("#username").val();
        const password = $("#password").val();

        $btn.prop("disabled", true);

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

                $btn.prop("disabled", false);

                let message = "Невірний логін або пароль";

                if (xhr.status === 401) {
                    message = "Невірний логін або пароль";
                }
                else if (xhr.responseJSON && xhr.responseJSON.detail) {
                    if (xhr.responseJSON.detail === "No active account found with the given credentials") {
                        message = "Невірний логін або пароль";
                    } else {
                        message = xhr.responseJSON.detail;
                    }
                }
                else if (xhr.status === 0) {
                    message = "Помилка з'єднання з сервером.";
                }

                $errorDiv.text(message).slideDown();
            }
        });
    });
});




