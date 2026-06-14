const API_PROFILE_URL = "http://127.0.0.1:8001/api/auth/userprofile/";
const API_TICKETS_URL = "http://127.0.0.1:8001/api/auth/tickets/"; // НОВИЙ URL для квитків

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

    function showCustomModalMessage(title, text, type) {
        const modalOverlay = document.getElementById('message-modal');
        const iconDiv = document.getElementById('msg-modal-icon');
        const titleH3 = document.getElementById('msg-modal-title');
        const textP = document.getElementById('msg-modal-text');

        titleH3.innerText = title;
        textP.innerText = text;
        iconDiv.className = 'modal-icon';

        let icon = iconDiv.querySelector('i');
        if (!icon) {
            icon = document.createElement('i');
            iconDiv.appendChild(icon);
        }

        if (type === 'success') {
            iconDiv.classList.add('success-icon');
            icon.className = 'fa-solid fa-check-circle';
        } else if (type === 'error') {
            iconDiv.classList.add('error-icon');
            icon.className = 'fa-solid fa-circle-exclamation';
        } else {
            icon.className = 'fa-solid fa-info-circle';
        }

        modalOverlay.classList.add('active');
    }

    const btnCloseMsgModal = document.getElementById('btn-close-msg-modal');
    if (btnCloseMsgModal) {
        btnCloseMsgModal.addEventListener('click', () => {
            const modalOverlay = document.getElementById('message-modal');
            modalOverlay.classList.remove('active');

            if (document.getElementById('msg-modal-title').innerText === 'Акаунт видалено') {
                window.location.href = "/";
            }
        });
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


    // КАЛЕНДАР
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

            if (targetId === 'settings') {
                const icon = tab.querySelector('i');
                if (icon) {
                    icon.classList.remove('icon-spin');
                    void icon.offsetWidth;
                    icon.classList.add('icon-spin');
                }
            } else if (targetId === 'tickets') {
                 loadUserTickets(); // Завантаження квитків при активації таба
            }
        });
    });


    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {

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

            // ПЕРЕВІРКА ПАРОЛЮ
            if (newPass) {
                if (newPass !== newPassCheck) {
                    showMsg("Паролі не співпадають!", "#ff4d4d");
                    return;
                }

                if (newPass.length < 8) {
                    showMsg("Пароль має містити мінімум 8 символів!", "#ff4d4d");
                    return;
                }

                if (/^\d+$/.test(newPass)) {
                     showMsg("Пароль не може складатися лише з цифр!", "#ff4d4d");
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

                    if (data.email) {
                        errorText = `Email: ${data.email[0]}`;
                    }
                    else if (data.password) {
                        errorText = `Пароль: ${data.password[0]}`;
                    }
                    else if (data.detail) {
                        errorText = data.detail;
                    }

                    showMsg(errorText, "#ff4d4d");
                }
            })
            .catch(() => showMsg("Помилка з'єднання з сервером", "#ff4d4d"));
        });
    }


    // ВІКНО ВИХОДУ
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

    // ВІКНО ВИДАЛЕННЯ ПРОФІЛЮ
    const deleteBtn = document.getElementById('delete-profile-btn');
    const deleteModalOverlay = document.getElementById('delete-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    function openDeleteModal() { deleteModalOverlay.classList.add('active'); }
    function closeDeleteModal() { deleteModalOverlay.classList.remove('active'); }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openDeleteModal();
        });
    }

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

    if (deleteModalOverlay) {
        deleteModalOverlay.addEventListener('click', (e) => {
            if (e.target === deleteModalOverlay) closeDeleteModal();
        });
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            fetch(API_PROFILE_URL, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(async response => {
                if (response.status === 204) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('username');

                    closeDeleteModal();
                    showCustomModalMessage(
                        "Акаунт видалено",
                        "Ваш акаунт та всі пов'язані дані успішно видалені. Дякуємо, що були з нами.",
                        "success"
                    );

                } else if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    window.location.href = "/";
                } else {
                    const data = await response.json();
                    showMsg(`Помилка видалення: ${data.error || 'Невідома помилка'}`, "#ff4d4d");
                    closeDeleteModal();
                }
            })
            .catch(() => {
                showMsg("Помилка з'єднання з сервером", "#ff4d4d");
                closeDeleteModal();
            });
        });
    }

    // =========================================================================
    // ФУНКЦІЯ ЗАВАНТАЖЕННЯ ТА ВІДОБРАЖЕННЯ КВИТКІВ
    // =========================================================================

    function loadUserTickets() {
        const ticketsContainer = document.getElementById('tickets-list-container');
        const emptyState = document.getElementById('empty-tickets-state');
        ticketsContainer.innerHTML = ''; // Очистити перед завантаженням, щоб уникнути дублювання

        fetch(API_TICKETS_URL, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        })
        .then(response => {
            if (response.status === 401) {
                // Якщо токен недійсний, перенаправляємо
                localStorage.removeItem('access_token');
                window.location.href = "/";
                return [];
            }
            return response.json();
        })
        .then(tickets => {
            if (tickets.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }
            if (emptyState) emptyState.style.display = 'none';

            tickets.forEach(ticket => {
                const isCancelled = ticket.is_cancelled;
                const statusClass = isCancelled ? 'ticket-cancelled' :
                                  (ticket.order_status === 'Paid' ? 'status-paid' : 'status-refunded');

                const ticketDate = new Date(ticket.start_time);
                const time = ticketDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                // Формат дати: 15 груд
                const date = ticketDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }).replace('.', '');

                // Визначення назви статусу
                let statusText = ticket.order_status;
                if (isCancelled) {
                    statusText = 'Скасовано';
                } else if (ticket.order_status === 'Paid') {
                    statusText = 'Оплачено';
                } else if (ticket.order_status === 'Refunded') {
                    statusText = 'Повернено';
                }


                const cardHtml = `
                    <div class="ticket-card">
                        <div class="ticket-info">
                            <div class="ticket-movie">${ticket.movie_title}</div>
                            <div class="ticket-details">
                                <p><i class="fa-solid fa-location-dot"></i> ${ticket.cinema_name}, ${ticket.hall_name}</p>
                                <p><i class="fa-solid fa-chair"></i> ${ticket.seat_display} | ${ticket.price} грн</p>
                            </div>
                        </div>
                        <div class="ticket-date">
                            <span class="ticket-time">${time}</span>
                            <span class="ticket-day">${date}</span>
                            <span class="ticket-status ${statusClass}">
                                ${statusText}
                            </span>
                        </div>
                    </div>
                `;
                ticketsContainer.insertAdjacentHTML('beforeend', cardHtml);
            });
        })
        .catch(err => {
            console.error("Помилка завантаження квитків:", err);
            if (emptyState) emptyState.style.display = 'block';
        });
    }

    // Завантаження квитків при початковому завантаженні сторінки (якщо таб 'tickets' активний)
    if (document.querySelector('.tab-link.active').getAttribute('data-tab') === 'tickets') {
         loadUserTickets();
    }
});