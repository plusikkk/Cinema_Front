const API_REGISTER_URL = "http://127.0.0.1:8001/api/auth/register/";

$(document).ready(function() {
    $("#registerForm").on("submit", function(e) {
        e.preventDefault();

        const $errorDiv = $("#error-message");
        const $submitBtn = $(this).find("button[type='submit']");

        $errorDiv.hide().text("");

        const username = $("#username").val();
        const email = $("#email").val();
        const password = $("#password").val();
        const passwordCheck = $("#password_check").val();

        if (password !== passwordCheck) {
            $errorDiv.text("Паролі не співпадають!").show();
            return;
        }

        $submitBtn.prop("disabled", true).text("Обробка...");

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
            success: function(response) {
                console.log("Registration success", response);

                alert("Реєстрація успішна! Ми надіслали лист для активації на вашу пошту.");

                window.location.href = "/login/";
            },
            error: function(xhr) {
                console.error("Registration error", xhr);
                $submitBtn.prop("disabled", false).text("Зареєструватися");

                let message = "Сталася помилка при реєстрації.";

                if (xhr.responseJSON) {
                    if (xhr.responseJSON.detail) {
                        message = xhr.responseJSON.detail;
                    } else {
                        let errors = [];
                        for (let field in xhr.responseJSON) {
                            let errorText = xhr.responseJSON[field][0];
                            errors.push(`${field}: ${errorText}`);
                        }
                        if (errors.length > 0) {
                            message = errors.join("\n");
                        }
                    }
                }

                $errorDiv.text(message).show();
            }
        });
    });
});