const API_REGISTER_URL = "http://127.0.0.1:8001/api/auth/register/";

const BACKEND_ERROR_TRANSLATIONS = {
    "A user with that username already exists.": "Користувач з таким логіном вже існує",
    "This field may not be blank.": "Це поле не може бути порожнім",
    "Enter a valid email address.": "Введіть коректну електронну адресу",
    "This password is too short. It must contain at least 8 characters.":
        "Пароль має містити мінімум 8 символів",
};

function translateBackendError(text) {
    return BACKEND_ERROR_TRANSLATIONS[text] || text;
}

$(document).ready(function () {

    $("#registerForm .form-group").each(function () {
        if ($(this).find(".error-message").length === 0) {
            $(this).append('<div class="error-message">Заповніть це поле</div>');
        }
    });

    $("#registerForm input").on("input", function () {
        $(this).closest(".form-group").removeClass("error");
        $("#error-message").slideUp();
    });

    $("#registerForm").on("submit", function (e) {
        e.preventDefault();

        const $errorDiv = $("#error-message");
        const $submitBtn = $(this).find("button[type='submit']");

        let isValid = true;
        const inputs = $(this).find("input");

        inputs.each(function () {
            if (!$(this).val().trim()) {
                isValid = false;
                $(this).closest(".form-group").addClass("error");
            }
        });

        if (!isValid) return;

        $errorDiv.hide().text("");

        const username = $("#username").val();
        const email = $("#email").val();
        const password = $("#password").val();
        const passwordCheck = $("#password_check").val();

        if (password !== passwordCheck) {
            $errorDiv.text("Паролі не співпадають").slideDown();
            $("#password, #password_check").closest(".form-group").addClass("error");
            return;
        }

        if (password.length < 8) {
            $errorDiv.text("Пароль має містити мінімум 8 символів").slideDown();
            $("#password").closest(".form-group").addClass("error");
            return;
        }

        if (/^\d+$/.test(password)) {
            $errorDiv.text("Пароль не може складатися лише з цифр").slideDown();
            $("#password").closest(".form-group").addClass("error");
            return;
        }

        $submitBtn.prop("disabled", true);

        $.ajax({
            url: API_REGISTER_URL,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                username: username,
                email: email,
                password: password,
                password_check: passwordCheck
            }),
            success: function () {
                localStorage.setItem("registration_email", email);
                window.location.href = "/verify/";
            },
            error: function (xhr) {
                $submitBtn.prop("disabled", false);

                let message = "Сталася помилка при реєстрації";
                const data = xhr.responseJSON;

                if (data) {
                    // Кастомна помилка
                    if (data.message) {
                        message = data.message;
                    }
                    else if (data.username) {
                        message = "Користувач з таким логіном вже існує";
                    }
                    else if (data.email) {
                        message = "Користувач з таким email вже існує";
                    }
                    else if (data.password && Array.isArray(data.password)) {
                        message = translateBackendError(data.password[0]);
                    }
                    else if (data.detail) {
                        message = translateBackendError(data.detail);
                    }
                }

                $errorDiv.text(message).slideDown();
            }
        });
    });
});


