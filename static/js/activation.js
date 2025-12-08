document.addEventListener("DOMContentLoaded", function() {

    const btn = document.getElementById("submitBtn");
    const errorDiv = document.getElementById("error-message");
    const codeInput = document.getElementById("code");

    // Отримуємо email з пам'яті браузера
    const userEmail = localStorage.getItem('registration_email');

    // Перевірка: чи є email
    if (!userEmail) {
        alert("Помилка: Немає email. Будь ласка, зареєструйтесь заново.");
        // Використовуємо URL з нашого об'єкта конфігурації
        window.location.href = VERIFY_CONFIG.registerUrl;
        return;
    }

    // Додаємо обробник кліку
    if (btn) {
        btn.addEventListener("click", sendVerification);
    } else {
        console.error("Помилка: Кнопка submitBtn не знайдена!");
    }

    // --- ФУНКЦІЯ ВІДПРАВКИ ---
    function sendVerification() {
        console.log("Кнопку натиснуто. Починаємо...");

        // 1. Очищення помилок
        errorDiv.style.display = "none";
        errorDiv.innerText = "";

        const code = codeInput.value;

        // 2. Валідація коду
        if (code.length < 6) {
            alert("Будь ласка, введіть 6 цифр коду.");
            return;
        }

        // 3. Блокуємо кнопку
        btn.disabled = true;
        btn.innerText = "Перевірка...";

        // 4. Відправка запиту
        fetch(VERIFY_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                code: code
            })
        })
        .then(async response => {
            const data = await response.json();

            if (response.ok) {
                // === УСПІХ ===
                console.log("Успіх:", data);

                // Зберігаємо токени
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                if (data.username) localStorage.setItem('username', data.username);

                // Видаляємо тимчасовий email
                localStorage.removeItem('registration_email');

                alert("Вітаємо! Акаунт активовано.");
                window.location.href = VERIFY_CONFIG.homeUrl;
            } else {
                // === ПОМИЛКА БЕКЕНДУ ===
                throw new Error(data.error || "Невірний код");
            }
        })
        .catch(error => {
            // === ПОМИЛКА МЕРЕЖІ АБО КОДУ ===
            console.error("Помилка:", error);
            errorDiv.innerText = error.message;
            errorDiv.style.display = "block";

            if (error.message.includes("Failed to fetch")) {
                alert("Помилка з'єднання! Перевірте бекенд (порт 8001) і CORS.");
            }
        })
        .finally(() => {
            // Розблокуємо кнопку
            btn.disabled = false;
            btn.innerText = "Підтвердити";
        });
    }
});