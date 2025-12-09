document.addEventListener("DOMContentLoaded", function() {

    const btn = document.getElementById("submitBtn");
    const resendBtn = document.getElementById("resendBtn"); // Кнопка повтору
    const errorDiv = document.getElementById("error-message");
    const codeInput = document.getElementById("code");
    const timerText = document.getElementById("timer");
    const timeLeftSpan = document.getElementById("timeLeft");

    const userEmail = localStorage.getItem('registration_email');

    if (!userEmail) {
        alert("Помилка: Немає email. Будь ласка, зареєструйтесь заново.");
        window.location.href = VERIFY_CONFIG.registerUrl;
        return;
    }

    if (btn) {
        btn.addEventListener("click", sendVerification);
    }

    if (resendBtn) {
        resendBtn.addEventListener("click", resendCode);
    }

    function sendVerification() {
        console.log("Кнопку натиснуто. Починаємо...");
        errorDiv.style.display = "none";
        errorDiv.innerText = "";
        const code = codeInput.value;

        if (code.length < 6) {
            alert("Будь ласка, введіть 6 цифр коду.");
            return;
        }

        btn.disabled = true;
        btn.innerText = "Перевірка...";

        fetch(VERIFY_CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, code: code })
        })
        .then(async response => {
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                if (data.username) localStorage.setItem('username', data.username);

                localStorage.removeItem('registration_email');
                localStorage.removeItem('draft_username');
                localStorage.removeItem('draft_email');

                alert("Вітаємо! Акаунт активовано.");
                window.location.href = VERIFY_CONFIG.homeUrl;
            } else {
                throw new Error(data.error || "Невірний код");
            }
        })
        .catch(error => {
            console.error("Помилка:", error);
            errorDiv.innerText = error.message;
            errorDiv.style.display = "block";
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerText = "Підтвердити";
        });
    }

    function resendCode() {
        resendBtn.disabled = true;
        resendBtn.innerText = "Відправка...";

        fetch(VERIFY_CONFIG.resendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        })
        .then(async response => {
            const data = await response.json();
            if (response.ok) {
                alert("Новий код надіслано на вашу пошту!");
                startTimer(60);
            } else {
                throw new Error(data.error || "Помилка відправки");
            }
        })
        .catch(error => {
            alert(error.message);
            resendBtn.disabled = false;
            resendBtn.innerText = "Надіслати код повторно";
        });
    }

    // --- ТАЙМЕР ---
    function startTimer(seconds) {
        resendBtn.style.display = "none";
        timerText.style.display = "block";

        let remaining = seconds;
        timeLeftSpan.innerText = remaining;

        const interval = setInterval(() => {
            remaining--;
            timeLeftSpan.innerText = remaining;

            if (remaining <= 0) {
                clearInterval(interval);
                timerText.style.display = "none";
                resendBtn.style.display = "inline-block";
                resendBtn.disabled = false;
                resendBtn.innerText = "Надіслати код повторно";
            }
        }, 1000);
    }
});