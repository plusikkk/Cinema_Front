const API_PROFILE_URL = "http://127.0.0.1:8001/api/auth/profile/";

document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem('access_token');

    // Перевірка авторизації
    if (!token) {
        window.location.href = "/login/";
        return;
    }

    const msgDiv = document.getElementById("profile-msg");

    function showMsg(text, color) {
        msgDiv.innerText = text;
        msgDiv.style.color = color;
        msgDiv.style.display = "block";
        setTimeout(() => { msgDiv.style.display = "none"; }, 5000);
    }

    // === 2. ЗАВАНТАЖЕННЯ ДАНИХ (GET) ===
    fetch(API_PROFILE_URL, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (response.status === 401) {
            logout();
        }
        return response.json();
    })
    .then(data => {
        console.log("Дані з сервера:", data);

        const firstName = data.first_name || "";
        const lastName = data.last_name || "";
        const username = data.username || "User";
        const fullName = `${firstName} ${lastName}`.trim();

        document.getElementById("card-fullname").innerText = fullName || username;
        document.getElementById("header-username").innerText = firstName || username;
        document.getElementById("card-email").innerText = data.email || "";

        document.getElementById("edit-username").value = username;
        document.getElementById("edit-email").value = data.email || "";
        document.getElementById("edit-first-name").value = firstName;
        document.getElementById("edit-last-name").value = lastName;

        if (data.profile) {
            document.getElementById("bonus-balance").innerText = data.profile.bonus_balance || 0;

            if (data.profile.birth_date) {
                document.getElementById("edit-dob").value = data.profile.birth_date;
            } else {
                document.getElementById("edit-dob").value = "";
            }

            if (data.profile.gender) {
                document.getElementById("edit-gender").value = data.profile.gender;
            } else {
                document.getElementById("edit-gender").value = "";
            }
        }
    })
    .catch(err => console.error("Error fetching profile:", err));


    // ПЕРЕМИКАННЯ ВКЛАДОК
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });


    // ЗБЕРЕЖЕННЯ ЗМІН
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {
        settingsForm.addEventListener("submit", function(e) {
            e.preventDefault();
            msgDiv.style.display = "none";

            const newEmail = document.getElementById("edit-email").value;
            const newFirstName = document.getElementById("edit-first-name").value;
            const newLastName = document.getElementById("edit-last-name").value;

            const newDob = document.getElementById("edit-dob").value;
            const newGender = document.getElementById("edit-gender").value;

            const newPass = document.getElementById("edit-password").value;
            const newPassCheck = document.getElementById("edit-password-check").value;

            let payload = {
                email: newEmail,
                first_name: newFirstName,
                last_name: newLastName,
                profile: {}
            };

            // Обробка Статі
            if (newGender && newGender !== "") {
                payload.profile.gender = newGender;
            } else {
                payload.profile.gender = null;
            }

            // Обробка Дати
            if (newDob) {
                payload.profile.birth_date = newDob;
            } else {
                payload.profile.birth_date = null;
            }

            // Обробка паролів
            if (newPass) {
                if (newPass !== newPassCheck) {
                    showMsg("Паролі не співпадають!", "#ff4d4d");
                    return;
                }
                payload.password = newPass;
            }

            console.log("Відправка на сервер:", payload); // Для перевірки в консолі

            // Відправка
            fetch(API_PROFILE_URL, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            })
            .then(async response => {
                const data = await response.json();

                if (response.ok) {
                    showMsg("Профіль успішно оновлено!", "#00ff88");

                    // Оновлення інтерфейсу
                    document.getElementById("card-email").innerText = newEmail;

                    const newFullName = `${newFirstName} ${newLastName}`.trim();
                    const currentUsername = document.getElementById("edit-username").value;
                    document.getElementById("card-fullname").innerText = newFullName || currentUsername;
                    document.getElementById("header-username").innerText = newFirstName || currentUsername;

                    document.getElementById("edit-password").value = "";
                    document.getElementById("edit-password-check").value = "";
                } else {
                    console.error("SERVER ERROR:", data); // помилка сервера

                    let errorText = "Помилка оновлення даних";

                    // Помилки
                    if (data.email) errorText = `Email: ${data.email[0]}`;

                    if (data.profile) {
                        if (data.profile.birth_date) errorText = `Дата: ${data.profile.birth_date[0]}`;
                        if (data.profile.gender) errorText = `Стать: ${data.profile.gender[0]}`;
                    }

                    showMsg(errorText, "#ff4d4d");
                }
            })
            .catch(err => {
                console.error(err);
                showMsg("Помилка з'єднання: перевірте, чи запущено сервер на порту 8001", "#ff4d4d");
            });
        });
    }

    // ЛОГАУТ підпитанням чи залишиться кнопка, бо їх дві виходить
    const logoutBtn = document.getElementById('logout-btn-sidebar');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    function logout() {
        if(confirm("Ви дійсно бажаєте вийти?")) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');
            window.location.href = "/";
        }
    }
});



