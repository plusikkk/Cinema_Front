const API_PROFILE_URL = "http://127.0.0.1:8001/api/auth/userprofile/";

document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem('access_token');

    if (!token) {
        window.location.href = "/login/";
        return;
    }

    const msgDiv = document.getElementById("profile-msg");

    function showMsg(text, color) {
        msgDiv.innerText = text;
        msgDiv.style.color = color;
        msgDiv.style.display = "block";
        if(color === "#ff4d4d") msgDiv.style.background = "rgba(255, 77, 77, 0.1)";
        else msgDiv.style.background = "rgba(0, 255, 136, 0.1)";

        setTimeout(() => { msgDiv.style.display = "none"; }, 5000);
    }

    function initCustomSelect() {
        const customSelectWrapper = document.querySelector(".custom-select-container");
        if (!customSelectWrapper) return;

        const originalSelect = customSelectWrapper.querySelector("select");
        if (customSelectWrapper.querySelector(".select-selected")) return;

        const selectedDiv = document.createElement("DIV");
        selectedDiv.setAttribute("class", "select-selected");
        selectedDiv.innerHTML = originalSelect.options[originalSelect.selectedIndex].innerHTML;
        customSelectWrapper.appendChild(selectedDiv);

        const optionsDiv = document.createElement("DIV");
        optionsDiv.setAttribute("class", "select-items select-hide");

        for (let i = 0; i < originalSelect.length; i++) {
            const optionDiv = document.createElement("DIV");
            optionDiv.innerHTML = originalSelect.options[i].innerHTML;

            if (originalSelect.options[i].selected) {
                optionDiv.setAttribute("class", "same-as-selected");
            }

            optionDiv.addEventListener("click", function(e) {
                originalSelect.selectedIndex = i;
                originalSelect.dispatchEvent(new Event('change'));
                selectedDiv.innerHTML = this.innerHTML;

                const sameAsSelected = optionsDiv.querySelectorAll(".same-as-selected");
                sameAsSelected.forEach(el => el.classList.remove("same-as-selected"));
                this.setAttribute("class", "same-as-selected");
                selectedDiv.click();
            });
            optionsDiv.appendChild(optionDiv);
        }
        customSelectWrapper.appendChild(optionsDiv);

        selectedDiv.addEventListener("click", function(e) {
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }

    function closeAllSelect(elmnt) {
        const items = document.getElementsByClassName("select-items");
        const selected = document.getElementsByClassName("select-selected");
        const arrNo = [];
        for (let i = 0; i < selected.length; i++) {
            if (elmnt == selected[i]) arrNo.push(i);
            else selected[i].classList.remove("select-arrow-active");
        }
        for (let i = 0; i < items.length; i++) {
            if (arrNo.indexOf(i)) items[i].classList.add("select-hide");
        }
    }
    document.addEventListener("click", closeAllSelect);
    initCustomSelect();


    const dateInput = document.getElementById("edit-dob");
    if (dateInput) {
        flatpickr(dateInput, {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d.m.Y",
            locale: "uk",
            disableMobile: "true",
            animate: true
        });
    }


    // ЗАВАНТАЖЕННЯ ДАНИХ
    fetch(API_PROFILE_URL, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
    })
    .then(response => {
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = "/";
        }
        return response.json();
    })
    .then(data => {
        const firstName = data.first_name || "";
        const lastName = data.last_name || "";
        const username = data.username || "User";

        document.getElementById("sidebar-username").innerText = username;
        document.getElementById("sidebar-email").innerText = data.email || "";
        document.getElementById("header-username").innerText = username;

        document.getElementById("edit-username").value = username;
        document.getElementById("edit-email").value = data.email || "";
        document.getElementById("edit-first-name").value = firstName;
        document.getElementById("edit-last-name").value = lastName;

        if (data.profile) {
            document.getElementById("bonus-balance").innerText = data.profile.bonus_balance || 0;

            if (data.profile.birth_date && dateInput && dateInput._flatpickr) {
                dateInput._flatpickr.setDate(data.profile.birth_date);
            }

            if (data.profile.gender) {
                const genderSelect = document.getElementById("edit-gender");
                genderSelect.value = data.profile.gender;

                const customDisplay = document.querySelector(".select-selected");
                if (customDisplay) {
                     customDisplay.innerHTML = genderSelect.options[genderSelect.selectedIndex].innerText;
                     const items = document.querySelectorAll(".select-items div");
                     items.forEach((div) => {
                         if (div.innerText === customDisplay.innerHTML) div.classList.add("same-as-selected");
                         else div.classList.remove("same-as-selected");
                     });
                }
            }
        }
    })
    .catch(err => console.error(err));


    // ТАБИ + АНІМАЦІЯ ШЕСТЕРНІ
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-body');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');

            // АНІМАЦІЯ
            if (targetId === 'settings') {
                const icon = tab.querySelector('i');
                if (icon) {
                    icon.classList.remove('icon-spin');
                    void icon.offsetWidth;
                    icon.classList.add('icon-spin');
                }
            }
        });
    });


    // ЗБЕРЕЖЕННЯ
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {

        // Додавання блоків для помилок
        const inputs = settingsForm.querySelectorAll("input[required], select[required]");
        inputs.forEach(input => {
            const wrapper = input.closest(".input-wrapper");
            if(wrapper) {
                if (!wrapper.querySelector(".error-message")) {
                    const msg = document.createElement("div");
                    msg.className = "error-message";
                    msg.innerText = "Заповніть це поле";
                    wrapper.appendChild(msg);
                }
                input.addEventListener("input", () => wrapper.classList.remove("error"));
            }
        });

        settingsForm.addEventListener("submit", function(e) {
            e.preventDefault();
            msgDiv.style.display = "none";

            let isValid = true;
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    const wrapper = input.closest(".input-wrapper");
                    wrapper.classList.add("error");
                    isValid = false;
                }
            });

            if (!isValid) return;

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

            payload.profile.gender = (newGender && newGender !== "") ? newGender : null;
            payload.profile.birth_date = (newDob) ? newDob : null;

            if (newPass) {
                if (newPass !== newPassCheck) {
                    showMsg("Паролі не співпадають!", "#ff4d4d");
                    return;
                }
                payload.password = newPass;
            }

            fetch(API_PROFILE_URL, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(async response => {
                const data = await response.json();
                if (response.ok) {
                    showMsg("Зміни успішно збережено!", "#00ff88");
                    document.getElementById("sidebar-email").innerText = newEmail;
                    document.getElementById("edit-password").value = "";
                    document.getElementById("edit-password-check").value = "";
                } else {
                    let errorText = "Помилка оновлення";
                    if (data.email) errorText = `Email: ${data.email[0]}`;
                    showMsg(errorText, "#ff4d4d");
                }
            })
            .catch(() => showMsg("Помилка з'єднання з сервером", "#ff4d4d"));
        });
    }


    // МОДАЛЬНЕ ВІКНО
    const logoutBtnSidebar = document.getElementById('logout-btn-sidebar');
    const modalOverlay = document.getElementById('logout-modal');
    const btnCancel = document.getElementById('btn-cancel-logout');
    const btnConfirm = document.getElementById('btn-confirm-logout');

    function openModal() { modalOverlay.classList.add('active'); }
    function closeModal() { modalOverlay.classList.remove('active'); }

    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');
            window.location.href = "/";
        });
    }
});


